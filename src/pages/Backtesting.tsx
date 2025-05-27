import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { StrategyTemplate, StrategyParameter } from '../store/slices/strategiesSlice';
import { backtestingService, BacktestResult, BacktestTrade } from '../services/backtestingService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Backtesting: React.FC = () => {
  const { templates } = useSelector((state: RootState) => state.strategies);
  
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [strategyName, setStrategyName] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [parameters, setParameters] = useState<StrategyParameter[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const availableSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'];

  const handleTemplateSelect = (template: StrategyTemplate) => {
    setSelectedTemplate(template);
    setStrategyName(`${template.name} Backtest`);
    setParameters([...template.defaultParameters]);
  };

  const handleParameterChange = (index: number, value: any) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], value };
    setParameters(newParameters);
  };

  const runBacktest = async () => {
    if (!selectedTemplate) return;
    
    setIsRunning(true);
    
    // Convert parameters to object
    const paramObject = parameters.reduce((acc, param) => {
      acc[param.name] = param.value;
      return acc;
    }, {} as Record<string, any>);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = backtestingService.runBacktest(
        strategyName,
        selectedTemplate.id,
        paramObject,
        selectedSymbol,
        initialCapital
      );
      
      setResults(result);
      setTabValue(1); // Switch to results tab
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const renderParameterInput = (parameter: StrategyParameter, index: number) => {
    switch (parameter.type) {
      case 'number':
        return (
          <Box key={parameter.name} sx={{ mb: 3 }}>
            <Typography gutterBottom>
              {parameter.description || parameter.name}: {parameter.value}
            </Typography>
            <Slider
              value={parameter.value as number}
              onChange={(_, value) => handleParameterChange(index, value)}
              min={parameter.min || 0}
              max={parameter.max || 100}
              step={parameter.step || 1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        );
      
      case 'boolean':
        return (
          <FormControlLabel
            key={parameter.name}
            control={
              <Switch
                checked={parameter.value as boolean}
                onChange={(e) => handleParameterChange(index, e.target.checked)}
              />
            }
            label={parameter.description || parameter.name}
            sx={{ mb: 2 }}
          />
        );
      
      case 'select':
        return (
          <FormControl key={parameter.name} fullWidth sx={{ mb: 3 }}>
            <InputLabel>{parameter.description || parameter.name}</InputLabel>
            <Select
              value={parameter.value}
              onChange={(e) => handleParameterChange(index, e.target.value)}
            >
              {parameter.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      default:
        return (
          <TextField
            key={parameter.name}
            fullWidth
            label={parameter.description || parameter.name}
            value={parameter.value}
            onChange={(e) => handleParameterChange(index, e.target.value)}
            sx={{ mb: 3 }}
          />
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTradeTypeChip = (trade: BacktestTrade) => {
    if (trade.type === 'buy') {
      return (
        <Chip
          label={`${trade.type.toUpperCase()}`}
          color="success"
          size="small"
          icon={<TrendingUpIcon />}
        />
      );
    } else {
      return (
        <Chip
          label="SHORT"
          color="error"
          size="small"
          icon={<TrendingDownIcon />}
        />
      );
    }
  };

  const getPnLChip = (pnl: number) => {
    return (
      <Chip
        label={formatCurrency(pnl)}
        color={pnl >= 0 ? 'success' : 'error'}
        size="small"
      />
    );
  };

  // Chart configuration
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Equity Curve & Signals',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const getChartData = () => {
    if (!results) return null;

    const labels = results.equity.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString();
    });

    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: results.equity.map(point => point.value),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Buy Signals',
          data: results.signals.map((signal, index) => 
            signal.signal === 'buy' ? signal.price : null
          ),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgb(34, 197, 94)',
          pointStyle: 'triangle',
          pointRadius: 8,
          showLine: false,
          yAxisID: 'y1',
        },
        {
          label: 'Short Signals',
          data: results.signals.map((signal, index) => 
            signal.signal === 'short' ? signal.price : null
          ),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgb(239, 68, 68)',
          pointStyle: 'triangle',
          pointRadius: 8,
          pointRotation: 180,
          showLine: false,
          yAxisID: 'y1',
        },
      ],
    };
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Strategy Backtesting
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test trading strategies against historical data to evaluate performance and optimize parameters.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Configuration" />
          <Tab label="Results" disabled={!results} />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Strategy Configuration */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Strategy Configuration
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Strategy Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) handleTemplateSelect(template);
                  }}
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedTemplate && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  {selectedTemplate.description}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Strategy Name"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Symbol</InputLabel>
                <Select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                >
                  {availableSymbols.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Initial Capital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Paper>
          </Grid>

          {/* Strategy Parameters */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Strategy Parameters
              </Typography>
              
              {selectedTemplate && parameters.length > 0 ? (
                <Box>
                  {parameters.map((parameter, index) => 
                    renderParameterInput(parameter, index)
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Select a strategy template to configure parameters
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Run Backtest */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={isRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={runBacktest}
                disabled={!selectedTemplate || isRunning}
                sx={{ minWidth: 200 }}
              >
                {isRunning ? 'Running Backtest...' : 'Run Backtest'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Backtest will simulate the strategy over the last 14 days
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        {results && (
          <Grid container spacing={3}>
            {/* Performance Summary */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color={results.performance.totalReturnPercent >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercent(results.performance.totalReturnPercent)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Return</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {formatPercent(results.performance.winRate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4">
                        {results.performance.totalTrades}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Trades</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error">
                        {formatPercent(results.performance.maxDrawdown)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Equity Curve Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Equity Curve & Trading Signals
                </Typography>
                {getChartData() && (
                  <Line data={getChartData()!} options={chartOptions} />
                )}
              </Paper>
            </Grid>

            {/* Detailed Metrics */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Detailed Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total Return</Typography>
                    <Typography variant="body1" color={results.performance.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(results.performance.totalReturn)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Profit Factor</Typography>
                    <Typography variant="body1">{results.performance.profitFactor.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Avg Win</Typography>
                    <Typography variant="body1" color="success.main">
                      {formatCurrency(results.performance.avgWin)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Avg Loss</Typography>
                    <Typography variant="body1" color="error.main">
                      {formatCurrency(results.performance.avgLoss)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Winning Trades</Typography>
                    <Typography variant="body1">{results.performance.winningTrades}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Losing Trades</Typography>
                    <Typography variant="body1">{results.performance.losingTrades}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Strategy Info */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Strategy Details
                </Typography>
                <Typography variant="body2" color="text.secondary">Strategy</Typography>
                <Typography variant="body1" gutterBottom>{results.strategy.name}</Typography>
                
                <Typography variant="body2" color="text.secondary">Symbol</Typography>
                <Typography variant="body1" gutterBottom>{results.period.symbol}</Typography>
                
                <Typography variant="body2" color="text.secondary">Period</Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(results.period.startDate).toLocaleDateString()} - {new Date(results.period.endDate).toLocaleDateString()}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">Initial Capital</Typography>
                <Typography variant="body1">{formatCurrency(initialCapital)}</Typography>
              </Paper>
            </Grid>

            {/* Trade History */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Trade History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Entry Date</TableCell>
                        <TableCell>Exit Date</TableCell>
                        <TableCell align="right">Entry Price</TableCell>
                        <TableCell align="right">Exit Price</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">P&L</TableCell>
                        <TableCell align="right">P&L %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>{getTradeTypeChip(trade)}</TableCell>
                          <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                          <TableCell>{trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell align="right">{formatCurrency(trade.entryPrice)}</TableCell>
                          <TableCell align="right">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</TableCell>
                          <TableCell align="right">{trade.quantity}</TableCell>
                          <TableCell align="right">{trade.pnl ? getPnLChip(trade.pnl) : '-'}</TableCell>
                          <TableCell align="right">{trade.pnlPercent ? formatPercent(trade.pnlPercent) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        )}
      </CustomTabPanel>
    </Box>
  );
};

export default Backtesting;
