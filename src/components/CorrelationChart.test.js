/**
 * Property-based tests for CorrelationChart component
 * **Feature: meme-market-dashboard, Property 6: Chart data alignment**
 * **Validates: Requirements 1.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CorrelationChart } from './CorrelationChart.js';
import { JSDOM } from 'jsdom';

// Mock Chart.js
vi.mock('chart.js', () => {
  const mockChart = vi.fn(function(ctx, config) {
    this.data = config.data;
    this.options = config.options;
    this.update = vi.fn();
    this.resize = vi.fn();
    this.destroy = vi.fn();
  });
  
  // Add static register method
  mockChart.register = vi.fn();

  return {
    Chart: mockChart,
    registerables: []
  };
});

describe('CorrelationChart - Property-Based Tests', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="test-chart"></canvas></body></html>');
    document = dom.window.document;
    window = dom.window;
    
    // Make document and window available globally
    global.document = document;
    global.window = window;
    global.HTMLCanvasElement = window.HTMLCanvasElement;
  });

  afterEach(() => {
    // Clean up - but keep references for other tests
    if (global.document) {
      global.document.body.innerHTML = '';
    }
  });

  /**
   * Generator for VolatilityPoint objects
   */
  const volatilityPointArb = fc.record({
    date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
    volatility: fc.float({ min: 0, max: 10, noNaN: true }),
    dailyChange: fc.float({ min: -10, max: 10, noNaN: true }),
    dayRange: fc.float({ min: 0, max: 10, noNaN: true }),
    volumeSpike: fc.float({ min: 0, max: 200, noNaN: true })
  }).filter(point => !isNaN(point.date.getTime())); // Filter out invalid dates

  /**
   * Generator for PopularityPoint objects
   */
  const popularityPointArb = fc.record({
    date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
    popularity: fc.float({ min: 0, max: 10000, noNaN: true }),
    posts: fc.integer({ min: 1, max: 100 }),
    avgScore: fc.float({ min: 0, max: 1000, noNaN: true }),
    totalComments: fc.integer({ min: 0, max: 5000 })
  }).filter(point => !isNaN(point.date.getTime())); // Filter out invalid dates

  /**
   * Property 6: Chart data alignment
   * For any volatility and popularity datasets passed to the correlation chart,
   * the chart should render exactly the number of data points equal to the
   * minimum length of the two datasets after date alignment.
   */
  it('should render exactly the number of aligned data points', () => {
    fc.assert(
      fc.property(
        fc.array(volatilityPointArb, { minLength: 1, maxLength: 50 }),
        fc.array(popularityPointArb, { minLength: 1, maxLength: 50 }),
        (volatilityData, popularityData) => {
          // Create chart instance
          const chart = new CorrelationChart('test-chart');
          
          try {
            // Initialize chart with data
            chart.initialize(volatilityData, popularityData);

            // Find common dates between the two datasets
            const volatilityDates = new Set(
              volatilityData.map(p => p.date.toISOString().split('T')[0])
            );
            const popularityDates = new Set(
              popularityData.map(p => p.date.toISOString().split('T')[0])
            );

            // Calculate expected number of aligned points
            const commonDates = [...volatilityDates].filter(date => popularityDates.has(date));
            const expectedAlignedCount = commonDates.length;

            // Get actual number of data points in chart
            const actualVolatilityCount = chart.chart.data.datasets[0].data.length;
            const actualPopularityCount = chart.chart.data.datasets[1].data.length;
            const actualLabelCount = chart.chart.data.labels.length;

            // Verify all counts match the expected aligned count
            expect(actualVolatilityCount).toBe(expectedAlignedCount);
            expect(actualPopularityCount).toBe(expectedAlignedCount);
            expect(actualLabelCount).toBe(expectedAlignedCount);

            // Verify both datasets have the same length
            expect(actualVolatilityCount).toBe(actualPopularityCount);
          } finally {
            // Clean up
            chart.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Chart should handle empty datasets gracefully
   */
  it('should handle empty datasets without errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom([], []),
        fc.constantFrom([], []),
        (volatilityData, popularityData) => {
          const chart = new CorrelationChart('test-chart');
          
          try {
            // Should not throw
            chart.initialize(volatilityData, popularityData);

            // Should have empty data
            expect(chart.chart.data.datasets[0].data.length).toBe(0);
            expect(chart.chart.data.datasets[1].data.length).toBe(0);
            expect(chart.chart.data.labels.length).toBe(0);
          } finally {
            chart.destroy();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional property: Chart update should maintain alignment
   */
  it('should maintain data alignment when updating chart', () => {
    fc.assert(
      fc.property(
        fc.array(volatilityPointArb, { minLength: 1, maxLength: 30 }),
        fc.array(popularityPointArb, { minLength: 1, maxLength: 30 }),
        fc.array(volatilityPointArb, { minLength: 1, maxLength: 30 }),
        fc.array(popularityPointArb, { minLength: 1, maxLength: 30 }),
        (initialVolatility, initialPopularity, newVolatility, newPopularity) => {
          const chart = new CorrelationChart('test-chart');
          
          try {
            // Initialize with first dataset
            chart.initialize(initialVolatility, initialPopularity);

            // Update with new dataset
            chart.update(newVolatility, newPopularity);

            // Calculate expected aligned count for new data
            const volatilityDates = new Set(
              newVolatility.map(p => p.date.toISOString().split('T')[0])
            );
            const popularityDates = new Set(
              newPopularity.map(p => p.date.toISOString().split('T')[0])
            );
            const commonDates = [...volatilityDates].filter(date => popularityDates.has(date));
            const expectedAlignedCount = commonDates.length;

            // Verify alignment after update
            const actualVolatilityCount = chart.chart.data.datasets[0].data.length;
            const actualPopularityCount = chart.chart.data.datasets[1].data.length;
            const actualLabelCount = chart.chart.data.labels.length;

            expect(actualVolatilityCount).toBe(expectedAlignedCount);
            expect(actualPopularityCount).toBe(expectedAlignedCount);
            expect(actualLabelCount).toBe(expectedAlignedCount);
            expect(actualVolatilityCount).toBe(actualPopularityCount);
          } finally {
            chart.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Chart should only include dates present in both datasets
   */
  it('should only include dates that exist in both datasets', () => {
    fc.assert(
      fc.property(
        fc.array(volatilityPointArb, { minLength: 1, maxLength: 30 }),
        fc.array(popularityPointArb, { minLength: 1, maxLength: 30 }),
        (volatilityData, popularityData) => {
          const chart = new CorrelationChart('test-chart');
          
          try {
            chart.initialize(volatilityData, popularityData);

            // Get all dates from chart labels
            const chartDates = new Set(chart.chart.data.labels);

            // Get dates from original datasets
            const volatilityDates = new Set(
              volatilityData.map(p => p.date.toISOString().split('T')[0])
            );
            const popularityDates = new Set(
              popularityData.map(p => p.date.toISOString().split('T')[0])
            );

            // Every date in the chart should exist in both original datasets
            for (const chartDate of chartDates) {
              expect(volatilityDates.has(chartDate)).toBe(true);
              expect(popularityDates.has(chartDate)).toBe(true);
            }
          } finally {
            chart.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
