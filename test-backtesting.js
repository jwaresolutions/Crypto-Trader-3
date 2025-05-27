// Simple test to validate backtesting service
const { BacktestingService } = require('./src/services/backtestingService.ts');

console.log('Testing Backtesting Service...');

// Test historical data generation
const service = new BacktestingService();
const historicalData = service.generateHistoricalData('AAPL', 14);

console.log('Generated historical data points:', historicalData.length);
console.log('First data point:', historicalData[0]);
console.log('Last data point:', historicalData[historicalData.length - 1]);

// Test signal generation
const signals = service.generateSignals(historicalData, 'rsi-mean-reversion', {
  rsiPeriod: 14,
  oversold: 30,
  overbought: 70
});

console.log('Generated signals:', signals.length);
console.log('Buy signals:', signals.filter(s => s.signal === 'buy').length);
console.log('Short signals:', signals.filter(s => s.signal === 'short').length);

// Test full backtest
const result = service.executeBacktest(historicalData, 'rsi-mean-reversion', {
  rsiPeriod: 14,
  oversold: 30,
  overbought: 70
}, 10000);

console.log('Backtest completed!');
console.log('Total trades:', result.performance.totalTrades);
console.log('Win rate:', result.performance.winRate + '%');
console.log('Total return:', result.performance.totalReturnPercent + '%');
console.log('Success!');
