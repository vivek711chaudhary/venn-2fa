import { verifyTOTP } from '../utils/totp';

const API_BASE_URL = 'http://localhost:5000';

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

export default api; 