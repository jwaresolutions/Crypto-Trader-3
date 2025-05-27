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
        },
        include: {
          strategy: true
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
}

const databaseService = new DatabaseService();
export default databaseService;
