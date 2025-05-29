import { PrismaClient } from '@prisma/client';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  async initialize(): Promise<void> {
    try {
      await this.prisma.$connect();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async getRecentSignals(limit: number = 20) {
    try {
      return await this.prisma.tradingSignal.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error fetching recent signals:', error);
      return [];
    }
  }

  async saveTradingSignal(data: {
    symbol: string;
    strategyId: string;
    signal: string;
    confidence?: number;
    price: number;
    timestamp: Date;
  }) {
    return await this.prisma.tradingSignal.create({
      data: {
        ...data,
        processed: false,
        createdAt: new Date()
      }
    });
  }

  async saveMarketData(data: {
    symbol: string;
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap?: number;
    source?: string;
  }) {
    return await this.prisma.marketData.create({
      data
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async getUserStrategies(userId: string) {
    try {
      return await this.prisma.strategy.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error fetching user strategies:', error);
      return [];
    }
  }

  async saveStrategy(userId: string, strategyData: any) {
    return await this.prisma.strategy.create({
      data: {
        ...strategyData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async getUserTrades(userId: string) {
    try {
      return await this.prisma.trade.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          entryDate: 'desc'
        }
      });
    } catch (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }
  }

  async saveTrade(tradeData: any) {
    return await this.prisma.trade.create({
      data: {
        ...tradeData,
        entryDate: new Date()
      }
    });
  }

  async getUser(userId: string) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
  }

  async updateUser(userId: string, userData: any) {
    return await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        ...userData,
        updatedAt: new Date()
      }
    });
  }

  async createUser(userData: any) {
    return await this.prisma.user.create({
      data: {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async findUser(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email: email
      }
    });
  }

  async getUserCount() {
    return await this.prisma.user.count();
  }

  async getMarketDataCount() {
    return await this.prisma.marketData.count();
  }

  async getPortfolio(userId: string) {
    try {
      const portfolio = await this.prisma.portfolio.findFirst({
        where: {
          userId: userId,
          isDefault: true
        },
        include: {
          positions: true
        }
      });
      
      return portfolio || {
        id: `portfolio_${userId}`,
        userId,
        totalValue: 10000,
        dayChange: 250,
        positions: []
      };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return null;
    }
  }

  async updatePosition(portfolioId: string, symbol: string, positionData: any) {
    try {
      return await this.prisma.position.upsert({
        where: {
          portfolioId_symbol: {
            portfolioId,
            symbol
          }
        },
        update: {
          ...positionData,
          lastUpdated: new Date()
        },
        create: {
          portfolioId,
          symbol,
          ...positionData,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating position:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getMarketData(symbol: string, startDate: Date, endDate: Date) {
    try {
      return await this.prisma.marketData.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }

  async logAudit(auditData: any) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          ...auditData,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error logging audit:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async authenticateUser(username: string, password: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username }
          ]
        }
      });
      
      // Simple password check (in production, use bcrypt)
      if (user && user.password === password) {
        // Load user preferences
        const preferences = await this.prisma.userPreferences.findUnique({
          where: { userId: user.id }
        });
        
        return {
          ...user,
          preferences: preferences || {
            theme: 'dark',
            notifications: true,
            defaultCapital: 10000,
            riskTolerance: 'medium',
            tradingPairs: '[]'
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  async saveBacktest(userId: string, strategyId: string, backtestData: any) {
    try {
      return await this.prisma.backtest.create({
        data: {
          userId,
          strategyId,
          ...backtestData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving backtest:', error);
      throw error;
    }
  }

  async getBacktestHistory(userId: string, limit: number = 20) {
    try {
      return await this.prisma.backtest.findMany({
        where: {
          userId: userId
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error getting backtest history:', error);
      return [];
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
