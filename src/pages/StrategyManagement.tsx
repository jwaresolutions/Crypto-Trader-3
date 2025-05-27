import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  toggleStrategy,
  toggleAutoTrading,
  updateAutoTradingSettings,
  StrategySignal,
  AutoTradingSettings,
} from '../store/slices/strategiesSlice';

const StrategyManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { strategies, autoTradingSettings, isLoading, error } = useSelector((state: RootState) => state.strategies);
  
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<AutoTradingSettings>(autoTradingSettings);

  // Calculate strategy statistics
  const enabledStrategies = strategies.filter(s => s.enabled);
  const totalSignals = strategies.reduce((sum, s) => sum + s.performance.totalSignals, 0);
  const averageWinRate = strategies.length > 0 
    ? strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / strategies.length 
    : 0;

  // Get aggregated signal
  const getAggregatedSignal = (): StrategySignal => {
    const enabledSignals = enabledStrategies.map(s => s.currentSignal).filter(s => s !== 'none');
    
    if (enabledSignals.length < autoTradingSettings.signalAggregation.minimumSignals) {
      return 'none';
    }

    switch (autoTradingSettings.signalAggregation.method) {
      case 'majority':
        const buyCount = enabledSignals.filter(s => s === 'buy').length;
        const shortCount = enabledSignals.filter(s => s === 'short').length;
        if (buyCount > shortCount) return 'buy';
        if (shortCount > buyCount) return 'short';
        return 'none';
      
      case 'unanimous':
        if (enabledSignals.length > 0 && enabledSignals.every(s => s === enabledSignals[0])) {
          return enabledSignals[0];
        }
        return 'none';
      
      case 'weighted':
        // Implementation would use strategy weights
        return 'none';
      
      default:
        return 'none';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <AssessmentIcon />;
      case 'fundamental': return <TrendingUpIcon />;
      case 'sentiment': return <PsychologyIcon />;
      case 'momentum': return <SpeedIcon />;
      case 'custom': return <BuildIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getSignalChip = (signal: StrategySignal) => {
    const props = {
      buy: { color: 'success' as const, icon: <TrendingUpIcon fontSize="small" /> },
      short: { color: 'error' as const, icon: <TrendingDownIcon fontSize="small" /> },
      none: { color: 'default' as const, icon: <RemoveIcon fontSize="small" /> },
    };

    return (
      <Chip
        label={signal.toUpperCase()}
        color={props[signal].color}
        icon={props[signal].icon}
        size="small"
      />
    );
  };

  const handleToggleStrategy = (strategyId: string) => {
    dispatch(toggleStrategy(strategyId));
  };

  const handleToggleAutoTrading = () => {
    dispatch(toggleAutoTrading());
  };

  const handleUpdateSettings = () => {
    dispatch(updateAutoTradingSettings(localSettings));
    setSettingsDialogOpen(false);
  };

  const aggregatedSignal = getAggregatedSignal();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Strategy Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Enable/disable trading strategies and configure automated trading settings.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Auto Trading Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Automated Trading {autoTradingSettings.enabled ? '(Active)' : '(Inactive)'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoTradingSettings.enabled}
                      onChange={handleToggleAutoTrading}
                      color={autoTradingSettings.enabled ? 'success' : 'default'}
                    />
                  }
                  label={autoTradingSettings.enabled ? 'Enabled' : 'Disabled'}
                />
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setSettingsDialogOpen(true)}
                >
                  Settings
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Active Strategies
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {enabledStrategies.length}
                    </Typography>
                    <Typography variant="body2">
                      of {strategies.length} total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Current Signal
                    </Typography>
                    <Box sx={{ mt: 1, mb: 1 }}>
                      {getSignalChip(aggregatedSignal)}
                    </Box>
                    <Typography variant="body2">
                      {autoTradingSettings.signalAggregation.method} method
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Signals
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {totalSignals}
                    </Typography>
                    <Typography variant="body2">
                      All time
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Avg Win Rate
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {averageWinRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      All strategies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Strategy List */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Strategy Status ({strategies.length})
            </Typography>
            
            {strategies.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No strategies configured. Go to Strategy Configuration to create your first strategy.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Strategy</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Current Signal</TableCell>
                      <TableCell align="center">Performance</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(strategy.category)}
                            <Box>
                              <Typography variant="subtitle2">
                                {strategy.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {strategy.category} • {strategy.parameters.length} parameters
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Switch
                            checked={strategy.enabled}
                            onChange={() => handleToggleStrategy(strategy.id)}
                            color="success"
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          {getSignalChip(strategy.currentSignal)}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2">
                              {strategy.performance.totalSignals} signals
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {strategy.performance.winRate.toFixed(1)}% win rate
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Tooltip title="Strategy Details">
                            <IconButton size="small">
                              <SettingsIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Risk Management Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Risk Management
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Max Position Size"
                  secondary={`$${autoTradingSettings.riskManagement.maxPositionSize.toLocaleString()}`}
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Stop Loss"
                  secondary={`${autoTradingSettings.riskManagement.stopLossPercent}%`}
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Take Profit"
                  secondary={`${autoTradingSettings.riskManagement.takeProfitPercent}%`}
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Max Daily Loss"
                  secondary={`$${autoTradingSettings.riskManagement.maxDailyLoss.toLocaleString()}`}
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Automated trading involves risk. Monitor your strategies regularly.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Auto Trading Settings</DialogTitle>
        <DialogContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Risk Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Position Size ($)"
                    type="number"
                    value={localSettings.riskManagement.maxPositionSize}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      riskManagement: {
                        ...localSettings.riskManagement,
                        maxPositionSize: Number(e.target.value)
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Daily Loss ($)"
                    type="number"
                    value={localSettings.riskManagement.maxDailyLoss}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      riskManagement: {
                        ...localSettings.riskManagement,
                        maxDailyLoss: Number(e.target.value)
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Stop Loss (%)</Typography>
                    <Slider
                      value={localSettings.riskManagement.stopLossPercent}
                      onChange={(_, value) => setLocalSettings({
                        ...localSettings,
                        riskManagement: {
                          ...localSettings.riskManagement,
                          stopLossPercent: value as number
                        }
                      })}
                      min={1}
                      max={20}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>Take Profit (%)</Typography>
                    <Slider
                      value={localSettings.riskManagement.takeProfitPercent}
                      onChange={(_, value) => setLocalSettings({
                        ...localSettings,
                        riskManagement: {
                          ...localSettings.riskManagement,
                          takeProfitPercent: value as number
                        }
                      })}
                      min={1}
                      max={50}
                      step={0.5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <PsychologyIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Signal Aggregation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Aggregation Method</InputLabel>
                    <Select
                      value={localSettings.signalAggregation.method}
                      label="Aggregation Method"
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        signalAggregation: {
                          ...localSettings.signalAggregation,
                          method: e.target.value as any
                        }
                      })}
                    >
                      <MenuItem value="majority">Majority Vote</MenuItem>
                      <MenuItem value="unanimous">Unanimous</MenuItem>
                      <MenuItem value="weighted">Weighted Average</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Signals Required"
                    type="number"
                    value={localSettings.signalAggregation.minimumSignals}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      signalAggregation: {
                        ...localSettings.signalAggregation,
                        minimumSignals: Number(e.target.value)
                      }
                    })}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSettings} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrategyManagement;
