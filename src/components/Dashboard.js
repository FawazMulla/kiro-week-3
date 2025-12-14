/**
 * Dashboard - Main application controller that orchestrates all components
 * Coordinates data fetching, processing, and rendering across all panels and chart
 */

import { CorrelationChart } from './CorrelationChart.js';
import { StockPanel } from './StockPanel.js';
import { MemePanel } from './MemePanel.js';
import { InsightsPanel } from './InsightsPanel.js';
import { StockAPI } from '../api/StockAPI.js';
import { RedditAPI } from '../api/RedditAPI.js';
import { calculateCorrelation } from '../utils/Correlation.js';
import { Cache } from '../utils/Cache.js';

export class Dashboard {
  /**
   * Create a new Dashboard instance
   * @param {HTMLElement} container - Main container element for the dashboard
   */
  constructor(container) {
    this.container = container;
    this.currentTimeRange = 30; // Default to 30 days
    
    // Initialize API clients
    this.stockAPI = new StockAPI();
    this.redditAPI = new RedditAPI();
    
    // Initialize cache with 1 hour expiration
    this.cache = new Cache(3600000);
    
    // Initialize components (will be created after DOM setup)
    this.chart = null;
    this.stockPanel = null;
    this.memePanel = null;
    this.insightsPanel = null;
    
    // Data storage
    this.stockData = [];
    this.volatilityData = [];
    this.memeData = [];
    this.popularityData = [];
    this.correlationResult = null;
    
    // Loading state
    this.isLoading = false;
    this.loadingErrors = [];
  }

  /**
   * Initialize the dashboard and all child components
   */
  async initialize() {
    try {
      // Create the dashboard HTML structure
      this._createDashboardStructure();
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Initialize all child components
      this._initializeComponents();
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Load initial data with default time range
      await this.loadData(this.currentTimeRange);
      
    } catch (error) {
      this.handleError(error, 'Failed to initialize dashboard');
    }
  }

  /**
   * Load data for the specified time range
   * @param {number} timeRange - Number of days to fetch (7, 30, or 90)
   */
  async loadData(timeRange) {
    if (this.isLoading) {
      console.warn('Data loading already in progress');
      return;
    }

    this.isLoading = true;
    this.loadingErrors = [];
    this.currentTimeRange = timeRange;

    try {
      // Show loading indicators on all components
      this._showAllLoadingStates();

      // Update active time range button
      this._updateTimeRangeButtons(timeRange);

      // Try to load from cache first
      const cachedData = this._loadFromCache(timeRange);
      if (cachedData) {
        console.log('Loading data from cache');
        this._processAndRenderData(cachedData);
        
        // Fetch fresh data in background
        this._fetchFreshDataInBackground(timeRange);
        return;
      }

      // Fetch fresh data
      console.log(`Loading fresh data for ${timeRange} days`);
      const freshData = await this._fetchAllData(timeRange);
      
      // Cache the fresh data
      this._saveToCache(timeRange, freshData);
      
      // Process and render
      this._processAndRenderData(freshData);

    } catch (error) {
      this.handleError(error, `Failed to load data for ${timeRange} days`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch stock and meme data in parallel
   * @private
   * @param {number} timeRange - Number of days to fetch
   * @returns {Promise<{stockData: StockData[], memeData: MemePost[]}>}
   */
  async _fetchAllData(timeRange) {
    // Determine Reddit timeframe based on days
    let redditTimeframe = 'week';
    if (timeRange <= 7) {
      redditTimeframe = 'week';
    } else if (timeRange <= 30) {
      redditTimeframe = 'month';
    } else {
      redditTimeframe = 'month';
    }

    // Fetch data in parallel
    const [stockResult, memeResult] = await Promise.allSettled([
      this.stockAPI.fetchNiftyData(timeRange),
      this.redditAPI.fetchTrendingMemes(redditTimeframe, 25)
    ]);

    // Handle stock data result
    let stockData = [];
    if (stockResult.status === 'fulfilled') {
      stockData = stockResult.value;
    } else {
      this.loadingErrors.push(`Stock data: ${stockResult.reason.message}`);
      console.error('Failed to fetch stock data:', stockResult.reason);
    }

    // Handle meme data result
    let memeData = [];
    if (memeResult.status === 'fulfilled') {
      memeData = memeResult.value;
    } else {
      this.loadingErrors.push(`Meme data: ${memeResult.reason.message}`);
      console.error('Failed to fetch meme data:', memeResult.reason);
    }

    return { stockData, memeData };
  }

  /**
   * Process raw data and render all components
   * @private
   * @param {{stockData: StockData[], memeData: MemePost[]}} data
   */
  _processAndRenderData(data) {
    const { stockData, memeData } = data;

    // Store raw data
    this.stockData = stockData;
    this.memeData = memeData;

    // Calculate derived data
    this.volatilityData = this.stockAPI.calculateVolatility(stockData);
    this.popularityData = this.redditAPI.calculateMemePopularity(memeData);
    this.correlationResult = calculateCorrelation(this.volatilityData, this.popularityData);

    // Render all components
    this._renderAllComponents();

    // Show any loading errors
    if (this.loadingErrors.length > 0) {
      this._showLoadingErrors();
    }
  }

  /**
   * Render all dashboard components with current data
   * @private
   */
  _renderAllComponents() {
    // Render each component individually with error handling
    this._renderComponentSafely('stockPanel', () => {
      if (this.stockPanel) {
        this.stockPanel.render(this.stockData, this.volatilityData);
      }
    });

    this._renderComponentSafely('memePanel', () => {
      if (this.memePanel) {
        this.memePanel.render(this.memeData, this.popularityData);
      }
    });

    this._renderComponentSafely('insightsPanel', () => {
      if (this.insightsPanel) {
        this.insightsPanel.render(this.correlationResult, this.volatilityData, this.popularityData);
      }
    });

    this._renderComponentSafely('chart', () => {
      if (this.chart) {
        this.chart.update(this.volatilityData, this.popularityData);
      }
    });
  }

  /**
   * Render a component safely with error handling
   * @private
   * @param {string} componentName - Name of the component for error reporting
   * @param {Function} renderFunction - Function to execute for rendering
   */
  _renderComponentSafely(componentName, renderFunction) {
    try {
      renderFunction();
    } catch (error) {
      console.error(`Failed to render ${componentName}:`, error);
      // Don't re-throw - continue with other components
    }
  }

  /**
   * Handle time range filter changes
   * @param {number} newTimeRange - New time range in days
   */
  async handleTimeRangeChange(newTimeRange) {
    if (newTimeRange === this.currentTimeRange) {
      return; // No change needed
    }

    await this.loadData(newTimeRange);
  }

  /**
   * Handle errors and display error messages
   * @param {Error} error - Error object
   * @param {string} context - Context description
   */
  handleError(error, context = 'An error occurred') {
    console.error(`${context}:`, error);
    
    // Show error message to user
    this._showErrorMessage(`${context}: ${error.message}`);
    
    // Hide loading indicators
    this._hideAllLoadingStates();
  }

  /**
   * Create the main dashboard HTML structure
   * @private
   */
  _createDashboardStructure() {
    this.container.innerHTML = `
      <div class="min-h-screen bg-slate-900 dark:bg-slate-900 text-slate-100">
        <!-- Header with gradient background -->
        <header class="header-gradient shadow-lg">
          <div class="container-responsive py-6 sm:py-8">
            <div class="text-center sm:text-left">
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
                Meme vs Market Dashboard
              </h1>
              <p class="text-slate-300 text-sm sm:text-base lg:text-lg">
                Correlation between Indian stock market volatility and meme popularity
              </p>
            </div>
          </div>
        </header>

        <!-- Time Range Filter -->
        <div class="container-responsive py-4 sm:py-6">
          <div class="flex justify-center">
            <div class="bg-slate-800 rounded-lg p-1 inline-flex shadow-md" id="time-range-filter" role="tablist" aria-label="Time range selection">
              <button class="time-range-btn" data-range="7" role="tab" aria-selected="false">
                <span class="hidden sm:inline">7 Days</span>
                <span class="sm:hidden">7D</span>
              </button>
              <button class="time-range-btn active" data-range="30" role="tab" aria-selected="true">
                <span class="hidden sm:inline">30 Days</span>
                <span class="sm:hidden">30D</span>
              </button>
              <button class="time-range-btn" data-range="90" role="tab" aria-selected="false">
                <span class="hidden sm:inline">90 Days</span>
                <span class="sm:hidden">90D</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <main class="container-responsive pb-8 sm:pb-12">
          <!-- Error Messages -->
          <div id="error-messages" class="mb-4 sm:mb-6 hidden">
            <div class="error-message">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium">Errors occurred while loading data:</h3>
                  <div class="mt-2 text-sm" id="error-list"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart Section -->
          <div class="mb-6 sm:mb-8">
            <div class="panel">
              <h2 class="panel-header">Correlation Chart</h2>
              <div class="chart-container">
                <canvas id="correlation-chart" style="max-width: 100%; height: 100%;"></canvas>
              </div>
            </div>
          </div>

          <!-- Panels Grid - Responsive layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <!-- Stock Panel -->
            <div id="stock-panel" class="col-span-1"></div>
            
            <!-- Meme Panel -->
            <div id="meme-panel" class="col-span-1"></div>
            
            <!-- Insights Panel - Full width on mobile and tablet, normal on desktop -->
            <div id="insights-panel" class="col-span-1 md:col-span-2 xl:col-span-1"></div>
          </div>
        </main>

        <!-- Footer for better spacing -->
        <footer class="container-responsive py-4 border-t border-slate-700">
          <div class="text-center text-slate-400 text-sm">
            <p>Data sources: Yahoo Finance, Reddit API</p>
          </div>
        </footer>
      </div>
    `;
  }

  /**
   * Initialize all child components
   * @private
   */
  _initializeComponents() {
    try {
      // Initialize correlation chart
      this.chart = new CorrelationChart('correlation-chart');
      
      // Initialize panels
      this.stockPanel = new StockPanel('stock-panel');
      this.memePanel = new MemePanel('meme-panel');
      this.insightsPanel = new InsightsPanel('insights-panel');
    } catch (error) {
      console.error('Failed to initialize components:', error);
      // Continue with null components - they will be checked before use
    }
  }

  /**
   * Set up event listeners for user interactions
   * @private
   */
  _setupEventListeners() {
    // Time range filter buttons
    const timeRangeFilter = document.getElementById('time-range-filter');
    if (timeRangeFilter) {
      timeRangeFilter.addEventListener('click', (event) => {
        if (event.target.classList.contains('time-range-btn')) {
          const newRange = parseInt(event.target.dataset.range);
          this.handleTimeRangeChange(newRange);
        }
      });
    }

    // Window resize handler for chart responsiveness
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.chart) {
          this.chart.resize();
        }
      }, 300);
    });
  }

  /**
   * Show loading states on all components
   * @private
   */
  _showAllLoadingStates() {
    try {
      if (this.chart) {
        this.chart.showLoading('Loading chart data...');
      }
    } catch (error) {
      console.error('Failed to show chart loading state:', error);
    }
    
    try {
      if (this.stockPanel) {
        this.stockPanel.showLoading('Loading stock data...');
      }
    } catch (error) {
      console.error('Failed to show stock panel loading state:', error);
    }
    
    try {
      if (this.memePanel) {
        this.memePanel.showLoading('Loading meme data...');
      }
    } catch (error) {
      console.error('Failed to show meme panel loading state:', error);
    }
    
    try {
      if (this.insightsPanel) {
        this.insightsPanel.showLoading('Calculating insights...');
      }
    } catch (error) {
      console.error('Failed to show insights panel loading state:', error);
    }
  }

  /**
   * Hide loading states on all components
   * @private
   */
  _hideAllLoadingStates() {
    try {
      if (this.chart) {
        this.chart.hideLoading();
      }
    } catch (error) {
      console.error('Failed to hide chart loading state:', error);
    }
    
    try {
      if (this.stockPanel) {
        this.stockPanel.hideLoading();
      }
    } catch (error) {
      console.error('Failed to hide stock panel loading state:', error);
    }
    
    try {
      if (this.memePanel) {
        this.memePanel.hideLoading();
      }
    } catch (error) {
      console.error('Failed to hide meme panel loading state:', error);
    }
    
    try {
      if (this.insightsPanel) {
        this.insightsPanel.hideLoading();
      }
    } catch (error) {
      console.error('Failed to hide insights panel loading state:', error);
    }
  }

  /**
   * Update time range button states
   * @private
   * @param {number} activeRange - Currently active time range
   */
  _updateTimeRangeButtons(activeRange) {
    const buttons = document.querySelectorAll('.time-range-btn');
    buttons.forEach(button => {
      const range = parseInt(button.dataset.range);
      if (range === activeRange) {
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
      }
    });
  }

  /**
   * Load data from cache if available and valid
   * @private
   * @param {number} timeRange - Time range in days
   * @returns {Object|null} Cached data or null
   */
  _loadFromCache(timeRange) {
    try {
      const cacheKey = `dashboard-data-${timeRange}`;
      return this.cache.get(cacheKey);
    } catch (error) {
      console.warn('Failed to load from cache:', error);
      return null;
    }
  }

  /**
   * Save data to cache
   * @private
   * @param {number} timeRange - Time range in days
   * @param {Object} data - Data to cache
   */
  _saveToCache(timeRange, data) {
    try {
      const cacheKey = `dashboard-data-${timeRange}`;
      this.cache.set(cacheKey, data);
    } catch (error) {
      console.warn('Failed to save to cache:', error);
      // Continue without caching - not critical
    }
  }

  /**
   * Fetch fresh data in background and update if different
   * @private
   * @param {number} timeRange - Time range in days
   */
  async _fetchFreshDataInBackground(timeRange) {
    try {
      const freshData = await this._fetchAllData(timeRange);
      
      // Update cache
      this._saveToCache(timeRange, freshData);
      
      // Only re-render if the data is significantly different
      // For now, always update to ensure freshness
      this._processAndRenderData(freshData);
      
    } catch (error) {
      console.warn('Background data fetch failed:', error);
      // Don't show error to user since cached data is already displayed
    }
  }

  /**
   * Show error message to user
   * @private
   * @param {string} message - Error message
   */
  _showErrorMessage(message) {
    const errorContainer = document.getElementById('error-messages');
    const errorList = document.getElementById('error-list');
    
    if (errorContainer && errorList) {
      errorList.innerHTML = `<p>${message}</p>`;
      errorContainer.classList.remove('hidden');
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 10000);
    }
  }

  /**
   * Show loading errors to user
   * @private
   */
  _showLoadingErrors() {
    if (this.loadingErrors.length === 0) return;
    
    const errorContainer = document.getElementById('error-messages');
    const errorList = document.getElementById('error-list');
    
    if (errorContainer && errorList) {
      const errorHtml = this.loadingErrors.map(error => `<p>• ${error}</p>`).join('');
      errorList.innerHTML = errorHtml;
      errorContainer.classList.remove('hidden');
      
      // Auto-hide after 15 seconds for multiple errors
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 15000);
    }
  }

  /**
   * Destroy the dashboard and clean up resources
   */
  destroy() {
    // Clean up components
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Clear data
    this.stockData = [];
    this.volatilityData = [];
    this.memeData = [];
    this.popularityData = [];
    this.correlationResult = null;
  }
}