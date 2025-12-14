/**
 * MemePanel - Component for displaying trending memes
 * Shows top 5 trending memes sorted by engagement score with thumbnails and metadata
 */

export class MemePanel {
  /**
   * Create a new MemePanel instance
   * @param {string} containerId - ID of the container element to render the panel
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.longLoadingTimeout = null;
  }

  /**
   * Show loading state
   * @param {string} message - Optional custom loading message
   */
  showLoading(message = 'Loading meme data...') {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Container element with id "${this.containerId}" not found - skipping loading state`);
      return;
    }

    this.container.innerHTML = this._renderLoadingState(message);

    // Set timeout to show "Still loading..." message after 5 seconds
    this.longLoadingTimeout = setTimeout(() => {
      this.container.innerHTML = this._renderLoadingState('Still loading...');
    }, 5000);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.longLoadingTimeout) {
      clearTimeout(this.longLoadingTimeout);
      this.longLoadingTimeout = null;
    }
  }

  /**
   * Render the meme panel with data
   * @param {MemePost[]} memes - Array of meme posts
   * @param {PopularityPoint[]} popularityData - Array of popularity data points (optional)
   */
  render(memes, popularityData = []) {
    this.hideLoading();
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Container element with id "${this.containerId}" not found - skipping render`);
      return;
    }

    // Handle empty data
    if (!memes || memes.length === 0) {
      this.container.innerHTML = this._renderEmptyState();
      return;
    }

    // Sort memes by engagement score (descending) and take top 5
    const sortedMemes = this._sortByEngagement(memes);
    const topMemes = sortedMemes.slice(0, 5);

    // Render panel HTML
    this.container.innerHTML = this._renderPanel(topMemes, memes.length);
  }

  /**
   * Sort memes by engagement score in descending order
   * @private
   * @param {MemePost[]} memes - Array of meme posts
   * @returns {MemePost[]} Sorted array of meme posts
   */
  _sortByEngagement(memes) {
    return [...memes].sort((a, b) => {
      const engagementA = this._calculateEngagement(a.score, a.comments);
      const engagementB = this._calculateEngagement(b.score, b.comments);
      return engagementB - engagementA;
    });
  }

  /**
   * Calculate engagement score for a meme post
   * @private
   * @param {number} score - Reddit upvotes
   * @param {number} comments - Number of comments
   * @returns {number} Engagement score
   */
  _calculateEngagement(score, comments) {
    return score + (comments * 2);
  }

  /**
   * Format engagement score for display
   * @param {number} score - Reddit upvotes
   * @param {number} comments - Number of comments
   * @returns {string} Formatted engagement string
   */
  formatEngagement(score, comments) {
    const engagement = this._calculateEngagement(score, comments);
    return this._formatNumber(engagement);
  }

  /**
   * Format large numbers with K, M suffixes
   * @private
   * @param {number} num - Number to format
   * @returns {string} Formatted number string
   */
  _formatNumber(num) {
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Handle click on meme to open Reddit post in new tab
   * @private
   * @param {string} url - Reddit post URL
   */
  _handleMemeClick(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Render the panel HTML
   * @private
   * @param {MemePost[]} topMemes - Top 5 meme posts
   * @param {number} totalMemes - Total number of memes analyzed
   * @returns {string} HTML string
   */
  _renderPanel(topMemes, totalMemes) {
    const memesHtml = topMemes.map((meme, index) => this._renderMemeCard(meme, index)).join('');

    return `
      <div class="panel">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 class="panel-header mb-0">Trending Memes</h2>
          <span class="metric-label">${totalMemes} analyzed</span>
        </div>
        
        <div class="space-y-3">
          ${memesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Render a single meme card
   * @private
   * @param {MemePost} meme - Meme post data
   * @param {number} index - Index in the list
   * @returns {string} HTML string for meme card
   */
  _renderMemeCard(meme, index) {
    const engagement = this._calculateEngagement(meme.score, meme.comments);
    const hasThumbnail = meme.thumbnail && 
                         meme.thumbnail !== 'self' && 
                         meme.thumbnail !== 'default' &&
                         meme.thumbnail !== 'nsfw' &&
                         meme.thumbnail.startsWith('http');

    return `
      <div 
        class="bg-slate-700 rounded-lg p-3 sm:p-4 hover:bg-slate-600 transition-all duration-200 cursor-pointer clickable"
        onclick="window.open('${this._escapeHtml(meme.url)}', '_blank', 'noopener,noreferrer')"
        tabindex="0"
        role="button"
        aria-label="Open meme: ${this._escapeHtml(meme.title)}"
        onkeydown="if(event.key==='Enter'||event.key===' '){this.click()}"
      >
        <div class="flex gap-3">
          ${hasThumbnail ? `
            <div class="flex-shrink-0">
              <img 
                src="${this._escapeHtml(meme.thumbnail)}" 
                alt="Meme thumbnail"
                class="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover"
                onerror="this.style.display='none'"
              />
            </div>
          ` : ''}
          
          <div class="flex-1 min-w-0">
            <div class="text-sm sm:text-base font-semibold text-slate-100 mb-2 line-clamp-2 leading-tight">
              ${this._escapeHtml(meme.title)}
            </div>
            
            <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
              <span class="text-blue-400 font-medium">r/${this._escapeHtml(meme.subreddit)}</span>
              <span class="flex items-center gap-1">
                <span class="text-green-400">↑</span>
                ${this._formatNumber(meme.score)}
              </span>
              <span class="flex items-center gap-1">
                <span>💬</span>
                ${this._formatNumber(meme.comments)}
              </span>
              <span class="text-slate-300 font-medium">
                ⚡ ${this._formatNumber(engagement)}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render empty state when no data is available
   * @private
   * @returns {string} HTML string for empty state
   */
  _renderEmptyState() {
    return `
      <div class="panel">
        <h2 class="panel-header">Trending Memes</h2>
        <div class="text-slate-400 text-center py-8">
          No meme data available
        </div>
      </div>
    `;
  }

  /**
   * Render loading state
   * @private
   * @param {string} message - Loading message
   * @returns {string} HTML string for loading state
   */
  _renderLoadingState(message) {
    return `
      <div class="panel">
        <h2 class="panel-header">Trending Memes</h2>
        <div class="flex flex-col items-center justify-center py-8 sm:py-12">
          <div class="loading-spinner mb-4"></div>
          <div class="text-slate-300 text-sm font-medium text-center">
            ${message}
          </div>
        </div>
      </div>
    `;
  }
}
