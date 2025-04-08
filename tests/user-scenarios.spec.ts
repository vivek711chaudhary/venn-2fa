import { DetectionService, TransactionVerificationStatus } from '../src/modules/detection-module/service'
import { TOTPService } from '../src/modules/authenticator/totp-service'
import { DetectionRequest } from '../src/modules/detection-module/dtos'

describe('User Scenarios for 2FA Service', () => {
  // Test data for different user types
  const userProfiles = {
    regularUser: {
      address: '0x1111222233334444555566667777888899990000',
      typicalTransactionValue: '100000000000000000', // 0.1 ETH
      totpSecret: 'JBSWY3DPEHPK3PXP'
    },
    whaleUser: {
      address: '0x2222333344445555666677778888999900001111',
      typicalTransactionValue: '5000000000000000000', // 5 ETH
      totpSecret: 'JBSWY3DPEHPK3PXP'
    },
    defiUser: {
      address: '0x3333444455556666777788889999000011112222',
      typicalTransactionValue: '2000000000000000000', // 2 ETH
      totpSecret: 'JBSWY3DPEHPK3PXP'
    }
  }

  // Helper function to create a transaction request
  const createTransactionRequest = (
    from: string,
    to: string,
    value: string,
    input: string = '0x'
  ): DetectionRequest => ({
    chainId: 1,
    hash: `0x${Math.random().toString(16).substring(2)}`,
    trace: {
      from,
      to,
      value,
      input,
      gas: '100000',
      gasUsed: '50000',
      pre: {
        [from]: {
          balance: '10000000000000000000'
        },
        [to]: {
          balance: '5000000000000000000'
        }
      },
      post: {
        [from]: {
          balance: (BigInt('10000000000000000000') - BigInt(value)).toString()
        },
        [to]: {
          balance: (BigInt('5000000000000000000') + BigInt(value)).toString()
        }
      }
    }
  })

  describe('Regular User Scenarios', () => {
    it('should not require 2FA for normal transaction amount', async () => {
      const request = createTransactionRequest(
        userProfiles.regularUser.address,
        '0x0000999988887777666655554444333322221111',
        userProfiles.regularUser.typicalTransactionValue
      )

      const result = DetectionService.detect(request)
      expect(result.detected).toBe(false)
      expect(result.message).toContain('no 2FA required')
    })

    it('should require 2FA for high value transaction', async () => {
      const request = createTransactionRequest(
        userProfiles.regularUser.address,
        '0x0000999988887777666655554444333322221111',
        '2000000000000000000' // 2 ETH
      )

      const result = DetectionService.detect(request)
      expect(result.detected).toBe(true)
      expect(result.message).toContain('2FA verification required')

      // Verify with correct TOTP code
      const totpCode = TOTPService.generateTOTP(userProfiles.regularUser.totpSecret)
      const verificationResult = DetectionService.verifyTransaction({
        transactionId: result.transactionId,
        totpCode,
        timestamp: Date.now()
      })

      expect(verificationResult.success).toBe(true)
      expect(verificationResult.status).toBe(TransactionVerificationStatus.VERIFIED)
    })

    it('should reject invalid TOTP code', async () => {
      const request = createTransactionRequest(
        userProfiles.regularUser.address,
        '0x0000999988887777666655554444333322221111',
        '2000000000000000000'
      )

      const result = DetectionService.detect(request)
      const verificationResult = DetectionService.verifyTransaction({
        transactionId: result.transactionId,
        totpCode: '000000',
        timestamp: Date.now()
      })

      expect(verificationResult.success).toBe(false)
      expect(verificationResult.message).toContain('Invalid verification code')
    })
  })

  describe('Whale User Scenarios', () => {
    it('should not require 2FA for typical whale transaction', async () => {
      const request = createTransactionRequest(
        userProfiles.whaleUser.address,
        '0x0000999988887777666655554444333322221111',
        userProfiles.whaleUser.typicalTransactionValue
      )

      const result = DetectionService.detect(request)
      expect(result.detected).toBe(false)
    })

    it('should require 2FA for unusually high transaction', async () => {
      const request = createTransactionRequest(
        userProfiles.whaleUser.address,
        '0x0000999988887777666655554444333322221111',
        '10000000000000000000' // 10 ETH
      )

      const result = DetectionService.detect(request)
      expect(result.detected).toBe(true)
    })
  })

  describe('DeFi User Scenarios', () => {
    it('should require 2FA for sensitive DeFi operations', async () => {
      const request = createTransactionRequest(
        userProfiles.defiUser.address,
        '0x0000999988887777666655554444333322221111',
        userProfiles.defiUser.typicalTransactionValue,
        '0xf2fde38b0000000000000000000000001234567890123456789012345678901234567890' // transferOwnership
      )

      const result = DetectionService.detect(request)
      expect(result.detected).toBe(true)
      expect(result.message).toContain('2FA verification required')
    })

    it('should not require 2FA for regular DeFi operations', async () => {
      const request = createTransactionRequest(
        userProfiles.defiUser.address,
        '0x0000999988887777666655554444333322221111',
        '100000000000000000', // 0.1 ETH
        '0x70a08231000000000000000000000000a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4' // balanceOf
      )

      const result = DetectionService.detect(request)
      expect(result.detected).toBe(false)
    })
  })

  describe('Multi-step Transaction Scenarios', () => {
    it('should maintain verification status across multiple steps', async () => {
      // Step 1: Initial high-value transaction
      const request1 = createTransactionRequest(
        userProfiles.regularUser.address,
        '0x0000999988887777666655554444333322221111',
        '2000000000000000000'
      )

      const result1 = DetectionService.detect(request1)
      expect(result1.detected).toBe(true)

      // Step 2: Verify with TOTP
      const totpCode = TOTPService.generateTOTP(userProfiles.regularUser.totpSecret)
      const verificationResult = DetectionService.verifyTransaction({
        transactionId: result1.transactionId,
        totpCode,
        timestamp: Date.now()
      })

      expect(verificationResult.success).toBe(true)

      // Step 3: Check status
      const statusResult = DetectionService.getTransactionVerificationStatus(result1.transactionId)
      expect(statusResult.status).toBe(TransactionVerificationStatus.VERIFIED)
    })

    it('should handle concurrent transactions correctly', async () => {
      // Transaction 1
      const request1 = createTransactionRequest(
        userProfiles.regularUser.address,
        '0x0000999988887777666655554444333322221111',
        '2000000000000000000'
      )

      // Transaction 2
      const request2 = createTransactionRequest(
        userProfiles.regularUser.address,
        '0x0000999988887777666655554444333322221111',
        '3000000000000000000'
      )

      const result1 = DetectionService.detect(request1)
      const result2 = DetectionService.detect(request2)

      expect(result1.transactionId).not.toBe(result2.transactionId)
      expect(result1.detected).toBe(true)
      expect(result2.detected).toBe(true)

      // Verify both transactions
      const totpCode = TOTPService.generateTOTP(userProfiles.regularUser.totpSecret)
      
      const verification1 = DetectionService.verifyTransaction({
        transactionId: result1.transactionId,
        totpCode,
        timestamp: Date.now()
      })

      const verification2 = DetectionService.verifyTransaction({
        transactionId: result2.transactionId,
        totpCode,
        timestamp: Date.now()
      })

      expect(verification1.success).toBe(true)
      expect(verification2.success).toBe(true)
    })
  })
}) 