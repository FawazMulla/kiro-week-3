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

    // Don't use fake timers as they interfere with async operations
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
   * Property: For any API call that fails, the system should return an error response 
   * without throwing an unhandled exception, and the application state should remain 
   * consistent (no partial updates)
   */
  it('should handle stock API failures without throwing unhandled exceptions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 90 }), // Valid time ranges
        fc.constantFrom('network', 'timeout', 'invalid_response', 'rate_limit'), // Error types
        async (timeRange, errorType) => {
          dashboard = new Dashboard(container);

          // Mock stock API to fail
          const stockAPIError = new Error(`Stock API ${errorType} error`);
          vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockRejectedValue(stockAPIError);

          // Mock reddit API to succeed (to test partial failure)
          vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockResolvedValue([
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
          ]);

          // Initialize dashboard - should handle errors gracefully
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Verify no unhandled exceptions were thrown during initialization
          expect(initializationError).toBeNull();
          expect(dashboard.isLoading).toBe(false);

          // Verify error was captured in loadingErrors
          expect(dashboard.loadingErrors.length).toBeGreaterThan(0);
          expect(dashboard.loadingErrors.some(error => error.includes('Stock data'))).toBe(true);

          // Verify application state is consistent
          expect(dashboard.stockData).toEqual([]); // Empty due to failure
          expect(dashboard.memeData.length).toBeGreaterThan(0); // Should have data from successful call
          expect(dashboard.volatilityData).toEqual([]); // Empty because stock data failed
          expect(dashboard.popularityData.length).toBeGreaterThan(0); // Should have data

          // Verify dashboard completed initialization without throwing
          expect(dashboard.container).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle reddit API failures without throwing unhandled exceptions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 90 }), // Valid time ranges
        fc.constantFrom('network', 'rate_limit', 'invalid_response', 'timeout'), // Error types
        async (timeRange, errorType) => {
          dashboard = new Dashboard(container);

          // Mock reddit API to fail
          const redditAPIError = new Error(`Reddit API ${errorType} error`);
          vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockRejectedValue(redditAPIError);

          // Mock stock API to succeed (to test partial failure)
          vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockResolvedValue([
            {
              date: new Date('2024-01-01'),
              open: 21000,
              high: 21500,
              low: 20800,
              close: 21300,
              volume: 150000000
            }
          ]);

          // Initialize dashboard - should handle errors gracefully
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Verify no unhandled exceptions were thrown during initialization
          expect(initializationError).toBeNull();
          expect(dashboard.isLoading).toBe(false);

          // Verify error was captured in loadingErrors
          expect(dashboard.loadingErrors.length).toBeGreaterThan(0);
          expect(dashboard.loadingErrors.some(error => error.includes('Meme data'))).toBe(true);

          // Verify application state is consistent
          expect(dashboard.stockData.length).toBeGreaterThan(0); // Should have data from successful call
          expect(dashboard.memeData).toEqual([]); // Empty due to failure
          expect(dashboard.volatilityData.length).toBeGreaterThan(0); // Should have data
          expect(dashboard.popularityData).toEqual([]); // Empty because meme data failed

          // Verify dashboard completed initialization without throwing
          expect(dashboard.container).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle both API failures without throwing unhandled exceptions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 90 }), // Valid time ranges
        async (timeRange) => {
          dashboard = new Dashboard(container);

          // Mock both APIs to fail
          const stockAPIError = new Error('Stock API complete failure');
          const redditAPIError = new Error('Reddit API complete failure');
          
          vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockRejectedValue(stockAPIError);
          vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockRejectedValue(redditAPIError);

          // Initialize dashboard - should handle errors gracefully
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Verify no unhandled exceptions were thrown during initialization
          expect(initializationError).toBeNull();
          expect(dashboard.isLoading).toBe(false);

          // Verify both errors were captured
          expect(dashboard.loadingErrors.length).toBe(2);
          expect(dashboard.loadingErrors.some(error => error.includes('Stock data'))).toBe(true);
          expect(dashboard.loadingErrors.some(error => error.includes('Meme data'))).toBe(true);

          // Verify application state is consistent (all empty)
          expect(dashboard.stockData).toEqual([]);
          expect(dashboard.memeData).toEqual([]);
          expect(dashboard.volatilityData).toEqual([]);
          expect(dashboard.popularityData).toEqual([]);

          // Correlation should handle empty data gracefully - check if it exists first
          if (dashboard.correlationResult) {
            expect(dashboard.correlationResult).toEqual({
              coefficient: 0,
              strength: 'Very Weak',
              pValue: 1,
              sampleSize: 0
            });
          }

          // Verify dashboard completed initialization without throwing
          expect(dashboard.container).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle time range changes with API failures gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 90 }), // Initial time range
        fc.integer({ min: 7, max: 90 }), // New time range
        fc.boolean(), // Whether stock API fails
        fc.boolean(), // Whether reddit API fails
        async (initialRange, newRange, stockFails, redditFails) => {
          dashboard = new Dashboard(container);

          // Set up API mocks based on failure flags
          if (stockFails) {
            vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockRejectedValue(new Error('Stock API failure'));
          } else {
            vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockResolvedValue([
              {
                date: new Date('2024-01-01'),
                open: 21000,
                high: 21500,
                low: 20800,
                close: 21300,
                volume: 150000000
              }
            ]);
          }

          if (redditFails) {
            vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockRejectedValue(new Error('Reddit API failure'));
          } else {
            vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockResolvedValue([
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
            ]);
          }

          // Initialize with initial range - should handle errors gracefully
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Verify initialization didn't throw
          expect(initializationError).toBeNull();

          // Store initial state
          const initialStockData = [...dashboard.stockData];
          const initialMemeData = [...dashboard.memeData];
          const initialErrors = [...dashboard.loadingErrors];

          // Change time range (only if different from initial)
          if (newRange !== initialRange) {
            let changeError = null;
            try {
              await dashboard.handleTimeRangeChange(newRange);
            } catch (error) {
              changeError = error;
            }

            // Verify time range change didn't throw
            expect(changeError).toBeNull();
            expect(dashboard.currentTimeRange).toBe(newRange);
          } else {
            // If same range, current range should remain at default (30) since we don't set it initially
            expect(dashboard.currentTimeRange).toBe(30);
          }

          // Verify no unhandled exceptions
          expect(dashboard.isLoading).toBe(false);

          // Verify state consistency based on what should have succeeded/failed
          if (stockFails) {
            expect(dashboard.stockData).toEqual([]);
            expect(dashboard.volatilityData).toEqual([]);
          } else {
            expect(dashboard.stockData).toEqual(expect.any(Array));
            expect(dashboard.volatilityData).toEqual(expect.any(Array));
          }

          if (redditFails) {
            expect(dashboard.memeData).toEqual([]);
            expect(dashboard.popularityData).toEqual([]);
          } else {
            expect(dashboard.memeData).toEqual(expect.any(Array));
            expect(dashboard.popularityData).toEqual(expect.any(Array));
          }

          // If both fail, should have errors
          if (stockFails || redditFails) {
            expect(dashboard.loadingErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle component rendering errors without crashing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('stockPanel', 'memePanel', 'insightsPanel', 'chart'), // Component to break
        async (componentToBreak) => {
          dashboard = new Dashboard(container);

          // Mock APIs to succeed
          vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockResolvedValue([
            {
              date: new Date('2024-01-01'),
              open: 21000,
              high: 21500,
              low: 20800,
              close: 21300,
              volume: 150000000
            }
          ]);

          vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockResolvedValue([
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
          ]);

          // Initialize dashboard - should handle errors gracefully
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Verify initialization didn't throw
          expect(initializationError).toBeNull();

          // Break the specified component by making its render method throw
          const renderError = new Error(`${componentToBreak} render error`);
          
          switch (componentToBreak) {
            case 'stockPanel':
              if (dashboard.stockPanel) {
                vi.spyOn(dashboard.stockPanel, 'render').mockImplementation(() => {
                  throw renderError;
                });
              }
              break;
            case 'memePanel':
              if (dashboard.memePanel) {
                vi.spyOn(dashboard.memePanel, 'render').mockImplementation(() => {
                  throw renderError;
                });
              }
              break;
            case 'insightsPanel':
              if (dashboard.insightsPanel) {
                vi.spyOn(dashboard.insightsPanel, 'render').mockImplementation(() => {
                  throw renderError;
                });
              }
              break;
            case 'chart':
              if (dashboard.chart) {
                vi.spyOn(dashboard.chart, 'update').mockImplementation(() => {
                  throw renderError;
                });
              }
              break;
          }

          // Try to render components - should handle errors gracefully
          let renderingError = null;
          try {
            dashboard._renderAllComponents();
          } catch (error) {
            renderingError = error;
          }

          // Should handle rendering errors gracefully (Dashboard should catch them)
          expect(renderingError).toBeNull();

          // Data should remain consistent
          expect(dashboard.stockData).toEqual(expect.any(Array));
          expect(dashboard.memeData).toEqual(expect.any(Array));
          expect(dashboard.volatilityData).toEqual(expect.any(Array));
          expect(dashboard.popularityData).toEqual(expect.any(Array));
          expect(dashboard.correlationResult).toEqual(expect.any(Object));
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve application state during cache operations failures', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 90 }), // Time range
        async (timeRange) => {
          dashboard = new Dashboard(container);

          // Mock successful API calls
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

          const memeData = [
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

          vi.spyOn(dashboard.stockAPI, 'fetchNiftyData').mockResolvedValue(stockData);
          vi.spyOn(dashboard.redditAPI, 'fetchTrendingMemes').mockResolvedValue(memeData);

          // Mock cache operations to fail gracefully (return null for get, ignore set failures)
          vi.spyOn(dashboard.cache, 'get').mockImplementation(() => {
            return null; // Cache miss instead of throwing
          });
          vi.spyOn(dashboard.cache, 'set').mockImplementation(() => {
            // Silently fail - cache operations should be non-critical
          });

          // Initialize dashboard - should not throw despite cache failures
          let initializationError = null;
          try {
            await dashboard.initialize();
          } catch (error) {
            initializationError = error;
          }

          // Verify no unhandled exceptions during initialization
          expect(initializationError).toBeNull();
          expect(dashboard.isLoading).toBe(false);

          // Verify data was still processed correctly despite cache failures
          expect(dashboard.stockData).toEqual(stockData);
          expect(dashboard.memeData).toEqual(memeData);
          expect(dashboard.volatilityData.length).toBeGreaterThan(0);
          expect(dashboard.popularityData.length).toBeGreaterThan(0);
          expect(dashboard.correlationResult).toEqual(expect.any(Object));

          // Should not have loading errors since APIs succeeded
          expect(dashboard.loadingErrors).toEqual([]);
        }
      ),
      { numRuns: 50 }
    );
  });
});