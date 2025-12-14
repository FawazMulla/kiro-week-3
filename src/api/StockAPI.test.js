import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StockAPI } from './StockAPI.js';

describe('StockAPI', () => {
  let stockAPI;

  beforeEach(() => {
    stockAPI = new StockAPI();
  });

  describe('Unit Tests', () => {
    describe('calculateDailyChange', () => {
      it('should calculate positive daily change correctly', () => {
        const result = stockAPI.calculateDailyChange(100, 110);
        expect(result).toBeCloseTo(10, 2);
      });

      it('should calculate negative daily change correctly', () => {
        const result = stockAPI.calculateDailyChange(100, 90);
        expect(result).toBeCloseTo(-10, 2);
      });

      it('should handle zero open price', () => {
        const result = stockAPI.calculateDailyChange(0, 100);
        expect(result).toBe(0);
      });
    });

    describe('calculateDayRange', () => {
      it('should calculate day range correctly', () => {
        const result = stockAPI.calculateDayRange(110, 90, 100);
        expect(result).toBeCloseTo(20, 2);
      });

      it('should handle zero open price', () => {
        const result = stockAPI.calculateDayRange(110, 90, 0);
        expect(result).toBe(0);
      });
    });

    describe('calculateVolumeSpike', () => {
      it('should calculate volume increase correctly', () => {
        const result = stockAPI.calculateVolumeSpike(200, 100);
        expect(result).toBeCloseTo(200, 2);
      });

      it('should calculate volume decrease correctly', () => {
        const result = stockAPI.calculateVolumeSpike(50, 100);
        expect(result).toBeCloseTo(50, 2);
      });

      it('should handle zero previous volume', () => {
        const result = stockAPI.calculateVolumeSpike(100, 0);
        expect(result).toBe(100);
      });
    });

    describe('parseYahooFinanceResponse', () => {
      it('should parse valid Yahoo Finance response', () => {
        const mockResponse = {
          chart: {
            result: [{
              timestamp: [1609459200, 1609545600],
              indicators: {
                quote: [{
                  open: [100, 105],
                  high: [110, 115],
                  low: [95, 100],
                  close: [108, 112],
                  volume: [1000000, 1200000]
                }]
              }
            }]
          }
        };

        const result = stockAPI.parseYahooFinanceResponse(mockResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          open: 100,
          high: 110,
          low: 95,
          close: 108,
          volume: 1000000
        });
        expect(result[0].date).toBeInstanceOf(Date);
      });

      it('should skip entries with null values', () => {
        const mockResponse = {
          chart: {
            result: [{
              timestamp: [1609459200, 1609545600, 1609632000],
              indicators: {
                quote: [{
                  open: [100, null, 105],
                  high: [110, null, 115],
                  low: [95, null, 100],
                  close: [108, null, 112],
                  volume: [1000000, null, 1200000]
                }]
              }
            }]
          }
        };

        const result = stockAPI.parseYahooFinanceResponse(mockResponse);
        
        expect(result).toHaveLength(2);
      });

      it('should throw error for invalid response format', () => {
        expect(() => stockAPI.parseYahooFinanceResponse({})).toThrow('Invalid Yahoo Finance response format');
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: meme-market-dashboard, Property 2: Volatility calculation consistency**
     * **Validates: Requirements 5.2**
     * 
     * For any valid stock data array with at least 2 elements, calculating volatility 
     * should produce an array of the same length, and each volatility value should be non-negative.
     */
    it('Property 2: Volatility calculation consistency', () => {
      fc.assert(
        fc.property(
          // Generate array of stock data with length between 2 and 100
          fc.array(
            fc.record({
              date: fc.date(),
              open: fc.float({ min: 1, max: 100000, noNaN: true }),
              high: fc.float({ min: 1, max: 100000, noNaN: true }),
              low: fc.float({ min: 1, max: 100000, noNaN: true }),
              close: fc.float({ min: 1, max: 100000, noNaN: true }),
              volume: fc.integer({ min: 1, max: 1000000000 })
            }).map(data => {
              // Ensure high >= low and both are reasonable relative to open
              const basePrice = data.open;
              const range = basePrice * 0.1; // 10% range
              return {
                ...data,
                high: Math.max(data.open, data.close) + Math.abs(data.high % range),
                low: Math.min(data.open, data.close) - Math.abs(data.low % range)
              };
            }),
            { minLength: 2, maxLength: 100 }
          ),
          (stockData) => {
            const volatilityData = stockAPI.calculateVolatility(stockData);
            
            // Property 1: Output length should match input length
            expect(volatilityData).toHaveLength(stockData.length);
            
            // Property 2: All volatility values should be non-negative
            volatilityData.forEach((point, index) => {
              expect(point.volatility).toBeGreaterThanOrEqual(0);
              expect(point.date).toEqual(stockData[index].date);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: meme-market-dashboard, Property 1: Data fetch completeness**
     * **Validates: Requirements 1.1, 1.2**
     * 
     * For any time range request, when both stock and meme data are successfully fetched, 
     * the resulting datasets should have at least one data point and the date ranges should 
     * overlap with the requested period.
     */
    it('Property 1: Data fetch completeness', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random time ranges (1-365 days)
          fc.integer({ min: 1, max: 365 }),
          async (days) => {
            // Capture time once at the start to avoid timing issues
            const now = Date.now();
            const startTime = now - (days * 24 * 60 * 60 * 1000);
            
            // Create mock data for the requested time range
            const mockTimestamps = [];
            const mockData = { open: [], high: [], low: [], close: [], volume: [] };
            
            // Generate at least one data point within the range
            // For 1 day, we still generate 1 point
            const numPoints = Math.max(1, Math.min(days, 30)); // At least 1, max 30
            for (let i = 0; i < numPoints; i++) {
              const timestamp = Math.floor((startTime + (i * 24 * 60 * 60 * 1000)) / 1000);
              mockTimestamps.push(timestamp);
              mockData.open.push(100 + Math.random() * 10);
              mockData.high.push(110 + Math.random() * 10);
              mockData.low.push(90 + Math.random() * 10);
              mockData.close.push(105 + Math.random() * 10);
              mockData.volume.push(Math.floor(1000000 + Math.random() * 1000000));
            }
            
            const mockResponse = {
              chart: {
                result: [{
                  timestamp: mockTimestamps,
                  indicators: {
                    quote: [mockData]
                  }
                }]
              }
            };
            
            // Mock fetch
            global.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => mockResponse
            });
            
            const result = await stockAPI.fetchNiftyData(days);
            
            // Property 1: Should have at least one data point
            expect(result.length).toBeGreaterThan(0);
            
            // Property 2: All dates should fall within the requested range
            // The dates should be within the time window we requested
            // Add a small buffer (1 second) to account for any timing variations
            const requestedStartTime = startTime - 1000;
            const requestedEndTime = now + 1000;
            
            result.forEach(dataPoint => {
              const dataTime = dataPoint.date.getTime();
              // Verify dates fall within the requested window (with tolerance)
              expect(dataTime).toBeGreaterThanOrEqual(requestedStartTime);
              expect(dataTime).toBeLessThanOrEqual(requestedEndTime);
            });
            
            // Cleanup
            vi.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
