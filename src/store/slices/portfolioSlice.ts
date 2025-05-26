// filepath: /root/react-trade-app2/src/store/slices/portfolioSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Account, Position } from './types';
import { alpacaService } from '../../services/alpacaService';

interface PortfolioState {
  account: Account | null;
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

const initialState: PortfolioState = {
  account: null,
  positions: [],
  isLoading: false,
  error: null,
  lastUpdated: 0
};

// Async thunks for API calls
export const fetchAccount = createAsyncThunk(
  'portfolio/fetchAccount',
  async (_, { rejectWithValue }) => {
    try {
      const account = await alpacaService.getAccount();
      return account;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch account');
    }
  }
);

export const fetchPositions = createAsyncThunk(
  'portfolio/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const positions = await alpacaService.getPositions();
      return positions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch positions');
    }
  }
);

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const [account, positions] = await Promise.all([
        alpacaService.getAccount(),
        alpacaService.getPositions()
      ]);
      return { account, positions };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch portfolio');
    }
  }
);

export const closePosition = createAsyncThunk(
  'portfolio/closePosition',
  async (params: { symbol: string; qty?: string; percentage?: string }, { rejectWithValue }) => {
    try {
      const { symbol, qty, percentage } = params;
      const order = await alpacaService.closePosition(symbol, qty, percentage);
      return { symbol, order };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to close position');
    }
  }
);

export const closeAllPositions = createAsyncThunk(
  'portfolio/closeAllPositions',
  async (_, { rejectWithValue }) => {
    try {
      const orders = await alpacaService.closeAllPositions();
      return orders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to close all positions');
    }
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    updatePosition: (state, action: PayloadAction<Position>) => {
      const index = state.positions.findIndex((pos: Position) => pos.symbol === action.payload.symbol);
      if (index !== -1) {
        state.positions[index] = action.payload;
      } else {
        state.positions.push(action.payload);
      }
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.positions = state.positions.filter((pos: Position) => pos.symbol !== action.payload);
    },
    updateAccount: (state, action: PayloadAction<Account>) => {
      state.account = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAccount
      .addCase(fetchAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.account = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchPositions
      .addCase(fetchPositions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.positions = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchPortfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.account = action.payload.account;
        state.positions = action.payload.positions;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // closePosition
      .addCase(closePosition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(closePosition.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the closed position from positions array
        const { symbol } = action.payload;
        state.positions = state.positions.filter((pos: Position) => pos.symbol !== symbol);
      })
      .addCase(closePosition.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // closeAllPositions
      .addCase(closeAllPositions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(closeAllPositions.fulfilled, (state) => {
        state.isLoading = false;
        state.positions = [];
      })
      .addCase(closeAllPositions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  updatePosition,
  removePosition,
  updateAccount,
  clearError
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
