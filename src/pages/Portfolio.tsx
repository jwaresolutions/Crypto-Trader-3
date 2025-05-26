import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import PortfolioSummary from '../components/trading/PortfolioSummary';

const Portfolio: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Portfolio
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <PortfolioSummary />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Portfolio;
