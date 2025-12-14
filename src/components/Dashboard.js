/**
 * Dashboard - Main application controller that orchestrates all components
 * Coordinates data fetching, processing, and rendering across all panels and chart
 */

import { CorrelationChart } from './CorrelationChart.js';
import { StockPanel } from './StockPanel.js';
import { MemePanel } from './MemePanel.js';
import { InsightsPanel } from './InsightsPanel.js';
import { TimeRangeFilter } from './TimeRangeFilter.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { ToastNotification } from './ToastNotification.js';
import { StockAPI } from '../api/StockAPI.js';
import { RedditAPI } from '../api/RedditAPI.js';
import { calculateCorrelation } from '../utils/Correlation.js';
import { Cache } from '../utils/Cache.js';
import { RetryHandler } from '../utils/RetryHandler.js';

export class Dashboard {
  /**
   * Create a new Dashboard instance
   * @param {HTMLElement} container - Main container element for the dashboard
   */
  constructor(container) {
    this.container = container;
    this.currentTimeRange = 30; // Default to 30 days
    
    // Initialize error handling
    this.errorBoundary = null;
    this.toastNotification = window.toastNotification || new ToastNotification();
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    });
    
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
    this.timeRangeFilter = null;
    
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
      
      // Set up error boundary
      this._setupErrorBoundary();
      
      // Initialize all child components
      this._initializeComponents();
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Load initial data with default time range (with error handling)
      try {
        await this.loadData(this.currentTimeRange);
      } catch (error) {
        console.warn('Initial data load failed, dashboard will continue without data:', error);
        // Show empty state instead of failing completely
        this._renderAllComponents();
      }
      
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
      console.log('Fresh data received:', { 
        stockData: freshData.stockData.length, 
        memeData: freshData.memeData.length 
      });
      
      // Cache the fresh data
      this._saveToCache(timeRange, freshData);
      
      // Process and render
      this._processAndRenderData(freshData);

    } catch (error) {
      console.error(`Data loading failed for ${timeRange} days:`, error);
      this.handleError(error, `Failed to load data for ${timeRange} days`);
      
      // Show empty state instead of leaving loading indicators
      this._processAndRenderData({ stockData: [], memeData: [] });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create mock data for demonstration purposes
   * @private
   * @param {number} timeRange - Number of days to generate
   * @returns {{stockData: StockData[], memeData: MemePost[]}} Mock data
   */
  _createMockData(timeRange) {
    console.log('Creating mock data for demonstration...');
    
    // Create mock stock data
    const stockData = [];
    const basePrice = 24000;
    const now = new Date();
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const variation = (Math.random() - 0.5) * 1000;
      const open = basePrice + variation;
      const close = open + (Math.random() - 0.5) * 200;
      const high = Math.max(open, close) + Math.random() * 100;
      const low = Math.min(open, close) - Math.random() * 100;
      const volume = 1000000 + Math.random() * 2000000;
      
      stockData.push({ date, open, high, low, close, volume });
    }
    
    // Create mock meme data
    const memeData = [];
    const titles = [
      "When you realize it's Monday again 😭",
      "POV: You're trying to explain crypto to your parents",
      "Me after checking my portfolio",
      "That feeling when NIFTY goes brrrr 🚀",
      "Retail investors vs Market makers",
      "When someone asks about my trading strategy",
      "Market crash? What market crash? 📈",
      "Diamond hands vs Paper hands",
      "Me buying the dip for the 10th time",
      "When your stop loss triggers at the bottom",
      "Stonks only go up 📈",
      "Me explaining why I'm still holding",
      "Bull market vs Bear market energy",
      "When you buy high and sell low again",
      "Portfolio diversification be like..."
    ];
    
    const subreddits = ['IndianDankMemes', 'indiameme', 'SaimanSays'];
    
    for (let i = 0; i < 25; i++) {
      const daysAgo = Math.floor(Math.random() * Math.min(timeRange, 7));
      const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      memeData.push({
        title: titles[Math.floor(Math.random() * titles.length)],
        score: Math.floor(Math.random() * 5000) + 100,
        comments: Math.floor(Math.random() * 500) + 10,
        created: date,
        url: `https://reddit.com/r/demo/post${i}`,
        subreddit: subreddits[Math.floor(Math.random() * subreddits.length)],
        thumbnail: '',
        author: `user${i}`
      });
    }
    
    return { stockData, memeData: memeData.sort((a, b) => b.score - a.score) };
  }

  /**
   * Fetch stock and meme data in parallel with network optimizations
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

    // Network performance optimization: Set timeout for slow connections
    const NETWORK_TIMEOUT = 15000; // 15 seconds for slow networks

    // Create timeout wrapper for slow networks
    const withTimeout = (promise, timeout) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout - connection too slow')), timeout)
        )
      ]);
    };

    // Create retry wrappers for API calls with timeout support
    const stockAPIWithRetry = this.retryHandler.createRetryWrapper(
      (days) => withTimeout(this.stockAPI.fetchNiftyData(days), NETWORK_TIMEOUT),
      'Stock data fetch',
      {
        onRetry: (error, attempt, maxAttempts) => {
          const isTimeout = error.message.includes('timeout');
          this.toastNotification.showWarning(
            isTimeout 
              ? `Slow connection detected. Retrying... (${attempt}/${maxAttempts})`
              : `Retrying stock data fetch... (${attempt}/${maxAttempts})`,
            { duration: 3000 }
          );
        },
        onFailure: (error) => {
          const isTimeout = error.message.includes('timeout');
          this.toastNotification.showError(
            isTimeout
              ? 'Connection is too slow. Please try again with a better network.'
              : 'Unable to load stock data. Please check your connection.',
            {
              persistent: false,
              onRetry: () => this.loadData(this.currentTimeRange)
            }
          );
        }
      }
    );

    const redditAPIWithRetry = this.retryHandler.createRetryWrapper(
      (timeframe, limit) => withTimeout(this.redditAPI.fetchTrendingMemes(timeframe, limit), NETWORK_TIMEOUT),
      'Meme data fetch',
      {
        onRetry: (error, attempt, maxAttempts) => {
          const isTimeout = error.message.includes('timeout');
          this.toastNotification.showWarning(
            isTimeout
              ? `Slow connection detected. Retrying... (${attempt}/${maxAttempts})`
              : `Retrying meme data fetch... (${attempt}/${maxAttempts})`,
            { duration: 3000 }
          );
        },
        onFailure: (error) => {
          const isTimeout = error.message.includes('timeout');
          this.toastNotification.showError(
            isTimeout
              ? 'Connection is too slow. Please try again with a better network.'
              : 'Unable to load meme data. Please check your connection.',
            {
              persistent: false,
              onRetry: () => this.loadData(this.currentTimeRange)
            }
          );
        }
      }
    );

    // Track fetch performance for network quality indication
    const fetchStartTime = Date.now();
    
    // Fetch data in parallel with retry logic
    const [stockResult, memeResult] = await Promise.allSettled([
      stockAPIWithRetry(timeRange),
      redditAPIWithRetry(redditTimeframe, 25)
    ]);
    
    // Calculate and log network performance
    const fetchDuration = Date.now() - fetchStartTime;
    this._logNetworkPerformance(fetchDuration, stockResult.status === 'fulfilled', memeResult.status === 'fulfilled');

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

    // If both APIs failed, use mock data for demonstration
    if (stockData.length === 0 && memeData.length === 0) {
      console.warn('Both APIs failed, using mock data for demonstration');
      this.toastNotification.showWarning(
        'Using sample data for demonstration. Real data unavailable.',
        { duration: 5000 }
      );
      this._updateDataSourceInfo('sample');
      return this._createMockData(timeRange);
    }

    // If only one API failed, supplement with partial mock data
    if (stockData.length === 0) {
      console.warn('Stock API failed, using mock stock data');
      const mockData = this._createMockData(timeRange);
      stockData = mockData.stockData;
      this._updateDataSourceInfo('partial');
    }

    if (memeData.length === 0) {
      console.warn('Reddit API failed, using mock meme data');
      const mockData = this._createMockData(timeRange);
      memeData = mockData.memeData;
      this._updateDataSourceInfo('partial');
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
   * Render a component safely with error handling and smooth transitions
   * @private
   * @param {string} componentName - Name of the component for error reporting
   * @param {Function} renderFunction - Function to execute for rendering
   */
  _renderComponentSafely(componentName, renderFunction) {
    try {
      // Add updating class for smooth transitions
      const panelElement = document.getElementById(componentName.replace('Panel', '-panel'));
      if (panelElement) {
        const contentElement = panelElement.querySelector('.panel-content') || panelElement;
        contentElement.classList.add('updating');
        
        // Execute render function
        renderFunction();
        
        // Remove updating class after a short delay
        setTimeout(() => {
          contentElement.classList.remove('updating');
        }, 100);
      } else {
        // Fallback if panel element not found
        renderFunction();
      }
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
    
    // Show toast notification for transient errors
    this.toastNotification.showError(
      this._getUserFriendlyErrorMessage(error, context),
      {
        duration: 8000,
        onRetry: () => {
          // Provide retry functionality based on context
          if (context.includes('data') || context.includes('fetch')) {
            return this.loadData(this.currentTimeRange);
          } else if (context.includes('initialize')) {
            return this.initialize();
          }
        }
      }
    );
    
    // Also show error message in UI for persistent display
    this._showErrorMessage(`${context}: ${this._getUserFriendlyErrorMessage(error, context)}`);
    
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
          <div id="time-range-filter-container"></div>
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
            <p id="data-source-info">Data sources: Yahoo Finance, Reddit API</p>
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
    // Initialize each component individually with error handling
    try {
      this.chart = new CorrelationChart('correlation-chart');
      console.log('✅ CorrelationChart initialized');
    } catch (error) {
      console.error('Failed to initialize CorrelationChart:', error);
      this.chart = null;
    }
    
    try {
      this.stockPanel = new StockPanel('stock-panel');
      console.log('✅ StockPanel initialized');
    } catch (error) {
      console.error('Failed to initialize StockPanel:', error);
      this.stockPanel = null;
    }
    
    try {
      this.memePanel = new MemePanel('meme-panel');
      console.log('✅ MemePanel initialized');
    } catch (error) {
      console.error('Failed to initialize MemePanel:', error);
      this.memePanel = null;
    }
    
    try {
      this.insightsPanel = new InsightsPanel('insights-panel');
      console.log('✅ InsightsPanel initialized');
    } catch (error) {
      console.error('Failed to initialize InsightsPanel:', error);
      this.insightsPanel = null;
    }
    
    try {
      this.timeRangeFilter = new TimeRangeFilter(
        'time-range-filter-container',
        (newTimeRange) => this.handleTimeRangeChange(newTimeRange)
      );
      this.timeRangeFilter.setTimeRange(this.currentTimeRange);
      console.log('✅ TimeRangeFilter initialized');
    } catch (error) {
      console.error('Failed to initialize TimeRangeFilter:', error);
      this.timeRangeFilter = null;
    }
    
    console.log('Component initialization complete');
  }

  /**
   * Set up error boundary for the dashboard
   * @private
   */
  _setupErrorBoundary() {
    this.errorBoundary = new ErrorBoundary(this.container, (error, context) => {
      // Handle rendering errors with toast notifications
      this.toastNotification.showError(
        'A display error occurred. The page will attempt to recover.',
        {
          duration: 5000,
          onRetry: () => {
            this.errorBoundary.retry();
            // Attempt to re-render components
            setTimeout(() => {
              this._renderAllComponents();
            }, 100);
          }
        }
      );
    });

    // Listen for retry events from error boundary
    this.container.addEventListener('errorBoundaryRetry', () => {
      // Attempt to re-initialize components that may have failed
      try {
        this._initializeComponents();
        this._renderAllComponents();
        this.toastNotification.showSuccess('Dashboard recovered successfully');
      } catch (error) {
        console.error('Failed to recover from error boundary retry:', error);
      }
    });
  }

  /**
   * Set up event listeners for user interactions
   * @private
   */
  _setupEventListeners() {
    // Window resize handler for chart responsiveness with 300ms debouncing
    this._debouncedResize = this._debounce(() => {
      if (this.chart) {
        this.chart.resize();
      }
      // Also trigger responsive layout adjustments
      this._handleResponsiveLayout();
    }, 300);
    
    window.addEventListener('resize', this._debouncedResize);
  }

  /**
   * Handle responsive layout adjustments
   * @private
   */
  _handleResponsiveLayout() {
    // Trigger any responsive layout adjustments if needed
    // This can be extended for future responsive features
    const viewportWidth = window.innerWidth;
    
    // Log viewport changes for debugging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Viewport resized to: ${viewportWidth}px`);
    }
  }

  /**
   * Debounce utility function
   * @private
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  _debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
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

    // Also show toast notifications for partial data loading
    if (this.loadingErrors.length > 0) {
      const errorCount = this.loadingErrors.length;
      const hasStockError = this.loadingErrors.some(err => err.includes('Stock'));
      const hasMemeError = this.loadingErrors.some(err => err.includes('Meme'));
      
      if (hasStockError && hasMemeError) {
        this.toastNotification.showWarning(
          'Unable to load both stock and meme data. Showing cached data if available.',
          { duration: 6000 }
        );
      } else if (hasStockError) {
        this.toastNotification.showWarning(
          'Unable to load stock data. Showing meme data only.',
          { duration: 5000 }
        );
      } else if (hasMemeError) {
        this.toastNotification.showWarning(
          'Unable to load meme data. Showing stock data only.',
          { duration: 5000 }
        );
      }
    }
  }

  /**
   * Log network performance for monitoring
   * @private
   * @param {number} duration - Fetch duration in milliseconds
   * @param {boolean} stockSuccess - Whether stock fetch succeeded
   * @param {boolean} memeSuccess - Whether meme fetch succeeded
   */
  _logNetworkPerformance(duration, stockSuccess, memeSuccess) {
    const performance = {
      duration,
      stockSuccess,
      memeSuccess,
      quality: duration < 3000 ? 'fast' : duration < 8000 ? 'moderate' : 'slow'
    };
    
    console.log('Network Performance:', performance);
    
    // Show performance feedback to user for very slow connections
    if (duration > 10000) {
      this.toastNotification.showInfo(
        'Slow network detected. Consider using a faster connection for better experience.',
        { duration: 5000 }
      );
    }
  }

  /**
   * Update data source information in footer
   * @private
   * @param {string} type - Type of data: 'real', 'sample', or 'partial'
   */
  _updateDataSourceInfo(type) {
    const infoElement = document.getElementById('data-source-info');
    if (!infoElement) return;
    
    switch (type) {
      case 'sample':
        infoElement.innerHTML = '⚠️ Using sample data for demonstration (APIs unavailable)';
        infoElement.className = 'text-yellow-400 text-sm';
        break;
      case 'partial':
        infoElement.innerHTML = '⚠️ Using mixed real and sample data (some APIs unavailable)';
        infoElement.className = 'text-yellow-400 text-sm';
        break;
      default:
        infoElement.innerHTML = 'Data sources: Yahoo Finance, Reddit API';
        infoElement.className = 'text-slate-400 text-sm';
    }
  }

  /**
   * Get user-friendly error message
   * @private
   * @param {Error} error - Error object
   * @param {string} context - Context description
   * @returns {string} User-friendly message
   */
  _getUserFriendlyErrorMessage(error, context) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'The requested data could not be found.';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return 'Access denied. Please check your credentials.';
    }
    
    if (errorMessage.includes('parse') || errorMessage.includes('json')) {
      return 'Received invalid data from the server.';
    }
    
    if (context.includes('Chart') || context.includes('chart')) {
      return 'Unable to display the chart. This might be due to insufficient data.';
    }
    
    if (context.includes('API') || context.includes('fetch') || context.includes('data')) {
      return 'Unable to load data from the server.';
    }
    
    if (context.includes('initialize')) {
      return 'Failed to start the dashboard. Please refresh the page.';
    }
    
    // Generic fallback message
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Destroy the dashboard and clean up resources
   */
  destroy() {
    // Clean up event listeners
    if (this._debouncedResize) {
      window.removeEventListener('resize', this._debouncedResize);
      this._debouncedResize = null;
    }
    
    // Clean up error boundary
    if (this.errorBoundary) {
      this.errorBoundary.destroy();
    }
    
    // Clean up components
    if (this.chart) {
      this.chart.destroy();
    }
    
    if (this.timeRangeFilter) {
      this.timeRangeFilter.destroy();
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