import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailConfigError } from '../src/client.js';

describe('TestRailClient - Coverage Improvement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Configuration Validation - Additional Cases', () => {
    it('should throw error for invalid timeout (zero)', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          timeout: 0
        });
      }).toThrow(TestRailConfigError);
    });

    it('should throw error for invalid timeout (negative)', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          timeout: -1000
        });
      }).toThrow(TestRailConfigError);
    });

    it('should throw error for timeout exceeding maximum (5 minutes)', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          timeout: 301000 // 5 minutes + 1 second
        });
      }).toThrow(TestRailConfigError);
    });

    it('should throw error for invalid maxRetries (negative)', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          maxRetries: -1
        });
      }).toThrow(TestRailConfigError);
    });

    it('should throw error for invalid maxRetries (exceeds maximum)', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          maxRetries: 11
        });
      }).toThrow(TestRailConfigError);
    });

    it('should throw error for invalid maxRetries (non-number)', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          maxRetries: '3' as any
        });
      }).toThrow(TestRailConfigError);
    });

    it('should accept valid timeout at maximum limit', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          timeout: 300000 // exactly 5 minutes
        });
      }).not.toThrow();
    });

    it('should accept valid maxRetries at maximum limit', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          maxRetries: 10
        });
      }).not.toThrow();
    });

    it('should accept valid maxRetries at zero', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: 'test-key',
          maxRetries: 0
        });
      }).not.toThrow();
    });

    it('should throw error for empty email string', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: '',
          apiKey: 'test-key'
        });
      }).toThrow(TestRailConfigError);
    });

    it('should throw error for empty apiKey string', () => {
      expect(() => {
        new TestRailClient({
          baseUrl: 'https://example.testrail.net',
          email: 'test@example.com',
          apiKey: ''
        });
      }).toThrow(TestRailConfigError);
    });
  });

  // Additional coverage tests to complete edge cases coverage
  describe('Additional Edge Cases', () => {
    it('should access timeout property correctly', () => {
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        timeout: 5000
      });
      
      // Access the timeout property to cover the getter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((client as any).timeout).toBe(5000);
    });
  });

  describe('Request Timeout Scenarios', () => {
    it('should handle request timeout with AbortController', async () => {
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        timeout: 100, // Very short timeout
        maxRetries: 0 // No retries to avoid complications
      });

      // Mock fetch to simulate timeout
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(client.getProject(1)).rejects.toThrow(
        'Request timeout after 100ms'
      );
    });
  });

  describe('Retry Logic Edge Cases', () => {
    it('should handle maximum retry attempts with exponential backoff', async () => {
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        maxRetries: 2
      });

      // Mock fetch to always return 500 error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Internal Server Error'),
        json: vi.fn().mockResolvedValue({ error: 'Server error' })
      });

      await expect(client.getProject(1)).rejects.toThrow(TestRailApiError);

      // Verify multiple calls were made due to retries
      expect(global.fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should handle network error with retry limit reached', async () => {
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        maxRetries: 1
      });

      // Mock fetch to throw network error
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      global.fetch = vi.fn().mockRejectedValue(networkError);

      await expect(client.getProject(1)).rejects.toThrow('Network error: Network request failed');

      // Should have made 2 attempts (initial + 1 retry)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle abort error after retries exhausted', async () => {
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        maxRetries: 0, // No retries to simplify
        timeout: 50
      });

      // Mock fetch to throw AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(client.getProject(1)).rejects.toThrow('Request timeout after 50ms');
    });
  });

  describe('Cache Cleanup Timer Management', () => {
    it('should not start cleanup timer when cacheCleanupInterval is 0', () => {
      vi.useFakeTimers();
      
      void new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        cacheCleanupInterval: 0
      });

      // Verify no interval is set
      expect(vi.getTimerCount()).toBe(0);
      
      vi.useRealTimers();
    });

    it('should properly clean up timer on destroy', () => {
      vi.useFakeTimers();
      
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        cacheCleanupInterval: 5000
      });

      // Verify timer is created
      expect(vi.getTimerCount()).toBe(1);

      // Destroy client
      client.destroy();

      // Verify timer is cleared
      expect(vi.getTimerCount()).toBe(0);
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle non-JSON error responses', async () => {
      const client = new TestRailClient({
        baseUrl: 'https://example.testrail.net',
        email: 'test@example.com',
        apiKey: 'test-key',
        maxRetries: 0 // No retries
      });

      // Mock fetch to return non-JSON error response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Internal Server Error'),
        json: vi.fn().mockRejectedValue(new Error('Not JSON'))
      });

      await expect(client.getProject(1)).rejects.toThrow(TestRailApiError);
    });
  });
});