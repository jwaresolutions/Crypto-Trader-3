import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert,
  InputAdornment,
  Chip,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  AttachMoney
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { placeOrder } from '../../store/slices/ordersSlice';

export interface OrderFormData {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  quantity: string;
  price?: string;
  stopPrice?: string;
}

const OrderForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentSymbol } = useSelector((state: RootState) => state.marketData);
  const { account } = useSelector((state: RootState) => state.portfolio);
  const { isLoading } = useSelector((state: RootState) => state.orders);

  const [formData, setFormData] = useState<OrderFormData>({
    symbol: currentSymbol || 'BTCUSD',
    side: 'buy',
    type: 'market',
    timeInForce: 'gtc',
    quantity: '',
    price: '',
    stopPrice: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estimatedTotal, setEstimatedTotal] = useState<number>(0);

  // Get current market price for the selected symbol
  const marketData = useSelector((state: RootState) => 
    state.marketData.symbols[formData.symbol]
  );
  const currentPrice = marketData?.price || 0;

  // Calculate estimated total when quantity or price changes
  React.useEffect(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = formData.type === 'market' 
      ? currentPrice 
      : parseFloat(formData.price || '0');
    
    setEstimatedTotal(qty * price);
  }, [formData.quantity, formData.price, formData.type, currentPrice]);

  const handleInputChange = useCallback((field: keyof OrderFormData) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }, [errors]);

  const handleSideChange = useCallback((
    _event: React.MouseEvent<HTMLElement>,
    newSide: 'buy' | 'sell' | null
  ) => {
    if (newSide) {
      setFormData(prev => ({ ...prev, side: newSide }));
    }
  }, []);

  const handleTypeChange = useCallback((event: any) => {
    const newType = event.target.value;
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      price: newType === 'market' ? '' : prev.price,
      stopPrice: newType.includes('stop') ? prev.stopPrice : ''
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.type === 'limit' || formData.type === 'stop_limit') {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Price must be greater than 0';
      }
    }

    if (formData.type === 'stop' || formData.type === 'stop_limit') {
      if (!formData.stopPrice || parseFloat(formData.stopPrice) <= 0) {
        newErrors.stopPrice = 'Stop price must be greater than 0';
      }
    }

    // Check buying power for buy orders
    if (formData.side === 'buy' && account) {
      const requiredCash = estimatedTotal;
      if (requiredCash > account.cash) {
        newErrors.quantity = 'Insufficient buying power';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, estimatedTotal, account]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(placeOrder({
        symbol: formData.symbol,
        qty: formData.quantity,
        side: formData.side,
        type: formData.type,
        time_in_force: formData.timeInForce,
        limit_price: formData.type === 'limit' || formData.type === 'stop_limit' 
          ? formData.price 
          : undefined,
        stop_price: formData.type === 'stop' || formData.type === 'stop_limit' 
          ? formData.stopPrice 
          : undefined
      })).unwrap();

      // Reset form on successful order
      setFormData(prev => ({
        ...prev,
        quantity: '',
        price: '',
        stopPrice: ''
      }));
    } catch (error) {
      console.error('Order placement failed:', error);
    }
  }, [dispatch, formData, validateForm]);

  const getOrderTypeDescription = () => {
    switch (formData.type) {
      case 'market':
        return 'Execute immediately at current market price';
      case 'limit':
        return 'Execute only at specified price or better';
      case 'stop':
        return 'Market order triggered when stop price is reached';
      case 'stop_limit':
        return 'Limit order triggered when stop price is reached';
      default:
        return '';
    }
  };

  const isBuyOrder = formData.side === 'buy';

  return (
    <Paper elevation={0} sx={{ p: 0 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachMoney />
        Place Order
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {/* Symbol Display */}
        <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Symbol
          </Typography>
          <Typography variant="h6">
            {formData.symbol}
            {currentPrice > 0 && (
              <Chip 
                label={`$${currentPrice.toFixed(2)}`}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        {/* Buy/Sell Toggle */}
        <ToggleButtonGroup
          value={formData.side}
          exclusive
          onChange={handleSideChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton 
            value="buy" 
            sx={{ 
              color: isBuyOrder ? 'success.main' : 'text.primary',
              '&.Mui-selected': { 
                bgcolor: 'success.main', 
                color: 'success.contrastText',
                '&:hover': { bgcolor: 'success.dark' }
              }
            }}
          >
            <TrendingUp sx={{ mr: 1 }} />
            BUY
          </ToggleButton>
          <ToggleButton 
            value="sell"
            sx={{ 
              color: !isBuyOrder ? 'error.main' : 'text.primary',
              '&.Mui-selected': { 
                bgcolor: 'error.main', 
                color: 'error.contrastText',
                '&:hover': { bgcolor: 'error.dark' }
              }
            }}
          >
            <TrendingDown sx={{ mr: 1 }} />
            SELL
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Order Type */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Order Type</InputLabel>
          <Select
            value={formData.type}
            onChange={handleTypeChange}
            label="Order Type"
          >
            <MenuItem value="market">Market</MenuItem>
            <MenuItem value="limit">Limit</MenuItem>
            <MenuItem value="stop">Stop</MenuItem>
            <MenuItem value="stop_limit">Stop Limit</MenuItem>
          </Select>
        </FormControl>

        {/* Order Type Description */}
        <Alert 
          severity="info" 
          sx={{ mb: 2, fontSize: '0.8rem' }}
          icon={<Info fontSize="small" />}
        >
          {getOrderTypeDescription()}
        </Alert>

        {/* Quantity */}
        <TextField
          fullWidth
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={handleInputChange('quantity')}
          error={!!errors.quantity}
          helperText={errors.quantity}
          inputProps={{ step: "0.00000001", min: "0" }}
          sx={{ mb: 2 }}
        />

        {/* Price (for limit orders) */}
        {(formData.type === 'limit' || formData.type === 'stop_limit') && (
          <TextField
            fullWidth
            label="Limit Price"
            type="number"
            value={formData.price}
            onChange={handleInputChange('price')}
            error={!!errors.price}
            helperText={errors.price}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: "0.01", min: "0" }}
            sx={{ mb: 2 }}
          />
        )}

        {/* Stop Price (for stop orders) */}
        {(formData.type === 'stop' || formData.type === 'stop_limit') && (
          <TextField
            fullWidth
            label="Stop Price"
            type="number"
            value={formData.stopPrice}
            onChange={handleInputChange('stopPrice')}
            error={!!errors.stopPrice}
            helperText={errors.stopPrice}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: "0.01", min: "0" }}
            sx={{ mb: 2 }}
          />
        )}

        {/* Time in Force */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Time in Force</InputLabel>
          <Select
            value={formData.timeInForce}
            onChange={(e) => setFormData(prev => ({ ...prev, timeInForce: e.target.value as any }))}
            label="Time in Force"
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="gtc">Good Till Cancel</MenuItem>
            <MenuItem value="ioc">Immediate or Cancel</MenuItem>
            <MenuItem value="fok">Fill or Kill</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Order Summary */}
        <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Order Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Quantity:</Typography>
            <Typography variant="body2">
              {formData.quantity || '0'} {formData.symbol.replace('USD', '')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Est. Price:</Typography>
            <Typography variant="body2">
              ${formData.type === 'market' ? currentPrice.toFixed(2) : (formData.price || '0')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <Typography variant="body2">Est. Total:</Typography>
            <Typography variant="body2" color={isBuyOrder ? 'error.main' : 'success.main'}>
              ${estimatedTotal.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Available Balance */}
        {account && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Available Balance
            </Typography>
            <Typography variant="body2">
              Cash: ${account.cash.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              Buying Power: ${account.buyingPower.toFixed(2)}
            </Typography>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isLoading || !formData.quantity}
          sx={{
            bgcolor: isBuyOrder ? 'success.main' : 'error.main',
            '&:hover': {
              bgcolor: isBuyOrder ? 'success.dark' : 'error.dark',
            },
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Placing Order...' : `${formData.side.toUpperCase()} ${formData.symbol}`}
        </Button>
      </Box>
    </Paper>
  );
};

export default OrderForm;
