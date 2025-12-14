/**
 * Property-based tests for loading state completeness
 * **Feature: meme-market-dashboard, Property 10: Loading state completeness**
 * **Validates: Requirements 8.1, 8.2, 8.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { LoadingIndicator } from './LoadingIndicator.js';
import { StockPanel } from './StockPanel.js';
import { MemePanel } from './MemePanel.js';
import { InsightsPanel } from './InsightsPanel.js';
import { CorrelationChart } from './CorrelationChart.js';

describe('Property 10: Loading state completeness', () => {
  let container;
  let canvas;

  beforeEach(() => {
    // Create container for panels
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create canvas for chart
    canvas = document.createElement('canvas');
    canvas.id = 'test-canvas';
    const chartContainer = document.createElement('div');
    chartContainer.appendChild(canvas);
    document.body.appendChild(chartContainer);

    vi.useFakeTimers();
  });

  afterEach(() => {
    if (container && container.parentElement) {
      document.body.removeChild(container);
    }
    if (canvas && canvas.parentElement && canvas.parentElement.parentElement) {
      document.body.removeChild(canvas.parentElement);
    }
    vi.restoreAllMocks();
  });

  /**
   * Property: For any component with loading state, a loading indicator should be 
   * visible from the moment showLoading is called until either data is loaded 
   * (render/update called) or an error occurs
   */
  it('should show loading indicator during entire fetch operation for LoadingIndicator', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4999 }), // Time before completion (less than 5 seconds)
        (timeBeforeCompletion) => {
          const indicator = new LoadingIndicator('test-container');

          // Start loading with default message
          indicator.show();

          // Verify loading indicator is present
          expect(container.innerHTML).toContain('animate-spin');
          expect(container.innerHTML).toContain('Loading...');

          // Simulate time passing (but less than 5 seconds)
          vi.advanceTimersByTime(timeBeforeCompletion);

          // Loading indicator should still be present
          expect(container.innerHTML).toContain('animate-spin');

          // Complete loading
          indicator.hide();

          // Loading indicator should be removed
          expect(container.innerHTML).toBe('');

          // Clean up
          indicator.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show loading indicator during entire fetch operation for StockPanel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4999 }), // Time before data arrives
        (timeBeforeData) => {
          const panel = new StockPanel('test-container');

          // Start loading
          panel.showLoading();

          // Verify loading indicator is present
          expect(container.innerHTML).toContain('animate-spin');
          expect(container.innerHTML).toContain('Loading stock data...');

          // Simulate time passing
          vi.advanceTimersByTime(timeBeforeData);

          // Loading indicator should still be present
          expect(container.innerHTML).toContain('animate-spin');

          // Data arrives - render panel
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

          // Loading indicator should be removed
          expect(container.innerHTML).not.toContain('animate-spin');
          expect(container.innerHTML).not.toContain('Loading stock data...');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show loading indicator during entire fetch operation for MemePanel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4999 }), // Time before data arrives
        (timeBeforeData) => {
          const panel = new MemePanel('test-container');

          // Start loading
          panel.showLoading();

          // Verify loading indicator is present
          expect(container.innerHTML).toContain('animate-spin');
          expect(container.innerHTML).toContain('Loading meme data...');

          // Simulate time passing
          vi.advanceTimersByTime(timeBeforeData);

          // Loading indicator should still be present
          expect(container.innerHTML).toContain('animate-spin');

          // Data arrives - render panel
          const memes = [
            {
              title: 'Test Meme',
              score: 100,
              comments: 50,
              created: new Date('2024-01-01'),
              url: 'https://reddit.com/test',
              subreddit: 'test',
              thumbnail: 'https://example.com/thumb.jpg',
              author: 'testuser'
            }
          ];
          panel.render(memes, []);

          // Loading indicator should be removed
          expect(container.innerHTML).not.toContain('animate-spin');
          expect(container.innerHTML).not.toContain('Loading meme data...');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show loading indicator during entire fetch operation for InsightsPanel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4999 }), // Time before data arrives
        (timeBeforeData) => {
          const panel = new InsightsPanel('test-container');

          // Start loading
          panel.showLoading();

          // Verify loading indicator is present
          expect(container.innerHTML).toContain('animate-spin');
          expect(container.innerHTML).toContain('Calculating insights...');

          // Simulate time passing
          vi.advanceTimersByTime(timeBeforeData);

          // Loading indicator should still be present
          expect(container.innerHTML).toContain('animate-spin');

          // Data arrives - render panel
          const correlation = {
            coefficient: 0.75,
            strength: 'Strong',
            pValue: 0.01,
            sampleSize: 30
          };
          const volatilityData = [
            { date: new Date('2024-01-01'), volatility: 2.5 }
          ];
          const popularityData = [
            { date: new Date('2024-01-01'), popularity: 1000 }
          ];
          panel.render(correlation, volatilityData, popularityData);

          // Loading indicator should be removed
          expect(container.innerHTML).not.toContain('animate-spin');
          expect(container.innerHTML).not.toContain('Calculating insights...');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show loading indicator during entire fetch operation for CorrelationChart', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4999 }), // Time before data arrives
        (timeBeforeData) => {
          const chart = new CorrelationChart('test-canvas');

          // Start loading
          chart.showLoading();

          // Verify loading indicator is present
          const loadingContainer = canvas.parentElement.querySelector('.chart-loading-container');
          expect(loadingContainer).not.toBeNull();
          expect(loadingContainer.innerHTML).toContain('animate-spin');
          expect(loadingContainer.innerHTML).toContain('Loading chart data...');

          // Canvas should be hidden
          expect(canvas.style.display).toBe('none');

          // Simulate time passing
          vi.advanceTimersByTime(timeBeforeData);

          // Loading indicator should still be present
          expect(loadingContainer.innerHTML).toContain('animate-spin');

          // Data arrives - initialize chart
          const volatilityData = [
            { date: new Date('2024-01-01'), volatility: 2.5 }
          ];
          const popularityData = [
            { date: new Date('2024-01-01'), popularity: 1000 }
          ];
          chart.initialize(volatilityData, popularityData);

          // Loading indicator should be hidden
          expect(loadingContainer.style.display).toBe('none');
          // Canvas should be visible
          expect(canvas.style.display).toBe('block');

          // Clean up
          chart.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show "Still loading..." message after 5 seconds for any component', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('LoadingIndicator', 'StockPanel', 'MemePanel', 'InsightsPanel'),
        (componentType) => {
          let component;
          
          switch (componentType) {
            case 'LoadingIndicator':
              component = new LoadingIndicator('test-container');
              component.show();
              break;
            case 'StockPanel':
              component = new StockPanel('test-container');
              component.showLoading();
              break;
            case 'MemePanel':
              component = new MemePanel('test-container');
              component.showLoading();
              break;
            case 'InsightsPanel':
              component = new InsightsPanel('test-container');
              component.showLoading();
              break;
          }

          // Initially should not show "Still loading..."
          expect(container.innerHTML).not.toContain('Still loading...');

          // Advance time by 5 seconds
          vi.advanceTimersByTime(5000);

          // Should now show "Still loading..."
          expect(container.innerHTML).toContain('Still loading...');

          // Clean up
          if (componentType === 'LoadingIndicator') {
            component.destroy();
          } else {
            component.hideLoading();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show loading indicator after error occurs (empty data)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('StockPanel', 'MemePanel', 'InsightsPanel'),
        (componentType) => {
          let component;
          
          switch (componentType) {
            case 'StockPanel':
              component = new StockPanel('test-container');
              component.showLoading();
              // Simulate error by rendering with empty data
              component.render([], []);
              break;
            case 'MemePanel':
              component = new MemePanel('test-container');
              component.showLoading();
              // Simulate error by rendering with empty data
              component.render([], []);
              break;
            case 'InsightsPanel':
              component = new InsightsPanel('test-container');
              component.showLoading();
              // Simulate error by rendering with empty data
              component.render(null, [], []);
              break;
          }

          // Loading indicator should be removed even though data is empty
          expect(container.innerHTML).not.toContain('animate-spin');
          expect(container.innerHTML).not.toContain('Loading');
        }
      ),
      { numRuns: 100 }
    );
  });
});
