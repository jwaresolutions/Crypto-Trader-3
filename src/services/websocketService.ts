import { API_CONFIG } from './api';
import { MarketData } from '../store/slices/types';

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface PolygonCryptoTrade {
  ev: string; // event type
  pair: string; // currency pair
  p: number; // price
  s: number; // size
  c: number[]; // conditions
  t: number; // timestamp
  x: number; // exchange
}

export interface PolygonCryptoQuote {
  ev: string; // event type
  pair: string; // currency pair
  bp: number; // bid price
  bs: number; // bid size
  ap: number; // ask price
  as: number; // ask size
  t: number; // timestamp
  x: number; // exchange
}

export interface AlpacaTradeUpdate {
  event: string;
  order: any;
  timestamp: string;
  position_qty: string;
  price: string;
}

// WebSocket connection manager
class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  // Event listeners
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.disconnectAll();
    });
  }

  // Subscribe to events
  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emit events to subscribers
  public emit(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Connect to a WebSocket
  connect(
    connectionId: string,
    url: string,
    protocols?: string[],
    options: {
      onOpen?: (event: Event) => void;
      onMessage?: (event: MessageEvent) => void;
      onError?: (event: Event) => void;
      onClose?: (event: CloseEvent) => void;
      autoReconnect?: boolean;
    } = {}
  ): WebSocket {
    // Close existing connection if any
    this.disconnect(connectionId);

    const ws = new WebSocket(url, protocols);
    this.connections.set(connectionId, ws);

    ws.onopen = (event) => {
      console.log(`WebSocket connected: ${connectionId}`);
      this.reconnectAttempts.set(connectionId, 0);
      this.emit(`${connectionId}:open`, event);
      options.onOpen?.(event);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(`${connectionId}:message`, data);
        options.onMessage?.(event);
      } catch (error) {
        console.error(`Failed to parse WebSocket message for ${connectionId}:`, error);
      }
    };

    ws.onerror = (event) => {
      console.error(`WebSocket error for ${connectionId}:`, event);
      this.emit(`${connectionId}:error`, event);
      options.onError?.(event);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed: ${connectionId}`, event.code, event.reason);
      this.connections.delete(connectionId);
      this.emit(`${connectionId}:close`, event);
      options.onClose?.(event);

      // Auto-reconnect if enabled and not a normal closure
      if (options.autoReconnect && event.code !== 1000) {
        this.handleReconnect(connectionId, url, protocols, options);
      }
    };

    return ws;
  }

  // Handle reconnection logic
  private async handleReconnect(
    connectionId: string,
    url: string,
    protocols?: string[],
    options: any = {}
  ) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${connectionId}`);
      this.emit(`${connectionId}:reconnect-failed`, { attempts });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts);
    console.log(`Reconnecting ${connectionId} in ${delay}ms (attempt ${attempts + 1})`);
    
    this.reconnectAttempts.set(connectionId, attempts + 1);
    
    setTimeout(() => {
      if (!this.connections.has(connectionId)) {
        this.connect(connectionId, url, protocols, options);
      }
    }, delay);
  }

  // Send message to a WebSocket
  send(connectionId: string, data: any): boolean {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Failed to send WebSocket message to ${connectionId}:`, error);
        return false;
      }
    }
    return false;
  }

  // Disconnect a specific WebSocket
  disconnect(connectionId: string) {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close(1000, 'Normal closure');
      this.connections.delete(connectionId);
    }
  }

  // Disconnect all WebSockets
  disconnectAll() {
    this.connections.forEach((ws, connectionId) => {
      ws.close(1000, 'Normal closure');
    });
    this.connections.clear();
  }

  // Get connection status
  getConnectionStatus(connectionId: string): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'NOT_FOUND' {
    const ws = this.connections.get(connectionId);
    if (!ws) return 'NOT_FOUND';
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'NOT_FOUND';
    }
  }
}

// Polygon WebSocket service for market data
class PolygonWebSocketService {
  private wsManager: WebSocketManager;
  private subscribedSymbols: Set<string> = new Set();
  private isAuthenticated = false;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
  }

  // Connect to Polygon WebSocket
  connect() {
    const wsUrl = `wss://socket.polygon.io/crypto`;
    
    this.wsManager.connect('polygon', wsUrl, undefined, {
      autoReconnect: true,
      onOpen: () => {
        this.authenticate();
      },
      onMessage: (event) => {
        this.handleMessage(JSON.parse(event.data));
      }
    });
  }

  // Authenticate with Polygon
  private authenticate() {
    this.wsManager.send('polygon', {
      action: 'auth',
      params: API_CONFIG.POLYGON_API_KEY
    });
  }

  // Handle incoming messages
  private handleMessage(message: any) {
    if (Array.isArray(message)) {
      message.forEach(msg => this.processMessage(msg));
    } else {
      this.processMessage(message);
    }
  }

  // Process individual messages
  private processMessage(msg: any) {
    switch (msg.ev) {
      case 'status':
        if (msg.status === 'auth_success') {
          this.isAuthenticated = true;
          console.log('Polygon WebSocket authenticated');
          // Re-subscribe to any previously subscribed symbols
          this.resubscribeAll();
        }
        break;
      
      case 'XT': // Crypto trade
        this.handleCryptoTrade(msg as PolygonCryptoTrade);
        break;
      
      case 'XQ': // Crypto quote
        this.handleCryptoQuote(msg as PolygonCryptoQuote);
        break;
    }
  }

  // Handle crypto trade updates
  private handleCryptoTrade(trade: PolygonCryptoTrade) {
    const symbol = this.formatSymbol(trade.pair);
    const marketData: Partial<MarketData> = {
      symbol,
      price: trade.p,
      timestamp: trade.t
    };
    
    this.wsManager.emit('market-data-update', marketData);
  }

  // Handle crypto quote updates
  private handleCryptoQuote(quote: PolygonCryptoQuote) {
    const symbol = this.formatSymbol(quote.pair);
    const marketData: Partial<MarketData> = {
      symbol,
      bid: quote.bp,
      ask: quote.ap,
      bidSize: quote.bs,
      askSize: quote.as,
      timestamp: quote.t
    };
    
    this.wsManager.emit('market-data-update', marketData);
  }

  // Subscribe to symbol updates
  subscribeToSymbol(symbol: string) {
    if (!this.isAuthenticated) {
      console.warn('Not authenticated, queuing subscription for', symbol);
      this.subscribedSymbols.add(symbol);
      return;
    }

    const cryptoPair = this.formatCryptoPair(symbol);
    this.wsManager.send('polygon', {
      action: 'subscribe',
      params: `XT.${cryptoPair},XQ.${cryptoPair}`
    });
    
    this.subscribedSymbols.add(symbol);
  }

  // Unsubscribe from symbol updates
  unsubscribeFromSymbol(symbol: string) {
    const cryptoPair = this.formatCryptoPair(symbol);
    this.wsManager.send('polygon', {
      action: 'unsubscribe',
      params: `XT.${cryptoPair},XQ.${cryptoPair}`
    });
    
    this.subscribedSymbols.delete(symbol);
  }

  // Re-subscribe to all symbols after reconnection
  private resubscribeAll() {
    this.subscribedSymbols.forEach(symbol => {
      this.subscribeToSymbol(symbol);
    });
  }

  // Format symbol for display
  private formatSymbol(pair: string): string {
    return pair.replace('-', '');
  }

  // Format symbol for Polygon API
  private formatCryptoPair(symbol: string): string {
    // Convert BTCUSD to BTC-USD format
    if (symbol.endsWith('USD')) {
      const base = symbol.slice(0, -3);
      return `${base}-USD`;
    }
    return symbol;
  }

  disconnect() {
    this.wsManager.disconnect('polygon');
    this.isAuthenticated = false;
  }
}

// Alpaca WebSocket service for trading updates
class AlpacaWebSocketService {
  private wsManager: WebSocketManager;
  private isAuthenticated = false;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
  }

  // Connect to Alpaca WebSocket
  connect() {
    const wsUrl = API_CONFIG.ALPACA_BASE_URL.includes('paper') 
      ? 'wss://paper-api.alpaca.markets/stream'
      : 'wss://api.alpaca.markets/stream';
    
    this.wsManager.connect('alpaca', wsUrl, undefined, {
      autoReconnect: true,
      onOpen: () => {
        this.authenticate();
      },
      onMessage: (event) => {
        this.handleMessage(JSON.parse(event.data));
      }
    });
  }

  // Authenticate with Alpaca
  private authenticate() {
    this.wsManager.send('alpaca', {
      action: 'authenticate',
      data: {
        key_id: API_CONFIG.ALPACA_API_KEY,
        secret_key: API_CONFIG.ALPACA_SECRET_KEY
      }
    });
  }

  // Handle incoming messages
  private handleMessage(message: any) {
    if (Array.isArray(message)) {
      message.forEach(msg => this.processMessage(msg));
    } else {
      this.processMessage(message);
    }
  }

  // Process individual messages
  private processMessage(msg: any) {
    switch (msg.stream) {
      case 'authorization':
        if (msg.data.status === 'authorized') {
          this.isAuthenticated = true;
          console.log('Alpaca WebSocket authenticated');
          this.subscribeToUpdates();
        }
        break;
      
      case 'trade_updates':
        this.handleTradeUpdate(msg.data as AlpacaTradeUpdate);
        break;
    }
  }

  // Subscribe to trade updates
  private subscribeToUpdates() {
    this.wsManager.send('alpaca', {
      action: 'listen',
      data: {
        streams: ['trade_updates']
      }
    });
  }

  // Handle trade updates
  private handleTradeUpdate(update: AlpacaTradeUpdate) {
    this.wsManager.emit('trade-update', update);
  }

  disconnect() {
    this.wsManager.disconnect('alpaca');
    this.isAuthenticated = false;
  }
}

// Main WebSocket service
export class WebSocketService {
  private wsManager: WebSocketManager;
  private polygonService: PolygonWebSocketService;
  private alpacaService: AlpacaWebSocketService;

  constructor() {
    this.wsManager = new WebSocketManager();
    this.polygonService = new PolygonWebSocketService(this.wsManager);
    this.alpacaService = new AlpacaWebSocketService(this.wsManager);
  }

  // Initialize all connections
  connect() {
    this.polygonService.connect();
    this.alpacaService.connect();
  }

  // Disconnect all connections
  disconnect() {
    this.polygonService.disconnect();
    this.alpacaService.disconnect();
  }

  // Subscribe to market data updates
  subscribeToMarketData(callback: (data: Partial<MarketData>) => void) {
    return this.wsManager.subscribe('market-data-update', callback);
  }

  // Subscribe to trade updates
  subscribeToTradeUpdates(callback: (update: AlpacaTradeUpdate) => void) {
    return this.wsManager.subscribe('trade-update', callback);
  }

  // Subscribe to specific symbol
  subscribeToSymbol(symbol: string) {
    this.polygonService.subscribeToSymbol(symbol);
  }

  // Unsubscribe from specific symbol
  unsubscribeFromSymbol(symbol: string) {
    this.polygonService.unsubscribeFromSymbol(symbol);
  }

  // Get connection statuses
  getConnectionStatuses() {
    return {
      polygon: this.wsManager.getConnectionStatus('polygon'),
      alpaca: this.wsManager.getConnectionStatus('alpaca')
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
