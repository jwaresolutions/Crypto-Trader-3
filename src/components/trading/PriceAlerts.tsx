import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  NotificationsActive,
  Add,
  Delete,
  Edit,
  TrendingUp,
  TrendingDown,
  NotificationImportant,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchMarketData } from '../../store/slices/marketDataSlice';

interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  note?: string;
}

const PriceAlerts: React.FC = () => {
  const { symbols } = useSelector((state: RootState) => state.marketData);
  const dispatch = useDispatch<AppDispatch>();
  
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: '1',
      symbol: 'BTCUSD',
      condition: 'above',
      targetPrice: 50000,
      currentPrice: 47500,
      isActive: true,
      createdAt: new Date().toISOString(),
      note: 'Resistance level breakout'
    },
    {
      id: '2',
      symbol: 'ETHUSD',
      condition: 'below',
      targetPrice: 3000,
      currentPrice: 3350,
      isActive: true,
      createdAt: new Date().toISOString(),
      note: 'Support level test'
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [formData, setFormData] = useState({
    symbol: 'BTCUSD',
    condition: 'above' as 'above' | 'below',
    targetPrice: '',
    note: ''
  });

  const availableSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'];

  // Initialize market data on mount
  useEffect(() => {
    dispatch(fetchMarketData(availableSymbols));
  }, [dispatch]);

  // Check for triggered alerts
  useEffect(() => {
    const checkAlerts = () => {
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => {
          if (!alert.isActive || alert.triggeredAt) return alert;

          const currentPrice = symbols?.[alert.symbol]?.price || alert.currentPrice;
          const isTriggered = 
            (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
            (alert.condition === 'below' && currentPrice <= alert.targetPrice);

          if (isTriggered) {
            // Trigger notification
            if (soundEnabled) {
              // Play sound (in a real app, you'd play an actual sound)
              console.log(`🔔 ALERT TRIGGERED: ${alert.symbol} ${alert.condition} $${alert.targetPrice}`);
            }

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Price Alert: ${alert.symbol}`, {
                body: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice}`,
                icon: '/favicon.ico'
              });
            }

            return {
              ...alert,
              triggeredAt: new Date().toISOString(),
              isActive: false,
              currentPrice
            };
          }

          return { ...alert, currentPrice };
        })
      );
    };

    const interval = setInterval(checkAlerts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [symbols, soundEnabled]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleOpenDialog = (alert?: PriceAlert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        symbol: alert.symbol,
        condition: alert.condition,
        targetPrice: alert.targetPrice.toString(),
        note: alert.note || ''
      });
    } else {
      setEditingAlert(null);
      setFormData({
        symbol: 'BTCUSD',
        condition: 'above',
        targetPrice: '',
        note: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAlert(null);
    setFormData({
      symbol: 'BTCUSD',
      condition: 'above',
      targetPrice: '',
      note: ''
    });
  };

  const handleSaveAlert = () => {
    const targetPrice = parseFloat(formData.targetPrice);
    if (!targetPrice || targetPrice <= 0) return;

    const currentPrice = symbols?.[formData.symbol]?.price || 0;
    
    if (editingAlert) {
      // Update existing alert
      setAlerts(prev => prev.map(alert => 
        alert.id === editingAlert.id 
          ? {
              ...alert,
              symbol: formData.symbol,
              condition: formData.condition,
              targetPrice,
              note: formData.note,
              currentPrice,
              isActive: true,
              triggeredAt: undefined
            }
          : alert
      ));
    } else {
      // Create new alert
      const newAlert: PriceAlert = {
        id: Date.now().toString(),
        symbol: formData.symbol,
        condition: formData.condition,
        targetPrice,
        currentPrice,
        isActive: true,
        createdAt: new Date().toISOString(),
        note: formData.note
      };
      setAlerts(prev => [...prev, newAlert]);
    }

    handleCloseDialog();
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive, triggeredAt: undefined }
        : alert
    ));
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price >= 1000 ? 0 : 2,
      maximumFractionDigits: price >= 1000 ? 0 : price >= 1 ? 2 : 4
    }).format(price);
  };

  const getAlertStatus = (alert: PriceAlert) => {
    if (alert.triggeredAt) {
      return { color: 'success' as const, label: 'Triggered', icon: <NotificationImportant /> };
    }
    if (!alert.isActive) {
      return { color: 'default' as const, label: 'Inactive', icon: <VolumeOff /> };
    }
    return { color: 'primary' as const, label: 'Active', icon: <NotificationsActive /> };
  };

  const activeAlertsCount = alerts.filter(alert => alert.isActive).length;
  const triggeredAlertsCount = alerts.filter(alert => alert.triggeredAt).length;

  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActive />
            Price Alerts
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`${activeAlertsCount} Active`} 
              color="primary" 
              size="small" 
              variant="outlined"
            />
            {triggeredAlertsCount > 0 && (
              <Chip 
                label={`${triggeredAlertsCount} Triggered`} 
                color="success" 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {soundEnabled ? <VolumeUp /> : <VolumeOff />}
              Sound Alerts
            </Box>
          }
        />
      </Box>

      {/* Alerts List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {alerts.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No price alerts set. Create your first alert to get notified when prices hit your targets.
          </Alert>
        ) : (
          <List dense>
            {alerts.map((alert) => {
              const status = getAlertStatus(alert);
              const currentPrice = symbols?.[alert.symbol]?.price || alert.currentPrice;
              const progress = alert.condition === 'above' 
                ? Math.min((currentPrice / alert.targetPrice) * 100, 100)
                : Math.max(100 - ((currentPrice / alert.targetPrice) * 100), 0);

              return (
                <ListItem key={alert.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {alert.symbol.replace('USD', '/USD')}
                        </Typography>
                        <Chip
                          icon={status.icon}
                          label={status.label}
                          color={status.color}
                          size="small"
                          variant="outlined"
                        />
                        {alert.condition === 'above' ? (
                          <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                        ) : (
                          <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Alert when {alert.condition} {formatPrice(alert.targetPrice)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Current: {formatPrice(currentPrice)}
                        </Typography>
                        {alert.note && (
                          <Typography variant="caption" color="text.secondary">
                            Note: {alert.note}
                          </Typography>
                        )}
                        {alert.triggeredAt && (
                          <Typography variant="caption" color="success.main">
                            Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={alert.isActive ? "Deactivate" : "Activate"}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleAlert(alert.id)}
                          color={alert.isActive ? "primary" : "default"}
                        >
                          {alert.isActive ? <NotificationsActive /> : <VolumeOff />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(alert)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAlert(alert.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Add Alert FAB */}
      <Tooltip title="Add Price Alert">
        <Fab
          color="primary"
          size="small"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>
      </Tooltip>

      {/* Add/Edit Alert Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAlert ? 'Edit Price Alert' : 'Create Price Alert'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Symbol</InputLabel>
              <Select
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                label="Symbol"
              >
                {availableSymbols.map((symbol) => (
                  <MenuItem key={symbol} value={symbol}>
                    {symbol.replace('USD', '/USD')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as 'above' | 'below' }))}
                label="Condition"
              >
                <MenuItem value="above">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Price goes above
                  </Box>
                </MenuItem>
                <MenuItem value="below">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDown />
                    Price goes below
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Target Price"
              type="number"
              value={formData.targetPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, targetPrice: e.target.value }))}
              inputProps={{ step: "0.01", min: "0" }}
            />

            <TextField
              fullWidth
              label="Note (Optional)"
              multiline
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Add a note about this alert..."
            />

            {formData.symbol && symbols?.[formData.symbol] && (
              <Alert severity="info">
                Current price: {formatPrice(symbols[formData.symbol].price)}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveAlert}
            variant="contained"
            disabled={!formData.targetPrice || parseFloat(formData.targetPrice) <= 0}
          >
            {editingAlert ? 'Update Alert' : 'Create Alert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PriceAlerts;
