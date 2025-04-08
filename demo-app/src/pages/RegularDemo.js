import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';
import TransactionForm from '../components/TransactionForm';
import api from '../services/api';

const RegularDemo = () => {
  const [transactionId, setTransactionId] = useState(null);
  const [showTOTPDialog, setShowTOTPDialog] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [error, setError] = useState('');
  const [showTOTPInfo, setShowTOTPInfo] = useState(false);
  const [totpError, setTotpError] = useState('');

  const handleTransactionSubmit = async (transactionData) => {
    try {
      // Clear previous transaction results
      setVerificationStatus('');
      setError('');
      setTotpError('');
      
      console.log('🚀 Starting transaction submission process...');
      console.log('📝 Transaction data:', transactionData);
      
      const response = await api.detectTransaction(transactionData);
      console.log('📊 Transaction detection result:', response);

      if (response.detected) {
        console.log('🔒 High-risk transaction detected, 2FA required');
        setTransactionId(response.transactionId);
        setShowTOTPDialog(true);
        setShowTOTPInfo(true);
        console.log('💡 Please enter TOTP code to verify transaction');
      } else {
        console.log('✅ Transaction approved without 2FA');
        setVerificationStatus('Transaction approved without 2FA');
      }
    } catch (error) {
      console.error('❌ Transaction submission failed:', error);
      setError(error.response?.data?.message || error.message || 'Failed to submit transaction');
    }
  };

  const handleTOTPSubmit = async () => {
    try {
      // Clear previous TOTP error
      setTotpError('');
      
      console.log('🔐 Starting TOTP verification process...');
      console.log('📝 Verification data:', { transactionId, totpCode });
      
      const response = await api.verifyTransaction(transactionId, totpCode);
      console.log('📊 Verification result:', response);

      if (response.success) {
        console.log('✅ Transaction verified successfully!');
        setVerificationStatus('Transaction verified successfully!');
        setShowTOTPDialog(false);
        setTotpCode('');
        setShowTOTPInfo(false);
      } else {
        console.log('❌ Invalid TOTP code');
        setTotpError('Invalid TOTP code. Please try again.');
      }
    } catch (error) {
      console.error('❌ TOTP verification failed:', error);
      setTotpError(error.response?.data?.message || error.message || 'Failed to verify transaction');
    }
  };

  const handleTOTPCancel = () => {
    console.log('❌ TOTP verification cancelled by user');
    setShowTOTPDialog(false);
    setTotpCode('');
    setTransactionId(null);
    setShowTOTPInfo(false);
    setTotpError('');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Regular User Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Test normal transactions and see how 2FA is triggered for high-value transfers.
          Try sending different amounts to see when additional verification is required.
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <TransactionForm onSubmit={handleTransactionSubmit} />
        </Paper>

        {verificationStatus && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {verificationStatus}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {showTOTPInfo && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>How to get your TOTP code:</strong>
            </Typography>
            <Typography variant="body2">
              In a real-world scenario, you would receive the TOTP code via:
            </Typography>
            <ul>
              <li>Email notification</li>
              <li>SMS message</li>
              <li>Authenticator app (Google Authenticator, Authy, etc.)</li>
            </ul>
            <Typography variant="body2">
              For this demo, you can use any 6-digit code. The backend will accept any code for demonstration purposes.
            </Typography>
          </Alert>
        )}

        <Dialog open={showTOTPDialog} onClose={handleTOTPCancel}>
          <DialogTitle>Enter 2FA Code</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="TOTP Code"
              type="text"
              fullWidth
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              helperText="Enter the 6-digit code you received via email, SMS, or authenticator app"
              error={!!totpError}
            />
            {totpError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {totpError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleTOTPCancel}>Cancel</Button>
            <Button onClick={handleTOTPSubmit} variant="contained">
              Verify
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li>Transactions under 1 ETH will proceed normally</li>
              <li>Transactions between 1-5 ETH will require email verification</li>
              <li>Transactions over 5 ETH will require both email and SMS verification</li>
              <li>First-time transfers to new addresses will always require verification</li>
            </ul>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegularDemo; 