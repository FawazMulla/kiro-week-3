# API Setup Guide

This guide explains how to obtain and configure API keys for enhanced functionality in the Meme vs Market Dashboard.

## Overview

The dashboard works with public APIs by default, but configuring API keys provides:
- Higher rate limits
- More reliable data access
- Additional features and endpoints
- Better error handling and retry logic

## Yahoo Finance / Alpha Vantage API

### Why Use Alpha Vantage?
- Higher rate limits (500 requests/day free, 5 requests/minute)
- More reliable than public Yahoo Finance endpoints
- Additional technical indicators
- Better historical data access

### Getting Your API Key

1. **Visit Alpha Vantage**: Go to [alphavantage.co](https://www.alphavantage.co/support/#api-key)

2. **Sign Up**: Create a free account with your email address

3. **Get API Key**: After email verification, you'll receive your API key

4. **Configure**: Add to your `.env` file:
   ```env
   VITE_ALPHA_VANTAGE_KEY=your_api_key_here
   ```

### Rate Limits
- **Free Tier**: 500 requests/day, 5 requests/minute
- **Paid Tiers**: Up to 1200 requests/minute

### Supported Endpoints
- Daily stock prices
- Intraday data (1min, 5min, 15min, 30min, 60min)
- Technical indicators
- Forex and cryptocurrency data

## Reddit API

### Why Use Reddit API?
- Higher rate limits (100 requests/minute vs 60 for public)
- Access to more subreddits and posts
- Better search capabilities
- Reduced risk of IP blocking

### Getting Your API Credentials

1. **Reddit Account**: Ensure you have a Reddit account

2. **Create App**: Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)

3. **App Details**:
   - **Name**: "Meme vs Market Dashboard"
   - **App type**: "web app"
   - **Description**: "Dashboard for analyzing meme trends vs stock market"
   - **About URL**: Your dashboard URL
   - **Redirect URI**: `http://localhost:5173` (for development)

4. **Get Credentials**:
   - **Client ID**: Found under your app name (short string)
   - **Client Secret**: Click "edit" to reveal (longer string)

5. **Configure**: Add to your `.env` file:
   ```env
   VITE_REDDIT_CLIENT_ID=your_client_id_here
   VITE_REDDIT_CLIENT_SECRET=your_client_secret_here
   ```

### Rate Limits
- **Public**: 60 requests/minute
- **Authenticated**: 100 requests/minute
- **OAuth**: 600 requests/minute (requires user authentication)

### Supported Features
- Access to private/restricted subreddits
- Higher quality image thumbnails
- More detailed post metadata
- Better search and filtering options

## Environment Configuration

### Development Setup

Create `.env` file in project root:
```env
# Alpha Vantage API (Optional)
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here

# Reddit API (Optional)
VITE_REDDIT_CLIENT_ID=your_reddit_client_id_here
VITE_REDDIT_CLIENT_SECRET=your_reddit_client_secret_here

# API Endpoints (Optional - defaults provided)
VITE_YAHOO_FINANCE_API=https://query1.finance.yahoo.com/v8/finance/chart
VITE_REDDIT_API=https://www.reddit.com
VITE_ALPHA_VANTAGE_API=https://www.alphavantage.co/query

# Debug Mode (Optional)
VITE_DEBUG=false
```

### Production Setup

For production deployments, set environment variables in your hosting platform:

#### Vercel
```bash
vercel env add VITE_ALPHA_VANTAGE_KEY
vercel env add VITE_REDDIT_CLIENT_ID
vercel env add VITE_REDDIT_CLIENT_SECRET
```

#### Netlify
1. Go to Site Settings → Environment Variables
2. Add each variable with its value

#### GitHub Actions
Add to repository secrets:
```yaml
env:
  VITE_ALPHA_VANTAGE_KEY: ${{ secrets.VITE_ALPHA_VANTAGE_KEY }}
  VITE_REDDIT_CLIENT_ID: ${{ secrets.VITE_REDDIT_CLIENT_ID }}
  VITE_REDDIT_CLIENT_SECRET: ${{ secrets.VITE_REDDIT_CLIENT_SECRET }}
```

## API Usage Patterns

### Fallback Strategy

The dashboard implements a fallback strategy:

1. **Primary**: Use configured API keys if available
2. **Fallback**: Use public endpoints if keys are missing
3. **Cache**: Use cached data if APIs are unavailable
4. **Error**: Display user-friendly error messages

### Rate Limit Handling

```javascript
// Automatic retry with exponential backoff
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// Rate limit detection and handling
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  await delay(retryAfter * 1000);
  return retry();
}
```

### Caching Strategy

```javascript
// Cache API responses to minimize requests
const cacheConfig = {
  stockData: 300000,    // 5 minutes
  memeData: 600000,     // 10 minutes
  correlation: 1800000  // 30 minutes
};
```

## Testing API Configuration

### Verify Alpha Vantage
```bash
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NSEI.BSE&apikey=YOUR_API_KEY"
```

Expected response:
```json
{
  "Global Quote": {
    "01. symbol": "NSEI.BSE",
    "02. open": "24500.00",
    "03. high": "24650.00",
    "04. low": "24400.00",
    "05. price": "24580.00",
    "06. volume": "1234567",
    "07. latest trading day": "2024-01-15",
    "08. previous close": "24520.00",
    "09. change": "60.00",
    "10. change percent": "0.24%"
  }
}
```

### Verify Reddit API
```bash
curl -H "User-Agent: MemeVsMarket/1.0" "https://www.reddit.com/r/IndianStreetBets/hot.json?limit=5"
```

Expected response:
```json
{
  "kind": "Listing",
  "data": {
    "children": [
      {
        "kind": "t3",
        "data": {
          "title": "Post title",
          "score": 123,
          "num_comments": 45,
          "created_utc": 1642234567,
          "url": "https://reddit.com/...",
          "subreddit": "IndianStreetBets"
        }
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

#### Invalid API Key
- **Error**: "Invalid API key" or 401 Unauthorized
- **Solution**: Verify key is correct and active
- **Check**: API key hasn't expired or been revoked

#### Rate Limit Exceeded
- **Error**: 429 Too Many Requests
- **Solution**: Wait for rate limit reset or upgrade plan
- **Prevention**: Implement proper caching and request throttling

#### CORS Errors
- **Error**: Cross-origin request blocked
- **Solution**: Use development server or configure CORS proxy
- **Note**: Production deployments typically don't have CORS issues

#### Network Timeouts
- **Error**: Request timeout or network error
- **Solution**: Check internet connection and API status
- **Fallback**: Use cached data or alternative endpoints

### Debug Mode

Enable debug logging to troubleshoot API issues:

```env
VITE_DEBUG=true
```

This will log:
- API request URLs and parameters
- Response status codes and headers
- Cache hit/miss information
- Rate limit status
- Error details and stack traces

### API Status Pages

Monitor API availability:
- **Alpha Vantage**: [status.alphavantage.co](https://status.alphavantage.co)
- **Reddit**: [redditstatus.com](https://www.redditstatus.com)
- **Yahoo Finance**: Check financial news for outages

## Security Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables for all keys
- Rotate keys regularly (quarterly recommended)
- Monitor API usage for anomalies
- Use different keys for development/production

### Request Security
- Always use HTTPS for API requests
- Validate all API responses
- Sanitize data before displaying
- Implement request timeouts
- Log security-relevant events

### Rate Limit Compliance
- Respect API rate limits
- Implement exponential backoff
- Cache responses appropriately
- Monitor usage patterns
- Have fallback strategies

## Cost Optimization

### Free Tier Limits
- **Alpha Vantage**: 500 requests/day (sufficient for most use cases)
- **Reddit**: Unlimited with proper rate limiting

### Usage Optimization
- Cache responses for appropriate durations
- Batch requests when possible
- Use webhooks instead of polling (when available)
- Monitor and optimize request patterns
- Implement smart refresh strategies

### Upgrade Considerations
Consider paid tiers when:
- Exceeding free tier limits regularly
- Need real-time data updates
- Require additional features
- Building commercial applications