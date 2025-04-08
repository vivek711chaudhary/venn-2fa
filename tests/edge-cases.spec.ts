import { DetectionService } from '../src/modules/detection-module/service';
import { DetectionRequest } from '../src/modules/detection-module/dtos';

// Helper function to create a mock transaction request based on the existing test files
function createMockDetectionRequest(options: Partial<{
  value: string;
  input: string;
  to: string;
  from: string;
  calls: any[];
}> = {}): DetectionRequest {
  return {
    chainId: 1,
    hash: `0x${Math.random().toString(16).substring(2)}`,
    trace: {
      from: options.from || '0xabcdef1234567890abcdef1234567890abcdef12',
      to: options.to || '0x1234567890123456789012345678901234567890',
      gas: '100000',
      gasUsed: '50000',
      input: options.input || '0x',
      value: options.value || '0',
      pre: {},
      post: {},
      calls: options.calls || []
    }
  } as unknown as DetectionRequest;
}

describe('Edge Case Detection Tests', () => {
  beforeEach(() => {
    // Reset state between tests if needed
  });

  describe('False Positive Testing', () => {
    /**
     * False positives are when the system incorrectly flags a safe transaction as risky.
     * These tests check for such scenarios.
     */
    
    test('should not flag standard contract interactions as high risk', () => {
      // A common ERC20 transfer - should not trigger 2FA
      const safeContractCall = createMockDetectionRequest({
        to: '0x1234567890123456789012345678901234567890',
        input: '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000a', // transfer(address,uint256)
        from: '0xabcdef1234567890abcdef1234567890abcdef12'
      });
      
      const result = DetectionService.detect(safeContractCall);
      expect(result.detected).toBe(false);
    });
    
    test('should not flag repetitive small transfers to the same address as high risk', () => {
      // Multiple small transfers to the same address (e.g., recurring payments)
      // These should not be considered suspicious
      const smallTransaction = createMockDetectionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: '100000000000000000', // 0.1 ETH
        from: '0xabcdef1234567890abcdef1234567890abcdef12'
      });
      
      // Simulate multiple transactions to the same address
      for (let i = 0; i < 5; i++) {
        const result = DetectionService.detect(smallTransaction);
        expect(result.detected).toBe(false);
      }
    });
    
    test('should not flag transactions to known DEXes as high risk', () => {
      // Transaction to a well-known decentralized exchange
      const dexTransaction = createMockDetectionRequest({
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        value: '500000000000000000', // 0.5 ETH
        input: '0x7ff36ab50000000000000000000000000000000000000000000000000000000000000000', // swapExactETHForTokens
        from: '0xabcdef1234567890abcdef1234567890abcdef12'
      });
      
      const result = DetectionService.detect(dexTransaction);
      expect(result.detected).toBe(false);
    });
  });

  describe('False Negative Testing', () => {
    /**
     * False negatives are when the system fails to flag a risky transaction.
     * These tests check that potentially dangerous scenarios are properly caught.
     */
    
    test('should detect sophisticated phishing contracts with similar addresses', () => {
      // A transaction to a contract with address very similar to a popular protocol
      // (e.g., 0x1 different from Uniswap's address)
      const phishingTransaction = createMockDetectionRequest({
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488E', // Notice the last char: D->E
        value: '1000000000000000000', // 1 ETH
        input: '0x7ff36ab50000000000000000000000000000000000000000000000000000000000000000',
        from: '0xabcdef1234567890abcdef1234567890abcdef12'
      });
      
      const result = DetectionService.detect(phishingTransaction);
      expect(result.detected).toBe(true);
    });
    
    test('should detect obfuscated sensitive function calls', () => {
      // A transaction that obfuscates a sensitive operation like transferOwnership
      // by using a proxy or delegate call
      const obfuscatedTransaction = createMockDetectionRequest({
        to: '0x1234567890123456789012345678901234567890',
        input: '0x1234567800000000000000000000000000000000000000000000000000000000000000f00000000000000000000000008979a248604c2a79caf4c9f13ea8b689b24a9c',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        calls: [
          {
            from: '0xabcdef1234567890abcdef1234567890abcdef12',
            to: '0x8979A248604C2a79cAf4C9f13eA8b689B24a9C',
            input: '0xf2fde38b0000000000000000000000009876543210fedcba9876543210fedcba98765432', // transferOwnership
            gasUsed: '50000'
          }
        ]
      });
      
      const result = DetectionService.detect(obfuscatedTransaction);
      expect(result.detected).toBe(true);
    });
    
    test('should detect unusual gas price/limit as potential MEV attacks', () => {
      // A transaction with extremely high gas price could be part of a
      // Miner Extractable Value (MEV) attack or sandwich attack
      const highGasTransaction = createMockDetectionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: '100000000000000000', // 0.1 ETH
        input: '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000a'
      });
      
      // Add gas price information to the additionalData field
      highGasTransaction.additionalData = {
        gasPrice: '900000000000', // Extremely high gas price
        gasLimit: '3000000' // High gas limit
      };
      
      const result = DetectionService.detect(highGasTransaction);
      expect(result.detected).toBe(true);
    });
    
    test('should detect transactions to recently deployed contracts as potentially risky', () => {
      // Transaction to a very recently deployed contract could be risky
      const newContractTransaction = createMockDetectionRequest({
        to: '0xfedcba0987654321fedcba0987654321fedcba09',
        value: '500000000000000000' // 0.5 ETH
      });
      
      // Add contract info to the additionalData field
      newContractTransaction.additionalData = {
        contractInfo: {
          createdAt: new Date(Date.now() - 3600000) // Contract created 1 hour ago
        }
      };
      
      const result = DetectionService.detect(newContractTransaction);
      expect(result.detected).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should properly handle transactions with empty data field', () => {
      // Some wallets might send transactions with null/undefined data
      const emptyDataTransaction = createMockDetectionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: '100000000000000000' // 0.1 ETH
      });
      
      // Set input to undefined to test handling
      emptyDataTransaction.trace.input = undefined as any;
      
      // This should not throw errors
      expect(() => {
        DetectionService.detect(emptyDataTransaction);
      }).not.toThrow();
    });
    
    test('should handle transactions with malformed data gracefully', () => {
      // Some transactions might have malformed data
      const malformedDataTransaction = createMockDetectionRequest({
        to: '0x1234567890123456789012345678901234567890',
        value: '100000000000000000' // 0.1 ETH
      });
      
      // Set input to an invalid hex string
      malformedDataTransaction.trace.input = '0xZYXW';
      
      // Should not throw but might mark as high risk due to suspicious data
      expect(() => {
        const result = DetectionService.detect(malformedDataTransaction);
        // The system might flag it or not depending on implementation
        // Not checking the result, just that it doesn't throw
      }).not.toThrow();
    });
  });
}); 