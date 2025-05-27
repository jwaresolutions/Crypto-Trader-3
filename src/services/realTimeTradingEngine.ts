import { Store } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../store';
import { updateMarketData } from '../store/slices/marketDataSlice';
import { updateOrder, placeOrder } from '../store/slices/ordersSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import { updateAccount } from '../store/slices/portfolioSlice';
import { addTradingSignal } from '../store/slices/strategiesSlice';
import DatabaseService from './databaseService';
import NotificationService from './notificationService';
import UserPreferencesService from './userPreferencesService';
import { webSocketService } from './websocketService';
import { strategyService } from './strategyService';
import { alpacaService } from './alpacaService';

export interface TradingEngineConfig {
  enableAutoTrading: boolean;
  maxPositionSize: number;
  maxDailyLoss: number;
  enableRiskManagement: boolean;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  enableSignalNotifications: boolean;
  enableTradeNotifications: boolean;
}

export interface TradingSignal {
  id: string;
  strategyId: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: number;
  metadata: {
    indicators?: any;
    reasoning?: string;
    stopLoss?: number;
    takeProfit?: number;
  };
}

export interface RiskMetrics {
  portfolioValue: number;
  totalExposure: number;
  dailyPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
}

class RealTimeTradingEngine {
  private store: Store<RootState> & { dispatch: AppDispatch };
  private config: TradingEngineConfig;
  private isRunning: boolean = false;
  private activeSignals: Map<string, TradingSignal> = new Map();
  private marketDataInterval: NodeJS.Timeout | null = null;
  private signalGenerationInterval: NodeJS.Timeout | null = null;
  private riskCheckInterval: NodeJS.Timeout | null = null;

  constructor(store: Store<RootState>) {
    this.store = store;
    this.config = {
      enableAutoTrading: false,
      maxPositionSize: 1000,
      maxDailyLoss: 500,
      enableRiskManagement: true,
      stopLossPercentage: 5,
      takeProfitPercentage: 10,
      enableSignalNotifications: true,
      enableTradeNotifications: true,
    };

    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    // Subscribe to real-time market data
    webSocketService.subscribeToMarketData((data: any) => {
      this.handleMarketDataUpdate(data);
    });

    // Subscribe to trade updates
    webSocketService.subscribeToTradeUpdates((data: any) => {
      this.handleTradeUpdate(data);
    });
  }

  public start(): void {
    if (this.isRunning) {
      console.log('Trading engine is already running');
      return;
    }

    console.log('Starting real-time trading engine...');
    this.isRunning = true;

    // Start market data updates
    this.startMarketDataUpdates();

    // Start signal generation
    this.startSignalGeneration();

    // Start risk monitoring
    this.startRiskMonitoring();

    // Connect to real-time data feeds
    webSocketService.connect();

    this.store.dispatch(addNotification({
      id: Date.now().toString(),
      type: 'system',
      title: 'Trading Engine Started',
      message: 'Real-time trading engine is now active',
      priority: 'medium',
      read: false,
      createdAt: new Date().toISOString(),
    }));
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('Trading engine is not running');
      return;
    }

    console.log('Stopping real-time trading engine...');
    this.isRunning = false;

    // Clear intervals
    if (this.marketDataInterval) clearInterval(this.marketDataInterval);
    if (this.signalGenerationInterval) clearInterval(this.signalGenerationInterval);
    if (this.riskCheckInterval) clearInterval(this.riskCheckInterval);

    // Disconnect from real-time data feeds
    webSocketService.disconnect();

    this.store.dispatch(addNotification({
      id: Date.now().toString(),
      type: 'system',
      title: 'Trading Engine Stopped',
      message: 'Real-time trading engine has been deactivated',
      priority: 'medium',
      read: false,
      createdAt: new Date().toISOString(),
    }));
  }

  public updateConfig(newConfig: Partial<TradingEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.store.dispatch(addNotification({
      id: Date.now().toString(),
      type: 'system',
      title: 'Trading Configuration Updated',
      message: 'Trading engine configuration has been updated',
      priority: 'low',
      read: false,
      createdAt: new Date().toISOString(),
    }));
  }

  private startMarketDataUpdates(): void {
    this.marketDataInterval = setInterval(async () => {
      try {
        const state = this.store.getState();
        const symbols = state.portfolio.watchlist || ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD'];
        
        // In a real implementation, this would fetch from your data provider
        // For now, we'll generate realistic mock data
        for (const symbol of symbols) {
          const mockData = this.generateMockMarketData(symbol);
          this.store.dispatch(updateMarketData(mockData));
        }
      } catch (error) {
        console.error('Error updating market data:', error);
      }
    }, 1000); // Update every second
  }

  private startSignalGeneration(): void {
    this.signalGenerationInterval = setInterval(async () => {
      try {
        const state = this.store.getState();
        const strategies = state.strategies.strategies;
        const marketData = state.marketData.symbols;

        for (const strategy of strategies) {
          if (strategy.enabled) {
            const signals = await this.generateSignalsForStrategy(strategy, marketData);
            
            for (const signal of signals) {
              this.processSignal(signal);
            }
          }
        }
      } catch (error) {
        console.error('Error generating signals:', error);
      }
    }, 5000); // Generate signals every 5 seconds
  }

  private startRiskMonitoring(): void {
    this.riskCheckInterval = setInterval(async () => {
      try {
        const riskMetrics = await this.calculateRiskMetrics();
        await this.checkRiskLimits(riskMetrics);
      } catch (error) {
        console.error('Error monitoring risk:', error);
      }
    }, 10000); // Check risk every 10 seconds
  }

  private handleMarketDataUpdate(data: any): void {
    this.store.dispatch(updateMarketData(data));
    
    // Check for stop loss / take profit triggers
    this.checkPositionTriggers(data);
  }

  private handleOrderUpdate(data: any): void {
    this.store.dispatch(updateOrder(data));
    
    if (this.config.enableTradeNotifications) {
      this.store.dispatch(addNotification({
        id: Date.now().toString(),
        type: 'trade',
        title: 'Order Update',
        message: `Order ${data.id} status: ${data.status}`,
        priority: 'medium',
        read: false,
        data: data,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  private handleTradeUpdate(data: any): void {
    // Update portfolio based on trade
    this.updatePortfolioFromTrade(data);
    
    if (this.config.enableTradeNotifications) {
      this.store.dispatch(addNotification({
        id: Date.now().toString(),
        type: 'trade',
        title: 'Trade Executed',
        message: `${data.side.toUpperCase()} ${data.qty} ${data.symbol} at $${data.price}`,
        priority: 'high',
        read: false,
        data: data,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  private async generateSignalsForStrategy(strategy: any, marketData: any): Promise<TradingSignal[]> {
    try {
      // Use the existing strategy service to generate signals
      const signals = await strategyService.generateSignals(strategy.id, marketData);
      
      return signals.map(signal => ({
        id: `${strategy.id}_${signal.symbol}_${Date.now()}`,
        strategyId: strategy.id,
        symbol: signal.symbol,
        action: signal.action,
        confidence: signal.confidence || 0.7,
        price: signal.price,
        timestamp: Date.now(),
        metadata: signal.metadata || {},
      }));
    } catch (error) {
      console.error('Error generating signals for strategy:', strategy.name, error);
      return [];
    }
  }

  private async processSignal(signal: TradingSignal): Promise<void> {
    // Store the signal
    this.activeSignals.set(signal.id, signal);
    
    // Add to Redux store
    try {
      await this.store.dispatch(addTradingSignal({
        symbol: signal.symbol,
        strategyId: signal.strategyId,
        signal: signal.action.toLowerCase(),
        confidence: signal.confidence,
        price: signal.price,
        timestamp: new Date(signal.timestamp),
      })).unwrap();
    } catch (error) {
      console.error('Error adding trading signal to store:', error);
    }

    // Send notification
    if (this.config.enableSignalNotifications) {
      this.store.dispatch(addNotification({
        id: Date.now().toString(),
        type: 'signal',
        title: 'New Trading Signal',
        message: `${signal.action} signal for ${signal.symbol} (${(signal.confidence * 100).toFixed(1)}% confidence)`,
        priority: signal.confidence > 0.8 ? 'high' : 'medium',
        read: false,
        actionRequired: this.config.enableAutoTrading,
        actionUrl: '/trading',
        data: signal,
        createdAt: new Date().toISOString(),
      }));
    }

    // Execute trade if auto-trading is enabled
    if (this.config.enableAutoTrading && signal.confidence > 0.7) {
      await this.executeSignal(signal);
    }

    // Save signal to database
    const state = this.store.getState();
    if (state.auth.user) {
      try {
        await DatabaseService.saveTradingSignal({
          strategyId: signal.strategyId,
          symbol: signal.symbol,
          signal: signal.action.toLowerCase(),
          confidence: signal.confidence,
          price: signal.price,
          timestamp: new Date(signal.timestamp),
        });
      } catch (error) {
        console.error('Error saving signal to database:', error);
      }
    }
  }

  private async executeSignal(signal: TradingSignal): Promise<void> {
    try {
      const state = this.store.getState();
      
      // Calculate position size based on risk management
      const positionSize = this.calculatePositionSize(signal);
      
      if (positionSize <= 0) {
        console.log('Position size too small, skipping trade');
        return;
      }

      // Create order
      const orderRequest = {
        symbol: signal.symbol,
        side: signal.action.toLowerCase() as 'buy' | 'sell',
        type: 'market' as const,
        qty: positionSize.toString(),
        time_in_force: 'day' as const,
        userId: state.auth.user?.id,
        strategyId: signal.strategyId,
      };

      // Place order through Redux action
      try {
        const result = await this.store.dispatch(placeOrder(orderRequest)).unwrap();
        console.log(`Executed ${signal.action} order for ${signal.symbol}:`, orderRequest);
      } catch (error) {
        throw new Error('Failed to place order: ' + (error as string));
      }
    } catch (error: any) {
      console.error('Error executing signal:', error);
      
      this.store.dispatch(addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Order Execution Failed',
        message: `Failed to execute ${signal.action} order for ${signal.symbol}: ${error?.message || 'Unknown error'}`,
        priority: 'high',
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  private calculatePositionSize(signal: TradingSignal): number {
    const state = this.store.getState();
    const portfolioValue = state.portfolio.totalValue || 10000;
    
    // Risk 1% of portfolio per trade
    const riskAmount = portfolioValue * 0.01;
    
    // Calculate position size based on stop loss
    const stopLossDistance = signal.metadata.stopLoss 
      ? Math.abs(signal.price - signal.metadata.stopLoss) 
      : signal.price * (this.config.stopLossPercentage / 100);
    
    const positionSize = riskAmount / stopLossDistance;
    
    // Apply maximum position size limit
    return Math.min(positionSize, this.config.maxPositionSize);
  }

  private async calculateRiskMetrics(): Promise<RiskMetrics> {
    const state = this.store.getState();
    const portfolio = state.portfolio;
    
    // Calculate basic risk metrics
    return {
      portfolioValue: portfolio.totalValue || 0,
      totalExposure: portfolio.positions?.reduce((sum, pos) => sum + Math.abs(pos.marketValue || 0), 0) || 0,
      dailyPnL: portfolio.dayPL || 0,
      maxDrawdown: 0, // Would need historical data to calculate
      sharpeRatio: 0, // Would need returns history to calculate
      winRate: 0, // Would need trade history to calculate
      profitFactor: 0, // Would need trade history to calculate
    };
  }

  private async checkRiskLimits(riskMetrics: RiskMetrics): Promise<void> {
    // Check daily loss limit
    if (Math.abs(riskMetrics.dailyPnL) > this.config.maxDailyLoss) {
      this.store.dispatch(addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Daily Loss Limit Exceeded',
        message: `Daily loss of $${Math.abs(riskMetrics.dailyPnL).toFixed(2)} exceeds limit of $${this.config.maxDailyLoss}`,
        priority: 'critical',
        read: false,
        actionRequired: true,
        createdAt: new Date().toISOString(),
      }));

      // Disable auto-trading if enabled
      if (this.config.enableAutoTrading) {
        this.config.enableAutoTrading = false;
        console.log('Auto-trading disabled due to daily loss limit breach');
      }
    }
  }

  private checkPositionTriggers(marketData: any): void {
    const state = this.store.getState();
    const positions = state.portfolio.positions || [];
    
    positions.forEach(position => {
      if (position.symbol === marketData.symbol) {
        // Check stop loss
        const shouldTriggerStopLoss = this.shouldTriggerStopLoss(position, marketData.price);
        if (shouldTriggerStopLoss) {
          this.executeStopLoss(position);
        }
        
        // Check take profit
        const shouldTriggerTakeProfit = this.shouldTriggerTakeProfit(position, marketData.price);
        if (shouldTriggerTakeProfit) {
          this.executeTakeProfit(position);
        }
      }
    });
  }

  private shouldTriggerStopLoss(position: any, currentPrice: number): boolean {
    if (!this.config.enableRiskManagement) return false;
    
    const stopLossPrice = position.side === 'long' 
      ? position.avgEntryPrice * (1 - this.config.stopLossPercentage / 100)
      : position.avgEntryPrice * (1 + this.config.stopLossPercentage / 100);
    
    return position.side === 'long' 
      ? currentPrice <= stopLossPrice 
      : currentPrice >= stopLossPrice;
  }

  private shouldTriggerTakeProfit(position: any, currentPrice: number): boolean {
    if (!this.config.enableRiskManagement) return false;
    
    const takeProfitPrice = position.side === 'long' 
      ? position.avgEntryPrice * (1 + this.config.takeProfitPercentage / 100)
      : position.avgEntryPrice * (1 - this.config.takeProfitPercentage / 100);
    
    return position.side === 'long' 
      ? currentPrice >= takeProfitPrice 
      : currentPrice <= takeProfitPrice;
  }

  private async executeStopLoss(position: any): Promise<void> {
    // Implementation for stop loss execution
    console.log('Executing stop loss for position:', position.symbol);
  }

  private async executeTakeProfit(position: any): Promise<void> {
    // Implementation for take profit execution
    console.log('Executing take profit for position:', position.symbol);
  }

  private updatePortfolioFromTrade(trade: any): void {
    // Update portfolio state based on trade execution
    // This would integrate with the portfolio slice
  }

  private generateMockMarketData(symbol: string): any {
    // Generate realistic mock market data for testing
    const basePrice = this.getBasePriceForSymbol(symbol);
    const change = (Math.random() - 0.5) * 0.02; // ±1% change
    const price = basePrice * (1 + change);
    
    return {
      symbol,
      price: Number(price.toFixed(2)),
      change: Number((price - basePrice).toFixed(2)),
      changePercent: Number((change * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
      high: Number((price * 1.005).toFixed(2)),
      low: Number((price * 0.995).toFixed(2)),
      open: basePrice,
      prevClose: basePrice,
      timestamp: Date.now(),
      bid: Number((price * 0.999).toFixed(2)),
      ask: Number((price * 1.001).toFixed(2)),
      bidSize: Math.floor(Math.random() * 100),
      askSize: Math.floor(Math.random() * 100),
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTCUSD': 65000,
      'ETHUSD': 3500,
      'ADAUSD': 0.45,
      'SOLUSD': 150,
    };
    return basePrices[symbol] || 100;
  }

  public getConfig(): TradingEngineConfig {
    return { ...this.config };
  }

  public isEngineRunning(): boolean {
    return this.isRunning;
  }

  public getActiveSignals(): TradingSignal[] {
    return Array.from(this.activeSignals.values());
  }
}

// Export a singleton instance
let tradingEngineInstance: RealTimeTradingEngine | null = null;

export const createTradingEngine = (store: Store<RootState>): RealTimeTradingEngine => {
  if (!tradingEngineInstance) {
    tradingEngineInstance = new RealTimeTradingEngine(store);
  }
  return tradingEngineInstance;
};

export const getTradingEngine = (): RealTimeTradingEngine | null => {
  return tradingEngineInstance;
};

export default RealTimeTradingEngine;
