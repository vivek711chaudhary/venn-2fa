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
import SecurityIcon from '@mui/icons-material/Security';
import TransactionForm from '../components/TransactionForm';
import api from '../services/api';

const WhaleDemo = () => {
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
      
      console.log('🚀 Starting whale transaction submission process...');
      console.log('📝 Transaction data:', transactionData);
      
      const amount = parseFloat(transactionData.trace.value) / 1e18;
      
      if (amount > 10) {
        throw new Error('Transactions over 10 ETH require multi-step verification. Please use the Multi-Step Demo.');
      }
      
      const response = await api.detectTransaction(transactionData);
      console.log('📊 Transaction detection result:', response);

      if (response.detected) {
        console.log('🔒 High-risk whale transaction detected, 2FA required');
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
          Whale Transaction Demo
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Experience how our system handles high-value transactions with enhanced security measures.
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
                  <strong>Whale Transaction Verification:</strong>
                </Typography>
                <Typography variant="body2">
                  High-value transactions from whale wallets require additional verification.
                  Please enter the TOTP code from your authenticator app.
                </Typography>
              </Alert>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Security Features
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                This demo showcases enhanced security measures for high-value transactions.
              </Alert>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Transaction Limits"
                    secondary="Transactions over 10 ETH require multi-step verification"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Enhanced Monitoring"
                    secondary="All transactions are monitored for suspicious patterns"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Risk Assessment"
                    secondary="Each transaction is evaluated based on amount, recipient history, and network patterns"
                  />
                </ListItem>
              </List>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Note: For transactions over 10 ETH, please use the Multi-Step Demo to experience our complete verification process.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Dialog open={showTOTPDialog} onClose={handleTOTPCancel}>
          <DialogTitle>Verify Whale Transaction</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Due to the high-value nature of this transaction, additional verification is required.
            </Typography>
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
            <Button onClick={handleTOTPSubmit} variant="contained" color="primary">
              Verify
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default WhaleDemo; 