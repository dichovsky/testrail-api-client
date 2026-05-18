import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/client.js';

describe('TestRailClient - Coverage Improvement', () => {
    beforeEach(() => {
        vi.resetAllMocks();
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

        // SSRF / private-host blocking tests
        it('should throw error for localhost baseUrl by default', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://localhost/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for localhost. (trailing dot) baseUrl by default', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://localhost./testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for 127.0.0.1 baseUrl by default', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://127.0.0.1/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for IPv6 loopback [::1] baseUrl by default', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://[::1]/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for IPv6 link-local [fe80::1] baseUrl by default', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://[fe80::1]/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for IPv6 unique-local [fd00::1] baseUrl by default', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://[fd00::1]/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                });
            }).toThrow(TestRailValidationError);
        });

        it('should allow localhost baseUrl when allowPrivateHosts is true', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'http://localhost/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    allowInsecure: true,
                    allowPrivateHosts: true,
                });
            }).not.toThrow();
        });

        it('should allow 127.0.0.1 baseUrl when allowPrivateHosts is true', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'http://127.0.0.1/testrail',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    allowInsecure: true,
                    allowPrivateHosts: true,
                });
            }).not.toThrow();
        });

        // Rate-limiter validation tests
        it('should throw error for rateLimiter.maxRequests of zero', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    rateLimiter: { maxRequests: 0, windowMs: 60000 },
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for negative rateLimiter.maxRequests', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    rateLimiter: { maxRequests: -10, windowMs: 60000 },
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for rateLimiter.windowMs of zero', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    rateLimiter: { maxRequests: 100, windowMs: 0 },
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for negative rateLimiter.windowMs', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    rateLimiter: { maxRequests: 100, windowMs: -5000 },
                });
            }).toThrow(TestRailValidationError);
        });

        it('should throw error for null rateLimiter', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'https://example.testrail.net',
                    email: 'test@example.com',
                    apiKey: 'test-key',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    rateLimiter: null as any,
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

        it('should invoke cleanupAllClients when process emits exit', () => {
            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
            });

            // Emit exit — synchronously calls cleanupAllClients which destroys all active clients
            process.emit('exit', 0);

            // destroy() is idempotent; calling it again after cleanup must not throw
            expect(() => client.destroy()).not.toThrow();
        });

        it('should invoke cleanupAllClients on SIGINT and exit with code 130', () => {
            const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
            });

            process.emit('SIGINT');

            expect(exitSpy).toHaveBeenCalledWith(130);
            expect(() => client.destroy()).not.toThrow();

            exitSpy.mockRestore();
        });

        it('should invoke cleanupAllClients on SIGTERM and exit with code 143', () => {
            const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

            const client = new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
            });

            process.emit('SIGTERM');

            expect(exitSpy).toHaveBeenCalledWith(143);
            expect(() => client.destroy()).not.toThrow();

            exitSpy.mockRestore();
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

    // BACKLOG #4: Block HTTP redirects to prevent SSRF guard bypass.
    // The SSRF guard (validateBaseUrl + DNS pin) validates the *initial* URL
    // only. If fetch follows a 3xx Location pointing at a private/metadata IP,
    // the network request reaches the protected host before our code ever sees
    // a response. The fix sets `redirect: 'manual'` and surfaces 3xx as
    // TestRailApiError so the redirect never executes.
    describe('redirect blocking (BACKLOG #4)', () => {
        const REDIRECT_TARGET = 'http://169.254.169.254/latest/meta-data/';

        function makeRedirectResponse(status: number, location: string): Response {
            return {
                ok: false,
                status,
                statusText: 'Redirect',
                text: vi.fn().mockResolvedValue(''),
                arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
                headers: new globalThis.Headers({ Location: location }),
            } as unknown as Response;
        }

        function makeOkJsonResponse(payload: unknown): Response {
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
                headers: new globalThis.Headers({ 'Content-Type': 'application/json' }),
            } as unknown as Response;
        }

        function makeClient(): TestRailClient {
            return new TestRailClient({
                baseUrl: 'https://example.testrail.net',
                email: 'test@example.com',
                apiKey: 'test-key',
                maxRetries: 3,
            });
        }

        // Helper for the per-fetch-site redirect-option assertions below.
        // Without these, removing `redirect: 'manual'` from any of the four
        // fetch sites would still leave the rejection tests green (the mocked
        // 3xx Response is returned regardless of the option), even though
        // real fetch would silently auto-follow into the SSRF target.
        function lastFetchInit(): RequestInit | undefined {
            const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
            return calls.at(-1)?.[1] as RequestInit | undefined;
        }

        it('passes redirect: "manual" from request<T> (covers GET / POST JSON paths)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(
                makeOkJsonResponse({
                    id: 1,
                    name: 'Demo',
                    suite_mode: 1,
                    url: 'https://example.testrail.net/index.php?/projects/overview/1',
                }),
            );

            await client.getProject(1);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(lastFetchInit()?.redirect).toBe('manual');
            client.destroy();
        });

        it('passes redirect: "manual" from requestText (covers get_bdd path)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockResolvedValue('Feature: demo'),
                headers: new globalThis.Headers({ 'Content-Type': 'text/plain' }),
            });

            await client.getBdd(1);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(lastFetchInit()?.redirect).toBe('manual');
            client.destroy();
        });

        it('passes redirect: "manual" from requestMultipart (covers attachment upload path)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(makeOkJsonResponse({ attachment_id: 'abc123' }));

            const blob = new globalThis.Blob([new Uint8Array([1, 2, 3])]);
            await client.addAttachmentToCase(1, blob, 'a.bin');

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(lastFetchInit()?.redirect).toBe('manual');
            client.destroy();
        });

        it('passes redirect: "manual" from requestBinary (covers attachment download path)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
                headers: new globalThis.Headers({ 'Content-Type': 'application/octet-stream' }),
            });

            await client.getAttachment(1);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(lastFetchInit()?.redirect).toBe('manual');
            client.destroy();
        });

        it('rejects 302 GET via request<T> with a redirect-blocked error containing the Location', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(makeRedirectResponse(302, REDIRECT_TARGET));

            await expect(client.getProject(1)).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 302,
                response: expect.stringContaining('Redirect blocked'),
            });
            await expect(client.getProject(1)).rejects.toMatchObject({
                response: expect.stringContaining(REDIRECT_TARGET),
            });
            client.destroy();
        });

        it('rejects 301 POST via request<T> without retrying (mirrors B013 no-retry-on-write policy)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(makeRedirectResponse(301, REDIRECT_TARGET));

            await expect(client.addProject({ name: 'demo' })).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 301,
            });
            // Single attempt: 3xx is not transient — retries would not help and would
            // also be an SSRF amplifier if redirect: 'manual' were ever removed.
            expect(global.fetch).toHaveBeenCalledTimes(1);
            client.destroy();
        });

        it('rejects 307 from requestText (covers get_bdd code path)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(makeRedirectResponse(307, REDIRECT_TARGET));

            await expect(client.getBdd(1)).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 307,
                response: expect.stringContaining('Redirect blocked'),
            });
            expect(global.fetch).toHaveBeenCalledTimes(1);
            client.destroy();
        });

        it('rejects 308 from requestMultipart (covers attachment upload path)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(makeRedirectResponse(308, REDIRECT_TARGET));

            const blob = new globalThis.Blob([new Uint8Array([1, 2, 3])]);
            await expect(client.addAttachmentToCase(1, blob, 'a.bin')).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 308,
                response: expect.stringContaining('Redirect blocked'),
            });
            // requestMultipart never retries — single attempt expected.
            expect(global.fetch).toHaveBeenCalledTimes(1);
            client.destroy();
        });

        it('rejects 303 from requestBinary (covers attachment download path)', async () => {
            const client = makeClient();
            global.fetch = vi.fn().mockResolvedValue(makeRedirectResponse(303, REDIRECT_TARGET));

            await expect(client.getAttachment(1)).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 303,
                response: expect.stringContaining('Redirect blocked'),
            });
            expect(global.fetch).toHaveBeenCalledTimes(1);
            client.destroy();
        });

        it.each([301, 302, 303, 307, 308])(
            'rejects %i across the full redirect-status matrix on GET',
            async (status) => {
                const client = makeClient();
                global.fetch = vi.fn().mockResolvedValue(makeRedirectResponse(status, REDIRECT_TARGET));

                await expect(client.getProject(1)).rejects.toMatchObject({
                    name: 'TestRailApiError',
                    status,
                });
                client.destroy();
            },
        );

        it('does not poison the GET cache when a 302 response is rejected', async () => {
            const client = makeClient();
            const fetchMock = vi
                .fn()
                .mockResolvedValueOnce(makeRedirectResponse(302, REDIRECT_TARGET))
                .mockResolvedValueOnce(
                    makeOkJsonResponse({
                        id: 1,
                        name: 'Real Project',
                        suite_mode: 1,
                        url: 'https://example.testrail.net/index.php?/projects/overview/1',
                    }),
                );
            global.fetch = fetchMock;

            await expect(client.getProject(1)).rejects.toMatchObject({ status: 302 });
            // If the rejected redirect leaked into cache, the second call would
            // resolve to the cached redirect value (or skip fetch entirely). It
            // must reach the network again.
            const project = await client.getProject(1);
            expect(project).toMatchObject({ id: 1, name: 'Real Project' });
            expect(fetchMock).toHaveBeenCalledTimes(2);
            client.destroy();
        });

        it('falls back to a status-only error message when Location header is missing', async () => {
            const client = makeClient();
            const response = {
                ok: false,
                status: 302,
                statusText: 'Redirect',
                text: vi.fn().mockResolvedValue(''),
                headers: new globalThis.Headers(), // no Location
            } as unknown as Response;
            global.fetch = vi.fn().mockResolvedValue(response);

            await expect(client.getProject(1)).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 302,
                response: expect.stringContaining('Redirect blocked'),
            });
            client.destroy();
        });
    });
});
