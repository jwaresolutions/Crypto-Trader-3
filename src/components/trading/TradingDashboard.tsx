import React, { useEffect, useState } from 'react';
import { Grid, Paper, Box, Alert, Button, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchPortfolio } from '../../store/slices/portfolioSlice';
import { fetchMarketData } from '../../store/slices/marketDataSlice';
import { fetchOrders } from '../../store/slices/ordersSlice';
import { loadStrategies } from '../../store/slices/strategiesSlice';
import SimpleTradingEngine from '../../services/simpleTradingEngine';
import DatabaseService from '../../services/databaseService';
import { store } from '../../store';
import MarketOverview from './MarketOverview';
import TradingChart from './TradingChart';
import OrderForm from './OrderForm';
import ActiveOrders from './ActiveOrders';
import PortfolioSummary from './PortfolioSummary';
import Watchlist from './Watchlist';
import PriceAlerts from './PriceAlerts';
import TradingSignals from './TradingSignals';
import TradingEngineControl from './TradingEngineControl';
import ErrorBoundary from '../common/ErrorBoundary';

const TradingDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { strategies } = useSelector((state: RootState) => state.strategies);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Initialize the dashboard by fetching initial data
    console.log('Initializing trading dashboard...');
    
    // Initialize database
    DatabaseService.initialize().catch(err => {
      console.error('Failed to initialize database:', err);
    });

    // Load strategies from database
    const userId = user?.id || 'default-user';
    dispatch(loadStrategies(userId));
    
    // Fetch portfolio data
    dispatch(fetchPortfolio());
    
    // Fetch active orders
    dispatch(fetchOrders({ status: 'open' }));
    
    // Fetch market data for major symbols
    const majorSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD'];
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
      {/* Trading Engine Control Panel */}
      <Box sx={{ mb: 3 }}>
        <TradingEngineControl />
      </Box>

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

        {/* Fourth Row - Trading Signals */}
        <Grid item xs={12}>
          <TradingSignals />
        </Grid>

        {/* Fifth Row - Price Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <ErrorBoundary>
              <PriceAlerts />
            </ErrorBoundary>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard;
