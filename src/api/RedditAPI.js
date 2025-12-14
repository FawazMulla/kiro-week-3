/**
 * RedditAPI - Handles fetching and processing Reddit meme data
 * Integrates with Reddit JSON API for trending posts
 */

export class RedditAPI {
  constructor(subreddits = ['IndianDankMemes', 'indiameme', 'SaimanSays']) {
    this.subreddits = subreddits;
    this.baseUrl = 'https://www.reddit.com/r';
    this.maxRetries = 3;
    this.retryDelay = 1000; // Initial delay in ms
  }

  /**
   * Fetch trending memes from configured subreddits
   * @param {string} timeframe - Time period ('day', 'week', 'month')
   * @param {number} limit - Maximum number of posts per subreddit
   * @returns {Promise<MemePost[]>} Array of meme posts
   */
  async fetchTrendingMemes(timeframe = 'week', limit = 25) {
    const fetchPromises = this.subreddits.map(subreddit => 
      this.fetchSubredditPosts(subreddit, timeframe, limit)
    );

    try {
      const results = await Promise.allSettled(fetchPromises);
      
      // Combine all successful results
      const allPosts = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);

      return allPosts;
    } catch (error) {
      throw new Error(`Failed to fetch trending memes: ${error.message}`);
    }
  }

  /**
   * Fetch posts from a single subreddit
   * @param {string} subreddit - Subreddit name
   * @param {string} timeframe - Time period ('day', 'week', 'month')
   * @param {number} limit - Maximum number of posts
   * @returns {Promise<MemePost[]>} Array of meme posts
   * @private
   */
  async fetchSubredditPosts(subreddit, timeframe, limit) {
    const url = `${this.baseUrl}/${subreddit}/top.json?t=${timeframe}&limit=${limit}`;
    
    return this._fetchWithRetry(url, subreddit);
  }

  /**
   * Fetch with exponential backoff retry logic
   * @private
   */
  async _fetchWithRetry(url, subreddit, attempt = 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MemeMarketDashboard/1.0'
        }
      });
      
      if (response.status === 429) {
        // Rate limiting
        throw new Error('Rate limited by Reddit API');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseRedditResponse(data, subreddit);
    } catch (error) {
      if (attempt >= this.maxRetries) {
        console.warn(`Failed to fetch from r/${subreddit} after ${this.maxRetries} attempts: ${error.message}`);
        return []; // Return empty array instead of throwing to allow other subreddits to succeed
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this._fetchWithRetry(url, subreddit, attempt + 1);
    }
  }

  /**
   * Parse Reddit API response to MemePost format
   * @param {Object} response - Raw Reddit API response
   * @param {string} subreddit - Subreddit name
   * @returns {MemePost[]} Parsed meme posts array
   */
  parseRedditResponse(response, subreddit) {
    if (!response.data || !response.data.children) {
      throw new Error('Invalid Reddit response format');
    }

    const posts = response.data.children
      .filter(child => child.kind === 't3') // Filter for posts only
      .map(child => {
        const post = child.data;
        
        return {
          title: post.title,
          score: post.score || 0,
          comments: post.num_comments || 0,
          created: new Date(post.created_utc * 1000),
          url: `https://www.reddit.com${post.permalink}`,
          subreddit: post.subreddit || subreddit,
          thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : '',
          author: post.author || '[deleted]'
        };
      });

    return posts;
  }

  /**
   * Calculate meme popularity scores aggregated by date
   * @param {MemePost[]} posts - Array of meme posts
   * @returns {PopularityPoint[]} Array of popularity points by date
   */
  calculateMemePopularity(posts) {
    if (!posts || posts.length === 0) {
      return [];
    }

    // Aggregate posts by date
    const dateMap = this.aggregateByDate(posts);

    // Convert to PopularityPoint array
    const popularityData = [];
    for (const [dateStr, stats] of dateMap.entries()) {
      const avgScore = stats.totalScore / stats.posts.length;
      const engagementScore = this.calculateEngagementScore(stats.totalScore, stats.totalComments);

      popularityData.push({
        date: new Date(dateStr),
        popularity: engagementScore,
        posts: stats.posts.length,
        avgScore: avgScore,
        totalComments: stats.totalComments
      });
    }

    // Sort by date
    popularityData.sort((a, b) => a.date - b.date);

    return popularityData;
  }

  /**
   * Aggregate posts by date
   * @param {MemePost[]} posts - Array of meme posts
   * @returns {Map<string, MemeStats>} Map of date string to aggregated stats
   */
  aggregateByDate(posts) {
    const dateMap = new Map();

    for (const post of posts) {
      // Get date string (YYYY-MM-DD)
      const dateStr = post.created.toISOString().split('T')[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          posts: [],
          totalScore: 0,
          totalComments: 0
        });
      }

      const stats = dateMap.get(dateStr);
      stats.posts.push(post);
      stats.totalScore += post.score;
      stats.totalComments += post.comments;
    }

    return dateMap;
  }

  /**
   * Calculate engagement score for meme popularity
   * Formula: score + (comments * 2)
   * @param {number} score - Total upvote score
   * @param {number} comments - Total comment count
   * @returns {number} Engagement score
   */
  calculateEngagementScore(score, comments) {
    return score + (comments * 2);
  }
}
