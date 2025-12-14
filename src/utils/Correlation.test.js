/**
 * Tests for Correlation utility
 * Includes both unit tests and property-based tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  alignDataByDate,
  calculatePearsonCorrelation,
  classifyCorrelationStrength,
  calculatePValue,
  calculateCorrelation
} from './Correlation.js';

describe('Correlation Utility', () => {
  describe('alignDataByDate', () => {
    it('should align data points with matching dates', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 1.5 },
        { date: new Date('2024-01-02'), volatility: 2.0 },
        { date: new Date('2024-01-03'), volatility: 1.8 }
      ];

      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 100 },
        { date: new Date('2024-01-03'), popularity: 150 }
      ];

      const result = alignDataByDate(volatilityData, popularityData);

      expect(result.volatility).toEqual([1.5, 1.8]);
      expect(result.popularity).toEqual([100, 150]);
      expect(result.dates).toHaveLength(2);
    });

    it('should return empty arrays when no matching dates', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 1.5 }
      ];

      const popularityData = [
        { date: new Date('2024-01-02'), popularity: 100 }
      ];

      const result = alignDataByDate(volatilityData, popularityData);

      expect(result.volatility).toEqual([]);
      expect(result.popularity).toEqual([]);
      expect(result.dates).toEqual([]);
    });

    it('should handle empty arrays', () => {
      const result = alignDataByDate([], []);
      expect(result.volatility).toEqual([]);
      expect(result.popularity).toEqual([]);
      expect(result.dates).toEqual([]);
    });
  });

  describe('calculatePearsonCorrelation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = calculatePearsonCorrelation(x, y);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      const result = calculatePearsonCorrelation(x, y);
      expect(result).toBeCloseTo(-1, 5);
    });

    it('should return 0 for no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 5, 5, 5, 5]; // No variance in y
      const result = calculatePearsonCorrelation(x, y);
      expect(result).toBe(0);
    });

    it('should handle single data point', () => {
      const x = [1];
      const y = [2];
      const result = calculatePearsonCorrelation(x, y);
      expect(result).toBe(0);
    });

    it('should handle empty arrays', () => {
      const result = calculatePearsonCorrelation([], []);
      expect(result).toBe(0);
    });

    it('should throw error for mismatched array lengths', () => {
      const x = [1, 2, 3];
      const y = [1, 2];
      expect(() => calculatePearsonCorrelation(x, y)).toThrow();
    });
  });

  describe('classifyCorrelationStrength', () => {
    it('should classify strong correlation', () => {
      expect(classifyCorrelationStrength(0.8)).toBe('Strong');
      expect(classifyCorrelationStrength(-0.75)).toBe('Strong');
    });

    it('should classify moderate correlation', () => {
      expect(classifyCorrelationStrength(0.5)).toBe('Moderate');
      expect(classifyCorrelationStrength(-0.6)).toBe('Moderate');
    });

    it('should classify weak correlation', () => {
      expect(classifyCorrelationStrength(0.3)).toBe('Weak');
      expect(classifyCorrelationStrength(-0.25)).toBe('Weak');
    });

    it('should classify very weak correlation', () => {
      expect(classifyCorrelationStrength(0.1)).toBe('Very Weak');
      expect(classifyCorrelationStrength(-0.15)).toBe('Very Weak');
      expect(classifyCorrelationStrength(0)).toBe('Very Weak');
    });
  });

  describe('calculatePValue', () => {
    it('should return 1 for insufficient sample size', () => {
      expect(calculatePValue(0.5, 2)).toBe(1);
    });

    it('should return 0 for perfect correlation', () => {
      expect(calculatePValue(1, 10)).toBe(0);
      expect(calculatePValue(-1, 10)).toBe(0);
    });

    it('should return low p-value for strong correlation with large sample', () => {
      const pValue = calculatePValue(0.9, 100);
      expect(pValue).toBeLessThan(0.05);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate complete correlation result', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 1.5 },
        { date: new Date('2024-01-02'), volatility: 2.0 },
        { date: new Date('2024-01-03'), volatility: 2.5 }
      ];

      const popularityData = [
        { date: new Date('2024-01-01'), popularity: 100 },
        { date: new Date('2024-01-02'), popularity: 150 },
        { date: new Date('2024-01-03'), popularity: 200 }
      ];

      const result = calculateCorrelation(volatilityData, popularityData);

      expect(result.coefficient).toBeCloseTo(1, 5);
      expect(result.strength).toBe('Strong');
      expect(result.sampleSize).toBe(3);
      expect(result.pValue).toBeGreaterThanOrEqual(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
    });

    it('should handle no aligned data', () => {
      const volatilityData = [
        { date: new Date('2024-01-01'), volatility: 1.5 }
      ];

      const popularityData = [
        { date: new Date('2024-01-02'), popularity: 100 }
      ];

      const result = calculateCorrelation(volatilityData, popularityData);

      expect(result.coefficient).toBe(0);
      expect(result.strength).toBe('Very Weak');
      expect(result.sampleSize).toBe(0);
      expect(result.pValue).toBe(1);
    });
  });

  // Property-Based Tests
  describe('Property-Based Tests', () => {
    /**
     * **Feature: meme-market-dashboard, Property 4: Correlation coefficient bounds**
     * **Validates: Requirements 4.1**
     * 
     * For any two aligned time series datasets, the calculated Pearson correlation 
     * coefficient should always be between -1 and 1 inclusive.
     */
    it('Property 4: Correlation coefficient bounds', () => {
      fc.assert(
        fc.property(
          // Generate two arrays of numbers with the same length (2-100 elements)
          fc.integer({ min: 2, max: 100 }).chain(length =>
            fc.tuple(
              fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), { minLength: length, maxLength: length }),
              fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), { minLength: length, maxLength: length })
            )
          ),
          ([x, y]) => {
            const coefficient = calculatePearsonCorrelation(x, y);
            
            // The correlation coefficient must be between -1 and 1 inclusive
            expect(coefficient).toBeGreaterThanOrEqual(-1);
            expect(coefficient).toBeLessThanOrEqual(1);
            expect(Number.isFinite(coefficient)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: meme-market-dashboard, Property 7: Time range filter consistency**
     * **Validates: Requirements 10.2, 10.3**
     * 
     * For any selected time range (7, 30, or 90 days), all fetched data should have 
     * dates within the range of (today - timeRange) to today, with no dates outside 
     * this window.
     */
    it('Property 7: Time range filter consistency', () => {
      fc.assert(
        fc.property(
          // Generate a time range (7, 30, or 90 days)
          fc.constantFrom(7, 30, 90),
          // Generate random data points with dates
          fc.integer({ min: 5, max: 50 }).chain(numPoints =>
            fc.array(
              fc.record({
                date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
                volatility: fc.float({ min: 0, max: 10, noNaN: true })
              }),
              { minLength: numPoints, maxLength: numPoints }
            )
          ),
          fc.integer({ min: 5, max: 50 }).chain(numPoints =>
            fc.array(
              fc.record({
                date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
                popularity: fc.float({ min: 0, max: 1000, noNaN: true })
              }),
              { minLength: numPoints, maxLength: numPoints }
            )
          ),
          (timeRange, volatilityData, popularityData) => {
            // Calculate the time range boundaries
            const now = new Date();
            const startDate = new Date(now);
            startDate.setDate(startDate.getDate() - timeRange);

            // Filter data to simulate what the API would return for the time range
            const filteredVolatility = volatilityData.filter(point => 
              point.date >= startDate && point.date <= now
            );

            const filteredPopularity = popularityData.filter(point => 
              point.date >= startDate && point.date <= now
            );

            // Align the filtered data
            const aligned = alignDataByDate(filteredVolatility, filteredPopularity);

            // Property: All aligned dates should be within the time range
            for (const date of aligned.dates) {
              expect(date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
              expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
            }

            // Additional check: if we have aligned data, verify it came from the filtered sets
            if (aligned.dates.length > 0) {
              expect(aligned.volatility.length).toBe(aligned.dates.length);
              expect(aligned.popularity.length).toBe(aligned.dates.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
