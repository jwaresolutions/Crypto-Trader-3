import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  ButtonGroup, 
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const TradingChart: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const { symbols } = useSelector((state: RootState) => state.marketData);

  const timeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];
  const availableSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'];

  // Generate mock historical data based on current price
  const generateMockData = () => {
    const currentPrice = symbols[selectedSymbol]?.price || 45000;
    const dataPoints = 50;
    const data = [];
    const labels = [];
    
    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date(Date.now() - i * 60 * 60 * 1000); // hourly data
      labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      
      // Generate realistic price movements
      const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const price = currentPrice * (1 + randomVariation * (i / dataPoints));
      data.push(price);
    }
    
    return { labels, data };
  };

  const { labels, data } = generateMockData();
  
  const chartData = {
    labels,
    datasets: [
      {
        label: selectedSymbol,
        data,
        borderColor: symbols[selectedSymbol]?.changePercent >= 0 ? '#4caf50' : '#f44336',
        backgroundColor: symbols[selectedSymbol]?.changePercent >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#1976d2',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            return `Price: $${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          callback: (value: any) => {
            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Price Chart
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Symbol</InputLabel>
            <Select
              value={selectedSymbol}
              label="Symbol"
              onChange={(e) => setSelectedSymbol(e.target.value)}
            >
              {availableSymbols.map((symbol) => (
                <MenuItem key={symbol} value={symbol}>
                  {symbol.replace('USD', '/USD')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ButtonGroup size="small" variant="outlined">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'contained' : 'outlined'}
                onClick={() => setTimeframe(tf)}
                sx={{ minWidth: 40 }}
              >
                {tf}
              </Button>
            ))}
          </ButtonGroup>
        </Stack>
      </Stack>

      {/* Chart Container */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          borderRadius: 1,
          p: 2,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          height: '400px',
          position: 'relative'
        }}
      >
        <Line data={chartData} options={chartOptions} />
      </Box>
    </Box>
  );
};

export default TradingChart;
