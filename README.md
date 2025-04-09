![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)

# 2FA Transaction Security System

## Overview

This project implements a sophisticated Two-Factor Authentication (2FA) system for blockchain transactions, providing an additional layer of security for high-risk operations. The system analyzes transaction patterns in real-time, identifying potential security risks and requiring additional verification through Time-based One-Time Passwords (TOTP) when necessary.

## Architecture Diagram

```
┌─────────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│                     │     │                       │     │                     │
│   Frontend App      │────▶│  Detection Service    │────▶│  Risk Assessment    │
│   (React)           │     │                       │     │                     │
│                     │◀────│                       │◀────│                     │
└─────────────────────┘     └───────────────────────┘     └─────────────────────┘
          │                            │                            │
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│                     │     │                       │     │                     │
│  Transaction Form   │     │  TOTP Verification    │     │  Pattern Analysis   │
│                     │     │                       │     │                     │
└─────────────────────┘     └───────────────────────┘     └─────────────────────┘
```

## Core Components

### 1. Frontend Application

The demo interface provides specialized flows for different user types:

- **Regular User Demo**: Standard transaction flow with 2FA for transactions over 1 ETH
- **Whale User Demo**: Adjusted thresholds (10 ETH+) for users with typically higher transaction values
- **DeFi User Demo**: Special security for smart contract interactions and function calls
- **Multi-Step Demo**: Enhanced verification for complex transaction flows

### 2. Detection Service

The core of the system, responsible for:
- Analyzing incoming transactions for risk factors
- Determining appropriate risk level (NONE, LOW, MEDIUM, HIGH, CRITICAL)
- Triggering 2FA verification when necessary
- Managing verification status and tracking attempts

### 3. Risk Assessment Engine

Our sophisticated `RiskService` evaluates transactions based on multiple factors:
- Transaction value (with user-specific thresholds)
- Function signature analysis (sensitive operations detection)
- High-risk address identification
- Deep call pattern analysis for detecting obfuscated attacks
- MEV attack detection via gas parameter analysis
- Recently deployed contract detection

### 4. TOTP Authentication

Robust Time-based One-Time Password implementation:
- Secure secret generation and base32 encoding
- QR code generation for easy authenticator app setup
- 6-digit code validation with time window management
- Rate limiting to prevent brute force attacks
- Verification expiration for enhanced security

## Transaction Risk Triggers

The system triggers 2FA based on the following risk factors:

| Trigger Condition | Regular User | Whale User | DeFi User |
|-------------------|--------------|------------|-----------|
| Transaction Value | > 1 ETH | > 10 ETH | > 1 ETH |
| Sensitive Functions | Any sensitive call | Any sensitive call | Most contract calls |
| High-Risk Address | Any interaction | Any interaction | Any interaction |
| Call Nesting | > 3 levels deep | > 3 levels deep | > 3 levels deep |
| Gas Parameters | Abnormally high | Abnormally high | Abnormally high |
| Contract Age | < 24 hours old | < 24 hours old | < 24 hours old |

## Risk Level Classification

The system classifies transactions into risk levels that determine the verification approach:

| Risk Level | Description | Verification Requirements |
|------------|-------------|---------------------------|
| NONE | Safe transaction | No additional verification |
| LOW | Slightly elevated risk | Simple verification |
| MEDIUM | Moderate risk | TOTP verification |
| HIGH | High risk | TOTP + additional checks |
| CRITICAL | Critical risk | TOTP + strict checks |

## TOTP Verification Flow

1. **Detection Phase**: Transaction is analyzed and risk level determined
2. **Verification Request**: High-risk transactions trigger TOTP verification
3. **Code Input**: User enters 6-digit code from authenticator app
4. **Validation**: System verifies code against stored secret with time window
5. **Rate Limiting**: Failed attempts are tracked to prevent brute force
6. **Status Tracking**: Transaction status (pending, verified, expired) is maintained

## Implementation Details

### Detection Service

```typescript
/**
 * Detects high-risk transactions requiring 2FA
 */
public static detect(request: DetectionRequest): DetectionResponse {
  // Determine risk level based on transaction characteristics and user type
  const riskAssessment = RiskService.assessRisk(request);
  const riskLevel = this.determineRiskLevel(request, riskAssessment);
  
  // Allow safe transactions to proceed without verification
  if (!riskAssessment.isHighRisk) {
    return new DetectionResponse({
      transactionId: generateId(),
      detected: false,
      message: 'Transaction is safe, no 2FA required',
      riskLevel: TransactionRiskLevel.NONE
    });
  }
  
  // Store transaction data for verification
  pendingTransactions.set(transactionId, {
    requestData: request,
    riskInfo: { ...riskAssessment, level: riskLevel },
    verified: false,
    secret: this.getSecretForUser(request.trace.from),
    timestamp: Date.now(),
    attempts: 0
  });
  
  // Require 2FA verification
  return new DetectionResponse({
    transactionId: transactionId,
    detected: true,
    message: `High-risk transaction detected: ${riskAssessment.reason}. 2FA verification required.`,
    riskLevel: riskLevel
  });
}
```

### TOTP Implementation

Our TOTP implementation follows RFC 6238 standards:

```typescript
/**
 * Validates a TOTP code
 */
public static validateTOTP(
  code: string,
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
  window: number = 1
): boolean {
  // Validate code format
  if (code.length !== digits || !/^\d+$/.test(code)) {
    return false;
  }

  // Get current time counter
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check codes in the time window (past and future)
  for (let i = -window; i <= window; i++) {
    const expectedCode = this.generateHOTP(secret, counter + i, digits);
    if (expectedCode === code) {
      return true;
    }
  }
  
  return false;
}
```

## Test Coverage

Our implementation includes comprehensive test suites:

1. **User Scenarios**: Tests for different user profiles and their specific thresholds
   - Regular users with standard thresholds
   - Whale users with higher transaction limits
   - DeFi users with enhanced sensitivity to function calls

2. **Edge Cases**: Testing for edge scenarios to prevent false positives/negatives
   - Handling of sophisticated phishing attempts
   - Detection of obfuscated sensitive function calls
   - MEV attack identification
   - New contract risk detection
   - Graceful handling of malformed data

3. **Detection Module Tests**: Core functionality validation
   - Risk assessment accuracy
   - TOTP generation and validation
   - Transaction status tracking

4. **Risk Detection**: Specific tests for risk assessment logic
   - Value-based risk detection
   - Function signature analysis
   - Call pattern evaluation

## Getting Started

### Prerequisites

- Node.js v14+
- Yarn package manager
- Authenticator app (Google Authenticator, Authy, etc.)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/venn-custom-detection.git
   cd venn-custom-detection
   ```

2. Install dependencies
   ```
   yarn install
   ```

3. Start the development server
   ```
   yarn dev
   ```

4. Start the demo app
   ```
   cd demo-app
   yarn install
   yarn start
   ```

### Running Tests

```
yarn test
```

## Conclusion

This 2FA Transaction Security System provides robust protection for blockchain transactions by implementing sophisticated risk detection and requiring additional verification for high-risk operations. The system strikes a balance between security and usability through:

1. **Risk-Based Approach**: Only triggering 2FA when genuinely needed
2. **User Type Awareness**: Adjusting thresholds based on user profiles
3. **Comprehensive Detection**: Analyzing multiple risk factors simultaneously
4. **Secure Verification**: Implementing industry-standard TOTP with important safeguards

The implementation successfully prevents both false positives (unnecessarily triggering 2FA) and false negatives (missing high-risk transactions), creating a secure and user-friendly experience for blockchain transactions.

## License

MIT

## Contributions

Contributions are welcome! Please feel free to submit a Pull Request.

## Table of Contents
- [Introduction](#venn-custom-detector-boilerplate)
- [Quick Start](#quick-start)
- [What's inside?](#-whats-inside)
- [Local development:](#️-local-development)
- [Deploy to production](#-deploy-to-production)

## ✨ Quick start
1. Clone or fork this repo and install dependencies using `yarn install` _(or `npm install`)_
2. Find the detection service under: `src/modules/detection-module/service.ts`

    ```ts
    import { DetectionResponse, DetectionRequest } from './dtos'

    /**
     * DetectionService
     *
     * Implements a `detect` method that receives an enriched view of an
     * EVM compatible transaction (i.e. `DetectionRequest`)
     * and returns a `DetectionResponse`
     *
     * API Reference:
     * https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md
     */
    export class DetectionService {
        /**
         * Update this implementation code to insepct the `DetectionRequest`
         * based on your custom business logic
         */
        public static detect(request: DetectionRequest): DetectionResponse {
            
            /**
             * For this "Hello World" style boilerplate
             * we're mocking detection results using
             * some random value
             */
            const detectionResult = Math.random() < 0.5;


            /**
             * Wrap our response in a `DetectionResponse` object
             */
            return new DetectionResponse({
                request,
                detectionInfo: {
                    detected: detectionResult,
                },
            });
        }
    }
    ```

3. Implement your own logic in the `detect` method
4. Run `yarn dev` _(or `npm run dev`)_
5. That's it! Your custom detector service is now ready to inspect transaction

## 📦 What's inside?
This boilerplate is built using `Express.js`, and written in `TypeScript` using `NodeJS`.  
You can use it as-is by adding your own security logic to it, or as a reference point when using a different programming language.

**Notes on the API**
1. Your detector will get a `DetectionRequest`, and is expected to respond with a `DetectionResponse`

See our [API Reference](https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md) for more information.

## 🛠️ Local Development

**Environment Setup**

Create a `.env` file with:

```bash
PORT=3000
HOST=localhost
LOG_LEVEL=debug
```

**Runing In Dev Mode**
```bash
yarn        # or npm install
yarn dev    # or npm run dev
```

## 🚀 Deploy To Production

**Manual Build**

```bash
yarn build      # or npm run build
yarn start      # or npm run start
```


**Using Docker**
```bash
docker build -f Dockerfile . -t my-custom-detector
```

## Transaction Classifier

Our system includes a powerful transaction classifier that analyzes real blockchain transactions and evaluates their need for 2FA verification:

### Features

- **Real-time Blockchain Analysis**: Fetches and classifies transactions from multiple blockchain networks
- **Multi-factor Risk Assessment**: Evaluates transactions based on:
  - Transaction value (with thresholds for different user types)
  - Smart contract interactions and high-risk function calls
  - Monitored address interactions
  - Transaction frequency patterns
  - Integration with main detection service

- **User-specific TOTP Management**: 
  - Generates unique TOTP secrets for each user address
  - Maintains user state across multiple transactions
  - Adapts security level based on user type (REGULAR, WHALE, DEFI, MULTI_STEP)
  - Verifies and records transaction authentications

- **Risk Score Calculation**:
  - Comprehensive scoring system (0-100) based on multiple risk factors
  - Configurable threshold (default: 20) to balance security and convenience
  - Special handling for very small transactions to prevent unnecessary verification

- **Chain Support**:
  - Currently supports Ethereum mainnet
  - Extensible to other EVM-compatible chains (Sepolia, Polygon, BSC, Arbitrum, etc.)

### Risk Factors and Weights

| Risk Factor | Weight | Notes |
|-------------|--------|-------|
| Detection Module Flag | +30 | Main detection service identified risk |
| High Value (10+ ETH) | +50 | Automatically sets user to WHALE type |
| Significant Value (5+ ETH) | +30 | High risk requiring 2FA |
| Medium Value (1+ ETH) | +15 | Contributes to risk score |
| Smart Contract Interaction | +10 | Base score for any contract interaction |
| High-risk Function Call | +25 | Functions like approve, transferFrom, etc. |
| Monitored Address Interaction | +15 | For known high-risk or important addresses |
| Unusual Transaction Frequency | +20 | Multiple transactions in short time window |

### Transaction Classification Output

The classifier produces detailed analysis files in JSON format:

1. **Transaction Analysis**: Comprehensive evaluation of each transaction including:
   - Transaction details (hash, from, to, value, timestamp)
   - Risk score and 2FA requirement determination
   - User type classification
   - Detailed risk factors
   - Detection service results

2. **TOTP States**: User-specific TOTP information including:
   - User address
   - User type
   - TOTP secret
   - Current verification code
   - Setup status
   - Last verification timestamp

### Usage

Run the transaction classifier with:

```bash
npm run classify-transactions
```

Results will be saved to:
- `output/transaction-analysis-[timestamp].json`
- `output/totp-states-[timestamp].json`

## Transaction Explorer

The Transaction Explorer is an interactive interface for blockchain transaction analysis and 2FA requirement determination in real-time. It serves as a visual demonstration of how the 2FA system identifies high-risk transactions across multiple blockchain networks.

### Features

- **Multi-Chain Support**: Explore transactions on multiple blockchains:
  - Ethereum Mainnet
  - Polygon
  - Arbitrum
  - Binance Smart Chain (BSC)

- **Transaction Analysis**: Comprehensive risk assessment of each transaction showing:
  - Transaction hash and basic details
  - Risk score calculation (0-100 scale)
  - User type categorization (REGULAR, WHALE, DEFI, MULTI_STEP)
  - 2FA requirement status with visual indicators
  - Detailed risk factors for each transaction

- **Interactive Interface**:
  - Address input with predefined options for quick testing
  - Blockchain network selection
  - One-click transaction lookup
  - Detailed results table with sorting and filtering
  - Risk factor breakdown cards for select transactions
  - Links to blockchain explorers for verification

- **Fallback Mechanism**:
  - Mock data generation when blockchain APIs are unavailable
  - Demonstrates all risk scenarios even when real data cannot be fetched
  - Consistent experience across all supported chains

### How It Works

1. **Input Address and Chain**: Enter any blockchain address or select from predefined addresses for testing
2. **Fetch Transactions**: The system retrieves recent transactions for the specified address
3. **Risk Analysis**: Each transaction is analyzed against multiple risk factors:
   - Value-based risk (1+ ETH, 5+ ETH, 10+ ETH)
   - Smart contract interactions and function signatures
   - Known/monitored address interactions
4. **Results Display**: Color-coded risk scores and visual 2FA requirement indicators show which transactions would require additional verification

### Usage

Access the Transaction Explorer through the "Explorer" link in the navigation menu. For optimal experience:

- Try addresses with varied transaction patterns (use the predefined options)
- Compare risk assessments across different blockchains
- Examine the detailed risk factors for high-scoring transactions

This tool provides a visual representation of how the 2FA system works in practice and helps users understand when and why additional verification would be required for their blockchain transactions.

### Conclusion

