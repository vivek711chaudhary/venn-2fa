import 'reflect-metadata';
import { DetectionService, TransactionVerificationStatus, TOTPVerificationRequest } from '../src/modules/detection-module/service'
import { DetectionRequest } from '../src/modules/detection-module/dtos'
import { TOTPService } from '../src/modules/authenticator/totp-service'

// Helper function to create a mock transaction request
function createMockDetectionRequest(options: Partial<{
  value: string;
  input: string;
  to: string;
}> = {}): DetectionRequest {
  return {
    chainId: 1,
    hash: '0xmockhash',
    id: `tx-${Date.now()}`,
    trace: {
      from: '0xfrom',
      to: options.to || '0xto',
      gas: '100000',
      gasUsed: '50000',
      input: options.input || '0x0',
      value: options.value || '0',
      pre: {},
      post: {},
    }
  } as unknown as DetectionRequest;
}

describe('DetectionService', () => {
  describe('High-risk transaction detection', () => {
    it('should not require 2FA for safe transactions', () => {
      const safeRequest = createMockDetectionRequest({
        value: '100000000000000000', // 0.1 ETH (below threshold)
      });
      
      const response = DetectionService.detect(safeRequest);
      
      expect(response.detected).toBe(false);
      expect(response.message).toContain('no 2FA required');
    });

    it('should require 2FA for high-value transactions', () => {
      const highValueRequest = createMockDetectionRequest({
        value: '2000000000000000000', // 2 ETH (above threshold)
      });
      
      const response = DetectionService.detect(highValueRequest);
      
      expect(response.detected).toBe(true);
      expect(response.message).toContain('2FA verification required');
    });

    it('should require 2FA for transactions with sensitive function calls', () => {
      const sensitiveCallRequest = createMockDetectionRequest({
        input: '0xf2fde38b0000000000000000000000001234567890123456789012345678901234567890', // transferOwnership
      });
      
      const response = DetectionService.detect(sensitiveCallRequest);
      
      expect(response.detected).toBe(true);
      expect(response.message).toContain('2FA verification required');
    });
  });

  describe('TOTP verification flow', () => {
    it('should verify a transaction with a valid TOTP code', () => {
      // Create a high-risk transaction that will trigger 2FA
      const highRiskRequest = createMockDetectionRequest({
        value: '2000000000000000000', // 2 ETH (above threshold)
      });
      
      // Detect the high-risk transaction
      const response = DetectionService.detect(highRiskRequest);
      expect(response.detected).toBe(true);
      
      // Get the transaction ID
      const transactionId = highRiskRequest.id as string;
      
      // Generate a valid TOTP code using the default secret
      // This relies on the implementation detail that DetectionService uses DEFAULT_TOTP_SECRET
      const totpCode = TOTPService.generateTOTP('JBSWY3DPEHPK3PXP');
      
      // Verify the transaction with the valid TOTP code
      const verificationResult = DetectionService.verifyTransaction({
        transactionId,
        totpCode,
        timestamp: Date.now(),
      });
      
      expect(verificationResult.success).toBe(true);
      expect(verificationResult.status).toBe(TransactionVerificationStatus.VERIFIED);
    });

    it('should reject verification with an invalid TOTP code', () => {
      // Create a high-risk transaction that will trigger 2FA
      const highRiskRequest = createMockDetectionRequest({
        value: '2000000000000000000', // 2 ETH (above threshold)
      });
      
      // Detect the high-risk transaction
      const response = DetectionService.detect(highRiskRequest);
      expect(response.detected).toBe(true);
      
      // Get the transaction ID
      const transactionId = highRiskRequest.id as string;
      
      // Use an invalid TOTP code
      const invalidTotpCode = '000000';
      
      // Verify the transaction with the invalid TOTP code
      const verificationResult = DetectionService.verifyTransaction({
        transactionId,
        totpCode: invalidTotpCode,
        timestamp: Date.now(),
      });
      
      expect(verificationResult.success).toBe(false);
      expect(verificationResult.status).toBe(TransactionVerificationStatus.PENDING_VERIFICATION);
    });

    it('should handle non-existent transaction IDs gracefully', () => {
      // Use a non-existent transaction ID
      const nonExistentId = 'non-existent-id';
      
      // Try to verify a transaction that doesn't exist
      const verificationResult = DetectionService.verifyTransaction({
        transactionId: nonExistentId,
        totpCode: '123456',
        timestamp: Date.now(),
      });
      
      expect(verificationResult.success).toBe(false);
      expect(verificationResult.message).toContain('Transaction not found');
      expect(verificationResult.status).toBe(TransactionVerificationStatus.NOT_REQUIRED);
    });
  });

  describe('Transaction status checks', () => {
    it('should report the correct status for a verified transaction', () => {
      // Create a high-risk transaction that will trigger 2FA
      const highRiskRequest = createMockDetectionRequest({
        value: '2000000000000000000', // 2 ETH (above threshold)
      });
      
      // Detect the high-risk transaction
      DetectionService.detect(highRiskRequest);
      
      // Get the transaction ID
      const transactionId = highRiskRequest.id as string;
      
      // Generate a valid TOTP code
      const totpCode = TOTPService.generateTOTP('JBSWY3DPEHPK3PXP');
      
      // Verify the transaction
      DetectionService.verifyTransaction({
        transactionId,
        totpCode,
        timestamp: Date.now(),
      });
      
      // Check the transaction status
      const status = DetectionService.getTransactionVerificationStatus(transactionId);
      
      expect(status.status).toBe(TransactionVerificationStatus.VERIFIED);
    });

    it('should report the correct status for a pending transaction', () => {
      // Create a high-risk transaction that will trigger 2FA
      const highRiskRequest = createMockDetectionRequest({
        value: '2000000000000000000', // 2 ETH (above threshold)
      });
      
      // Detect the high-risk transaction
      DetectionService.detect(highRiskRequest);
      
      // Get the transaction ID
      const transactionId = highRiskRequest.id as string;
      
      // Check the transaction status without verifying
      const status = DetectionService.getTransactionVerificationStatus(transactionId);
      
      expect(status.status).toBe(TransactionVerificationStatus.PENDING_VERIFICATION);
      expect(status.riskReason).toBeDefined();
    });

    it('should report the correct status for a non-existent transaction', () => {
      // Use a non-existent transaction ID
      const nonExistentId = 'non-existent-id';
      
      // Check the status of a non-existent transaction
      const status = DetectionService.getTransactionVerificationStatus(nonExistentId);
      
      expect(status.status).toBe(TransactionVerificationStatus.NOT_REQUIRED);
    });
  });
});
