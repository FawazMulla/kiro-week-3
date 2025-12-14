#!/usr/bin/env node

/**
 * MCP Stock Server
 * Provides tools for fetching NIFTY 50 stock data and calculating volatility metrics
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * StockAPI class - handles Yahoo Finance integration
 */
class StockAPI {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async fetchNiftyData(days) {
    const symbol = '^NSEI'; // NIFTY 50 symbol
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - (days * 24 * 60 * 60);
    
    const url = `${this.baseUrl}/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    return this._fetchWithRetry(url);
  }

  async _fetchWithRetry(url, attempt = 1) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseYahooFinanceResponse(data);
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw new Error(`Failed to fetch stock data after ${this.maxRetries} attempts: ${error.message}`);
      }
      
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this._fetchWithRetry(url, attempt + 1);
    }
  }

  parseYahooFinanceResponse(response) {
    if (!response.chart || !response.chart.result || response.chart.result.length === 0) {
      throw new Error('Invalid Yahoo Finance response format');
    }

    const result = response.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    if (!timestamps || !quote) {
      throw new Error('Missing required data in Yahoo Finance response');
    }

    const stockData = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] === null || quote.high[i] === null || 
          quote.low[i] === null || quote.close[i] === null || 
          quote.volume[i] === null) {
        continue;
      }

      stockData.push({
        date: new Date(timestamps[i] * 1000).toISOString(),
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i]
      });
    }

    return stockData;
  }

  calculateVolatility(priceData) {
    if (!priceData || priceData.length < 2) {
      return [];
    }

    const volatilityData = [];

    for (let i = 0; i < priceData.length; i++) {
      const current = priceData[i];
      const previous = i > 0 ? priceData[i - 1] : null;

      const dailyChange = this.calculateDailyChange(current.open, current.close);
      const dayRange = this.calculateDayRange(current.high, current.low, current.open);
      const volumeSpike = previous ? this.calculateVolumeSpike(current.volume, previous.volume) : 0;

      const volatility = (Math.abs(dailyChange) * 0.4) + (dayRange * 0.4) + (Math.abs(volumeSpike - 100) * 0.002);

      volatilityData.push({
        date: current.date,
        volatility: volatility,
        dailyChange: dailyChange,
        dayRange: dayRange,
        volumeSpike: volumeSpike
      });
    }

    return volatilityData;
  }

  calculateDailyChange(open, close) {
    if (open === 0) return 0;
    return ((close - open) / open) * 100;
  }

  calculateDayRange(high, low, open) {
    if (open === 0) return 0;
    return ((high - low) / open) * 100;
  }

  calculateVolumeSpike(currentVolume, previousVolume) {
    if (previousVolume === 0) return 100;
    return (currentVolume / previousVolume) * 100;
  }
}

/**
 * Create and configure the MCP server
 */
class StockMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'indian-stock-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.stockAPI = new StockAPI();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'fetch_nifty_data',
            description: 'Fetch NIFTY 50 historical stock data from Yahoo Finance',
            inputSchema: {
              type: 'object',
              properties: {
                days: {
                  type: 'number',
                  description: 'Number of days of historical data to fetch (1-365)',
                  minimum: 1,
                  maximum: 365
                },
                interval: {
                  type: 'string',
                  description: 'Data interval (currently only "1d" supported)',
                  enum: ['1d'],
                  default: '1d'
                }
              },
              required: ['days']
            }
          },
          {
            name: 'calculate_volatility',
            description: 'Calculate volatility metrics from stock data',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: 'Stock symbol (for logging purposes)',
                  default: '^NSEI'
                },
                data: {
                  type: 'array',
                  description: 'Array of stock data points',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date-time' },
                      open: { type: 'number' },
                      high: { type: 'number' },
                      low: { type: 'number' },
                      close: { type: 'number' },
                      volume: { type: 'number' }
                    },
                    required: ['date', 'open', 'high', 'low', 'close', 'volume']
                  }
                }
              },
              required: ['data']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'fetch_nifty_data':
            return await this.handleFetchNiftyData(args);
          
          case 'calculate_volatility':
            return await this.handleCalculateVolatility(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        // Log error for debugging
        console.error(`Error in tool ${name}:`, error);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async handleFetchNiftyData(args) {
    const { days = 30, interval = '1d' } = args;

    // Validate input
    if (typeof days !== 'number' || days < 1 || days > 365) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Days must be a number between 1 and 365'
      );
    }

    if (interval !== '1d') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Only "1d" interval is currently supported'
      );
    }

    console.error(`Fetching NIFTY 50 data for ${days} days...`);

    try {
      const stockData = await this.stockAPI.fetchNiftyData(days);
      
      console.error(`Successfully fetched ${stockData.length} data points`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol: '^NSEI',
              days: days,
              interval: interval,
              dataPoints: stockData.length,
              data: stockData
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to fetch NIFTY data: ${error.message}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              symbol: '^NSEI',
              days: days
            }, null, 2)
          }
        ]
      };
    }
  }

  async handleCalculateVolatility(args) {
    const { symbol = '^NSEI', data } = args;

    // Validate input
    if (!Array.isArray(data)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Data must be an array of stock data points'
      );
    }

    if (data.length < 2) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least 2 data points are required for volatility calculation'
      );
    }

    console.error(`Calculating volatility for ${symbol} with ${data.length} data points...`);

    try {
      // Convert date strings back to Date objects for calculation
      const processedData = data.map(point => ({
        ...point,
        date: new Date(point.date)
      }));

      const volatilityData = this.stockAPI.calculateVolatility(processedData);
      
      // Convert dates back to ISO strings for JSON serialization
      const serializedData = volatilityData.map(point => ({
        ...point,
        date: point.date.toISOString()
      }));

      console.error(`Successfully calculated volatility for ${volatilityData.length} points`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol: symbol,
              inputDataPoints: data.length,
              outputDataPoints: volatilityData.length,
              volatilityData: serializedData
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to calculate volatility: ${error.message}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              symbol: symbol,
              inputDataPoints: data.length
            }, null, 2)
          }
        ]
      };
    }
  }

  setupErrorHandling() {
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async run() {
    try {
      console.error('Creating stdio transport...');
      const transport = new StdioServerTransport();
      console.error('Connecting to transport...');
      await this.server.connect(transport);
      console.error('Indian Stock MCP Server running on stdio');
    } catch (error) {
      console.error('Error in server run:', error);
      throw error;
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  console.error('Starting Indian Stock MCP Server...');
  console.error('Process args:', process.argv);
  console.error('Working directory:', process.cwd());
  const server = new StockMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { StockMCPServer };