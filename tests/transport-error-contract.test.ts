import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient } from '../src/client.js';
import { TestRailApiError, TestRailValidationError } from '../src/errors.js';
import type { TestRailConfig } from '../src/types.js';

const PUBLIC_ADDRESS = [{ address: '93.184.216.34', family: 4 }];
const HOST = 'example.testrail.io';

describe('transport error contract', () => {
    const clients: TestRailClient[] = [];

    const createClient = (overrides: Partial<TestRailConfig>): TestRailClient => {
        const client = new TestRailClient({
            baseUrl: `https://${HOST}`,
            email: 'agent@example.test',
            apiKey: 'key',
            cacheCleanupInterval: 0,
            dnsLookup: async () => PUBLIC_ADDRESS,
            ...overrides,
        });
        clients.push(client);
        return client;
    };

    afterEach(() => {
        clients.forEach((client) => client.destroy());
        clients.length = 0;
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('TestRailApiError cause', () => {
        it('accepts ErrorOptions and exposes the cause', () => {
            const cause = new Error('socket hang up');
            const error = new TestRailApiError(0, 'Network error: socket hang up', 'socket hang up', { cause });

            expect(error.cause).toBe(cause);
            expect(error.message).toBe('TestRail API error: 0 Network error: socket hang up');
        });

        it('defines no cause when none is supplied', () => {
            expect('cause' in new TestRailApiError(404, 'Not Found', 'missing')).toBe(false);
        });

        it('keeps the underlying reason of a failed fetch', async () => {
            // Node reports every connect/TLS failure as "fetch failed" and puts
            // the actionable detail on `.cause`.
            const reason = Object.assign(new Error('self-signed certificate in certificate chain'), {
                code: 'SELF_SIGNED_CERT_IN_CHAIN',
            });
            const fetchFailure = new TypeError('fetch failed', { cause: reason });
            const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(fetchFailure);
            const client = createClient({ fetch, maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toBeInstanceOf(TestRailApiError);
            expect(error).toMatchObject({
                status: 0,
                statusText: 'Network error: fetch failed',
                response: 'fetch failed',
            });
            // A custom fetch is caller code, so the cause is a plain copy that
            // keeps the actionable fields.
            const cause = (error as TestRailApiError).cause as Error & { cause?: Error & { code?: string } };
            expect(cause).not.toBe(fetchFailure);
            expect(cause).toMatchObject({ name: 'TypeError', message: 'fetch failed' });
            expect(cause.cause).toMatchObject({
                message: 'self-signed certificate in certificate chain',
                code: 'SELF_SIGNED_CERT_IN_CHAIN',
            });
        });

        it('keeps the raw reason when the built-in fetch failed', async () => {
            const fetchFailure = new TypeError('fetch failed', { cause: new Error('connect ECONNREFUSED') });
            vi.spyOn(globalThis, 'fetch').mockRejectedValue(fetchFailure);
            const client = createClient({ maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect((error as TestRailApiError).cause).toBe(fetchFailure);
        });

        it.each<[string, (init: RequestInit | undefined) => Promise<Response>]>([
            [
                'a rejection with a plain object',
                // A rejection with a non-Error object, as some adapters do.
                // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- the non-Error reason is the case under test
                (init) => Promise.reject({ request: { headers: init?.headers } }),
            ],
            [
                'a body stream that fails with the request attached',
                async (init) =>
                    new Response(
                        new globalThis.ReadableStream<Uint8Array>({
                            pull(controller): void {
                                controller.error(Object.assign(new Error('stream broke'), { config: init }));
                            },
                        }),
                    ),
            ],
            [
                'a fallback body read that fails with the request attached',
                async (init) =>
                    ({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: new globalThis.Headers(),
                        body: null,
                        text: () => Promise.reject(Object.assign(new Error('read failed'), { config: init })),
                        arrayBuffer: () => Promise.reject(Object.assign(new Error('read failed'), { config: init })),
                    }) as unknown as Response,
            ],
        ])('does not expose request headers from a custom fetch through %s', async (_label, respond) => {
            const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => respond(init));
            const client = createClient({ fetch, maxRetries: 0 });
            const credential = Buffer.from('agent@example.test:key').toString('base64');

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toBeInstanceOf(TestRailApiError);
            const { inspect } = await import('node:util');
            const printed = inspect(error, { depth: 20, showHidden: true });
            expect(printed).not.toContain(credential);
            expect(printed).not.toContain('Authorization');
        });

        it('keeps the per-address members of an AggregateError from a custom fetch', async () => {
            const members = [
                Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), { code: 'ECONNREFUSED' }),
                Object.assign(new Error('connect ECONNREFUSED [::1]:443'), { code: 'ECONNREFUSED' }),
            ];
            const aggregate = Object.assign(new AggregateError(members, ''), { code: 'ECONNREFUSED' });
            const fetch = vi
                .fn<typeof globalThis.fetch>()
                .mockRejectedValue(new TypeError('fetch failed', { cause: aggregate }));
            const client = createClient({ fetch, maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            const copy = ((error as TestRailApiError).cause as Error).cause as AggregateError & { code?: string };
            expect(copy).toBeInstanceOf(AggregateError);
            expect(copy).not.toBe(aggregate);
            expect(copy.code).toBe('ECONNREFUSED');
            expect(copy.errors).toEqual([
                expect.objectContaining({ message: 'connect ECONNREFUSED 10.0.0.1:443', code: 'ECONNREFUSED' }),
                expect.objectContaining({ message: 'connect ECONNREFUSED [::1]:443', code: 'ECONNREFUSED' }),
            ]);
        });

        it('does not expose request headers that a custom fetch put on its error', async () => {
            // The shape of axios `error.config`, ofetch `options`, or ky `request`.
            class AdapterError extends Error {
                constructor(
                    message: string,
                    readonly request: RequestInit | undefined,
                    options?: ErrorOptions,
                ) {
                    super(message, options);
                    this.name = 'AdapterError';
                }
            }
            const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
                const inner = Object.assign(new Error('socket hang up', { cause: { config: init } }), {
                    code: 'ECONNRESET',
                    errno: -54,
                    syscall: 'read',
                    headers: init?.headers,
                });
                throw new AdapterError('request failed', init, { cause: inner });
            });
            const client = createClient({ fetch, maxRetries: 0 });
            const credential = Buffer.from('agent@example.test:key').toString('base64');

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            const { inspect } = await import('node:util');
            const printed = inspect(error, { depth: 20, showHidden: true });
            expect(printed).not.toContain(credential);
            expect(printed).not.toContain('Authorization');
            expect(error).toMatchObject({ statusText: 'Network error: request failed' });
            const cause = (error as TestRailApiError).cause as Error & { cause?: Record<string, unknown> };
            expect(cause).toMatchObject({ name: 'AdapterError', message: 'request failed' });
            expect(cause.cause).toMatchObject({
                message: 'socket hang up',
                code: 'ECONNRESET',
                errno: -54,
                syscall: 'read',
            });
            // A non-Error object nested below is dropped, not copied.
            expect((cause.cause as { cause?: unknown }).cause).toBeUndefined();
        });

        it('keeps a non-Error fetch rejection reason as the cause', async () => {
            const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue('adapter exploded');
            const client = createClient({ fetch, maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toMatchObject({ status: 0, statusText: 'Network error: adapter exploded' });
            expect((error as TestRailApiError).cause).toBe('adapter exploded');
        });
    });

    describe('mid-body transport failure', () => {
        // What undici raises when the peer resets after the response headers.
        const terminated = (): TypeError => new TypeError('terminated', { cause: new Error('other side closed') });

        const brokenBody = (failure: unknown): globalThis.ReadableStream<Uint8Array> => {
            let pulls = 0;
            return new globalThis.ReadableStream<Uint8Array>({
                pull(controller): void {
                    pulls += 1;
                    if (pulls === 1) controller.enqueue(new globalThis.TextEncoder().encode('{"id":1,"na'));
                    else controller.error(failure);
                },
            });
        };

        it.each([
            ['JSON GET', 200, (client: TestRailClient) => client.projects.getProject(1)],
            ['text GET', 200, (client: TestRailClient) => client.bdd.getBdd(1)],
            ['binary GET', 200, (client: TestRailClient) => client.attachments.getAttachment(1)],
            ['JSON POST', 200, (client: TestRailClient) => client.projects.addProject({ name: 'x' })],
        ])('reports a reset during the %s body as a network error without retrying', async (_label, status, call) => {
            const failure = terminated();
            const fetch = vi.fn<typeof globalThis.fetch>(
                async () => new Response(brokenBody(failure), { status, statusText: 'Status' }),
            );
            const client = createClient({ fetch, maxRetries: 2 });

            const error: unknown = await call(client).catch((caught: unknown) => caught);

            expect(error).toBeInstanceOf(TestRailApiError);
            expect(error).toMatchObject({
                status: 0,
                statusText: 'Network error: terminated',
                response: 'terminated',
            });
            // A custom fetch supplied this body, so the cause is a plain copy.
            expect((error as TestRailApiError).cause).not.toBe(failure);
            expect((error as TestRailApiError).cause).toMatchObject({ name: 'TypeError', message: 'terminated' });
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('keeps the raw stream failure when the built-in fetch supplied the body', async () => {
            const failure = terminated();
            vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(brokenBody(failure)));
            const client = createClient({ maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect((error as TestRailApiError).cause).toBe(failure);
        });

        it.each([
            ['GET', 500, 3, (client: TestRailClient) => client.projects.getProject(1)],
            ['POST', 400, 1, (client: TestRailClient) => client.projects.addProject({ name: 'x' })],
        ])(
            'keeps the HTTP status when the error body of a %s is reset mid-stream',
            async (_label, status, expectedFetches, call) => {
                const fetch = vi.fn<typeof globalThis.fetch>(
                    async () => new Response(brokenBody(terminated()), { status, statusText: 'Status' }),
                );
                const client = createClient({ fetch, maxRetries: 2 });
                vi.spyOn(client as unknown as { getRetryDelay: () => number }, 'getRetryDelay').mockReturnValue(0);

                const error: unknown = await call(client).catch((caught: unknown) => caught);

                expect(error).toBeInstanceOf(TestRailApiError);
                expect(error).toMatchObject({ status, statusText: 'Status', response: 'Unknown error' });
                // A 5xx on a GET keeps its retries; a 4xx on a write is final.
                expect(fetch).toHaveBeenCalledTimes(expectedFetches);
            },
        );

        it('wraps a non-Error stream failure', async () => {
            const fetch = vi.fn<typeof globalThis.fetch>(
                async () => new Response(brokenBody('stream exploded'), { status: 200 }),
            );
            const client = createClient({ fetch, maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toBeInstanceOf(TestRailApiError);
            expect(error).toMatchObject({ status: 0, statusText: 'Network error: stream exploded' });
            expect((error as TestRailApiError).cause).toBe('stream exploded');
        });

        it('leaves the byte-limit error unchanged', async () => {
            const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('x'.repeat(64), { status: 200 }));
            const client = createClient({ fetch, maxRetries: 0, maxJsonResponseBytes: 16 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toMatchObject({ status: 0, statusText: 'Response body too large' });
            expect('cause' in (error as TestRailApiError)).toBe(false);
        });

        it('leaves an error thrown by onSchemaMismatch unchanged', async () => {
            const hookFailure = new RangeError('strict hook');
            const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{"unexpected":true}'));
            const client = createClient({
                fetch,
                maxRetries: 0,
                onSchemaMismatch: () => {
                    throw hookFailure;
                },
            });

            await expect(client.projects.getProject(1)).rejects.toBe(hookFailure);
        });
    });

    describe('DNS resolver failure', () => {
        const resolverFailure = (): Error =>
            Object.assign(new Error(`getaddrinfo EAI_AGAIN ${HOST}`), { code: 'EAI_AGAIN' });

        it('is a retried network error that does not advise disabling the SSRF guard', async () => {
            vi.useFakeTimers();
            const failure = resolverFailure();
            const dnsLookup = vi.fn<NonNullable<TestRailConfig['dnsLookup']>>().mockRejectedValue(failure);
            const fetch = vi.fn<typeof globalThis.fetch>();
            const client = createClient({ dnsLookup, fetch, maxRetries: 2 });

            const result = client.projects.getProject(1).catch((caught: unknown) => caught);
            await vi.advanceTimersByTimeAsync(1_000);
            expect(dnsLookup).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(2_000);
            const error = await result;

            expect(error).toBeInstanceOf(TestRailApiError);
            expect(error).not.toBeInstanceOf(TestRailValidationError);
            expect(error).toMatchObject({
                status: 0,
                statusText: `Network error: DNS lookup failed for "${HOST}": getaddrinfo EAI_AGAIN ${HOST}`,
            });
            expect((error as TestRailApiError).message).not.toContain('allowPrivateHosts');
            expect(JSON.stringify((error as TestRailApiError).response)).not.toContain('allowPrivateHosts');
            expect((error as TestRailApiError).cause).toBe(failure);
            expect(dnsLookup).toHaveBeenCalledTimes(3);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('recovers when a later lookup succeeds, validating DNS again', async () => {
            vi.useFakeTimers();
            const dnsLookup = vi
                .fn<NonNullable<TestRailConfig['dnsLookup']>>()
                .mockRejectedValueOnce(resolverFailure())
                .mockResolvedValue(PUBLIC_ADDRESS);
            const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{"id":1,"name":"p"}'));
            const client = createClient({ dnsLookup, fetch, maxRetries: 2 });

            const result = client.projects.getProject(1);
            await vi.advanceTimersByTimeAsync(1_000);

            await expect(result).resolves.toMatchObject({ id: 1 });
            expect(dnsLookup).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('treats an empty answer as a retried resolver failure', async () => {
            vi.useFakeTimers();
            const dnsLookup = vi.fn<NonNullable<TestRailConfig['dnsLookup']>>().mockResolvedValue([]);
            const fetch = vi.fn<typeof globalThis.fetch>();
            const client = createClient({ dnsLookup, fetch, maxRetries: 1 });

            const result = client.projects.getProject(1).catch((caught: unknown) => caught);
            await vi.advanceTimersByTimeAsync(1_000);
            const error = await result;

            expect(error).toBeInstanceOf(TestRailApiError);
            expect(error).toMatchObject({
                status: 0,
                statusText: `Network error: DNS lookup failed for "${HOST}": no addresses returned`,
            });
            expect((error as TestRailApiError).message).not.toContain('allowPrivateHosts');
            expect(dnsLookup).toHaveBeenCalledTimes(2);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('is not retried for a write', async () => {
            const dnsLookup = vi.fn<NonNullable<TestRailConfig['dnsLookup']>>().mockRejectedValue(resolverFailure());
            const fetch = vi.fn<typeof globalThis.fetch>();
            const client = createClient({ dnsLookup, fetch, maxRetries: 2 });

            await expect(client.projects.addProject({ name: 'x' })).rejects.toMatchObject({
                name: 'TestRailApiError',
                status: 0,
            });
            expect(dnsLookup).toHaveBeenCalledTimes(1);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('wraps a non-Error resolver rejection', async () => {
            const dnsLookup = vi.fn<NonNullable<TestRailConfig['dnsLookup']>>().mockRejectedValue('resolver exploded');
            const client = createClient({ dnsLookup, fetch: vi.fn<typeof globalThis.fetch>(), maxRetries: 0 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toMatchObject({
                name: 'TestRailApiError',
                status: 0,
                statusText: `Network error: DNS lookup failed for "${HOST}": resolver exploded`,
            });
            expect((error as TestRailApiError).cause).toBe('resolver exploded');
        });

        it('keeps a private-address verdict as an unretried validation error', async () => {
            const dnsLookup = vi
                .fn<NonNullable<TestRailConfig['dnsLookup']>>()
                .mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);
            const fetch = vi.fn<typeof globalThis.fetch>();
            const client = createClient({ dnsLookup, fetch, maxRetries: 2 });

            const error: unknown = await client.projects.getProject(1).catch((caught: unknown) => caught);

            expect(error).toBeInstanceOf(TestRailValidationError);
            expect((error as Error).message).toContain('private/loopback host');
            expect((error as Error).message).toContain('Set allowPrivateHosts: true');
            expect(dnsLookup).toHaveBeenCalledTimes(1);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('propagates a validation error thrown by a custom dnsLookup without retrying', async () => {
            const verdict = new TestRailValidationError('resolver policy rejected the host');
            const dnsLookup = vi.fn<NonNullable<TestRailConfig['dnsLookup']>>().mockRejectedValue(verdict);
            const client = createClient({ dnsLookup, fetch: vi.fn<typeof globalThis.fetch>(), maxRetries: 2 });

            await expect(client.projects.getProject(1)).rejects.toBe(verdict);
            expect(dnsLookup).toHaveBeenCalledTimes(1);
        });

        it('still applies rate-limit admission to a request first admitted on a DNS retry', async () => {
            vi.useFakeTimers();
            const dnsLookup = vi
                .fn<NonNullable<TestRailConfig['dnsLookup']>>()
                .mockResolvedValueOnce(PUBLIC_ADDRESS)
                .mockRejectedValueOnce(resolverFailure())
                .mockResolvedValue(PUBLIC_ADDRESS);
            const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{"id":1,"name":"p"}'));
            const client = createClient({
                dnsLookup,
                fetch,
                maxRetries: 2,
                enableCache: false,
                rateLimiter: { maxRequests: 1, windowMs: 60_000 },
            });
            await client.projects.getProject(1);

            // The window is now full. This request's first attempt fails in DNS
            // before admission, so its retry is the first time it asks for a slot.
            const result = client.projects.getProject(2).catch((caught: unknown) => caught);
            await vi.advanceTimersByTimeAsync(1_000);

            expect(await result).toMatchObject({ name: 'TestRailApiError', status: 429 });
            expect(dnsLookup).toHaveBeenCalledTimes(3);
            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });
});
