import React, { useEffect } from 'react';
import { Grid, Paper, Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { fetchPortfolio } from '../../store/slices/portfolioSlice';
import { fetchMarketData } from '../../store/slices/marketDataSlice';
import { fetchOrders } from '../../store/slices/ordersSlice';
import MarketOverview from './MarketOverview';
import TradingChart from './TradingChart';
import OrderForm from './OrderForm';
import ActiveOrders from './ActiveOrders';
import PortfolioSummary from './PortfolioSummary';
import Watchlist from './Watchlist';
import PriceAlerts from './PriceAlerts';

const TradingDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize the dashboard by fetching initial data
    console.log('Initializing trading dashboard...');
    
    // Fetch portfolio data
    dispatch(fetchPortfolio());
    
    // Fetch active orders
    dispatch(fetchOrders({ status: 'open' }));
    
    // Fetch market data for major symbols
    const majorSymbols = ['BTCUSD', 'ETHUSD', 'AAPL', 'TSLA', 'SPY'];
    dispatch(fetchMarketData(majorSymbols));

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchPortfolio());
      dispatch(fetchMarketData(majorSymbols));
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Top Row - Market Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <MarketOverview />
          </Paper>
        </Grid>

        {/* Second Row - Main Trading Interface */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '500px' }}>
            <TradingChart />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <OrderForm />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Watchlist />
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Third Row - Portfolio and Orders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <PortfolioSummary />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <ActiveOrders />
          </Paper>
        </Grid>

        {/* Fourth Row - Price Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <PriceAlerts />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard;
