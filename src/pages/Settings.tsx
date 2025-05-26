import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Switch, 
  ListItemSecondaryAction,
  Divider,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { CheckCircle, Error, Api, Assessment } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { toggleDarkMode } from '../store/slices/themeSlice';
import { alpacaService } from '../services/alpacaService';
import { polygonService } from '../services/polygonService';

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const darkMode = useSelector((state: RootState) => state.theme.darkMode);
  const [notifications, setNotifications] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  
  // API test states
  const [alpacaTestResult, setAlpacaTestResult] = React.useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  
  const [polygonTestResult, setPolygonTestResult] = React.useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
  };

  const testAlpacaAPI = async () => {
    setAlpacaTestResult({ status: 'testing' });
    try {
      const account = await alpacaService.getAccount();
      setAlpacaTestResult({ 
        status: 'success', 
        message: `Connected! Account: ${account.accountNumber} (${account.status})` 
      });
    } catch (error: any) {
      setAlpacaTestResult({ 
        status: 'error', 
        message: error.message || 'Failed to connect to Alpaca API' 
      });
    }
  };

  const testPolygonAPI = async () => {
    setPolygonTestResult({ status: 'testing' });
    try {
      console.log('Testing Polygon API connection...');
      const result = await polygonService.testConnection();
      
      setPolygonTestResult({ 
        status: result.success ? 'success' : 'error', 
        message: result.message
      });
    } catch (error: any) {
      console.error('Polygon API test error:', error);
      setPolygonTestResult({ 
        status: 'error', 
        message: `Connection failed: ${error.message || 'Unknown error'}` 
      });
    }
  };

  const getTestResultIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <CircularProgress size={20} />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return undefined;
    }
  };

  const getTestResultColor = (status: string): 'default' | 'success' | 'error' => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Use dark theme for the application"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    onChange={handleDarkModeToggle}
                    checked={darkMode}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Notifications"
                  secondary="Enable price alerts and order notifications"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    onChange={() => setNotifications(!notifications)}
                    checked={notifications}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Auto Refresh"
                  secondary="Automatically refresh market data"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    checked={autoRefresh}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Status & Testing
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Test your current API connections to ensure they're working properly.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Api />
                  <Typography variant="subtitle1">Alpaca Trading API</Typography>
                  {alpacaTestResult.status !== 'idle' && getTestResultIcon(alpacaTestResult.status) && (
                    <Chip 
                      icon={getTestResultIcon(alpacaTestResult.status)} 
                      label={alpacaTestResult.status === 'testing' ? 'Testing...' : alpacaTestResult.status}
                      color={getTestResultColor(alpacaTestResult.status)}
                      size="small"
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  onClick={testAlpacaAPI}
                  disabled={alpacaTestResult.status === 'testing'}
                  startIcon={alpacaTestResult.status === 'testing' ? <CircularProgress size={16} /> : <Api />}
                  size="small"
                >
                  Test Connection
                </Button>
              </Box>
              
              {alpacaTestResult.message && (
                <Alert 
                  severity={alpacaTestResult.status === 'success' ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  {alpacaTestResult.message}
                </Alert>
              )}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment />
                  <Typography variant="subtitle1">Polygon Market Data API</Typography>
                  {polygonTestResult.status !== 'idle' && getTestResultIcon(polygonTestResult.status) && (
                    <Chip 
                      icon={getTestResultIcon(polygonTestResult.status)} 
                      label={polygonTestResult.status === 'testing' ? 'Testing...' : polygonTestResult.status}
                      color={getTestResultColor(polygonTestResult.status)}
                      size="small"
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  onClick={testPolygonAPI}
                  disabled={polygonTestResult.status === 'testing'}
                  startIcon={polygonTestResult.status === 'testing' ? <CircularProgress size={16} /> : <Assessment />}
                  size="small"
                >
                  Test Connection
                </Button>
              </Box>
              
              {polygonTestResult.message && (
                <Alert 
                  severity={polygonTestResult.status === 'success' ? 'success' : 'error'}
                >
                  {polygonTestResult.message}
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
