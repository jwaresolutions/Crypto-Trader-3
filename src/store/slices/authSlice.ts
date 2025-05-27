import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from './types';
import DatabaseService from '../../services/databaseService';

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
      // Try database authentication first
      const dbService = DatabaseService;
      const user = await dbService.authenticateUser(credentials.username, credentials.password);
      
      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
            lastLogin: new Date().toISOString()
          },
          accountId: `ACC-${user.id.slice(-8)}`
        };
      }
      
      // Fallback to environment variables for demo
      const validUsername = process.env.REACT_APP_LOGIN_USERNAME;
      const validPassword = process.env.REACT_APP_LOGIN_PASSWORD;
      
      if (!validUsername || !validPassword) {
        return rejectWithValue('Authentication failed');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (credentials.username === validUsername && credentials.password === validPassword) {
        const demoUser: User = {
          id: 'demo-trader-001',
          email: 'demo@cryptotrader.com',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        return {
          user: demoUser,
          accountId: 'ACC-DEMO123'
        };
      } else {
        return rejectWithValue('Invalid username or password');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const loadCurrentUser = createAsyncThunk(
  'auth/loadCurrentUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const dbService = DatabaseService;
      const user = await dbService.getUser(userId);
      
      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
            lastLogin: new Date().toISOString()
          },
          accountId: `ACC-${user.id.slice(-8)}`
        };
      }
      
      return rejectWithValue('User not found');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData: { firstName?: string; lastName?: string; email?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('No user logged in');
      }
      
      const dbService = DatabaseService;
      const updatedUser = await dbService.updateUser(currentUser.id, userData);
      
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt.toISOString(),
        lastLogin: new Date().toISOString()
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
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
      // loadCurrentUser
      .addCase(loadCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accountId = action.payload.accountId;
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loadCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
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
