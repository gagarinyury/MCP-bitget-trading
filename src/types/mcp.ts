/**
 * MCP Tool Schemas
 * Zod schemas for validation of MCP tool parameters
 */

import { z } from 'zod';

// Market Data Schemas
export const GetPriceSchema = z.object({
  symbol: z.string().describe('Trading pair symbol (e.g., BTCUSDT for spot, BTCUSDT_UMCBL for futures)')
});

export const GetTickerSchema = z.object({
  symbol: z.string().describe('Trading pair symbol (BTCUSDT for spot, BTCUSDT_UMCBL for futures)')
});

export const GetOrderBookSchema = z.object({
  symbol: z.string().describe('Trading pair symbol (BTCUSDT for spot, BTCUSDT_UMCBL for futures)'),
  depth: z.number().optional().describe('Order book depth (default: 20)')
});

export const GetCandlesSchema = z.object({
  symbol: z.string().describe('Trading pair symbol (BTCUSDT for spot, BTCUSDT_UMCBL for futures)'),
  interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1M', '5M', '15M', '30M', '1H', '4H', '1D']).describe('Candle interval (lowercase for spot, uppercase for futures)'),
  limit: z.number().optional().describe('Number of candles (default: 100)')
});

// Trading Schemas
export const PlaceOrderSchema = z.object({
  symbol: z.string().describe('Trading pair symbol'),
  side: z.enum(['buy', 'sell']).describe('Order side'),
  type: z.enum(['market', 'limit']).describe('Order type'),
  quantity: z.string().describe('Order quantity'),
  price: z.string().optional().describe('Order price (required for limit orders)'),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional().describe('Time in force'),
  clientOrderId: z.string().optional().describe('Client order ID'),
  reduceOnly: z.boolean().optional().describe('Reduce only flag for futures')
});

export const CancelOrderSchema = z.object({
  orderId: z.string().describe('Order ID to cancel'),
  symbol: z.string().describe('Trading pair symbol')
});

export const GetOrdersSchema = z.object({
  symbol: z.string().optional().describe('Filter by symbol'),
  status: z.enum(['open', 'filled', 'cancelled']).optional().describe('Filter by status')
});

// Account Schemas
export const GetBalanceSchema = z.object({
  asset: z.string().optional().describe('Specific asset to query')
});

export const GetPositionsSchema = z.object({
  symbol: z.string().optional().describe('Filter by symbol')
});

// WebSocket Schemas
export const SubscribePriceSchema = z.object({
  symbols: z.array(z.string()).describe('Array of symbols to subscribe to')
});

export const SubscribeTickerSchema = z.object({
  symbols: z.array(z.string()).describe('Array of symbols to subscribe to')
});

export const SubscribeOrderBookSchema = z.object({
  symbol: z.string().describe('Symbol to subscribe to order book updates')
});

export const UnsubscribeSchema = z.object({
  channel: z.string().describe('Channel to unsubscribe from')
});

// Futures Schemas
export const SetLeverageSchema = z.object({
  symbol: z.string().describe('Trading pair symbol'),
  leverage: z.number().min(1).max(125).describe('Leverage value (1-125)')
});

export const GetMarginInfoSchema = z.object({
  symbol: z.string().optional().describe('Filter by symbol')
});

// Type exports for use in server
export type GetPriceParams = z.infer<typeof GetPriceSchema>;
export type GetTickerParams = z.infer<typeof GetTickerSchema>;
export type GetOrderBookParams = z.infer<typeof GetOrderBookSchema>;
export type GetCandlesParams = z.infer<typeof GetCandlesSchema>;
export type PlaceOrderParams = z.infer<typeof PlaceOrderSchema>;
export type CancelOrderParams = z.infer<typeof CancelOrderSchema>;
export type GetOrdersParams = z.infer<typeof GetOrdersSchema>;
export type GetBalanceParams = z.infer<typeof GetBalanceSchema>;
export type GetPositionsParams = z.infer<typeof GetPositionsSchema>;
export type SubscribePriceParams = z.infer<typeof SubscribePriceSchema>;
export type SubscribeTickerParams = z.infer<typeof SubscribeTickerSchema>;
export type SubscribeOrderBookParams = z.infer<typeof SubscribeOrderBookSchema>;
export type UnsubscribeParams = z.infer<typeof UnsubscribeSchema>;
export type SetLeverageParams = z.infer<typeof SetLeverageSchema>;
export type GetMarginInfoParams = z.infer<typeof GetMarginInfoSchema>;