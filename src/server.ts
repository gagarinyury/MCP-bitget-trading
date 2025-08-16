#!/usr/bin/env node
/**
 * Bitget Trading MCP Server
 * Comprehensive trading server for Bitget exchange
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { BitgetRestClient } from './api/rest-client.js';
import { BitgetConfig } from './types/bitget.js';
import {
  GetPriceSchema,
  GetTickerSchema,
  GetOrderBookSchema,
  GetCandlesSchema,
  PlaceOrderSchema,
  CancelOrderSchema,
  GetOrdersSchema,
  GetBalanceSchema,
  GetPositionsSchema,
  SetLeverageSchema,
  GetMarginInfoSchema,
} from './types/mcp.js';

// Load environment variables
dotenv.config();

class BitgetMCPServer {
  private server: Server;
  private bitgetClient: BitgetRestClient;

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'bitget-trading',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Bitget client
    const isSandbox = process.env.BITGET_SANDBOX === 'true';
    const config: BitgetConfig = {
      apiKey: process.env.BITGET_API_KEY || '',
      secretKey: process.env.BITGET_SECRET_KEY || '',
      passphrase: process.env.BITGET_PASSPHRASE || '',
      sandbox: isSandbox,
      baseUrl: 'https://api.bitget.com', // Always use production URL, demo is controlled by paptrading header
      wsUrl: isSandbox ? 'wss://wspap.bitget.com/v2/ws/public' : 'wss://ws.bitget.com/v2/ws/public',
    };

    this.bitgetClient = new BitgetRestClient(config);

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Market Data Tools
          {
            name: 'getPrice',
            description: 'Get current price for a trading pair (spot or futures)',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Trading pair symbol (e.g., BTCUSDT for spot, BTCUSDT_UMCBL for futures)' }
              },
              required: ['symbol']
            },
          },
          {
            name: 'getTicker',
            description: 'Get full ticker information for a trading pair',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Trading pair symbol' }
              },
              required: ['symbol']
            },
          },
          {
            name: 'getOrderBook',
            description: 'Get order book (market depth) for a trading pair',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Trading pair symbol' },
                depth: { type: 'number', description: 'Order book depth (default: 20)' }
              },
              required: ['symbol']
            },
          },
          {
            name: 'getCandles',
            description: 'Get historical candlestick/OHLCV data',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Trading pair symbol' },
                interval: { type: 'string', enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'], description: 'Candle interval' },
                limit: { type: 'number', description: 'Number of candles (default: 100)' }
              },
              required: ['symbol', 'interval']
            },
          },
          {
            name: 'getBalance',
            description: 'Get account balance information',
            inputSchema: {
              type: 'object',
              properties: {
                asset: { type: 'string', description: 'Specific asset to query' }
              },
              required: []
            },
          },
          {
            name: 'placeOrder',
            description: 'Place a new buy or sell order',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Trading pair symbol' },
                side: { type: 'string', enum: ['buy', 'sell'], description: 'Order side' },
                type: { type: 'string', enum: ['market', 'limit'], description: 'Order type' },
                quantity: { type: 'string', description: 'Order quantity' },
                price: { type: 'string', description: 'Order price (required for limit orders)' },
                timeInForce: { type: 'string', enum: ['GTC', 'IOC', 'FOK'], description: 'Time in force' },
                clientOrderId: { type: 'string', description: 'Client order ID' },
                reduceOnly: { type: 'boolean', description: 'Reduce only flag for futures' }
              },
              required: ['symbol', 'side', 'type', 'quantity']
            },
          },
          {
            name: 'cancelOrder',
            description: 'Cancel an existing order',
            inputSchema: {
              type: 'object',
              properties: {
                orderId: { type: 'string', description: 'Order ID to cancel' },
                symbol: { type: 'string', description: 'Trading pair symbol' }
              },
              required: ['orderId', 'symbol']
            },
          },
          {
            name: 'getOrders',
            description: 'Get current open orders',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Filter by symbol' },
                status: { type: 'string', enum: ['open', 'filled', 'cancelled'], description: 'Filter by status' }
              },
              required: []
            },
          },
          {
            name: 'getPositions',
            description: 'Get current futures positions',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Filter by symbol' }
              },
              required: []
            },
          },
          {
            name: 'setLeverage',
            description: 'Set leverage for futures trading',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Trading pair symbol' },
                leverage: { type: 'number', minimum: 1, maximum: 125, description: 'Leverage value (1-125)' }
              },
              required: ['symbol', 'leverage']
            },
          },
          {
            name: 'getMarginInfo',
            description: 'Get margin account information',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Filter by symbol' }
              },
              required: []
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Market Data
          case 'getPrice': {
            const { symbol } = GetPriceSchema.parse(args);
            const price = await this.bitgetClient.getPrice(symbol);
            return {
              content: [
                {
                  type: 'text',
                  text: `Current price for ${symbol}: $${price}`,
                },
              ],
            } as CallToolResult;
          }

          case 'getTicker': {
            const { symbol } = GetTickerSchema.parse(args);
            const ticker = await this.bitgetClient.getTicker(symbol);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(ticker, null, 2),
                },
              ],
            } as CallToolResult;
          }

          case 'getOrderBook': {
            const { symbol, depth = 20 } = GetOrderBookSchema.parse(args);
            const orderBook = await this.bitgetClient.getOrderBook(symbol, depth);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(orderBook, null, 2),
                },
              ],
            } as CallToolResult;
          }

          case 'getCandles': {
            const { symbol, interval, limit = 100 } = GetCandlesSchema.parse(args);
            const candles = await this.bitgetClient.getCandles(symbol, interval, limit);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(candles, null, 2),
                },
              ],
            } as CallToolResult;
          }

          // Account
          case 'getBalance': {
            const { asset } = GetBalanceSchema.parse(args);
            const balance = await this.bitgetClient.getBalance(asset);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(balance, null, 2),
                },
              ],
            } as CallToolResult;
          }

          // Trading
          case 'placeOrder': {
            const orderParams = PlaceOrderSchema.parse(args);
            const order = await this.bitgetClient.placeOrder(orderParams);
            return {
              content: [
                {
                  type: 'text',
                  text: `Order placed successfully:\\n${JSON.stringify(order, null, 2)}`,
                },
              ],
            } as CallToolResult;
          }

          case 'cancelOrder': {
            const { orderId, symbol } = CancelOrderSchema.parse(args);
            const success = await this.bitgetClient.cancelOrder(orderId, symbol);
            return {
              content: [
                {
                  type: 'text',
                  text: success ? `Order ${orderId} cancelled successfully` : `Failed to cancel order ${orderId}`,
                },
              ],
            } as CallToolResult;
          }

          case 'getOrders': {
            const { symbol, status } = GetOrdersSchema.parse(args);
            const orders = await this.bitgetClient.getOrders(symbol, status);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(orders, null, 2),
                },
              ],
            } as CallToolResult;
          }

          // Futures
          case 'getPositions': {
            const { symbol } = GetPositionsSchema.parse(args);
            const positions = await this.bitgetClient.getFuturesPositions(symbol);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(positions, null, 2),
                },
              ],
            } as CallToolResult;
          }

          case 'setLeverage': {
            const { symbol, leverage } = SetLeverageSchema.parse(args);
            const success = await this.bitgetClient.setLeverage(symbol, leverage);
            return {
              content: [
                {
                  type: 'text',
                  text: success 
                    ? `Leverage set to ${leverage}x for ${symbol}` 
                    : `Failed to set leverage for ${symbol}`,
                },
              ],
            } as CallToolResult;
          }

          case 'getMarginInfo': {
            const { symbol } = GetMarginInfoSchema.parse(args);
            const marginInfo = await this.bitgetClient.getMarginInfo(symbol);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(marginInfo, null, 2),
                },
              ],
            } as CallToolResult;
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        } as CallToolResult;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bitget Trading MCP Server running on stdio');
  }
}

// Start the server
const server = new BitgetMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});