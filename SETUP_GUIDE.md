# Crypto Trader 3 - Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the initialization script
node init-project.js

# Start the application
npm start
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create and migrate database
npx prisma db push

# 4. Start the application
npm start
```

## Login Credentials
- **Username:** jware-admin
- **Password:** T^61iK*9O#iY3%hnj5q5^

## Features Available

### 1. Dashboard
- Portfolio overview
- Market overview with real-time crypto prices
- Recent trading signals
- Quick stats

### 2. Trading
- Real-time market data
- Order placement (market, limit orders)
- Position management
- Trading chart with technical indicators

### 3. Portfolio Management
- View current positions
- Track P&L
- Portfolio performance metrics
- Asset allocation

### 4. Strategy Management
- Configure trading strategies:
  - RSI Oversold/Overbought
  - Moving Average Crossover
  - Bollinger Bands
- Activate/deactivate strategies
- Set strategy parameters

### 5. Backtesting
- Test strategies on historical data
- View performance metrics
- Analyze trade history
- Equity curve visualization

### 6. System Status
- API connection status
- WebSocket connection monitoring
- Database status
- System health checks

## API Keys Configuration
Your API keys are already configured in the `.env` file:
- **Alpaca:** Paper trading account (no real money)
- **Polygon.io:** Market data provider

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npx prisma generate
```

### Issue: Database not initialized
**Solution:**
```bash
npx prisma db push
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port
PORT=3001 npm start
```

### Issue: WebSocket connection failed
**Solution:**
- Check your internet connection
- Verify API keys are correct
- Check if you're behind a firewall

## Development Commands

```bash
# Start development server
npm start

# Open Prisma Studio (database GUI)
npm run db:studio

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

## Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (routes)
├── services/      # API services and business logic
├── store/         # Redux state management
└── App.tsx        # Main application component

prisma/
├── schema.prisma  # Database schema
└── migrations/    # Database migrations
```

## Next Steps
1. Explore the dashboard to see your portfolio
2. Try placing a paper trade
3. Configure and test a trading strategy
4. Run a backtest to see historical performance
5. Monitor real-time market data

## Security Notes
- This is configured for paper trading (no real money)
- Never commit your `.env` file to version control
- In production, implement proper authentication
- Use environment-specific configurations

## Support
For issues or questions:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure database is properly initialized
4. Check API key validity

Happy Trading! 🚀