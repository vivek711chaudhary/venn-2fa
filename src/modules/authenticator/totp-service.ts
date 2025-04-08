import { createHmac, randomBytes } from 'crypto'

/**
 * TOTPService
 * 
 * A service for generating and validating Time-based One-Time Passwords (TOTP)
 * compatible with authenticator apps like Google Authenticator, Authy, etc.
 */
export class TOTPService {
  private static readonly DEFAULT_TIME_STEP = 30 // Default time step in seconds
  private static readonly DEFAULT_DIGITS = 6 // Default number of digits in the OTP
  private static readonly DEFAULT_WINDOW = 1 // Default time window for validation (allow +/- 1 step)

  /**
   * Generate a TOTP code
   * 
   * @param secret The secret key (base32 encoded)
   * @param timeStep Time step in seconds (default: 30)
   * @param digits Number of digits in the TOTP code (default: 6)
   * @returns The TOTP code
   */
  public static generateTOTP(
    secret: string,
    timeStep: number = this.DEFAULT_TIME_STEP,
    digits: number = this.DEFAULT_DIGITS
  ): string {
    const counter = Math.floor(Date.now() / 1000 / timeStep)
    return this.generateHOTP(secret, counter, digits)
  }

  /**
   * Validate a TOTP code
   * 
   * @param code The TOTP code to validate
   * @param secret The secret key (base32 encoded)
   * @param timeStep Time step in seconds (default: 30)
   * @param digits Number of digits in the TOTP code (default: 6)
   * @param window Time window for validation (default: 1, allowing one step before and after)
   * @returns True if the code is valid, false otherwise
   */
  public static validateTOTP(
    code: string,
    secret: string,
    timeStep: number = this.DEFAULT_TIME_STEP,
    digits: number = this.DEFAULT_DIGITS,
    window: number = this.DEFAULT_WINDOW
  ): boolean {
    if (code.length !== digits || !/^\d+$/.test(code)) {
      return false
    }

    const counter = Math.floor(Date.now() / 1000 / timeStep)
    
    // Check codes in the time window
    for (let i = -window; i <= window; i++) {
      const currentCounter = counter + i
      const expectedCode = this.generateHOTP(secret, currentCounter, digits)
      
      if (expectedCode === code) {
        return true
      }
    }
    
    return false
  }

  /**
   * Generate a new TOTP secret key
   * 
   * @returns A base32 encoded secret key
   */
  public static generateSecret(): string {
    // Generate 20 random bytes (160 bits)
    const buffer = randomBytes(20)
    return this.base32Encode(buffer)
  }

  /**
   * Generate an HMAC-based One-Time Password (HOTP)
   * 
   * @param secret The secret key (base32 encoded)
   * @param counter The counter value
   * @param digits Number of digits in the OTP
   * @returns The HOTP code
   */
  private static generateHOTP(secret: string, counter: number, digits: number): string {
    // Decode the base32 secret
    const secretBytes = this.base32Decode(secret)
    
    // Convert counter to buffer
    const counterBuffer = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) {
      counterBuffer[7 - i] = counter & 0xff
      counter = counter >> 8
    }
    
    // Create HMAC-SHA1
    const hmac = createHmac('sha1', secretBytes)
    hmac.update(counterBuffer)
    const hmacResult = hmac.digest()
    
    // Generate HOTP value
    const offset = hmacResult[hmacResult.length - 1] & 0xf
    const code = 
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)
    
    // Convert to the specified number of digits
    const modulo = Math.pow(10, digits)
    return (code % modulo).toString().padStart(digits, '0')
  }

  /**
   * Encode a buffer as a base32 string
   * 
   * @param buffer The buffer to encode
   * @returns The base32 encoded string
   */
  private static base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let result = ''
    let bits = 0
    let value = 0
    
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i]
      bits += 8
      
      while (bits >= 5) {
        bits -= 5
        result += alphabet[(value >> bits) & 0x1f]
      }
    }
    
    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 0x1f]
    }
    
    return result
  }

  /**
   * Decode a base32 string to a buffer
   * 
   * @param str The base32 encoded string
   * @returns The decoded buffer
   */
  private static base32Decode(str: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const cleanedStr = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
    const result = []
    let bits = 0
    let value = 0
    
    for (let i = 0; i < cleanedStr.length; i++) {
      const char = cleanedStr[i]
      const index = alphabet.indexOf(char)
      if (index === -1) continue
      
      value = (value << 5) | index
      bits += 5
      
      if (bits >= 8) {
        bits -= 8
        result.push((value >> bits) & 0xff)
      }
    }
    
    return Buffer.from(result)
  }
}
