# Project Structure & Architecture

## Folder Organization

```
src/
├── api/           # External API integrations
├── components/    # UI components and panels
├── config/        # Configuration files (currently empty)
├── test/          # Test utilities and setup
└── utils/         # Shared utility functions
```

## Architecture Patterns

### Component-Based Architecture
- **Dashboard.js**: Main orchestrator component that coordinates all panels and data flow
- **Panel Components**: Self-contained UI components (StockPanel, MemePanel, InsightsPanel)
- **Chart Component**: Dedicated visualization component using Chart.js

### API Layer
- **StockAPI.js**: Yahoo Finance integration for NIFTY 50 data
- **RedditAPI.js**: Reddit JSON API integration for meme data
- Each API class handles its own retry logic, error handling, and data parsing

### Utility Layer
- **Cache.js**: In-memory caching with TTL support
- **Correlation.js**: Statistical correlation calculations
- Utilities are stateless and focused on single responsibilities

## File Naming Conventions

- **Classes**: PascalCase (e.g., `Dashboard.js`, `StockAPI.js`)
- **Test Files**: `*.test.js` for unit tests, `*.property.test.js` for property-based tests
- **Setup Files**: `setup.js` for test configuration
- **Placeholder Files**: `.gitkeep` to maintain empty directory structure

## Code Organization Principles

### Separation of Concerns
- API classes handle only data fetching and parsing
- Components handle only UI rendering and user interaction
- Utils handle only pure computation and caching

### Error Handling Strategy
- API failures are graceful - partial data loading is acceptable
- Components render loading states and error messages
- Dashboard continues operation even if individual components fail

### Responsive Design
- Mobile-first CSS approach using Tailwind breakpoints
- Touch-friendly interaction targets (min 44px)
- Responsive grid layouts that adapt to screen size

### Testing Structure
- Unit tests alongside source files
- Property-based tests for mathematical functions
- Shared test setup in `src/test/setup.js`
- DOM cleanup between tests to prevent interference

## Data Flow

1. **Dashboard** orchestrates all data fetching
2. **API classes** fetch and parse external data
3. **Utils** process raw data into analysis-ready formats
4. **Components** render processed data with loading/error states
5. **Cache** optimizes subsequent requests