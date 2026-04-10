import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sleep to avoid real delays and allow assertion of delay values
vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return {
        ...actual,
        sleep: vi.fn().mockResolvedValue(undefined),
    };
});

import { sleep } from '../src/utils.js';

describe('TestRailClient - Enhanced Features', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Configuration Validation', () => {
        it('should throw error for invalid baseUrl', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: '',
                        email: 'test@example.com',
                        apiKey: 'api-key',
                    }),
            ).toThrow(TestRailValidationError);
        });

        it('should throw error for invalid email format', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'https://example.testrail.io',
                        email: 'invalid-email',
                        apiKey: 'api-key',
                    }),
            ).toThrow(TestRailValidationError);
        });

        it('should throw error for non-https/http URL', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'ftp://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'api-key',
                    }),
            ).toThrow(TestRailValidationError);
        });

        it('should accept valid configuration', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'https://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'api-key',
                    }),
            ).not.toThrow();
        });

        it('should accept optional configuration parameters', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'https://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'api-key',
                        timeout: 15000,
                        maxRetries: 2,
                        enableCache: false,
                        cacheTtl: 600000,
                        rateLimiter: {
                            maxRequests: 50,
                            windowMs: 30000,
                        },
                    }),
            ).not.toThrow();
        });
    });

    describe('Rate Limiting', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                rateLimiter: {
                    maxRequests: 2,
                    windowMs: 1000,
                },
            });

            const mockResponse: {
                ok: boolean;
                status: number;
                statusText: string;
                text: () => Promise<string>;
            } = {
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify({ id: 1, name: 'Test Project', suite_mode: 1, url: 'test' }),
            };

            mockFetch.mockResolvedValue(mockResponse as unknown as Response);
        });

        it('should allow requests within rate limit', async () => {
            await client.getProject(1);
            await client.getProject(2);

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw error when rate limit exceeded', async () => {
            await client.getProject(1);
            await client.getProject(2);

            await expect(client.getProject(3)).rejects.toThrow('Rate limit exceeded');
        });
    });

    describe('Caching', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheTtl: 1000,
            });
        });

        it('should cache GET requests', async () => {
            const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify(mockProject),
            } as never);

            // First request should hit the API
            const result1 = await client.getProject(1);
            expect(result1).toEqual(mockProject);
            expect(mockFetch).toHaveBeenCalledTimes(1);

            // Second request should use cache
            const result2 = await client.getProject(1);
            expect(result2).toEqual(mockProject);
            expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
        });

        it('should not cache POST requests', async () => {
            const mockCase = {
                id: 1,
                title: 'Test Case',
                section_id: 1,
                created_by: 1,
                created_on: 123,
                updated_by: 1,
                updated_on: 123,
                suite_id: 1,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify(mockCase),
            } as never);

            await client.addCase(1, { title: 'Test Case' });
            await client.addCase(1, { title: 'Test Case' });

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should clear cache when requested', async () => {
            const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify(mockProject),
            } as never);

            await client.getProject(1);
            expect(mockFetch).toHaveBeenCalledTimes(1);

            client.clearCache();

            await client.getProject(1);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should periodically clean up expired cache entries', async () => {
            // Use fake timers to control time
            vi.useFakeTimers();

            try {
                // Create a client with short TTL and cleanup interval for testing
                const shortLivedClient = new TestRailClient({
                    baseUrl: 'https://example.testrail.io',
                    email: 'test@example.com',
                    apiKey: 'api-key',
                    enableCache: true,
                    cacheTtl: 100, // 100ms TTL
                    cacheCleanupInterval: 50, // 50ms cleanup interval
                });

                const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(mockProject),
                } as never);

                // Make a request to populate cache
                await shortLivedClient.getProject(1);
                expect(mockFetch).toHaveBeenCalledTimes(1);

                // Advance time to expire cache and trigger cleanup
                await vi.advanceTimersByTimeAsync(200);

                // Next request should hit the API again because cache was cleaned up
                await shortLivedClient.getProject(1);
                expect(mockFetch).toHaveBeenCalledTimes(2);

                // Cleanup resources
                shortLivedClient.destroy();
            } finally {
                // Restore real timers
                vi.useRealTimers();
            }
        });

        it('should not start cleanup timer when cacheCleanupInterval is 0', () => {
            const noCleanupClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheCleanupInterval: 0,
            });

            // Client should be created without errors
            expect(noCleanupClient).toBeDefined();

            noCleanupClient.destroy();
        });

        it('should stop cleanup timer when destroy is called', async () => {
            const testClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheCleanupInterval: 1000,
            });

            const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify(mockProject),
            } as never);

            await testClient.getProject(1);

            // Destroy should clear cache and stop cleanup
            testClient.destroy();

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should safely handle multiple destroy calls (idempotency)', async () => {
            const testClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheCleanupInterval: 1000,
            });

            const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify(mockProject),
            } as never);

            await testClient.getProject(1);

            // First destroy
            testClient.destroy();

            // Second destroy - should not throw
            testClient.destroy();

            // Third destroy - should not throw
            testClient.destroy();

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should prevent usage after destroy() is called', async () => {
            const testClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });

            testClient.destroy();

            await expect(testClient.getProject(1)).rejects.toThrow(
                'Cannot use TestRailClient after destroy() has been called',
            );
        });
    });

    describe('Retry Logic', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 2,
            });
        });

        it('should retry on 500 server errors', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: async () => 'Server Error',
                } as never)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: async () => 'Server Error',
                } as never)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                } as never);

            const result = await client.getProject(1);
            expect(result.id).toBe(1);
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('should retry on 429 rate limiting', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: { get: () => null },
                    text: async () => 'Rate limited',
                } as never)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                } as never);

            const result = await client.getProject(1);
            expect(result.id).toBe(1);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should use Retry-After header value when present on 429', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: { get: (header: string) => (header === 'Retry-After' ? '5' : null) },
                    text: async () => 'Rate limited',
                } as never)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                } as never);

            await client.getProject(1);
            expect(mockSleep).toHaveBeenCalledWith(5000);
        });

        it('should use Retry-After HTTP-date header value when present on 429', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            // Fix "now" so the HTTP-date delay is deterministic (3 seconds in the future)
            const now = new Date('2026-01-01T00:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(now);

            try {
                const retryAfterDate = new Date(now.getTime() + 3000).toUTCString();

                mockFetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 429,
                        statusText: 'Too Many Requests',
                        headers: { get: (header: string) => (header === 'Retry-After' ? retryAfterDate : null) },
                        text: async () => 'Rate limited',
                    } as never)
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null },
                        text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                    } as never);

                await client.getProject(1);
                expect(mockSleep).toHaveBeenCalledWith(3000);
            } finally {
                vi.useRealTimers();
            }
        });

        it('should cap excessively large Retry-After seconds value to MAX_RETRY_DELAY_MS', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    // 99999999 seconds ≈ 3+ years; must be capped to 10000 ms
                    headers: { get: (header: string) => (header === 'Retry-After' ? '99999999' : null) },
                    text: async () => 'Rate limited',
                } as never)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                } as never);

            await client.getProject(1);
            // Delay must be capped at MAX_RETRY_DELAY_MS (10000 ms)
            expect(mockSleep).toHaveBeenCalledWith(10000);
        });

        it('should cap far-future Retry-After HTTP-date to MAX_RETRY_DELAY_MS', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            const now = new Date('2026-01-01T00:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(now);

            try {
                // HTTP-date 1 year in the future
                const farFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString();

                mockFetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 429,
                        statusText: 'Too Many Requests',
                        headers: { get: (header: string) => (header === 'Retry-After' ? farFutureDate : null) },
                        text: async () => 'Rate limited',
                    } as never)
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null },
                        text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                    } as never);

                await client.getProject(1);
                // Delay must be capped at MAX_RETRY_DELAY_MS (10000 ms)
                expect(mockSleep).toHaveBeenCalledWith(10000);
            } finally {
                vi.useRealTimers();
            }
        });

        it('should use exponential backoff on 429 when Retry-After header is absent', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: { get: () => null },
                    text: async () => 'Rate limited',
                } as never)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                } as never);

            await client.getProject(1);
            // First retry (retryCount=0): 1000 * 2^0 = 1000ms
            expect(mockSleep).toHaveBeenCalledWith(1000);
        });

        it('should not retry on client errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: async () => 'Not found',
            } as never);

            await expect(client.getProject(999)).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
        });

        it('should throw TestRailApiError with detailed information', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: async () => 'Project not found',
            } as never);

            try {
                await client.getProject(999);
            } catch (error) {
                expect(error).toBeInstanceOf(TestRailApiError);
                expect((error as TestRailApiError).status).toBe(404);
                expect((error as TestRailApiError).statusText).toBe('Not Found');
                expect((error as TestRailApiError).response).toBe('Project not found');
            }
        });

        it('should handle network errors', async () => {
            // Create a completely isolated client with disabled cache and retries to avoid interference
            const isolatedClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
                maxRetries: 0, // Disable retries for this test
            });

            // Clear all previous mocks completely
            vi.clearAllMocks();
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            // Verify the error thrown for a network failure is a TestRailApiError
            // and that its message contains network error information
            let caughtError: unknown;
            try {
                await isolatedClient.getProject(1);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeInstanceOf(TestRailApiError);
            expect((caughtError as TestRailApiError).message).toContain('Network error');
        });

        it('should handle invalid JSON responses', async () => {
            // Create a fresh client to avoid cache interference
            const freshClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
            });

            mockFetch.mockReset();
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => 'invalid json',
            } as never);

            await expect(freshClient.getProject(1)).rejects.toThrow(TestRailApiError);
        });
    });

    describe('Email Validation', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
        });

        it('should validate email format in getUserByEmail', async () => {
            await expect(client.getUserByEmail('invalid-email')).rejects.toThrow(TestRailValidationError);
            await expect(client.getUserByEmail('invalid-email')).rejects.toThrow('Invalid email format');
        });

        it('should accept valid email in getUserByEmail', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () =>
                    JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com', is_active: true }),
            } as never);

            const result = await client.getUserByEmail('test@example.com');
            expect(result.email).toBe('test@example.com');
        });
    });
});
