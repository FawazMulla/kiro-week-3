/**
 * ToastNotification - Component for displaying transient error and success messages
 * Provides non-intrusive notifications that auto-dismiss after a timeout
 */

export class ToastNotification {
  /**
   * Create a new ToastNotification instance
   */
  constructor() {
    this.container = null;
    this.toasts = new Map(); // Track active toasts
    this.toastCounter = 0;
    this._createContainer();
  }

  /**
   * Create the toast container if it doesn't exist
   * @private
   */
  _createContainer() {
    // Check if container already exists
    this.container = document.getElementById('toast-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show an error toast notification
   * @param {string} message - Error message to display
   * @param {Object} options - Configuration options
   * @param {number} options.duration - Duration in milliseconds (default: 5000)
   * @param {boolean} options.persistent - Whether toast should persist until manually closed (default: false)
   * @param {Function} options.onRetry - Optional retry callback function
   * @returns {string} Toast ID for manual dismissal
   */
  showError(message, options = {}) {
    return this._showToast(message, 'error', options);
  }

  /**
   * Show a warning toast notification
   * @param {string} message - Warning message to display
   * @param {Object} options - Configuration options
   * @returns {string} Toast ID for manual dismissal
   */
  showWarning(message, options = {}) {
    return this._showToast(message, 'warning', options);
  }

  /**
   * Show a success toast notification
   * @param {string} message - Success message to display
   * @param {Object} options - Configuration options
   * @returns {string} Toast ID for manual dismissal
   */
  showSuccess(message, options = {}) {
    return this._showToast(message, 'success', options);
  }

  /**
   * Show an info toast notification
   * @param {string} message - Info message to display
   * @param {Object} options - Configuration options
   * @returns {string} Toast ID for manual dismissal
   */
  showInfo(message, options = {}) {
    return this._showToast(message, 'info', options);
  }

  /**
   * Show a toast notification
   * @private
   * @param {string} message - Message to display
   * @param {string} type - Toast type ('error', 'warning', 'success', 'info')
   * @param {Object} options - Configuration options
   * @returns {string} Toast ID
   */
  _showToast(message, type, options = {}) {
    const {
      duration = type === 'error' ? 8000 : 5000, // Errors stay longer
      persistent = false,
      onRetry = null
    } = options;

    const toastId = `toast-${++this.toastCounter}`;
    const toastElement = this._createToastElement(toastId, message, type, onRetry);
    
    // Add to container with animation
    this.container.appendChild(toastElement);
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      toastElement.classList.remove('translate-x-full', 'opacity-0');
      toastElement.classList.add('translate-x-0', 'opacity-100');
    });

    // Set up auto-dismiss timer (unless persistent)
    let timeoutId = null;
    if (!persistent && duration > 0) {
      timeoutId = setTimeout(() => {
        this.dismiss(toastId);
      }, duration);
    }

    // Store toast reference
    this.toasts.set(toastId, {
      element: toastElement,
      timeoutId,
      type,
      message
    });

    return toastId;
  }

  /**
   * Create toast element
   * @private
   * @param {string} toastId - Unique toast ID
   * @param {string} message - Message to display
   * @param {string} type - Toast type
   * @param {Function} onRetry - Optional retry callback
   * @returns {HTMLElement} Toast element
   */
  _createToastElement(toastId, message, type, onRetry) {
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `
      transform transition-all duration-300 ease-in-out
      translate-x-full opacity-0
      bg-slate-800 border rounded-lg shadow-lg p-4
      ${this._getTypeStyles(type)}
    `.trim();

    const icon = this._getTypeIcon(type);
    const hasRetry = onRetry && type === 'error';

    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <!-- Icon -->
        <div class="flex-shrink-0">
          ${icon}
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-100 font-medium">
            ${this._escapeHtml(message)}
          </p>
          
          ${hasRetry ? `
            <div class="mt-2">
              <button 
                data-toast-retry="${toastId}"
                class="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          ` : ''}
        </div>
        
        <!-- Close Button -->
        <div class="flex-shrink-0">
          <button 
            data-toast-dismiss="${toastId}"
            class="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close notification"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `;

    // Set up event listeners instead of onclick handlers
    const retryButton = toast.querySelector(`[data-toast-retry="${toastId}"]`);
    if (retryButton && onRetry) {
      retryButton.addEventListener('click', () => {
        try {
          onRetry();
          this.dismiss(toastId);
        } catch (error) {
          console.error('Error in toast retry callback:', error);
        }
      });
    }

    const dismissButton = toast.querySelector(`[data-toast-dismiss="${toastId}"]`);
    if (dismissButton) {
      dismissButton.addEventListener('click', () => {
        this.dismiss(toastId);
      });
    }

    return toast;
  }

  /**
   * Get CSS classes for toast type
   * @private
   * @param {string} type - Toast type
   * @returns {string} CSS classes
   */
  _getTypeStyles(type) {
    const styles = {
      error: 'border-red-500/20 bg-red-900/10',
      warning: 'border-yellow-500/20 bg-yellow-900/10',
      success: 'border-green-500/20 bg-green-900/10',
      info: 'border-blue-500/20 bg-blue-900/10'
    };
    return styles[type] || styles.info;
  }

  /**
   * Get icon SVG for toast type
   * @private
   * @param {string} type - Toast type
   * @returns {string} SVG icon HTML
   */
  _getTypeIcon(type) {
    const icons = {
      error: `
        <svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      `,
      warning: `
        <svg class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      `,
      success: `
        <svg class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `,
      info: `
        <svg class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `
    };
    return icons[type] || icons.info;
  }

  /**
   * Dismiss a toast notification
   * @param {string} toastId - Toast ID to dismiss
   */
  dismiss(toastId) {
    const toast = this.toasts.get(toastId);
    if (!toast) {
      return;
    }

    const { element, timeoutId } = toast;

    // Clear timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Animate out
    element.classList.remove('translate-x-0', 'opacity-100');
    element.classList.add('translate-x-full', 'opacity-0');

    // Remove from DOM after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Event listeners are automatically cleaned up when element is removed
      
      // Remove from tracking
      this.toasts.delete(toastId);
    }, 300);
  }

  /**
   * Dismiss all toast notifications
   */
  dismissAll() {
    const toastIds = Array.from(this.toasts.keys());
    toastIds.forEach(id => this.dismiss(id));
  }

  /**
   * Get count of active toasts
   * @returns {number} Number of active toasts
   */
  getActiveCount() {
    return this.toasts.size;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    if (typeof text !== 'string') {
      text = String(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy toast notification system
   */
  destroy() {
    this.dismissAll();
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Clean up global callbacks
    Object.keys(window).forEach(key => {
      if (key.startsWith('toastRetry_')) {
        delete window[key];
      }
    });
    
    this.container = null;
    this.toasts.clear();
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.toastNotification = new ToastNotification();
}