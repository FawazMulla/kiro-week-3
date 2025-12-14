/**
 * Tests for StockPanel component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StockPanel } from './StockPanel.js';

describe('StockPanel', () => {
  let container;
  let panel;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'test-stock-panel';
    document.body.appendChild(container);
    
    panel = new StockPanel('test-stock-panel');
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('constructor', () => {
    it('should create a StockPanel instance', () => {
      expect(panel).toBeInstanceOf(StockPanel);
      expect(panel.containerId).toBe('test-stock-panel');
    });
  });

  describe('render', () => {
    it('should throw error if container not found', () => {
      const invalidPanel = new StockPanel('non-existent-id');
      expect(() => {
        invalidPanel.render([], []);
      }).toThrow('Container element with id "non-existent-id" not found');
    });

    it('should render empty state when no stock data provided', () => {
      panel.render([], []);
      expect(container.innerHTML).toContain('No stock data available');
    });

    it('should render stock data when provided', () => {
      const stockData = [
        {
          date: new Date('2024-01-01'),
          open: 21000,
          high: 21500,
          low: 20800,
          close: 21300,
          volume: 150000000
        }
      ];
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.5 }
      ];

      panel.render(stockData, volatilityData);

      expect(container.innerHTML).toContain('NIFTY 50');
      expect(container.innerHTML).toContain('₹21,300.00');
      expect(container.innerHTML).toContain('High');
      expect(container.innerHTML).toContain('Low');
      expect(container.innerHTML).toContain('Volume');
    });

    it('should display daily change with correct color coding', () => {
      const stockDataPositive = [
        {
          date: new Date('2024-01-01'),
          open: 21000,
          high: 21500,
          low: 20800,
          close: 21300,
          volume: 150000000
        }
      ];

      panel.render(stockDataPositive, []);
      expect(container.innerHTML).toContain('text-green-400');
      expect(container.innerHTML).toContain('+1.43%');

      const stockDataNegative = [
        {
          date: new Date('2024-01-01'),
          open: 21000,
          high: 21500,
          low: 20800,
          close: 20700,
          volume: 150000000
        }
      ];

      panel.render(stockDataNegative, []);
      expect(container.innerHTML).toContain('text-red-400');
      expect(container.innerHTML).toContain('-1.43%');
    });

    it('should calculate and display 7-day average volatility', () => {
      const stockData = [
        {
          date: new Date('2024-01-01'),
          open: 21000,
          high: 21500,
          low: 20800,
          close: 21300,
          volume: 150000000
        }
      ];
      const volatilityData = [
        { date: new Date('2023-12-26'), volatility: 2.0 },
        { date: new Date('2023-12-27'), volatility: 2.2 },
        { date: new Date('2023-12-28'), volatility: 2.4 },
        { date: new Date('2023-12-29'), volatility: 2.6 },
        { date: new Date('2023-12-30'), volatility: 2.8 },
        { date: new Date('2023-12-31'), volatility: 3.0 },
        { date: new Date('2024-01-01'), volatility: 3.2 }
      ];

      panel.render(stockData, volatilityData);

      // Average should be (2.0 + 2.2 + 2.4 + 2.6 + 2.8 + 3.0 + 3.2) / 7 = 2.6
      expect(container.innerHTML).toContain('7-Day Avg Volatility');
      expect(container.innerHTML).toContain('+2.60%');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with Indian Rupee symbol', () => {
      expect(panel.formatCurrency(21000)).toBe('₹21,000.00');
      expect(panel.formatCurrency(21000.50)).toBe('₹21,000.50');
      expect(panel.formatCurrency(1234567.89)).toBe('₹12,34,567.89');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage with + prefix and green color', () => {
      const result = panel.formatPercentage(2.5);
      expect(result.formatted).toBe('+2.50%');
      expect(result.colorClass).toBe('text-green-400');
    });

    it('should format negative percentage with - prefix and red color', () => {
      const result = panel.formatPercentage(-1.75);
      expect(result.formatted).toBe('-1.75%');
      expect(result.colorClass).toBe('text-red-400');
    });

    it('should format zero percentage with + prefix and green color', () => {
      const result = panel.formatPercentage(0);
      expect(result.formatted).toBe('+0.00%');
      expect(result.colorClass).toBe('text-green-400');
    });
  });

  describe('_calculateDailyChange', () => {
    it('should calculate daily change percentage correctly', () => {
      const change = panel._calculateDailyChange(21000, 21300);
      expect(change).toBeCloseTo(1.43, 2);
    });

    it('should handle zero open price', () => {
      const change = panel._calculateDailyChange(0, 21300);
      expect(change).toBe(0);
    });

    it('should calculate negative change correctly', () => {
      const change = panel._calculateDailyChange(21000, 20700);
      expect(change).toBeCloseTo(-1.43, 2);
    });
  });

  describe('_calculate7DayAvgVolatility', () => {
    it('should calculate average of last 7 days', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.0 },
        { date: new Date('2024-01-02'), volatility: 2.2 },
        { date: new Date('2024-01-03'), volatility: 2.4 },
        { date: new Date('2024-01-04'), volatility: 2.6 },
        { date: new Date('2024-01-05'), volatility: 2.8 },
        { date: new Date('2024-01-06'), volatility: 3.0 },
        { date: new Date('2024-01-07'), volatility: 3.2 }
      ];

      const avg = panel._calculate7DayAvgVolatility(volatilityData);
      expect(avg).toBeCloseTo(2.6, 2);
    });

    it('should handle less than 7 days of data', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 2.0 },
        { date: new Date('2024-01-02'), volatility: 3.0 }
      ];

      const avg = panel._calculate7DayAvgVolatility(volatilityData);
      expect(avg).toBe(2.5);
    });

    it('should return 0 for empty data', () => {
      const avg = panel._calculate7DayAvgVolatility([]);
      expect(avg).toBe(0);
    });

    it('should return 0 for null data', () => {
      const avg = panel._calculate7DayAvgVolatility(null);
      expect(avg).toBe(0);
    });

    it('should only use last 7 days when more data available', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 1.0 },
        { date: new Date('2024-01-02'), volatility: 1.0 },
        { date: new Date('2024-01-03'), volatility: 1.0 },
        { date: new Date('2024-01-04'), volatility: 2.0 },
        { date: new Date('2024-01-05'), volatility: 2.0 },
        { date: new Date('2024-01-06'), volatility: 2.0 },
        { date: new Date('2024-01-07'), volatility: 2.0 },
        { date: new Date('2024-01-08'), volatility: 2.0 },
        { date: new Date('2024-01-09'), volatility: 2.0 },
        { date: new Date('2024-01-10'), volatility: 2.0 }
      ];

      const avg = panel._calculate7DayAvgVolatility(volatilityData);
      // Should only use last 7 days (all 2.0)
      expect(avg).toBe(2.0);
    });
  });

  describe('_formatVolume', () => {
    it('should format volume in billions', () => {
      const formatted = panel._formatVolume(1500000000);
      expect(formatted).toBe('1.50B');
    });

    it('should format volume in millions', () => {
      const formatted = panel._formatVolume(150000000);
      expect(formatted).toBe('150.00M');
    });

    it('should format volume in thousands', () => {
      const formatted = panel._formatVolume(150000);
      expect(formatted).toBe('150.00K');
    });

    it('should format small volume as-is', () => {
      const formatted = panel._formatVolume(500);
      expect(formatted).toBe('500');
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should display loading state when showLoading is called', () => {
      panel.showLoading();

      expect(container.innerHTML).toContain('Loading stock data...');
      expect(container.innerHTML).toContain('animate-spin');
    });

    it('should display custom loading message', () => {
      panel.showLoading('Fetching NIFTY data...');

      expect(container.innerHTML).toContain('Fetching NIFTY data...');
    });

    it('should show "Still loading..." after 5 seconds', () => {
      panel.showLoading('Initial message');

      expect(container.innerHTML).toContain('Initial message');

      vi.advanceTimersByTime(5000);

      expect(container.innerHTML).toContain('Still loading...');
    });

    it('should clear loading state when hideLoading is called', () => {
      panel.showLoading();
      expect(panel.longLoadingTimeout).not.toBeNull();

      panel.hideLoading();
      expect(panel.longLoadingTimeout).toBeNull();
    });

    it('should hide loading state when render is called', () => {
      panel.showLoading();
      expect(container.innerHTML).toContain('Loading stock data...');

      const stockData = [
        {
          date: new Date('2024-01-01'),
          open: 21000,
          high: 21500,
          low: 20800,
          close: 21300,
          volume: 150000000
        }
      ];

      panel.render(stockData, []);

      expect(container.innerHTML).not.toContain('Loading stock data...');
      expect(container.innerHTML).toContain('₹21,300.00');
    });

    it('should not show "Still loading..." after hideLoading is called', () => {
      panel.showLoading();
      panel.hideLoading();

      vi.advanceTimersByTime(5000);

      // Should not update since loading was hidden
      expect(container.innerHTML).not.toContain('Still loading...');
    });
  });
});
