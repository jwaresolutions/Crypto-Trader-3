// filepath: /root/react-trade-app2/src/store/slices/portfolioSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Account, Position } from './types';
import { alpacaService } from '../../services/alpacaService';
import DatabaseService from '../../services/databaseService';

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
      
      // Store portfolio data in database
      // TODO: Implement updatePortfolio method in DatabaseService
      // const dbService = DatabaseService;
      // await dbService.updatePortfolio('default-user', {
      //   totalValue: account.portfolioValue,
      //   cash: account.cash,
      //   equity: account.equity,
      //   dayPL: account.dayPL,
      //   totalPL: account.unrealizedPL,
      //   updatedAt: new Date()
      // });

      // Store positions in database
      // TODO: Fix updatePosition method signature
      // for (const position of positions) {
      //   await dbService.updatePosition('default-user', {
      //     symbol: position.symbol,
      //     quantity: parseFloat(position.qty.toString()),
      //     averagePrice: position.avgEntryPrice,
      //     currentPrice: position.currentPrice,
      //     marketValue: position.marketValue,
      //     unrealizedPL: position.unrealizedPL,
      //     side: position.side === 'long' ? 'LONG' : 'SHORT',
      //     updatedAt: new Date()
      //   });
      // }
      
      return { account, positions };
    } catch (error: any) {
      console.warn('Alpaca API failed, using mock data:', error.message);
      
      // Provide mock data for development
      const mockAccount: Account = {
        id: 'mock-account-id',
        accountNumber: 'DEMO123456',
        status: 'ACTIVE',
        currency: 'USD',
        cash: 25000.00,
        buyingPower: 100000.00,
        portfolioValue: 65750.00,
        equity: 65750.00,
        lastEquity: 64200.00,
        longMarketValue: 40750.00,
        shortMarketValue: 0,
        dayPL: 1550.00,
        dayPLPercent: 2.41,
        unrealizedPL: 3250.00,
        unrealizedPLPercent: 5.18,
        tradingBlocked: false,
        transfersBlocked: false,
        accountBlocked: false,
        patternDayTrader: false,
        daytradingBuyingPower: 100000.00,
        regtBuyingPower: 100000.00,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockPositions: Position[] = [
        {
          symbol: 'BTCUSD',
          assetClass: 'crypto',
          exchange: 'CRYPTO',
          side: 'long',
          qty: 0.5,
          avgEntryPrice: 45000,
          currentPrice: 47500,
          marketValue: 23750,
          costBasis: 22500,
          unrealizedPL: 1250,
          unrealizedPLPercent: 5.56,
          unrealizedIntradayPL: 750,
          unrealizedIntradayPLPercent: 3.26,
          changeToday: 1500
        },
        {
          symbol: 'ETHUSD',
          assetClass: 'crypto',
          exchange: 'CRYPTO',
          side: 'long',
          qty: 5,
          avgEntryPrice: 3200,
          currentPrice: 3400,
          marketValue: 17000,
          costBasis: 16000,
          unrealizedPL: 1000,
          unrealizedPLPercent: 6.25,
          unrealizedIntradayPL: 500,
          unrealizedIntradayPLPercent: 3.03,
          changeToday: 200
        }
      ];

      return { account: mockAccount, positions: mockPositions };
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
