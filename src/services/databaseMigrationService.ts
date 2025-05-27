import DatabaseService from './databaseService';
import UserPreferencesService from './userPreferencesService';
import NotificationService from './notificationService';

interface DatabaseMigration {
  version: string;
  description: string;
  up: () => Promise        // Test user table access
    try {
      const start = Date.now();
      const userCount = await DatabaseService.getUserCount();
      const responseTime = Date.now() - start;

      checks.push({
        name: 'User Table Access',
        status: 'pass',
        message: `User table accessible, ${userCount} users found`,
        responseTime
      });
    } catch (error) {
      checks.push({
        name: 'User Table Access',
        status: 'fail',
        message: `User table access error: ${error}`
      });
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    } access
    try {
      const start = Date.now();
      const userCount = await DatabaseService.prisma.user.count();
      const responseTime = Date.now() - start;>;
  down: () => Promise<void>;
}

class DatabaseMigrationService {
  private static instance: DatabaseMigrationService;

  private constructor() {}

  public static getInstance(): DatabaseMigrationService {
    if (!DatabaseMigrationService.instance) {
      DatabaseMigrationService.instance = new DatabaseMigrationService();
    }
    return DatabaseMigrationService.instance;
  }

  // Initialize database with all necessary data
  async initializeDatabase(): Promise<void> {
    try {
      console.log('Starting database initialization...');

      // Test database connection
      const isConnected = await DatabaseService.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Initialize database service
      await DatabaseService.initialize();

      // Create default user if none exists
      await this.createDefaultUser();

      // Create sample market data
      await this.createSampleMarketData();

      // Create default strategies
      await this.createDefaultStrategies();

      // Create sample trading signals
      await this.createSampleTradingSignals();

      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // Create a default user for demo purposes
  private async createDefaultUser(): Promise<void> {
    try {
      const existingUser = await DatabaseService.findUser('demo@example.com');
      
      if (!existingUser) {
        console.log('Creating default demo user...');
        
        const user = await DatabaseService.createUser({
          email: 'demo@example.com',
          username: 'demo_user',
          password: 'demo123', // In production, this should be hashed
          firstName: 'Demo',
          lastName: 'User'
        });

        console.log('Default user created:', user.id);

        // Create welcome notification
        await NotificationService.createNotification({
          userId: user.id,
          title: 'Welcome to CryptoTrader',
          message: 'Your account has been set up successfully. Start exploring the trading features!',
          type: 'info',
          priority: 'medium'
        });
      } else {
        console.log('Default user already exists');
      }
    } catch (error) {
      console.error('Error creating default user:', error);
    }
  }

  // Create sample market data for testing
  private async createSampleMarketData(): Promise<void> {
    try {
      console.log('Creating sample market data...');
      
      const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD'];
      const now = new Date();
      
      for (const symbol of symbols) {
        const basePrice = this.getBasePriceForSymbol(symbol);
        
        // Create 30 days of historical data
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
          const price = basePrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5% variation
          const volume = Math.floor(Math.random() * 1000000 + 100000);

          await DatabaseService.saveMarketData({
            symbol,
            timestamp: date,
            open: price * 0.99,
            high: price * 1.02,
            low: price * 0.98,
            close: price,
            volume,
            vwap: price * 1.001,
            source: 'sample'
          });
        }
      }

      console.log('Sample market data created');
    } catch (error) {
      console.error('Error creating sample market data:', error);
    }
  }

  // Create default trading strategies
  private async createDefaultStrategies(): Promise<void> {
    try {
      console.log('Creating default strategies...');
      
      const user = await DatabaseService.findUser('demo@example.com');
      if (!user) return;

      const strategies = [
        {
          name: 'RSI Mean Reversion',
          description: 'Buy when RSI < 30, sell when RSI > 70',
          templateId: 'rsi-mean-reversion',
          parameters: {
            rsi_period: 14,
            oversold_threshold: 30,
            overbought_threshold: 70,
            position_size: 0.1
          }
        },
        {
          name: 'Moving Average Crossover',
          description: 'Buy when fast MA crosses above slow MA',
          templateId: 'ma-crossover',
          parameters: {
            fast_period: 10,
            slow_period: 20,
            position_size: 0.15
          }
        },
        {
          name: 'Bollinger Band Breakout',
          description: 'Trade breakouts from Bollinger Bands',
          templateId: 'bb-breakout',
          parameters: {
            period: 20,
            std_dev: 2,
            position_size: 0.12
          }
        }
      ];

      for (const strategyData of strategies) {
        await DatabaseService.saveStrategy(user.id, strategyData);
      }

      console.log('Default strategies created');
    } catch (error) {
      console.error('Error creating default strategies:', error);
    }
  }

  // Create sample trading signals
  private async createSampleTradingSignals(): Promise<void> {
    try {
      console.log('Creating sample trading signals...');
      
      const strategies = await DatabaseService.getUserStrategies('demo@example.com');
      if (strategies.length === 0) return;

      const symbols = ['AAPL', 'TSLA', 'BTC-USD'];
      const signals = ['buy', 'sell', 'hold'];

      for (let i = 0; i < 10; i++) {
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const signal = signals[Math.floor(Math.random() * signals.length)];
        const confidence = Math.random() * 0.4 + 0.6; // 60-100%
        const price = this.getBasePriceForSymbol(symbol) * (1 + (Math.random() * 0.02 - 0.01));

        await DatabaseService.saveTradingSignal({
          symbol,
          strategyId: strategy.id,
          signal,
          confidence,
          price,
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24h
        });
      }

      console.log('Sample trading signals created');
    } catch (error) {
      console.error('Error creating sample trading signals:', error);
    }
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

  // Health check for database
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message: string;
      responseTime?: number;
    }>;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Test database connection
    try {
      const start = Date.now();
      const isConnected = await DatabaseService.testConnection();
      const responseTime = Date.now() - start;

      checks.push({
        name: 'Database Connection',
        status: isConnected ? 'pass' : 'fail',
        message: isConnected ? 'Database connection successful' : 'Database connection failed',
        responseTime
      });

      if (!isConnected) overallStatus = 'unhealthy';
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'fail',
        message: `Database connection error: ${error}`
      });
      overallStatus = 'unhealthy';
    }

    // Test user table access
    try {
      const start = Date.now();
      const userCount = await DatabaseService.getUserCount();
      const responseTime = Date.now() - start;

      checks.push({
        name: 'User Table Access',
        status: 'pass',
        message: `User table accessible, ${userCount} users found`,
        responseTime
      });
    } catch (error) {
      checks.push({
        name: 'User Table Access',
        status: 'fail',
        message: `User table access error: ${error}`
      });
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    // Test market data table access
    try {
      const start = Date.now();
      const marketDataCount = await DatabaseService.getMarketDataCount();
      const responseTime = Date.now() - start;

      checks.push({
        name: 'Market Data Table Access',
        status: 'pass',
        message: `Market data table accessible, ${marketDataCount} records found`,
        responseTime
      });
    } catch (error) {
      checks.push({
        name: 'Market Data Table Access',
        status: 'fail',
        message: `Market data table access error: ${error}`
      });
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    // Test strategy table access
    try {
      const start = Date.now();
      const strategyCount = await DatabaseService.getClient().strategy.count();
      const responseTime = Date.now() - start;

      checks.push({
        name: 'Strategy Table Access',
        status: 'pass',
        message: `Strategy table accessible, ${strategyCount} strategies found`,
        responseTime
      });
    } catch (error) {
      checks.push({
        name: 'Strategy Table Access',
        status: 'fail',
        message: `Strategy table access error: ${error}`
      });
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks
    };
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    users: number;
    strategies: number;
    marketData: number;
    trades: number;
    signals: number;
    auditLogs: number;
  }> {
    try {
      const [users, strategies, marketData, trades, signals, auditLogs] = await Promise.all([
        DatabaseService.getClient().user.count(),
        DatabaseService.getClient().strategy.count(),
        DatabaseService.getClient().marketData.count(),
        DatabaseService.getClient().trade.count(),
        DatabaseService.getClient().tradingSignal.count(),
        DatabaseService.getClient().auditLog.count()
      ]);

      return {
        users,
        strategies,
        marketData,
        trades,
        signals,
        auditLogs
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        users: 0,
        strategies: 0,
        marketData: 0,
        trades: 0,
        signals: 0,
        auditLogs: 0
      };
    }
  }

  // Clean up old data
  async cleanupOldData(daysOld: number = 90): Promise<{
    deletedMarketData: number;
    deletedAuditLogs: number;
    deletedSignals: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(`Cleaning up data older than ${daysOld} days (before ${cutoffDate.toISOString()})`);

      const [deletedMarketData, deletedAuditLogs, deletedSignals] = await Promise.all([
        DatabaseService.getClient().marketData.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate
            }
          }
        }),
        DatabaseService.getClient().auditLog.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate
            }
          }
        }),
        DatabaseService.getClient().tradingSignal.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate
            }
          }
        })
      ]);

      console.log(`Cleanup completed: ${deletedMarketData.count} market data, ${deletedAuditLogs.count} audit logs, ${deletedSignals.count} signals deleted`);

      return {
        deletedMarketData: deletedMarketData.count,
        deletedAuditLogs: deletedAuditLogs.count,
        deletedSignals: deletedSignals.count
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  // Reset database to initial state
  async resetDatabase(): Promise<void> {
    try {
      console.log('Resetting database to initial state...');

      // Delete all data in reverse order of dependencies
      await DatabaseService.getClient().backtestTrade.deleteMany();
      await DatabaseService.getClient().backtest.deleteMany();
      await DatabaseService.getClient().tradingSignal.deleteMany();
      await DatabaseService.getClient().trade.deleteMany();
      await DatabaseService.getClient().position.deleteMany();
      await DatabaseService.getClient().portfolio.deleteMany();
      await DatabaseService.getClient().strategy.deleteMany();
      await DatabaseService.getClient().technicalIndicator.deleteMany();
      await DatabaseService.getClient().marketData.deleteMany();
      await DatabaseService.getClient().auditLog.deleteMany();
      await DatabaseService.getClient().apiKey.deleteMany();
      await DatabaseService.getClient().userPreferences.deleteMany();
      await DatabaseService.getClient().user.deleteMany();
      await DatabaseService.getClient().systemConfig.deleteMany();

      console.log('All data deleted, reinitializing...');
      
      // Reinitialize with fresh data
      await this.initializeDatabase();

      console.log('Database reset completed');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}

export default DatabaseMigrationService.getInstance();
