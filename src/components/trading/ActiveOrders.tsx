import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Alert,
  Tooltip,
  TextField,
  Snackbar
} from '@mui/material';
import {
  Assignment,
  Cancel,
  Edit,
  MoreVert,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  Refresh,
  Check
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Order } from '../../store/slices/types';
import { cancelOrder, modifyOrder, fetchOrders } from '../../store/slices/ordersSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';

interface OrderAction {
  orderId: string;
  action: 'cancel' | 'modify';
}

const ActiveOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, isLoading, error } = useSelector((state: RootState) => state.orders);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'cancel' | 'modify'>('cancel');
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyQuantity, setModifyQuantity] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  // Initialize last refresh time on mount
  useEffect(() => {
    setLastRefreshTime(new Date());
  }, []);

  const handleRetry = () => {
    dispatch(fetchOrders({ status: 'open' }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchOrders({ status: 'open' })).unwrap();
      setLastRefreshTime(new Date());
      setShowRefreshSuccess(true);
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastRefreshTime = (time: Date | null) => {
    if (!time) return '';
    return time.toLocaleString([], { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading orders..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} title="Orders Error" />;
  }

  // Mock active orders data
  const mockActiveOrders = [
    {
      id: '1',
      clientOrderId: 'client_1',
      symbol: 'BTCUSD',
      assetClass: 'crypto',
      side: 'buy' as const,
      type: 'limit' as const,
      timeInForce: 'gtc' as const,
      status: 'pending_new',
      qty: '0.1',
      filledQty: '0',
      limitPrice: 45000.00,
      extendedHours: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      clientOrderId: 'client_2',
      symbol: 'ETHUSD',
      assetClass: 'crypto',
      side: 'sell' as const,
      type: 'stop_limit' as const,
      timeInForce: 'day' as const,
      status: 'accepted',
      qty: '1.5',
      filledQty: '0.5',
      limitPrice: 3400.00,
      stopPrice: 3350.00,
      extendedHours: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      clientOrderId: 'client_3',
      symbol: 'ADAUSD',
      assetClass: 'crypto',
      side: 'buy' as const,
      type: 'limit' as const,
      timeInForce: 'gtc' as const,
      status: 'partially_filled',
      qty: '1000',
      filledQty: '300',
      limitPrice: 0.40,
      extendedHours: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      clientOrderId: 'client_4',
      symbol: 'SOLUSD',
      assetClass: 'crypto',
      side: 'sell' as const,
      type: 'stop' as const,
      timeInForce: 'day' as const,
      status: 'pending_cancel',
      qty: '10',
      filledQty: '0',
      stopPrice: 90.00,
      extendedHours: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const activeOrders = orders && orders.length > 0 ? orders : mockActiveOrders;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedOrder(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleOpenDialog = (type: 'cancel' | 'modify') => {
    setDialogType(type);
    if (type === 'modify' && selectedOrder && Array.isArray(activeOrders)) {
      const order = (activeOrders as Order[]).find((o: Order) => o.id === selectedOrder);
      if (order) {
        setModifyPrice(order.limitPrice?.toString() || '');
        setModifyQuantity(order.qty);
      }
    }
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setModifyPrice('');
    setModifyQuantity('');
    setSelectedOrder(null);
  };

  const handleCancelOrder = async () => {
    if (selectedOrder) {
      try {
        await dispatch(cancelOrder(selectedOrder)).unwrap();
        handleCloseDialog();
      } catch (error) {
        console.error('Failed to cancel order:', error);
      }
    }
  };

  const handleModifyOrder = async () => {
    if (selectedOrder && modifyPrice && modifyQuantity) {
      try {
        await dispatch(modifyOrder({
          orderId: selectedOrder,
          qty: modifyQuantity,
          limit_price: modifyPrice
        })).unwrap();
        handleCloseDialog();
      } catch (error) {
        console.error('Failed to modify order:', error);
      }
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      accepted: { color: 'info' as const, icon: <CheckCircle />, label: 'Active' },
      pending_new: { color: 'warning' as const, icon: <Schedule />, label: 'Pending' },
      partially_filled: { color: 'primary' as const, icon: <Schedule />, label: 'Partial' },
      filled: { color: 'success' as const, icon: <CheckCircle />, label: 'Filled' },
      canceled: { color: 'default' as const, icon: <Cancel />, label: 'Canceled' },
      pending_cancel: { color: 'warning' as const, icon: <Schedule />, label: 'Canceling' },
      rejected: { color: 'error' as const, icon: <ErrorIcon />, label: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.accepted;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getSideChip = (side: string) => (
    <Chip
      label={side.toUpperCase()}
      color={side === 'buy' ? 'success' : 'error'}
      size="small"
      variant="filled"
    />
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const canModifyOrder = (order: any) => {
    return ['accepted', 'pending_new'].includes(order.status) && 
           ['limit', 'stop_limit'].includes(order.type);
  };

  const canCancelOrder = (order: any) => {
    return !['filled', 'canceled', 'rejected'].includes(order.status);
  };

  const selectedOrderData = selectedOrder && Array.isArray(activeOrders) ? 
    (activeOrders as Order[]).find((o: Order) => o.id === selectedOrder) : null;

  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment />
          Active Orders
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastRefreshTime && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatLastRefreshTime(lastRefreshTime)}
            </Typography>
          )}
          <Tooltip title={isRefreshing ? "Refreshing..." : "Refresh orders"}>
            <IconButton 
              size="small" 
              disabled={isLoading || isRefreshing}
              onClick={handleRefresh}
              sx={{
                '&.Mui-disabled': {
                  color: isRefreshing ? 'primary.main' : 'action.disabled'
                }
              }}
            >
              <Refresh 
                sx={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} 
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Orders Table */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeOrders.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No active orders. Place an order to see it here.
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeOrders.map((order) => {
                  const datetime = formatDateTime(order.createdAt);
                  const progress = order.filledQty ? 
                    (parseFloat(order.filledQty) / parseFloat(order.qty)) * 100 : 0;

                  return (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.symbol.replace('USD', '')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getSideChip(order.side)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {order.type.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">
                            {order.filledQty}/{order.qty}
                          </Typography>
                          {progress > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              ({progress.toFixed(1)}%)
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          {order.limitPrice && (
                            <Typography variant="body2">
                              ${order.limitPrice.toFixed(2)}
                            </Typography>
                          )}
                          {order.stopPrice && (
                            <Typography variant="caption" color="text.secondary">
                              Stop: ${order.stopPrice.toFixed(2)}
                            </Typography>
                          )}
                          {order.type === 'market' && (
                            <Typography variant="body2" color="text.secondary">
                              Market
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(order.status)}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {datetime.time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {datetime.date}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, order.id)}
                          disabled={order.status === 'filled' || order.status === 'canceled'}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedOrderData && canModifyOrder(selectedOrderData) && (
          <MenuItem onClick={() => handleOpenDialog('modify')}>
            <Edit sx={{ mr: 1 }} />
            Modify Order
          </MenuItem>
        )}
        {selectedOrderData && canCancelOrder(selectedOrderData) && (
          <MenuItem onClick={() => handleOpenDialog('cancel')}>
            <Cancel sx={{ mr: 1 }} />
            Cancel Order
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Order Dialog */}
      <Dialog open={dialogOpen && dialogType === 'cancel'} onClose={handleCloseDialog}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this order?
          </Typography>
          {selectedOrderData && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>{selectedOrderData.side.toUpperCase()}</strong> {selectedOrderData.qty} {selectedOrderData.symbol}
              </Typography>
              <Typography variant="body2">
                Type: {selectedOrderData.type}
                {selectedOrderData.limitPrice && ` at $${selectedOrderData.limitPrice}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Canceling...' : 'Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modify Order Dialog */}
      <Dialog open={dialogOpen && dialogType === 'modify'} onClose={handleCloseDialog}>
        <DialogTitle>Modify Order</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Update the order parameters:
          </Typography>
          
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={modifyQuantity}
            onChange={(e) => setModifyQuantity(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            inputProps={{ step: "0.00000001", min: "0" }}
          />
          
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={modifyPrice}
            onChange={(e) => setModifyPrice(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01", min: "0" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleModifyOrder}
            color="primary"
            variant="contained"
            disabled={isLoading || !modifyPrice || !modifyQuantity}
          >
            {isLoading ? 'Updating...' : 'Update Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showRefreshSuccess}
        autoHideDuration={2000}
        onClose={() => setShowRefreshSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowRefreshSuccess(false)} 
          severity="success" 
          variant="filled"
          icon={<Check />}
          sx={{ width: '100%' }}
        >
          Orders refreshed successfully
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ActiveOrders;
