import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon 
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const MarketOverview: React.FC = () => {
  const { symbols, isLoading, error } = useSelector((state: RootState) => state.marketData);

  // Default symbols to display
  const defaultSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'];
  
  // Use real data from Redux store or fallback to mock data
  const marketData = defaultSymbols.map(symbol => {
    const realData = symbols[symbol];
    if (realData) {
      return {
        symbol,
        price: realData.price,
        change: realData.change,
        changePercent: realData.changePercent
      };
    }
    // Fallback mock data
    const mockData = {
      'BTCUSD': { price: 43250.50, change: 1250.30, changePercent: 2.98 },
      'ETHUSD': { price: 2890.75, change: -45.20, changePercent: -1.54 },
      'ADAUSD': { price: 0.4567, change: 0.0123, changePercent: 2.77 },
      'SOLUSD': { price: 98.34, change: 3.45, changePercent: 3.63 },
      'DOTUSD': { price: 7.89, change: -0.23, changePercent: -2.83 },
    };
    return { symbol, ...mockData[symbol as keyof typeof mockData] };
  });

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('USD')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: symbol === 'BTCUSD' ? 2 : 4,
      }).format(price);
    }
    return price.toFixed(4);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {isPositive ? (
          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
        ) : (
          <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
        )}
        <Typography 
          variant="body2" 
          sx={{ color: isPositive ? 'success.main' : 'error.main' }}
        >
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </Typography>
      </Stack>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Market Overview
        </Typography>
        {isLoading && (
          <Chip 
            label="Updating..." 
            size="small" 
            color="info" 
            variant="outlined"
          />
        )}
        {error && (
          <Chip 
            label="Error" 
            size="small" 
            color="error" 
            variant="outlined"
          />
        )}
      </Box>
      <Grid container spacing={2}>
        {marketData.map((crypto) => (
          <Grid item xs={12} sm={6} md={2.4} key={crypto.symbol}>
            <Card 
              sx={{ 
                bgcolor: 'background.default',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                '&:hover': {
                  border: '1px solid primary.main',
                  cursor: 'pointer',
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {crypto.symbol.replace('USD', '/USD')}
                  </Typography>
                  <Chip 
                    label={symbols[crypto.symbol] ? "Live" : "Mock"}
                    size="small"
                    variant="outlined"
                    color={symbols[crypto.symbol] ? "success" : "warning"}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {formatPrice(crypto.price, crypto.symbol)}
                </Typography>
                {formatChange(crypto.change, crypto.changePercent)}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MarketOverview;
