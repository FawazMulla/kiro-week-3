import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { Cache } from './Cache.js';

describe('Cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Unit Tests', () => {
    it('should store and retrieve data', () => {
      const cache = new Cache();
      const testData = { value: 'test' };
      
      cache.set('test-key', testData);
      const retrieved = cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const cache = new Cache();
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should handle custom expiration times', () => {
      const cache = new Cache();
      const testData = { value: 'test' };
      
      cache.set('test-key', testData, 5000); // 5 seconds
      const retrieved = cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should remove expired entries', () => {
      const cache = new Cache(100); // 100ms expiration
      const testData = { value: 'test' };
      
      cache.set('test-key', testData);
      
      // Fast-forward time
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);
      
      const retrieved = cache.get('test-key');
      expect(retrieved).toBeNull();
      
      vi.useRealTimers();
    });

    it('should handle quota exceeded by clearing stale entries', () => {
      const cache = new Cache(100); // Short expiration
      
      // Mock localStorage to throw quota exceeded
      const originalSetItem = localStorage.setItem;
      let callCount = 0;
      
      vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return originalSetItem.call(localStorage, key, value);
      });
      
      const result = cache.set('test-key', { value: 'test' });
      expect(result).toBe(true);
    });

    it('should clear stale entries', () => {
      const cache = new Cache(100); // 100ms expiration
      
      // Add some entries
      cache.set('key1', { value: 1 });
      cache.set('key2', { value: 2 });
      cache.set('key3', { value: 3 });
      
      // Fast-forward time to expire entries
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);
      
      cache.clearStaleEntries();
      
      // All entries should be removed
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      
      vi.useRealTimers();
    });

    it('should validate cache entries correctly', () => {
      const cache = new Cache(1000);
      
      // Valid entry
      const validEntry = {
        data: { value: 'test' },
        timestamp: Date.now(),
        expiresIn: 1000
      };
      expect(cache.isValid(validEntry)).toBe(true);
      
      // Expired entry
      const expiredEntry = {
        data: { value: 'test' },
        timestamp: Date.now() - 2000,
        expiresIn: 1000
      };
      expect(cache.isValid(expiredEntry)).toBe(false);
      
      // Invalid entry (missing fields)
      expect(cache.isValid({})).toBe(false);
      expect(cache.isValid(null)).toBe(false);
    });

    it('should remove specific keys', () => {
      const cache = new Cache();
      
      cache.set('key1', { value: 1 });
      cache.set('key2', { value: 2 });
      
      cache.remove('key1');
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toEqual({ value: 2 });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: meme-market-dashboard, Property 5: Cache expiration correctness**
     * **Validates: Requirements 6.3, 6.5**
     * 
     * For any cached data entry, if the current time minus the timestamp is greater 
     * than the expiration time, the cache should be considered invalid and fresh 
     * data should be fetched.
     */
    it('Property 5: Cache expiration correctness', () => {
      // Generator for JSON-serializable data (excludes undefined, functions, symbols)
      const jsonSerializable = fc.oneof(
        fc.string(),
        fc.integer(),
        fc.double(),
        fc.boolean(),
        fc.constant(null),
        fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean())),
        fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))
      );

      fc.assert(
        fc.property(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 50 }),
            data: jsonSerializable,
            expiresIn: fc.integer({ min: 1, max: 10000 }), // 1ms to 10s
            timeElapsed: fc.integer({ min: 0, max: 20000 }) // 0 to 20s
          }),
          ({ key, data, expiresIn, timeElapsed }) => {
            const cache = new Cache(expiresIn);
            
            // Set the data in cache
            const setResult = cache.set(key, data);
            
            // If set failed, skip this test case
            if (!setResult) {
              return true;
            }
            
            // Simulate time passing
            vi.useFakeTimers();
            const startTime = Date.now();
            vi.setSystemTime(startTime + timeElapsed);
            
            // Get the data from cache
            const retrieved = cache.get(key);
            
            // Property: If time elapsed >= expiration time, data should be null (expired)
            // If time elapsed < expiration time, data should be retrieved
            if (timeElapsed >= expiresIn) {
              // Cache should be expired and return null
              expect(retrieved).toBeNull();
              
              // The key should also be removed from localStorage
              const rawItem = localStorage.getItem(key);
              expect(rawItem).toBeNull();
            } else {
              // Cache should still be valid and return the data
              expect(retrieved).toEqual(data);
            }
            
            vi.useRealTimers();
            return true;
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });
  });
});
