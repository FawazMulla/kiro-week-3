# Social Media MCP Server

A Model Context Protocol (MCP) server that provides tools for fetching trending memes from Reddit and calculating popularity metrics for social media analysis.

## Features

- **Fetch Trending Memes**: Retrieve trending posts from Indian subreddits
- **Calculate Popularity**: Aggregate engagement metrics and calculate popularity scores
- **Multi-subreddit Support**: Fetch from multiple subreddits simultaneously
- **Flexible Timeframes**: Support for hour, day, week, month, year, and all-time periods
- **Error Handling**: Robust retry logic and graceful error handling
- **Rate Limiting**: Respectful API usage with exponential backoff

## Installation

```bash
cd mcp-servers/social-server
npm install
```

## Usage

### As MCP Server

The server runs on stdio transport and can be used with MCP-compatible clients:

```bash
node index.js
```

### Available Tools

#### 1. fetch_trending_memes

Fetches trending memes from specified Indian subreddits.

**Parameters:**
- `subreddits` (array, optional): List of subreddit names (default: ['india', 'IndiaSpeaks', 'IndianDankMemes', 'dankinindia', 'IndianMeyMeys'])
- `timeframe` (string, optional): Time period - 'hour', 'day', 'week', 'month', 'year', 'all' (default: 'day')
- `limit` (number, optional): Maximum posts per subreddit, 1-100 (default: 25)

**Returns:**
```json
{
  "success": true,
  "subreddits": ["india", "IndianDankMemes"],
  "timeframe": "day",
  "limit": 25,
  "totalPosts": 50,
  "posts": [
    {
      "title": "Post title",
      "score": 1234,
      "comments": 56,
      "created": "2023-12-14T10:30:00.000Z",
      "url": "https://reddit.com/r/india/comments/...",
      "subreddit": "india",
      "thumbnail": "https://...",
      "author": "username"
    }
  ]
}
```

#### 2. calculate_popularity

Calculates popularity metrics from Reddit posts data.

**Parameters:**
- `posts` (array, required): Array of Reddit post objects

**Returns:**
```json
{
  "success": true,
  "inputPosts": 100,
  "outputDates": 7,
  "popularityData": [
    {
      "date": "2023-12-14",
      "popularity": 1250.5,
      "posts": 15,
      "avgScore": 85.2,
      "totalComments": 234
    }
  ]
}
```

## Data Models

### MemePost
```typescript
interface MemePost {
  title: string;
  score: number;
  comments: number;
  created: string; // ISO date string
  url: string;
  subreddit: string;
  thumbnail: string | null;
  author: string;
}
```

### PopularityPoint
```typescript
interface PopularityPoint {
  date: string; // YYYY-MM-DD format
  popularity: number; // Calculated engagement score
  posts: number; // Number of posts on this date
  avgScore: number; // Average score per post
  totalComments: number;
}
```

## Engagement Score Calculation

The popularity score is calculated using the formula:
```
engagement_score = score + (comments * 2)
```

Comments are weighted more heavily as they indicate active user engagement beyond simple upvoting.

## Error Handling

The server implements comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff (up to 3 attempts)
- **Rate Limiting**: Graceful handling of Reddit API rate limits
- **Invalid Data**: Filtering of removed/deleted posts and malformed data
- **Partial Failures**: Continues processing other subreddits if one fails

## Rate Limiting

The server respects Reddit's API guidelines:
- Uses appropriate User-Agent header
- Implements exponential backoff on failures
- Processes subreddits sequentially to avoid overwhelming the API

## Configuration

Default subreddits focus on Indian content:
- `india` - Main India subreddit
- `IndiaSpeaks` - Alternative India discussion
- `IndianDankMemes` - Indian meme content
- `dankinindia` - More Indian memes
- `IndianMeyMeys` - Indian meme variations

## Development

### Testing the Server

You can test the server manually using the MCP protocol or by importing the classes:

```javascript
import { SocialMCPServer } from './index.js';

const server = new SocialMCPServer();
// Test server functionality
```

### Logging

The server logs to stderr for debugging:
- Fetch operations and results
- Error messages and retry attempts
- Success/failure summaries

## License

ISC License - See package.json for details.