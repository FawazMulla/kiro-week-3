/**
 * RetryHandler - Utility for handling retry logic with exponential backoff
 * Provides consistent retry behavior across API calls and operations
 */

export class RetryHandler {
  /**
   * Create a new RetryHandler instance
   * @param {Object} options - Configuration options
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
   * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
   * @param {Function} options.shouldRetry - Function to determine if error should be retried
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.shouldRetry = options.shouldRetry || this._defaultShouldRetry.bind(this);
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - Async function to execute
   * @param {string} context - Context description for error reporting
   * @param {Object} options - Override options for this specific retry
   * @returns {Promise} Promise that resolves with the function result
   */
  async execute(fn, context = 'Operation', options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const shouldRetry = options.shouldRetry || this.shouldRetry;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        
        // Log successful retry if this wasn't the first attempt
        if (attempt > 1) {
          console.log(`${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Log the attempt
        console.warn(`${context} failed on attempt ${attempt}:`, error.message);
        
        // Check if we should retry this error
        if (!shouldRetry(error, attempt)) {
          console.error(`${context} failed - not retryable:`, error);
          throw error;
        }
        
        // Check if we've exhausted all attempts
        if (attempt > maxRetries) {
          console.error(`${context} failed after ${maxRetries} attempts:`, error);
          throw new Error(`${context} failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this._calculateDelay(attempt);
        console.log(`${context} retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        // Wait before retrying
        await this._delay(delay);
      }
    }
    
    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Create a retry wrapper for API calls with user feedback
   * @param {Function} apiCall - API function to wrap
   * @param {string} context - Context description
   * @param {Object} options - Configuration options
   * @param {Function} options.onRetry - Callback when retry is attempted
   * @param {Function} options.onSuccess - Callback when operation succeeds
   * @param {Function} options.onFailure - Callback when operation fails permanently
   * @returns {Function} Wrapped API function
   */
  createRetryWrapper(apiCall, context, options = {}) {
    const { onRetry, onSuccess, onFailure } = options;
    
    return async (...args) => {
      try {
        const result = await this.execute(
          () => apiCall(...args),
          context,
          {
            shouldRetry: (error, attempt) => {
              // Call retry callback if provided
              if (onRetry && attempt > 1) {
                try {
                  onRetry(error, attempt, this.maxRetries + 1);
                } catch (callbackError) {
                  console.error('Error in retry callback:', callbackError);
                }
              }
              
              return this.shouldRetry(error, attempt);
            }
          }
        );
        
        // Call success callback if provided
        if (onSuccess) {
          try {
            onSuccess(result);
          } catch (callbackError) {
            console.error('Error in success callback:', callbackError);
          }
        }
        
        return result;
      } catch (error) {
        // Call failure callback if provided
        if (onFailure) {
          try {
            onFailure(error);
          } catch (callbackError) {
            console.error('Error in failure callback:', callbackError);
          }
        }
        
        throw error;
      }
    };
  }

  /**
   * Default logic for determining if an error should be retried
   * @private
   * @param {Error} error - Error object
   * @param {number} attempt - Current attempt number
   * @returns {boolean} Whether the error should be retried
   */
  _defaultShouldRetry(error, attempt) {
    // Don't retry if we've exceeded max attempts
    if (attempt > this.maxRetries) {
      return false;
    }
    
    const errorMessage = error.message.toLowerCase();
    
    // Retry network-related errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch')) {
      return true;
    }
    
    // Retry server errors (5xx)
    if (errorMessage.includes('500') || 
        errorMessage.includes('502') || 
        errorMessage.includes('503') || 
        errorMessage.includes('504')) {
      return true;
    }
    
    // Retry rate limiting (429) but with longer delays
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return true;
    }
    
    // Don't retry client errors (4xx except 429)
    if (errorMessage.includes('400') || 
        errorMessage.includes('401') || 
        errorMessage.includes('403') || 
        errorMessage.includes('404')) {
      return false;
    }
    
    // Don't retry parsing errors
    if (errorMessage.includes('parse') || 
        errorMessage.includes('json') || 
        errorMessage.includes('syntax')) {
      return false;
    }
    
    // Default to retrying unknown errors
    return true;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   * @private
   * @param {number} attempt - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  _calculateDelay(attempt) {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    
    // Add jitter (±25% random variation)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    const delayWithJitter = exponentialDelay + jitter;
    
    // Cap at maximum delay
    return Math.min(delayWithJitter, this.maxDelay);
  }

  /**
   * Delay execution for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a manual retry function for user-triggered retries
   * @param {Function} operation - Operation to retry
   * @param {string} context - Context description
   * @returns {Function} Retry function
   */
  createManualRetry(operation, context) {
    return async () => {
      try {
        console.log(`Manual retry triggered for: ${context}`);
        const result = await operation();
        console.log(`Manual retry succeeded for: ${context}`);
        return result;
      } catch (error) {
        console.error(`Manual retry failed for: ${context}`, error);
        throw error;
      }
    };
  }

  /**
   * Get user-friendly retry status message
   * @param {number} attempt - Current attempt number
   * @param {number} maxAttempts - Maximum attempts
   * @param {string} context - Context description
   * @returns {string} Status message
   */
  getRetryStatusMessage(attempt, maxAttempts, context) {
    if (attempt === 1) {
      return `Loading ${context.toLowerCase()}...`;
    } else if (attempt <= maxAttempts) {
      return `Retrying ${context.toLowerCase()}... (${attempt}/${maxAttempts})`;
    } else {
      return `Failed to load ${context.toLowerCase()}`;
    }
  }
}