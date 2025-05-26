import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order } from './types';
import { alpacaService, CreateOrderRequest, ModifyOrderRequest } from '../../services/alpacaService';

interface OrdersState {
  orders: Order[];
  activeOrders: Order[];
  orderHistory: Order[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

const initialState: OrdersState = {
  orders: [],
  activeOrders: [],
  orderHistory: [],
  isLoading: false,
  error: null,
  lastUpdated: 0
};

// Async thunks for API calls
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params: { status?: 'open' | 'closed' | 'all'; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const { status = 'all', limit = 50 } = params;
      const orders = await alpacaService.getOrders(status, limit);
      return orders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async (orderData: CreateOrderRequest, { rejectWithValue }) => {
    try {
      const order = await alpacaService.createOrder(orderData);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to place order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      await alpacaService.cancelOrder(orderId);
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel order');
    }
  }
);

export const modifyOrder = createAsyncThunk(
  'orders/modifyOrder',
  async (params: { orderId: string } & ModifyOrderRequest, { rejectWithValue }) => {
    try {
      const { orderId, ...modifications } = params;
      const order = await alpacaService.modifyOrder(orderId, modifications);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to modify order');
    }
  }
);

export const cancelAllOrders = createAsyncThunk(
  'orders/cancelAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      await alpacaService.cancelAllOrders();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel all orders');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex((order: Order) => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
        
        // Update active orders
        const activeIndex = state.activeOrders.findIndex((order: Order) => order.id === action.payload.id);
        if (['new', 'partially_filled', 'accepted', 'pending_new'].includes(action.payload.status)) {
          if (activeIndex !== -1) {
            state.activeOrders[activeIndex] = action.payload;
          } else {
            state.activeOrders.push(action.payload);
          }
        } else if (activeIndex !== -1) {
          state.activeOrders.splice(activeIndex, 1);
          state.orderHistory.unshift(action.payload);
        }
      }
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter((order: Order) => order.id !== action.payload);
      state.activeOrders = state.activeOrders.filter((order: Order) => order.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchOrders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.activeOrders = action.payload.filter(order => 
          ['new', 'partially_filled', 'accepted', 'pending_new'].includes(order.status)
        );
        state.orderHistory = action.payload.filter(order => 
          ['filled', 'canceled', 'expired', 'rejected'].includes(order.status)
        );
        state.lastUpdated = Date.now();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // placeOrder
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        if (['new', 'partially_filled', 'accepted', 'pending_new'].includes(action.payload.status)) {
          state.activeOrders.unshift(action.payload);
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // cancelOrder
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const orderId = action.payload;
        // Remove from active orders and orders
        state.orders = state.orders.filter((order: Order) => order.id !== orderId);
        state.activeOrders = state.activeOrders.filter((order: Order) => order.id !== orderId);
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // modifyOrder
      .addCase(modifyOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(modifyOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload;
        
        // Update in orders array
        const index = state.orders.findIndex((order: Order) => order.id === updatedOrder.id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        
        // Update in active orders
        const activeIndex = state.activeOrders.findIndex((order: Order) => order.id === updatedOrder.id);
        if (activeIndex !== -1) {
          state.activeOrders[activeIndex] = updatedOrder;
        }
      })
      .addCase(modifyOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // cancelAllOrders
      .addCase(cancelAllOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelAllOrders.fulfilled, (state) => {
        state.isLoading = false;
        state.activeOrders = [];
        // Filter out canceled orders from main orders array
        state.orders = state.orders.filter((order: Order) => 
          ['filled', 'canceled', 'expired', 'rejected'].includes(order.status)
        );
      })
      .addCase(cancelAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  updateOrder,
  removeOrder,
  clearError
} = ordersSlice.actions;

export default ordersSlice.reducer;
