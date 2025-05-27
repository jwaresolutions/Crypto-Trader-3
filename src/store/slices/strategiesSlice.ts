import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import DatabaseService from '../../services/databaseService';

// Trade Strategy Types
export type StrategySignal = 'buy' | 'short' | 'none';

export interface StrategyParameter {
  name: string;
  type: 'number' | 'boolean' | 'string' | 'select';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface TradeStrategy {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'fundamental' | 'sentiment' | 'momentum' | 'custom';
  enabled: boolean;
  parameters: StrategyParameter[];
  currentSignal: StrategySignal;
  lastSignalTime: number;
  performance: {
    totalSignals: number;
    successfulSignals: number;
    winRate: number;
    averageReturn: number;
  };
  created: string;
  lastModified: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'fundamental' | 'sentiment' | 'momentum' | 'custom';
  defaultParameters: StrategyParameter[];
}

export interface AutoTradingSettings {
  enabled: boolean;
  riskManagement: {
    maxPositionSize: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    maxDailyLoss: number;
  };
  signalAggregation: {
    method: 'majority' | 'weighted' | 'unanimous' | 'custom';
    minimumSignals: number;
    weights: Record<string, number>;
  };
  executionSettings: {
    orderType: 'market' | 'limit';
    slippage: number;
    retryAttempts: number;
  };
}

interface StrategiesState {
  strategies: TradeStrategy[];
  templates: StrategyTemplate[];
  autoTradingSettings: AutoTradingSettings;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

const initialTemplates: StrategyTemplate[] = [
  {
    id: 'rsi-oversold',
    name: 'RSI Oversold/Overbought',
    description: 'Generates signals based on RSI levels indicating oversold or overbought conditions',
    category: 'technical',
    defaultParameters: [
      { name: 'rsiPeriod', type: 'number', value: 14, min: 5, max: 50, step: 1, description: 'RSI calculation period' },
      { name: 'oversoldLevel', type: 'number', value: 30, min: 10, max: 40, step: 1, description: 'RSI oversold threshold' },
      { name: 'overboughtLevel', type: 'number', value: 70, min: 60, max: 90, step: 1, description: 'RSI overbought threshold' },
    ]
  },
  {
    id: 'moving-average-crossover',
    name: 'Moving Average Crossover',
    description: 'Generates signals when fast MA crosses above or below slow MA',
    category: 'technical',
    defaultParameters: [
      { name: 'fastPeriod', type: 'number', value: 10, min: 5, max: 50, step: 1, description: 'Fast moving average period' },
      { name: 'slowPeriod', type: 'number', value: 30, min: 20, max: 200, step: 1, description: 'Slow moving average period' },
      { name: 'maType', type: 'select', value: 'sma', options: ['sma', 'ema', 'wma'], description: 'Moving average type' },
    ]
  },
  {
    id: 'bollinger-bands',
    name: 'Bollinger Bands Breakout',
    description: 'Generates signals when price breaks above or below Bollinger Bands',
    category: 'technical',
    defaultParameters: [
      { name: 'period', type: 'number', value: 20, min: 10, max: 50, step: 1, description: 'Bollinger Bands period' },
      { name: 'standardDeviations', type: 'number', value: 2, min: 1, max: 3, step: 0.1, description: 'Standard deviations' },
      { name: 'breakoutConfirmation', type: 'boolean', value: true, description: 'Require volume confirmation' },
    ]
  },
  {
    id: 'macd-momentum',
    name: 'MACD Momentum',
    description: 'Generates signals based on MACD line and signal line crossover',
    category: 'momentum',
    defaultParameters: [
      { name: 'fastPeriod', type: 'number', value: 12, min: 5, max: 30, step: 1, description: 'MACD fast EMA period' },
      { name: 'slowPeriod', type: 'number', value: 26, min: 15, max: 50, step: 1, description: 'MACD slow EMA period' },
      { name: 'signalPeriod', type: 'number', value: 9, min: 5, max: 20, step: 1, description: 'MACD signal line period' },
    ]
  },
  {
    id: 'volume-spike',
    name: 'Volume Spike Strategy',
    description: 'Generates signals when unusual volume spikes occur with price movement',
    category: 'technical',
    defaultParameters: [
      { name: 'volumeMultiplier', type: 'number', value: 2, min: 1.5, max: 5, step: 0.1, description: 'Volume spike multiplier' },
      { name: 'priceChangeThreshold', type: 'number', value: 2, min: 0.5, max: 10, step: 0.1, description: 'Minimum price change %' },
      { name: 'lookbackPeriod', type: 'number', value: 20, min: 10, max: 50, step: 1, description: 'Volume average lookback period' },
    ]
  }
];

const initialState: StrategiesState = {
  strategies: [],
  templates: initialTemplates,
  autoTradingSettings: {
    enabled: false,
    riskManagement: {
      maxPositionSize: 1000,
      stopLossPercent: 5,
      takeProfitPercent: 10,
      maxDailyLoss: 500,
    },
    signalAggregation: {
      method: 'majority',
      minimumSignals: 2,
      weights: {},
    },
    executionSettings: {
      orderType: 'market',
      slippage: 0.1,
      retryAttempts: 3,
    },
  },
  isLoading: false,
  error: null,
  lastUpdated: 0,
};

// Async thunks for strategy operations
export const loadStrategies = createAsyncThunk(
  'strategies/loadStrategies',
  async (userId: string = 'default-user', { rejectWithValue }) => {
    try {
      const dbService = DatabaseService;
      const strategies = await dbService.getUserStrategies(userId);
      
      // Convert database strategies to frontend format
      return strategies.map((strategy: any) => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description || '',
        category: (strategy.type as any) || 'custom',
        enabled: strategy.isActive,
        parameters: JSON.parse(strategy.parameters || '[]'),
        currentSignal: 'none' as StrategySignal,
        lastSignalTime: 0,
        performance: {
          totalSignals: 0,
          successfulSignals: 0,
          winRate: 0,
          averageReturn: 0,
        },
        created: strategy.createdAt.toISOString(),
        lastModified: strategy.updatedAt.toISOString(),
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load strategies');
    }
  }
);

export const createStrategy = createAsyncThunk(
  'strategies/createStrategy',
  async (strategyData: { templateId: string; name: string; parameters: StrategyParameter[] }, { rejectWithValue }) => {
    try {
      // TODO: Implement database strategy creation
      // For now, using mock implementation
      const strategy = {
        id: `strategy_${Date.now()}`,
        name: strategyData.name,
        description: `Custom strategy based on ${strategyData.templateId}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newStrategy: TradeStrategy = {
        id: strategy.id,
        name: strategy.name,
        description: strategy.description || '',
        category: 'custom',
        enabled: false,
        parameters: strategyData.parameters,
        currentSignal: 'none',
        lastSignalTime: 0,
        performance: {
          totalSignals: 0,
          successfulSignals: 0,
          winRate: 0,
          averageReturn: 0,
        },
        created: strategy.createdAt.toISOString(),
        lastModified: strategy.updatedAt.toISOString(),
      };
      
      return newStrategy;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create strategy');
    }
  }
);

export const updateStrategy = createAsyncThunk(
  'strategies/updateStrategy',
  async (updateData: { id: string; parameters: StrategyParameter[] }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return updateData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update strategy');
    }
  }
);

export const deleteStrategy = createAsyncThunk(
  'strategies/deleteStrategy',
  async (strategyId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement database strategy deletion
      // For now, using mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      return strategyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete strategy');
    }
  }
);

export const updateAutoTradingSettings = createAsyncThunk(
  'strategies/updateAutoTradingSettings',
  async (settings: Partial<AutoTradingSettings>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return settings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update auto trading settings');
    }
  }
);

const strategiesSlice = createSlice({
  name: 'strategies',
  initialState,
  reducers: {
    toggleStrategy: (state, action: PayloadAction<string>) => {
      const strategy = state.strategies.find(s => s.id === action.payload);
      if (strategy) {
        strategy.enabled = !strategy.enabled;
        strategy.lastModified = new Date().toISOString();
      }
    },
    updateStrategySignal: (state, action: PayloadAction<{ id: string; signal: StrategySignal }>) => {
      const strategy = state.strategies.find(s => s.id === action.payload.id);
      if (strategy) {
        strategy.currentSignal = action.payload.signal;
        strategy.lastSignalTime = Date.now();
        strategy.performance.totalSignals += 1;
      }
    },
    toggleAutoTrading: (state) => {
      state.autoTradingSettings.enabled = !state.autoTradingSettings.enabled;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadStrategies
      .addCase(loadStrategies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadStrategies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.strategies = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(loadStrategies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // createStrategy
      .addCase(createStrategy.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStrategy.fulfilled, (state, action) => {
        state.isLoading = false;
        state.strategies.push(action.payload);
        state.lastUpdated = Date.now();
      })
      .addCase(createStrategy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // updateStrategy
      .addCase(updateStrategy.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStrategy.fulfilled, (state, action) => {
        state.isLoading = false;
        const strategy = state.strategies.find(s => s.id === action.payload.id);
        if (strategy) {
          strategy.parameters = action.payload.parameters;
          strategy.lastModified = new Date().toISOString();
        }
        state.lastUpdated = Date.now();
      })
      .addCase(updateStrategy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // deleteStrategy
      .addCase(deleteStrategy.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStrategy.fulfilled, (state, action) => {
        state.isLoading = false;
        state.strategies = state.strategies.filter(s => s.id !== action.payload);
        state.lastUpdated = Date.now();
      })
      .addCase(deleteStrategy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // updateAutoTradingSettings
      .addCase(updateAutoTradingSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAutoTradingSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.autoTradingSettings = { ...state.autoTradingSettings, ...action.payload };
        state.lastUpdated = Date.now();
      })
      .addCase(updateAutoTradingSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  toggleStrategy,
  updateStrategySignal,
  toggleAutoTrading,
  clearError,
} = strategiesSlice.actions;

export default strategiesSlice.reducer;
