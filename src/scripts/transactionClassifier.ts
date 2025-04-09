import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { TOTPService } from '../modules/authenticator/totp-service';
import { DetectionRequest, TransactionTrace, DetectionResult } from '../modules/detection-module/dtos';

// Import main detection service and response types
import { DetectionService, DetectionResponse, TransactionRiskLevel } from '../modules/detection-module/service';

// Configure API key and addresses
const ETHERSCAN_API_KEY = 'CESRMKGY76WTDJ8JZABBMW5CIFPS9YQZQ2'; // Replace with your actual key if needed
const WATCHED_ADDRESSES = [
  '0xFd15c3932A783e324B1a63a174014cD105dbdeA8', // Gnosis Safe: Curve
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router  
  '0x1f2F10D1C40777AE1Da742455c65828FF36Df387', // JaredFromSubway MVT bot
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT 
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
  '0xf16E9B0D03470827A95CDfd0Cb8a8A3b46969B91', // Rocketpool ETH
  '0xBe8E3e3618f7474F8cB1d074A26afFef007E98FB', // Tornado Cash
  '0xDef1C0ded9bec7F1a1670819833240f027b25EfF'  // 0x Exchange
];

// User types from our 2FA setup
enum UserType {
  REGULAR = 'REGULAR',
  WHALE = 'WHALE',
  DEFI = 'DEFI',
  MULTI_STEP = 'MULTI_STEP'
}

// Transaction classification result
interface ClassificationResult {
  transaction: EtherscanTransaction;
  requires2FA: boolean;
  riskFactors: string[];
  userType: UserType;
  riskScore: number;
  detectionServiceResult?: DetectionResult;
  timestamp: number;
}

// Etherscan transaction interface
interface EtherscanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  input: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  functionName?: string;
}

// Risk thresholds in ETH
const RISK_THRESHOLDS = {
  MINIMUM_VALUE: 0.0001, // Minimum value to consider for 2FA (in ETH)
  LOW: 0.1,    // 0.1 ETH
  MEDIUM: 1,   // 1 ETH
  HIGH: 5,     // 5 ETH
  WHALE: 10    // 10 ETH
};

// Adjustable risk score threshold for requiring 2FA
const RISK_SCORE_THRESHOLD = 20; // Lowered from 25 to balance security vs convenience

// High-risk function signatures (examples)
const HIGH_RISK_FUNCTIONS = [
  '0xf2fde38b', // transferOwnership
  '0x23b872dd', // transferFrom
  '0x42842e0e', // safeTransferFrom
  '0x095ea7b3', // approve
];

// Store transaction history to detect unusual patterns
const transactionHistory = new Map<string, { timestamps: number[], values: string[] }>();

// TOTP states for different user types
interface TOTPState {
  secret: string;
  verificationCodes: string[];
  setupComplete: boolean;
  lastGeneratedCode: string;
  userType: UserType;
  lastVerification: Date | null;
}

// Store TOTP states per user address
const userTOTPStates = new Map<string, TOTPState>();

/**
 * Fetches latest transactions for a given address from Etherscan
 */
async function getLatestTransactions(walletAddress: string): Promise<EtherscanTransaction[]> {
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await axios.get(url);

    if (response.data.status !== '1') {
      console.error('Error fetching transactions:', response.data.message);
      return [];
    }

    return response.data.result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Converts Etherscan transaction to our detection module format
 */
function convertToDetectionRequest(tx: EtherscanTransaction): DetectionRequest {
  const trace: TransactionTrace = {
    from: tx.from,
    to: tx.to || '0x0', // Handle contract deployments
    value: tx.value,
    input: tx.input,
    gas: '0', // Not directly available from Etherscan API
    gasUsed: tx.gasUsed || '0',
    // Initialize pre and post objects as required by TransactionTrace
    pre: {},
    post: {}
  };

  return {
    chainId: 1, // Mainnet
    hash: tx.hash,
    trace,
    from: tx.from, // Using the from field directly from the transaction
    additionalData: {
      timestamp: Number(tx.timeStamp) * 1000
    }
  };
}

/**
 * Detects unusual transaction frequency pattern
 */
function detectUnusualFrequency(address: string, timestamp: number): boolean {
  if (!transactionHistory.has(address)) {
    return false;
  }
  
  const history = transactionHistory.get(address)!;
  
  // If we have at least 3 transactions, check time patterns
  if (history.timestamps.length >= 3) {
    // Get the last 3 timestamps
    const recentTimestamps = history.timestamps.slice(-3);
    
    // Check if all 3 transactions happened within 10 minutes (600,000 ms)
    const timeRange = Math.max(...recentTimestamps) - Math.min(...recentTimestamps);
    if (timeRange < 600000 && recentTimestamps.length >= 3) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets or creates a TOTP state for a user
 */
function getUserTOTPState(userAddress: string, userType: UserType = UserType.REGULAR): TOTPState {
  const lowerAddress = userAddress.toLowerCase();
  
  if (!userTOTPStates.has(lowerAddress)) {
    // Create a new TOTP state for this user
    const secret = TOTPService.generateSecret();
    const code = TOTPService.generateTOTP(secret);
    
    userTOTPStates.set(lowerAddress, {
      secret,
      verificationCodes: [code],
      setupComplete: true, // Assuming setup is complete for demo purposes
      lastGeneratedCode: code,
      userType,
      lastVerification: null
    });
  }
  
  return userTOTPStates.get(lowerAddress)!;
}

/**
 * Verifies a TOTP code for a transaction
 */
function verifyTransactionTOTP(userAddress: string, totpCode: string, transaction: EtherscanTransaction): boolean {
  const userState = getUserTOTPState(userAddress);
  const isValid = TOTPService.validateTOTP(totpCode, userState.secret);
  
  if (isValid) {
    userState.lastVerification = new Date();
    // Save the transaction hash as verified
    console.log(`Transaction ${transaction.hash} verified with TOTP code ${totpCode}`);
  }
  
  return isValid;
}

/**
 * Classifies transaction risk based on various factors
 */
function classifyTransaction(tx: EtherscanTransaction, detectionService?: DetectionService): ClassificationResult {
  const valueInEth = parseInt(tx.value) / 1e18;
  const riskFactors: string[] = [];
  let riskScore = 0;
  let userType = UserType.REGULAR;
  let requires2FA = false;
  let detectionServiceResult: DetectionResult | undefined;
  
  // Update transaction history for this address
  const timestamp = parseInt(tx.timeStamp) * 1000;
  if (!transactionHistory.has(tx.from)) {
    transactionHistory.set(tx.from, { timestamps: [timestamp], values: [tx.value] });
  } else {
    const history = transactionHistory.get(tx.from)!;
    history.timestamps.push(timestamp);
    history.values.push(tx.value);
    
    // Keep only the last 10 transactions
    if (history.timestamps.length > 10) {
      history.timestamps.shift();
      history.values.shift();
    }
  }
  
  // Use main detection service if available
  if (detectionService) {
    try {
      const detectionRequest = convertToDetectionRequest(tx);
      // Call the static detect method which returns DetectionResponse
      const detectionResponse = DetectionService.detect(detectionRequest);
      
      if (detectionResponse.detected) {
        // Convert DetectionResponse to our internal DetectionResult format
        detectionServiceResult = {
          requires2FA: detectionResponse.detected,
          reason: detectionResponse.message
        };
        
        riskFactors.push(`Detection module result: ${detectionResponse.message}`);
        riskScore += 30;
        requires2FA = true;
        
        // Adjust user type based on risk level if provided
        if (detectionResponse.riskLevel === TransactionRiskLevel.HIGH || 
            detectionResponse.riskLevel === TransactionRiskLevel.CRITICAL) {
          userType = UserType.MULTI_STEP;
        } else if (detectionResponse.riskLevel === TransactionRiskLevel.MEDIUM) {
          // Keep current user type but ensure 2FA
          requires2FA = true;
        }
      }
    } catch (error) {
      console.error('Error using detection service:', error);
      // Continue with our custom classification if detection service fails
    }
  }

  // Skip 2FA for very small transactions unless other risk factors exist
  if (valueInEth < RISK_THRESHOLDS.MINIMUM_VALUE) {
    riskFactors.push(`Very small value transaction: ${valueInEth} ETH`);
    // Don't add risk score for small transactions
  } else {
    // Check transaction value
    if (valueInEth >= RISK_THRESHOLDS.WHALE) {
      riskFactors.push(`High value transaction: ${valueInEth} ETH`);
      riskScore += 50;
      userType = UserType.WHALE;
      requires2FA = true;
    } else if (valueInEth >= RISK_THRESHOLDS.HIGH) {
      riskFactors.push(`Significant value transaction: ${valueInEth} ETH`);
      riskScore += 30;
      requires2FA = true;
    } else if (valueInEth >= RISK_THRESHOLDS.MEDIUM) {
      riskFactors.push(`Medium value transaction: ${valueInEth} ETH`);
      riskScore += 15;
    }
  }

  // Check if interacting with a contract (non-empty input data)
  if (tx.input && tx.input !== '0x') {
    riskFactors.push('Smart contract interaction');
    riskScore += 10;
    
    // Check for high-risk function calls
    const functionSignature = tx.input.substring(0, 10);
    if (HIGH_RISK_FUNCTIONS.includes(functionSignature)) {
      riskFactors.push(`High-risk function call: ${functionSignature}`);
      riskScore += 25;
      userType = UserType.DEFI;
      requires2FA = true;
    }
  }

  // Check if interacting with known high-risk addresses
  if (tx.to && WATCHED_ADDRESSES.some(addr => addr.toLowerCase() === tx.to.toLowerCase())) {
    // Only add this as a risk factor if the transaction value is significant
    if (valueInEth >= RISK_THRESHOLDS.MINIMUM_VALUE) {
      riskFactors.push(`Interaction with monitored address: ${tx.to}`);
      riskScore += 15;
    } else {
      riskFactors.push(`Interaction with monitored address: ${tx.to} (ignoring due to small value)`);
    }
  }
  
  // Check for unusual transaction frequency patterns
  if (detectUnusualFrequency(tx.from, timestamp)) {
    riskFactors.push('Unusual transaction frequency detected');
    riskScore += 20;
  }

  // Determine multi-step requirements
  if (riskScore >= 60) {
    userType = UserType.MULTI_STEP;
    requires2FA = true;
  }

  // Any transaction with risk score above threshold requires 2FA
  if (riskScore >= RISK_SCORE_THRESHOLD) {
    requires2FA = true;
  }

  return {
    transaction: tx,
    requires2FA,
    riskFactors,
    userType,
    riskScore,
    detectionServiceResult,
    timestamp
  };
}

/**
 * Saves classification results to a file
 */
function saveResultsToFile(results: ClassificationResult[], filename: string): void {
  try {
    const outputDir = path.join(__dirname, '../../output');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, filename);
    
    // Format the results for better readability
    const formattedResults = results.map(result => ({
      transactionHash: result.transaction.hash,
      from: result.transaction.from,
      to: result.transaction.to,
      value: parseInt(result.transaction.value) / 1e18 + ' ETH',
      timestamp: new Date(result.timestamp).toISOString(),
      riskScore: result.riskScore,
      requires2FA: result.requires2FA,
      userType: result.userType,
      riskFactors: result.riskFactors,
      detectionServiceResult: result.detectionServiceResult
    }));
    
    fs.writeFileSync(filePath, JSON.stringify(formattedResults, null, 2));
    console.log(`Results saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving results to file:', error);
  }
}

/**
 * Main function to analyze transactions from multiple addresses
 */
async function analyzeTransactions() {
  console.log('Starting transaction analysis for 2FA requirements...\n');
  
  // Initialize the detection service
  let detectionService: DetectionService | undefined;
  try {
    // No need to create an instance since we're using static methods
    detectionService = new DetectionService();
    console.log('Successfully initialized detection service');
  } catch (error) {
    console.warn('Could not initialize detection service, falling back to standalone classification:', error);
  }
  
  const allResults: ClassificationResult[] = [];
  
  for (const address of WATCHED_ADDRESSES) {
    console.log(`Fetching transactions for ${address}...`);
    const transactions = await getLatestTransactions(address);
    
    if (transactions.length === 0) {
      console.log(`No transactions found for ${address}\n`);
      continue;
    }
    
    console.log(`Analyzing ${transactions.length} transactions for ${address}...\n`);
    
    // Create a TOTP secret for this address session
    const addressTOTPSecret = TOTPService.generateSecret();
    console.log(`Generated TOTP secret for testing: ${addressTOTPSecret}`);
    
    // Generate a current TOTP code
    const addressTOTPCode = TOTPService.generateTOTP(addressTOTPSecret);
    console.log(`Current TOTP code: ${addressTOTPCode}\n`);
    
    // Analyze each transaction
    for (const tx of transactions) {
      const classification = classifyTransaction(tx, detectionService);
      allResults.push(classification);
      
      // For transactions requiring 2FA, setup TOTP state for the sender
      if (classification.requires2FA) {
        // Get or create TOTP state for the user and update to reflect their user type
        const userState = getUserTOTPState(tx.from, classification.userType);
        
        // Generate a new code if needed based on user type
        if (classification.userType !== userState.userType) {
          userState.userType = classification.userType;
          userState.lastGeneratedCode = TOTPService.generateTOTP(userState.secret);
        }
      }
      
      console.log(`\nTransaction ${tx.hash.substring(0, 10)}...${tx.hash.substring(58)}:`);
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to || 'Contract Creation'}`);
      console.log(`  Value: ${parseInt(tx.value) / 1e18} ETH`);
      console.log(`  Time: ${new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}`);
      
      console.log('  Analysis:');
      console.log(`  - Risk Score: ${classification.riskScore}/${RISK_SCORE_THRESHOLD} threshold`);
      console.log(`  - User Type: ${classification.userType}`);
      console.log(`  - Requires 2FA: ${classification.requires2FA ? 'YES' : 'NO'}`);
      
      if (classification.riskFactors.length > 0) {
        console.log('  - Risk Factors:');
        classification.riskFactors.forEach(factor => {
          console.log(`    * ${factor}`);
        });
      }
      
      // For transactions requiring 2FA, show verification example
      if (classification.requires2FA) {
        console.log('\n  2FA Verification Example:');
        // Use the user's TOTP state if available
        const userState = getUserTOTPState(tx.from, classification.userType);
        console.log(`  - User Type: ${userState.userType}`);
        console.log(`  - Generated TOTP code: ${userState.lastGeneratedCode}`);
        
        // Verify the transaction using the TOTP code
        const isValid = verifyTransactionTOTP(tx.from, userState.lastGeneratedCode, tx);
        console.log(`  - Verification result: ${isValid ? 'VALID' : 'INVALID'}`);
      }
      
      console.log('  ' + '-'.repeat(50));
    }
  }
  
  // Save all results to a file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveResultsToFile(allResults, `transaction-analysis-${timestamp}.json`);
  
  // Also save the TOTP states to a separate file
  const totpStatesFormatted = Array.from(userTOTPStates.entries()).map(([address, state]) => ({
    userAddress: address,
    userType: state.userType,
    totpSecret: state.secret,
    currentCode: state.lastGeneratedCode,
    setupComplete: state.setupComplete,
    lastVerification: state.lastVerification ? state.lastVerification.toISOString() : null
  }));
  
  const totpStatesFilePath = path.join(__dirname, '../../output', `totp-states-${timestamp}.json`);
  fs.writeFileSync(totpStatesFilePath, JSON.stringify(totpStatesFormatted, null, 2));
  console.log(`TOTP states saved to ${totpStatesFilePath}`);
}

// Run the analysis
analyzeTransactions().catch(error => {
  console.error('Error in transaction analysis:', error);
}); 