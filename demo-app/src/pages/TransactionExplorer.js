import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Link,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SecurityIcon from '@mui/icons-material/Security';
import GppBadIcon from '@mui/icons-material/GppBad';
import api from '../services/api';

const TransactionExplorer = () => {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [transactions, setTransactions] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(true);
  const [predefinedAddresses, setPredefinedAddresses] = useState([]);

  // Get chain configurations and predefined addresses
  useEffect(() => {
    const chainConfig = api.getChainConfig();
    setPredefinedAddresses(api.getPredefinedAddresses(chain));
  }, [chain]);

  // Handle address change
  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  // Handle chain change
  const handleChainChange = (event) => {
    setChain(event.target.value);
    setPredefinedAddresses(api.getPredefinedAddresses(event.target.value));
  };

  // Select a predefined address (renamed from 'usePredefinedAddress' to avoid ESLint hooks warning)
  const selectPredefinedAddress = (addr) => {
    setAddress(addr);
  };

  // Copy address to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  // Fetch and analyze transactions
  const fetchTransactions = async () => {
    if (!address) {
      setError('Please enter an address to explore');
      return;
    }

    setLoading(true);
    setError('');
    setShowHelp(false);
    
    try {
      const txs = await api.fetchTransactions(address, chain);
      
      if (txs.length === 0) {
        setError('No transactions found for this address');
        setTransactions([]);
        setAnalysisResults([]);
      } else {
        setTransactions(txs);
        
        // Analyze transactions for 2FA requirements
        const results = await api.analyzeTransactions(txs, chain);
        setAnalysisResults(results);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Format transaction value (from wei to ETH)
  const formatValue = (value) => {
    return (parseInt(value) / 1e18).toFixed(4);
  };
  
  // Open transaction in block explorer
  const openInExplorer = (txHash) => {
    const chainConfig = api.getChainConfig()[chain];
    window.open(`${chainConfig.blockExplorer}/tx/${txHash}`, '_blank');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transaction Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore blockchain transactions and see which ones would trigger 2FA requirements based on risk factors.
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                label="Wallet Address"
                fullWidth
                value={address}
                onChange={handleAddressChange}
                placeholder="0x..."
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Blockchain</InputLabel>
                <Select
                  value={chain}
                  onChange={handleChainChange}
                  label="Blockchain"
                >
                  <MenuItem value="ethereum">Ethereum Mainnet</MenuItem>
                  <MenuItem value="polygon">Polygon</MenuItem>
                  <MenuItem value="arbitrum">Arbitrum</MenuItem>
                  <MenuItem value="bsc">Binance Smart Chain</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={fetchTransactions}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                {loading ? 'Loading...' : 'Explore Transactions'}
              </Button>
            </Grid>
          </Grid>

          {predefinedAddresses.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Try with these addresses:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {predefinedAddresses.map((addr, index) => (
                  <Chip
                    key={index}
                    label={`${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`}
                    onClick={() => selectPredefinedAddress(addr)}
                    clickable
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {showHelp && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How to use this explorer
              </Typography>
              <Typography variant="body2" paragraph>
                1. Enter a blockchain wallet address or select one from the predefined options
              </Typography>
              <Typography variant="body2" paragraph>
                2. Select the blockchain network
              </Typography>
              <Typography variant="body2" paragraph>
                3. Click "Explore Transactions" to fetch and analyze the transactions
              </Typography>
              <Typography variant="body2">
                The analysis will show which transactions would trigger 2FA requirements based on the transaction value, 
                contract interactions, and other risk factors. Each transaction is assigned a risk score and user type.
              </Typography>
            </CardContent>
          </Card>
        )}

        {analysisResults.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Transaction Analysis Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analysisResults.filter(tx => tx.requires2FA).length} of {analysisResults.length} transactions require 2FA
              </Typography>
            </Box>
            
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction Hash</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Risk Score</TableCell>
                    <TableCell>User Type</TableCell>
                    <TableCell>2FA Required</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysisResults.map((tx) => (
                    <TableRow
                      key={tx.hash}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: tx.requires2FA ? 'rgba(255, 235, 59, 0.1)' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2">
                            {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                          </Typography>
                          <IconButton size="small" onClick={() => copyToClipboard(tx.hash)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{tx.value.toFixed(4)} ETH</TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.riskScore} 
                          color={
                            tx.riskScore >= 50 ? 'error' : 
                            tx.riskScore >= 20 ? 'warning' : 'success'
                          } 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{tx.userType}</TableCell>
                      <TableCell>
                        {tx.requires2FA ? 
                          <SecurityIcon color="warning" /> : 
                          <GppBadIcon color="disabled" />
                        }
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View in Block Explorer">
                          <IconButton onClick={() => openInExplorer(tx.hash)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Risk Factors
              </Typography>
              <Grid container spacing={2}>
                {analysisResults.slice(0, 4).map((tx, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Transaction: {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      {tx.riskFactors.length > 0 ? (
                        tx.riskFactors.map((factor, i) => (
                          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                            • {factor}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No significant risk factors detected
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default TransactionExplorer; 