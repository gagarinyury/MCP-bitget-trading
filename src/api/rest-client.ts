/**
 * Bitget REST API Client
 * Handles all REST API communications with Bitget exchange
 */

import crypto from 'crypto';
import fetch from 'node-fetch';
import { BitgetConfig, APIResponse, Ticker, OrderBook, Candle, Order, Balance, Position, OrderParams, BitgetError } from '../types/bitget.js';

export class BitgetRestClient {
  private config: BitgetConfig;
  private rateLimitRequests: number = 0;
  private rateLimitWindow: number = Date.now();

  constructor(config: BitgetConfig) {
    this.config = config;
  }
  
  /**
   * Helper to determine if symbol is for futures (contains _UMCBL)
   */
  private isFuturesSymbol(symbol: string): boolean {
    return symbol.includes('_UMCBL') || symbol.includes('_');
  }

  /**
   * Format interval for Bitget Futures API
   * Futures API accepts: [1m,3m,5m,15m,30m,1H,4H,6H,12H,1D,1W,1M,6Hutc,12Hutc,1Dutc,3Dutc,1Wutc,1Mutc]
   */
  private formatIntervalForFuturesAPI(interval: string): string {
    const lower = interval.toLowerCase();
    
    // Minutes: keep short format (1m, 5m, 15m, 30m)
    if (lower.match(/^\d+m$/)) {
      return lower;
    }
    
    // Hours: convert to uppercase H (1H, 4H, 6H, 12H)
    if (lower.includes('h')) {
      return lower.replace('h', 'H');
    }
    
    // Days/Weeks/Months: uppercase (1D, 1W, 1M)
    if (lower.includes('d') || lower.includes('w')) {
      return lower.toUpperCase();
    }
    
    // Default: return as is for special cases like UTC variants
    return interval;
  }

  /**
   * Format interval for Bitget Spot API  
   * Spot API accepts: [1min,3min,5min,15min,30min,1h,4h,6h,12h,1day,1week,1M,6Hutc,12Hutc,1Dutc,3Dutc,1Wutc,1Mutc]
   */
  private formatIntervalForSpotAPI(interval: string): string {
    const lower = interval.toLowerCase();
    
    // Minutes: convert to full format (1min, 5min, 15min, 30min)
    if (lower.match(/^\d+m$/)) {
      return lower.replace('m', 'min');
    }
    
    // Hours: keep lowercase (1h, 4h, 6h, 12h)
    if (lower.includes('h') && !lower.includes('utc')) {
      return lower;
    }
    
    // Days: convert to full format (1day)
    if (lower.match(/^\d+d$/)) {
      return lower.replace('d', 'day');
    }
    
    // Weeks: convert to full format (1week)  
    if (lower.match(/^\d+w$/)) {
      return lower.replace('w', 'week');
    }
    
    // Months and UTC variants: return as is
    return interval;
  }

  /**
   * Generate authentication signature for private endpoints
   */
  private generateSignature(timestamp: string, method: string, requestPath: string, body: string = ''): string {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', this.config.secretKey).update(message).digest('base64');
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(): void {
    const now = Date.now();
    if (now - this.rateLimitWindow > 1000) {
      this.rateLimitWindow = now;
      this.rateLimitRequests = 0;
    }
    
    if (this.rateLimitRequests >= 10) {
      throw new Error('Rate limit exceeded');
    }
    
    this.rateLimitRequests++;
  }

  /**
   * Make authenticated request to Bitget API
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {},
    isPrivate: boolean = false
  ): Promise<APIResponse<T>> {
    this.checkRateLimit();

    const timestamp = Date.now().toString();
    let url = `${this.config.baseUrl}${endpoint}`;
    let body = '';

    // Build query string for GET requests
    let queryString = '';
    if (method === 'GET' && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      queryString = searchParams.toString();
      url += `?${queryString}`;
    }

    // Handle body for POST requests
    if (method === 'POST' && Object.keys(params).length > 0) {
      body = JSON.stringify(params);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authentication headers for private endpoints
    if (isPrivate) {
      // For GET requests, include query params in signature path
      const signaturePath = method === 'GET' && queryString 
        ? `${endpoint}?${queryString}`
        : endpoint;
      
      const signature = this.generateSignature(timestamp, method, signaturePath, body);
      headers['ACCESS-KEY'] = this.config.apiKey;
      headers['ACCESS-SIGN'] = signature;
      headers['ACCESS-TIMESTAMP'] = timestamp;
      headers['ACCESS-PASSPHRASE'] = this.config.passphrase;
      
      // Add demo trading header if in sandbox mode
      if (this.config.sandbox) {
        headers['paptrading'] = '1';
      }
    }

    try {
      console.error(`Making ${method} request to: ${url}`);
      if (isPrivate) {
        console.error('Headers:', JSON.stringify(headers, null, 2));
      }
      if (body) {
        console.error('Body:', body);
      }

      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? body : undefined,
      });

      const data = await response.json() as APIResponse<T>;
      
      console.error(`Response status: ${response.status}`);
      console.error('Response data:', JSON.stringify(data, null, 2));

      if (data.code !== '00000') {
        const errorMsg = `Bitget API Error: ${data.code} - ${data.msg}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error('Bitget API request failed:', error);
      console.error('Request details:', { method, url, isPrivate, body });
      throw error;
    }
  }

  // ========== PUBLIC MARKET DATA METHODS ==========

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<string> {
    if (this.isFuturesSymbol(symbol)) {
      // Futures ticker
      const futuresSymbol = symbol.includes('_UMCBL') ? symbol : `${symbol}_UMCBL`;
      const response = await this.request<any>('GET', '/api/mix/v1/market/ticker', { symbol: futuresSymbol });
      if (response.data?.last) {
        return response.data.last;
      }
    } else {
      // Spot ticker - use v1 public API
      const response = await this.request<any>('GET', '/api/spot/v1/market/tickers', {});
      if (response.data && Array.isArray(response.data)) {
        const ticker = response.data.find((t: any) => t.symbol === symbol);
        if (ticker) {
          return ticker.close;
        }
      }
    }
    throw new Error(`Price not found for symbol: ${symbol}`);
  }

  /**
   * Get full ticker information
   */
  async getTicker(symbol: string): Promise<Ticker> {
    if (this.isFuturesSymbol(symbol)) {
      // Futures ticker
      const futuresSymbol = symbol.includes('_UMCBL') ? symbol : `${symbol}_UMCBL`;
      const response = await this.request<any>('GET', '/api/mix/v1/market/ticker', { symbol: futuresSymbol });
      if (response.data) {
        const ticker = response.data;
        return {
          symbol: ticker.symbol,
          last: ticker.last,
          bid: ticker.bestBid,
          ask: ticker.bestAsk,
          high24h: ticker.high24h,
          low24h: ticker.low24h,
          volume24h: ticker.baseVolume,
          change24h: ((parseFloat(ticker.last) - parseFloat(ticker.openUtc)) / parseFloat(ticker.openUtc) * 100).toFixed(2),
          changePercent24h: ticker.priceChangePercent,
          timestamp: parseInt(ticker.timestamp) || Date.now()
        };
      }
    } else {
      // Spot ticker - use v1 public API
      const response = await this.request<any>('GET', '/api/spot/v1/market/tickers', {});
      if (response.data && Array.isArray(response.data)) {
        const ticker = response.data.find((t: any) => t.symbol === symbol);
        if (ticker) {
          return {
            symbol: ticker.symbol,
            last: ticker.close,
            bid: ticker.buyOne,
            ask: ticker.sellOne,
            high24h: ticker.high24h,
            low24h: ticker.low24h,
            volume24h: ticker.baseVol,
            change24h: ticker.change,
            changePercent24h: ticker.changePercent,
            timestamp: parseInt(ticker.ts) || Date.now()
          };
        }
      }
    }
    throw new Error(`Ticker not found for symbol: ${symbol}`);
  }

  /**
   * Get order book
   */
  async getOrderBook(symbol: string, depth: number = 20): Promise<OrderBook> {
    if (this.isFuturesSymbol(symbol)) {
      // Futures orderbook
      const futuresSymbol = symbol.includes('_UMCBL') ? symbol : `${symbol}_UMCBL`;
      const response = await this.request<any>('GET', '/api/mix/v1/market/depth', { 
        symbol: futuresSymbol,
        limit: depth.toString()
      });
      
      return {
        symbol: futuresSymbol,
        bids: response.data?.bids || [],
        asks: response.data?.asks || [],
        timestamp: response.data?.timestamp || Date.now()
      };
    } else {
      // Spot orderbook
      const response = await this.request<any>('GET', '/api/v2/spot/market/orderbook', { 
        symbol, 
        type: 'step0',
        limit: depth.toString()
      });
      
      return {
        symbol,
        bids: response.data?.bids || [],
        asks: response.data?.asks || [],
        timestamp: response.data?.ts || Date.now()
      };
    }
  }

  /**
   * Get historical candles/klines
   */
  async getCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    if (this.isFuturesSymbol(symbol)) {
      // Futures candles - use v2 API with productType
      // Remove _UMCBL suffix if present for v2 API
      const cleanSymbol = symbol.replace('_UMCBL', '');
      const response = await this.request<string[][]>('GET', '/api/v2/mix/market/candles', {
        productType: 'USDT-FUTURES',
        symbol: cleanSymbol,
        granularity: this.formatIntervalForFuturesAPI(interval), // Format interval for futures API
        limit: limit.toString()
      });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data.map(candle => ({
        symbol: symbol, // Keep original symbol format
        timestamp: parseInt(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } else {
      // Spot candles
      const response = await this.request<string[][]>('GET', '/api/v2/spot/market/candles', {
        symbol,
        granularity: this.formatIntervalForSpotAPI(interval), // Format interval for spot API
        limit: limit.toString()
      });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data.map(candle => ({
        symbol,
        timestamp: parseInt(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    }
  }

  // ========== PRIVATE TRADING METHODS ==========

  /**
   * Get account balance
   */
  async getBalance(asset?: string): Promise<Balance[]> {
    const response = await this.request<any>('GET', '/api/v2/spot/account/assets', {}, true);
    
    const balances = response.data.map((item: any) => ({
      asset: item.coin,
      free: item.available,
      locked: item.frozen,
      total: (parseFloat(item.available) + parseFloat(item.frozen)).toString()
    }));

    if (asset) {
      return balances.filter((balance: Balance) => balance.asset === asset);
    }
    
    return balances;
  }

  /**
   * Place a new order (automatically detects spot vs futures)
   */
  async placeOrder(params: OrderParams): Promise<Order> {
    if (this.isFuturesSymbol(params.symbol)) {
      return this.placeFuturesOrder(params);
    } else {
      return this.placeSpotOrder(params);
    }
  }

  /**
   * Place a spot order
   */
  private async placeSpotOrder(params: OrderParams): Promise<Order> {
    const orderData: any = {
      symbol: params.symbol,
      side: params.side,
      orderType: params.type,
      size: params.quantity,  // v2 API uses 'size' instead of 'quantity'
    };

    if (params.type === 'limit' && params.price) {
      orderData.price = params.price;
    }

    if (params.timeInForce) {
      orderData.force = params.timeInForce;  // v2 API uses 'force' instead of 'timeInForceValue'
    } else if (params.type === 'limit') {
      orderData.force = 'GTC';  // Default to GTC for limit orders
    }

    if (params.clientOrderId) {
      orderData.clientOid = params.clientOrderId;
    }

    const response = await this.request<any>('POST', '/api/v2/spot/trade/place-order', orderData, true);

    return {
      orderId: response.data.orderId,
      clientOrderId: response.data.clientOid,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: params.quantity,
      price: params.price,
      status: 'open',
      filled: '0',
      remaining: params.quantity,
      timestamp: Date.now(),
      updateTime: Date.now()
    };
  }

  /**
   * Place a futures order
   */
  private async placeFuturesOrder(params: OrderParams): Promise<Order> {
    // For v1 mix API, keep the _UMCBL suffix
    const futuresSymbol = params.symbol.includes('_UMCBL') ? params.symbol : `${params.symbol}_UMCBL`;
    
    // Use v2 API format for futures orders
    const orderData: any = {
      symbol: futuresSymbol.replace('_UMCBL', ''),  // v2 API might not need suffix
      productType: 'USDT-FUTURES',
      marginCoin: 'USDT',
      marginMode: 'crossed',
      side: params.side,
      orderType: params.type,
      size: params.quantity,  // For futures, this is in contracts
    };

    if (params.type === 'limit' && params.price) {
      orderData.price = params.price;
    }

    if (params.timeInForce) {
      orderData.timeInForceValue = params.timeInForce;  // v2 API uses timeInForceValue
    } else if (params.type === 'limit') {
      orderData.timeInForceValue = 'GTC';  // v2 API uses 'GTC'
    }

    if (params.clientOrderId) {
      orderData.clientOid = params.clientOrderId;
    }

    if (params.reduceOnly) {
      orderData.reduceOnly = params.reduceOnly;
    }

    console.error('Placing futures order with data:', JSON.stringify(orderData, null, 2));
    
    // Try v2 API endpoint
    const response = await this.request<any>('POST', '/api/v2/mix/order/place-order', orderData, true);

    return {
      orderId: response.data.orderId,
      clientOrderId: response.data.clientOid,
      symbol: params.symbol, // Return original symbol with suffix
      side: params.side,
      type: params.type,
      quantity: params.quantity,
      price: params.price,
      status: 'open',
      filled: '0',
      remaining: params.quantity,
      timestamp: Date.now(),
      updateTime: Date.now()
    };
  }

  /**
   * Cancel an order (automatically detects spot vs futures)
   */
  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    if (this.isFuturesSymbol(symbol)) {
      return this.cancelFuturesOrder(orderId, symbol);
    } else {
      return this.cancelSpotOrder(orderId, symbol);
    }
  }

  /**
   * Cancel a spot order
   */
  private async cancelSpotOrder(orderId: string, symbol: string): Promise<boolean> {
    const response = await this.request<any>('POST', '/api/v2/spot/trade/cancel-order', {
      orderId,
      symbol
    }, true);

    return response.code === '00000';
  }

  /**
   * Cancel a futures order
   */
  private async cancelFuturesOrder(orderId: string, symbol: string): Promise<boolean> {
    // Remove _UMCBL suffix for v1 API
    const cleanSymbol = symbol.replace('_UMCBL', '');
    
    const response = await this.request<any>('POST', '/api/v2/mix/order/cancel-order', {
      orderId,
      symbol: cleanSymbol,
      productType: 'USDT-FUTURES',
      marginCoin: 'USDT'
    }, true);

    return response.code === '00000';
  }

  /**
   * Get open orders (supports both spot and futures)
   */
  async getOrders(symbol?: string, status?: string): Promise<Order[]> {
    if (symbol && this.isFuturesSymbol(symbol)) {
      return this.getFuturesOrders(symbol, status);
    } else {
      return this.getSpotOrders(symbol, status);
    }
  }

  /**
   * Get spot orders
   */
  private async getSpotOrders(symbol?: string, status?: string): Promise<Order[]> {
    const params: any = {};
    if (symbol) params.symbol = symbol;
    
    const response = await this.request<any[]>('GET', '/api/v2/spot/trade/unfilled-orders', params, true);

    return response.data.map(order => ({
      orderId: order.orderId,
      clientOrderId: order.clientOid,
      symbol: order.symbol,
      side: order.side,
      type: order.orderType,
      quantity: order.quantity,
      price: order.price,
      status: order.status,
      filled: order.fillQuantity,
      remaining: (parseFloat(order.quantity) - parseFloat(order.fillQuantity)).toString(),
      timestamp: parseInt(order.cTime),
      updateTime: parseInt(order.uTime)
    }));
  }

  /**
   * Get futures orders
   */
  private async getFuturesOrders(symbol?: string, status?: string): Promise<Order[]> {
    const params: any = {};
    
    if (symbol) {
      // Remove _UMCBL suffix for v1 API
      params.symbol = symbol.replace('_UMCBL', '');
    }

    const response = await this.request<any[]>('GET', '/api/mix/v1/order/current', params, true);

    return response.data.map(order => ({
      orderId: order.orderId,
      clientOrderId: order.clientOid,
      symbol: symbol || `${order.symbol}_UMCBL`, // Add suffix back for consistency
      side: order.side,
      type: order.orderType,
      quantity: order.size,
      price: order.price,
      status: order.state,
      filled: order.fillSize,
      remaining: (parseFloat(order.size) - parseFloat(order.fillSize || '0')).toString(),
      timestamp: parseInt(order.cTime),
      updateTime: parseInt(order.uTime)
    }));
  }

  // ========== FUTURES METHODS ==========

  /**
   * Get futures positions
   */
  async getFuturesPositions(symbol?: string): Promise<Position[]> {
    const params: any = { productType: 'USDT-FUTURES' };
    if (symbol) {
      // Add _UMCBL suffix for futures if not present
      params.symbol = symbol.includes('_') ? symbol : `${symbol}_UMCBL`;
    }

    const response = await this.request<any>('GET', '/api/v2/mix/position/all-position', params, true);

    const positions = response.data || [];
    return positions.map((position: any) => ({
      symbol: position.symbol,
      side: position.holdSide || (parseFloat(position.size || '0') > 0 ? 'long' : 'short'),
      size: Math.abs(parseFloat(position.size || position.total || '0')).toString(),
      entryPrice: position.averageOpenPrice || position.openPriceAvg,
      markPrice: position.markPrice,
      pnl: position.unrealizedPL || position.achievedProfits,
      pnlPercent: position.unrealizedPLR || '0',
      margin: position.margin || position.marginSize,
      leverage: position.leverage,
      timestamp: parseInt(position.cTime || Date.now().toString())
    }));
  }

  /**
   * Set leverage for futures trading
   */
  async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    // Remove _UMCBL suffix for v2 API (like in candles)
    const cleanSymbol = symbol.replace('_UMCBL', '');
    
    const response = await this.request<any>('POST', '/api/v2/mix/account/set-leverage', {
      symbol: cleanSymbol,
      productType: 'USDT-FUTURES',
      marginCoin: 'USDT',  // Required parameter!
      leverage: leverage.toString(),
      holdSide: 'long'
    }, true);

    return response.code === '00000';
  }

  /**
   * Get margin information
   */
  async getMarginInfo(symbol?: string): Promise<any> {
    const params: any = { productType: 'USDT-FUTURES' };
    if (symbol) {
      // Add _UMCBL suffix for futures if not present
      params.symbol = symbol.includes('_') ? symbol : `${symbol}_UMCBL`;
    }

    const response = await this.request<any>('GET', '/api/v2/mix/account/accounts', params, true);
    return response.data;
  }
}