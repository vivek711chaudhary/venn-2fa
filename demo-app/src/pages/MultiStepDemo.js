import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import TransactionForm from '../components/TransactionForm';
import api from '../services/api';

const steps = ['Initial Transaction', '2FA Verification', 'Confirmation'];

const MultiStepDemo = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [transaction, setTransaction] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleTransaction = async (transactionData) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 Starting multi-step transaction process...');
      console.log('📝 Transaction data:', transactionData);
      
      const amount = parseFloat(transactionData.trace.value) / 1e18;
      
      if (amount < 1) {
        throw new Error('Please enter an amount of at least 1 ETH for the multi-step demo to work properly.');
      }
      
      // Any transaction in this demo should trigger 2FA
      const response = await api.detectTransaction(transactionData);
      console.log('📊 Transaction detection result:', response);
      
      setTransaction(transactionData);
      setTransactionId(response.transactionId);
      setActiveStep(1);
    } catch (err) {
      console.error('❌ Transaction submission failed:', err);
      setError(err.message || 'An error occurred during transaction processing');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Starting multi-step TOTP verification process...');
      console.log('📝 Verification data:', { transactionId, verificationCode });
      
      const response = await api.verifyTransaction(transactionId, verificationCode);
      console.log('📊 Verification result:', response);
      
      if (response.success) {
        console.log('✅ Transaction verified successfully!');
        setVerificationSuccess(true);
        setActiveStep(2);
      } else {
        console.log('❌ Invalid TOTP code');
        throw new Error('Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error('❌ TOTP verification failed:', err);
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationCancel = () => {
    console.log('❌ Verification cancelled by user');
    setActiveStep(0);
    setTransaction(null);
    setVerificationCode('');
    setError('Transaction was canceled. Please start again to complete the transaction.');
    setTransactionId(null);
    setVerificationSuccess(false);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTransaction(null);
    setVerificationCode('');
    setError('');
    setTransactionId(null);
    setVerificationSuccess(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Multi-Step Transaction Demo
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Experience our enhanced security flow for high-risk transactions requiring 2FA.
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={activeStep === 2 ? 12 : 8}>
            <Paper sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {activeStep === 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Enter Transaction Details
                  </Typography>
                  <TransactionForm onSubmit={handleTransaction} />
                </>
              )}

              {activeStep === 1 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    2FA Verification Required
                  </Typography>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This transaction has been flagged as high-risk. Please enter the verification code from your authenticator app.
                  </Alert>
                  <Box component="form" onSubmit={handleVerificationSubmit} noValidate>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Transaction to: {transaction?.trace?.to}
                      <br />
                      Amount: {parseFloat(transaction?.trace?.value || '0') / 1e18} ETH
                    </Typography>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="verificationCode"
                      label="Verification Code"
                      name="verificationCode"
                      autoFocus
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      helperText="Enter the 6-digit code from your authenticator app"
                      error={!!error}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{ mt: 3, mb: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Verify Transaction'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleVerificationCancel}
                      sx={{ mb: 2 }}
                    >
                      Cancel Transaction
                    </Button>
                  </Box>
                </>
              )}

              {activeStep === 2 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Transaction Confirmed
                  </Typography>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Your transaction has been successfully verified and submitted.
                  </Alert>
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body1" paragraph>
                      Transaction Details:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Recipient: {transaction?.trace?.to}
                      <br />
                      Amount: {parseFloat(transaction?.trace?.value || '0') / 1e18} ETH
                      <br />
                      Transaction ID: {transactionId || Math.random().toString(36).substring(2, 15)}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      sx={{ mt: 2 }}
                    >
                      Start New Transaction
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          {activeStep !== 2 && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  About Multi-Step Verification
                </Typography>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  High-risk transactions require additional verification steps.
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Our system automatically detects high-risk transactions based on:
                  <ul>
                    <li>Transaction amount (over 5 ETH)</li>
                    <li>Destination address risk profile</li>
                    <li>Contract interaction complexity</li>
                    <li>User behavior patterns</li>
                  </ul>
                  When a high-risk transaction is detected, you'll be prompted to complete a 2FA verification step before the transaction can be processed.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default MultiStepDemo; 