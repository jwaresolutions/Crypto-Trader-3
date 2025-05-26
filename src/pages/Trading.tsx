import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import TradingChart from '../components/trading/TradingChart';
import OrderForm from '../components/trading/OrderForm';
import MarketOverview from '../components/trading/MarketOverview';
import Watchlist from '../components/trading/Watchlist';

const Trading: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Trading
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <TradingChart />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ mb: 3 }}>
            <OrderForm />
          </Box>
          <MarketOverview />
        </Grid>
        <Grid item xs={12}>
          <Watchlist />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Trading;
