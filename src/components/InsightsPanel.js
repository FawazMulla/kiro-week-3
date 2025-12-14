/**
 * InsightsPanel - Component for displaying correlation insights
 * Shows correlation coefficient, strength classification, and key events
 */

export class InsightsPanel {
  /**
   * Create a new InsightsPanel instance
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
  showLoading(message = 'Calculating insights...') {
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
   * Render the insights panel with correlation data
   * @param {CorrelationResult} correlation - Correlation analysis result
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   * @param {PopularityPoint[]} popularityData - Array of popularity data points
   */
  render(correlation, volatilityData, popularityData) {
    this.hideLoading();
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Container element with id "${this.containerId}" not found - skipping render`);
      return;
    }

    // Handle empty data
    if (!correlation || !volatilityData || !popularityData || 
        volatilityData.length === 0 || popularityData.length === 0) {
      this.container.innerHTML = this._renderEmptyState();
      return;
    }

    // Find highest volatility date
    const highestVolatility = this._findHighestVolatility(volatilityData);
    
    // Find highest popularity date
    const highestPopularity = this._findHighestPopularity(popularityData);

    // Render panel HTML
    this.container.innerHTML = this._renderPanel(
      correlation, 
      highestVolatility, 
      highestPopularity
    );
  }

  /**
   * Find the date with highest volatility
   * @private
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   * @returns {{date: Date, value: number}} Highest volatility point
   */
  _findHighestVolatility(volatilityData) {
    if (!volatilityData || volatilityData.length === 0) {
      return null;
    }

    let highest = volatilityData[0];
    for (const point of volatilityData) {
      if (point.volatility > highest.volatility) {
        highest = point;
      }
    }

    return {
      date: highest.date,
      value: highest.volatility
    };
  }

  /**
   * Find the date with highest meme popularity
   * @private
   * @param {PopularityPoint[]} popularityData - Array of popularity data points
   * @returns {{date: Date, value: number}} Highest popularity point
   */
  _findHighestPopularity(popularityData) {
    if (!popularityData || popularityData.length === 0) {
      return null;
    }

    let highest = popularityData[0];
    for (const point of popularityData) {
      if (point.popularity > highest.popularity) {
        highest = point;
      }
    }

    return {
      date: highest.date,
      value: highest.popularity
    };
  }

  /**
   * Get color class based on correlation strength
   * @private
   * @param {string} strength - Correlation strength classification
   * @returns {string} Tailwind color class
   */
  _getStrengthColor(strength) {
    switch (strength) {
      case 'Strong':
        return 'text-green-400';
      case 'Moderate':
        return 'text-yellow-400';
      case 'Weak':
        return 'text-orange-400';
      case 'Very Weak':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  }

  /**
   * Get interpretation text based on correlation coefficient
   * @private
   * @param {number} coefficient - Correlation coefficient
   * @param {string} strength - Correlation strength classification
   * @returns {string} Interpretation text
   */
  _getInterpretation(coefficient, strength) {
    const direction = coefficient >= 0 ? 'positive' : 'negative';
    const absCoeff = Math.abs(coefficient);

    if (strength === 'Strong') {
      if (coefficient >= 0) {
        return 'There is a strong positive relationship between market volatility and meme popularity. When the market becomes more volatile, meme engagement tends to increase significantly.';
      } else {
        return 'There is a strong negative relationship between market volatility and meme popularity. When the market becomes more volatile, meme engagement tends to decrease significantly.';
      }
    } else if (strength === 'Moderate') {
      if (coefficient >= 0) {
        return 'There is a moderate positive relationship between market volatility and meme popularity. Higher market volatility is somewhat associated with increased meme engagement.';
      } else {
        return 'There is a moderate negative relationship between market volatility and meme popularity. Higher market volatility is somewhat associated with decreased meme engagement.';
      }
    } else if (strength === 'Weak') {
      return `There is a weak ${direction} relationship between market volatility and meme popularity. The connection between these metrics is minimal but detectable.`;
    } else {
      return 'There is very little to no relationship between market volatility and meme popularity. These metrics appear to be largely independent of each other.';
    }
  }

  /**
   * Format date for display
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  _formatDate(date) {
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Render the panel HTML
   * @private
   * @param {CorrelationResult} correlation - Correlation analysis result
   * @param {{date: Date, value: number}} highestVolatility - Highest volatility point
   * @param {{date: Date, value: number}} highestPopularity - Highest popularity point
   * @returns {string} HTML string
   */
  _renderPanel(correlation, highestVolatility, highestPopularity) {
    const strengthColor = this._getStrengthColor(correlation.strength);
    const interpretation = this._getInterpretation(correlation.coefficient, correlation.strength);

    return `
      <div class="panel">
        <h2 class="panel-header">Correlation Insights</h2>
        
        <!-- Correlation Coefficient -->
        <div class="mb-4 sm:mb-6">
          <div class="metric-label">Correlation Coefficient</div>
          <div class="metric-value">
            ${correlation.coefficient.toFixed(3)}
          </div>
          <div class="text-lg ${strengthColor} mt-1 font-semibold">
            ${correlation.strength}
          </div>
        </div>

        <!-- Key Events - Responsive grid -->
        <div class="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          ${highestVolatility ? `
            <div class="bg-slate-700 rounded-lg p-3 sm:p-4">
              <div class="metric-label">Highest Volatility</div>
              <div class="text-sm font-semibold text-slate-100 mt-1">
                ${this._formatDate(highestVolatility.date)}
              </div>
              <div class="text-lg text-red-400 mt-1 font-bold">
                ${highestVolatility.value.toFixed(2)}%
              </div>
            </div>
          ` : ''}
          
          ${highestPopularity ? `
            <div class="bg-slate-700 rounded-lg p-3 sm:p-4">
              <div class="metric-label">Highest Meme Popularity</div>
              <div class="text-sm font-semibold text-slate-100 mt-1">
                ${this._formatDate(highestPopularity.date)}
              </div>
              <div class="text-lg text-blue-400 mt-1 font-bold">
                ${highestPopularity.value.toFixed(0)}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Interpretation -->
        <div class="bg-slate-700 rounded-lg p-3 sm:p-4 mb-4">
          <div class="metric-label mb-2">What does this mean?</div>
          <div class="text-sm text-slate-300 leading-relaxed">
            ${interpretation}
          </div>
        </div>

        <!-- Sample Size -->
        <div class="text-xs text-slate-500 text-center">
          Based on ${correlation.sampleSize} data points
        </div>
      </div>
    `;
  }

  /**
   * Render empty state when no data is available
   * @private
   * @returns {string} HTML string for empty state
   */
  _renderEmptyState() {
    return `
      <div class="panel">
        <h2 class="panel-header">Correlation Insights</h2>
        <div class="text-slate-400 text-center py-8">
          No correlation data available
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
        <h2 class="panel-header">Correlation Insights</h2>
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
