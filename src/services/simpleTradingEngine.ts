import { Store } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { addNotification } from '../store/slices/notificationsSlice';
import DatabaseService from './databaseService';
import NotificationService from './notificationService';

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

class SimpleTradingEngine {
  private store: Store<RootState>;
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
  }

  public start(): void {
    if (this.isRunning) {
      console.log('Trading engine is already running');
      return;
    }

    console.log('Starting simple trading engine...');
    this.isRunning = true;

    // Start market data simulation
    this.startMarketDataSimulation();

    // Start signal generation
    this.startSignalGeneration();

    // Start risk monitoring
    this.startRiskMonitoring();

    // Notify user
    this.store.dispatch(addNotification({
      id: Date.now().toString(),
      title: 'Trading Engine Started',
      message: 'Real-time trading engine is now active',
      type: 'system',
      priority: 'medium',
      read: false,
      createdAt: new Date().toISOString()
    }));
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('Trading engine is not running');
      return;
    }

    console.log('Stopping trading engine...');
    this.isRunning = false;

    // Clear intervals
    if (this.marketDataInterval) clearInterval(this.marketDataInterval);
    if (this.signalGenerationInterval) clearInterval(this.signalGenerationInterval);
    if (this.riskCheckInterval) clearInterval(this.riskCheckInterval);

    // Notify user
    this.store.dispatch(addNotification({
      id: Date.now().toString(),
      title: 'Trading Engine Stopped',
      message: 'Real-time trading engine has been stopped',
      type: 'system',
      priority: 'medium',
      read: false,
      createdAt: new Date().toISOString()
    }));
  }

  public updateConfig(newConfig: Partial<TradingEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Trading engine configuration updated:', this.config);
  }

  public getConfig(): TradingEngineConfig {
    return { ...this.config };
  }

  public getStatus(): {
    isRunning: boolean;
    activeSignals: number;
    config: TradingEngineConfig;
  } {
    return {
      isRunning: this.isRunning,
      activeSignals: this.activeSignals.size,
      config: this.config,
    };
  }

  private startMarketDataSimulation(): void {
    this.marketDataInterval = setInterval(() => {
      if (!this.isRunning) return;

      // Simulate market data updates for common symbols
      const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD'];
      symbols.forEach(symbol => {
        const mockData = this.generateMockMarketData(symbol);
        this.handleMarketDataUpdate(mockData);
      });
    }, 5000); // Update every 5 seconds
  }

  private startSignalGeneration(): void {
    this.signalGenerationInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.generateTradingSignals();
      } catch (error) {
        console.error('Error generating trading signals:', error);
      }
    }, 30000); // Generate signals every 30 seconds
  }

  private startRiskMonitoring(): void {
    this.riskCheckInterval = setInterval(() => {
      if (!this.isRunning) return;

      this.performRiskCheck();
    }, 60000); // Risk check every minute
  }

  private generateMockMarketData(symbol: string): any {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const volatility = Math.random() * 0.02 - 0.01; // -1% to +1%
    const price = basePrice * (1 + volatility);

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      timestamp: Date.now(),
      volume: Math.floor(Math.random() * 1000000),
      change: volatility * 100,
      changePercent: volatility
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'AAPL': 150,
      'TSLA': 250,
      'SPY': 400,
      'QQQ': 350,
      'BTC-USD': 45000,
      'ETH-USD': 3000
    };
    return basePrices[symbol] || 100;
  }

  private handleMarketDataUpdate(data: any): void {
    // Update store with market data
    // This would typically dispatch to marketDataSlice
    console.log('Market data update:', data);
  }

  private async generateTradingSignals(): Promise<void> {
    try {
      const state = this.store.getState();
      const userId = state.auth.user?.id;

      if (!userId) return;

      // Simulate signal generation
      const symbols = ['AAPL', 'TSLA', 'SPY'];
      
      for (const symbol of symbols) {
        const signal = this.generateMockSignal(symbol);
        
        if (signal.action !== 'HOLD') {
          // Save signal to database
          await DatabaseService.saveTradingSignal({
            symbol: signal.symbol,
            strategyId: signal.strategyId,
            signal: signal.action.toLowerCase(),
            confidence: signal.confidence,
            price: signal.price,
            timestamp: new Date(signal.timestamp)
          });

          // Store in memory
          this.activeSignals.set(signal.id, signal);

          // Send notification if enabled
          if (this.config.enableSignalNotifications) {
            await NotificationService.createNotification({
              userId,
              title: 'Trading Signal Generated',
              message: `${signal.action} signal for ${signal.symbol} at $${signal.price} (${(signal.confidence * 100).toFixed(1)}% confidence)`,
              type: 'info',
              priority: 'medium'
            });
          }

          // Auto-execute if enabled
          if (this.config.enableAutoTrading) {
            await this.executeSignal(signal);
          }
        }
      }
    } catch (error) {
      console.error('Error in signal generation:', error);
    }
  }

  private generateMockSignal(symbol: string): TradingSignal {
    const actions: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const confidence = Math.random() * 0.4 + 0.6; // 60-100% confidence
    const price = this.getBasePriceForSymbol(symbol) * (1 + (Math.random() * 0.02 - 0.01));

    return {
      id: `signal_${Date.now()}_${symbol}`,
      strategyId: 'mock_strategy',
      symbol,
      action,
      confidence,
      price: parseFloat(price.toFixed(2)),
      timestamp: Date.now(),
      metadata: {
        reasoning: `Mock signal based on simulated analysis`,
        stopLoss: action === 'BUY' ? price * 0.95 : price * 1.05,
        takeProfit: action === 'BUY' ? price * 1.1 : price * 0.9
      }
    };
  }

  private async executeSignal(signal: TradingSignal): Promise<void> {
    try {
      const state = this.store.getState();
      const userId = state.auth.user?.id;

      if (!userId) return;

      console.log(`Executing ${signal.action} signal for ${signal.symbol} at $${signal.price}`);

      // Calculate position size
      const positionSize = Math.min(
        this.config.maxPositionSize,
        this.calculatePositionSize(signal)
      );

      // Create trade record
      await DatabaseService.saveTrade({
        userId,
        strategyId: signal.strategyId,
        symbol: signal.symbol,
        side: signal.action.toLowerCase(),
        type: 'market',
        quantity: positionSize,
        price: signal.price,
        status: 'pending',
        stopLoss: signal.metadata.stopLoss,
        takeProfit: signal.metadata.takeProfit,
        notes: `Auto-executed from signal ${signal.id}`
      });

      // Send notification
      if (this.config.enableTradeNotifications) {
        await NotificationService.notifyTradeExecuted(
          userId,
          signal.symbol,
          signal.action.toLowerCase(),
          positionSize,
          signal.price
        );
      }

      // Remove signal from active signals
      this.activeSignals.delete(signal.id);

    } catch (error) {
      console.error('Error executing signal:', error);
      
      const state = this.store.getState();
      const userId = state.auth.user?.id;
      
      if (userId) {
        await NotificationService.notifyTradeFailed(
          userId,
          signal.symbol,
          signal.action.toLowerCase(),
          (error as Error).message
        );
      }
    }
  }

  private calculatePositionSize(signal: TradingSignal): number {
    // Simple position sizing based on confidence and risk tolerance
    const baseSize = 100;
    const confidenceMultiplier = signal.confidence;
    return Math.floor(baseSize * confidenceMultiplier);
  }

  private performRiskCheck(): void {
    try {
      const state = this.store.getState();
      const userId = state.auth.user?.id;

      if (!userId) return;

      // Simulate risk calculations
      const riskMetrics = this.calculateRiskMetrics();

      // Check daily loss limit
      if (riskMetrics.dailyPnL < -this.config.maxDailyLoss) {
        this.handleRiskAlert('Daily loss limit exceeded', riskMetrics);
      }

      // Check maximum drawdown
      if (riskMetrics.maxDrawdown > 0.1) { // 10% max drawdown
        this.handleRiskAlert('Maximum drawdown exceeded', riskMetrics);
      }

    } catch (error) {
      console.error('Error in risk check:', error);
    }
  }

  private calculateRiskMetrics(): RiskMetrics {
    // Mock risk metrics calculation
    return {
      portfolioValue: 10000,
      totalExposure: 5000,
      dailyPnL: Math.random() * 200 - 100, // -100 to +100
      maxDrawdown: Math.random() * 0.05, // 0-5%
      sharpeRatio: Math.random() * 2,
      winRate: Math.random() * 0.4 + 0.4, // 40-80%
      profitFactor: Math.random() * 1.5 + 0.5 // 0.5-2.0
    };
  }

  private async handleRiskAlert(message: string, metrics: RiskMetrics): Promise<void> {
    const state = this.store.getState();
    const userId = state.auth.user?.id;

    if (!userId) return;

    console.warn('Risk alert:', message, metrics);

    // Stop auto trading if risk management is enabled
    if (this.config.enableRiskManagement) {
      this.config.enableAutoTrading = false;
      console.log('Auto trading disabled due to risk alert');
    }

    // Send risk notification
    await NotificationService.notifyRiskAlert(userId, message);

    // Dispatch to store
    this.store.dispatch(addNotification({
      id: Date.now().toString(),
      title: 'Risk Alert',
      message: `${message}. Auto trading has been disabled.`,
      type: 'alert',
      priority: 'critical',
      read: false,
      createdAt: new Date().toISOString()
    }));
  }

  public getRiskMetrics(): RiskMetrics {
    return this.calculateRiskMetrics();
  }

  public getActiveSignals(): TradingSignal[] {
    return Array.from(this.activeSignals.values());
  }

  public clearActiveSignals(): void {
    this.activeSignals.clear();
  }
}

export default SimpleTradingEngine;
