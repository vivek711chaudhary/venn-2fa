import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const Home = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Venn 2FA Demo
        </Typography>
        
        <Typography variant="h5" color="text.secondary" paragraph align="center">
          Experience our intelligent two-factor authentication system that protects your crypto transactions
        </Typography>

        <Paper sx={{ p: 4, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
          <Typography variant="h5" gutterBottom>
            Intelligent Transaction Protection
          </Typography>
          <Typography variant="body1" paragraph>
            Our system automatically analyzes every transaction for risk factors including high values, 
            suspicious contracts, and unusual patterns. High-risk transactions require two-factor 
            authentication, keeping your assets secure without slowing down everyday transactions.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            component={RouterLink} 
            to="/multi-step"
            sx={{ mt: 1 }}
          >
            Try Multi-Step Demo
          </Button>
        </Paper>

        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Choose a Demo Experience
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  Regular User
                </Typography>
                <Typography>
                  Standard transactions with minimal verification for everyday users.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/regular-user"
                  fullWidth
                >
                  Try Demo
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <MonetizationOnIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  Whale User
                </Typography>
                <Typography>
                  High-value transaction protection for significant asset transfers.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/whale-user"
                  fullWidth
                >
                  Try Demo
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <AccountTreeIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  DeFi User
                </Typography>
                <Typography>
                  Smart contract interaction analysis for DeFi transactions.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/defi-user"
                  fullWidth
                >
                  Try Demo
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <VerifiedUserIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  Multi-Step
                </Typography>
                <Typography>
                  Complete 2FA workflow for high-risk transaction verification.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/multi-step"
                  fullWidth
                >
                  Try Demo
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 