/**
 * Property-based tests for Dashboard error handling preservation
 * **Feature: meme-market-dashboard, Property 8: Error handling preservation**
 * **Validates: Requirements 1.5, 5.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { Dashboard } from './Dashboard.js';

describe('Property 8: Error handling preservation', () => {
  let container;
  let dashboard;

  beforeEach(() => {
    // Create container for dashboard
    container = document.createElement('div');
    container.id = 'dashboard-container';
    document.body.appendChild(container);

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock HTMLCanvasElement.getContext to avoid jsdom issues
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      canvas: { width: 800, height: 400 }
    }));

    // Mock Chart.js to avoid initialization issues
    global.Chart = vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      update: vi.fn(),
      resize: vi.fn(),
      data: { datasets: [] },
      options: {}
    }));
  });

  afterEach(() => {
    if (dashboard) {
      dashboard.destroy();
    }
    if (container && container.parentElement) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  /**
   * Simple unit test to verify error handling works before property testing
   */
  it('should handle API failures without throwing exceptions (unit test)', async () => {
    dashboard = new Dashboard(container);

    // Mock both APIs to fail
    vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockRejectedValue(new Error('Stock API failure'));
    vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockRejectedValue(new Error('Reddit API failure'));
    vi.spyOn(dashboard.stockAPI, 'calculateVolatility').mockReturnValue([]);
    vi.spyOn(dashboard.redditAPI, 'calculateMemePopularity').mockReturnValue([]);

    // Initialize dashboard - should handle errors gracefully
    let initializationError = null;
    try {
      await dashboard.initialize();
    } catch (error) {
      initializationError = error;
    }

    // Core property: No unhandled exceptions should be thrown
    expect(initializationError).toBeNull();
    expect(dashboard.isLoading).toBe(false);
    expect(dashboard.container).not.toBeNull();
    expect(dashboard.loadingErrors.length).toBe(2);
  });

  /**
   * Property: For any combination of API failures, the system should handle errors gracefully
   * without throwing unhandled exceptions
   */
  it('should handle various API failure combinations without throwing exceptions', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Whether stock API fails
        fc.boolean(), // Whether reddit API fails
        async (stockFails, redditFails) => {
          // Skip the case where both succeed since that's not testing error handling
          if (!stockFails && !redditFails) {
            return true;
          }

          dashboard = new Dashboard(container);

          // Set up API mocks based on failure flags
          if (stockFails) {
            vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockRejectedValue(new Error('Stock API failure'));
            vi.spyOn(dashboard.stockAPI, 'calculateVolatility').mockReturnValue([]);
          } else {
            vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockResolvedValue([
              { date: new Date('2024-01-01'), open: 21000, high: 21500, low: 20800, close: 21300, volume: 150000000 }
            ]);
            vi.spyOn(dashboard.stockAPI, 'calculateVolatility').mockReturnValue([
              { date: new Date('2024-01-01'), volatility: 2.5, dailyChange: 1.43, dayRange: 3.33, volumeSpike: 120 }
            ]);
          }

          if (redditFails) {
            vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockRejectedValue(new Error('Reddit API failure'));
            vi.spyOn(dashboard.redditAPI, 'calculateMemePopularity').mockReturnValue([]);
          } else {
            vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockResolvedValue([
              { title: 'Test Meme', score: 100, comments: 50, created: new Date('2024-01-01'), url: 'https://reddit.com/test', subreddit: 'test', thumbnail: 'https://example.com/thumb.jpg', author: 'testuser' }
            ]);
            vi.spyOn(dashboard.redditAPI, 'calculateMemePopularity').mockReturnValue([
              { date: new Date('2024-01-01'), popularity: 200, posts: 1, avgScore: 100, totalComments: 50 }
            ]);
          }

          // Initialize dashboard - should handle errors gracefully
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Core property: No unhandled exceptions should be thrown
          return initializationError === null && 
                 dashboard.isLoading === false && 
                 dashboard.container !== null &&
                 dashboard.loadingErrors.length > 0; // Should have captured errors
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Component rendering errors should be handled gracefully
   */
  it('should handle component rendering errors without crashing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('stockPanel', 'memePanel', 'insightsPanel', 'chart'),
        async (componentToBreak) => {
          dashboard = new Dashboard(container);

          // Mock APIs to succeed
          vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockResolvedValue([
            { date: new Date('2024-01-01'), open: 21000, high: 21500, low: 20800, close: 21300, volume: 150000000 }
          ]);
          vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockResolvedValue([
            { title: 'Test Meme', score: 100, comments: 50, created: new Date('2024-01-01'), url: 'https://reddit.com/test', subreddit: 'test', thumbnail: 'https://example.com/thumb.jpg', author: 'testuser' }
          ]);
          vi.spyOn(dashboard.stockAPI, 'calculateVolatility').mockReturnValue([
            { date: new Date('2024-01-01'), volatility: 2.5, dailyChange: 1.43, dayRange: 3.33, volumeSpike: 120 }
          ]);
          vi.spyOn(dashboard.redditAPI, 'calculateMemePopularity').mockReturnValue([
            { date: new Date('2024-01-01'), popularity: 200, posts: 1, avgScore: 100, totalComments: 50 }
          ]);

          // Initialize dashboard
          await dashboard.initialize();

          // Break the specified component
          const renderError = new Error(`${componentToBreak} render error`);
          
          if (componentToBreak === 'stockPanel' && dashboard.stockPanel) {
            vi.spyOn(dashboard.stockPanel, 'render').mockImplementation(() => { throw renderError; });
          } else if (componentToBreak === 'memePanel' && dashboard.memePanel) {
            vi.spyOn(dashboard.memePanel, 'render').mockImplementation(() => { throw renderError; });
          } else if (componentToBreak === 'insightsPanel' && dashboard.insightsPanel) {
            vi.spyOn(dashboard.insightsPanel, 'render').mockImplementation(() => { throw renderError; });
          } else if (componentToBreak === 'chart' && dashboard.chart) {
            vi.spyOn(dashboard.chart, 'update').mockImplementation(() => { throw renderError; });
          }

          // Try to render components - should handle errors gracefully
          let renderingError = null;
          try {
            dashboard._renderAllComponents();
          } catch (error) {
            renderingError = error;
          }

          // Core property: Should handle rendering errors gracefully
          return renderingError === null;
        }
      ),
      { numRuns: 5 }
    );
  });
});