# MCP Server Configuration Guide

This guide explains how to configure and use Model Context Protocol (MCP) servers with the Meme vs Market Dashboard.

## Overview

MCP (Model Context Protocol) servers provide modular data fetching capabilities for the dashboard. They handle external API integration, data processing, and error handling in a standardized way.

## Architecture

```
Dashboard (Frontend)
    ↓ HTTP/WebSocket
MCP Client (Kiro)
    ↓ stdio/HTTP
MCP Servers (Node.js)
    ↓ HTTP/API
External APIs (Yahoo Finance, Reddit)
```

## Server Configuration

### Configuration File Location
`.kiro/settings/mcp.json`

### Basic Configuration
```json
{
  "mcpServers": {
    "indian-stock-server": {
      "command": "node",
      "args": ["mcp-servers/stock-server/index.js"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": [
        "fetch_nifty_data",
        "calculate_volatility"
      ]
    },
    "social-media-server": {
      "command": "node",
      "args": ["mcp-servers/social-server/index.js"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": [
        "fetch_trending_memes",
        "calculate_popularity"
      ]
    }
  }
}
```

### Configuration Options

#### Server Definition
- **command**: Executable command (e.g., "node", "python", "deno")
- **args**: Array of arguments passed to the command
- **env**: Environment variables for the server process
- **disabled**: Boolean to enable/disable the server
- **autoApprove**: Array of tool names to auto-approve without user confirmation

#### Environment Variables
- **FASTMCP_LOG_LEVEL**: Logging level (DEBUG, INFO, WARN, ERROR)
- **NODE_ENV**: Environment (development, production)
- **API_TIMEOUT**: Request timeout in milliseconds
- **CACHE_TTL**: Cache time-to-live in seconds

## Stock Server Configuration

### Server Location
`mcp-servers/stock-server/`

### Available Tools

#### fetch_nifty_data
Fetches NIFTY 50 historical stock data.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "days": {
      "type": "number",
      "description": "Number of days of historical data",
      "minimum": 1,
      "maximum": 365,
      "default": 30
    },
    "interval": {
      "type": "string",
      "enum": ["1d", "1h", "5m"],
      "description": "Data interval",
      "default": "1d"
    }
  }
}
```

**Example Usage:**
```javascript
const result = await mcpClient.callTool('indian-stock-server', 'fetch_nifty_data', {
  days: 30,
  interval: '1d'
});
```

#### calculate_volatility
Calculates volatility metrics from stock data.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "symbol": {
      "type": "string",
      "description": "Stock symbol",
      "default": "^NSEI"
    },
    "data": {
      "type": "array",
      "description": "Array of stock data points",
      "items": {
        "type": "object",
        "properties": {
          "date": {"type": "string"},
          "open": {"type": "number"},
          "high": {"type": "number"},
          "low": {"type": "number"},
          "close": {"type": "number"},
          "volume": {"type": "number"}
        }
      }
    }
  }
}
```

### Custom Configuration

#### API Endpoints
```json
{
  "env": {
    "YAHOO_FINANCE_API": "https://query1.finance.yahoo.com/v8/finance/chart",
    "ALPHA_VANTAGE_API": "https://www.alphavantage.co/query",
    "ALPHA_VANTAGE_KEY": "your_api_key_here"
  }
}
```

#### Caching
```json
{
  "env": {
    "CACHE_ENABLED": "true",
    "CACHE_TTL": "300",
    "CACHE_MAX_SIZE": "100"
  }
}
```

#### Rate Limiting
```json
{
  "env": {
    "RATE_LIMIT_REQUESTS": "60",
    "RATE_LIMIT_WINDOW": "60000",
    "RETRY_ATTEMPTS": "3",
    "RETRY_DELAY": "1000"
  }
}
```

## Social Server Configuration

### Server Location
`mcp-servers/social-server/`

### Available Tools

#### fetch_trending_memes
Fetches trending memes from Indian subreddits.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "subreddits": {
      "type": "array",
      "items": {"type": "string"},
      "description": "List of subreddit names",
      "default": ["IndianStreetBets", "indiainvestments", "DalalStreetTalks"]
    },
    "timeframe": {
      "type": "string",
      "enum": ["hour", "day", "week", "month", "year", "all"],
      "description": "Time period for trending posts",
      "default": "day"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of posts per subreddit",
      "minimum": 1,
      "maximum": 100,
      "default": 25
    }
  }
}
```

#### calculate_popularity
Calculates meme popularity scores from post data.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "posts": {
      "type": "array",
      "description": "Array of Reddit post objects",
      "items": {
        "type": "object",
        "properties": {
          "title": {"type": "string"},
          "score": {"type": "number"},
          "num_comments": {"type": "number"},
          "created_utc": {"type": "number"},
          "subreddit": {"type": "string"}
        }
      }
    },
    "aggregation": {
      "type": "string",
      "enum": ["daily", "hourly", "weekly"],
      "description": "Time aggregation method",
      "default": "daily"
    }
  }
}
```

### Custom Configuration

#### Subreddit Lists
```json
{
  "env": {
    "DEFAULT_SUBREDDITS": "IndianStreetBets,indiainvestments,DalalStreetTalks,IndiaInvestments",
    "FINANCE_SUBREDDITS": "IndianStreetBets,DalalStreetTalks",
    "MEME_SUBREDDITS": "IndianDankMemes,indiameme"
  }
}
```

#### Reddit API
```json
{
  "env": {
    "REDDIT_API": "https://www.reddit.com",
    "REDDIT_CLIENT_ID": "your_client_id",
    "REDDIT_CLIENT_SECRET": "your_client_secret",
    "USER_AGENT": "MemeVsMarket/1.0"
  }
}
```

## Development Setup

### Installing Dependencies

Each MCP server has its own dependencies:

```bash
# Stock server
cd mcp-servers/stock-server
npm install

# Social server
cd mcp-servers/social-server
npm install
```

### Running Servers Manually

For development and testing:

```bash
# Stock server
cd mcp-servers/stock-server
node index.js

# Social server
cd mcp-servers/social-server
node index.js
```

### Debug Mode

Enable debug logging:

```json
{
  "env": {
    "FASTMCP_LOG_LEVEL": "DEBUG",
    "NODE_ENV": "development"
  }
}
```

## Production Configuration

### Process Management

#### PM2 Configuration
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'stock-server',
      script: 'mcp-servers/stock-server/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        FASTMCP_LOG_LEVEL: 'ERROR'
      }
    },
    {
      name: 'social-server',
      script: 'mcp-servers/social-server/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        FASTMCP_LOG_LEVEL: 'ERROR'
      }
    }
  ]
};
```

#### Docker Configuration
Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  stock-server:
    build: ./mcp-servers/stock-server
    environment:
      - NODE_ENV=production
      - FASTMCP_LOG_LEVEL=ERROR
    restart: unless-stopped
    
  social-server:
    build: ./mcp-servers/social-server
    environment:
      - NODE_ENV=production
      - FASTMCP_LOG_LEVEL=ERROR
    restart: unless-stopped
```

### Load Balancing

For high-traffic scenarios:

```json
{
  "mcpServers": {
    "stock-server-1": {
      "command": "node",
      "args": ["mcp-servers/stock-server/index.js"],
      "env": {"PORT": "3001"}
    },
    "stock-server-2": {
      "command": "node",
      "args": ["mcp-servers/stock-server/index.js"],
      "env": {"PORT": "3002"}
    }
  }
}
```

## Monitoring and Logging

### Health Checks

Each server provides health check endpoints:

```bash
# Check server status
curl http://localhost:3000/health

# Expected response
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  },
  "tools": ["fetch_nifty_data", "calculate_volatility"]
}
```

### Logging Configuration

```json
{
  "env": {
    "LOG_LEVEL": "info",
    "LOG_FORMAT": "json",
    "LOG_FILE": "/var/log/mcp-server.log",
    "LOG_ROTATION": "daily"
  }
}
```

### Metrics Collection

Enable metrics for monitoring:

```json
{
  "env": {
    "METRICS_ENABLED": "true",
    "METRICS_PORT": "9090",
    "METRICS_PATH": "/metrics"
  }
}
```

## Security Configuration

### Authentication

For production deployments:

```json
{
  "env": {
    "AUTH_ENABLED": "true",
    "AUTH_TOKEN": "your_secure_token_here",
    "ALLOWED_ORIGINS": "https://your-dashboard.com"
  }
}
```

### Rate Limiting

Protect against abuse:

```json
{
  "env": {
    "RATE_LIMIT_ENABLED": "true",
    "RATE_LIMIT_WINDOW": "900000",
    "RATE_LIMIT_MAX": "100",
    "RATE_LIMIT_SKIP_SUCCESSFUL": "false"
  }
}
```

### Input Validation

Enable strict validation:

```json
{
  "env": {
    "VALIDATE_INPUT": "true",
    "SANITIZE_OUTPUT": "true",
    "MAX_REQUEST_SIZE": "1048576"
  }
}
```

## Troubleshooting

### Common Issues

#### Server Won't Start
- Check Node.js version (18+ required)
- Verify file permissions
- Check port availability
- Review error logs

#### Connection Refused
- Verify server is running
- Check firewall settings
- Confirm correct port configuration
- Test with curl/telnet

#### Tool Not Found
- Verify tool name spelling
- Check server registration
- Review autoApprove settings
- Restart MCP client

#### Performance Issues
- Monitor memory usage
- Check API rate limits
- Review caching configuration
- Analyze request patterns

### Debug Commands

```bash
# Test server connectivity
curl -X POST http://localhost:3000/tools \
  -H "Content-Type: application/json" \
  -d '{"name": "fetch_nifty_data", "arguments": {"days": 7}}'

# Check server logs
tail -f /var/log/mcp-server.log

# Monitor resource usage
top -p $(pgrep -f "mcp-server")

# Test tool execution
node -e "
const server = require('./mcp-servers/stock-server/index.js');
server.callTool('fetch_nifty_data', {days: 7})
  .then(console.log)
  .catch(console.error);
"
```

## Advanced Configuration

### Custom Tools

Add custom tools to existing servers:

```javascript
// In mcp-servers/stock-server/index.js
server.addTool({
  name: 'fetch_sector_data',
  description: 'Fetch sector-wise stock data',
  inputSchema: {
    type: 'object',
    properties: {
      sector: {type: 'string'},
      days: {type: 'number', default: 30}
    }
  },
  handler: async (args) => {
    // Implementation
  }
});
```

### Plugin System

Create reusable plugins:

```javascript
// plugins/cache-plugin.js
module.exports = {
  name: 'cache',
  init: (server, options) => {
    server.cache = new Cache(options);
  },
  beforeRequest: (request) => {
    // Check cache
  },
  afterResponse: (response) => {
    // Store in cache
  }
};
```

### Multi-Environment Setup

```json
{
  "mcpServers": {
    "stock-server-dev": {
      "command": "node",
      "args": ["mcp-servers/stock-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "API_BASE_URL": "https://api-dev.example.com"
      },
      "disabled": false
    },
    "stock-server-prod": {
      "command": "node",
      "args": ["mcp-servers/stock-server/index.js"],
      "env": {
        "NODE_ENV": "production",
        "API_BASE_URL": "https://api.example.com"
      },
      "disabled": true
    }
  }
}
```