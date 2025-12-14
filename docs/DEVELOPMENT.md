# Development Guide

This guide covers setting up the development environment and contributing to the Meme vs Market Dashboard.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with ES2020+ support

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd meme-market-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production and development dependencies including:
- Vite for build tooling
- Vitest for testing
- Tailwind CSS for styling
- Chart.js for visualizations
- fast-check for property-based testing

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your API keys (optional for development):

```env
VITE_DEBUG=true
VITE_ALPHA_VANTAGE_KEY=your_key_here
VITE_REDDIT_CLIENT_ID=your_client_id
VITE_REDDIT_CLIENT_SECRET=your_client_secret
```

### 4. Start Development Server

```bash
npm run dev
```

The dashboard will be available at [http://localhost:5173](http://localhost:5173)

## Development Workflow

### File Structure

```
src/
├── api/              # External API integrations
│   ├── StockAPI.js   # Yahoo Finance/Alpha Vantage
│   └── RedditAPI.js  # Reddit JSON API
├── components/       # UI components
│   ├── Dashboard.js  # Main orchestrator
│   ├── *Panel.js     # Individual panels
│   └── *.js          # Other UI components
├── utils/            # Utility functions
│   ├── Cache.js      # Caching logic
│   ├── Correlation.js # Statistical calculations
│   └── RetryHandler.js # Error handling
├── test/             # Test utilities
└── main.js           # Application entry point
```

### Code Style

#### JavaScript Standards
- Use ES2020+ features (async/await, optional chaining, etc.)
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Implement proper error handling with try/catch

#### Naming Conventions
- **Classes**: PascalCase (`Dashboard`, `StockAPI`)
- **Functions**: camelCase (`fetchData`, `calculateCorrelation`)
- **Constants**: UPPER_SNAKE_CASE (`API_TIMEOUT`, `CACHE_DURATION`)
- **Files**: PascalCase for classes, camelCase for utilities

#### Documentation
- Add JSDoc comments for public APIs
- Include parameter types and return values
- Document complex algorithms and business logic
- Keep comments concise and up-to-date

### Component Development

#### Creating New Components

```javascript
/**
 * Example component structure
 */
class NewComponent {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = { ...this.defaultOptions, ...options };
    this.state = {};
    
    this.init();
  }
  
  get defaultOptions() {
    return {
      // Default configuration
    };
  }
  
  init() {
    this.render();
    this.attachEventListeners();
  }
  
  render() {
    // DOM manipulation
  }
  
  attachEventListeners() {
    // Event handling
  }
  
  update(data) {
    // Update component with new data
  }
  
  destroy() {
    // Cleanup resources
  }
}
```

#### Component Guidelines
- Keep components focused on single responsibility
- Use dependency injection for external services
- Implement proper cleanup in destroy methods
- Handle loading and error states gracefully
- Make components responsive by default

### API Integration

#### Creating API Clients

```javascript
class NewAPI {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://api.example.com';
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 10000;
  }
  
  async fetchData(params) {
    try {
      const response = await this.makeRequest('/endpoint', params);
      return this.parseResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async makeRequest(endpoint, params) {
    const url = new URL(endpoint, this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url, {
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'MemeVsMarket/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  parseResponse(data) {
    // Transform API response to internal format
  }
  
  handleError(error) {
    // Standardize error handling
  }
}
```

#### API Guidelines
- Implement retry logic with exponential backoff
- Use proper HTTP status code handling
- Validate API responses against expected schema
- Cache responses when appropriate
- Handle rate limiting gracefully

## Testing

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Open test UI in browser
npm run test:ui
```

### Test Types

#### Unit Tests
Test individual functions and components:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StockAPI } from '../src/api/StockAPI.js';

describe('StockAPI', () => {
  let api;
  
  beforeEach(() => {
    api = new StockAPI();
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  it('should fetch NIFTY data', async () => {
    const data = await api.fetchNiftyData(7);
    
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('date');
    expect(data[0]).toHaveProperty('close');
  });
});
```

#### Property-Based Tests
Test mathematical properties:

```javascript
import fc from 'fast-check';

describe('Correlation calculations', () => {
  it('correlation coefficient should be between -1 and 1', () => {
    fc.assert(fc.property(
      fc.array(fc.float(), { minLength: 2, maxLength: 100 }),
      fc.array(fc.float(), { minLength: 2, maxLength: 100 }),
      (arr1, arr2) => {
        const minLength = Math.min(arr1.length, arr2.length);
        const x = arr1.slice(0, minLength);
        const y = arr2.slice(0, minLength);
        
        const correlation = calculateCorrelation(x, y);
        
        return correlation >= -1 && correlation <= 1;
      }
    ));
  });
});
```

#### Integration Tests
Test component interactions:

```javascript
describe('Dashboard integration', () => {
  it('should load data and update all panels', async () => {
    const dashboard = new Dashboard('test-container');
    
    await dashboard.loadData(30);
    
    expect(dashboard.stockPanel.hasData()).toBe(true);
    expect(dashboard.memePanel.hasData()).toBe(true);
    expect(dashboard.chart.hasData()).toBe(true);
  });
});
```

### Testing Guidelines
- Write tests before implementing features (TDD)
- Test both happy path and error scenarios
- Use descriptive test names
- Keep tests focused and independent
- Mock external dependencies appropriately

## Debugging

### Browser DevTools

#### Console Debugging
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Log API requests
console.log('Fetching stock data:', { symbol, days });

// Log component state
console.log('Dashboard state:', this.state);
```

#### Network Tab
- Monitor API requests and responses
- Check for CORS errors
- Verify request headers and parameters
- Analyze response times and sizes

#### Performance Tab
- Profile JavaScript execution
- Identify memory leaks
- Analyze rendering performance
- Check for unnecessary re-renders

### Debug Configuration

Enable debug mode in `.env`:
```env
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

This enables:
- Detailed console logging
- API request/response logging
- Component lifecycle logging
- Performance metrics

### Common Issues

#### CORS Errors
```javascript
// Development proxy in vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
};
```

#### Memory Leaks
```javascript
// Proper cleanup in components
destroy() {
  // Remove event listeners
  this.container.removeEventListener('click', this.handleClick);
  
  // Clear timers
  clearInterval(this.refreshTimer);
  
  // Destroy chart instances
  if (this.chart) {
    this.chart.destroy();
  }
}
```

## Performance Optimization

### Bundle Analysis

```bash
npm run build
npx vite-bundle-analyzer dist
```

### Code Splitting

```javascript
// Lazy load heavy components
const ChartComponent = lazy(() => import('./components/Chart.js'));

// Dynamic imports for utilities
const correlation = await import('./utils/Correlation.js');
```

### Caching Strategies

```javascript
// Service Worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Memory caching for API responses
const cache = new Map();
const getCachedData = (key, fetcher, ttl = 300000) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

## Contributing

### Git Workflow

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Commit Messages

Use conventional commit format:
```
type(scope): description

feat(api): add Reddit API integration
fix(chart): resolve tooltip positioning issue
docs(readme): update installation instructions
test(utils): add correlation calculation tests
```

### Pull Request Guidelines

- Include clear description of changes
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Follow code style guidelines
- Keep PRs focused and atomic

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Performance impact is considered
- [ ] Accessibility requirements are met
- [ ] Mobile responsiveness is maintained

## Release Process

### Version Management

```bash
# Update version
npm version patch|minor|major

# Create release notes
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push changes
git push origin main --tags
```

### Build and Deploy

```bash
# Build for production
npm run build

# Test production build
npm run preview

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### Monitoring

After deployment:
- Check error tracking (Sentry)
- Monitor performance metrics
- Verify API functionality
- Test on different devices/browsers
- Monitor user feedback and issues