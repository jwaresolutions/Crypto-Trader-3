import React from 'react';
import { Box, Typography } from '@mui/material';
import ActiveOrders from '../components/trading/ActiveOrders';

const Orders: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Orders
      </Typography>
      <ActiveOrders />
    </Box>
  );
};

export default Orders;
