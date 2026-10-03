import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { TestRailClient } from '../src/client.js';

const ItemSchema = z.object({ id: z.number() });

describe('transport deadline regressions', () => {
    const clients: TestRailClient[] = [];

    afterEach(() => {
        clients.forEach((client) => client.destroy());
        clients.length = 0;
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it.each([
        { phase: 'DNS', timeout: 1_000, elapsed: 20, aggregate: true },
        { phase: 'DNS', timeout: 20, elapsed: 20, aggregate: true },
        { phase: 'DNS', timeout: 10, elapsed: 10, aggregate: false },
        { phase: 'fetch', timeout: 1_000, elapsed: 20, aggregate: true },
        { phase: 'fetch', timeout: 20, elapsed: 20, aggregate: true },
        { phase: 'fetch', timeout: 10, elapsed: 10, aggregate: false },
    ])(
        'preserves the $phase deadline owner when timeout $timeout fires before the wall clock',
        async ({ phase, timeout, elapsed, aggregate }) => {
            vi.useFakeTimers();
            const now = vi.spyOn(Date, 'now').mockReturnValue(0);
            let resolveDns!: (addresses: { address: string; family: number }[]) => void;
            const dns = new Promise<{ address: string; family: number }[]>((resolve) => {
                resolveDns = resolve;
            });
            const fetch = vi.fn<typeof globalThis.fetch>(
                (_url, init) =>
                    new Promise((_resolve, reject) => {
                        init?.signal?.addEventListener(
                            'abort',
                            () => {
                                reject(new globalThis.DOMException('Aborted', 'AbortError'));
                            },
                            { once: true },
                        );
                    }),
            );
            const client = new TestRailClient({
                baseUrl: 'https://example.test',
                email: 'agent@example.test',
                apiKey: 'key',
                timeout,
                cacheCleanupInterval: 0,
                allowPrivateHosts: phase === 'fetch',
                dnsLookup: () => dns,
                fetch,
            });
            clients.push(client);
            const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 20 }));
            const result = operation.result.catch((error: unknown) => error);
            const settled = vi.fn();
            void operation.settled.then(settled);
            await vi.advanceTimersByTimeAsync(0);

            // Node's timer clock can reach its deadline while Date.now still reads
            // one millisecond short. The attempt timer is registered first.
            now.mockReturnValue(elapsed - 1);
            await vi.advanceTimersByTimeAsync(elapsed);
            expect(await result).toMatchObject(
                aggregate
                    ? { name: 'TestRailPaginationError', reason: 'max_duration', pagesFetched: 0, itemsFetched: 0 }
                    : { name: 'TestRailApiError', status: 408, statusText: `Request timeout after ${timeout}ms` },
            );
            if (phase === 'DNS') {
                expect(settled).not.toHaveBeenCalled();
                expect(fetch).not.toHaveBeenCalled();
                resolveDns([{ address: '93.184.216.34', family: 4 }]);
            } else {
                expect(fetch).toHaveBeenCalledOnce();
                expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
            }
            await operation.settled;
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it('does not label an adapter AbortError as aggregate expiry before the timer fires', async () => {
        vi.useFakeTimers();
        vi.spyOn(Date, 'now').mockReturnValue(0);
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockRejectedValue(new globalThis.DOMException('Aborted', 'AbortError'));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            timeout: 1_000,
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);

        await expect(client.projects.getAllProjects({ maxDurationMs: 20 })).rejects.toMatchObject({
            name: 'TestRailApiError',
            status: 408,
            statusText: 'Request timeout after 20ms',
        });
        expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    });

    it('does not consume a rate-limit slot when the aggregate expires before fetch admission', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            enableCache: false,
            rateLimiter: { maxRequests: 1, windowMs: 60_000 },
            fetch,
        });
        clients.push(client);

        // Three readings before the deadline lands, so the request survives
        // `bound(dns)` and `allowanceFor` and is stopped by the admission guard
        // itself — the one this test exists to pin. Collapsing this to a single
        // `mockReturnValue(10)` spends the budget at the first gate instead, and
        // deleting the admission guard then leaves the whole suite green.
        vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(10);

        await expect(
            client.request({ method: 'GET', endpoint: 'get_expired', intent: 'fresh-read', deadlineAt: 10 }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        await expect(client.request<{ id: number }>({ method: 'GET', endpoint: 'get_valid' })).resolves.toEqual({
            id: 1,
        });

        expect(fetch).toHaveBeenCalledOnce();
    });

    it('preserves the collector deadline through a public adapter and its synchronous setup', async () => {
        const fetch = vi.fn();
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(1);

        await expect(client.runs.getAllRuns(1, { createdBy: [1, 2, 3], maxDurationMs: 1 })).rejects.toMatchObject({
            reason: 'max_duration',
            pagesFetched: 0,
            itemsFetched: 0,
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, 'soon' as unknown as number])(
        'rejects a malformed absolute deadline (%s)',
        async (deadlineAt) => {
            const fetch = vi.fn();
            const client = new TestRailClient({
                baseUrl: 'https://example.test',
                email: 'agent@example.test',
                apiKey: 'key',
                allowPrivateHosts: true,
                fetch,
            });
            clients.push(client);

            await expect(
                client.request({ method: 'GET', endpoint: 'get_x', intent: 'fresh-read', deadlineAt }),
            ).rejects.toThrow('deadlineAt must be a finite number');
            expect(fetch).not.toHaveBeenCalled();
        },
    );

    it.each([
        { label: 'raw', validated: false },
        { label: 'schema-validated', validated: true },
    ])('applies a $label caller deadline while sharing an ordinary in-flight GET', async ({ validated }) => {
        vi.useFakeTimers();
        const fetch = vi.fn().mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    setTimeout(() => resolve(new Response('{"id":1}', { status: 200 })), 60);
                }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        const schema = validated ? { schema: ItemSchema } : {};

        const ordinary = client.request<{ id: number }>({ method: 'GET', endpoint: 'get_shared', ...schema });
        await vi.advanceTimersByTimeAsync(0);
        expect(fetch).toHaveBeenCalledOnce();

        const bounded = client.request<{ id: number }>({
            method: 'GET',
            endpoint: 'get_shared',
            deadlineAt: Date.now() + 10,
            ...schema,
        });
        const boundedAssertion = expect(bounded).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        await vi.advanceTimersByTimeAsync(10);
        await boundedAssertion;
        expect(fetch).toHaveBeenCalledOnce();

        await vi.advanceTimersByTimeAsync(50);
        await expect(ordinary).resolves.toEqual({ id: 1 });
    });

    it.each([
        { label: 'raw', validated: false },
        { label: 'schema-validated', validated: true },
    ])('does not make an ordinary $label caller inherit the initiating caller deadline', async ({ validated }) => {
        vi.useFakeTimers();
        let fetchCall = 0;
        const fetch = vi.fn().mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    fetchCall += 1;
                    const id = fetchCall;
                    setTimeout(() => resolve(new Response(`{"id":${id}}`, { status: 200 })), 60);
                }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        const schema = validated ? { schema: ItemSchema } : {};

        const bounded = client.request<{ id: number }>({
            method: 'GET',
            endpoint: 'get_shared',
            deadlineAt: Date.now() + 10,
            ...schema,
        });
        await vi.advanceTimersByTimeAsync(0);
        const ordinary = client.request<{ id: number }>({ method: 'GET', endpoint: 'get_shared', ...schema });
        await vi.advanceTimersByTimeAsync(0);
        expect(fetch).toHaveBeenCalledTimes(2);

        const boundedAssertion = expect(bounded).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        await vi.advanceTimersByTimeAsync(10);
        await boundedAssertion;

        await vi.advanceTimersByTimeAsync(50);
        await expect(ordinary).resolves.toEqual({ id: 2 });
    });

    it('invalidates cached GETs once a successful write response is known', async () => {
        let clock = 0;
        const fetch = vi
            .fn()
            .mockResolvedValueOnce(new Response('{"name":"old"}', { status: 200 }))
            .mockImplementationOnce(() =>
                Promise.resolve().then(() => {
                    clock = 10;
                    return new Response('{"name":"write-result"}', { status: 200 });
                }),
            )
            .mockResolvedValueOnce(new Response('{"name":"fresh"}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockImplementation(() => clock);

        await expect(client.request<{ name: string }>({ method: 'GET', endpoint: 'get_cached' })).resolves.toEqual({
            name: 'old',
        });
        await expect(
            client.request({
                method: 'POST',
                endpoint: 'add_item',
                body: { kind: 'json', data: { name: 'write' } },
                deadlineAt: 10,
            }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        await expect(client.request<{ name: string }>({ method: 'GET', endpoint: 'get_cached' })).resolves.toEqual({
            name: 'fresh',
        });

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    // DNS runs before the fetch phase and `dns.lookup` has no JS-visible
    // deadline of its own, so the configured `timeout` has to cover it.
    // Otherwise a resolver that drops packets rather than refusing them keeps
    // `request()` pending indefinitely — and holds a libuv threadpool slot,
    // which starves unrelated fs/crypto work in the host process.
    it('fails the attempt with 408 when the resolver never answers', async () => {
        const fetch = vi.fn();
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            timeout: 50,
            maxRetries: 0,
            dnsLookup: () => new Promise(() => {}),
            fetch,
        });
        clients.push(client);

        await expect(client.projects.getProject(1)).rejects.toMatchObject({ status: 408 });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('charges a slow lookup against the same attempt allowance', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            timeout: 80,
            maxRetries: 0,
            dnsLookup: async () => {
                await new Promise((resolve) => setTimeout(resolve, 400));
                return [{ address: '203.0.113.10', family: 4 }];
            },
            fetch,
        });
        clients.push(client);

        await expect(client.projects.getProject(1)).rejects.toMatchObject({ status: 408 });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('leaves a prompt lookup unaffected', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            timeout: 5000,
            dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }],
            fetch,
        });
        clients.push(client);

        await expect(client.request<{ id: number }>({ method: 'GET', endpoint: 'get_project/1' })).resolves.toEqual({
            id: 1,
        });
        expect(fetch).toHaveBeenCalledOnce();
    });
});
