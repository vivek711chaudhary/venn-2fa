import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import pages
import Home from './pages/Home';
import RegularUserDemo from './pages/RegularDemo';
import WhaleUserDemo from './pages/WhaleDemo';
import DefiUserDemo from './pages/DefiUserDemo';
import MultiStepDemo from './pages/MultiStepDemo';
import TOTPSetupPage from './pages/TOTPSetupPage';
import TransactionExplorer from './pages/TransactionExplorer';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Venn 2FA Demo
            </Typography>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/regular-user">Regular User</Button>
            <Button color="inherit" component={Link} to="/whale-user">Whale User</Button>
            <Button color="inherit" component={Link} to="/defi-user">DeFi User</Button>
            <Button color="inherit" component={Link} to="/multi-step">Multi-Step</Button>
            <Button color="inherit" component={Link} to="/totp-setup">TOTP Setup</Button>
            <Button color="inherit" component={Link} to="/explorer">Explorer</Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ my: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/regular-user" element={<RegularUserDemo />} />
              <Route path="/whale-user" element={<WhaleUserDemo />} />
              <Route path="/defi-user" element={<DefiUserDemo />} />
              <Route path="/multi-step" element={<MultiStepDemo />} />
              <Route path="/totp-setup" element={<TOTPSetupPage />} />
              <Route path="/explorer" element={<TransactionExplorer />} />
            </Routes>
          </Box>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App; 