/**
 * StockAPI - Handles fetching and processing stock market data
 * Integrates with Yahoo Finance API for NIFTY 50 data
 */

export class StockAPI {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.maxRetries = 3;
    this.retryDelay = 1000; // Initial delay in ms
  }

  /**
   * Fetch NIFTY 50 historical data
   * @param {number} days - Number of days of historical data to fetch
   * @returns {Promise<StockData[]>} Array of stock data points
   */
  async fetchNiftyData(days) {
    const symbol = '^NSEI'; // NIFTY 50 symbol
    const period2 = Math.floor(Date.now() / 1000); // Current timestamp
    const period1 = period2 - (days * 24 * 60 * 60); // days ago
    
    const url = `${this.baseUrl}/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    return this._fetchWithRetry(url);
  }

  /**
   * Fetch with exponential backoff retry logic
   * @private
   */
  async _fetchWithRetry(url, attempt = 1) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseYahooFinanceResponse(data);
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw new Error(`Failed to fetch stock data after ${this.maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this._fetchWithRetry(url, attempt + 1);
    }
  }

  /**
   * Parse Yahoo Finance API response to StockData format
   * @param {Object} response - Raw Yahoo Finance API response
   * @returns {StockData[]} Parsed stock data array
   */
  parseYahooFinanceResponse(response) {
    if (!response.chart || !response.chart.result || response.chart.result.length === 0) {
      throw new Error('Invalid Yahoo Finance response format');
    }

    const result = response.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    if (!timestamps || !quote) {
      throw new Error('Missing required data in Yahoo Finance response');
    }

    const stockData = [];
    for (let i = 0; i < timestamps.length; i++) {
      // Skip entries with null values
      if (quote.open[i] === null || quote.high[i] === null || 
          quote.low[i] === null || quote.close[i] === null || 
          quote.volume[i] === null) {
        continue;
      }

      stockData.push({
        date: new Date(timestamps[i] * 1000),
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i]
      });
    }

    return stockData;
  }

  /**
   * Calculate volatility metrics from stock data
   * @param {StockData[]} priceData - Array of stock data points
   * @returns {VolatilityPoint[]} Array of volatility points
   */
  calculateVolatility(priceData) {
    if (!priceData || priceData.length < 2) {
      return [];
    }

    const volatilityData = [];

    for (let i = 0; i < priceData.length; i++) {
      const current = priceData[i];
      const previous = i > 0 ? priceData[i - 1] : null;

      const dailyChange = this.calculateDailyChange(current.open, current.close);
      const dayRange = this.calculateDayRange(current.high, current.low, current.open);
      const volumeSpike = previous ? this.calculateVolumeSpike(current.volume, previous.volume) : 0;

      // Combined volatility score: weighted average of the three metrics
      const volatility = (Math.abs(dailyChange) * 0.4) + (dayRange * 0.4) + (Math.abs(volumeSpike - 100) * 0.002);

      volatilityData.push({
        date: current.date,
        volatility: volatility,
        dailyChange: dailyChange,
        dayRange: dayRange,
        volumeSpike: volumeSpike
      });
    }

    return volatilityData;
  }

  /**
   * Calculate daily percentage change
   * @param {number} open - Opening price
   * @param {number} close - Closing price
   * @returns {number} Percentage change
   */
  calculateDailyChange(open, close) {
    if (open === 0) return 0;
    return ((close - open) / open) * 100;
  }

  /**
   * Calculate day range as percentage of opening price
   * @param {number} high - Highest price
   * @param {number} low - Lowest price
   * @param {number} open - Opening price
   * @returns {number} Day range percentage
   */
  calculateDayRange(high, low, open) {
    if (open === 0) return 0;
    return ((high - low) / open) * 100;
  }

  /**
   * Calculate volume spike ratio
   * @param {number} currentVolume - Current day volume
   * @param {number} previousVolume - Previous day volume
   * @returns {number} Volume spike ratio (as percentage)
   */
  calculateVolumeSpike(currentVolume, previousVolume) {
    if (previousVolume === 0) return 100;
    return (currentVolume / previousVolume) * 100;
  }
}
