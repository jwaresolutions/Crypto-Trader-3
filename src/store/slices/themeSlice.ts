import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import DatabaseService from '../../services/databaseService';

// Define User interface with preferences
interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences?: Record<string, any>;
}

interface ThemeState {
  darkMode: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ThemeState = {
  darkMode: true, // Default to dark mode
  isLoading: false,
  error: null,
};

// Async thunk to load user preferences
export const loadUserPreferences = createAsyncThunk(
  'theme/loadUserPreferences',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await DatabaseService.getUser(userId) as User;
      return user?.preferences || {};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load user preferences');
    }
  }
);

// Async thunk to save user preferences
export const saveUserPreferences = createAsyncThunk(
  'theme/saveUserPreferences',
  async (params: { userId: string; preferences: any }, { rejectWithValue }) => {
    try {
      await DatabaseService.updateUser(params.userId, {
        preferences: params.preferences
      });
      return params.preferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save user preferences');
    }
  }
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadUserPreferences
      .addCase(loadUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.darkMode !== undefined) {
          state.darkMode = action.payload.darkMode;
        }
      })
      .addCase(loadUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // saveUserPreferences
      .addCase(saveUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveUserPreferences.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { toggleDarkMode, setDarkMode, clearError } = themeSlice.actions;
export default themeSlice.reducer;
