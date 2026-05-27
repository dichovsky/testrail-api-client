import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/client.js';
import { mockErr, mockOk } from './helpers.js';

const { mockDnsLookup } = vi.hoisted(() => ({
    mockDnsLookup: vi.fn(),
}));

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

vi.mock('node:dns/promises', () => ({
    lookup: mockDnsLookup,
}));

import { sleep } from '../src/utils.js';

describe('TestRailClient - Enhanced Features', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        mockDnsLookup.mockReset();
        mockDnsLookup.mockResolvedValue([]);
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

            mockFetch.mockResolvedValue(mockResponse);
        });

        it('should allow requests within rate limit', async () => {
            await client.getProject(1);
            await client.getProject(2);

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw error when rate limit exceeded', async () => {
            await client.getProject(1);
            await client.getProject(2);

            await expect(client.getProject(3)).rejects.toMatchObject({
                status: 429,
                statusText: 'Too Many Requests',
                response: expect.objectContaining({
                    message: expect.stringContaining('Rate limit exceeded'),
                }),
            });
        });
    });

    describe('DNS validation', () => {
        it('should reject public-looking hostname when DNS resolves to loopback', async () => {
            mockDnsLookup.mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }] as never);
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
            });

            await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should fail closed when DNS lookup errors (no fail-open warn-and-proceed)', async () => {
            // Previously a SERVFAIL/NXDOMAIN reply would emit console.warn and let
            // the request continue, converting validation into a no-op — that path
            // is now treated as a hard validation failure.
            mockDnsLookup.mockRejectedValueOnce(Object.assign(new Error('queryA ESERVFAIL'), { code: 'ESERVFAIL' }));
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
            });

            await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should re-resolve on every request (no construction-time caching)', async () => {
            // Defends against DNS rebinding: validating once at construction lets an
            // attacker who returns a public IP for the construction lookup, then a
            // private IP for fetch's subsequent lookup, bypass the check entirely.
            // Re-validation per request closes that window to microseconds.
            mockDnsLookup.mockResolvedValue([{ address: '203.0.113.10', family: 4 }] as never);
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
            });

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
            });

            await client.getProject(1);
            await client.getProject(2);

            expect(mockDnsLookup).toHaveBeenCalledTimes(2);
        });

        it('should skip DNS validation entirely when allowPrivateHosts is true', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
            });
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
                allowPrivateHosts: true,
                enableCache: false,
            });

            await client.getProject(1);

            expect(mockDnsLookup).not.toHaveBeenCalled();
        });

        it('custom dnsLookup is used instead of system resolver when provided', async () => {
            const customLookup = vi.fn().mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
            });
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
                dnsLookup: customLookup,
            });

            await client.getProject(1);

            expect(customLookup).toHaveBeenCalledWith('public-host.example');
            expect(mockDnsLookup).not.toHaveBeenCalled();
        });

        it('custom dnsLookup still blocks private IPs (SSRF guard runs on returned addresses)', async () => {
            const customLookup = vi.fn().mockResolvedValue([{ address: '192.168.1.1', family: 4 }]);
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
                dnsLookup: customLookup,
            });

            await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('custom dnsLookup failure is treated as fail-closed (throws TestRailValidationError)', async () => {
            const customLookup = vi.fn().mockRejectedValue(new Error('custom resolver unreachable'));
            client = new TestRailClient({
                baseUrl: 'https://public-host.example',
                email: 'test@example.com',
                apiKey: 'api-key',
                dnsLookup: customLookup,
            });

            await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
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
            });

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
            });

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
            });

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
                });

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
            });

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
            });

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

        // Regression tests for BACKLOG #9: schema-invalid GET responses must
        // not be cached. Before the fix, request() cached the raw JSON before
        // the module validated it with Zod — a malformed response would
        // therefore persist for the full TTL and re-throw the same
        // TestRailValidationError on every subsequent call.
        describe('Schema-invalid response cache poisoning (BACKLOG #9)', () => {
            it('does not cache a GET response that fails schema validation', async () => {
                const invalidProject = { id: 'not-a-number', name: 42 };
                const validProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(invalidProject),
                });
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject),
                });

                // First call: schema validation throws; nothing should be cached.
                await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);

                // Second call: cache MUST be empty, so this re-fetches and
                // resolves with the valid response. Pre-fix behavior was to
                // hit the poisoned cache entry and re-throw indefinitely.
                const result = await client.getProject(1);
                expect(result).toEqual(validProject);
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            it('caches a GET response only after successful schema validation', async () => {
                const validProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject),
                });

                const first = await client.getProject(1);
                const second = await client.getProject(1);

                expect(first).toEqual(validProject);
                expect(second).toEqual(validProject);
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            it('does not corrupt the cache when a POST response fails validation', async () => {
                const invalidProject = { id: 'not-a-number' };
                const validProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

                // Prime the cache with a valid GET.
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject),
                });
                await client.getProject(1);
                expect(mockFetch).toHaveBeenCalledTimes(1);

                // POST returns a schema-invalid body — request() clears the
                // cache (unconditional for non-GET) and then requestParsed
                // throws on validation.
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(invalidProject),
                });
                await expect(client.addProject({ name: 'New' })).rejects.toThrow(TestRailValidationError);

                // Subsequent GET re-fetches because the POST invalidated the
                // earlier cache entry.
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject),
                });
                const result = await client.getProject(1);
                expect(result).toEqual(validProject);
                expect(mockFetch).toHaveBeenCalledTimes(3);
            });

            it('caches each endpoint independently after validation', async () => {
                const validProject1 = { id: 1, name: 'P1', suite_mode: 1, url: 'test1' };
                const invalidProject2 = { id: 'oops' };
                const validProject2 = { id: 2, name: 'P2', suite_mode: 1, url: 'test2' };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject1),
                });
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(invalidProject2),
                });
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject2),
                });

                // Project 1 caches normally.
                expect(await client.getProject(1)).toEqual(validProject1);
                // Project 2 fails validation — its slot must NOT be cached.
                await expect(client.getProject(2)).rejects.toThrow(TestRailValidationError);
                // Project 2 retried fresh — succeeds — and DOES cache.
                expect(await client.getProject(2)).toEqual(validProject2);

                // Sanity: project 1 still cached (no fourth fetch).
                expect(await client.getProject(1)).toEqual(validProject1);
                expect(mockFetch).toHaveBeenCalledTimes(3);
            });

            it('does not let raw request() cache entries poison requestParsed() (namespace isolation)', async () => {
                // Direct callers of the public, low-level request<T>() write
                // into the raw cache namespace. If requestParsed() shared that
                // namespace, the raw (potentially schema-invalid) value would
                // be returned without validation, re-introducing #9.
                const malformedRaw = { id: 'not-a-number', name: 99 };
                const validProject = { id: 1, name: 'Test Project', suite_mode: 1, url: 'test' };

                // Step 1: poison the raw cache via direct request<unknown>().
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(malformedRaw),
                });
                const rawValue = await client.request<unknown>('GET', 'get_project/1');
                expect(rawValue).toEqual(malformedRaw);

                // Step 2: getProject() goes through requestParsed(). It MUST
                // see a separate cache namespace, miss, refetch, and validate.
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(validProject),
                });
                const parsed = await client.getProject(1);
                expect(parsed).toEqual(validProject);
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            it('does not leak Zod-transformed values into the raw request() cache', async () => {
                // Zod schemas may strip or transform fields (e.g. unknown keys
                // dropped on a non-passthrough schema). If requestParsed()
                // wrote into the raw cache, a later request<unknown>() caller
                // would receive the transformed view instead of the raw JSON
                // body, breaking the documented low-level contract.
                const rawBody = { id: 1, name: 'P1', suite_mode: 1, url: 'u', extra_field_kept_as_raw: 'present' };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(rawBody),
                });
                // Prime the validated namespace.
                await client.getProject(1);

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(rawBody),
                });
                // The raw caller MUST refetch (separate namespace) and see
                // the full raw body, untouched by validation.
                const raw = await client.request<typeof rawBody>('GET', 'get_project/1');
                expect(raw).toEqual(rawBody);
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            it('still caches GET responses when callers invoke request() directly without a schema', async () => {
                // Back-compat: external callers that use the lower-level
                // request<T>() (no schema) still rely on its built-in GET cache.
                // requestParsed() bypasses request()'s internal cache write by
                // passing skipCache=true, so we exercise the legacy path here.
                const raw = { id: 42, custom_payload: 'anything' };

                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(raw),
                });

                const first = await client.request<typeof raw>('GET', 'get_custom/42');
                const second = await client.request<typeof raw>('GET', 'get_custom/42');

                expect(first).toEqual(raw);
                expect(second).toEqual(raw);
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            it('re-throws TestRailValidationError on every repeated GET when the upstream is permanently malformed', async () => {
                const malformed = { id: 'oops', name: null };

                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(malformed),
                });

                await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
                await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
                await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);

                // Three calls = three fetches. Pre-fix, the second and third
                // would have hit a poisoned cache entry and never reached
                // fetch. The new behavior surfaces the upstream problem
                // explicitly on each call.
                expect(mockFetch).toHaveBeenCalledTimes(3);
            });
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
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: async () => 'Server Error',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

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
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

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
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

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
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null },
                        text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                    });

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
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

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
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null },
                        text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                    });

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
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

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
            });

            await expect(client.getProject(999)).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should retry attachment downloads on 500 server errors', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: async () => 'Server Error',
                })
                .mockResolvedValueOnce(new Response(new ArrayBuffer(4), { status: 200 }));

            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(vi.mocked(sleep)).toHaveBeenCalledWith(1000);
        });

        it('should use Retry-After header when retrying attachment downloads after 429', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: { get: (header: string) => (header === 'Retry-After' ? '5' : null) },
                    text: async () => 'Rate limited',
                })
                .mockResolvedValueOnce(new Response(new ArrayBuffer(4), { status: 200 }));

            await client.getAttachment(1);
            expect(mockSleep).toHaveBeenCalledWith(5000);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should retry attachment downloads on network errors', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce(new Response(new ArrayBuffer(4), { status: 200 }));

            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(vi.mocked(sleep)).toHaveBeenCalledWith(1000);
        });

        // ── Non-idempotent retry contract (B013) ──────────────────────────────
        //
        // POST/PUT/DELETE must NOT retry on 5xx or network errors because the
        // server may have already processed the write — retrying would create
        // duplicate records. POST MUST still retry on 429 because TestRail's
        // rate limiter rejects the request before it executes.

        it('should NOT retry POST on 5xx (write may have been processed)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                text: async () => 'Server Error',
                headers: { get: () => null },
            });

            await expect(client.addProject({ name: 'p' })).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should NOT retry POST on 500', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server Error',
                headers: { get: () => null },
            });

            await expect(client.updateProject(1, { name: 'p' })).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should NOT retry POST on network error (mid-flight write ambiguous)', async () => {
            mockFetch.mockRejectedValueOnce(new Error('ECONNRESET'));

            await expect(client.addProject({ name: 'p' })).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should retry POST on 429 (rate-limited writes are rejected before execution)', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: { get: () => null },
                    text: async () => 'Rate limited',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'test' }),
                });

            const result = await client.addProject({ name: 'p' });
            expect(result.id).toBe(1);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should honor Retry-After on POST 429', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '2' : null) },
                    text: async () => 'Rate limited',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'test' }),
                });

            await client.addProject({ name: 'p' });
            expect(mockSleep).toHaveBeenCalledWith(2000);
        });

        // ── Retry-After honored on retryable 5xx (BACKLOG SEC #25) ────────────
        //
        // Before SEC #25 the Retry-After header was honored only on 429.
        // TestRail and front proxies (nginx, Cloudflare) commonly emit it on
        // 502/503/504 during maintenance. Honoring it on GET 5xx (retry is
        // already gated to idempotent methods) prevents the client from
        // hammering an upstream that explicitly told it how long to wait,
        // while keeping the safety cap (`MAX_RETRY_DELAY_MS`) and the
        // null-falls-back-to-backoff guard for zero / past / invalid values.

        it('should honor Retry-After (seconds) on GET 503', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '7' : null) },
                    text: async () => 'maintenance',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

            await client.getProject(1);
            expect(mockSleep).toHaveBeenCalledWith(7000);
        });

        it('should honor Retry-After (HTTP-date) on GET 502', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            const now = new Date('2026-01-01T00:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(now);

            try {
                const retryAfterDate = new Date(now.getTime() + 4000).toUTCString();

                mockFetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 502,
                        statusText: 'Bad Gateway',
                        headers: { get: (h: string) => (h === 'Retry-After' ? retryAfterDate : null) },
                        text: async () => 'upstream down',
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null },
                        text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                    });

                await client.getProject(1);
                expect(mockSleep).toHaveBeenCalledWith(4000);
            } finally {
                vi.useRealTimers();
            }
        });

        it('should cap excessively large Retry-After seconds on GET 504 to MAX_RETRY_DELAY_MS', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 504,
                    statusText: 'Gateway Timeout',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '999999' : null) },
                    text: async () => 'timeout',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

            await client.getProject(1);
            expect(mockSleep).toHaveBeenCalledWith(10000);
        });

        it('should fall back to exponential backoff on GET 503 when Retry-After is absent', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { get: () => null },
                    text: async () => 'maintenance',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

            await client.getProject(1);
            // First retry (retryCount=0): 1000 * 2^0 = 1000ms
            expect(mockSleep).toHaveBeenCalledWith(1000);
        });

        it('should fall back to backoff on GET 503 when Retry-After is "0" (guards hot loop)', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    // A literal "0" must NOT cause a zero-sleep hot loop.
                    headers: { get: (h: string) => (h === 'Retry-After' ? '0' : null) },
                    text: async () => 'maintenance',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

            await client.getProject(1);
            // parseRetryAfterMs returns null for "0" → exponential backoff (1000 ms)
            expect(mockSleep).toHaveBeenCalledWith(1000);
        });

        it('should fall back to backoff on GET 503 when Retry-After is unparseable', async () => {
            const mockSleep = vi.mocked(sleep);
            mockSleep.mockClear();

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { get: (h: string) => (h === 'Retry-After' ? 'nonsense' : null) },
                    text: async () => 'maintenance',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null },
                    text: async () => JSON.stringify({ id: 1, name: 'Test', suite_mode: 1, url: 'test' }),
                });

            await client.getProject(1);
            expect(mockSleep).toHaveBeenCalledWith(1000);
        });

        it('should NOT retry POST 503 even if Retry-After is present (write idempotency)', async () => {
            // Reasserts the B013 contract: a 5xx on a non-idempotent method
            // surfaces immediately. Retry-After on POST 5xx is intentionally
            // ignored — a server may have processed the write before failing,
            // and retrying would risk a duplicate.
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                headers: { get: (h: string) => (h === 'Retry-After' ? '1' : null) },
                text: async () => 'maintenance',
            });

            await expect(client.addProject({ name: 'p' })).rejects.toThrow(TestRailApiError);
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
            });

            try {
                await client.getProject(999);
            } catch (error) {
                expect(error).toBeInstanceOf(TestRailApiError);
                const apiError = error as TestRailApiError;
                expect(apiError.status).toBe(404);
                expect(apiError.statusText).toBe('Not Found');
                expect(apiError.response).toBeDefined();
                expect(apiError.response).toBe('Project not found');
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
            });

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
            });

            const result = await client.getUserByEmail('test@example.com');
            expect(result.email).toBe('test@example.com');
        });
    });

    describe('requestBinary - retry, timeout, and network error paths', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 1,
                enableCache: false,
            });
        });

        it('should retry requestBinary on 5xx and succeed on second attempt', async () => {
            const buffer = new ArrayBuffer(4);
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    text: async () => 'server error',
                    headers: { get: () => null },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    arrayBuffer: async () => buffer,
                });

            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(sleep).toHaveBeenCalledTimes(1);
        });

        it('should retry requestBinary on 429 using Retry-After header', async () => {
            const buffer = new ArrayBuffer(4);
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    text: async () => 'rate limited',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '1' : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    arrayBuffer: async () => buffer,
                });

            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(sleep).toHaveBeenCalledWith(1000); // 1 second from Retry-After
        });

        it('should retry requestBinary on 503 using Retry-After header (BACKLOG SEC #25)', async () => {
            const buffer = new ArrayBuffer(4);
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    text: async () => 'maintenance',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '2' : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    arrayBuffer: async () => buffer,
                });

            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(sleep).toHaveBeenCalledWith(2000);
        });

        it('should throw TestRailApiError after exhausting retries on 5xx', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'server error',
                headers: { get: () => null },
            });

            await expect(client.getAttachment(1)).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(2); // 1 original + 1 retry
        });

        it('should throw TestRailApiError on requestBinary timeout (AbortError)', async () => {
            mockFetch.mockImplementationOnce(() => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                return Promise.reject(err);
            });

            await expect(client.getAttachment(1)).rejects.toThrow('Request timeout after');
        });

        it('should retry requestBinary on network error and succeed', async () => {
            const buffer = new ArrayBuffer(4);
            mockFetch.mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                arrayBuffer: async () => buffer,
            });

            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw TestRailApiError after exhausting retries on network error', async () => {
            mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

            await expect(client.getAttachment(1)).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(2); // 1 original + 1 retry
        });

        it('should await DNS validation before binary download request', async () => {
            let resolveDnsLookup: ((value: unknown) => void) | undefined;
            mockDnsLookup.mockReturnValueOnce(
                new Promise((resolve) => {
                    resolveDnsLookup = resolve;
                }),
            );
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });

            const downloadPromise = client.getAttachment(1);
            await Promise.resolve();
            expect(mockFetch).not.toHaveBeenCalled();

            mockFetch.mockResolvedValueOnce(new Response(new ArrayBuffer(4), { status: 200 }));
            resolveDnsLookup?.([{ address: '203.0.113.20', family: 4 }]);

            await downloadPromise;
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('requestMultipart - Uint8Array input path', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
            });
        });

        it('should upload a Uint8Array as attachment', async () => {
            const attachment = { attachment_id: 99, name: 'data.bin' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify(attachment),
            });

            const uint8 = new Uint8Array([1, 2, 3, 4]);
            const result = await client.addAttachmentToCase(1, uint8, 'data.bin');
            expect(result).toEqual(attachment);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_attachment_to_case/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should handle timeout in requestMultipart (AbortError)', async () => {
            mockFetch.mockImplementationOnce(() => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                return Promise.reject(err);
            });

            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToCase(1, blob, 'file.txt')).rejects.toThrow('Request timeout after');
        });

        it('should handle network error in requestMultipart', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network failure'));

            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToCase(1, blob, 'file.txt')).rejects.toThrow(TestRailApiError);
        });

        it('should handle API error response in requestMultipart', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                text: async () => 'Access denied',
            });

            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToCase(1, blob, 'file.txt')).rejects.toThrow(TestRailApiError);
        });

        it('should return empty object when multipart response body is empty', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => '',
            });

            const blob = new globalThis.Blob(['data']);
            const result = await client.addAttachmentToCase(1, blob, 'file.txt');
            expect(result).toEqual({});
        });

        it('should throw on invalid JSON in multipart response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => 'not-json{',
            });

            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToCase(1, blob, 'file.txt')).rejects.toThrow(TestRailApiError);
        });

        it('should await DNS validation before multipart upload request', async () => {
            let resolveDnsLookup: ((value: unknown) => void) | undefined;
            mockDnsLookup.mockReturnValueOnce(
                new Promise((resolve) => {
                    resolveDnsLookup = resolve;
                }),
            );
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });

            const blob = new globalThis.Blob(['x'], { type: 'text/plain' });
            const uploadPromise = client.addAttachmentToCase(1, blob, 'x.txt');
            await Promise.resolve();
            expect(mockFetch).not.toHaveBeenCalled();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify({}),
            });
            resolveDnsLookup?.([{ address: '203.0.113.10', family: 4 }]);

            await uploadPromise;
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('requestMultipart after destroy', () => {
        it('should throw when requestMultipart is called after destroy()', async () => {
            const destroyedClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
            destroyedClient.destroy();

            const blob = new globalThis.Blob(['data']);
            await expect(destroyedClient.addAttachmentToCase(1, blob, 'file.txt')).rejects.toThrow(
                'Cannot use TestRailClient after destroy() has been called',
            );
        });
    });

    describe('requestBinary after destroy', () => {
        it('should throw when requestBinary is called after destroy()', async () => {
            const destroyedClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
            destroyedClient.destroy();

            await expect(destroyedClient.getAttachment(1)).rejects.toThrow(
                'Cannot use TestRailClient after destroy() has been called',
            );
        });
    });

    describe('requestText - retry, timeout, and network error paths', () => {
        beforeEach(() => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 1,
                enableCache: false,
            });
        });

        it('should retry on 5xx and succeed on second attempt', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    text: async () => 'server error',
                    headers: { get: () => null },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => 'Feature: ok\n',
                    headers: { get: () => null },
                });

            const result = await client.getBdd(1);
            expect(result).toBe('Feature: ok\n');
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(sleep).toHaveBeenCalledTimes(1);
        });

        it('should retry on 429 honoring Retry-After header', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    text: async () => 'rate limited',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '1' : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => 'Feature: ok\n',
                    headers: { get: () => null },
                });

            const result = await client.getBdd(1);
            expect(result).toBe('Feature: ok\n');
            expect(sleep).toHaveBeenCalledWith(1000);
        });

        it('should retry on GET 503 honoring Retry-After header (BACKLOG SEC #25)', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    text: async () => 'maintenance',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '2' : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => 'Feature: ok\n',
                    headers: { get: () => null },
                });

            const result = await client.getBdd(1);
            expect(result).toBe('Feature: ok\n');
            expect(sleep).toHaveBeenCalledWith(2000);
        });

        it('should throw TestRailApiError after exhausting retries on 5xx', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'server error',
                headers: { get: () => null },
            });

            await expect(client.getBdd(1)).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(2); // 1 original + 1 retry
        });

        it('should throw TestRailApiError on requestText timeout (AbortError)', async () => {
            mockFetch.mockImplementationOnce(() => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                return Promise.reject(err);
            });

            await expect(client.getBdd(1)).rejects.toThrow('Request timeout after');
        });

        it('should retry on network error and succeed', async () => {
            mockFetch.mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => 'Feature: ok\n',
                headers: { get: () => null },
            });

            const result = await client.getBdd(1);
            expect(result).toBe('Feature: ok\n');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw TestRailApiError after exhausting retries on network error', async () => {
            mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

            await expect(client.getBdd(1)).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(2); // 1 original + 1 retry
        });

        it('should throw when requestText is called after destroy()', async () => {
            const destroyedClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
            destroyedClient.destroy();

            await expect(destroyedClient.getBdd(1)).rejects.toThrow(
                'Cannot use TestRailClient after destroy() has been called',
            );
        });

        // ── Non-idempotent retry contract for requestText (B013) ──────────────
        // Mirrors the request<T>() contract: POST does not retry on 5xx or
        // network errors; 429 still retries.

        it('should NOT retry POST on 5xx via requestText', async () => {
            const freshClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 2,
                enableCache: false,
            });
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                text: async () => 'server error',
                headers: { get: () => null },
            });

            await expect(freshClient.requestText('POST', 'noop_endpoint', { x: 1 })).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should NOT retry POST on network error via requestText', async () => {
            const freshClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 2,
                enableCache: false,
            });
            mockFetch.mockRejectedValue(new Error('ECONNRESET'));

            await expect(freshClient.requestText('POST', 'noop_endpoint', { x: 1 })).rejects.toThrow(TestRailApiError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should retry POST on 429 via requestText', async () => {
            const freshClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 2,
                enableCache: false,
            });
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    text: async () => 'rate limited',
                    headers: { get: (h: string) => (h === 'Retry-After' ? '1' : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => 'ack',
                    headers: { get: () => null },
                });

            const result = await freshClient.requestText('POST', 'noop_endpoint', { x: 1 });
            expect(result).toBe('ack');
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(sleep).toHaveBeenCalledWith(1000);
        });

        it('should JSON-stringify the body when requestText is called with data', async () => {
            // Exercises the `if (data !== undefined) { options.body = JSON.stringify(data) }`
            // branch in `requestText`. The retry/AbortError tests above call
            // GET-only and never hit this path, so we cover it explicitly here.
            const freshClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 0,
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => 'ack',
                headers: { get: () => null },
            });

            const payload = { foo: 'bar', n: 1 };
            const result = await freshClient.requestText('POST', 'noop_endpoint', payload);

            expect(result).toBe('ack');
            const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
            expect(opts.method).toBe('POST');
            expect(opts.body).toBe(JSON.stringify(payload));
        });

        it('should invalidate JSON cache on mutating requestText call (POST)', async () => {
            // First, prime the cache with a JSON GET.
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () =>
                    JSON.stringify({ id: 1, name: 'Proj', suite_mode: 1, url: 'https://example.testrail.io/p/1' }),
                headers: { get: () => null },
            });
            const freshClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 0,
            });
            await freshClient.getProject(1);

            // Now invoke requestText with a POST method via the public API surface:
            // BddModule does GET only, so call requestText directly to exercise the
            // POST branch that clears the cache.
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => 'ok',
                headers: { get: () => null },
            });
            await freshClient.requestText('POST', 'noop_endpoint');

            // After cache clear, GET will hit the network again.
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () =>
                    JSON.stringify({ id: 1, name: 'Proj', suite_mode: 1, url: 'https://example.testrail.io/p/1' }),
                headers: { get: () => null },
            });
            await freshClient.getProject(1);
            // 3 calls total: initial GET, POST via requestText, second GET after cache invalidation.
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });
    });

    describe('validateConfig - additional URL edge cases', () => {
        it('should throw for a non-parseable URL string', () => {
            expect(() => {
                new TestRailClient({
                    baseUrl: 'not-a-valid-url',
                    email: 'test@example.com',
                    apiKey: 'api-key',
                });
            }).toThrow(TestRailValidationError);
        });
    });

    describe('parseRetryAfterMs - past HTTP-date', () => {
        it('should fall back to exponential backoff when Retry-After date is in the past', async () => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 1,
                enableCache: false,
            });

            const pastDate = new Date(Date.now() - 60_000).toUTCString();
            const mockProject = { id: 1, name: 'P', suite_mode: 1, url: '' };

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    text: async () => 'rate limited',
                    headers: { get: (h: string) => (h === 'Retry-After' ? pastDate : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(mockProject),
                });

            const result = await client.getProject(1);
            expect(result.id).toBe(1);
            // sleep was called with the exponential backoff delay (not Retry-After)
            expect(sleep).toHaveBeenCalledWith(1000);
        });
    });

    describe('parseRetryAfterMs - invalid format', () => {
        it('should fall back to exponential backoff when Retry-After value is neither a number nor a date', async () => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 1,
                enableCache: false,
            });

            const mockProject = { id: 1, name: 'P', suite_mode: 1, url: '' };

            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests',
                    text: async () => 'rate limited',
                    headers: { get: (h: string) => (h === 'Retry-After' ? 'not-a-date-or-number' : null) },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: async () => JSON.stringify(mockProject),
                });

            const result = await client.getProject(1);
            expect(result.id).toBe(1);
            // Invalid format → parseRetryAfterMs returns null → exponential backoff
            expect(sleep).toHaveBeenCalledWith(1000);
        });
    });

    describe('response.text() failure handling', () => {
        it('should use "Unknown error" when response.text() throws in request()', async () => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 0,
                enableCache: false,
            });

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => {
                    throw new Error('stream read error');
                },
                headers: { get: () => null },
            });

            await expect(client.getProject(1)).rejects.toThrow(TestRailApiError);
        });

        it('should use "Unknown error" when response.text() throws in requestMultipart()', async () => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
            });

            const blob = new globalThis.Blob(['test'], { type: 'text/plain' });

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: async () => {
                    throw new Error('stream read error');
                },
                headers: { get: () => null },
            });

            await expect(client.addAttachmentToCase(1, blob, 'test.txt')).rejects.toThrow(TestRailApiError);
        });

        it('should use "Unknown error" when response.text() throws in requestBinary()', async () => {
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxRetries: 0,
                enableCache: false,
            });

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => {
                    throw new Error('stream read error');
                },
                headers: { get: () => null },
            });

            await expect(client.getAttachment(1)).rejects.toThrow(TestRailApiError);
        });
    });

    describe('setTimeout abort callback coverage', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('should abort request() via setTimeout callback when fetch hangs beyond timeout', async () => {
            const timeoutMs = 50;
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                timeout: timeoutMs,
                enableCache: false,
                allowPrivateHosts: true,
            });

            vi.useFakeTimers();

            mockFetch.mockImplementation((_url: string, options: RequestInit) => {
                return new Promise((_resolve, reject) => {
                    options.signal?.addEventListener('abort', () => {
                        const err = new Error('aborted');
                        err.name = 'AbortError';
                        reject(err);
                    });
                });
            });

            // Attach rejection handler BEFORE advancing timers to avoid unhandled-rejection reports
            const assertion = expect(client.getProject(1)).rejects.toThrow(`Request timeout after ${timeoutMs}ms`);
            await vi.runAllTimersAsync();
            await assertion;
        });

        it('should abort requestBinary() via setTimeout callback when fetch hangs beyond timeout', async () => {
            const timeoutMs = 50;
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                timeout: timeoutMs,
                enableCache: false,
                allowPrivateHosts: true,
            });

            vi.useFakeTimers();

            mockFetch.mockImplementation((_url: string, options: RequestInit) => {
                return new Promise((_resolve, reject) => {
                    options.signal?.addEventListener('abort', () => {
                        const err = new Error('aborted');
                        err.name = 'AbortError';
                        reject(err);
                    });
                });
            });

            const assertion = expect(client.getAttachment(1)).rejects.toThrow(`Request timeout after ${timeoutMs}ms`);
            await vi.runAllTimersAsync();
            await assertion;
        });

        it('should abort requestMultipart() via setTimeout callback when fetch hangs beyond timeout', async () => {
            const timeoutMs = 50;
            client = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                timeout: timeoutMs,
                enableCache: false,
                allowPrivateHosts: true,
            });

            vi.useFakeTimers();

            mockFetch.mockImplementation((_url: string, options: RequestInit) => {
                return new Promise((_resolve, reject) => {
                    options.signal?.addEventListener('abort', () => {
                        const err = new Error('aborted');
                        err.name = 'AbortError';
                        reject(err);
                    });
                });
            });

            const blob = new globalThis.Blob(['data'], { type: 'text/plain' });
            const assertion = expect(client.addAttachmentToCase(1, blob, 'file.txt')).rejects.toThrow(
                `Request timeout after ${timeoutMs}ms`,
            );
            await vi.runAllTimersAsync();
            await assertion;
        });
    });

    describe('allowInsecure warning (SEC #26)', () => {
        it('warns when allowInsecure is enabled with an http:// baseUrl', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            try {
                const c = new TestRailClient({
                    baseUrl: 'http://localhost/testrail',
                    email: 'test@example.com',
                    apiKey: 'api-key',
                    allowInsecure: true,
                    allowPrivateHosts: true,
                });
                expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('allowInsecure is enabled'));
                c.destroy();
            } finally {
                warnSpy.mockRestore();
            }
        });

        it('does not warn for https:// baseUrl even with allowInsecure set', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            try {
                const c = new TestRailClient({
                    baseUrl: 'https://example.testrail.io',
                    email: 'test@example.com',
                    apiKey: 'api-key',
                    allowInsecure: true,
                });
                expect(warnSpy).not.toHaveBeenCalled();
                c.destroy();
            } finally {
                warnSpy.mockRestore();
            }
        });
    });

    describe('destroy() exception safety (SEC #28)', () => {
        it('is idempotent after a throwing cleanup', () => {
            const c = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
            const spy = vi.spyOn(c as unknown as { clearCache: () => void }, 'clearCache').mockImplementation(() => {
                throw new Error('boom');
            });
            expect(() => c.destroy()).toThrow('boom');
            expect(() => c.destroy()).not.toThrow();
            spy.mockRestore();
        });

        it('cleanupAllClients sweep continues past a throwing client', () => {
            // Without the per-client try/catch in cleanupAllClients, a throwing
            // client aborts the sweep and siblings are never destroyed.
            const bad = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                registerProcessHandlers: true,
            });
            const good = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
            });
            vi.spyOn(bad as unknown as { clearCache: () => void }, 'clearCache').mockImplementation(() => {
                throw new Error('boom');
            });
            const goodSpy = vi.spyOn(good, 'destroy');
            process.emit('exit', 0);
            expect(goodSpy).toHaveBeenCalledOnce();
            goodSpy.mockRestore();
        });
    });

    describe('Cache mutable-reference protection (SEC #14)', () => {
        it('mutating a returned cached object does not affect future cache reads', async () => {
            const wt = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheTtl: 60_000,
            });
            try {
                mockFetch.mockResolvedValueOnce(
                    mockOk({ id: 1, name: 'Original', suite_mode: 1, url: 'u', is_completed: false }),
                );
                const first = await wt.getProject(1);
                (first as { name: string }).name = 'Tampered';
                const second = await wt.getProject(1);
                expect(second.name).toBe('Original');
                expect(mockFetch).toHaveBeenCalledTimes(1);
            } finally {
                wt.destroy();
            }
        });
    });

    describe('GET request coalescing (SEC #23)', () => {
        it('deduplicates concurrent identical GET requests into a single upstream call', async () => {
            const wt = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheTtl: 60_000,
            });
            try {
                // Fire the same GET three times concurrently before any response arrives.
                // Only one actual fetch should hit the mock.
                mockFetch.mockResolvedValueOnce(
                    mockOk({ id: 1, name: 'Proj', suite_mode: 1, url: 'u', is_completed: false }),
                );

                const [r1, r2, r3] = await Promise.all([wt.getProject(1), wt.getProject(1), wt.getProject(1)]);

                expect(mockFetch).toHaveBeenCalledTimes(1);
                expect(r1).toEqual(r2);
                expect(r2).toEqual(r3);
            } finally {
                wt.destroy();
            }
        });

        it('does not coalesce requests with skipCache=true', async () => {
            const wt = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheTtl: 60_000,
            });
            try {
                mockFetch
                    .mockResolvedValueOnce(mockOk({ id: 1, name: 'A', suite_mode: 1, url: 'u', is_completed: false }))
                    .mockResolvedValueOnce(mockOk({ id: 1, name: 'B', suite_mode: 1, url: 'u', is_completed: false }));

                const [r1, r2] = await Promise.all([
                    wt.request<{ id: number; name: string }>('GET', 'get_project/1', undefined, 0, true),
                    wt.request<{ id: number; name: string }>('GET', 'get_project/1', undefined, 0, true),
                ]);

                expect(mockFetch).toHaveBeenCalledTimes(2);
                expect(r1.name).toBe('A');
                expect(r2.name).toBe('B');
            } finally {
                wt.destroy();
            }
        });

        it('clearCache() from a POST clears pendingRequests so late joiners re-fetch', async () => {
            // Scenario: GET starts → POST fires + completes (clearCache) → new GET arrives
            // while the original GET is still in flight.  Without pendingRequests.clear()
            // in clearCache() the new GET would coalesce onto the stale in-flight promise.
            let resolveGet!: (v: Response) => void;
            const delayedGet = new Promise<Response>((res) => {
                resolveGet = res;
            });

            const wt = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: false,
                maxRetries: 0,
            });
            try {
                // The first GET is delayed so we can interleave a POST.
                mockFetch
                    .mockReturnValueOnce(delayedGet)
                    .mockResolvedValueOnce(mockOk({})) // POST
                    .mockResolvedValueOnce(
                        mockOk({ id: 1, name: 'Fresh', suite_mode: 1, url: 'u', is_completed: false }),
                    ); // second GET after POST

                const firstGet = wt.request<{ id: number }>('GET', 'get_project/1');

                // POST fires and resolves → clearCache() is called → pendingRequests cleared.
                await wt.request<Record<string, never>>('POST', 'update_project/1', {});

                // Now resolve the first GET *after* the POST cleared pendingRequests.
                resolveGet(mockOk({ id: 1, name: 'Stale', suite_mode: 1, url: 'u', is_completed: false }));
                await firstGet;

                // A new GET should not coalesce on the now-cleared map; it must issue a fresh fetch.
                const secondGet = await wt.request<{ id: number; name: string }>('GET', 'get_project/1');

                // 3 total fetches: first GET + POST + second GET
                expect(mockFetch).toHaveBeenCalledTimes(3);
                expect(secondGet.name).toBe('Fresh');
            } finally {
                wt.destroy();
            }
        });

        it('retries do not deadlock when the key is still in pendingRequests', async () => {
            const wt = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheTtl: 60_000,
                maxRetries: 1,
            });
            try {
                mockFetch
                    .mockResolvedValueOnce(mockErr(503, 'Service Unavailable'))
                    .mockResolvedValueOnce(mockOk({ id: 1, name: 'OK', suite_mode: 1, url: 'u', is_completed: false }));

                // A GET with maxRetries=1 will retry on 503 while the key is still in
                // pendingRequests.  If the retry re-uses skipCache=false it would pick up
                // its own promise → deadlock.  With the fix it passes skipCache=true and
                // resolves cleanly.
                const result = await wt.getProject(1);
                expect(result.name).toBe('OK');
                expect(mockFetch).toHaveBeenCalledTimes(2);
            } finally {
                wt.destroy();
            }
        });

        it('removes the pending entry after rejection so subsequent calls retry', async () => {
            const wt = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                enableCache: true,
                cacheTtl: 60_000,
                maxRetries: 0,
            });
            try {
                mockFetch
                    .mockRejectedValueOnce(new Error('network error'))
                    .mockResolvedValueOnce(mockOk({ id: 1, name: 'OK', suite_mode: 1, url: 'u', is_completed: false }));

                // First call fails
                await expect(wt.getProject(1)).rejects.toThrow();

                // Second call (after rejection) must retry, not return the rejected promise
                const result = await wt.getProject(1);
                expect(result.name).toBe('OK');
                expect(mockFetch).toHaveBeenCalledTimes(2);
            } finally {
                wt.destroy();
            }
        });
    });
});
