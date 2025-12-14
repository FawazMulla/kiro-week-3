/**
 * StockPanel - Component for displaying stock market information
 * Shows current NIFTY 50 value, daily change, volatility metrics, and trading data
 */

export class StockPanel {
  /**
   * Create a new StockPanel instance
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
  showLoading(message = 'Loading stock data...') {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Container element with id "${this.containerId}" not found - skipping loading state`);
      return;
    }

    this.container.innerHTML = this._renderLoadingState(message);

    // Set timeout to show "Still loading..." message after 5 seconds
    this.longLoadingTimeout = setTimeout(() => {
      if (this.container) {
        this.container.innerHTML = this._renderLoadingState('Still loading...');
      }
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
   * Render the stock panel with data
   * @param {StockData[]} stockData - Array of stock data points
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   */
  render(stockData, volatilityData) {
    this.hideLoading();
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Container element with id "${this.containerId}" not found - skipping render`);
      return;
    }

    // Handle empty data
    if (!stockData || stockData.length === 0) {
      this.container.innerHTML = this._renderEmptyState();
      return;
    }

    // Get current day data (most recent)
    const currentData = stockData[stockData.length - 1];
    
    // Calculate daily change percentage
    const dailyChange = this._calculateDailyChange(currentData.open, currentData.close);
    
    // Calculate 7-day average volatility
    const avgVolatility = this._calculate7DayAvgVolatility(volatilityData);

    // Render panel HTML
    this.container.innerHTML = this._renderPanel(currentData, dailyChange, avgVolatility);
  }

  /**
   * Calculate daily change percentage
   * @private
   * @param {number} open - Opening price
   * @param {number} close - Closing price
   * @returns {number} Daily change percentage
   */
  _calculateDailyChange(open, close) {
    if (open === 0) return 0;
    return ((close - open) / open) * 100;
  }

  /**
   * Calculate 7-day average volatility
   * @private
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   * @returns {number} Average volatility over last 7 days
   */
  _calculate7DayAvgVolatility(volatilityData) {
    if (!volatilityData || volatilityData.length === 0) {
      return 0;
    }

    // Get last 7 days of data (or less if not available)
    const last7Days = volatilityData.slice(-7);
    
    // Calculate average
    const sum = last7Days.reduce((acc, point) => acc + point.volatility, 0);
    return sum / last7Days.length;
  }

  /**
   * Format currency value with Indian Rupee symbol
   * @param {number} value - Currency value to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(value) {
    return `₹${value.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  /**
   * Format percentage value with + or - prefix and color
   * @param {number} value - Percentage value to format
   * @returns {Object} Object with formatted string and color class
   */
  formatPercentage(value) {
    const prefix = value >= 0 ? '+' : '';
    const colorClass = value >= 0 ? 'text-green-400' : 'text-red-400';
    const formatted = `${prefix}${value.toFixed(2)}%`;
    
    return { formatted, colorClass };
  }

  /**
   * Render the panel HTML
   * @private
   * @param {StockData} currentData - Current day stock data
   * @param {number} dailyChange - Daily change percentage
   * @param {number} avgVolatility - 7-day average volatility
   * @returns {string} HTML string
   */
  _renderPanel(currentData, dailyChange, avgVolatility) {
    const changeFormatted = this.formatPercentage(dailyChange);
    const volatilityFormatted = this.formatPercentage(avgVolatility);

    return `
      <div class="panel">
        <h2 class="panel-header">NIFTY 50</h2>
        
        <!-- Current Value -->
        <div class="mb-4 sm:mb-6">
          <div class="metric-value">
            ${this.formatCurrency(currentData.close)}
          </div>
          <div class="text-lg ${changeFormatted.colorClass} mt-1 font-semibold">
            ${changeFormatted.formatted}
          </div>
        </div>

        <!-- 7-Day Average Volatility -->
        <div class="mb-4 sm:mb-6">
          <div class="metric-label">7-Day Avg Volatility</div>
          <div class="text-xl font-semibold ${volatilityFormatted.colorClass} mt-1">
            ${volatilityFormatted.formatted}
          </div>
        </div>

        <!-- Day High/Low/Volume - Responsive grid -->
        <div class="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
          <div class="text-center xs:text-left">
            <div class="metric-label">High</div>
            <div class="text-sm sm:text-base font-semibold text-slate-100 mt-1">
              ${this.formatCurrency(currentData.high)}
            </div>
          </div>
          <div class="text-center xs:text-left">
            <div class="metric-label">Low</div>
            <div class="text-sm sm:text-base font-semibold text-slate-100 mt-1">
              ${this.formatCurrency(currentData.low)}
            </div>
          </div>
          <div class="text-center xs:text-left">
            <div class="metric-label">Volume</div>
            <div class="text-sm sm:text-base font-semibold text-slate-100 mt-1">
              ${this._formatVolume(currentData.volume)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format volume with appropriate suffix (K, M, B)
   * @private
   * @param {number} volume - Volume value
   * @returns {string} Formatted volume string
   */
  _formatVolume(volume) {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(2)}K`;
    }
    return volume.toString();
  }

  /**
   * Render empty state when no data is available
   * @private
   * @returns {string} HTML string for empty state
   */
  _renderEmptyState() {
    return `
      <div class="panel">
        <h2 class="panel-header">NIFTY 50</h2>
        <div class="text-slate-400 text-center py-8">
          No stock data available
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
        <h2 class="panel-header">NIFTY 50</h2>
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
