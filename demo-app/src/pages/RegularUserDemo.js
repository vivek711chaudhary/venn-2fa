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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TransactionForm from '../components/TransactionForm';

const RegularUserDemo = () => {
  const handleTransaction = async (formData) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real application, this would call your backend API
    console.log('Transaction submitted:', formData);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Regular User Demo
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Experience how our system handles standard transactions for regular users.
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
                Standard Features
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                Standard transactions (below 1 ETH) typically don't require additional verification.
              </Alert>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fast Processing"
                    secondary="Standard transactions are processed quickly with minimal verification"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Low Transaction Fees"
                    secondary="Regular transactions incur standard network fees"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Basic Security"
                    secondary="Standard verification for regular transaction amounts"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RegularUserDemo; 