// Simple TOTP implementation for demo purposes
// In a production environment, use a proper TOTP library

// Base32 character set
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Convert base32 string to bytes
function base32ToBytes(base32) {
  let bits = '';
  let bytes = [];

  for (let i = 0; i < base32.length; i++) {
    const val = BASE32_CHARS.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i < bits.length - 7; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }

  return new Uint8Array(bytes);
}

// Generate a TOTP code from a secret
export function generateTOTP(secret) {
  // Get current time in seconds, divided by 30 (TOTP time step)
  const timeStep = 30;
  const timeCounter = Math.floor(Date.now() / 1000 / timeStep);
  
  // Convert counter to bytes (8 bytes, big-endian)
  const counterBytes = new Uint8Array(8);
  for (let i = counterBytes.length - 1; i >= 0; i--) {
    counterBytes[i] = timeCounter & 0xff;
    timeCounter >>= 8;
  }
  
  // Convert secret from base32 to bytes
  const secretBytes = base32ToBytes(secret);
  
  // In a real implementation, we would use HMAC-SHA1 here
  // For demo purposes, we'll use a simple hash function
  const hash = simpleHash(secretBytes, counterBytes);
  
  // Get the last 4 bits of the hash
  const offset = hash[hash.length - 1] & 0xf;
  
  // Get 4 bytes starting at the offset
  const binary = ((hash[offset] & 0x7f) << 24) |
                ((hash[offset + 1] & 0xff) << 16) |
                ((hash[offset + 2] & 0xff) << 8) |
                (hash[offset + 3] & 0xff);
  
  // Generate 6-digit code
  const code = binary % 1000000;
  return code.toString().padStart(6, '0');
}

// Simple hash function for demo purposes
// In a real implementation, use HMAC-SHA1
function simpleHash(key, data) {
  const result = new Uint8Array(20); // SHA1 produces 20 bytes
  
  // Simple XOR-based hash for demo
  for (let i = 0; i < result.length; i++) {
    result[i] = key[i % key.length] ^ data[i % data.length];
  }
  
  return result;
}

// Verify a TOTP code
export function verifyTOTP(secret, code) {
  // Generate the current TOTP code
  const currentCode = generateTOTP(secret);
  
  // Compare the codes
  return code === currentCode;
} 