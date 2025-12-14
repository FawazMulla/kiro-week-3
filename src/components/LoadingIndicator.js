/**
 * LoadingIndicator - Component for displaying loading states
 * Shows spinner animation and optional "Still loading..." message after delay
 */

export class LoadingIndicator {
  /**
   * Create a new LoadingIndicator instance
   * @param {string} containerId - ID of the container element to render the loading indicator
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.longLoadingTimeout = null;
  }

  /**
   * Show loading indicator
   * @param {string} message - Optional custom loading message
   */
  show(message = 'Loading...') {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${this.containerId}" not found`);
    }

    // Render loading spinner
    this.container.innerHTML = this._renderLoadingSpinner(message);

    // Set timeout to show "Still loading..." message after 5 seconds
    this.longLoadingTimeout = setTimeout(() => {
      this._showLongLoadingMessage();
    }, 5000);
  }

  /**
   * Hide loading indicator
   */
  hide() {
    // Clear timeout if it exists
    if (this.longLoadingTimeout) {
      clearTimeout(this.longLoadingTimeout);
      this.longLoadingTimeout = null;
    }

    // Clear container content
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Show "Still loading..." message after delay
   * @private
   */
  _showLongLoadingMessage() {
    if (this.container) {
      this.container.innerHTML = this._renderLoadingSpinner('Still loading...');
    }
  }

  /**
   * Render loading spinner HTML
   * @private
   * @param {string} message - Loading message to display
   * @returns {string} HTML string
   */
  _renderLoadingSpinner(message) {
    return `
      <div class="bg-slate-800 rounded-lg shadow-lg p-6">
        <div class="flex flex-col items-center justify-center py-12">
          <!-- Spinner Animation -->
          <div class="relative w-16 h-16 mb-4">
            <div class="absolute top-0 left-0 w-full h-full border-4 border-slate-600 rounded-full"></div>
            <div class="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          <!-- Loading Message -->
          <div class="text-slate-300 text-sm font-medium">
            ${this._escapeHtml(message)}
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
   * Destroy the loading indicator and clean up resources
   */
  destroy() {
    this.hide();
    this.container = null;
  }
}
