import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from './types';

interface AuthSliceState extends AuthState {
  accountId: string | null;
}

const initialState: AuthSliceState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accountId: null,
};

// Async thunks for authentication
export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      // Check against environment variables
      const validUsername = process.env.REACT_APP_LOGIN_USERNAME;
      const validPassword = process.env.REACT_APP_LOGIN_PASSWORD;
      
      if (!validUsername || !validPassword) {
        return rejectWithValue('Application credentials not configured');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (credentials.username === validUsername && credentials.password === validPassword) {
        const user: User = {
          id: 'trader-001',
          email: 'trader@tradingapp.com',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        return {
          user,
          accountId: 'ACC-12345'
        };
      } else {
        return rejectWithValue('Invalid username or password');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const verifyCredentials = createAsyncThunk(
  'auth/verifyCredentials',
  async (_, { rejectWithValue }) => {
    try {
      // For username/password auth, we can check if user is already logged in
      // In a real app, you might verify a JWT token here
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return rejectWithValue('No stored credentials found');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify credentials');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accountId = null;
      state.error = null;
      state.isLoading = false;
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // loginWithCredentials
      .addCase(loginWithCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accountId = action.payload.accountId;
        state.user = action.payload.user;
        // Store user in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // verifyCredentials
      .addCase(verifyCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCredentials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.accountId = 'ACC-12345';
      })
      .addCase(verifyCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
