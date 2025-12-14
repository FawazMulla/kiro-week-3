/**
 * Unit tests for TimeRangeFilter component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeRangeFilter } from './TimeRangeFilter.js';

describe('TimeRangeFilter', () => {
  let container;
  let timeRangeFilter;
  let mockCallback;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'test-time-range-filter';
    document.body.appendChild(container);

    // Create mock callback
    mockCallback = vi.fn();
  });

  afterEach(() => {
    // Clean up
    if (timeRangeFilter) {
      timeRangeFilter.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Initialization', () => {
    it('should create TimeRangeFilter with default 30-day selection', () => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
      
      expect(timeRangeFilter.getCurrentTimeRange()).toBe(30);
      expect(container.innerHTML).toContain('time-range-btn');
      expect(container.innerHTML).toContain('30 Days');
    });

    it('should render all three time range options', () => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
      
      const buttons = container.querySelectorAll('.time-range-btn');
      expect(buttons).toHaveLength(3);
      
      // Check that all expected ranges are present
      const ranges = Array.from(buttons).map(btn => parseInt(btn.dataset.range));
      expect(ranges).toEqual([7, 30, 90]);
    });

    it('should mark 30-day button as active by default', () => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
      
      const activeButton = container.querySelector('.time-range-btn.active');
      expect(activeButton).toBeTruthy();
      expect(parseInt(activeButton.dataset.range)).toBe(30);
      expect(activeButton.getAttribute('aria-selected')).toBe('true');
    });

    it('should handle missing container gracefully', () => {
      // Don't expect this to throw
      expect(() => {
        timeRangeFilter = new TimeRangeFilter('non-existent-container', mockCallback);
      }).not.toThrow();
    });
  });

  describe('Time Range Selection', () => {
    beforeEach(() => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
    });

    it('should call callback when time range button is clicked', async () => {
      const sevenDayButton = container.querySelector('[data-range="7"]');
      
      sevenDayButton.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockCallback).toHaveBeenCalledWith(7);
      expect(timeRangeFilter.getCurrentTimeRange()).toBe(7);
    });

    it('should update button states when selection changes', async () => {
      const ninetyDayButton = container.querySelector('[data-range="90"]');
      
      ninetyDayButton.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check that 90-day button is now active
      expect(ninetyDayButton.classList.contains('active')).toBe(true);
      expect(ninetyDayButton.getAttribute('aria-selected')).toBe('true');
      
      // Check that 30-day button is no longer active
      const thirtyDayButton = container.querySelector('[data-range="30"]');
      expect(thirtyDayButton.classList.contains('active')).toBe(false);
      expect(thirtyDayButton.getAttribute('aria-selected')).toBe('false');
    });

    it('should not call callback when same time range is selected', async () => {
      const thirtyDayButton = container.querySelector('[data-range="30"]');
      
      thirtyDayButton.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', errorCallback);
      
      const sevenDayButton = container.querySelector('[data-range="7"]');
      
      // Should not throw
      expect(() => sevenDayButton.click()).not.toThrow();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(errorCallback).toHaveBeenCalledWith(7);
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
    });

    it('should disable buttons during loading', () => {
      timeRangeFilter.showLoading();
      
      const buttons = container.querySelectorAll('.time-range-btn');
      buttons.forEach(button => {
        expect(button.disabled).toBe(true);
        expect(button.style.opacity).toBe('0.6');
        expect(button.style.cursor).toBe('not-allowed');
      });
    });

    it('should re-enable buttons after loading', () => {
      timeRangeFilter.showLoading();
      timeRangeFilter.hideLoading();
      
      const buttons = container.querySelectorAll('.time-range-btn');
      buttons.forEach(button => {
        expect(button.disabled).toBe(false);
        expect(button.style.opacity).toBe('1');
        expect(button.style.cursor).toBe('pointer');
      });
    });

    it('should not respond to clicks during loading', async () => {
      timeRangeFilter.showLoading();
      
      const sevenDayButton = container.querySelector('[data-range="7"]');
      sevenDayButton.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockCallback).not.toHaveBeenCalled();
      expect(timeRangeFilter.getCurrentTimeRange()).toBe(30); // Should remain unchanged
    });
  });

  describe('Programmatic Control', () => {
    beforeEach(() => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
    });

    it('should allow setting time range programmatically', () => {
      timeRangeFilter.setTimeRange(90);
      
      expect(timeRangeFilter.getCurrentTimeRange()).toBe(90);
      
      const ninetyDayButton = container.querySelector('[data-range="90"]');
      expect(ninetyDayButton.classList.contains('active')).toBe(true);
    });

    it('should ignore invalid time ranges', () => {
      const originalRange = timeRangeFilter.getCurrentTimeRange();
      
      timeRangeFilter.setTimeRange(365); // Invalid range
      
      expect(timeRangeFilter.getCurrentTimeRange()).toBe(originalRange);
    });

    it('should return available time range options', () => {
      const options = timeRangeFilter.getTimeRangeOptions();
      
      expect(options).toHaveLength(3);
      expect(options.map(opt => opt.value)).toEqual([7, 30, 90]);
      expect(options.map(opt => opt.label)).toEqual(['7 Days', '30 Days', '90 Days']);
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
    });

    it('should render both full and short labels', () => {
      const buttons = container.querySelectorAll('.time-range-btn');
      
      buttons.forEach(button => {
        const fullLabel = button.querySelector('.hidden.sm\\:inline');
        const shortLabel = button.querySelector('.sm\\:hidden');
        
        expect(fullLabel).toBeTruthy();
        expect(shortLabel).toBeTruthy();
      });
    });

    it('should have proper ARIA attributes for accessibility', () => {
      const buttons = container.querySelectorAll('.time-range-btn');
      
      buttons.forEach(button => {
        expect(button.getAttribute('role')).toBe('tab');
        expect(button.getAttribute('aria-selected')).toMatch(/^(true|false)$/);
      });
      
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
      expect(tablist.getAttribute('aria-label')).toBe('Time range selection');
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      timeRangeFilter = new TimeRangeFilter('test-time-range-filter', mockCallback);
    });

    it('should clean up DOM when destroyed', () => {
      expect(container.innerHTML).not.toBe('');
      
      timeRangeFilter.destroy();
      
      expect(container.innerHTML).toBe('');
    });
  });
});