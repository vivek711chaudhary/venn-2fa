import React from 'react';
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
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import TransactionForm from '../components/TransactionForm';

const WhaleUserDemo = () => {
  const handleTransaction = async (formData) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const amount = parseFloat(formData.amount);
    if (amount > 5) {
      throw new Error('Transactions over 5 ETH require additional verification steps. Please use the Multi-Step Demo for high-value transactions.');
    }
    
    // In a real application, this would call your backend API
    console.log('Transaction submitted:', formData);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Whale User Demo
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Experience how our system handles high-value transactions with enhanced security measures.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <TransactionForm onSubmit={handleTransaction} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Enhanced Security Features
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
                    secondary="Transactions over 5 ETH are restricted and require multi-step verification"
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
                Note: For transactions over 5 ETH, please use the Multi-Step Demo to experience our complete verification process.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default WhaleUserDemo; 