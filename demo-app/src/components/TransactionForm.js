import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';

const TransactionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.recipientAddress) {
      setError('Recipient address is required');
      return false;
    }
    if (!formData.amount) {
      setError('Amount is required');
      return false;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Clear any existing messages when submitting
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Format the request to match the API's expected format
      const requestData = {
        chainId: 1, // Number, not string
        hash: "0x" + Math.random().toString(16).substring(2, 10), // Shorter hash like in the example
        trace: {
          from: "0x1111222233334444555566667777888899990000", // Example sender address
          to: formData.recipientAddress,
          value: (parseFloat(formData.amount) * 1e18).toString(), // Convert ETH to Wei
          input: "0x",
          gas: "100000",
          gasUsed: "50000",
          pre: {
            "0x1111222233334444555566667777888899990000": {
              balance: "10000000000000000000"
            },
            [formData.recipientAddress]: {
              balance: "5000000000000000000"
            }
          },
          post: {
            "0x1111222233334444555566667777888899990000": {
              balance: (10000000000000000000 - parseFloat(formData.amount) * 1e18).toString()
            },
            [formData.recipientAddress]: {
              balance: (5000000000000000000 + parseFloat(formData.amount) * 1e18).toString()
            }
          }
        }
      };
      
      console.log('Sending request data:', requestData);
      await onSubmit(requestData);
      setSuccess('Transaction submitted successfully');
      setFormData({ 
        recipientAddress: '', 
        amount: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to submit transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        New Transaction
      </Typography>

      <TextField
        required
        fullWidth
        label="Recipient Address"
        name="recipientAddress"
        value={formData.recipientAddress}
        onChange={handleChange}
        margin="normal"
        placeholder="0x..."
        error={!!error && !formData.recipientAddress}
        helperText={error && !formData.recipientAddress ? error : ''}
      />

      <TextField
        required
        fullWidth
        label="Amount (ETH)"
        name="amount"
        type="number"
        value={formData.amount}
        onChange={handleChange}
        margin="normal"
        inputProps={{ step: "0.01", min: "0" }}
        error={!!error && !formData.amount}
        helperText={error && !formData.amount ? error : ''}
      />

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Submit Transaction'}
      </Button>
    </Box>
  );
};

export default TransactionForm; 