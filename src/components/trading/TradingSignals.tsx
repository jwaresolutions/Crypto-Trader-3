import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { Refresh, TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import DatabaseService from '../../services/databaseService';

interface TradingSignal {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: Date;
  metadata: any;
}

const TradingSignals: React.FC = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSignals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dbService = DatabaseService;
      const recentSignals = await dbService.getRecentSignals(20);
      
      setSignals(recentSignals.map((signal: any) => ({
        id: signal.id,
        strategyId: signal.strategyId,
        strategyName: signal.strategy?.name || 'Unknown',
        symbol: signal.symbol,
        signal: signal.signal,
        confidence: signal.confidence,
        price: signal.price,
        timestamp: signal.timestamp,
        metadata: JSON.parse(signal.metadata || '{}')
      })));
    } catch (err: any) {
      setError(`Failed to load trading signals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
    
    // Refresh signals every 30 seconds
    const interval = setInterval(loadSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp color="success" />;
      case 'SELL':
        return <TrendingDown color="error" />;
      default:
        return <Remove color="disabled" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Live Trading Signals</Typography>
        <Tooltip title="Refresh Signals">
          <IconButton onClick={loadSignals} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Strategy</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Signal</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'Loading signals...' : 'No trading signals found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              signals.map((signal) => (
                <TableRow key={signal.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(signal.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {signal.strategyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {signal.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSignalIcon(signal.signal)}
                      <Chip
                        label={signal.signal}
                        size="small"
                        color={getSignalColor(signal.signal) as any}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ${signal.price.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${(signal.confidence * 100).toFixed(0)}%`}
                      size="small"
                      color={getConfidenceColor(signal.confidence) as any}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TradingSignals;
