import { TOTPService } from '../src/modules/authenticator/totp-service'

describe('TOTPService', () => {
  describe('TOTP Generation and Validation', () => {
    it('should generate a valid TOTP secret', () => {
      const secret = TOTPService.generateSecret()
      
      // Base32 regex pattern check (uppercase letters A-Z and numbers 2-7)
      expect(secret).toMatch(/^[A-Z2-7]+$/)
      expect(secret.length).toBeGreaterThanOrEqual(16) // Should be at least 16 chars
    })

    it('should generate a 6-digit TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP' // Test secret
      const code = TOTPService.generateTOTP(secret)
      
      expect(code).toMatch(/^\d{6}$/) // Should be 6 digits
    })

    it('should validate a correct TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP' // Test secret
      const code = TOTPService.generateTOTP(secret)
      
      const isValid = TOTPService.validateTOTP(code, secret)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP' // Test secret
      const incorrectCode = '000000' // Deliberately wrong code
      
      const isValid = TOTPService.validateTOTP(incorrectCode, secret)
      expect(isValid).toBe(false)
    })

    it('should reject a TOTP code with incorrect format', () => {
      const secret = 'JBSWY3DPEHPK3PXP' // Test secret
      const incorrectCode = '12345' // 5 digits instead of 6
      
      const isValid = TOTPService.validateTOTP(incorrectCode, secret)
      expect(isValid).toBe(false)
    })

    it('should reject a TOTP code with non-numeric characters', () => {
      const secret = 'JBSWY3DPEHPK3PXP' // Test secret
      const incorrectCode = '12345A' // Contains a letter
      
      const isValid = TOTPService.validateTOTP(incorrectCode, secret)
      expect(isValid).toBe(false)
    })
  })

  describe('Base32 Encoding and Decoding', () => {
    it('should correctly encode and decode values with base32', () => {
      // Use the public methods to test the private methods indirectly
      const secret = TOTPService.generateSecret()
      const code1 = TOTPService.generateTOTP(secret)
      const code2 = TOTPService.generateTOTP(secret)
      
      // The codes should be valid for the secret
      expect(TOTPService.validateTOTP(code1, secret)).toBe(true)
      expect(TOTPService.validateTOTP(code2, secret)).toBe(true)
    })
  })
})
