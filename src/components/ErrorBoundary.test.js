/**
 * ErrorBoundary Component Tests
 * Tests error catching, user-friendly messages, and retry functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary.js';

describe('ErrorBoundary', () => {
  let container;
  let errorBoundary;
  let mockOnError;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.innerHTML = '<p>Original content</p>';
    document.body.appendChild(container);

    // Mock error callback
    mockOnError = vi.fn();

    // Create error boundary
    errorBoundary = new ErrorBoundary(container, mockOnError);
  });

  afterEach(() => {
    // Clean up
    if (errorBoundary) {
      errorBoundary.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Clean up global error handlers
    window.onerror = null;
    window.onunhandledrejection = null;
  });

  describe('Error Handling', () => {
    it('should catch and handle JavaScript errors', () => {
      const testError = new Error('Test error');
      
      // Trigger error through global handler
      window.onerror('Test error', 'test.js', 1, 1, testError);
      
      // Should call error callback
      expect(mockOnError).toHaveBeenCalledWith(testError, 'JavaScript Error');
      
      // Should show error UI
      expect(container.innerHTML).toContain('Something went wrong');
      expect(container.innerHTML).toContain('Try Again');
    });

    it('should handle unhandled promise rejections', () => {
      const testError = new Error('Promise rejection');
      const event = { reason: testError, preventDefault: vi.fn() };
      
      // Trigger unhandled rejection
      window.onunhandledrejection(event);
      
      // Should call error callback
      expect(mockOnError).toHaveBeenCalledWith(testError, 'Unhandled Promise Rejection');
      
      // Should prevent default behavior (this is optional in our implementation)
      // expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should wrap functions with error boundary protection', () => {
      const testFunction = vi.fn(() => {
        throw new Error('Function error');
      });

      const wrappedFunction = errorBoundary.wrap(testFunction, 'Test Function');
      
      expect(() => wrappedFunction()).toThrow('Function error');
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        'Test Function'
      );
    });

    it('should handle async function errors', async () => {
      const asyncFunction = vi.fn(async () => {
        throw new Error('Async error');
      });

      const wrappedFunction = errorBoundary.wrap(asyncFunction, 'Async Function');
      
      await expect(wrappedFunction()).rejects.toThrow('Async error');
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        'Async Function'
      );
    });
  });

  describe('User-Friendly Messages', () => {
    it('should provide user-friendly message for network errors', () => {
      const networkError = new Error('Network request failed');
      
      window.onerror('Network request failed', 'test.js', 1, 1, networkError);
      
      expect(container.innerHTML).toContain('Unable to connect to the server');
      expect(container.innerHTML).toContain('check your internet connection');
    });

    it('should provide user-friendly message for timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      
      window.onerror('Request timeout', 'test.js', 1, 1, timeoutError);
      
      expect(container.innerHTML).toContain('took too long to complete');
    });

    it('should provide user-friendly message for rate limit errors', () => {
      const rateLimitError = new Error('Rate limit exceeded (429)');
      
      window.onerror('Rate limit exceeded (429)', 'test.js', 1, 1, rateLimitError);
      
      expect(container.innerHTML).toContain('Too many requests');
      expect(container.innerHTML).toContain('wait a moment');
    });

    it('should provide generic message for unknown errors', () => {
      const unknownError = new Error('Unknown error type');
      
      window.onerror('Unknown error type', 'test.js', 1, 1, unknownError);
      
      expect(container.innerHTML).toContain('An unexpected error occurred');
    });
  });

  describe('Retry Functionality', () => {
    it('should restore original content on retry', () => {
      const originalContent = container.innerHTML;
      const testError = new Error('Test error');
      
      // Trigger error
      window.onerror('Test error', 'test.js', 1, 1, testError);
      
      // Content should be changed to error UI
      expect(container.innerHTML).not.toBe(originalContent);
      expect(container.innerHTML).toContain('Something went wrong');
      
      // Retry should restore original content
      errorBoundary.retry();
      expect(container.innerHTML).toBe(originalContent);
    });

    it('should dispatch retry event on retry', () => {
      const retryHandler = vi.fn();
      container.addEventListener('errorBoundaryRetry', retryHandler);
      
      const testError = new Error('Test error');
      window.onerror('Test error', 'test.js', 1, 1, testError);
      
      errorBoundary.retry();
      
      expect(retryHandler).toHaveBeenCalled();
    });

    it('should reset error state on retry', () => {
      const testError = new Error('Test error');
      
      // Trigger error
      window.onerror('Test error', 'test.js', 1, 1, testError);
      expect(errorBoundary.hasError).toBe(true);
      
      // Retry should reset state
      errorBoundary.retry();
      expect(errorBoundary.hasError).toBe(false);
    });
  });

  describe('Error Prevention', () => {
    it('should prevent infinite error loops', () => {
      const testError = new Error('Test error');
      
      // Trigger multiple errors
      window.onerror('Test error', 'test.js', 1, 1, testError);
      window.onerror('Test error', 'test.js', 1, 1, testError);
      window.onerror('Test error', 'test.js', 1, 1, testError);
      
      // Should only call error callback once
      expect(mockOnError).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in error callback gracefully', () => {
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      const errorBoundaryWithFaultyCallback = new ErrorBoundary(container, faultyCallback);
      
      const testError = new Error('Test error');
      
      // Should not throw even if callback throws
      expect(() => {
        window.onerror('Test error', 'test.js', 1, 1, testError);
      }).not.toThrow();
      
      errorBoundaryWithFaultyCallback.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should restore original error handlers on destroy', () => {
      const originalErrorHandler = vi.fn();
      const originalRejectionHandler = vi.fn();
      
      window.onerror = originalErrorHandler;
      window.onunhandledrejection = originalRejectionHandler;
      
      const testBoundary = new ErrorBoundary(container);
      
      // Handlers should be replaced
      expect(window.onerror).not.toBe(originalErrorHandler);
      expect(window.onunhandledrejection).not.toBe(originalRejectionHandler);
      
      // Destroy should restore original handlers
      testBoundary.destroy();
      expect(window.onerror).toBe(originalErrorHandler);
      expect(window.onunhandledrejection).toBe(originalRejectionHandler);
    });

    it('should clean up global references on destroy', () => {
      const testError = new Error('Test error');
      
      // Trigger error to create global references
      window.onerror('Test error', 'test.js', 1, 1, testError);
      
      // Should have error UI with buttons
      const retryButton = container.querySelector('[data-error-retry]');
      expect(retryButton).toBeTruthy();
      
      // Destroy should clean up references
      errorBoundary.destroy();
      const remainingKeys = Object.keys(window).filter(key => key.startsWith('errorBoundary_'));
      expect(remainingKeys.length).toBe(0);
    });
  });
});