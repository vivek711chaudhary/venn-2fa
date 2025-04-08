import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../services/api';

const TransactionCard = ({ 
  transaction, 
  onVerificationComplete,
  showVerificationForm = true
}) => {
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, failed
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit TOTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.verifyTransaction(transaction.transactionId, totpCode);
      setVerificationResult(result);
      
      if (result.success) {
        setVerificationStatus('verified');
        if (onVerificationComplete) {
          onVerificationComplete(transaction.transactionId, result);
        }
      } else {
        setVerificationStatus('failed');
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setVerificationStatus('failed');
      setError(err.response?.data?.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Transaction verified successfully!';
      case 'failed':
        return error || 'Verification failed';
      default:
        return '2FA verification required';
    }
  };

  return (
    <Card className={`transaction-card ${transaction.detected ? 'high-risk' : ''} ${verificationStatus === 'verified' ? 'verified' : ''}`}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Transaction {transaction.transactionId}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          From: {transaction.trace?.from}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          To: {transaction.trace?.to}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Value: {transaction.trace?.value ? `${BigInt(transaction.trace.value) / BigInt(10n ** 18n)} ETH` : 'N/A'}
        </Typography>
        
        {transaction.trace?.input && transaction.trace.input !== '0x' && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Function: {transaction.trace.input.substring(0, 10)}...
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Alert severity={getStatusColor()} sx={{ mb: 2 }}>
          {getStatusMessage()}
        </Alert>
        
        {showVerificationForm && transaction.detected && verificationStatus !== 'verified' && (
          <Box className="verification-form">
            <Typography variant="subtitle2" gutterBottom>
              Enter TOTP Code from your authenticator app
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="TOTP Code"
                variant="outlined"
                size="small"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                error={!!error}
                helperText={error}
                inputProps={{ maxLength: 6 }}
              />
              <Button 
                variant="contained" 
                onClick={handleVerify}
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify'}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Use the default secret: JBSWY3DPEHPK3PXP
            </Typography>
          </Box>
        )}
        
        {verificationResult && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Verification Result:</Typography>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(verificationResult, null, 2)}
            </pre>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionCard; 