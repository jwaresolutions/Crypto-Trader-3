# React Trading Application

A modern React TypeScript application for cryptocurrency and stock trading with real-time market data, portfolio management, and order execution.

## Features

- 📈 Real-time market data and charts
- 💼 Portfolio management and tracking
- 📊 Trading interface with order placement
- 🔔 Price alerts and notifications
- 📱 Responsive design with dark/light mode
- 🔐 Secure API integration with Alpaca and Polygon.io

## Technologies Used

- **Frontend**: React 18, TypeScript, Material-UI
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Charts**: Chart.js with react-chartjs-2
- **APIs**: Alpaca Markets (trading), Polygon.io (market data)
- **Build Tool**: Create React App

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Alpaca Markets paper trading account
- Polygon.io API account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-trade-app2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your API credentials:
```bash
# Alpaca API Credentials (Paper Trading)
REACT_APP_ALPACA_API_KEY=your_alpaca_api_key_here
REACT_APP_ALPACA_SECRET_KEY=your_alpaca_secret_key_here
REACT_APP_ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Application Login Credentials
REACT_APP_LOGIN_USERNAME=your_username_here
REACT_APP_LOGIN_PASSWORD=your_password_here

# Polygon.io API Credentials
REACT_APP_POLYGON_API_KEY=your_polygon_api_key_here

# App Configuration
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_WS_URL=wss://stream.data.alpaca.markets/v2/iex
```

5. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

### API Setup

#### Alpaca Markets
1. Create a paper trading account at [Alpaca Markets](https://alpaca.markets/)
2. Generate API keys from your dashboard
3. Add the keys to your `.env` file

#### Polygon.io
1. Sign up at [Polygon.io](https://polygon.io/)
2. Get your API key from the dashboard
3. Add the key to your `.env` file

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Common UI components
│   ├── layout/         # Layout components
│   └── trading/        # Trading-specific components
├── pages/              # Page components for routing
├── services/           # API service layers
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Features

### Navigation
- **Dashboard**: Overview of trading activity and portfolio
- **Trading**: Advanced trading interface with charts
- **Portfolio**: Portfolio summary and position management
- **Orders**: Active orders and trading history
- **Settings**: Application preferences and API configuration

### Trading Features
- Real-time market data
- Interactive price charts
- Order placement (market, limit, stop orders)
- Portfolio tracking
- Price alerts
- Watchlist management

## Security Notes

⚠️ **Important**: Never commit your actual `.env` file to version control. The `.env.example` file is provided as a template.

- API keys are stored in environment variables
- Paper trading environment is used for safety
- Sensitive credentials are excluded from git tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational and paper trading purposes only. Always do your own research before making real trading decisions.
