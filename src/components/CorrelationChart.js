/**
 * CorrelationChart - Dual-axis line chart component for visualizing correlation
 * between stock market volatility and meme popularity
 * Uses Chart.js for rendering
 */

import { Chart, registerables } from 'chart.js';

// Register Chart.js components including decimation plugin for performance
Chart.register(...registerables);

export class CorrelationChart {
  /**
   * Create a new CorrelationChart instance
   * @param {string} canvasId - ID of the canvas element to render the chart
   */
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.chart = null;
    this.resizeHandler = null;
    this.longLoadingTimeout = null;
    this.loadingContainer = null;
  }

  /**
   * Show loading state
   * @param {string} message - Optional custom loading message
   */
  showLoading(message = 'Loading chart data...') {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.warn(`Canvas element with id "${this.canvasId}" not found - skipping loading state`);
      return;
    }

    // Hide canvas and show loading indicator
    canvas.style.display = 'none';

    // Create or get loading container
    let loadingContainer = canvas.parentElement.querySelector('.chart-loading-container');
    if (!loadingContainer) {
      loadingContainer = document.createElement('div');
      loadingContainer.className = 'chart-loading-container';
      canvas.parentElement.appendChild(loadingContainer);
    }

    this.loadingContainer = loadingContainer;
    loadingContainer.innerHTML = this._renderLoadingState(message);
    loadingContainer.style.display = 'block';

    // Set timeout to show "Still loading..." message after 5 seconds
    this.longLoadingTimeout = setTimeout(() => {
      if (this.loadingContainer) {
        this.loadingContainer.innerHTML = this._renderLoadingState('Still loading...');
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

    const canvas = document.getElementById(this.canvasId);
    if (canvas) {
      canvas.style.display = 'block';
    }

    if (this.loadingContainer) {
      this.loadingContainer.style.display = 'none';
    }
  }

  /**
   * Initialize the chart with data
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   * @param {PopularityPoint[]} popularityData - Array of popularity data points
   */
  initialize(volatilityData, popularityData) {
    this.hideLoading();
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.warn(`Canvas element with id "${this.canvasId}" not found - skipping chart initialization`);
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Prepare aligned data
    const chartData = this._prepareChartData(volatilityData, popularityData);

    // Create chart with configuration
    this.chart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: this._getChartOptions()
    });

    // Set up resize handler for responsive behavior
    this._setupResizeHandler();
  }

  /**
   * Update chart with new data
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   * @param {PopularityPoint[]} popularityData - Array of popularity data points
   */
  update(volatilityData, popularityData) {
    this.hideLoading();
    
    if (!this.chart) {
      // If chart doesn't exist, initialize it
      this.initialize(volatilityData, popularityData);
      return;
    }

    // Prepare new data
    const chartData = this._prepareChartData(volatilityData, popularityData);

    // Update chart data
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets = chartData.datasets;

    // Re-render chart
    this.chart.update();
  }

  /**
   * Prepare chart data by aligning volatility and popularity data by date
   * @private
   * @param {VolatilityPoint[]} volatilityData - Array of volatility data points
   * @param {PopularityPoint[]} popularityData - Array of popularity data points
   * @returns {Object} Chart.js data object
   */
  _prepareChartData(volatilityData, popularityData) {
    // Handle empty data
    if (!volatilityData || !popularityData || volatilityData.length === 0 || popularityData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Volatility (%)',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'y-volatility',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Meme Popularity',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            yAxisID: 'y-popularity',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      };
    }

    // Create maps for quick lookup by date string
    const volatilityMap = new Map();
    for (const point of volatilityData) {
      const dateStr = point.date.toISOString().split('T')[0];
      volatilityMap.set(dateStr, point.volatility);
    }

    const popularityMap = new Map();
    for (const point of popularityData) {
      const dateStr = point.date.toISOString().split('T')[0];
      popularityMap.set(dateStr, point.popularity);
    }

    // Find common dates and align data
    const labels = [];
    const volatilityValues = [];
    const popularityValues = [];

    for (const [dateStr, volatility] of volatilityMap.entries()) {
      if (popularityMap.has(dateStr)) {
        labels.push(dateStr);
        volatilityValues.push(volatility);
        popularityValues.push(popularityMap.get(dateStr));
      }
    }

    // Sort by date
    const combined = labels.map((label, i) => ({
      label,
      volatility: volatilityValues[i],
      popularity: popularityValues[i]
    }));
    combined.sort((a, b) => new Date(a.label) - new Date(b.label));

    const sortedLabels = combined.map(item => item.label);
    const sortedVolatility = combined.map(item => item.volatility);
    const sortedPopularity = combined.map(item => item.popularity);

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Volatility (%)',
          data: sortedVolatility,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          yAxisID: 'y-volatility',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        {
          label: 'Meme Popularity',
          data: sortedPopularity,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          yAxisID: 'y-popularity',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        }
      ]
    };
  }

  /**
   * Get Chart.js configuration options
   * @private
   * @returns {Object} Chart.js options object
   */
  _getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      // Performance optimizations for slow networks/devices
      animation: {
        duration: window.navigator.connection?.effectiveType === 'slow-2g' || 
                  window.navigator.connection?.effectiveType === '2g' ? 0 : 750,
        easing: 'easeOutQuart'
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 5,
          hitRadius: 8
        },
        line: {
          tension: 0.3,
          borderCapStyle: 'round',
          borderJoinStyle: 'round'
        }
      },
      // Optimize for performance
      parsing: {
        xAxisKey: 'x',
        yAxisKey: 'y'
      },
      normalized: true,
      spanGaps: true,
      plugins: {
        // Decimation plugin for large datasets (Chart.js built-in)
        decimation: {
          enabled: true,
          algorithm: 'lttb', // Largest-Triangle-Three-Buckets algorithm
          samples: 100, // Reduce to 100 points for performance
          threshold: 50 // Only decimate if more than 50 points
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#e2e8f0',
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e2e8f0',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (tooltipItems) => {
              if (tooltipItems.length > 0) {
                const date = new Date(tooltipItems[0].label);
                return date.toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                });
              }
              return '';
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              
              if (label.includes('Volatility')) {
                return `${label}: ${value.toFixed(2)}%`;
              } else {
                return `${label}: ${value.toFixed(0)}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          display: true,
          title: {
            display: true,
            text: 'Date',
            color: '#94a3b8',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#94a3b8',
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10
            },
            callback: function(value, index, ticks) {
              // Show fewer labels on small screens
              const label = this.getLabelForValue(value);
              const date = new Date(label);
              return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            }
          },
          grid: {
            color: 'rgba(51, 65, 85, 0.3)',
            drawBorder: false
          }
        },
        'y-volatility': {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Volatility (%)',
            color: '#f59e0b',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#f59e0b',
            font: {
              size: 10
            },
            callback: function(value) {
              return value.toFixed(1) + '%';
            }
          },
          grid: {
            color: 'rgba(51, 65, 85, 0.3)',
            drawBorder: false
          }
        },
        'y-popularity': {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Meme Popularity Score',
            color: '#38bdf8',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#38bdf8',
            font: {
              size: 10
            },
            callback: function(value) {
              return value.toFixed(0);
            }
          },
          grid: {
            drawOnChartArea: false, // Don't draw grid lines for right axis
            drawBorder: false
          }
        }
      }
    };
  }

  /**
   * Set up window resize handler for responsive behavior
   * @private
   */
  _setupResizeHandler() {
    // Debounce resize events to avoid excessive re-renders
    let resizeTimeout;
    this.resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.chart) {
          this.chart.resize();
        }
      }, 300);
    };

    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Manually trigger chart resize
   */
  resize() {
    if (this.chart) {
      this.chart.resize();
    }
  }

  /**
   * Render loading state
   * @private
   * @param {string} message - Loading message
   * @returns {string} HTML string for loading state
   */
  _renderLoadingState(message) {
    return `
      <div class="flex flex-col items-center justify-center py-24">
        <div class="relative w-16 h-16 mb-4">
          <div class="absolute top-0 left-0 w-full h-full border-4 border-slate-600 rounded-full"></div>
          <div class="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div class="text-slate-300 text-sm font-medium">
          ${message}
        </div>
      </div>
    `;
  }

  /**
   * Destroy the chart and clean up resources
   */
  destroy() {
    // Clear loading timeout
    this.hideLoading();

    // Remove resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Destroy chart instance
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Clean up loading container
    if (this.loadingContainer && this.loadingContainer.parentElement) {
      this.loadingContainer.parentElement.removeChild(this.loadingContainer);
      this.loadingContainer = null;
    }
  }
}
