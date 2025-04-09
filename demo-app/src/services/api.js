import { verifyTOTP } from '../utils/totp';

const API_BASE_URL = 'http://localhost:5000';

// Chain configuration
const CHAIN_CONFIG = {
  ethereum: {
    name: 'Ethereum Mainnet',
    api: 'https://api.etherscan.io/api',
    apiKey: 'CESRMKGY76WTDJ8JZABBMW5CIFPS9YQZQ2',
    blockExplorer: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon',
    api: 'https://api.polygonscan.com/api',
    apiKey: '5UTU2QB365FFT2E8XFS7BF55HA7AC44XPC',
    blockExplorer: 'https://polygonscan.com'
  },
  arbitrum: {
    name: 'Arbitrum',
    api: 'https://api.arbiscan.io/api',
    apiKey: '4PTRAVQWSC3IM7W6RJ1435STYCHRA4CDHR',
    blockExplorer: 'https://arbiscan.io'
  },
  bsc: {
    name: 'Binance Smart Chain',
    api: 'https://api.bscscan.com/api',
    apiKey: 'B88AY5I6QQN4VMWBVG2PJ47KMEKT39PEVG',
    blockExplorer: 'https://bscscan.com'
  }
};

// Predefined addresses for each chain
const PREDEFINED_ADDRESSES = {
  ethereum: [
    '0xFd15c3932A783e324B1a63a174014cD105dbdeA8', // Gnosis Safe: Curve
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'  // USDT
  ],
  sepolia: [
    '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia USDT
    '0xc0d7a95B4A331A8Ea68B14962D713e3836608bB2'  // Sepolia DAI
  ],
  polygon: [
    '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'  // WBTC on Polygon
  ],
  arbitrum: [
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
    '0xFC5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a'  // GMX on Arbitrum
  ],
  bsc: [
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
    '0x55d398326f99059fF775485246999027B3197955'  // USDT on BSC
  ]
};

// Helper function to generate a random TOTP secret
const generateRandomSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

// Store user's TOTP secret (in a real app, this would be stored securely on the server)
let userTOTPSecret = null;

const api = {
  // Get chain configuration
  getChainConfig: () => {
    return CHAIN_CONFIG;
  },
  
  // Get predefined addresses for a chain
  getPredefinedAddresses: (chain) => {
    return PREDEFINED_ADDRESSES[chain] || PREDEFINED_ADDRESSES.ethereum;
  },
  
  // Fetch transactions for an address on a specific chain
  fetchTransactions: async (address, chain = 'ethereum', limit = 10) => {
    try {
      const chainConfig = CHAIN_CONFIG[chain];
      if (!chainConfig) {
        throw new Error(`Chain ${chain} not supported`);
      }
      
      console.log(`🔍 Fetching transactions for ${address} on ${chainConfig.name}`);
      const url = `${chainConfig.api}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${chainConfig.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sometimes the API returns status "0" with a message but actually has results
      // or the results might be empty due to API limitations
      if (data.status !== '1' || !data.result || !Array.isArray(data.result) || data.result.length === 0) {
        console.warn(`API warning for ${chainConfig.name}: ${data.message || 'No transactions returned'}`);
        
        // Generate mock transactions for demo purposes
        console.log(`Generating mock transactions for ${address} on ${chainConfig.name}`);
        return generateMockTransactions(address, chain, limit);
      }
      
      console.log(`✅ Found ${data.result.length} transactions on ${chainConfig.name}`);
      return data.result;
    } catch (error) {
      console.error(`❌ Error fetching transactions on ${chain}:`, error);
      
      // Generate mock transactions for any error case
      console.log(`Generating mock transactions for ${address} on ${chain} due to error`);
      return generateMockTransactions(address, chain, limit);
    }
  },
  
  // Analyze transactions for 2FA requirements
  analyzeTransactions: async (transactions, chain = 'ethereum') => {
    try {
      console.log(`🧠 Analyzing ${transactions.length} transactions for risk factors`);
      
      // If we had a server for this, we would call it, but for the demo we'll analyze client-side
      const results = transactions.map(tx => {
        // Convert value to ETH
        const valueInEth = parseInt(tx.value) / 1e18;
        
        // Initialize result object
        const result = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: valueInEth,
          timestamp: parseInt(tx.timeStamp) * 1000,
          riskScore: 0,
          riskFactors: [],
          requires2FA: false,
          userType: 'REGULAR'
        };
        
        // Basic risk factors
        
        // 1. Check transaction value
        if (valueInEth >= 10) {
          result.riskFactors.push(`High value transaction: ${valueInEth} ETH`);
          result.riskScore += 50;
          result.userType = 'WHALE';
          result.requires2FA = true;
        } else if (valueInEth >= 5) {
          result.riskFactors.push(`Significant value transaction: ${valueInEth} ETH`);
          result.riskScore += 30;
          result.requires2FA = true;
        } else if (valueInEth >= 1) {
          result.riskFactors.push(`Medium value transaction: ${valueInEth} ETH`);
          result.riskScore += 15;
        }
        
        // 2. Check for contract interaction
        if (tx.input && tx.input !== '0x') {
          result.riskFactors.push('Smart contract interaction');
          result.riskScore += 10;
          
          // Check for high-risk function signatures
          const functionSignature = tx.input.substring(0, 10);
          const highRiskFunctions = {
            '0xf2fde38b': 'transferOwnership',
            '0x23b872dd': 'transferFrom',
            '0x42842e0e': 'safeTransferFrom',
            '0x095ea7b3': 'approve'
          };
          
          if (highRiskFunctions[functionSignature]) {
            result.riskFactors.push(`High-risk function call: ${highRiskFunctions[functionSignature]}`);
            result.riskScore += 25;
            result.userType = 'DEFI';
            result.requires2FA = true;
          }
        }
        
        // 3. Check for known/monitored addresses
        const monitoredAddresses = PREDEFINED_ADDRESSES[chain];
        if (monitoredAddresses && monitoredAddresses.some(addr => 
            addr.toLowerCase() === tx.to.toLowerCase())) {
          result.riskFactors.push(`Interaction with monitored address: ${tx.to}`);
          result.riskScore += 15;
        }
        
        // 4. Determine if 2FA is required based on risk score
        if (result.riskScore >= 20 && !result.requires2FA) {
          result.requires2FA = true;
        }
        
        // 5. Adjust user type for high risk scores
        if (result.riskScore >= 60) {
          result.userType = 'MULTI_STEP';
        }
        
        return result;
      });
      
      console.log(`✅ Analysis complete: ${results.filter(r => r.requires2FA).length} transactions require 2FA`);
      return results;
    } catch (error) {
      console.error('❌ Error analyzing transactions:', error);
      return [];
    }
  },

  // Detect if a transaction requires 2FA
  detectTransaction: async (transactionData) => {
    try {
      console.log('🔍 Calling detect API with data:', transactionData);
      const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Detect API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in detect API:', error);
      console.log('Using mock detection response');
      
      // Generate a random transaction ID
      const transactionId = 'mock-' + Math.random().toString(36).substring(2, 15);
      
      // Mock response for demonstration
      return {
        requiresTwoFactorAuth: true,
        transactionId: transactionId,
        message: 'Transaction requires 2FA verification (mock)'
      };
    }
  },

  // Verify a transaction with TOTP code
  verifyTransaction: async (transactionId, totpCode) => {
    try {
      console.log('🔐 Calling verify API with:', { transactionId, totpCode });
      const response = await fetch(`${API_BASE_URL}/detect/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          totpCode,
          timestamp: Date.now()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Verify API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in verify API:', error);
      console.log('Using local TOTP verification as fallback');
      
      // Verify the TOTP code locally
      const isValid = verifyTOTP(userTOTPSecret, totpCode);
      
      if (!isValid) {
        throw new Error('Invalid TOTP code');
      }
      
      // Return a mock success response
      return {
        success: true,
        message: 'Transaction verified successfully (local verification)',
        transactionId: transactionId
      };
    }
  },

  // Check transaction verification status
  checkTransactionStatus: async (transactionId) => {
    try {
      console.log('📊 Checking transaction status for ID:', transactionId);
      const response = await fetch(`${API_BASE_URL}/status/${transactionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Status API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in status API:', error);
      throw error;
    }
  },

  // Generate a new TOTP secret
  generateTOTPSecret: async () => {
    try {
      console.log('🔑 Attempting to generate TOTP secret from API');
      const response = await fetch(`${API_BASE_URL}/generate-totp`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ TOTP Secret Response:', data);
      userTOTPSecret = data.secret; // Store the secret
      return data;
    } catch (error) {
      // If API fails, create a mock response for demo purposes
      console.error('❌ Error generating TOTP secret:', error);
      console.log('Using mock TOTP data for demonstration');
      
      // Generate a random secret for the mock
      const secret = generateRandomSecret();
      userTOTPSecret = secret; // Store the secret
      
      // Create a QR code URL using Google Charts API
      const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/VennDemo:user@example.com%3Fsecret=${secret}%26issuer=VennDemo`;
      
      // Mock response for demonstration
      const mockResponse = {
        secret: secret,
        qrCodeUrl: qrCodeUrl,
        message: 'TOTP secret generated successfully (mock)'
      };
      
      return mockResponse;
    }
  },

  // Verify a TOTP code
  verifyTOTPCode: async (code) => {
    if (!userTOTPSecret) {
      throw new Error('No TOTP secret found. Please set up 2FA first.');
    }

    try {
      // Verify the TOTP code using our custom implementation
      const isValid = verifyTOTP(userTOTPSecret, code);

      if (!isValid) {
        throw new Error('Invalid TOTP code');
      }

      return { success: true, message: 'TOTP code verified successfully' };
    } catch (error) {
      console.error('❌ Error verifying TOTP code:', error);
      throw error;
    }
  }
};

// Helper function to generate mock transactions
const generateMockTransactions = (address, chain = 'ethereum', count = 10) => {
  const chainConfig = CHAIN_CONFIG[chain];
  const transactions = [];
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Get some predefined addresses for this chain to use as destinations
  const predefinedAddrs = PREDEFINED_ADDRESSES[chain] || PREDEFINED_ADDRESSES.ethereum;
  
  for (let i = 0; i < count; i++) {
    // Generate transaction values that will trigger different risk levels
    let value;
    if (i % 5 === 0) {
      // High value (10+ ETH) - triggers WHALE classification
      value = (10 + Math.random() * 15).toFixed(2) * 1e18;
    } else if (i % 3 === 0) {
      // Medium-high value (5-10 ETH)
      value = (5 + Math.random() * 5).toFixed(2) * 1e18;
    } else if (i % 2 === 0) {
      // Medium value (1-5 ETH)
      value = (1 + Math.random() * 4).toFixed(2) * 1e18;
    } else {
      // Low value (<1 ETH)
      value = (Math.random() * 0.9).toFixed(2) * 1e18;
    }
    
    // Generate mock transaction hash
    const hash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Select a destination address
    const to = i % 3 === 0 && predefinedAddrs.length > 0
      ? predefinedAddrs[Math.floor(Math.random() * predefinedAddrs.length)]
      : '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Create input data (empty or with function signature)
    const input = i % 2 === 0 
      ? '0x' 
      : i % 4 === 0 
        ? '0x095ea7b3000000000000000000000000' + to.substring(2) + '00000000000000000000000000000000000000000000000000000000000000ff'  // approve
        : '0x23b872dd000000000000000000000000' + to.substring(2);  // transferFrom
    
    // Create timestamp (random time in the last 30 days)
    const timeStamp = currentTime - Math.floor(Math.random() * 30 * 24 * 60 * 60);
    
    transactions.push({
      hash,
      from: address,
      to,
      value: value.toString(),
      timeStamp: timeStamp.toString(),
      input,
      gasPrice: '20000000000',
      gasUsed: '21000',
      isError: '0',
      txreceipt_status: '1',
      blockNumber: (15000000 + Math.floor(Math.random() * 1000000)).toString(),
      nonce: Math.floor(Math.random() * 1000).toString()
    });
  }
  
  console.log(`✅ Generated ${count} mock transactions for demo`);
  return transactions;
};

export default api; 