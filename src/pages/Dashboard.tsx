import React from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import TradingDashboard from '../components/trading/TradingDashboard';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <TradingDashboard />
    </Box>
  );
};

export default Dashboard;
