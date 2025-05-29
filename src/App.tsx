import { useMemo, useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { store, RootState } from './store';
import { webSocketService } from './services/websocketService';
import AuthWrapper from './components/auth/AuthWrapper';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import StrategyConfiguration from './pages/StrategyConfiguration';
import StrategyManagement from './pages/StrategyManagement';
import Backtesting from './pages/Backtesting';
import SystemStatus from './pages/SystemStatus';

const AppContent: React.FC = () => {
  const darkMode = useSelector((state: RootState) => state.theme.darkMode);

  // Initialize WebSocket connections when app starts
  useEffect(() => {
    console.log('Initializing WebSocket connections...');
    try {
      webSocketService.connect();
      console.log('WebSocket connections initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebSocket connections:', error);
    }

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connections...');
      webSocketService.disconnect();
    };
  }, []);

  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
        ...(darkMode && {
          background: {
            default: '#0a0e27',
            paper: '#1a1d3a',
          },
        }),
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    }), [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <AuthWrapper>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/strategy-configuration" element={<StrategyConfiguration />} />
                <Route path="/strategy-management" element={<StrategyManagement />} />
                <Route path="/backtesting" element={<Backtesting />} />
                <Route path="/system-status" element={<SystemStatus />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </AuthWrapper>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;