import React from 'react';
import { Container, Typography, Box, Paper, Alert } from '@mui/material';
import TOTPSetup from '../components/TOTPSetup';

const TOTPSetupPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Two-Factor Authentication Setup
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Note:</strong> This is a demonstration of the TOTP 2FA setup process. 
            Since the backend API doesn't have the TOTP endpoints implemented yet, 
            we're using mock data to simulate the process.
          </Typography>
        </Alert>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            How TOTP 2FA Works
          </Typography>
          
          <Typography variant="body1" paragraph>
            Time-based One-Time Password (TOTP) is a common method for two-factor authentication. 
            Here's how the process works:
          </Typography>
          
          <Box component="ol" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Secret Generation:</strong> The server generates a unique secret key for your account.
                This secret is used to create time-based codes.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Secure Setup:</strong> You add this secret to an authenticator app (like Google Authenticator
                or Authy) by scanning a QR code or manually entering the secret key.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Code Generation:</strong> The authenticator app uses the secret key and the current time
                to generate a 6-digit code that changes every 30 seconds.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Verification:</strong> When performing sensitive actions (like logging in or transferring funds),
                you're prompted to enter the current code from your authenticator app.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Security:</strong> Since the code changes every 30 seconds and requires physical access to your
                mobile device, this adds a strong second factor of authentication beyond just your password.
              </Typography>
            </li>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            TOTP Implementation Details
          </Typography>
          
          <Typography variant="body1" paragraph>
            In a production environment, the TOTP process would work as follows:
          </Typography>
          
          <Box component="ol" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Backend:</strong> The server would use a library like <code>speakeasy</code> or <code>otplib</code> to generate 
                a random secret and create QR codes. The secret would be stored securely in the database, associated with the user's account.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Frontend:</strong> The frontend would display the QR code and secret to the user, allowing them to set up their 
                authenticator app. After setup, the user would verify their setup by entering a code from their app.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Verification:</strong> When a user needs to perform a sensitive action, the server would generate a TOTP code 
                using the stored secret and compare it with the code provided by the user. If they match, the action is allowed.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Time Window:</strong> TOTP allows for a small time window (typically ±30 seconds) to account for clock 
                differences between the server and the user's device.
              </Typography>
            </li>
          </Box>
        </Paper>
        
        <TOTPSetup />
      </Box>
    </Container>
  );
};

export default TOTPSetupPage; 