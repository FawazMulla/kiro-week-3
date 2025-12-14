# Meme vs Market Dashboard

A data visualization dashboard that explores correlations between Indian stock market volatility and meme popularity trends. The application fetches real-time data from Yahoo Finance (NIFTY 50) and Reddit's trending memes from Indian subreddits to analyze potential relationships between market sentiment and social media engagement.

![Dashboard Screenshot](docs/dashboard-screenshot.png)

## 🚀 Features

- **Real-time Data Integration**: Fetches NIFTY 50 stock data and trending memes from Indian subreddits
- **Correlation Analysis**: Calculates and visualizes correlations between market volatility and meme popularity
- **Interactive Dashboard**: Responsive panels showing stock metrics, meme trends, and insights
- **Time Range Filtering**: Support for 7, 30, and 90-day analysis periods
- **Caching System**: Optimized data loading with background refresh capabilities
- **MCP Integration**: Modular data fetching through Model Context Protocol servers
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 📊 Dashboard Components

### Stock Panel
- Current NIFTY 50 index value and daily change
- 7-day average volatility metrics
- Daily high, low, and trading volume
- Color-coded performance indicators

### Meme Panel
- Top 5 trending memes by engagement score
- Post titles, scores, comments, and subreddit sources
- Clickable links to original Reddit posts
- Total memes analyzed counter

### Correlation Chart
- Dual-axis line chart showing volatility vs popularity over time
- Interactive tooltips with exact values
- Responsive design that adapts to screen size

### Insights Panel
- Pearson correlation coefficient with statistical significance
- Correlation strength classification (Strong/Moderate/Weak/Very Weak)
- Dates with highest volatility and meme popularity
- Interpretation of correlation meaning

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript with Vite build system
- **Visualization**: Chart.js for interactive charts
- **Styling**: Tailwind CSS for responsive design
- **Testing**: Vitest for unit tests, fast-check for property-based testing
- **Data Sources**: Yahoo Finance API, Reddit JSON API
- **MCP Servers**: Node.js with @modelcontextprotocol/sdk

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern web browser with ES2020+ support
- Internet connection for API data fetching

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd meme-market-dashboard
npm install
```

### 2. Environment Setup (Optional)

Copy the environment template and configure API keys:

```bash
cp .env.example .env
```

Edit `.env` with your API keys (see [API Setup](#-api-setup) section):

```env
# Optional - public endpoints used as fallback
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
VITE_REDDIT_CLIENT_ID=your_reddit_client_id_here
VITE_REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🔑 API Setup

The dashboard works with public APIs by default, but you can configure API keys for enhanced functionality:

### Yahoo Finance API
- **Default**: Uses public Yahoo Finance endpoints
- **Enhanced**: Get Alpha Vantage key from [alphavantage.co](https://www.alphavantage.co/support/#api-key)
- **Setup**: Add `VITE_ALPHA_VANTAGE_KEY` to your `.env` file

### Reddit API
- **Default**: Uses public Reddit JSON endpoints
- **Enhanced**: Create Reddit app at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
- **Setup**: Add `VITE_REDDIT_CLIENT_ID` and `VITE_REDDIT_CLIENT_SECRET` to `.env`

### Rate Limiting
- Yahoo Finance: ~2000 requests/hour (public)
- Reddit: ~60 requests/minute (public), 100 requests/minute (authenticated)

## 🔧 MCP Server Configuration

The dashboard uses Model Context Protocol (MCP) servers for modular data fetching. MCP servers are automatically configured but can be customized:

### Configuration File
Location: `.kiro/settings/mcp.json`

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

### MCP Server Tools

#### Stock Server (`mcp-servers/stock-server/`)
- `fetch_nifty_data`: Retrieves NIFTY 50 historical data
- `calculate_volatility`: Computes volatility metrics from stock data

#### Social Server (`mcp-servers/social-server/`)
- `fetch_trending_memes`: Fetches trending posts from Indian subreddits
- `calculate_popularity`: Aggregates engagement metrics by date

### Starting MCP Servers

MCP servers start automatically with the dashboard. To run manually:

```bash
# Stock server
cd mcp-servers/stock-server
node index.js

# Social server  
cd mcp-servers/social-server
node index.js
```

## 🧪 Testing

### Run All Tests
```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:ui         # Web UI
```

### Test Types

#### Unit Tests
- Component functionality testing
- API client validation
- Utility function verification
- Error handling scenarios

#### Property-Based Tests
- Mathematical property validation
- Data consistency across random inputs
- Correlation coefficient bounds checking
- Cache expiration correctness

### Test Coverage
- **Components**: Dashboard, panels, charts, error boundaries
- **APIs**: Stock data fetching, Reddit integration, MCP communication
- **Utils**: Correlation calculations, caching, retry logic
- **Integration**: End-to-end data flow, responsive behavior

## 📁 Project Structure

```
├── src/
│   ├── api/              # External API integrations
│   │   ├── StockAPI.js   # Yahoo Finance integration
│   │   └── RedditAPI.js  # Reddit JSON API integration
│   ├── components/       # UI components and panels
│   │   ├── Dashboard.js  # Main orchestrator component
│   │   ├── CorrelationChart.js
│   │   ├── StockPanel.js
│   │   ├── MemePanel.js
│   │   ├── InsightsPanel.js
│   │   ├── TimeRangeFilter.js
│   │   ├── LoadingIndicator.js
│   │   ├── ErrorBoundary.js
│   │   └── ToastNotification.js
│   ├── utils/            # Shared utility functions
│   │   ├── Cache.js      # LocalStorage caching
│   │   ├── Correlation.js # Statistical calculations
│   │   └── RetryHandler.js # API retry logic
│   ├── test/             # Test utilities and setup
│   └── main.js           # Application entry point
├── mcp-servers/          # Model Context Protocol servers
│   ├── stock-server/     # NIFTY 50 data server
│   └── social-server/    # Reddit meme data server
├── public/               # Static assets
├── .kiro/
│   ├── settings/         # MCP configuration
│   └── specs/            # Feature specifications
└── docs/                 # Documentation and screenshots
```

## 🚀 Deployment

### Static Hosting (Recommended)

The dashboard is a client-side application that can be deployed to any static hosting service:

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

#### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

### Environment Variables for Production

Set these in your hosting platform:

```env
VITE_ALPHA_VANTAGE_KEY=your_production_key
VITE_REDDIT_CLIENT_ID=your_production_client_id
VITE_REDDIT_CLIENT_SECRET=your_production_secret
```

### Performance Optimization

- **Caching**: 1-hour cache for API responses
- **CDN**: Use CDN for static assets
- **Compression**: Enable gzip/brotli compression
- **Monitoring**: Set up error tracking (Sentry, LogRocket)

## 🔧 Configuration

### Tailwind CSS
Custom configuration in `tailwind.config.js`:
- Dark theme with custom color palette
- Responsive breakpoints (mobile-first)
- Custom utilities for dashboard styling

### Vite Configuration
- ES modules with fast HMR
- PostCSS with Tailwind processing
- Production optimizations

### Test Configuration
- Vitest with jsdom environment
- Property-based testing with fast-check
- Global test setup and cleanup

## 🐛 Troubleshooting

### Common Issues

#### API Rate Limiting
- **Symptom**: "Too Many Requests" errors
- **Solution**: Wait 1 hour or configure API keys for higher limits

#### CORS Errors
- **Symptom**: Cross-origin request blocked
- **Solution**: Use development server (`npm run dev`) or deploy to HTTPS

#### MCP Server Connection
- **Symptom**: "MCP server not responding"
- **Solution**: Check Node.js version (18+) and restart development server

#### Cache Issues
- **Symptom**: Stale data displayed
- **Solution**: Clear browser localStorage or wait for 1-hour cache expiration

### Debug Mode

Enable debug logging:
```bash
# Set environment variable
VITE_DEBUG=true npm run dev
```

### Performance Issues

If the dashboard is slow:
1. Check network throttling in browser dev tools
2. Verify API response times in Network tab
3. Clear browser cache and localStorage
4. Reduce time range to 7 days for faster loading

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use ES2020+ features
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new functionality
- Ensure responsive design compatibility

### Testing Requirements

- Unit tests for all new components
- Property-based tests for mathematical functions
- Integration tests for API interactions
- Manual testing on mobile devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Yahoo Finance](https://finance.yahoo.com/) for stock market data
- [Reddit](https://www.reddit.com/) for meme trend data
- [Chart.js](https://www.chartjs.org/) for visualization capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling framework
- [Vite](https://vitejs.dev/) for build tooling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@memevsmarket.com

---

**Disclaimer**: This dashboard is for educational and research purposes. Stock market data and meme trends should not be used as the sole basis for investment decisions. Always consult with financial professionals before making investment choices.