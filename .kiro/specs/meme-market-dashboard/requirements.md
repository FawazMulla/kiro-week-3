# Requirements Document

## Introduction

The Meme vs Market Dashboard is a web application that visualizes the correlation between Indian stock market volatility and trending meme popularity on social media platforms. The system fetches real-time and historical data from multiple sources, calculates volatility and popularity metrics, and presents insights through interactive visualizations. This dashboard demonstrates the power of Model Context Protocol (MCP) for handling external data sources and provides an engaging way to explore potential correlations between internet culture and financial markets.

## Glossary

- **Dashboard**: The web application interface displaying visualizations and data panels
- **NIFTY 50**: The National Stock Exchange of India's benchmark stock market index
- **SENSEX**: The Bombay Stock Exchange's benchmark index
- **Volatility**: A statistical measure of price variation over time, calculated from daily price ranges and percentage changes
- **Meme Popularity Score**: A calculated metric combining upvotes, comments, and engagement on social media posts
- **Correlation Coefficient**: A statistical measure (ranging from -1 to +1) indicating the strength and direction of relationship between two variables
- **MCP Server**: A Model Context Protocol server that provides tools for fetching and processing external data
- **API Client**: A software component that communicates with external APIs to retrieve data
- **Time Series Data**: Sequential data points indexed in time order
- **Dual-Axis Chart**: A visualization displaying two different metrics on separate Y-axes sharing the same X-axis

## Requirements

### Requirement 1

**User Story:** As a user, I want to view a correlation chart comparing stock market volatility with meme popularity over time, so that I can identify potential patterns and relationships between the two datasets.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch the last 30 days of NIFTY 50 stock data from Yahoo Finance API
2. WHEN the dashboard loads THEN the system SHALL fetch trending memes from Indian subreddits for the last 30 days
3. WHEN both datasets are retrieved THEN the system SHALL display a dual-axis line chart with dates on the X-axis, volatility percentage on the left Y-axis, and meme popularity score on the right Y-axis
4. WHEN the user hovers over a data point THEN the system SHALL display a tooltip showing the exact values for both metrics at that date
5. WHEN data fetching fails THEN the system SHALL display an error message and provide a retry option

### Requirement 2

**User Story:** As a user, I want to see current stock market information in a dedicated panel, so that I can understand the current market state and recent volatility trends.

#### Acceptance Criteria

1. WHEN the stock panel renders THEN the system SHALL display the current NIFTY 50 index value
2. WHEN the stock panel renders THEN the system SHALL display the daily percentage change with color coding (green for positive, red for negative)
3. WHEN the stock panel renders THEN the system SHALL calculate and display the average volatility over the last 7 days
4. WHEN the stock panel renders THEN the system SHALL display the highest and lowest prices from the current day
5. WHEN the stock panel renders THEN the system SHALL show the current trading volume

### Requirement 3

**User Story:** As a user, I want to see trending memes in a dedicated panel, so that I can understand what content is currently popular and driving engagement.

#### Acceptance Criteria

1. WHEN the meme panel renders THEN the system SHALL display the top 5 trending memes sorted by engagement score
2. WHEN displaying each meme THEN the system SHALL show the post title, score, comment count, and source subreddit
3. WHEN a meme has a thumbnail image THEN the system SHALL display the thumbnail
4. WHEN the user clicks on a meme THEN the system SHALL open the original Reddit post in a new browser tab
5. WHEN the meme panel renders THEN the system SHALL display the total number of memes analyzed

### Requirement 4

**User Story:** As a user, I want to see statistical insights about the correlation between memes and market volatility, so that I can understand the strength and significance of any relationship.

#### Acceptance Criteria

1. WHEN the insights panel renders THEN the system SHALL calculate the Pearson correlation coefficient between volatility and meme popularity
2. WHEN the correlation coefficient is calculated THEN the system SHALL display the coefficient value rounded to 3 decimal places
3. WHEN the correlation coefficient is calculated THEN the system SHALL classify the correlation strength as "Strong", "Moderate", "Weak", or "Very Weak"
4. WHEN the insights panel renders THEN the system SHALL identify and display the date with the highest volatility in the dataset
5. WHEN the insights panel renders THEN the system SHALL identify and display the date with the highest meme popularity in the dataset

### Requirement 5

**User Story:** As a developer, I want to use MCP servers to fetch and process external data, so that the data retrieval logic is modular and can be reused across different contexts.

#### Acceptance Criteria

1. WHEN the MCP stock server receives a fetch request THEN the system SHALL retrieve NIFTY 50 data from Yahoo Finance API
2. WHEN the MCP stock server receives a volatility calculation request THEN the system SHALL compute daily volatility metrics including daily change percentage, day range percentage, and volume spike ratio
3. WHEN the MCP social server receives a fetch request THEN the system SHALL retrieve trending posts from specified Indian subreddits
4. WHEN the MCP social server receives a popularity calculation request THEN the system SHALL aggregate engagement metrics by date and compute popularity scores
5. WHEN an MCP server encounters an API error THEN the system SHALL return a structured error response with error type and message

### Requirement 6

**User Story:** As a user, I want the dashboard to cache data locally, so that I can view previously loaded data quickly without waiting for API calls on every page load.

#### Acceptance Criteria

1. WHEN stock data is successfully fetched THEN the system SHALL store the data in browser local storage with a timestamp
2. WHEN meme data is successfully fetched THEN the system SHALL store the data in browser local storage with a timestamp
3. WHEN the dashboard loads THEN the system SHALL check if cached data exists and is less than 1 hour old
4. WHEN valid cached data exists THEN the system SHALL display the cached data immediately and fetch fresh data in the background
5. WHEN cached data is older than 1 hour THEN the system SHALL discard the cache and fetch fresh data

### Requirement 7

**User Story:** As a user, I want the dashboard to be responsive and work on different screen sizes, so that I can view the data on mobile devices, tablets, and desktops.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 pixels THEN the system SHALL stack the stock and meme panels vertically
2. WHEN the viewport width is 768 pixels or greater THEN the system SHALL display the stock and meme panels side by side
3. WHEN the chart container is resized THEN the system SHALL redraw the chart to fit the new dimensions
4. WHEN viewed on mobile devices THEN the system SHALL ensure all text is readable without horizontal scrolling
5. WHEN viewed on any device THEN the system SHALL maintain proper spacing and padding for touch interactions

### Requirement 8

**User Story:** As a user, I want to see loading indicators while data is being fetched, so that I know the application is working and not frozen.

#### Acceptance Criteria

1. WHEN data fetching begins THEN the system SHALL display a loading spinner in each panel that is waiting for data
2. WHEN data fetching completes successfully THEN the system SHALL remove the loading spinner and display the data
3. WHEN data fetching takes longer than 5 seconds THEN the system SHALL display a message indicating the fetch is still in progress
4. WHEN multiple data sources are being fetched THEN the system SHALL show individual loading states for each panel
5. WHEN all data is loaded THEN the system SHALL remove all loading indicators

### Requirement 9

**User Story:** As a developer, I want to configure API keys and endpoints through environment variables, so that sensitive credentials are not hardcoded and can be easily changed for different environments.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL read API keys from environment variables
2. WHEN an API key is missing THEN the system SHALL log a warning and attempt to use fallback public endpoints where available
3. WHEN API endpoints need to be changed THEN the system SHALL read endpoint URLs from a configuration file
4. WHEN running in development mode THEN the system SHALL use development API keys from the .env file
5. WHEN building for production THEN the system SHALL validate that all required environment variables are set

### Requirement 10

**User Story:** As a user, I want to filter the time range of data displayed, so that I can focus on specific periods of interest.

#### Acceptance Criteria

1. WHEN the dashboard renders THEN the system SHALL provide time range filter options for 7 days, 30 days, and 90 days
2. WHEN the user selects a different time range THEN the system SHALL fetch data for the selected period
3. WHEN the user selects a different time range THEN the system SHALL update all visualizations and panels to reflect the new data
4. WHEN the time range changes THEN the system SHALL recalculate correlation metrics for the new period
5. WHEN fetching data for a new time range THEN the system SHALL display loading indicators until the data is ready
