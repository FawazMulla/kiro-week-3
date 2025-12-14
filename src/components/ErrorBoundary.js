/**
 * ErrorBoundary - Component for catching and handling rendering errors
 * Provides graceful error handling and user-friendly error messages
 */

export class ErrorBoundary {
  /**
   * Create a new ErrorBoundary instance
   * @param {HTMLElement} container - Container element to wrap
   * @param {Function} onError - Optional error callback
   */
  constructor(container, onError = null) {
    this.container = container;
    this.onError = onError;
    this.originalContent = null;
    this.hasError = false;
    
    // Store original error handler
    this.originalErrorHandler = window.onerror;
    this.originalUnhandledRejectionHandler = window.onunhandledrejection;
    
    this._setupErrorHandlers();
  }

  /**
   * Set up global error handlers
   * @private
   */
  _setupErrorHandlers() {
    // Handle JavaScript errors
    window.onerror = (message, source, lineno, colno, error) => {
      this._handleError(error || new Error(message), 'JavaScript Error');
      
      // Call original handler if it exists
      if (this.originalErrorHandler) {
        return this.originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      this._handleError(event.reason, 'Unhandled Promise Rejection');
      
      // Call original handler if it exists
      if (this.originalUnhandledRejectionHandler) {
        return this.originalUnhandledRejectionHandler(event);
      }
    };
  }

  /**
   * Wrap a function with error boundary protection
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context description for error reporting
   * @returns {Function} Wrapped function
   */
  wrap(fn, context = 'Component operation') {
    return (...args) => {
      try {
        const result = fn.apply(this, args);
        
        // Handle async functions
        if (result && typeof result.catch === 'function') {
          return result.catch(error => {
            this._handleError(error, context);
            throw error; // Re-throw to maintain promise chain
          });
        }
        
        return result;
      } catch (error) {
        this._handleError(error, context);
        throw error; // Re-throw to maintain error propagation
      }
    };
  }

  /**
   * Handle errors and display error boundary UI
   * @private
   * @param {Error} error - Error object
   * @param {string} context - Context description
   */
  _handleError(error, context) {
    // Log error for debugging
    console.error(`ErrorBoundary caught error in ${context}:`, error);
    
    // Avoid infinite error loops
    if (this.hasError) {
      return;
    }
    
    this.hasError = true;
    
    // Store original content if not already stored
    if (!this.originalContent && this.container) {
      this.originalContent = this.container.innerHTML;
    }
    
    // Call error callback if provided
    if (this.onError) {
      try {
        this.onError(error, context);
      } catch (callbackError) {
        console.error('Error in ErrorBoundary callback:', callbackError);
      }
    }
    
    // Show error UI
    this._showErrorUI(error, context);
  }

  /**
   * Show error boundary UI
   * @private
   * @param {Error} error - Error object
   * @param {string} context - Context description
   */
  _showErrorUI(error, context) {
    if (!this.container) {
      return;
    }

    const userFriendlyMessage = this._getUserFriendlyMessage(error, context);
    const errorId = this._generateErrorId();

    this.container.innerHTML = `
      <div class="panel border-red-500/20 bg-red-900/10">
        <div class="flex items-start space-x-3">
          <!-- Error Icon -->
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <!-- Error Content -->
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-red-400 mb-2">
              Something went wrong
            </h3>
            <p class="text-sm text-slate-300 mb-4">
              ${this._escapeHtml(userFriendlyMessage)}
            </p>
            
            <!-- Error Actions -->
            <div class="flex flex-col sm:flex-row gap-2">
              <button 
                data-error-retry="${errorId}"
                class="btn-primary text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Try Again
              </button>
              <button 
                data-error-details="${errorId}"
                class="btn-secondary text-sm px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
              >
                Show Details
              </button>
            </div>
            
            <!-- Error Details (hidden by default) -->
            <div id="error-details-${errorId}" class="hidden mt-4 p-3 bg-slate-800 rounded-md">
              <h4 class="text-xs font-medium text-slate-400 mb-2">Technical Details:</h4>
              <pre class="text-xs text-slate-400 whitespace-pre-wrap break-words">${this._escapeHtml(error.stack || error.message)}</pre>
            </div>
          </div>
        </div>
      </div>
    `;

    // Set up event listeners instead of onclick handlers
    const retryButton = this.container.querySelector(`[data-error-retry="${errorId}"]`);
    if (retryButton) {
      retryButton.addEventListener('click', () => this.retry());
    }

    const detailsButton = this.container.querySelector(`[data-error-details="${errorId}"]`);
    if (detailsButton) {
      detailsButton.addEventListener('click', () => this._toggleErrorDetails(errorId));
    }
  }

  /**
   * Get user-friendly error message
   * @private
   * @param {Error} error - Error object
   * @param {string} context - Context description
   * @returns {string} User-friendly message
   */
  _getUserFriendlyMessage(error, context) {
    // Map common errors to user-friendly messages
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'The requested data could not be found. It may have been moved or deleted.';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return 'Access denied. Please check your credentials and try again.';
    }
    
    if (errorMessage.includes('parse') || errorMessage.includes('json')) {
      return 'Received invalid data from the server. Please try again.';
    }
    
    if (context.includes('Chart') || context.includes('chart')) {
      return 'Unable to display the chart. This might be due to insufficient data or a display issue.';
    }
    
    if (context.includes('API') || context.includes('fetch')) {
      return 'Unable to load data from the server. Please try again in a moment.';
    }
    
    // Generic fallback message
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Generate unique error ID
   * @private
   * @returns {string} Unique error ID
   */
  _generateErrorId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Toggle error details visibility
   * @private
   * @param {string} errorId - Error ID
   */
  _toggleErrorDetails(errorId) {
    const detailsElement = document.getElementById(`error-details-${errorId}`);
    if (detailsElement) {
      detailsElement.classList.toggle('hidden');
    }
  }

  /**
   * Retry the operation by restoring original content
   */
  retry() {
    this.hasError = false;
    
    if (this.container && this.originalContent) {
      this.container.innerHTML = this.originalContent;
    }
    
    // Clean up global references
    this._cleanupErrorReferences();
    
    // Trigger a custom event that components can listen to for retry logic
    if (this.container) {
      this.container.dispatchEvent(new CustomEvent('errorBoundaryRetry', {
        bubbles: true,
        detail: { boundary: this }
      }));
    }
  }

  /**
   * Clean up error references from global scope
   * @private
   */
  _cleanupErrorReferences() {
    // Event listeners are automatically cleaned up when elements are removed
    // No need to clean up global references anymore
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
   * Reset error boundary state
   */
  reset() {
    this.hasError = false;
    this.originalContent = null;
    this._cleanupErrorReferences();
  }

  /**
   * Destroy error boundary and restore original handlers
   */
  destroy() {
    // Restore original error handlers
    window.onerror = this.originalErrorHandler;
    window.onunhandledrejection = this.originalUnhandledRejectionHandler;
    
    // Clean up references
    this._cleanupErrorReferences();
    this.reset();
  }
}