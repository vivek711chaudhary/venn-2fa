import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  generateTOTPSecret,
  verifyTOTPCode,
  getCurrentTOTPCode,
  hasTOTPSetup,
  resetTOTP,
  USER_TYPES
} from '../services/totpService';

const TOTPSetup = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userType, setUserType] = useState(USER_TYPES.REGULAR);
  const [currentCode, setCurrentCode] = useState('');
  const [showCurrentCode, setShowCurrentCode] = useState(false);

  useEffect(() => {
    checkTOTPStatus();
  }, [userType]);

  const checkTOTPStatus = async () => {
    try {
      const isSetup = hasTOTPSetup(userType);
      setVerificationStatus(isSetup);
      if (isSetup) {
        setSuccess(`TOTP is already set up for ${userType} user`);
      }
    } catch (error) {
      console.error('Error checking TOTP status:', error);
    }
  };

  const handleUserTypeChange = (event, newValue) => {
    setUserType(newValue);
    setSecret('');
    setQrCode('');
    setVerificationCode('');
    setVerificationStatus(false);
    setError('');
    setSuccess('');
    setCurrentCode('');
    setShowCurrentCode(false);
  };

  const generateSecret = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await generateTOTPSecret(userType);
      setSecret(result.secret);
      setQrCode(result.qrCodeUrl);
      setSuccess('TOTP secret generated successfully. Please scan the QR code with your authenticator app.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setVerifying(true);
      setError('');
      
      const result = await verifyTOTPCode(userType, verificationCode);
      if (result.success) {
        setVerificationStatus(true);
        setSuccess('TOTP code verified successfully!');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const showCurrentTOTPCode = async () => {
    try {
      const code = getCurrentTOTPCode(userType);
      setCurrentCode(code);
      setShowCurrentCode(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetTOTP = () => {
    try {
      resetTOTP(userType);
      setSecret('');
      setQrCode('');
      setVerificationCode('');
      setVerificationStatus(false);
      setError('');
      setSuccess('TOTP setup has been reset');
      setCurrentCode('');
      setShowCurrentCode(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          TOTP Setup
        </Typography>

        <Tabs
          value={userType}
          onChange={handleUserTypeChange}
          sx={{ mb: 3 }}
        >
          {Object.values(USER_TYPES).map((type) => (
            <Tab key={type} label={type} value={type} />
          ))}
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {verificationStatus ? (
          <Box>
            <Typography variant="body1" gutterBottom>
              TOTP is set up for {userType} user
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={showCurrentTOTPCode}
                  disabled={showCurrentCode}
                >
                  Show Current Code
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleResetTOTP}
                >
                  Reset TOTP
                </Button>
              </Grid>
            </Grid>
            {showCurrentCode && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontFamily: 'monospace' }}>
                  {currentCode}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This code will change every 30 seconds
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            {!secret ? (
              <Button
                variant="contained"
                onClick={generateSecret}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate TOTP Secret'}
              </Button>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Scan this QR code with your authenticator app:
                </Typography>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img src={qrCode} alt="TOTP QR Code" style={{ maxWidth: '200px' }} />
                </Box>
                <Typography variant="body1" gutterBottom>
                  Or enter this secret manually:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    mb: 2
                  }}
                >
                  {secret}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Enter the 6-digit code from your authenticator app:
                </Typography>
                <TextField
                  fullWidth
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={verifyCode}
                  disabled={verifying || !verificationCode}
                >
                  {verifying ? <CircularProgress size={24} /> : 'Verify Code'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TOTPSetup; 