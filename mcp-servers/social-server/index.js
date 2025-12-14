#!/usr/bin/env node

/**
 * MCP Social Server
 * Provides tools for fetching trending memes from Reddit and calculating popularity metrics
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
 * RedditAPI class - handles Reddit JSON API integration
 */
class RedditAPI {
  constructor() {
    this.baseUrl = 'https://www.reddit.com/r';
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.defaultSubreddits = ['india', 'IndiaSpeaks', 'IndianDankMemes', 'dankinindia', 'IndianMeyMeys'];
  }

  async fetchTrendingMemes(subreddits = this.defaultSubreddits, timeframe = 'day', limit = 25) {
    const allPosts = [];
    
    for (const subreddit of subreddits) {
      try {
        const posts = await this.fetchSubredditPosts(subreddit, timeframe, limit);
        allPosts.push(...posts);
      } catch (error) {
        console.error(`Failed to fetch from r/${subreddit}: ${error.message}`);
        // Continue with other subreddits even if one fails
      }
    }

    // Sort by engagement score and return top posts
    return allPosts
      .sort((a, b) => this.calculateEngagementScore(b.score, b.comments) - this.calculateEngagementScore(a.score, a.comments))
      .slice(0, limit * subreddits.length);
  }

  async fetchSubredditPosts(subreddit, timeframe, limit) {
    const url = `${this.baseUrl}/${subreddit}/top.json?t=${timeframe}&limit=${limit}`;
    
    return this._fetchWithRetry(url, subreddit);
  }

  async _fetchWithRetry(url, subreddit, attempt = 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MemeMarketDashboard/1.0.0 (Educational Research)'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limited by Reddit API`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseRedditResponse(data, subreddit);
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw new Error(`Failed to fetch from r/${subreddit} after ${this.maxRetries} attempts: ${error.message}`);
      }
      
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this._fetchWithRetry(url, subreddit, attempt + 1);
    }
  }

  parseRedditResponse(response, subreddit) {
    if (!response.data || !response.data.children) {
      throw new Error('Invalid Reddit response format');
    }

    const posts = [];
    for (const child of response.data.children) {
      const post = child.data;
      
      // Filter out removed/deleted posts and ads
      if (!post.title || post.removed_by_category || post.is_self === false && !post.url) {
        continue;
      }

      posts.push({
        title: post.title,
        score: post.score || 0,
        comments: post.num_comments || 0,
        created: new Date(post.created_utc * 1000).toISOString(),
        url: `https://reddit.com${post.permalink}`,
        subreddit: subreddit,
        thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
        author: post.author || '[deleted]'
      });
    }

    return posts;
  }

  calculateMemePopularity(posts) {
    if (!posts || posts.length === 0) {
      return [];
    }

    // Group posts by date
    const postsByDate = this.aggregateByDate(posts);
    
    // Calculate popularity for each date
    const popularityData = [];
    for (const [dateStr, stats] of postsByDate.entries()) {
      popularityData.push({
        date: dateStr,
        popularity: stats.avgEngagement,
        posts: stats.postCount,
        avgScore: stats.avgScore,
        totalComments: stats.totalComments
      });
    }

    // Sort by date
    return popularityData.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  aggregateByDate(posts) {
    const dateMap = new Map();

    for (const post of posts) {
      const date = new Date(post.created);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          postCount: 0,
          totalScore: 0,
          totalComments: 0,
          totalEngagement: 0
        });
      }

      const stats = dateMap.get(dateStr);
      const engagement = this.calculateEngagementScore(post.score, post.comments);
      
      stats.postCount++;
      stats.totalScore += post.score;
      stats.totalComments += post.comments;
      stats.totalEngagement += engagement;
    }

    // Calculate averages
    for (const [dateStr, stats] of dateMap.entries()) {
      stats.avgScore = stats.totalScore / stats.postCount;
      stats.avgEngagement = stats.totalEngagement / stats.postCount;
    }

    return dateMap;
  }

  calculateEngagementScore(score, comments) {
    // Engagement score formula: score + (comments * 2)
    // Comments are weighted more heavily as they indicate active engagement
    return Math.max(0, score) + (Math.max(0, comments) * 2);
  }
}

/**
 * Create and configure the MCP server
 */
class SocialMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'social-media-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.redditAPI = new RedditAPI();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'fetch_trending_memes',
            description: 'Fetch trending memes from Indian subreddits',
            inputSchema: {
              type: 'object',
              properties: {
                subreddits: {
                  type: 'array',
                  description: 'List of subreddits to fetch from',
                  items: { type: 'string' },
                  default: ['india', 'IndiaSpeaks', 'IndianDankMemes', 'dankinindia', 'IndianMeyMeys']
                },
                timeframe: {
                  type: 'string',
                  description: 'Time period for trending posts',
                  enum: ['hour', 'day', 'week', 'month', 'year', 'all'],
                  default: 'day'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of posts per subreddit (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 25
                }
              }
            }
          },
          {
            name: 'calculate_popularity',
            description: 'Calculate meme popularity scores from Reddit posts',
            inputSchema: {
              type: 'object',
              properties: {
                posts: {
                  type: 'array',
                  description: 'Array of Reddit posts',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      score: { type: 'number' },
                      comments: { type: 'number' },
                      created: { type: 'string', format: 'date-time' },
                      url: { type: 'string' },
                      subreddit: { type: 'string' },
                      thumbnail: { type: ['string', 'null'] },
                      author: { type: 'string' }
                    },
                    required: ['title', 'score', 'comments', 'created', 'url', 'subreddit', 'author']
                  }
                }
              },
              required: ['posts']
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
          case 'fetch_trending_memes':
            return await this.handleFetchTrendingMemes(args);
          
          case 'calculate_popularity':
            return await this.handleCalculatePopularity(args);
          
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

  async handleFetchTrendingMemes(args) {
    const { 
      subreddits = ['india', 'IndiaSpeaks', 'IndianDankMemes', 'dankinindia', 'IndianMeyMeys'],
      timeframe = 'day',
      limit = 25
    } = args;

    // Validate input
    if (!Array.isArray(subreddits) || subreddits.length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Subreddits must be a non-empty array'
      );
    }

    if (!['hour', 'day', 'week', 'month', 'year', 'all'].includes(timeframe)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Timeframe must be one of: hour, day, week, month, year, all'
      );
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Limit must be a number between 1 and 100'
      );
    }

    console.error(`Fetching trending memes from ${subreddits.length} subreddits (${timeframe}, limit: ${limit})...`);

    try {
      const posts = await this.redditAPI.fetchTrendingMemes(subreddits, timeframe, limit);
      
      console.error(`Successfully fetched ${posts.length} posts`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              subreddits: subreddits,
              timeframe: timeframe,
              limit: limit,
              totalPosts: posts.length,
              posts: posts
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to fetch trending memes: ${error.message}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              subreddits: subreddits,
              timeframe: timeframe,
              limit: limit
            }, null, 2)
          }
        ]
      };
    }
  }

  async handleCalculatePopularity(args) {
    const { posts } = args;

    // Validate input
    if (!Array.isArray(posts)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Posts must be an array of Reddit post objects'
      );
    }

    if (posts.length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least one post is required for popularity calculation'
      );
    }

    console.error(`Calculating popularity for ${posts.length} posts...`);

    try {
      const popularityData = this.redditAPI.calculateMemePopularity(posts);
      
      console.error(`Successfully calculated popularity for ${popularityData.length} dates`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              inputPosts: posts.length,
              outputDates: popularityData.length,
              popularityData: popularityData
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to calculate popularity: ${error.message}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              inputPosts: posts.length
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
      console.error('Social Media MCP Server running on stdio');
    } catch (error) {
      console.error('Error in server run:', error);
      throw error;
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  console.error('Starting Social Media MCP Server...');
  console.error('Process args:', process.argv);
  console.error('Working directory:', process.cwd());
  const server = new SocialMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { SocialMCPServer };