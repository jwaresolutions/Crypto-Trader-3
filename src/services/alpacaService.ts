import { alpacaAPI, handleAPIError, withRetry } from './api';
import { Order, Position, Account } from '../store/slices/types';

// Alpaca API Types
export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status: string;
  extended_hours: boolean;
  legs?: AlpacaOrder[];
  trail_percent?: string;
  trail_price?: string;
  hwm?: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  crypto_status?: string;
  currency: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  non_marginable_buying_power: string;
  cash: string;
  accrued_fees: string;
  pending_transfer_out: string;
  pending_transfer_in: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  sma: string;
  daytrade_count: number;
}

export interface CreateOrderRequest {
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: string;
  stop_price?: string;
  extended_hours?: boolean;
  client_order_id?: string;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
  take_profit?: {
    limit_price: string;
  };
  stop_loss?: {
    stop_price: string;
    limit_price?: string;
  };
}

export interface ModifyOrderRequest {
  qty?: string;
  time_in_force?: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: string;
  stop_price?: string;
  client_order_id?: string;
}

class AlpacaService {
  // Account Methods
  async getAccount(): Promise<Account> {
    try {
      const response = await withRetry(() => alpacaAPI.get<AlpacaAccount>('/v2/account'));
      return this.transformAccount(response);
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  // Order Methods
  async getOrders(status?: 'open' | 'closed' | 'all', limit: number = 50): Promise<Order[]> {
    try {
      const params: any = { limit };
      if (status && status !== 'all') {
        params.status = status;
      }

      const response = await withRetry(() => 
        alpacaAPI.get<AlpacaOrder[]>('/v2/orders', { params })
      );
      
      return response.map(order => this.transformOrder(order));
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await withRetry(() => 
        alpacaAPI.get<AlpacaOrder>(`/v2/orders/${orderId}`)
      );
      return this.transformOrder(response);
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await withRetry(() => 
        alpacaAPI.post<AlpacaOrder>('/v2/orders', orderData)
      );
      return this.transformOrder(response);
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async modifyOrder(orderId: string, modifications: ModifyOrderRequest): Promise<Order> {
    try {
      const response = await withRetry(() => 
        alpacaAPI.patch<AlpacaOrder>(`/v2/orders/${orderId}`, modifications)
      );
      return this.transformOrder(response);
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      await withRetry(() => alpacaAPI.delete(`/v2/orders/${orderId}`));
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async cancelAllOrders(): Promise<void> {
    try {
      await withRetry(() => alpacaAPI.delete('/v2/orders'));
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  // Position Methods
  async getPositions(): Promise<Position[]> {
    try {
      const response = await withRetry(() => 
        alpacaAPI.get<AlpacaPosition[]>('/v2/positions')
      );
      return response.map(position => this.transformPosition(position));
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async getPosition(symbol: string): Promise<Position> {
    try {
      const response = await withRetry(() => 
        alpacaAPI.get<AlpacaPosition>(`/v2/positions/${symbol}`)
      );
      return this.transformPosition(response);
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async closePosition(symbol: string, qty?: string, percentage?: string): Promise<Order> {
    try {
      const params: any = {};
      if (qty) params.qty = qty;
      if (percentage) params.percentage = percentage;

      const response = await withRetry(() => 
        alpacaAPI.delete<AlpacaOrder>(`/v2/positions/${symbol}`, { params })
      );
      return this.transformOrder(response);
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  async closeAllPositions(): Promise<Order[]> {
    try {
      const response = await withRetry(() => 
        alpacaAPI.delete<AlpacaOrder[]>('/v2/positions')
      );
      return response.map(order => this.transformOrder(order));
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  // Portfolio History
  async getPortfolioHistory(
    period?: '1D' | '1W' | '1M' | '3M' | '1A' | 'all',
    timeframe?: '1Min' | '5Min' | '15Min' | '1H' | '1D'
  ) {
    try {
      const params: any = {};
      if (period) params.period = period;
      if (timeframe) params.timeframe = timeframe;

      const response = await withRetry(() => 
        alpacaAPI.get('/v2/account/portfolio/history', { params })
      );
      return response;
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  // Utility Methods
  private transformAccount(alpacaAccount: AlpacaAccount): Account {
    return {
      id: alpacaAccount.id,
      accountNumber: alpacaAccount.account_number,
      status: alpacaAccount.status,
      currency: alpacaAccount.currency,
      cash: parseFloat(alpacaAccount.cash),
      buyingPower: parseFloat(alpacaAccount.buying_power),
      portfolioValue: parseFloat(alpacaAccount.portfolio_value),
      equity: parseFloat(alpacaAccount.equity),
      lastEquity: parseFloat(alpacaAccount.last_equity),
      longMarketValue: parseFloat(alpacaAccount.long_market_value || '0'),
      shortMarketValue: parseFloat(alpacaAccount.short_market_value || '0'),
      dayPL: parseFloat(alpacaAccount.equity) - parseFloat(alpacaAccount.last_equity),
      dayPLPercent: ((parseFloat(alpacaAccount.equity) - parseFloat(alpacaAccount.last_equity)) / parseFloat(alpacaAccount.last_equity)) * 100,
      unrealizedPL: 0, // Will be calculated from positions
      unrealizedPLPercent: 0, // Will be calculated from positions
      tradingBlocked: alpacaAccount.trading_blocked,
      transfersBlocked: alpacaAccount.transfers_blocked,
      accountBlocked: alpacaAccount.account_blocked,
      patternDayTrader: alpacaAccount.pattern_day_trader,
      daytradingBuyingPower: parseFloat(alpacaAccount.daytrading_buying_power),
      regtBuyingPower: parseFloat(alpacaAccount.regt_buying_power),
      createdAt: alpacaAccount.created_at
    };
  }

  private transformOrder(alpacaOrder: AlpacaOrder): Order {
    return {
      id: alpacaOrder.id,
      clientOrderId: alpacaOrder.client_order_id,
      symbol: alpacaOrder.symbol,
      assetClass: alpacaOrder.asset_class,
      side: alpacaOrder.side as 'buy' | 'sell',
      type: alpacaOrder.type as 'market' | 'limit' | 'stop' | 'stop_limit',
      timeInForce: alpacaOrder.time_in_force as 'day' | 'gtc' | 'ioc' | 'fok',
      qty: alpacaOrder.qty,
      filledQty: alpacaOrder.filled_qty,
      filledAvgPrice: alpacaOrder.filled_avg_price ? parseFloat(alpacaOrder.filled_avg_price) : undefined,
      limitPrice: alpacaOrder.limit_price ? parseFloat(alpacaOrder.limit_price) : undefined,
      stopPrice: alpacaOrder.stop_price ? parseFloat(alpacaOrder.stop_price) : undefined,
      status: alpacaOrder.status,
      extendedHours: alpacaOrder.extended_hours,
      createdAt: alpacaOrder.created_at,
      updatedAt: alpacaOrder.updated_at,
      submittedAt: alpacaOrder.submitted_at,
      filledAt: alpacaOrder.filled_at,
      canceledAt: alpacaOrder.canceled_at,
      expiredAt: alpacaOrder.expired_at,
      replacedAt: alpacaOrder.replaced_at,
      replacedBy: alpacaOrder.replaced_by,
      replaces: alpacaOrder.replaces
    };
  }

  private transformPosition(alpacaPosition: AlpacaPosition): Position {
    const qty = parseFloat(alpacaPosition.qty);
    const avgEntryPrice = parseFloat(alpacaPosition.avg_entry_price);
    const currentPrice = parseFloat(alpacaPosition.current_price);
    const marketValue = parseFloat(alpacaPosition.market_value);
    const unrealizedPL = parseFloat(alpacaPosition.unrealized_pl);

    return {
      symbol: alpacaPosition.symbol,
      assetClass: alpacaPosition.asset_class,
      exchange: alpacaPosition.exchange,
      side: alpacaPosition.side as 'long' | 'short',
      qty: Math.abs(qty),
      avgEntryPrice,
      currentPrice,
      marketValue: Math.abs(marketValue),
      costBasis: parseFloat(alpacaPosition.cost_basis),
      unrealizedPL,
      unrealizedPLPercent: parseFloat(alpacaPosition.unrealized_plpc) * 100,
      unrealizedIntradayPL: parseFloat(alpacaPosition.unrealized_intraday_pl),
      unrealizedIntradayPLPercent: parseFloat(alpacaPosition.unrealized_intraday_plpc) * 100,
      changeToday: parseFloat(alpacaPosition.change_today)
    };
  }
}

// Export singleton instance
export const alpacaService = new AlpacaService();
