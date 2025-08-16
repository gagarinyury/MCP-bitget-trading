/**
 * Bitget API Types
 * Comprehensive type definitions for Bitget trading API
 */

export interface BitgetConfig {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  sandbox: boolean;
  baseUrl: string;
  wsUrl: string;
}

// Market Data Types
export interface Ticker {
  symbol: string;
  last: string;
  bid: string;
  ask: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  change24h: string;
  changePercent24h: string;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][];
  timestamp: number;
}

export interface Candle {
  symbol: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// Trading Types
export interface OrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;
  reduceOnly?: boolean;
  marginMode?: 'crossed' | 'isolated';
  marginCoin?: string;
}

export interface Order {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  price?: string;
  status: 'open' | 'filled' | 'cancelled' | 'partially_filled';
  filled: string;
  remaining: string;
  timestamp: number;
  updateTime: number;
}

// Account Types
export interface Balance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  pnlPercent: string;
  margin: string;
  leverage: string;
  timestamp: number;
}

// WebSocket Types
export interface WSSubscription {
  op: 'subscribe' | 'unsubscribe';
  args: {
    instType: 'SPOT' | 'UMCBL' | 'DMCBL';
    channel: string;
    instId: string;
  }[];
}

export interface WSMessage {
  action: 'snapshot' | 'update';
  arg: {
    instType: string;
    channel: string;
    instId: string;
  };
  data: any[];
  ts: number;
}

// Error Types
export interface BitgetError {
  code: string;
  msg: string;
  requestTime: number;
  data: null;
}

export interface APIResponse<T> {
  code: string;
  msg: string;
  requestTime: number;
  data: T;
}