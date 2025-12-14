# Design Document

## Overview

The Meme vs Market Dashboard is a client-side web application built with vanilla JavaScript, Vite, and Chart.js. The architecture emphasizes modularity through MCP servers for data fetching, a clean separation between data and presentation layers, and efficient caching strategies to minimize API calls. The application fetches stock market data from Yahoo Finance and meme trends from Reddit, calculates correlation metrics, and presents the findings through interactive visualizations.

The system is designed to be lightweight, fast, and deployable as a static site, making it ideal for demonstrating MCP capabilities without requiring a backend server.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Dashboard Application (Vite)            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │  │
│  │  │ Components  │  │  API Clients │  │  Utils  │ │  │
│  │  │  - Chart    │  │  - Stock API │  │  - Corr │ │  │
│  │  │  - Panels   │  │  - Reddit    │  │  - Cache│ │  │
│  │  └─────────────┘  └──────────────┘  └─────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   External APIs                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Yahoo Finance │  │  Reddit API  │  │ Alpha Vantage│  │
│  │  (Stock Data)│  │ (Meme Trends)│  │  (Optional)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ MCP Protocol
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    MCP Servers (Node.js)                 │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  Stock MCP Server    │  │ Social MCP Server    │    │
│  │  - Fetch NIFTY data  │  │ - Fetch Reddit posts │    │
│  │  - Calc volatility   │  │ - Calc popularity    │    │
│  └──────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Vanilla JavaScript with Vite for build tooling
- **Visualization**: Chart.js for dual-axis correlation charts
- **Styling**: Tailwind CSS for responsive design
- **Data Fetching**: Native Fetch API with async/await
- **State Management**: Simple class-based components with local state
- **Caching**: Browser LocalStorage API
- **MCP Servers**: Node.js with @modelcontextprotocol/sdk
- **Testing**: Vitest for unit tests, fast-check for property-based testing

### Design Principles

1. **Modularity**: Each component and API client is self-contained
2. **Separation of Concerns**: Data fetching, processing, and presentation are separate
3. **Progressive Enhancement**: Core functionality works without MCP, enhanced with MCP
4. **Performance**: Aggressive caching and lazy loading
5. **Resilience**: Graceful degradation when APIs fail

## Components and Interfaces

### Frontend Components

#### Dashboard Component
```javascript
class Dashboard {
  constructor(container: HTMLElement)
  async initialize(): Promise<void>
  async loadData(timeRange: number): Promise<void>
  render(): void
  handleError(error: Error): void
}
```

**Responsibilities:**
- Orchestrate all child components
- Manage application state
- Handle time range filtering
- Coordinate data loading

#### CorrelationChart Component
```javascript
class CorrelationChart {
  constructor(canvasId: string)
  update(volatilityData: VolatilityPoint[], popularityData: PopularityPoint[]): void
  destroy(): void
  resize(): void
}
```

**Responsibilities:**
- Render dual-axis line chart using Chart.js
- Handle chart interactions and tooltips
- Respond to window resize events

#### StockPanel Component
```javascript
class StockPanel {
  constructor(containerId: string)
  render(stockData: StockData[], volatilityData: VolatilityPoint[]): void
  formatCurrency(value: number): string
  formatPercentage(value: number): string
}
```

**Responsibilities:**
- Display current NIFTY 50 metrics
- Show volatility statistics
- Format financial data for display

#### MemePanel Component
```javascript
class MemePanel {
  constructor(containerId: string)
  render(memes: MemePost[], popularityData: PopularityPoint[]): void
  formatEngagement(score: number, comments: number): string
}
```

**Responsibilities:**
- Display top trending memes
- Show engagement metrics
- Handle meme click events

#### InsightsPanel Component
```javascript
class InsightsPanel {
  constructor(containerId: string)
  render(correlation: CorrelationResult, volatilityData: VolatilityPoint[], popularityData: PopularityPoint[]): void
  highlightKeyEvents(): void
}
```

**Responsibilities:**
- Display correlation statistics
- Identify and highlight significant events
- Provide interpretation of correlation strength

### API Clients

#### StockAPI Client
```javascript
class StockAPI {
  async fetchNiftyData(days: number): Promise<StockData[]>
  async fetchSensexData(days: number): Promise<StockData[]>
  parseYahooFinanceResponse(response: any): StockData[]
  calculateVolatility(priceData: StockData[]): VolatilityPoint[]
  calculateDailyChange(open: number, close: number): number
  calculateDayRange(high: number, low: number, open: number): number
  calculateVolumeSpike(currentVolume: number, previousVolume: number): number
}
```

**Responsibilities:**
- Fetch stock data from Yahoo Finance
- Parse API responses
- Calculate volatility metrics
- Handle API errors and retries

#### RedditAPI Client
```javascript
class RedditAPI {
  constructor(subreddits: string[])
  async fetchTrendingMemes(timeframe: string, limit: number): Promise<MemePost[]>
  async fetchSubredditPosts(subreddit: string, timeframe: string): Promise<MemePost[]>
  calculateMemePopularity(posts: MemePost[]): PopularityPoint[]
  aggregateByDate(posts: MemePost[]): Map<string, MemeStats>
  calculateEngagementScore(score: number, comments: number): number
}
```

**Responsibilities:**
- Fetch trending posts from Reddit
- Aggregate posts by date
- Calculate popularity scores
- Handle rate limiting

### MCP Servers

#### Stock MCP Server
```javascript
// Tools provided
tools: [
  {
    name: "fetch_nifty_data",
    description: "Fetch NIFTY 50 historical data",
    inputSchema: {
      days: number,
      interval: "1d" | "1h"
    }
  },
  {
    name: "calculate_volatility",
    description: "Calculate volatility metrics from stock data",
    inputSchema: {
      symbol: string,
      data: StockData[]
    }
  }
]
```

#### Social MCP Server
```javascript
// Tools provided
tools: [
  {
    name: "fetch_trending_memes",
    description: "Fetch trending memes from Indian subreddits",
    inputSchema: {
      subreddits: string[],
      timeframe: "day" | "week" | "month",
      limit: number
    }
  },
  {
    name: "calculate_popularity",
    description: "Calculate meme popularity scores",
    inputSchema: {
      posts: MemePost[]
    }
  }
]
```

## Data Models

### StockData
```typescript
interface StockData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### VolatilityPoint
```typescript
interface VolatilityPoint {
  date: Date;
  volatility: number;        // Combined volatility score
  dailyChange: number;       // (close - open) / open * 100
  dayRange: number;          // (high - low) / open * 100
  volumeSpike: number;       // volume / previousVolume * 100
}
```

### MemePost
```typescript
interface MemePost {
  title: string;
  score: number;             // Reddit upvotes
  comments: number;
  created: Date;
  url: string;
  subreddit: string;
  thumbnail: string;
  author: string;
}
```

### PopularityPoint
```typescript
interface PopularityPoint {
  date: Date;
  popularity: number;        // Calculated engagement score
  posts: number;             // Number of posts on this date
  avgScore: number;          // Average score per post
  totalComments: number;
}
```

### CorrelationResult
```typescript
interface CorrelationResult {
  coefficient: number;       // Pearson correlation coefficient (-1 to 1)
  strength: "Strong" | "Moderate" | "Weak" | "Very Weak";
  pValue: number;            // Statistical significance
  sampleSize: number;
}
```

### CacheEntry
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;         // milliseconds
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data fetch completeness
*For any* time range request, when both stock and meme data are successfully fetched, the resulting datasets should have at least one data point and the date ranges should overlap with the requested period.
**Validates: Requirements 1.1, 1.2**

### Property 2: Volatility calculation consistency
*For any* valid stock data array with at least 2 elements, calculating volatility should produce an array of the same length, and each volatility value should be non-negative.
**Validates: Requirements 5.2**

### Property 3: Popularity score monotonicity
*For any* two sets of meme posts where set A has strictly higher engagement (score + comments) than set B on every date, the popularity scores for set A should be greater than or equal to set B for corresponding dates.
**Validates: Requirements 5.4**

### Property 4: Correlation coefficient bounds
*For any* two aligned time series datasets, the calculated Pearson correlation coefficient should always be between -1 and 1 inclusive.
**Validates: Requirements 4.1**

### Property 5: Cache expiration correctness
*For any* cached data entry, if the current time minus the timestamp is greater than the expiration time, the cache should be considered invalid and fresh data should be fetched.
**Validates: Requirements 6.3, 6.5**

### Property 6: Chart data alignment
*For any* volatility and popularity datasets passed to the correlation chart, the chart should render exactly the number of data points equal to the minimum length of the two datasets after date alignment.
**Validates: Requirements 1.3**

### Property 7: Time range filter consistency
*For any* selected time range (7, 30, or 90 days), all fetched data should have dates within the range of (today - timeRange) to today, with no dates outside this window.
**Validates: Requirements 10.2, 10.3**

### Property 8: Error handling preservation
*For any* API call that fails, the system should return an error response without throwing an unhandled exception, and the application state should remain consistent (no partial updates).
**Validates: Requirements 1.5, 5.5**

### Property 9: Responsive layout invariant
*For any* viewport width, all UI panels should be visible and accessible without horizontal scrolling, and the chart should fit within its container bounds.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 10: Loading state completeness
*For any* data fetching operation, a loading indicator should be visible from the moment the fetch begins until either the data is successfully loaded or an error occurs.
**Validates: Requirements 8.1, 8.2, 8.4**

## Error Handling

### Error Categories

1. **Network Errors**: API unavailable, timeout, connection refused
2. **API Errors**: Rate limiting, invalid response, authentication failure
3. **Data Errors**: Invalid format, missing required fields, out-of-range values
4. **Calculation Errors**: Division by zero, insufficient data points
5. **Storage Errors**: LocalStorage quota exceeded, access denied

### Error Handling Strategy

#### Network and API Errors
- Implement exponential backoff retry (3 attempts)
- Display user-friendly error messages
- Fall back to cached data if available
- Provide manual retry button

#### Data Errors
- Validate all API responses against expected schema
- Filter out invalid data points
- Log warnings for partial data issues
- Continue with valid data subset

#### Calculation Errors
- Check preconditions before calculations (e.g., array length > 0)
- Return null or default values for invalid inputs
- Display "Insufficient data" message to user

#### Storage Errors
- Catch and log LocalStorage exceptions
- Degrade gracefully without caching
- Clear old cache entries if quota exceeded

### Error Response Format
```typescript
interface ErrorResponse {
  type: "network" | "api" | "data" | "calculation" | "storage";
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

**Stock API Tests:**
- Test Yahoo Finance response parsing with sample data
- Test volatility calculation with known inputs
- Test error handling for malformed responses
- Test date range filtering

**Reddit API Tests:**
- Test post aggregation by date
- Test popularity score calculation
- Test engagement score formula
- Test subreddit filtering

**Correlation Utility Tests:**
- Test Pearson correlation with known datasets
- Test data alignment by date
- Test correlation strength classification
- Test handling of datasets with different lengths

**Component Tests:**
- Test chart rendering with mock data
- Test panel updates when data changes
- Test responsive behavior at different viewport sizes
- Test loading state transitions

### Property-Based Testing

Property-based tests will verify universal properties across randomly generated inputs using fast-check library:

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check for JavaScript/TypeScript
- Each test tagged with format: `**Feature: meme-market-dashboard, Property {number}: {property_text}**`

**Property Tests:**

1. **Data Fetch Completeness Property Test**
   - Generate random time ranges (1-365 days)
   - Verify fetched data has at least one point
   - Verify dates fall within requested range
   - **Feature: meme-market-dashboard, Property 1: Data fetch completeness**

2. **Volatility Calculation Consistency Property Test**
   - Generate random stock data arrays (length 2-100)
   - Verify output length matches input length
   - Verify all volatility values are non-negative
   - **Feature: meme-market-dashboard, Property 2: Volatility calculation consistency**

3. **Popularity Score Monotonicity Property Test**
   - Generate pairs of meme post arrays with known engagement ordering
   - Verify popularity scores maintain the ordering
   - **Feature: meme-market-dashboard, Property 3: Popularity score monotonicity**

4. **Correlation Coefficient Bounds Property Test**
   - Generate random time series pairs
   - Verify correlation coefficient is always in [-1, 1]
   - **Feature: meme-market-dashboard, Property 4: Correlation coefficient bounds**

5. **Cache Expiration Correctness Property Test**
   - Generate random cache entries with various timestamps
   - Verify expiration logic correctly identifies stale entries
   - **Feature: meme-market-dashboard, Property 5: Cache expiration correctness**

6. **Chart Data Alignment Property Test**
   - Generate random volatility and popularity datasets
   - Verify chart renders correct number of aligned points
   - **Feature: meme-market-dashboard, Property 6: Chart data alignment**

7. **Time Range Filter Consistency Property Test**
   - Generate random time ranges
   - Verify all returned data falls within the range
   - **Feature: meme-market-dashboard, Property 7: Time range filter consistency**

8. **Error Handling Preservation Property Test**
   - Simulate random API failures
   - Verify no unhandled exceptions
   - Verify application state remains consistent
   - **Feature: meme-market-dashboard, Property 8: Error handling preservation**

9. **Responsive Layout Invariant Property Test**
   - Generate random viewport widths (320-2560px)
   - Verify no horizontal scrolling
   - Verify all panels visible
   - **Feature: meme-market-dashboard, Property 9: Responsive layout invariant**

10. **Loading State Completeness Property Test**
    - Simulate random fetch durations
    - Verify loading indicator present during entire fetch
    - Verify loading indicator removed after completion
    - **Feature: meme-market-dashboard, Property 10: Loading state completeness**

### Integration Testing

Integration tests will verify component interactions:
- Test Dashboard orchestration of all components
- Test MCP server communication
- Test end-to-end data flow from API to visualization
- Test cache integration with API clients

### Manual Testing Checklist

- [ ] Verify chart displays correctly on desktop (1920x1080)
- [ ] Verify chart displays correctly on tablet (768x1024)
- [ ] Verify chart displays correctly on mobile (375x667)
- [ ] Test with slow network (throttle to 3G)
- [ ] Test with API failures (block requests)
- [ ] Test with empty cache
- [ ] Test with stale cache
- [ ] Verify all time range filters work
- [ ] Verify meme links open correctly
- [ ] Verify tooltips show correct data

## Performance Considerations

### Optimization Strategies

1. **Caching**: Cache API responses for 1 hour in LocalStorage
2. **Lazy Loading**: Load chart library only when needed
3. **Debouncing**: Debounce window resize events (300ms)
4. **Request Batching**: Fetch multiple subreddits in parallel
5. **Data Pagination**: Limit Reddit posts to top 25 per subreddit
6. **Chart Optimization**: Use Chart.js decimation plugin for large datasets

### Performance Targets

- Initial page load: < 2 seconds
- Time to interactive: < 3 seconds
- Chart render time: < 500ms
- API response time: < 2 seconds (with caching)
- Memory usage: < 50MB

## Security Considerations

1. **API Keys**: Store in environment variables, never commit to repository
2. **CORS**: Use public APIs that support CORS or proxy through MCP servers
3. **Input Validation**: Sanitize all user inputs (time range selection)
4. **XSS Prevention**: Use textContent instead of innerHTML for user-generated content
5. **Rate Limiting**: Implement client-side rate limiting to avoid API bans
6. **HTTPS**: Ensure all API calls use HTTPS

## Deployment

### Build Process
```bash
npm run build  # Vite builds to dist/
```

### Deployment Options
1. **Static Hosting**: Netlify, Vercel, GitHub Pages
2. **CDN**: CloudFlare Pages
3. **Self-hosted**: Any web server (nginx, Apache)

### Environment Variables
```
VITE_ALPHA_VANTAGE_KEY=optional_key
VITE_REDDIT_CLIENT_ID=optional_for_auth
VITE_REDDIT_CLIENT_SECRET=optional_for_auth
```

### MCP Server Deployment
- MCP servers run locally during development
- For production, can be deployed as serverless functions or containerized services
- Communication via stdio or HTTP depending on deployment model

## Future Enhancements

1. **Additional Data Sources**: Twitter API, Google Trends, News sentiment
2. **Advanced Analytics**: Machine learning correlation predictions
3. **Historical Playback**: Animate correlation over time
4. **Export Features**: Download data as CSV, export charts as images
5. **Customization**: User-selectable stocks and subreddits
6. **Real-time Updates**: WebSocket connections for live data
7. **Comparison Mode**: Compare multiple stock indices
8. **Event Annotations**: Mark significant events on timeline
