import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { store } from './store';
import AuthWrapper from './components/auth/AuthWrapper';
import Layout from './components/layout/Layout';
import TradingDashboard from './components/trading/TradingDashboard';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#0a0e27',
      paper: '#1a1d3a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <AuthWrapper>
            <Layout>
              <TradingDashboard />
            </Layout>
          </AuthWrapper>
        </Box>
      </ThemeProvider>
    </Provider>
  );
}

export default App;