import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/client.js';
import type { RequestSpec } from '../src/http-pipeline-types.js';
import { mockOk } from './helpers.js';

const { mockDnsLookup } = vi.hoisted(() => ({
    mockDnsLookup: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sleep so retry backoff never really waits.
vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('node:dns/promises', () => ({ lookup: mockDnsLookup }));

const CONFIG = {
    baseUrl: 'https://example.testrail.io',
    email: 'test@example.com',
    apiKey: 'test-api-key',
};

// Reach into the private request-spec surface for assertions.
type RequestSpy = { request: <T>(spec: RequestSpec<T>) => Promise<T> };

describe('TestRailClient.withTimeout', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        mockDnsLookup.mockReset();
        mockDnsLookup.mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
        // A Response body can only be read once — return a FRESH Response per
        // call so multi-fetch tests don't hit a consumed body.
        mockFetch.mockImplementation(() =>
            Promise.resolve(mockOk({ id: 1, name: 'Test Project', suite_mode: 1, url: 'u' })),
        );
        client = new TestRailClient(CONFIG);
    });

    afterEach(() => {
        client.destroy();
        vi.useRealTimers();
    });

    describe('spec injection', () => {
        it('injects the override timeout and tracks the body deadline when bodyTimeout is implicit', async () => {
            const spy = vi.spyOn(client as unknown as RequestSpy, 'request');
            await client.withTimeout(120000).projects.getProject(1);

            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({ timeout: 120000, bodyTimeout: 120000 }),
            );
        });

        it('preserves an explicitly configured bodyTimeout while overriding the header timeout', async () => {
            const explicit = new TestRailClient({ ...CONFIG, bodyTimeout: 5000 });
            const spy = vi.spyOn(explicit as unknown as RequestSpy, 'request');
            await explicit.withTimeout(120000).projects.getProject(1);

            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({ timeout: 120000, bodyTimeout: 5000 }),
            );
            explicit.destroy();
        });

        it('chains last-wins', async () => {
            const spy = vi.spyOn(client as unknown as RequestSpy, 'request');
            await client.withTimeout(1000).withTimeout(9000).projects.getProject(1);

            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ timeout: 9000, bodyTimeout: 9000 }));
            // The 1000ms inner view must not win.
            expect(spy).not.toHaveBeenCalledWith(expect.objectContaining({ timeout: 1000 }));
        });

        it('leaves normal (non-view) calls without a per-request timeout override', async () => {
            const spy = vi.spyOn(client as unknown as RequestSpy, 'request');
            await client.projects.getProject(1);
            const [spec] = spy.mock.calls[0] as [RequestSpec<unknown>];
            expect(spec.timeout).toBeUndefined();
            expect(spec.bodyTimeout).toBeUndefined();
        });
    });

    describe('abort uses the override timeout', () => {
        it('surfaces the override in the 408 timeout message', async () => {
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

            const assertion = expect(client.withTimeout(50).projects.getProject(1)).rejects.toThrow(
                'Request timeout after 50ms',
            );
            await vi.runAllTimersAsync();
            await assertion;
        });
    });

    describe('shared state (not a second client)', () => {
        it('shares the GET cache with the root client', async () => {
            const view = client.withTimeout(1000);
            await view.projects.getProject(1); // populates PARSED:GET cache
            await client.projects.getProject(1); // should hit the shared cache
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('invalidates the root cache when a write goes through the view (generation coherence)', async () => {
            await client.projects.getProject(1); // populate cache (fetch #1)
            expect(mockFetch).toHaveBeenCalledTimes(1);

            mockFetch.mockImplementation(() => Promise.resolve(mockOk({ id: 1, name: 'Renamed', suite_mode: 1, url: 'u' })));
            await client.withTimeout(1000).projects.updateProject(1, { name: 'Renamed' }); // write (fetch #2) → clearCache

            await client.projects.getProject(1); // cache was invalidated → refetch (fetch #3)
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('shares the rate-limiter window with the root client', async () => {
            const noCache = new TestRailClient({ ...CONFIG, enableCache: false });
            const view = noCache.withTimeout(1000);
            const rl = (obj: TestRailClient): { requests: number[] } =>
                (obj as unknown as { rateLimiter: { requests: number[] } }).rateLimiter;

            // Same object by reference (view reads it through the prototype).
            expect(rl(view)).toBe(rl(noCache));

            await noCache.projects.getProject(1);
            await view.projects.getProject(1);
            expect(rl(noCache).requests).toHaveLength(2);
            noCache.destroy();
        });

        it('is disabled when the root client is destroyed', async () => {
            const view = client.withTimeout(1000);
            client.destroy();
            await expect(view.projects.getProject(1)).rejects.toThrow('after destroy');
        });

        it('returns a TestRailClient exposing the same module keys as the root', () => {
            const view = client.withTimeout(1000);
            expect(view).toBeInstanceOf(TestRailClient);
            const moduleKeys = (c: TestRailClient): string[] =>
                Object.keys(c).filter((k) => {
                    const v = (c as unknown as Record<string, unknown>)[k];
                    return typeof v === 'object' && v?.constructor?.name.endsWith('Module') === true;
                });
            expect(moduleKeys(view).sort()).toEqual(moduleKeys(client).sort());
            // Each module is a fresh instance bound to the view, not shared with the root.
            expect(view.projects).not.toBe(client.projects);
        });
    });

    describe('validation', () => {
        it.each([0, -1, -100, Number.NaN, Number.POSITIVE_INFINITY, 300001])(
            'rejects out-of-range timeout %p',
            (ms) => {
                expect(() => client.withTimeout(ms)).toThrow(TestRailValidationError);
            },
        );

        it('accepts the boundary value (5 minutes)', () => {
            expect(() => client.withTimeout(300000)).not.toThrow();
        });

        it('rejects a non-number timeout', () => {
            expect(() => client.withTimeout('50' as unknown as number)).toThrow(TestRailValidationError);
        });
    });

    describe('rejection propagation', () => {
        it('propagates API errors from calls made through the view', async () => {
            mockFetch.mockResolvedValue(new Response('nope', { status: 500, statusText: 'Server Error' }));
            const noRetry = new TestRailClient({ ...CONFIG, maxRetries: 0 });
            await expect(noRetry.withTimeout(1000).projects.getProject(1)).rejects.toThrow(TestRailApiError);
            noRetry.destroy();
        });
    });
});
