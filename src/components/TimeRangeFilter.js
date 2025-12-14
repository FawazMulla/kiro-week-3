/**
 * TimeRangeFilter - Component for selecting time range periods
 * Provides buttons for 7, 30, and 90 day time ranges with active state management
 */

export class TimeRangeFilter {
  /**
   * Create a new TimeRangeFilter instance
   * @param {string} containerId - ID of the container element
   * @param {Function} onTimeRangeChange - Callback function when time range changes
   */
  constructor(containerId, onTimeRangeChange) {
    this.containerId = containerId;
    this.onTimeRangeChange = onTimeRangeChange;
    this.currentTimeRange = 30; // Default to 30 days
    this.isLoading = false;
    
    // Available time range options
    this.timeRangeOptions = [
      { value: 7, label: '7 Days', shortLabel: '7D' },
      { value: 30, label: '30 Days', shortLabel: '30D' },
      { value: 90, label: '90 Days', shortLabel: '90D' }
    ];
    
    this._initialize();
  }

  /**
   * Initialize the component and render the UI
   * @private
   */
  _initialize() {
    this.render();
    this._setupEventListeners();
  }

  /**
   * Render the time range filter UI
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`TimeRangeFilter: Container with id '${this.containerId}' not found`);
      return;
    }

    // Generate button HTML
    const buttonsHtml = this.timeRangeOptions.map(option => {
      const isActive = option.value === this.currentTimeRange;
      const activeClass = isActive ? 'active' : '';
      const ariaSelected = isActive ? 'true' : 'false';
      
      return `
        <button 
          class="time-range-btn ${activeClass}" 
          data-range="${option.value}" 
          role="tab" 
          aria-selected="${ariaSelected}"
          ${this.isLoading ? 'disabled' : ''}
        >
          <span class="hidden sm:inline">${option.label}</span>
          <span class="sm:hidden">${option.shortLabel}</span>
        </button>
      `;
    }).join('');

    // Render the complete filter UI
    container.innerHTML = `
      <div class="flex justify-center">
        <div class="bg-slate-800 rounded-lg p-1 inline-flex shadow-md" 
             id="time-range-filter" 
             role="tablist" 
             aria-label="Time range selection">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners for button clicks
   * @private
   */
  _setupEventListeners() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Use event delegation to handle button clicks
    container.addEventListener('click', (event) => {
      if (event.target.classList.contains('time-range-btn') && !this.isLoading) {
        const newRange = parseInt(event.target.dataset.range);
        this.handleTimeRangeChange(newRange);
      }
    });
  }

  /**
   * Handle time range change
   * @param {number} newTimeRange - New time range in days
   */
  async handleTimeRangeChange(newTimeRange) {
    if (newTimeRange === this.currentTimeRange || this.isLoading) {
      return; // No change needed or already loading
    }

    try {
      // Update current time range
      this.currentTimeRange = newTimeRange;
      
      // Show loading state
      this.showLoading();
      
      // Update button states
      this._updateButtonStates();
      
      // Call the callback function
      if (this.onTimeRangeChange && typeof this.onTimeRangeChange === 'function') {
        await this.onTimeRangeChange(newTimeRange);
      }
      
    } catch (error) {
      console.error('TimeRangeFilter: Error handling time range change:', error);
      // Revert to previous state on error
      this._updateButtonStates();
    } finally {
      // Hide loading state
      this.hideLoading();
    }
  }

  /**
   * Update button states to reflect current selection
   * @private
   */
  _updateButtonStates() {
    const buttons = document.querySelectorAll(`#${this.containerId} .time-range-btn`);
    buttons.forEach(button => {
      const range = parseInt(button.dataset.range);
      if (range === this.currentTimeRange) {
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
      }
    });
  }

  /**
   * Show loading state on all buttons
   */
  showLoading() {
    this.isLoading = true;
    const buttons = document.querySelectorAll(`#${this.containerId} .time-range-btn`);
    buttons.forEach(button => {
      button.disabled = true;
      button.style.opacity = '0.6';
      button.style.cursor = 'not-allowed';
    });
  }

  /**
   * Hide loading state and re-enable buttons
   */
  hideLoading() {
    this.isLoading = false;
    const buttons = document.querySelectorAll(`#${this.containerId} .time-range-btn`);
    buttons.forEach(button => {
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
    });
  }

  /**
   * Get the current time range
   * @returns {number} Current time range in days
   */
  getCurrentTimeRange() {
    return this.currentTimeRange;
  }

  /**
   * Set the time range programmatically
   * @param {number} timeRange - Time range in days (7, 30, or 90)
   */
  setTimeRange(timeRange) {
    if (this.timeRangeOptions.some(option => option.value === timeRange)) {
      this.currentTimeRange = timeRange;
      this._updateButtonStates();
    } else {
      console.warn(`TimeRangeFilter: Invalid time range ${timeRange}. Valid options: 7, 30, 90`);
    }
  }

  /**
   * Get available time range options
   * @returns {Array} Array of time range options
   */
  getTimeRangeOptions() {
    return [...this.timeRangeOptions];
  }

  /**
   * Destroy the component and clean up event listeners
   */
  destroy() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}