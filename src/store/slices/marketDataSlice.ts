import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MarketData } from './types';
import { polygonService } from '../../services/polygonService';
import { webSocketService } from '../../services/websocketService';
import DatabaseService from '../../services/databaseService';

interface MarketDataState {
  symbols: Record<string, MarketData>;
  historicalData: Record<string, any[]>; // symbol -> historical data array
  currentSymbol: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const initialState: MarketDataState = {
  symbols: {},
  historicalData: {},
  currentSymbol: 'BTCUSD',
  isLoading: false,
  error: null,
  lastUpdated: 0,
  connectionStatus: 'disconnected'
};

// Async thunks for API calls
export const fetchMarketData = createAsyncThunk(
  'marketData/fetchMarketData',
  async (symbols: string[], { rejectWithValue }) => {
    try {
      const marketData = await polygonService.getTickerSnapshots(symbols);
      const symbolsMap: Record<string, MarketData> = {};
      
      marketData.forEach(data => {
        symbolsMap[data.symbol] = data;
        // Store market data in database
        DatabaseService.saveMarketData({
          symbol: data.symbol,
          timestamp: new Date(),
          open: data.open || data.price,
          high: data.high || data.price,
          low: data.low || data.price,
          close: data.price,
          volume: data.volume || 0,
          vwap: data.price, // Use current price as VWAP fallback
          source: 'polygon'
        }).catch((err: any) => console.warn('Failed to store market data:', err));
      });
      
      return symbolsMap;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch market data');
    }
  }
);

export const fetchHistoricalData = createAsyncThunk(
  'marketData/fetchHistoricalData',
  async ({ symbol, timeframe, from, to }: { 
    symbol: string; 
    timeframe: string; 
    from: Date; 
    to: Date;
  }, { rejectWithValue }) => {
    try {
      const dbService = DatabaseService;
      const historicalData = await dbService.getMarketData(symbol, from, to);
      return { symbol, data: historicalData };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch historical data');
    }
  }
);

export const fetchSingleSymbol = createAsyncThunk(
  'marketData/fetchSingleSymbol',
  async (symbol: string, { rejectWithValue }) => {
    try {
      const marketData = await polygonService.getTickerSnapshot(symbol);
      return marketData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch symbol data');
    }
  }
);

export const subscribeToRealTimeData = createAsyncThunk(
  'marketData/subscribeToRealTimeData',
  async (symbols: string[], { dispatch }) => {
    try {
      // Subscribe to WebSocket updates
      symbols.forEach(symbol => {
        webSocketService.subscribeToSymbol(symbol);
      });
      
      // Set up market data update listener
      webSocketService.subscribeToMarketData((data: Partial<MarketData>) => {
        if (data.symbol) {
          dispatch(updateMarketData(data));
        }
      });
      
      return symbols;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to subscribe to real-time data');
    }
  }
);

export const unsubscribeFromRealTimeData = createAsyncThunk(
  'marketData/unsubscribeFromRealTimeData',
  async (symbols: string[]) => {
    symbols.forEach(symbol => {
      webSocketService.unsubscribeFromSymbol(symbol);
    });
    return symbols;
  }
);

const marketDataSlice = createSlice({
  name: 'marketData',
  initialState,
  reducers: {
    setCurrentSymbol: (state, action: PayloadAction<string>) => {
      state.currentSymbol = action.payload;
    },
    updateMarketData: (state, action: PayloadAction<Partial<MarketData>>) => {
      const { symbol } = action.payload;
      if (symbol && state.symbols[symbol]) {
        state.symbols[symbol] = { ...state.symbols[symbol], ...action.payload };
        state.lastUpdated = Date.now();
      }
    },
    setConnectionStatus: (state, action: PayloadAction<MarketDataState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchMarketData
      .addCase(fetchMarketData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.symbols = { ...state.symbols, ...action.payload };
        state.lastUpdated = Date.now();
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchHistoricalData
      .addCase(fetchHistoricalData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHistoricalData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.historicalData[action.payload.symbol] = action.payload.data;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchHistoricalData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchSingleSymbol
      .addCase(fetchSingleSymbol.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSingleSymbol.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.symbols[action.payload.symbol] = action.payload;
          state.lastUpdated = Date.now();
        }
      })
      .addCase(fetchSingleSymbol.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // subscribeToRealTimeData
      .addCase(subscribeToRealTimeData.pending, (state) => {
        state.connectionStatus = 'connecting';
      })
      .addCase(subscribeToRealTimeData.fulfilled, (state) => {
        state.connectionStatus = 'connected';
      })
      .addCase(subscribeToRealTimeData.rejected, (state, action) => {
        state.connectionStatus = 'error';
        state.error = action.error.message || 'Failed to connect to real-time data';
      })
      // unsubscribeFromRealTimeData
      .addCase(unsubscribeFromRealTimeData.fulfilled, (state) => {
        state.connectionStatus = 'disconnected';
      });
  }
});

export const {
  setCurrentSymbol,
  updateMarketData,
  setConnectionStatus,
  clearError
} = marketDataSlice.actions;

export default marketDataSlice.reducer;
