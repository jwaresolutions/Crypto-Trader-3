import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import DatabaseService from '../../services/databaseService';

export interface Notification {
  id: string;
  type: 'trade' | 'signal' | 'alert' | 'system' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  data?: any;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  realTimeEnabled: boolean;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  realTimeEnabled: true,
};

// Async thunk to fetch user notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: { userId: string; limit?: number; unreadOnly?: boolean }, { rejectWithValue }) => {
    try {
      // For now, generate mock notifications since we don't have a notifications table
      // In a real implementation, this would fetch from the database
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'signal',
          title: 'New Trading Signal',
          message: 'RSI Mean Reversion strategy generated a BUY signal for BTCUSD',
          priority: 'medium',
          read: false,
          actionRequired: true,
          actionUrl: '/trading',
          data: { symbol: 'BTCUSD', signal: 'BUY', strategy: 'RSI Mean Reversion' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'trade',
          title: 'Order Filled',
          message: 'Your limit order for 0.1 BTC at $65,000 has been filled',
          priority: 'high',
          read: false,
          data: { symbol: 'BTCUSD', quantity: 0.1, price: 65000, type: 'limit' },
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'alert',
          title: 'Price Alert',
          message: 'ETHUSD has reached your target price of $3,500',
          priority: 'medium',
          read: true,
          data: { symbol: 'ETHUSD', targetPrice: 3500, currentPrice: 3502 },
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'system',
          title: 'Daily Summary',
          message: 'Your portfolio is up 2.3% today',
          priority: 'low',
          read: true,
          data: { change: 2.3, value: 125000 },
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ];

      return mockNotifications;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

// Async thunk to mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (params: { userId: string; notificationId: string }, { rejectWithValue }) => {
    try {
      // In a real implementation, this would update the database
      return params.notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

// Async thunk to mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId: string, { rejectWithValue }) => {
    try {
      // In a real implementation, this would update the database
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

// Async thunk to create new notification
export const createNotification = createAsyncThunk(
  'notifications/create',
  async (params: { userId: string; notification: Omit<Notification, 'id' | 'createdAt'> }, { rejectWithValue }) => {
    try {
      const newNotification: Notification = {
        ...params.notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      // In a real implementation, this would save to the database
      return newNotification;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create notification');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount++;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount--;
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount--;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    toggleRealTime: (state) => {
      state.realTimeEnabled = !state.realTimeEnabled;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // markNotificationAsRead
      .addCase(markNotificationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount--;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // createNotification
      .addCase(createNotification.pending, (state) => {
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount++;
        }
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  addNotification,
  removeNotification,
  markAsRead,
  clearAllNotifications,
  toggleRealTime,
  clearError
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
