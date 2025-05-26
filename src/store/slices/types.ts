// Common types used across Redux slices

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
}

// Order Types
export interface Order {
  id: string;
  clientOrderId: string;
  symbol: string;
  assetClass: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  qty: string;
  filledQty: string;
  filledAvgPrice?: number;
  limitPrice?: number;
  stopPrice?: number;
  status: string;
  extendedHours: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  filledAt?: string;
  canceledAt?: string;
  expiredAt?: string;
  replacedAt?: string;
  replacedBy?: string;
  replaces?: string;
}

// Position Types
export interface Position {
  symbol: string;
  assetClass: string;
  exchange: string;
  side: 'long' | 'short';
  qty: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  unrealizedIntradayPL: number;
  unrealizedIntradayPLPercent: number;
  changeToday: number;
}

// Account Types
export interface Account {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
  equity: number;
  lastEquity: number;
  longMarketValue: number;
  shortMarketValue: number;
  dayPL: number;
  dayPLPercent: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  tradingBlocked: boolean;
  transfersBlocked: boolean;
  accountBlocked: boolean;
  patternDayTrader: boolean;
  daytradingBuyingPower: number;
  regtBuyingPower: number;
  createdAt: string;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// WebSocket Types
export interface WebSocketConnectionStatus {
  isConnected: boolean;
  lastConnected?: number;
  error?: string;
}

export interface RealTimeUpdate {
  type: 'market_data' | 'order_update' | 'position_update' | 'account_update';
  data: any;
  timestamp: number;
}
