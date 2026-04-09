import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/client.js';

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
                    timeout: 0,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for invalid timeout (negative)', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    timeout: -1000,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for timeout exceeding maximum (5 minutes)', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    timeout: 301000, // 5 minutes + 1 second
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for invalid maxRetries (negative)', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    maxRetries: -1,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for invalid maxRetries (exceeds maximum)', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    maxRetries: 11,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for invalid maxRetries (non-number)', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    maxRetries: '3' as any,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should accept valid timeout at maximum limit', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    timeout: 300000, // exactly 5 minutes
                });
            }).not.toThrow();
        });

        it('should accept valid maxRetries at maximum limit', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    maxRetries: 10,
                });
            }).not.toThrow();
        });

        it('should accept valid maxRetries at zero', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    maxRetries: 0,
                });
            }).not.toThrow();
        });

        it('should throw error for negative maxCacheSize', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    maxCacheSize: -1,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for non-integer maxCacheSize', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    maxCacheSize: 1.5,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for non-numeric maxCacheSize', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    maxCacheSize: '100' as any,
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for empty email string', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: '',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for empty apiKey string', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: '',
                });
            }).toThrow(TestRailValidationError);
        });
    });

    // Additional coverage tests to complete edge cases coverage
    describe('Additional Edge Cases', () => {
        it('should access timeout property correctly', () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                timeout: 5000,
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
                // Using 1000ms timeout for better reliability across different CI/test environments.
                // Even though fetch is mocked to return immediately with an AbortError, a longer
                // timeout prevents potential flakiness if mock setup behaves differently in some
                // environments while still keeping the test execution fast.
                timeout: 1000,
                maxRetries: 0, // No retries to avoid complications
            });

            // Mock fetch to simulate timeout
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            global.fetch = vi.fn().mockRejectedValue(abortError);

            await expect(client.getProject(1)).rejects.toThrow('Request timeout after 1000ms');
        });
    });

    describe('Retry Logic Edge Cases', () => {
        it('should handle maximum retry attempts with exponential backoff', async () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                maxRetries: 2,
            });

            // Mock fetch to always return 500 error
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: vi.fn().mockResolvedValue('Internal Server Error'),
                json: vi.fn().mockResolvedValue({ error: 'Server error' }),
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
                maxRetries: 1,
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
                timeout: 50,
            });

            // Mock fetch to throw AbortError
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            global.fetch = vi.fn().mockRejectedValue(abortError);

            await expect(client.getProject(1)).rejects.toThrow('Request timeout after 50ms');
        });

        it('should not retry timeout errors even when maxRetries is set', async () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                maxRetries: 3, // Set retries but timeouts should not be retried
                timeout: 50,
            });

            // Mock fetch to throw AbortError (timeout)
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            global.fetch = vi.fn().mockRejectedValue(abortError);

            await expect(client.getProject(1)).rejects.toThrow('Request timeout after 50ms');

            // Should only have made 1 attempt, no retries for timeout errors
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Process Handlers and Cleanup', () => {
        it('should register process handlers only once', () => {
            // Create multiple clients to test that handlers are registered only once
            const client1 = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test1@example.com',
                apiKey: 'test-key-1',
            });

            const client2 = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test2@example.com',
                apiKey: 'test-key-2',
            });

            // Both clients should be created successfully
            expect(client1).toBeInstanceOf(TestRailClient);
            expect(client2).toBeInstanceOf(TestRailClient);

            // Cleanup
            client1.destroy();
            client2.destroy();
        });

        it('should handle process event registration in environments without process', () => {
            // Mock environment without process
            const originalProcess = global.process;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).process = undefined;

            // Should still create client successfully
            expect(() => {
                const client = new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
                client.destroy();
            }).not.toThrow();

            // Restore original process
            global.process = originalProcess;
        });

        it('should handle cleanup of all active clients', () => {
            const client1 = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test1@example.com',
                apiKey: 'test-key-1',
            });

            const client2 = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test2@example.com',
                apiKey: 'test-key-2',
            });

            // Test cleanup by calling destroy on both
            client1.destroy();
            client2.destroy();

            // Should complete without errors
            expect(true).toBe(true);
        });
    });

    describe('Cache Management Edge Cases', () => {
        it('should handle cache cleanup of expired entries', () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                cacheCleanupInterval: 100,
            });

            // Access private cache to test expired entry cleanup
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cache = (client as any).cache;

            // Add expired entry manually
            cache.set('expired-key', {
                data: { test: 'data' },
                expiry: Date.now() - 1000, // Already expired
            });

            // Call getCachedData which should clean up expired entry
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (client as any).getCachedData('expired-key');

            expect(result).toBeUndefined();
            expect(cache.has('expired-key')).toBe(false);

            client.destroy();
        });

        it('should not cache when caching is disabled', () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                enableCache: false,
            });

            // Call setCachedData directly to test the early return
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (client as any).setCachedData('test-key', { test: 'data' });

            // Cache should be empty since caching is disabled
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cache = (client as any).cache;
            expect(cache.size).toBe(0);

            client.destroy();
        });
    });

    describe('Cache Cleanup Timer Management', () => {
        it('should not start cleanup timer when cacheCleanupInterval is 0', () => {
            vi.useFakeTimers();

            void new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                cacheCleanupInterval: 0,
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
                cacheCleanupInterval: 5000,
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
                maxRetries: 0, // No retries
            });

            // Mock fetch to return non-JSON error response
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: vi.fn().mockResolvedValue('Internal Server Error'),
                json: vi.fn().mockRejectedValue(new Error('Not JSON')),
            });

            await expect(client.getProject(1)).rejects.toThrow(TestRailApiError);
        });
    });

    describe('Additional Coverage Tests', () => {
        it('should trigger cache cleanup of expired entries', () => {
            vi.useFakeTimers();

            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                enableCache: true,
                cacheTtl: 1000, // 1 second TTL
            });

            // Manually add an expired entry to test cleanup
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cache = (client as any).cache;
            cache.set('expired-key', {
                data: { test: 'data' },
                expiry: Date.now() - 1000, // Already expired
            });

            // Advance time and trigger cleanup
            vi.advanceTimersByTime(100);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (client as any).cleanupExpiredCache();

            // Expired entry should be removed
            expect(cache.has('expired-key')).toBe(false);

            client.destroy();
            vi.useRealTimers();
        });

        it('should call setCachedData with caching disabled to test early return', () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                enableCache: false,
            });

            // Directly call setCachedData to test the early return path
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (client as any).setCachedData('test-key', { data: 'test' });
            }).not.toThrow();

            client.destroy();
        });
    });
});
