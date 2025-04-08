import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// User types
export const USER_TYPES = {
  REGULAR: 'REGULAR',
  WHALE: 'WHALE',
  DEFI: 'DEFI',
  MULTI_STEP: 'MULTI_STEP'
};

// Store TOTP secrets in memory (in a real app, this would be in a secure database)
const totpSecrets = {
  [USER_TYPES.REGULAR]: null,
  [USER_TYPES.WHALE]: null,
  [USER_TYPES.DEFI]: null,
  [USER_TYPES.MULTI_STEP]: null
};

// Store verification status
const verificationStatus = {
  [USER_TYPES.REGULAR]: false,
  [USER_TYPES.WHALE]: false,
  [USER_TYPES.DEFI]: false,
  [USER_TYPES.MULTI_STEP]: false
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

// Generate a TOTP secret for a specific user type
export const generateTOTPSecret = async (userType) => {
  if (!USER_TYPES[userType]) {
    throw new Error('Invalid user type');
  }

  // Generate a random secret
  const secret = authenticator.generateSecret();
  
  // Store the secret
  totpSecrets[userType] = secret;
  
  // Generate QR code
  const otpauth = authenticator.keyuri(
    `user@example.com`,
    `Venn 2FA Demo - ${userType}`,
    secret
  );
  
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  
  return {
    secret,
    qrCodeUrl
  };
};

// Verify a TOTP code for a specific user type
export const verifyTOTPCode = async (userType, code) => {
  if (!USER_TYPES[userType]) {
    throw new Error('Invalid user type');
  }

  if (!totpSecrets[userType]) {
    throw new Error('TOTP secret not found. Please generate a new secret first.');
  }

  try {
    const isValid = authenticator.verify({
      token: code,
      secret: totpSecrets[userType]
    });

    if (isValid) {
      verificationStatus[userType] = true;
    }

    return {
      success: isValid,
      message: isValid ? 'TOTP code verified successfully' : 'Invalid TOTP code'
    };
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    throw new Error('Failed to verify TOTP code');
  }
};

// Get the current TOTP code for a specific user type (for testing purposes)
export const getCurrentTOTPCode = (userType) => {
  if (!USER_TYPES[userType]) {
    throw new Error('Invalid user type');
  }

  if (!totpSecrets[userType]) {
    throw new Error('TOTP secret not found. Please generate a new secret first.');
  }

  if (!verificationStatus[userType]) {
    throw new Error('TOTP not verified. Please complete verification first.');
  }

  try {
    return authenticator.generate(totpSecrets[userType]);
  } catch (error) {
    console.error('Error generating TOTP code:', error);
    throw new Error('Failed to generate TOTP code');
  }
};

// Check if a user type has TOTP set up
export const hasTOTPSetup = (userType) => {
  if (!USER_TYPES[userType]) {
    throw new Error('Invalid user type');
  }

  return totpSecrets[userType] !== null && verificationStatus[userType];
};

// Reset TOTP for a specific user type
export const resetTOTP = (userType) => {
  if (!USER_TYPES[userType]) {
    throw new Error('Invalid user type');
  }

  totpSecrets[userType] = null;
  verificationStatus[userType] = false;
}; 