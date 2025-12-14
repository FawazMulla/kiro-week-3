/**
 * RetryHandler Utility Tests
 * Tests retry logic, exponential backoff, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryHandler } from './RetryHandler.js';

describe('RetryHandler', () => {
  let retryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 100, // Shorter delays for testing
      maxDelay: 1000
    });
  });

  describe('Successful Operations', () => {
    it('should execute function successfully on first attempt', async () => {
      const successfulFunction = vi.fn().mockResolvedValue('success');
      
      const result = await retryHandler.execute(successfulFunction, 'Test Operation');
      
      expect(result).toBe('success');
      expect(successfulFunction).toHaveBeenCalledTimes(1);
    });

    it('should return result from successful retry', async () => {
      const flakyFunction = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await retryHandler.execute(flakyFunction, 'Flaky Operation');
      
      expect(result).toBe('success');
      expect(flakyFunction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Failed Operations', () => {
    it('should throw error after max retries exceeded', async () => {
      const failingFunction = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        retryHandler.execute(failingFunction, 'Failing Operation')
      ).rejects.toThrow('Failing Operation failed after 3 attempts');
      
      expect(failingFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableFunction = vi.fn().mockRejectedValue(new Error('400 Bad Request'));
      
      await expect(
        retryHandler.execute(nonRetryableFunction, 'Non-retryable Operation')
      ).rejects.toThrow('400 Bad Request');
      
      expect(nonRetryableFunction).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry network errors', async () => {
      const networkErrorFunction = vi.fn().mockRejectedValue(new Error('Network request failed'));
      
      await expect(
        retryHandler.execute(networkErrorFunction, 'Network Operation')
      ).rejects.toThrow('Network Operation failed after 3 attempts');
      
      expect(networkErrorFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should retry server errors (5xx)', async () => {
      const serverErrorFunction = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'));
      
      await expect(
        retryHandler.execute(serverErrorFunction, 'Server Operation')
      ).rejects.toThrow('Server Operation failed after 3 attempts');
      
      expect(serverErrorFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should retry rate limit errors', async () => {
      const rateLimitFunction = vi.fn().mockRejectedValue(new Error('429 Rate limit exceeded'));
      
      await expect(
        retryHandler.execute(rateLimitFunction, 'Rate Limited Operation')
      ).rejects.toThrow('Rate Limited Operation failed after 3 attempts');
      
      expect(rateLimitFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry client errors (4xx except 429)', async () => {
      const clientErrorFunction = vi.fn().mockRejectedValue(new Error('404 Not Found'));
      
      await expect(
        retryHandler.execute(clientErrorFunction, 'Client Error Operation')
      ).rejects.toThrow('404 Not Found');
      
      expect(clientErrorFunction).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry parsing errors', async () => {
      const parseErrorFunction = vi.fn().mockRejectedValue(new Error('JSON parse error'));
      
      await expect(
        retryHandler.execute(parseErrorFunction, 'Parse Operation')
      ).rejects.toThrow('JSON parse error');
      
      expect(parseErrorFunction).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Custom Retry Logic', () => {
    it('should use custom shouldRetry function', async () => {
      const customShouldRetry = vi.fn().mockReturnValue(false);
      const customRetryHandler = new RetryHandler({
        shouldRetry: customShouldRetry
      });
      
      const failingFunction = vi.fn().mockRejectedValue(new Error('Custom error'));
      
      await expect(
        customRetryHandler.execute(failingFunction, 'Custom Operation')
      ).rejects.toThrow('Custom error');
      
      expect(failingFunction).toHaveBeenCalledTimes(1);
      expect(customShouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should override options per execution', async () => {
      const failingFunction = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        retryHandler.execute(failingFunction, 'Override Operation', { maxRetries: 1 })
      ).rejects.toThrow('Override Operation failed after 1 attempts');
      
      expect(failingFunction).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('Retry Wrapper', () => {
    it('should create wrapper with success callback', async () => {
      const apiCall = vi.fn().mockResolvedValue('success');
      const onSuccess = vi.fn();
      
      const wrappedCall = retryHandler.createRetryWrapper(apiCall, 'API Call', {
        onSuccess
      });
      
      const result = await wrappedCall('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(apiCall).toHaveBeenCalledWith('arg1', 'arg2');
      expect(onSuccess).toHaveBeenCalledWith('success');
    });

    it('should create wrapper with failure callback', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('API error'));
      const onFailure = vi.fn();
      
      const wrappedCall = retryHandler.createRetryWrapper(apiCall, 'API Call', {
        onFailure
      });
      
      await expect(wrappedCall()).rejects.toThrow('API Call failed after 3 attempts');
      expect(onFailure).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should create wrapper with retry callback', async () => {
      const apiCall = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      const onRetry = vi.fn();
      
      const wrappedCall = retryHandler.createRetryWrapper(apiCall, 'API Call', {
        onRetry
      });
      
      const result = await wrappedCall();
      
      expect(result).toBe('success');
      expect(onRetry).toHaveBeenCalledTimes(2); // Called on attempts 2 and 3
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 4);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 3, 4);
    });

    it('should handle callback errors gracefully', async () => {
      const apiCall = vi.fn().mockResolvedValue('success');
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      const wrappedCall = retryHandler.createRetryWrapper(apiCall, 'API Call', {
        onSuccess: faultyCallback
      });
      
      // Should not throw even if callback throws
      const result = await wrappedCall();
      expect(result).toBe('success');
      expect(faultyCallback).toHaveBeenCalled();
    });
  });

  describe('Manual Retry', () => {
    it('should create manual retry function', async () => {
      const operation = vi.fn().mockResolvedValue('manual success');
      
      const manualRetry = retryHandler.createManualRetry(operation, 'Manual Operation');
      const result = await manualRetry();
      
      expect(result).toBe('manual success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle manual retry failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Manual error'));
      
      const manualRetry = retryHandler.createManualRetry(operation, 'Manual Operation');
      
      await expect(manualRetry()).rejects.toThrow('Manual error');
      expect(operation).toHaveBeenCalled();
    });
  });

  describe('Status Messages', () => {
    it('should generate appropriate status messages', () => {
      expect(retryHandler.getRetryStatusMessage(1, 3, 'Data Loading'))
        .toBe('Loading data loading...');
      
      expect(retryHandler.getRetryStatusMessage(2, 3, 'Data Loading'))
        .toBe('Retrying data loading... (2/3)');
      
      expect(retryHandler.getRetryStatusMessage(4, 3, 'Data Loading'))
        .toBe('Failed to load data loading');
    });
  });

  describe('Delay Calculation', () => {
    it('should calculate exponential backoff delays', () => {
      const handler = new RetryHandler({
        baseDelay: 1000,
        maxDelay: 10000
      });
      
      // Test delay calculation (private method, testing through execution timing)
      const delays = [];
      const originalDelay = handler._delay;
      handler._delay = vi.fn((ms) => {
        delays.push(ms);
        return Promise.resolve();
      });
      
      const failingFunction = vi.fn().mockRejectedValue(new Error('Network error'));
      
      // Execute and capture delays
      handler.execute(failingFunction, 'Test').catch(() => {});
      
      // Should have exponential backoff pattern (with jitter, so approximate)
      expect(delays.length).toBe(3); // 3 retry delays
      expect(delays[0]).toBeGreaterThanOrEqual(750); // ~1000ms ±25%
      expect(delays[0]).toBeLessThanOrEqual(1250);
      expect(delays[1]).toBeGreaterThanOrEqual(1500); // ~2000ms ±25%
      expect(delays[1]).toBeLessThanOrEqual(2500);
      expect(delays[2]).toBeGreaterThanOrEqual(3000); // ~4000ms ±25%
      expect(delays[2]).toBeLessThanOrEqual(5000);
    });

    it('should cap delays at maximum', () => {
      const handler = new RetryHandler({
        baseDelay: 1000,
        maxDelay: 2000 // Low max for testing
      });
      
      const delays = [];
      handler._delay = vi.fn((ms) => {
        delays.push(ms);
        return Promise.resolve();
      });
      
      const failingFunction = vi.fn().mockRejectedValue(new Error('Network error'));
      handler.execute(failingFunction, 'Test').catch(() => {});
      
      // All delays should be capped at maxDelay
      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(2000);
      });
    });
  });
});