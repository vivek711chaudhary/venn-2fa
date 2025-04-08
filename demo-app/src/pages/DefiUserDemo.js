import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import TransactionForm from '../components/TransactionForm';
import api from '../services/api';

const DefiUserDemo = () => {
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
      
      console.log('🚀 Starting DeFi transaction submission process...');
      console.log('📝 Transaction data:', transactionData);
      
      // Add a dummy function signature to simulate a DeFi contract interaction
      const mockDeFiData = {
        ...transactionData,
        trace: {
          ...transactionData.trace,
          input: '0xf2fde38b0000000000000000000000001234567890123456789012345678901234567890' // transferOwnership function signature
        }
      };
      
      const response = await api.detectTransaction(mockDeFiData);
      console.log('📊 Transaction detection result:', response);

      if (response.detected) {
        console.log('🔒 High-risk DeFi transaction detected, 2FA required');
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
          DeFi User Demo
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          See how our system handles DeFi transactions with contract interaction analysis.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
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
                  <strong>DeFi Transaction Verification:</strong>
                </Typography>
                <Typography variant="body2">
                  High-risk smart contract interactions require additional verification.
                  Please enter the TOTP code from your authenticator app.
                </Typography>
              </Alert>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                DeFi Protection Features
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                DeFi transactions require special verification due to smart contract interactions.
              </Alert>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contract Analysis"
                    secondary="Automatic analysis of smart contract code and permissions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Function Call Detection"
                    secondary="Identification of high-risk function calls requiring additional verification"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Nested Call Tracing"
                    secondary="Detection of deep call chains that might hide malicious activities"
                  />
                </ListItem>
              </List>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Note: Our system verifies contract interactions to protect against common DeFi attacks like flash loan exploits, reentrancy, and approval scams.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Dialog open={showTOTPDialog} onClose={handleTOTPCancel}>
          <DialogTitle>Verify DeFi Transaction</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This contract interaction requires additional security verification.
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are attempting to call a sensitive contract function (transferOwnership).
            </Alert>
            <TextField
              autoFocus
              margin="dense"
              label="TOTP Code"
              type="text"
              fullWidth
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              helperText="Enter the 6-digit code from your authenticator app"
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
            <Button onClick={handleTOTPSubmit} variant="contained" color="warning">
              Verify
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DefiUserDemo; 