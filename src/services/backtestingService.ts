import { StrategySignal, TradeStrategy, StrategyTemplate } from '../store/slices/strategiesSlice';
import databaseService from './databaseService';

export interface BacktestTrade {
  id: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  type: 'buy' | 'short';
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'open' | 'closed';
}

export interface BacktestResult {
  strategy: {
    name: string;
    templateId: string;
    parameters: Record<string, any>;
  };
  period: {
    startDate: string;
    endDate: string;
    symbol: string;
  };
  trades: BacktestTrade[];
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalReturn: number;
    totalReturnPercent: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
  };
  equity: Array<{
    date: string;
    value: number;
  }>;
  signals: Array<{
    date: string;
    signal: StrategySignal;
    price: number;
  }>;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp?: string | Date;
}

class BacktestingService {
  /**
   * Generate mock historical price data for the last two weeks
   */
  generateHistoricalData(symbol: string, days: number = 14): HistoricalPrice[] {
    const data: HistoricalPrice[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let basePrice = 40000; // Start around $40k for BTC
    if (symbol.includes('ETH')) basePrice = 2500;
    if (symbol.includes('ADA')) basePrice = 0.5;
    if (symbol.includes('SOL')) basePrice = 25;
    if (symbol.includes('DOT')) basePrice = 7;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic price movement
      const volatility = 0.03; // 3% daily volatility
      const trend = (Math.random() - 0.5) * 0.01; // Small trend component
      const change = (Math.random() - 0.5) * volatility + trend;
      
      const open = i === 0 ? basePrice : data[i - 1].close;
      const priceChange = open * change;
      const high = open + Math.abs(priceChange) + (Math.random() * open * 0.01);
      const low = open - Math.abs(priceChange) - (Math.random() * open * 0.01);
      const close = open + priceChange;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume: Math.random() * 1000000 + 500000,
        timestamp: date
      });
    }
    
    return data;
  }

  /**
   * Generate mock historical data with date range
   */
  generateMockHistoricalData(symbol: string, startDate: Date, endDate: Date): HistoricalPrice[] {
    const data: HistoricalPrice[] = [];
    const current = new Date(startDate);
    let basePrice = 40000; // Start around $40k for BTC
    if (symbol.includes('ETH')) basePrice = 2500;
    if (symbol.includes('ADA')) basePrice = 0.5;
    if (symbol.includes('SOL')) basePrice = 25;
    if (symbol.includes('DOT')) basePrice = 7;

    let price = basePrice;
    
    while (current <= endDate) {
      const change = (Math.random() - 0.5) * 0.1; // ±5% daily change
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.05);
      const low = Math.min(open, close) * (1 - Math.random() * 0.05);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        date: current.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
        timestamp: new Date(current)
      });
      
      price = close;
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  /**
   * Calculate RSI for given price data
   */
  calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) return [];
    
    const rsi: number[] = [];
    let gains: number[] = [];
    let losses: number[] = [];
    
    // Calculate initial gains and losses
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    let avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }
    
    return rsi;
  }

  /**
   * Calculate Moving Average
   */
  calculateMA(prices: number[], period: number): number[] {
    const ma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
    return ma;
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): Array<{upper: number, middle: number, lower: number}> {
    const ma = this.calculateMA(prices, period);
    const bands: Array<{upper: number, middle: number, lower: number}> = [];
    
    for (let i = 0; i < ma.length; i++) {
      const slice = prices.slice(i, i + period);
      const mean = ma[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev)
      });
    }
    
    return bands;
  }

  /**
   * Generate strategy signals based on historical data
   */
  generateSignals(
    historicalData: HistoricalPrice[],
    templateId: string,
    parameters: Record<string, any>
  ): Array<{ date: string; signal: StrategySignal; price: number }> {
    const signals: Array<{ date: string; signal: StrategySignal; price: number }> = [];
    const prices = historicalData.map(d => d.close);
    
    switch (templateId) {
      case 'rsi-oversold': {
        const { rsiPeriod = 14, oversoldLevel = 30, overboughtLevel = 70 } = parameters;
        const rsi = this.calculateRSI(prices, rsiPeriod);
        
        for (let i = 0; i < rsi.length; i++) {
          const dataIndex = i + rsiPeriod;
          if (dataIndex < historicalData.length) {
            let signal: StrategySignal = 'none';
            if (rsi[i] < oversoldLevel) signal = 'buy';
            else if (rsi[i] > overboughtLevel) signal = 'short';
            
            signals.push({
              date: historicalData[dataIndex].date,
              signal,
              price: historicalData[dataIndex].close
            });
          }
        }
        break;
      }
      
      case 'moving-average-crossover': {
        const { fastPeriod = 10, slowPeriod = 30 } = parameters;
        const fastMA = this.calculateMA(prices, fastPeriod);
        const slowMA = this.calculateMA(prices, slowPeriod);
        
        for (let i = 1; i < Math.min(fastMA.length, slowMA.length); i++) {
          const dataIndex = i + slowPeriod - 1;
          if (dataIndex < historicalData.length) {
            let signal: StrategySignal = 'none';
            
            // Cross above
            if (fastMA[i] > slowMA[i] && fastMA[i - 1] <= slowMA[i - 1]) {
              signal = 'buy';
            }
            // Cross below
            else if (fastMA[i] < slowMA[i] && fastMA[i - 1] >= slowMA[i - 1]) {
              signal = 'short';
            }
            
            signals.push({
              date: historicalData[dataIndex].date,
              signal,
              price: historicalData[dataIndex].close
            });
          }
        }
        break;
      }
      
      case 'bollinger-bands': {
        const { period = 20, standardDeviations = 2 } = parameters;
        const bands = this.calculateBollingerBands(prices, period, standardDeviations);
        
        for (let i = 0; i < bands.length; i++) {
          const dataIndex = i + period - 1;
          if (dataIndex < historicalData.length) {
            const price = historicalData[dataIndex].close;
            let signal: StrategySignal = 'none';
            
            if (price > bands[i].upper) signal = 'short';
            else if (price < bands[i].lower) signal = 'buy';
            
            signals.push({
              date: historicalData[dataIndex].date,
              signal,
              price
            });
          }
        }
        break;
      }
      
      default:
        // For other strategies, generate some random signals for demo
        historicalData.forEach((data, index) => {
          if (index % 3 === 0) { // Every 3rd day, generate a signal
            const random = Math.random();
            let signal: StrategySignal = 'none';
            if (random < 0.3) signal = 'buy';
            else if (random > 0.7) signal = 'short';
            
            signals.push({
              date: data.date,
              signal,
              price: data.close
            });
          }
        });
    }
    
    return signals;
  }

  /**
   * Execute backtest simulation
   */
  runBacktest(
    strategyName: string,
    templateId: string,
    parameters: Record<string, any>,
    symbol: string,
    initialCapital: number = 10000
  ): BacktestResult {
    // Generate historical data
    const historicalData = this.generateHistoricalData(symbol, 14);
    const signals = this.generateSignals(historicalData, templateId, parameters);
    
    // Simulate trades
    const trades: BacktestTrade[] = [];
    const equity: Array<{ date: string; value: number }> = [];
    let currentCapital = initialCapital;
    let openTrade: BacktestTrade | null = null;
    let tradeCounter = 0;
    
    // Create equity curve
    historicalData.forEach((data, index) => {
      const signal = signals.find(s => s.date === data.date);
      
      if (signal && signal.signal !== 'none') {
        // Close existing trade if signal changes
        if (openTrade) {
          openTrade.exitDate = data.date;
          openTrade.exitPrice = data.close;
          openTrade.status = 'closed';
          
          // Calculate P&L
          if (openTrade.type === 'buy') {
            openTrade.pnl = (openTrade.exitPrice - openTrade.entryPrice) * openTrade.quantity;
          } else { // short
            openTrade.pnl = (openTrade.entryPrice - openTrade.exitPrice) * openTrade.quantity;
          }
          
          openTrade.pnlPercent = (openTrade.pnl / (openTrade.entryPrice * openTrade.quantity)) * 100;
          currentCapital += openTrade.pnl;
          trades.push(openTrade);
          openTrade = null;
        }
        
        // Open new trade
        const quantity = Math.floor(currentCapital * 0.1 / data.close); // Use 10% of capital
        if (quantity > 0) {
          openTrade = {
            id: `trade-${++tradeCounter}`,
            entryDate: data.date,
            entryPrice: data.close,
            type: signal.signal === 'buy' ? 'buy' : 'short',
            quantity,
            status: 'open'
          };
          trades.push(openTrade);
        }
      }
      
      equity.push({
        date: data.date,
        value: currentCapital + (openTrade ? 
          (openTrade.type === 'buy' ? 
            (data.close - openTrade.entryPrice) * openTrade.quantity :
            (openTrade.entryPrice - data.close) * openTrade.quantity
          ) : 0)
      });
    });
    
    // Close any remaining open trade
    if (openTrade) {
      const lastData = historicalData[historicalData.length - 1];
      const trade = openTrade as BacktestTrade;
      trade.exitDate = lastData.date;
      trade.exitPrice = lastData.close;
      trade.status = 'closed';
      
      if (trade.type === 'buy') {
        trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      } else {
        trade.pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
      }
      
      trade.pnlPercent = (trade.pnl / (trade.entryPrice * trade.quantity)) * 100;
      currentCapital += trade.pnl;
      trades.push(trade);
    }
    
    // Calculate performance metrics
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
    
    const totalReturn = currentCapital - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;
    
    const wins = winningTrades.map(t => t.pnl || 0);
    const losses = losingTrades.map(t => Math.abs(t.pnl || 0));
    
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    // Calculate max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    equity.forEach(point => {
      if (point.value > peak) peak = point.value;
      const drawdown = (peak - point.value) / peak * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    return {
      strategy: {
        name: strategyName,
        templateId,
        parameters
      },
      period: {
        startDate: historicalData[0].date,
        endDate: historicalData[historicalData.length - 1].date,
        symbol
      },
      trades: closedTrades,
      performance: {
        totalTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
        totalReturn,
        totalReturnPercent,
        maxDrawdown,
        sharpeRatio: 0, // Simplified for demo
        profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
        avgWin,
        avgLoss
      },
      equity,
      signals
    };
  }

  /**
   * Run backtest and save results to database
   */
  async runBacktestWithStorage(
    userId: string,
    strategyName: string,
    templateId: string,
    parameters: Record<string, any>,
    symbol: string,
    initialCapital: number,
    historicalData?: HistoricalPrice[]
  ): Promise<BacktestResult> {
    try {
      // Use provided historical data or generate it
      const data = historicalData || this.generateHistoricalData(symbol, 14);
      
      // Run the backtest
      const result = this.runBacktest(strategyName, templateId, parameters, symbol, initialCapital);
      
      // Save results to database
      await this.saveBacktestResults(userId, templateId, result);
      
      return result;
    } catch (error) {
      console.error('Error running backtest with storage:', error);
      throw error;
    }
  }

  /**
   * Get historical data from database or generate if not available
   */
  async getHistoricalData(symbol: string, days: number): Promise<HistoricalPrice[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    try {
      // Try to get data from database first
      const dbData = await databaseService.getMarketData(symbol, startDate, endDate);
      
      if (dbData.length > 0) {
        console.log(`Found ${dbData.length} historical data points for ${symbol} in database`);
        return dbData.map(d => ({
          date: d.timestamp.toISOString().split('T')[0],
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        }));
      }
    } catch (error) {
      console.warn('Error fetching from database, using generated data:', error);
    }

    // Fall back to generated data
    console.log(`Generating mock historical data for ${symbol}`);
    return this.generateHistoricalData(symbol, days);
  }

  /**
   * Save backtest results to database
   */
  async saveBacktestResults(
    userId: string,
    strategyId: string | null,
    result: BacktestResult
  ): Promise<string> {
    try {
      const backtest = await databaseService.saveBacktest(
        userId,
        strategyId || 'default-strategy',
        {
          name: `${result.strategy.name} - ${result.period.symbol}`,
          symbol: result.period.symbol,
          startDate: new Date(result.period.startDate),
          endDate: new Date(result.period.endDate),
          initialCapital: 10000, // Default initial capital
          finalCapital: 10000 + result.performance.totalReturn,
          totalReturn: result.performance.totalReturn,
          totalReturnPct: result.performance.totalReturnPercent,
          maxDrawdown: result.performance.maxDrawdown,
          maxDrawdownPct: (result.performance.maxDrawdown / 10000) * 100,
          sharpeRatio: result.performance.sharpeRatio,
          winRate: result.performance.winRate,
          totalTrades: result.performance.totalTrades,
          winningTrades: result.performance.winningTrades,
          losingTrades: result.performance.losingTrades,
          averageWin: result.performance.avgWin,
          averageLoss: result.performance.avgLoss,
          trades: result.trades.map(trade => ({
            entryDate: new Date(trade.entryDate),
            exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            quantity: trade.quantity,
            type: trade.type,
            pnl: trade.pnl,
            pnlPercent: trade.pnlPercent,
            status: trade.status,
          })),
        }
      );

      console.log(`Backtest saved with ID: ${backtest.id}`);
      return backtest.id;
    } catch (error) {
      console.error('Error saving backtest results:', error);
      throw error;
    }
  }

  /**
   * Get backtest history for a user
   */
  async getBacktestHistory(userId: string, limit: number = 20) {
    try {
      return await databaseService.getBacktestHistory(userId, limit);
    } catch (error) {
      console.error('Error fetching backtest history:', error);
      return [];
    }
  }

  /**
   * Store historical market data in database
   */
  async storeMarketData(symbol: string, data: HistoricalPrice[]) {
    try {
      for (const point of data) {
        await databaseService.saveMarketData({
          symbol,
          timestamp: new Date(point.date),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume,
          source: 'generated',
        });
      }
      console.log(`Stored ${data.length} data points for ${symbol}`);
    } catch (error) {
      console.error('Error storing market data:', error);
    }
  }
}

export const backtestingService = new BacktestingService();
