import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PieChart,
  Visibility,
  VisibilityOff,
  Info,
  Refresh
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchPortfolio } from '../../store/slices/portfolioSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';

interface PortfolioPosition {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  allocation: number;
}

const PortfolioSummary: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { account, positions, isLoading, error } = useSelector((state: RootState) => state.portfolio);
  const { symbols } = useSelector((state: RootState) => state.marketData);
  const [showBalances, setShowBalances] = React.useState(true);

  const handleRetry = () => {
    dispatch(fetchPortfolio());
  };

  const handleRefresh = () => {
    dispatch(fetchPortfolio());
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading portfolio data..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} title="Portfolio Error" />;
  }

  // Calculate portfolio metrics
  const portfolioValue = account?.portfolioValue || 0;
  const totalDayPL = account?.dayPL || 0;
  const totalDayPLPercent = account?.dayPLPercent || 0;
  const totalUnrealizedPL = account?.unrealizedPL || 0;
  const totalUnrealizedPLPercent = account?.unrealizedPLPercent || 0;

  // Transform positions to PortfolioPosition format
  const portfolioPositions: PortfolioPosition[] = positions.map(position => {
    const currentPrice = symbols?.[position.symbol]?.price || position.currentPrice;
    const totalValue = portfolioValue || 1; // Prevent division by zero
    
    return {
      symbol: position.symbol,
      name: getSymbolName(position.symbol),
      quantity: position.qty,
      avgCost: position.avgEntryPrice,
      currentPrice,
      marketValue: position.marketValue,
      unrealizedPL: position.unrealizedPL,
      unrealizedPLPercent: position.unrealizedPLPercent,
      allocation: (position.marketValue / totalValue) * 100
    };
  });

  // Helper function to get readable names for symbols
  function getSymbolName(symbol: string): string {
    const symbolNames: Record<string, string> = {
      'BTCUSD': 'Bitcoin',
      'ETHUSD': 'Ethereum', 
      'ADAUSD': 'Cardano',
      'SOLUSD': 'Solana',
      'DOTUSD': 'Polkadot',
      'ALGOUSD': 'Algorand',
      'AAPL': 'Apple Inc.',
      'TSLA': 'Tesla Inc.',
      'SPY': 'SPDR S&P 500 ETF'
    };
    return symbolNames[symbol] || symbol;
  }

  const formatCurrency = (amount: number): string => {
    if (!showBalances) return '••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getColorForValue = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? <TrendingUp /> : <TrendingDown />;
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance />
          Portfolio Summary
        </Typography>
        <Tooltip title={showBalances ? "Hide balances" : "Show balances"}>
          <IconButton onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Portfolio Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Portfolio Value */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Portfolio Value
              </Typography>
              <Typography variant="h5" component="div">
                {formatCurrency(portfolioValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Day P&L */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Day P&L
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  color={getColorForValue(totalDayPL)}
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatCurrency(totalDayPL)}
                </Typography>
                <Chip
                  icon={getChangeIcon(totalDayPL)}
                  label={formatPercent(totalDayPLPercent)}
                  size="small"
                  color={totalDayPL >= 0 ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Unrealized P&L */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Unrealized P&L
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  color={getColorForValue(totalUnrealizedPL)}
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatCurrency(totalUnrealizedPL)}
                </Typography>
                <Chip
                  icon={getChangeIcon(totalUnrealizedPL)}
                  label={formatPercent(totalUnrealizedPLPercent)}
                  size="small"
                  color={totalUnrealizedPL >= 0 ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Available Cash
              </Typography>
              <Typography variant="h6" component="div">
                {formatCurrency(account?.cash || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Buying Power: {formatCurrency(account?.buyingPower || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Positions Table */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PieChart />
          Positions
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Avg Cost</TableCell>
                <TableCell align="right">Current Price</TableCell>
                <TableCell align="right">Market Value</TableCell>
                <TableCell align="right">Unrealized P&L</TableCell>
                <TableCell align="right">Allocation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolioPositions.map((position) => (
                <TableRow
                  key={position.symbol}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {position.symbol.replace('USD', '')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {position.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {position.quantity.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${position.avgCost.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${position.currentPrice.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(position.marketValue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        color={getColorForValue(position.unrealizedPL)}
                        fontWeight="bold"
                      >
                        {formatCurrency(position.unrealizedPL)}
                      </Typography>
                      <Chip
                        label={formatPercent(position.unrealizedPLPercent)}
                        size="small"
                        color={position.unrealizedPL >= 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ minWidth: 60 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ minWidth: 35 }}>
                          {position.allocation}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={position.allocation}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {portfolioPositions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No positions found. Start trading to see your portfolio here.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PortfolioSummary;
