import { afterEach, describe, expect, it, vi } from 'vitest';
import { Agent, createServer, type Server } from 'node:http';
import { once } from 'node:events';
import type { LookupFunction } from 'node:net';
import { createPinnedDispatcher } from '../src/pinned-dispatcher.js';

const servers: Server[] = [];
afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve) => {
                    server.closeAllConnections();
                    server.close(() => resolve());
                }),
        ),
    );
});

async function originFor(server: Server): Promise<string> {
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Missing TCP address');
    return `http://compatibility.invalid:${address.port}`;
}

describe('DNS dispatcher handler compatibility', () => {
    it('preserves a caller abort reason during native response-body consumption', async () => {
        const origin = await originFor(
            createServer((_request, response) => {
                response.write('first');
            }),
        );
        const controller = new AbortController();
        const reason = new Error('caller cancelled streaming response');
        const response = await fetch(origin, {
            dispatcher: createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]) as unknown as NonNullable<
                RequestInit['dispatcher']
            >,
            signal: controller.signal,
        });
        const pending = response.text();
        const assertion = expect(pending).rejects.toBe(reason);
        controller.abort(reason);
        await assertion;
    });

    it('delivers modern controller state, lossless headers, trailers and response backpressure', async () => {
        const origin = await originFor(
            createServer((_request, response) => {
                response.setHeader('X-Label', 'café');
                response.setHeader('Set-Cookie', ['first=1', 'second=2']);
                response.setHeader('constructor', 'safe');
                response.setHeader('__proto__', 'safe');
                response.setHeader('Trailer', 'X-Checksum');
                response.write('first');
                globalThis.setImmediate(() => {
                    response.addTrailers({ 'X-Checksum': 'café' });
                    response.end('last');
                });
            }),
        );
        const pinned = createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]);
        const chunks: Buffer[] = [];
        const started = vi.fn();
        expect(pinned.hasStoppedUploading()).toBe(false);
        await new Promise<void>((resolve, reject) =>
            pinned.dispatch(
                { origin, path: '/', method: 'GET', headers: {}, body: null },
                {
                    onRequestStart(controller, context) {
                        expect(context).toBeNull();
                        expect(controller.aborted).toBe(false);
                        expect(controller.reason).toBeNull();
                        expect(controller.paused).toBe(false);
                        expect(controller.rawHeaders).toBeNull();
                        expect(controller.rawTrailers).toBeNull();
                        expect(pinned.hasStoppedUploading()).toBe(false);
                        controller.pause();
                        controller.resume();
                        controller.resume();
                        expect(controller.paused).toBe(false);
                    },
                    onResponseStarted: started,
                    onResponseStart(controller, status, headers, statusText) {
                        expect(started).toHaveBeenCalledOnce();
                        expect(status).toBe(200);
                        expect(statusText).toBe('OK');
                        expect(headers['x-label']).toBe('café');
                        expect(headers['set-cookie']).toEqual(['first=1', 'second=2']);
                        expect(headers['constructor']).toBe('safe');
                        // eslint-disable-next-line no-proto -- malicious header name must remain ordinary data
                        expect(headers['__proto__']).toBe('safe');
                        expect(controller.rawHeaders).toContainEqual(Buffer.from('café', 'latin1'));
                        controller.pause();
                        expect(controller.paused).toBe(true);
                        globalThis.setImmediate(() => controller.resume());
                    },
                    onResponseData(controller, chunk) {
                        chunks.push(chunk);
                        controller.pause();
                        expect(controller.paused).toBe(true);
                        globalThis.setImmediate(() => controller.resume());
                    },
                    onResponseEnd(controller, trailers) {
                        expect(trailers['x-checksum']).toBe('café');
                        expect(controller.rawTrailers).toEqual([
                            Buffer.from('X-Checksum'),
                            Buffer.from('café', 'latin1'),
                        ]);
                        resolve();
                    },
                    onResponseError: (_controller, error) => reject(error),
                },
            ),
        );
        expect(Buffer.concat(chunks).toString()).toBe('firstlast');
        expect(pinned.hasStoppedUploading()).toBe(true);
    });

    it.each(['start', 'headers', 'data', 'end'] as const)('contains modern %s callback exceptions', async (phase) => {
        const origin = await originFor(createServer((_request, response) => response.end('value')));
        const failure = new Error('handler failed');
        const failAt = (current: string): void => {
            if (phase === current) throw failure;
        };
        const pinned = createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]);
        const error = await new Promise<Error>((resolve) =>
            pinned.dispatch(
                { origin, path: '/', method: 'GET', headers: {}, body: null },
                {
                    onRequestStart: () => failAt('start'),
                    onResponseStart: () => failAt('headers'),
                    onResponseData: () => failAt('data'),
                    onResponseEnd: () => failAt('end'),
                    onResponseError: (_controller, error) => resolve(error),
                },
            ),
        );
        expect(error).toBe(failure);
        expect(pinned.hasStoppedUploading()).toBe(true);
    });

    it('aborts a modern request exactly once with its original reason', async () => {
        const origin = await originFor(createServer());
        const failure = new Error('cancelled');
        const onError = vi.fn();
        const pinned = createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]);
        pinned.dispatch(
            { origin, path: '/', method: 'GET', headers: {}, body: null },
            {
                onRequestStart(controller) {
                    controller.abort(failure);
                    controller.abort(new Error('ignored duplicate'));
                    expect(controller.aborted).toBe(true);
                    expect(controller.reason).toBe(failure);
                },
                onResponseStart: vi.fn(),
                onResponseData: vi.fn(),
                onResponseEnd: vi.fn(),
                onResponseError: onError,
            },
        );
        expect(onError).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ aborted: true, reason: failure }),
            failure,
        );
        expect(pinned.hasStoppedUploading()).toBe(true);
    });

    it('pauses immediately when the controller is called outside a response callback', async () => {
        let sendRest: () => void = () => undefined;
        const origin = await originFor(
            createServer((_request, response) => {
                response.write('first');
                sendRest = (): void => {
                    response.end('last');
                };
            }),
        );
        const chunks: Buffer[] = [];
        let pausedOutsideCallback = false;
        await new Promise<void>((resolve, reject) =>
            createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
                { origin, path: '/', method: 'GET', headers: {}, body: null },
                {
                    onRequestStart: () => undefined,
                    onResponseStart: () => undefined,
                    onResponseData(controller, chunk) {
                        chunks.push(chunk);
                        if (chunks.length !== 1) return;
                        globalThis.setImmediate(() => {
                            controller.pause();
                            pausedOutsideCallback = true;
                            sendRest();
                            setTimeout(() => {
                                try {
                                    expect(Buffer.concat(chunks).toString()).toBe('first');
                                } catch (error) {
                                    reject(error instanceof Error ? error : new Error(String(error)));
                                } finally {
                                    controller.resume();
                                }
                            }, 30);
                        });
                    },
                    onResponseEnd: () => resolve(),
                    onResponseError: (_controller, error) => reject(error),
                },
            ),
        );
        expect(pausedOutsideCallback).toBe(true);
        expect(Buffer.concat(chunks).toString()).toBe('firstlast');
    });

    it('uses an AbortError when a modern caller omits the abort reason', async () => {
        const origin = await originFor(createServer());
        const onError = vi.fn();
        createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
            { origin, path: '/', method: 'GET', headers: {}, body: null },
            {
                onRequestStart: (controller) => controller.abort(),
                onResponseStart: vi.fn(),
                onResponseData: vi.fn(),
                onResponseEnd: vi.fn(),
                onResponseError: onError,
            },
        );
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ aborted: true }),
            expect.objectContaining({ name: 'AbortError' }),
        );
    });

    it('reports a cross-origin error through the modern callback without starting transport', () => {
        const pinned = createPinnedDispatcher('http://a.invalid', [{ address: '127.0.0.1', family: 4 }]);
        const onError = vi.fn();
        expect(
            pinned.dispatch(
                { origin: 'http://b.invalid', path: '/', method: 'GET', headers: {}, body: null },
                {
                    onRequestStart: vi.fn(),
                    onResponseStart: vi.fn(),
                    onResponseData: vi.fn(),
                    onResponseEnd: vi.fn(),
                    onResponseError: onError,
                },
            ),
        ).toBe(false);
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ aborted: false }),
            expect.objectContaining({ message: expect.stringContaining('different origin') }),
        );
        expect(pinned.hasStoppedUploading()).toBe(false);
    });
});

describe('DNS dispatcher address families', () => {
    const addresses = [
        { address: '::1', family: 6 },
        { address: '127.0.0.1', family: 4 },
    ];
    it.each([
        { family: 4, all: true, expected: [addresses[1]], expectedFamily: undefined },
        { family: 6, all: true, expected: [addresses[0]], expectedFamily: undefined },
        { family: 0, all: true, expected: addresses, expectedFamily: undefined },
        { family: 4, all: false, expected: '127.0.0.1', expectedFamily: 4 },
        { family: 6, all: false, expected: '::1', expectedFamily: 6 },
        { family: 0, all: false, expected: '::1', expectedFamily: 6 },
    ])(
        'matches family $family and all=$all while preserving approved order',
        async ({ family, all, expected, expectedFamily }) => {
            const origin = await originFor(createServer((_request, response) => response.end('ok')));
            // eslint-disable-next-line @typescript-eslint/unbound-method -- invoked with the original receiver below
            const original = Agent.prototype.createConnection;
            const observed = vi.fn();
            vi.spyOn(Agent.prototype, 'createConnection').mockImplementation(function (this: Agent, options, callback) {
                const lookup = options.lookup as LookupFunction;
                lookup('compatibility.invalid', { family, all }, observed);
                return original.call(this, { ...options, family: 4 }, callback);
            });
            const response = await fetch(origin, {
                dispatcher: createPinnedDispatcher(origin, addresses) as unknown as NonNullable<
                    RequestInit['dispatcher']
                >,
            });
            expect(await response.text()).toBe('ok');
            if (all) expect(observed).toHaveBeenCalledExactlyOnceWith(null, expected);
            else expect(observed).toHaveBeenCalledExactlyOnceWith(null, expected, expectedFamily);
            expect(addresses).toEqual([
                { address: '::1', family: 6 },
                { address: '127.0.0.1', family: 4 },
            ]);
        },
    );

    it.each([false, true])('fails closed when the requested family is absent (all=%s)', async (all) => {
        let received = false;
        const origin = await originFor(
            createServer((_request, response) => {
                received = true;
                response.end('unexpected');
            }),
        );
        // eslint-disable-next-line @typescript-eslint/unbound-method -- invoked with the original receiver below
        const original = Agent.prototype.createConnection;
        const observed = vi.fn();
        vi.spyOn(Agent.prototype, 'createConnection').mockImplementation(function (this: Agent, options, callback) {
            const lookup = options.lookup as LookupFunction;
            lookup('compatibility.invalid', { family: 6, all }, observed);
            return original.call(this, { ...options, family: 6 }, callback);
        });
        await expect(
            fetch(origin, {
                dispatcher: createPinnedDispatcher(origin, [
                    { address: '127.0.0.1', family: 4 },
                ]) as unknown as NonNullable<RequestInit['dispatcher']>,
            }),
        ).rejects.toMatchObject({ cause: { code: 'ENOTFOUND' } });
        expect(observed).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: 'ENOTFOUND' }), []);
        expect(received).toBe(false);
    });
});
