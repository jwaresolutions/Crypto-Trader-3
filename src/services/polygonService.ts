import { polygonAPI, handleAPIError, withRetry } from './api';
import { MarketData } from '../store/slices/types';

// Polygon API Types
export interface PolygonTicker {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  day: {
    o: number; // open
    h: number; // high
    l: number; // low
    c: number; // close
    v: number; // volume
    vw: number; // volume weighted average price
  };
  min: {
    av: number; // average volume
    t: number; // timestamp
    n: number; // number of transactions
    o: number; // open
    h: number; // high
    l: number; // low
    c: number; // close
    v: number; // volume
    vw: number; // volume weighted average price
  };
  prevDay: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
}

export interface PolygonTickerResponse {
  status: string;
  request_id: string;
  results?: PolygonTicker[];
  count: number;
  next_url?: string;
}

export interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  market_cap?: number;
  phone_number?: string;
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  description?: string;
  sic_code?: string;
  sic_description?: string;
  ticker_root?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
}

export interface PolygonAggregateBar {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  t: number; // timestamp
  v: number; // volume
  vw: number; // volume weighted average price
  n: number; // number of transactions
}

export interface PolygonAggregatesResponse {
  ticker: string;
  status: string;
  request_id: string;
  results?: PolygonAggregateBar[];
  resultsCount: number;
  adjusted: boolean;
  count: number;
  next_url?: string;
}

export interface PolygonRealTimeQuote {
  symbol: string;
  last: {
    price: number;
    size: number;
    exchange: number;
    timestamp: number;
  };
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  change: number;
  changePercent: number;
  volume: number;
  updated: number;
}

// Crypto-specific types
export interface PolygonCryptoTicker {
  value: number;
  symbol: string;
  last: {
    price: number;
    size: number;
    exchange: number;
    timestamp: number;
  };
  session: {
    change: number;
    change_percent: number;
    early_trading_change: number;
    early_trading_change_percent: number;
    close: number;
    high: number;
    low: number;
    open: number;
    previous_close: number;
  };
  market_status: string;
  type: string;
  name: string;
}

class PolygonService {
  // Get current market data for multiple symbols
  async getTickerSnapshots(symbols: string[]): Promise<MarketData[]> {
    try {
      // For crypto, we need to format symbols differently
      const cryptoSymbols = symbols.map(s => s.startsWith('X:') ? s : `X:${s}`);
      const symbolsParam = cryptoSymbols.join(',');
      
      const response = await withRetry(() =>
        polygonAPI.get<PolygonTickerResponse>(`/v2/snapshot/locale/global/markets/crypto/tickers`, {
          params: { tickers: symbolsParam }
        })
      );

      if (!response.results) {
        return [];
      }

      return response.results.map(ticker => this.transformTicker(ticker));
    } catch (error) {
      console.warn('Failed to fetch crypto snapshots, using fallback data');
      // Return mock data for development
      return this.getMockMarketData(symbols);
    }
  }

  // Get single ticker snapshot
  async getTickerSnapshot(symbol: string): Promise<MarketData | null> {
    try {
      const cryptoSymbol = symbol.startsWith('X:') ? symbol : `X:${symbol}`;
      
      const response = await withRetry(() =>
        polygonAPI.get<{ status: string; results: PolygonTicker }>(`/v2/snapshot/locale/global/markets/crypto/tickers/${cryptoSymbol}`)
      );

      if (response.results) {
        return this.transformTicker(response.results);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to fetch ticker snapshot for ${symbol}`);
      return null;
    }
  }

  // Get historical aggregates (OHLCV data)
  async getAggregates(
    symbol: string,
    multiplier: number = 1,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
    from: string,
    to: string,
    adjusted: boolean = true,
    sort: 'asc' | 'desc' = 'asc',
    limit: number = 5000
  ): Promise<PolygonAggregateBar[]> {
    try {
      const cryptoSymbol = symbol.startsWith('X:') ? symbol : `X:${symbol}`;
      
      const response = await withRetry(() =>
        polygonAPI.get<PolygonAggregatesResponse>(
          `/v2/aggs/ticker/${cryptoSymbol}/range/${multiplier}/${timespan}/${from}/${to}`,
          {
            params: {
              adjusted,
              sort,
              limit
            }
          }
        )
      );

      return response.results || [];
    } catch (error) {
      console.warn(`Failed to fetch aggregates for ${symbol}:`, error);
      return [];
    }
  }

  // Get ticker details
  async getTickerDetails(symbol: string): Promise<PolygonTickerDetails | null> {
    try {
      const cryptoSymbol = symbol.startsWith('X:') ? symbol : `X:${symbol}`;
      
      const response = await withRetry(() =>
        polygonAPI.get<{ status: string; results: PolygonTickerDetails }>(`/v3/reference/tickers/${cryptoSymbol}`)
      );

      return response.results || null;
    } catch (error) {
      console.warn(`Failed to fetch ticker details for ${symbol}`);
      return null;
    }
  }

  // Get previous day's data
  async getPreviousClose(symbol: string): Promise<PolygonAggregateBar | null> {
    try {
      const cryptoSymbol = symbol.startsWith('X:') ? symbol : `X:${symbol}`;
      
      const response = await withRetry(() =>
        polygonAPI.get<{ status: string; results: PolygonAggregateBar[] }>(`/v2/aggs/ticker/${cryptoSymbol}/prev`)
      );

      return response.results?.[0] || null;
    } catch (error) {
      console.warn(`Failed to fetch previous close for ${symbol}`);
      return null;
    }
  }

  // Search for tickers
  async searchTickers(search: string, type?: string, market?: string, active?: boolean): Promise<PolygonTickerDetails[]> {
    try {
      const params: any = { search };
      if (type) params.type = type;
      if (market) params.market = market;
      if (active !== undefined) params.active = active;

      const response = await withRetry(() =>
        polygonAPI.get<{ status: string; results: PolygonTickerDetails[]; count: number }>('/v3/reference/tickers', { params })
      );

      return response.results || [];
    } catch (error) {
      console.warn('Failed to search tickers:', error);
      return [];
    }
  }

  // Get real-time quote (WebSocket alternative for REST polling)
  async getRealTimeQuote(symbol: string): Promise<PolygonRealTimeQuote | null> {
    try {
      const cryptoSymbol = symbol.startsWith('X:') ? symbol : `X:${symbol}`;
      
      const response = await withRetry(() =>
        polygonAPI.get<{ status: string; results: PolygonCryptoTicker }>(`/v1/last_quote/currencies/${cryptoSymbol}`)
      );

      if (response.results) {
        return this.transformRealTimeQuote(response.results);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to fetch real-time quote for ${symbol}`);
      return null;
    }
  }

  // Transform Polygon ticker to our MarketData format
  private transformTicker(ticker: PolygonTicker): MarketData {
    const symbol = ticker.ticker.replace('X:', '').replace('-USD', 'USD');
    
    return {
      symbol,
      price: ticker.day?.c || ticker.min?.c || 0,
      change: ticker.todaysChange || 0,
      changePercent: ticker.todaysChangePerc || 0,
      volume: ticker.day?.v || ticker.min?.v || 0,
      high: ticker.day?.h || ticker.min?.h || 0,
      low: ticker.day?.l || ticker.min?.l || 0,
      open: ticker.day?.o || ticker.min?.o || 0,
      prevClose: ticker.prevDay?.c || 0,
      timestamp: ticker.updated || Date.now(),
      bid: 0, // Not available in snapshot
      ask: 0, // Not available in snapshot
      bidSize: 0,
      askSize: 0
    };
  }

  // Transform real-time quote
  private transformRealTimeQuote(quote: PolygonCryptoTicker): PolygonRealTimeQuote {
    return {
      symbol: quote.symbol.replace('X:', '').replace('-USD', 'USD'),
      last: quote.last,
      bid: 0, // Would need separate bid/ask endpoint
      ask: 0,
      bidSize: 0,
      askSize: 0,
      change: quote.session.change,
      changePercent: quote.session.change_percent,
      volume: 0, // Would need separate volume endpoint
      updated: quote.last.timestamp
    };
  }

  // Mock data for development/fallback
  private getMockMarketData(symbols: string[]): MarketData[] {
    const mockPrices: Record<string, { price: number; change: number }> = {
      'BTCUSD': { price: 47500, change: 1250 },
      'ETHUSD': { price: 3350, change: 150 },
      'ADAUSD': { price: 0.42, change: -0.03 },
      'SOLUSD': { price: 98, change: 3 },
      'DOTUSD': { price: 7.25, change: -0.15 },
      'LINKUSD': { price: 14.80, change: 0.65 },
      'MATICUSD': { price: 0.85, change: 0.02 },
      'AVAXUSD': { price: 38.50, change: -1.20 },
      'ATOMUSD': { price: 11.30, change: 0.45 },
      'ALGOUSD': { price: 0.28, change: -0.01 }
    };

    return symbols.map(symbol => {
      const mock = mockPrices[symbol] || { price: 100, change: 0 };
      const prevClose = mock.price - mock.change;
      const changePercent = prevClose > 0 ? (mock.change / prevClose) * 100 : 0;

      return {
        symbol,
        price: mock.price,
        change: mock.change,
        changePercent,
        volume: Math.floor(Math.random() * 1000000),
        high: mock.price * 1.05,
        low: mock.price * 0.95,
        open: prevClose,
        prevClose,
        timestamp: Date.now(),
        bid: mock.price - 0.01,
        ask: mock.price + 0.01,
        bidSize: Math.floor(Math.random() * 1000),
        askSize: Math.floor(Math.random() * 1000)
      };
    });
  }
}

// Export singleton instance
export const polygonService = new PolygonService();
