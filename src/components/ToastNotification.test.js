/**
 * ToastNotification Component Tests
 * Tests toast creation, display, dismissal, and retry functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastNotification } from './ToastNotification.js';

describe('ToastNotification', () => {
  let toastNotification;

  beforeEach(() => {
    // Clean up any existing toast containers
    const existingContainer = document.getElementById('toast-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create new toast notification instance
    toastNotification = new ToastNotification();
  });

  afterEach(() => {
    // Clean up
    if (toastNotification) {
      toastNotification.destroy();
    }
    
    // Clean up global callbacks
    Object.keys(window).forEach(key => {
      if (key.startsWith('toastRetry_')) {
        delete window[key];
      }
    });
  });

  describe('Container Creation', () => {
    it('should create toast container on initialization', () => {
      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(container.className).toContain('fixed');
      expect(container.className).toContain('top-4');
      expect(container.className).toContain('right-4');
    });

    it('should reuse existing container if present', () => {
      const existingContainer = document.createElement('div');
      existingContainer.id = 'toast-container';
      document.body.appendChild(existingContainer);
      
      const newToast = new ToastNotification();
      expect(newToast.container.id).toBe(existingContainer.id);
      
      newToast.destroy();
    });
  });

  describe('Toast Creation', () => {
    it('should create error toast with correct styling', () => {
      const toastId = toastNotification.showError('Test error message');
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      expect(toastElement.innerHTML).toContain('Test error message');
      expect(toastElement.className).toContain('border-red-500/20');
      expect(toastElement.innerHTML).toContain('text-red-400'); // Error icon
    });

    it('should create warning toast with correct styling', () => {
      const toastId = toastNotification.showWarning('Test warning message');
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      expect(toastElement.innerHTML).toContain('Test warning message');
      expect(toastElement.className).toContain('border-yellow-500/20');
      expect(toastElement.innerHTML).toContain('text-yellow-400'); // Warning icon
    });

    it('should create success toast with correct styling', () => {
      const toastId = toastNotification.showSuccess('Test success message');
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      expect(toastElement.innerHTML).toContain('Test success message');
      expect(toastElement.className).toContain('border-green-500/20');
      expect(toastElement.innerHTML).toContain('text-green-400'); // Success icon
    });

    it('should create info toast with correct styling', () => {
      const toastId = toastNotification.showInfo('Test info message');
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      expect(toastElement.innerHTML).toContain('Test info message');
      expect(toastElement.className).toContain('border-blue-500/20');
      expect(toastElement.innerHTML).toContain('text-blue-400'); // Info icon
    });
  });

  describe('Toast Options', () => {
    it('should respect custom duration', async () => {
      const toastId = toastNotification.showError('Test message', { duration: 100 });
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      
      // Wait for auto-dismiss
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const dismissedElement = document.getElementById(toastId);
      expect(dismissedElement).toBeFalsy();
    });

    it('should not auto-dismiss persistent toasts', async () => {
      const toastId = toastNotification.showError('Test message', { 
        persistent: true,
        duration: 100 
      });
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      
      // Wait longer than duration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const persistentElement = document.getElementById(toastId);
      expect(persistentElement).toBeTruthy();
    });

    it('should add retry button for error toasts with onRetry callback', () => {
      const retryCallback = vi.fn();
      const toastId = toastNotification.showError('Test error', { 
        onRetry: retryCallback 
      });
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement.innerHTML).toContain('Try Again');
      
      // Should have retry button with event listener
      const retryButton = document.querySelector(`[data-toast-retry="${toastId}"]`);
      expect(retryButton).toBeTruthy();
    });

    it('should not add retry button for non-error toasts', () => {
      const retryCallback = vi.fn();
      const toastId = toastNotification.showWarning('Test warning', { 
        onRetry: retryCallback 
      });
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement.innerHTML).not.toContain('Try Again');
    });
  });

  describe('Toast Dismissal', () => {
    it('should dismiss toast manually', () => {
      const toastId = toastNotification.showError('Test message');
      
      let toastElement = document.getElementById(toastId);
      expect(toastElement).toBeTruthy();
      
      toastNotification.dismiss(toastId);
      
      // Should start exit animation
      expect(toastElement.className).toContain('translate-x-full');
      expect(toastElement.className).toContain('opacity-0');
    });

    it('should dismiss all toasts', () => {
      const toast1 = toastNotification.showError('Message 1');
      const toast2 = toastNotification.showWarning('Message 2');
      const toast3 = toastNotification.showInfo('Message 3');
      
      expect(toastNotification.getActiveCount()).toBe(3);
      
      toastNotification.dismissAll();
      
      // All toasts should be dismissed
      expect(toastNotification.getActiveCount()).toBe(0);
    });

    it('should handle dismissing non-existent toast gracefully', () => {
      expect(() => {
        toastNotification.dismiss('non-existent-toast');
      }).not.toThrow();
    });
  });

  describe('Retry Functionality', () => {
    it('should execute retry callback and dismiss toast', () => {
      const retryCallback = vi.fn();
      const toastId = toastNotification.showError('Test error', { 
        onRetry: retryCallback 
      });
      
      // Execute retry callback by clicking the button
      const retryButton = document.querySelector(`[data-toast-retry="${toastId}"]`);
      retryButton.click();
      
      expect(retryCallback).toHaveBeenCalled();
      
      // Toast should be dismissed after retry
      const toastElement = document.getElementById(toastId);
      expect(toastElement.className).toContain('translate-x-full');
    });

    it('should handle retry callback errors gracefully', () => {
      const faultyCallback = vi.fn(() => {
        throw new Error('Retry failed');
      });
      
      const toastId = toastNotification.showError('Test error', { 
        onRetry: faultyCallback 
      });
      
      // Should not throw even if callback throws
      expect(() => {
        const retryButton = document.querySelector(`[data-toast-retry="${toastId}"]`);
        retryButton.click();
      }).not.toThrow();
      
      expect(faultyCallback).toHaveBeenCalled();
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in messages', () => {
      const maliciousMessage = '<script>alert("xss")</script>';
      const toastId = toastNotification.showError(maliciousMessage);
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement.innerHTML).toContain('&lt;script&gt;');
      expect(toastElement.innerHTML).not.toContain('<script>');
    });

    it('should handle non-string messages', () => {
      const objectMessage = { toString: () => 'Object message' };
      const toastId = toastNotification.showError(objectMessage);
      
      const toastElement = document.getElementById(toastId);
      expect(toastElement.innerHTML).toContain('Object message');
    });
  });

  describe('Toast Tracking', () => {
    it('should track active toasts correctly', () => {
      expect(toastNotification.getActiveCount()).toBe(0);
      
      const toast1 = toastNotification.showError('Message 1');
      expect(toastNotification.getActiveCount()).toBe(1);
      
      const toast2 = toastNotification.showWarning('Message 2');
      expect(toastNotification.getActiveCount()).toBe(2);
      
      toastNotification.dismiss(toast1);
      expect(toastNotification.getActiveCount()).toBe(1);
      
      toastNotification.dismiss(toast2);
      expect(toastNotification.getActiveCount()).toBe(0);
    });

    it('should generate unique toast IDs', () => {
      const toast1 = toastNotification.showError('Message 1');
      const toast2 = toastNotification.showError('Message 2');
      const toast3 = toastNotification.showError('Message 3');
      
      expect(toast1).not.toBe(toast2);
      expect(toast2).not.toBe(toast3);
      expect(toast1).not.toBe(toast3);
    });
  });

  describe('Cleanup', () => {
    it('should clean up container and references on destroy', () => {
      const toast1 = toastNotification.showError('Message 1', { 
        onRetry: vi.fn() 
      });
      const toast2 = toastNotification.showWarning('Message 2');
      
      // Should have container and retry buttons
      expect(document.getElementById('toast-container')).toBeTruthy();
      expect(document.querySelector(`[data-toast-retry="${toast1}"]`)).toBeTruthy();
      
      toastNotification.destroy();
      
      // Should clean up everything
      expect(document.getElementById('toast-container')).toBeFalsy();
      expect(window[`toastRetry_${toast1}`]).toBeFalsy();
      expect(toastNotification.getActiveCount()).toBe(0);
    });
  });
});