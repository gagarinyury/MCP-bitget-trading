/**
 * Bitget WebSocket Client
 * Handles real-time data streaming from Bitget exchange
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { BitgetConfig, WSSubscription, WSMessage } from '../types/bitget.js';
import { logger } from '../utils/logger.js';

export interface WSClientConfig {
  url: string;
  pingInterval?: number;
  reconnectInterval?: number;
  maxReconnects?: number;
}

export class BitgetWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WSClientConfig;
  private subscriptions: Set<string> = new Set();
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectCount = 0;
  private isConnected = false;
  private isConnecting = false;

  constructor(config: WSClientConfig) {
    super();
    this.config = {
      pingInterval: 30000, // 30 seconds
      reconnectInterval: 5000, // 5 seconds
      maxReconnects: 10,
      ...config
    };
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    logger.info('Connecting to Bitget WebSocket', { url: this.config.url });

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws!.once('open', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectCount = 0;
          logger.info('WebSocket connected successfully');
          this.startPing();
          this.resubscribeAll();
          resolve();
        });

        this.ws!.once('error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    logger.info('Disconnecting WebSocket');
    this.isConnected = false;
    this.isConnecting = false;
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, symbol: string, instType: 'SPOT' | 'UMCBL' | 'DMCBL' = 'SPOT'): void {
    const subscription: WSSubscription = {
      op: 'subscribe',
      args: [{
        instType,
        channel,
        instId: symbol
      }]
    };

    const subKey = `${instType}:${channel}:${symbol}`;
    this.subscriptions.add(subKey);

    if (this.isConnected && this.ws) {
      logger.debug('Subscribing to channel', { channel, symbol, instType });
      this.ws.send(JSON.stringify(subscription));
    } else {
      logger.warn('WebSocket not connected, subscription will be sent on reconnect', { channel, symbol });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, symbol: string, instType: 'SPOT' | 'UMCBL' | 'DMCBL' = 'SPOT'): void {
    const subscription: WSSubscription = {
      op: 'unsubscribe',
      args: [{
        instType,
        channel,
        instId: symbol
      }]
    };

    const subKey = `${instType}:${channel}:${symbol}`;
    this.subscriptions.delete(subKey);

    if (this.isConnected && this.ws) {
      logger.debug('Unsubscribing from channel', { channel, symbol, instType });
      this.ws.send(JSON.stringify(subscription));
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      logger.debug('WebSocket connection opened');
      this.emit('connected');
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', { error: (error as any).message });
      }
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error', { error: error.message });
      this.emit('error', error);
    });

    this.ws.on('close', (code, reason) => {
      logger.warn('WebSocket connection closed', { code, reason: reason.toString() });
      this.isConnected = false;
      this.stopPing();
      this.emit('disconnected', { code, reason });
      this.scheduleReconnect();
    });

    this.ws.on('pong', () => {
      logger.debug('Received pong');
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    logger.debug('Received WebSocket message', { type: message.event || message.action });

    if (message.event === 'subscribe') {
      logger.info('Subscription confirmed', { channel: message.arg });
      this.emit('subscribed', message.arg);
    } else if (message.event === 'unsubscribe') {
      logger.info('Unsubscription confirmed', { channel: message.arg });
      this.emit('unsubscribed', message.arg);
    } else if (message.event === 'error') {
      logger.error('WebSocket subscription error', { error: message });
      this.emit('subscriptionError', message);
    } else if (message.data && message.arg) {
      // Data update
      const wsMessage: WSMessage = {
        action: message.action || 'update',
        arg: message.arg,
        data: message.data,
        ts: message.ts || Date.now()
      };
      
      this.emit('data', wsMessage);
      
      // Emit specific channel events
      const { instType, channel, instId } = message.arg;
      this.emit(`${instType}:${channel}:${instId}`, wsMessage);
    } else if (message.ping) {
      // Respond to ping
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({ pong: message.ping }));
      }
    }
  }

  /**
   * Start ping mechanism
   */
  private startPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.ping();
        logger.debug('Sent ping');
      }
    }, this.config.pingInterval!);
  }

  /**
   * Stop ping mechanism
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.config.maxReconnects!) {
      logger.error('Max reconnection attempts reached');
      this.emit('maxReconnectsReached');
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectCount++;
      logger.info(`Attempting to reconnect (${this.reconnectCount}/${this.config.maxReconnects})`);
      
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconnection failed', { error: (error as any).message });
        this.scheduleReconnect();
      }
    }, this.config.reconnectInterval!);
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeAll(): void {
    logger.info(`Resubscribing to ${this.subscriptions.size} channels`);
    
    for (const subKey of this.subscriptions) {
      const [instType, channel, symbol] = subKey.split(':');
      this.subscribe(channel, symbol, instType as any);
    }
  }

  /**
   * Get connection status
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

/**
 * Factory function to create WebSocket client for Bitget
 */
export function createBitgetWebSocketClient(config: BitgetConfig): BitgetWebSocketClient {
  return new BitgetWebSocketClient({
    url: config.wsUrl,
    pingInterval: 30000,
    reconnectInterval: 5000,
    maxReconnects: 10
  });
}