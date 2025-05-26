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
  TextField,
  Button,
  Grid
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { toggleDarkMode } from '../store/slices/themeSlice';

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const darkMode = useSelector((state: RootState) => state.theme.darkMode);
  const [notifications, setNotifications] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
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
              API Configuration
            </Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Alpaca API Key"
                type="password"
                margin="normal"
                helperText="Your Alpaca API key for paper trading"
              />
              <TextField
                fullWidth
                label="Polygon API Key"
                type="password"
                margin="normal"
                helperText="Your Polygon API key for market data"
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                fullWidth
              >
                Save API Keys
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
