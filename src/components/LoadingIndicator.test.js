/**
 * Unit tests for LoadingIndicator component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingIndicator } from './LoadingIndicator.js';

describe('LoadingIndicator', () => {
  let container;
  let loadingIndicator;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.id = 'test-loading-container';
    document.body.appendChild(container);

    loadingIndicator = new LoadingIndicator('test-loading-container');

    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentElement) {
      document.body.removeChild(container);
    }
    loadingIndicator = null;

    // Restore timers
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a LoadingIndicator instance with correct properties', () => {
      expect(loadingIndicator.containerId).toBe('test-loading-container');
      expect(loadingIndicator.container).toBeNull();
      expect(loadingIndicator.longLoadingTimeout).toBeNull();
    });
  });

  describe('show', () => {
    it('should display loading spinner with default message', () => {
      loadingIndicator.show();

      expect(container.innerHTML).toContain('Loading...');
      expect(container.innerHTML).toContain('animate-spin');
    });

    it('should display loading spinner with custom message', () => {
      loadingIndicator.show('Custom loading message');

      expect(container.innerHTML).toContain('Custom loading message');
      expect(container.innerHTML).toContain('animate-spin');
    });

    it('should throw error if container not found', () => {
      const invalidIndicator = new LoadingIndicator('non-existent-container');
      
      expect(() => invalidIndicator.show()).toThrow(
        'Container element with id "non-existent-container" not found'
      );
    });

    it('should set timeout for long loading message', () => {
      loadingIndicator.show();

      expect(loadingIndicator.longLoadingTimeout).not.toBeNull();
    });

    it('should show "Still loading..." message after 5 seconds', () => {
      loadingIndicator.show('Initial message');

      expect(container.innerHTML).toContain('Initial message');

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);

      expect(container.innerHTML).toContain('Still loading...');
    });
  });

  describe('hide', () => {
    it('should clear container content', () => {
      loadingIndicator.show();
      expect(container.innerHTML).not.toBe('');

      loadingIndicator.hide();
      expect(container.innerHTML).toBe('');
    });

    it('should clear long loading timeout', () => {
      loadingIndicator.show();
      expect(loadingIndicator.longLoadingTimeout).not.toBeNull();

      loadingIndicator.hide();
      expect(loadingIndicator.longLoadingTimeout).toBeNull();
    });

    it('should not show "Still loading..." message after hide is called', () => {
      loadingIndicator.show('Initial message');
      loadingIndicator.hide();

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);

      // Container should still be empty
      expect(container.innerHTML).toBe('');
    });
  });

  describe('destroy', () => {
    it('should call hide and clean up resources', () => {
      loadingIndicator.show();
      
      loadingIndicator.destroy();

      expect(container.innerHTML).toBe('');
      expect(loadingIndicator.container).toBeNull();
      expect(loadingIndicator.longLoadingTimeout).toBeNull();
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML in messages to prevent XSS', () => {
      const maliciousMessage = '<script>alert("XSS")</script>';
      loadingIndicator.show(maliciousMessage);

      // Should not contain actual script tag
      expect(container.innerHTML).not.toContain('<script>');
      // Should contain escaped version
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });
  });
});
