#!/usr/bin/env node

/**
 * Database Initializat    // Create default user
    const user = await prisma.user.upsert({
      where: { email: 'demo@cryptotrader.com' },
      update: {},
      create: {
        email: 'demo@cryptotrader.com',
        username: 'demouser',
        password: 'hashedpassword123', // In production, this should be properly hashed
        firstName: 'Demo',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }); * Sets up the database with sample data for development and testing
 */

// Import Prisma client directly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple mock data generator
function generateMockHistoricalData(symbol, startDate, endDate) {
  const data = [];
  const current = new Date(startDate);
  let price = symbol === 'BTCUSD' ? 45000 : symbol === 'ETHUSD' ? 2500 : 1000;
  
  while (current <= endDate) {
    const change = (Math.random() - 0.5) * 0.1; // ±5% daily change
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.05);
    const low = Math.min(open, close) * (1 - Math.random() * 0.05);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      timestamp: new Date(current),
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}

async function initializeDatabase() {
  console.log('🚀 Initializing Crypto Trading Database...');
  
  try {
    console.log('✅ Database connection established');
    
    // Create default user
    const user = await prisma.user.upsert({
      where: { email: 'demo@cryptotrader.com' },
      update: {},
      create: {
        email: 'demo@cryptotrader.com',
        username: 'demouser',
        password: 'hashedpassword123', // In production, this should be properly hashed
        firstName: 'Demo',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Default user created:', user.email);
    
    // Create sample strategies
    const strategies = [
      {
        name: 'RSI Mean Reversion',
        description: 'Buy when RSI < 30, sell when RSI > 70',
        templateId: 'rsi-mean-reversion',
        parameters: JSON.stringify([
          { name: 'rsiPeriod', value: 14 },
          { name: 'oversoldLevel', value: 30 },
          { name: 'overboughtLevel', value: 70 }
        ]),
        userId: user.id,
        isActive: true
      },
      {
        name: 'Moving Average Crossover',
        description: 'Buy when fast MA crosses above slow MA',
        templateId: 'ma-crossover',
        parameters: JSON.stringify([
          { name: 'fastPeriod', value: 10 },
          { name: 'slowPeriod', value: 30 },
          { name: 'maType', value: 'sma' }
        ]),
        userId: user.id,
        isActive: false
      },
      {
        name: 'Bollinger Bands Strategy',
        description: 'Buy at lower band, sell at upper band',
        templateId: 'bollinger-bands',
        parameters: JSON.stringify([
          { name: 'period', value: 20 },
          { name: 'standardDeviations', value: 2 },
          { name: 'breakoutConfirmation', value: true }
        ]),
        userId: user.id,
        isActive: false
      }
    ];
    
    for (const strategyData of strategies) {
      // Check if strategy already exists for this user
      const existingStrategy = await prisma.strategy.findFirst({
        where: {
          userId: user.id,
          name: strategyData.name
        }
      });

      let strategy;
      if (existingStrategy) {
        strategy = await prisma.strategy.update({
          where: { id: existingStrategy.id },
          data: strategyData
        });
      } else {
        strategy = await prisma.strategy.create({
          data: strategyData
        });
      }
      console.log('✅ Created strategy:', strategy.name);
    }
    
    // Generate sample market data
    console.log('📊 Generating sample market data...');
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD'];
    
    for (const symbol of symbols) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 months of data
      
      const historicalData = generateMockHistoricalData(symbol, startDate, endDate);
      
      for (const dataPoint of historicalData) {
        // Check if market data already exists
        const existingData = await prisma.marketData.findFirst({
          where: {
            symbol: symbol,
            timestamp: dataPoint.timestamp,
            source: 'mock'
          }
        });

        if (!existingData) {
          await prisma.marketData.create({
            data: {
              symbol: symbol,
              timestamp: dataPoint.timestamp,
              open: dataPoint.open,
              high: dataPoint.high,
              low: dataPoint.low,
              close: dataPoint.close,
              volume: dataPoint.volume,
              vwap: (dataPoint.high + dataPoint.low + dataPoint.close) / 3,
              source: 'mock'
            }
          });
        }
      }
      
      console.log(`✅ Generated ${historicalData.length} data points for ${symbol}`);
    }
    
    // Create sample portfolio
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id }
    });

    let portfolio;
    if (existingPortfolio) {
      portfolio = await prisma.portfolio.update({
        where: { id: existingPortfolio.id },
        data: {
          name: 'Default Portfolio',
          cash: 25000,
          totalValue: 50000,
          dayChange: 1250,
          dayChangePct: 2.5,
          isDefault: true,
          updatedAt: new Date()
        }
      });
    } else {
      portfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: 'Default Portfolio',
          cash: 25000,
          totalValue: 50000,
          dayChange: 1250,
          dayChangePct: 2.5,
          isDefault: true
        }
      });
    }
    
    // Create sample positions
    const samplePositions = [
      {
        portfolioId: portfolio.id,
        symbol: 'BTCUSD',
        quantity: 0.5,
        averagePrice: 45000,
        currentPrice: 47500,
        marketValue: 23750,
        unrealizedPnl: 1250,
        realizedPnl: 0
      },
      {
        portfolioId: portfolio.id,
        symbol: 'ETHUSD',
        quantity: 10,
        averagePrice: 2500,
        currentPrice: 2650,
        marketValue: 26500,
        unrealizedPnl: 1500,
        realizedPnl: 0
      }
    ];
    
    for (const positionData of samplePositions) {
      const existingPosition = await prisma.position.findFirst({
        where: {
          portfolioId: portfolio.id,
          symbol: positionData.symbol
        }
      });

      if (!existingPosition) {
        await prisma.position.create({
          data: positionData
        });
        console.log(`✅ Created position for ${positionData.symbol}`);
      }
    }
    
    // Generate sample trading signals
    console.log('📈 Generating sample trading signals...');
    const userStrategies = await prisma.strategy.findMany({
      where: { userId: user.id }
    });
    
    for (let i = 0; i < 20; i++) {
      const strategy = userStrategies[Math.floor(Math.random() * userStrategies.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const signals = ['BUY', 'SELL', 'HOLD'];
      const signal = signals[Math.floor(Math.random() * signals.length)];
      
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (i * 30)); // Signals every 30 minutes
      
      await prisma.tradingSignal.create({
        data: {
          strategyId: strategy.id,
          symbol: symbol,
          signal: signal,
          confidence: 0.5 + Math.random() * 0.5, // Random confidence 0.5-1.0
          price: 40000 + Math.random() * 20000, // Random price
          timestamp: timestamp,
          processed: false
        }
      });
    }
    
    console.log('✅ Generated 20 sample trading signals');
    
    // Create a sample backtest
    console.log('🔄 Creating sample backtest...');
    const strategy = userStrategies[0];
    
    const backtest = await prisma.backtest.create({
      data: {
        userId: user.id,
        strategyId: strategy.id,
        name: 'Sample RSI Backtest',
        symbol: 'BTCUSD',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(),
        initialCapital: 10000,
        finalCapital: 11250,
        totalReturn: 1250,
        totalReturnPct: 12.5,
        maxDrawdown: -520,
        maxDrawdownPct: -5.2,
        sharpeRatio: 1.8,
        winRate: 0.65,
        totalTrades: 23,
        winningTrades: 15,
        losingTrades: 8,
        averageWin: 150,
        averageLoss: -85,
        status: 'completed'
      }
    });
    
    // Create sample backtest trades
    for (let i = 0; i < 5; i++) {
      const entryPrice = 45000 + Math.random() * 5000;
      const exitPrice = 45000 + Math.random() * 5000;
      const quantity = 0.1;
      const pnl = (exitPrice - entryPrice) * quantity;
      
      await prisma.backtestTrade.create({
        data: {
          backtestId: backtest.id,
          type: i % 2 === 0 ? 'buy' : 'sell',
          quantity: quantity,
          entryPrice: entryPrice,
          exitPrice: exitPrice,
          entryDate: new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000),
          exitDate: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000),
          pnl: pnl,
          pnlPercent: (pnl / (entryPrice * quantity)) * 100,
          status: 'closed'
        }
      });
    }
    
    console.log('✅ Sample backtest completed with 5 trades');
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('\nSample data created:');
    console.log('- 1 demo user');
    console.log('- 3 trading strategies');
    console.log('- 3 months of market data for 4 symbols');
    console.log('- Sample portfolio and positions');
    console.log('- 20 trading signals');
    console.log('- 1 completed backtest with 5 trades');
    console.log('\nYou can now run the application and explore the features!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('Initialization complete. Exiting...');
    process.exit(0);
  });
}

module.exports = { initializeDatabase };
