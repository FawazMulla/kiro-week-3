# Indian Stock MCP Server

A Model Context Protocol (MCP) server that provides tools for fetching Indian stock market data and calculating volatility metrics.

## Features

- **fetch_nifty_data**: Fetch NIFTY 50 historical data from Yahoo Finance API
- **calculate_volatility**: Calculate volatility metrics from stock data including daily change, day range, and volume spike ratios

## Installation

```bash
npm install
```

## Usage

### As MCP Server

The server runs on stdio transport and can be used with any MCP-compatible client:

```bash
node index.js
```

### Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "indian-stock-server": {
      "command": "node",
      "args": ["path/to/mcp-servers/stock-server/index.js"],
      "env": {}
    }
  }
}
```

## Tools

### fetch_nifty_data

Fetches NIFTY 50 historical stock data.

**Parameters:**
- `days` (number, required): Number of days of historical data (1-365)
- `interval` (string, optional): Data interval, currently only "1d" supported

**Returns:**
```json
{
  "success": true,
  "symbol": "^NSEI",
  "days": 30,
  "interval": "1d",
  "dataPoints": 20,
  "data": [
    {
      "date": "2024-01-01T00:00:00.000Z",
      "open": 21725.70,
      "high": 21782.50,
      "low": 21651.90,
      "close": 21731.40,
      "volume": 142500000
    }
  ]
}
```

### calculate_volatility

Calculates volatility metrics from stock data.

**Parameters:**
- `symbol` (string, optional): Stock symbol for logging
- `data` (array, required): Array of stock data points

**Returns:**
```json
{
  "success": true,
  "symbol": "^NSEI",
  "inputDataPoints": 20,
  "outputDataPoints": 20,
  "volatilityData": [
    {
      "date": "2024-01-01T00:00:00.000Z",
      "volatility": 1.25,
      "dailyChange": 0.026,
      "dayRange": 0.602,
      "volumeSpike": 105.2
    }
  ]
}
```

## Error Handling

The server includes comprehensive error handling:
- Exponential backoff retry for API failures
- Input validation for all parameters
- Structured error responses
- Logging for debugging

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- Node.js 18+ (uses built-in fetch API)

## License

ISC