import databaseService from './databaseService';
import { BacktestingService } from './backtestingService';

export interface MarketDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  timestamp: Date;
  signal: 'buy' | 'sell' | 'short' | 'cover' | 'none';
  price: number;
  confidence?: number;
  reason?: string;
}

export interface StrategyConfig {
  id: string;
  name: string;
  templateId: string;
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  side: 'long' | 'short';
}

/**
 * Enhanced Trading Engine with Database Integration
 * This service handles live trading decisions, strategy execution, and data persistence
 */
class TradingEngine {
  private static instance: TradingEngine;
  private backtestingService: BacktestingService;
  private activeStrategies: Map<string, StrategyConfig> = new Map();
  private positions: Map<string, Position> = new Map();
  private isRunning: boolean = false;

  private constructor() {
    this.backtestingService = new BacktestingService();
  }

  public static getInstance(): TradingEngine {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine();
    }
    return TradingEngine.instance;
  }

  /**
   * Initialize the trading engine
   */
  async initialize(userId: string) {
    try {
      // Initialize database
      await databaseService.initialize();
      
      // Load user's active strategies
      await this.loadActiveStrategies(userId);
      
      // Load current positions
      await this.loadPositions(userId);
      
      console.log('Trading engine initialized successfully');
    } catch (error) {
      console.error('Error initializing trading engine:', error);
      throw error;
    }
  }

  /**
   * Load active strategies for a user
   */
  private async loadActiveStrategies(userId: string) {
    try {
      const strategies = await databaseService.getUserStrategies(userId);
      
      this.activeStrategies.clear();
      strategies.forEach(strategy => {
        if (strategy.isActive) {
          this.activeStrategies.set(strategy.id, {
            id: strategy.id,
            name: strategy.name,
            templateId: strategy.templateId,
            parameters: strategy.parameters,
            isActive: strategy.isActive,
          });
        }
      });

      console.log(`Loaded ${this.activeStrategies.size} active strategies`);
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  }

  /**
   * Load current positions for a user
   */
  private async loadPositions(userId: string) {
    try {
      const portfolio = await databaseService.getPortfolio(userId);
      
      this.positions.clear();
      if (portfolio?.positions) {
        portfolio.positions.forEach(position => {
          if (position.quantity !== 0) {
            this.positions.set(position.symbol, {
              symbol: position.symbol,
              quantity: Math.abs(position.quantity),
              entryPrice: position.averagePrice,
              currentPrice: position.currentPrice || position.averagePrice,
              unrealizedPnl: position.unrealizedPnl || 0,
              side: position.quantity > 0 ? 'long' : 'short',
            });
          }
        });
      }

      console.log(`Loaded ${this.positions.size} active positions`);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  }

  /**
   * Process market data and generate trading signals
   */
  async processMarketData(symbol: string, data: MarketDataPoint): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    try {
      // Store market data in database
      await databaseService.saveMarketData({
        symbol,
        timestamp: data.timestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        source: 'live',
      });

      // Process each active strategy
      for (const [strategyId, strategy] of this.activeStrategies) {
        try {
          const signal = await this.generateSignalForStrategy(symbol, data, strategy);
          
          if (signal.signal !== 'none') {
            signals.push(signal);
            
            // Save signal to database
            await databaseService.saveTradingSignal({
              symbol,
              strategyId,
              signal: signal.signal,
              confidence: signal.confidence,
              price: signal.price,
              timestamp: signal.timestamp,
            });
          }
        } catch (error) {
          console.error(`Error processing strategy ${strategy.name}:`, error);
        }
      }

    } catch (error) {
      console.error('Error processing market data:', error);
    }

    return signals;
  }

  /**
   * Generate trading signal for a specific strategy
   */
  private async generateSignalForStrategy(
    symbol: string,
    currentData: MarketDataPoint,
    strategy: StrategyConfig
  ): Promise<TradingSignal> {
    const endDate = currentData.timestamp;
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days back

    try {
      // Get historical data for signal generation
      const historicalData = await databaseService.getMarketData(symbol, startDate, endDate);
      
      if (historicalData.length < 20) {
        // Not enough data for signal generation
        return {
          timestamp: currentData.timestamp,
          signal: 'none',
          price: currentData.close,
          reason: 'Insufficient historical data',
        };
      }

      // Convert to format expected by backtesting service
      const priceData = historicalData.map(d => ({
        date: d.timestamp.toISOString().split('T')[0],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));

      // Add current data point
      priceData.push({
        date: currentData.timestamp.toISOString().split('T')[0],
        open: currentData.open,
        high: currentData.high,
        low: currentData.low,
        close: currentData.close,
        volume: currentData.volume,
      });

      // Generate signals using existing backtesting logic
      const signals = this.backtestingService.generateSignals(
        priceData,
        strategy.templateId,
        strategy.parameters
      );

      // Get the latest signal
      const latestSignal = signals[signals.length - 1];
      
      if (latestSignal) {
        return {
          timestamp: currentData.timestamp,
          signal: latestSignal.signal,
          price: currentData.close,
          confidence: this.calculateSignalConfidence(strategy, priceData),
          reason: `${strategy.templateId} strategy signal`,
        };
      }

    } catch (error) {
      console.error(`Error generating signal for strategy ${strategy.name}:`, error);
    }

    return {
      timestamp: currentData.timestamp,
      signal: 'none',
      price: currentData.close,
      reason: 'No signal generated',
    };
  }

  /**
   * Calculate signal confidence based on market conditions
   */
  private calculateSignalConfidence(strategy: StrategyConfig, priceData: any[]): number {
    // Simple confidence calculation based on recent volatility and trend
    const recentPrices = priceData.slice(-10).map(d => d.close);
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const volatility = Math.sqrt(
      recentPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / recentPrices.length
    ) / avgPrice;

    // Lower volatility = higher confidence (simplified)
    return Math.max(0.1, Math.min(1.0, 1 - volatility * 10));
  }

  /**
   * Execute trading signals (for simulation or paper trading)
   */
  async executeSignal(userId: string, signal: TradingSignal, symbol: string, quantity: number = 100) {
    try {
      const currentPosition = this.positions.get(symbol);
      let action = '';

      switch (signal.signal) {
        case 'buy':
          if (!currentPosition || currentPosition.side === 'short') {
            action = 'BUY';
            await this.createPosition(userId, symbol, 'long', quantity, signal.price);
          }
          break;

        case 'sell':
          if (currentPosition && currentPosition.side === 'long') {
            action = 'SELL';
            await this.closePosition(userId, symbol, signal.price);
          }
          break;

        case 'short':
          if (!currentPosition || currentPosition.side === 'long') {
            action = 'SHORT';
            await this.createPosition(userId, symbol, 'short', quantity, signal.price);
          }
          break;

        case 'cover':
          if (currentPosition && currentPosition.side === 'short') {
            action = 'COVER';
            await this.closePosition(userId, symbol, signal.price);
          }
          break;
      }

      if (action) {
        // Log the trading action
        await databaseService.logAudit({
          userId,
          action: 'SIGNAL_EXECUTED',
          details: {
            symbol,
            signal: signal.signal,
            price: signal.price,
            quantity,
            confidence: signal.confidence,
            reason: signal.reason,
          },
        });

        console.log(`Executed ${action} signal for ${symbol} at ${signal.price}`);
      }

    } catch (error) {
      console.error('Error executing signal:', error);
    }
  }

  /**
   * Create or modify a position
   */
  private async createPosition(
    userId: string,
    symbol: string,
    side: 'long' | 'short',
    quantity: number,
    price: number
  ) {
    const portfolio = await databaseService.getPortfolio(userId);
    if (!portfolio) return;

    const signedQuantity = side === 'long' ? quantity : -quantity;
    
    await databaseService.updatePosition(portfolio.id, symbol, {
      quantity: signedQuantity,
      averagePrice: price,
      currentPrice: price,
      marketValue: quantity * price,
      unrealizedPnl: 0,
    });

    this.positions.set(symbol, {
      symbol,
      quantity,
      entryPrice: price,
      currentPrice: price,
      unrealizedPnl: 0,
      side,
    });
  }

  /**
   * Close a position
   */
  private async closePosition(userId: string, symbol: string, price: number) {
    const portfolio = await databaseService.getPortfolio(userId);
    const position = this.positions.get(symbol);
    
    if (!portfolio || !position) return;

    const pnl = position.side === 'long' 
      ? (price - position.entryPrice) * position.quantity
      : (position.entryPrice - price) * position.quantity;

    await databaseService.updatePosition(portfolio.id, symbol, {
      quantity: 0,
      averagePrice: position.entryPrice,
      currentPrice: price,
      marketValue: 0,
      unrealizedPnl: 0,
      realizedPnl: pnl,
    });

    this.positions.delete(symbol);
  }

  /**
   * Get current positions
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get active strategies
   */
  getActiveStrategies(): StrategyConfig[] {
    return Array.from(this.activeStrategies.values());
  }

  /**
   * Add or update a strategy
   */
  async addStrategy(userId: string, strategy: Omit<StrategyConfig, 'id'>) {
    try {
      const savedStrategy = await databaseService.saveStrategy(userId, {
        name: strategy.name,
        templateId: strategy.templateId,
        parameters: strategy.parameters,
        isActive: strategy.isActive,
      });

      this.activeStrategies.set(savedStrategy.id, {
        id: savedStrategy.id,
        name: savedStrategy.name,
        templateId: savedStrategy.templateId,
        parameters: JSON.parse(savedStrategy.parameters),
        isActive: savedStrategy.isActive,
      });

      console.log(`Added strategy: ${strategy.name}`);
      return savedStrategy.id;
    } catch (error) {
      console.error('Error adding strategy:', error);
      throw error;
    }
  }

  /**
   * Start the trading engine
   */
  start() {
    this.isRunning = true;
    console.log('Trading engine started');
  }

  /**
   * Stop the trading engine
   */
  stop() {
    this.isRunning = false;
    console.log('Trading engine stopped');
  }

  /**
   * Check if engine is running
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }
}

export default TradingEngine.getInstance();
