import { afterEach, describe, expect, it, vi } from 'vitest';
import { Agent as HttpAgent, createServer, type Server } from 'node:http';
import { gzipSync } from 'node:zlib';
import { once } from 'node:events';
import { createServer as createHttpsServer } from 'node:https';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { TLSSocket } from 'node:tls';
import type { LookupFunction } from 'node:net';
import { createPinnedDispatcher } from '../src/pinned-dispatcher.js';
import { TestRailClient } from '../src/client.js';

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

async function listen(server: Server): Promise<number> {
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Missing TCP address');
    return address.port;
}

function dispatcher(origin: string): NonNullable<RequestInit['dispatcher']> {
    return createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]) as unknown as NonNullable<
        RequestInit['dispatcher']
    >;
}

/** Keep the real dispatcher lifecycle while routing its approved test IP locally. */
function connectToLocalFixture(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- invoked with the original receiver below
    const original = HttpAgent.prototype.createConnection;
    vi.spyOn(HttpAgent.prototype, 'createConnection').mockImplementation(function (this: HttpAgent, options, callback) {
        const lookup: LookupFunction = (_hostname, lookupOptions, done) => {
            if (lookupOptions.all === true) done(null, [{ address: '127.0.0.1', family: 4 }]);
            else done(null, '127.0.0.1', 4);
        };
        return original.call(this, { ...options, lookup }, callback);
    });
}

describe('DNS-pinned native fetch dispatcher', () => {
    it('routes an unresolvable hostname to the approved address, preserving Host and authorization', async () => {
        const requests: Array<{ host: string | undefined; auth: string | undefined; path: string | undefined }> = [];
        const port = await listen(
            createServer((request, response) => {
                requests.push({ host: request.headers.host, auth: request.headers.authorization, path: request.url });
                response.setHeader('Content-Encoding', 'gzip');
                response.end(gzipSync('{"id":1}'));
            }),
        );
        const origin = `http://pinned.invalid:${port}`;
        const response = await fetch(`${origin}/index.php?/api/v2/get_project/1`, {
            dispatcher: dispatcher(origin),
            headers: { Authorization: 'Basic review-test' },
            redirect: 'manual',
        });
        expect(await response.json()).toEqual({ id: 1 });
        expect(requests).toEqual([
            { host: `pinned.invalid:${port}`, auth: 'Basic review-test', path: '/index.php?/api/v2/get_project/1' },
        ]);
    });

    it('preserves response header bytes without UTF-8 re-encoding', async () => {
        const port = await listen(
            createServer((_request, response) => {
                response.socket?.end(
                    Buffer.from(
                        'HTTP/1.1 200 OK\r\nx-label: caf\xe9\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok',
                        'latin1',
                    ),
                );
            }),
        );
        const origin = `http://headers.invalid:${port}`;
        const response = await fetch(origin, { dispatcher: dispatcher(origin) });
        expect(response.headers.get('x-label')).toBe('café');
        expect(await response.text()).toBe('ok');
    });

    it.each(['json', 'multipart'] as const)('streams a native %s body without losing headers', async (kind) => {
        const captured = new Promise<{ body: string; contentType: string | undefined; auth: string | undefined }>(
            (resolve) => {
                const server = createServer((request, response) => {
                    const chunks: Buffer[] = [];
                    request.on('data', (chunk: Buffer) => chunks.push(chunk));
                    request.on('end', () => {
                        resolve({
                            body: Buffer.concat(chunks).toString(),
                            contentType: request.headers['content-type'],
                            auth: request.headers.authorization,
                        });
                        response.end('ok');
                    });
                });
                servers.push(server);
            },
        );
        const server = servers.pop();
        if (server === undefined) throw new Error('Missing server');
        const port = await listen(server);
        const origin = `http://pinned.invalid:${port}`;
        const form = new globalThis.FormData();
        form.append('attachment', new globalThis.Blob(['file contents']), 'test.txt');
        const response = await fetch(origin, {
            dispatcher: dispatcher(origin),
            method: 'POST',
            headers: { Authorization: 'Basic test', ...(kind === 'json' && { 'content-type': 'application/json' }) },
            body: kind === 'json' ? '{"name":"test"}' : form,
        });
        expect(await response.text()).toBe('ok');
        const received = await captured;
        expect(received.auth).toBe('Basic test');
        if (kind === 'json') {
            expect(received.contentType).toBe('application/json');
            expect(received.body).toBe('{"name":"test"}');
        } else {
            expect(received.contentType).toContain('multipart/form-data; boundary=');
            expect(received.body).toContain('filename="test.txt"');
            expect(received.body).toContain('file contents');
        }
    });

    it('uses only approved addresses when a connection requests one IP family', async () => {
        const port = await listen(createServer((_request, response) => response.end('single family')));
        const origin = `http://family.invalid:${port}`;
        // Exercise the stdlib single-answer lookup callback used when a
        // socket is constrained to IPv4, rather than automatic family racing.
        // eslint-disable-next-line @typescript-eslint/unbound-method -- invoked with its original agent receiver below
        const originalCreateConnection = HttpAgent.prototype.createConnection;
        const connection = vi.spyOn(HttpAgent.prototype, 'createConnection').mockImplementation(function (
            this: HttpAgent,
            options,
            callback,
        ) {
            return originalCreateConnection.call(this, { ...options, family: 4 }, callback);
        });
        const response = await fetch(origin, {
            dispatcher: createPinnedDispatcher(origin, [
                { address: '::1', family: 6 },
                { address: '127.0.0.1', family: 4 },
            ]) as unknown as NonNullable<RequestInit['dispatcher']>,
        });
        expect(await response.text()).toBe('single family');
        expect(connection).toHaveBeenCalledOnce();
    });

    it('reuses sockets only within the same validated address snapshot', async () => {
        let connections = 0;
        const server = createServer((_request, response) => response.end('ok'));
        server.on('connection', () => {
            connections += 1;
        });
        const port = await listen(server);
        const origin = `http://pool.invalid:${port}`;
        const read = async (addresses: Array<{ address: string; family: number }>): Promise<void> => {
            const response = await fetch(origin, {
                dispatcher: createPinnedDispatcher(origin, addresses) as unknown as NonNullable<
                    RequestInit['dispatcher']
                >,
            });
            await response.text();
        };
        await read([{ address: '127.0.0.1', family: 4 }]);
        await read([{ address: '127.0.0.1', family: 4 }]);
        expect(connections).toBe(1);
        await read([
            { address: '127.0.0.1', family: 4 },
            { address: '::1', family: 6 },
        ]);
        expect(connections).toBe(2);
        await read([
            { address: '::1', family: 6 },
            { address: '127.0.0.1', family: 4 },
            { address: '127.0.0.1', family: 4 },
        ]);
        expect(connections).toBe(2);
        await read([{ address: '127.0.0.1', family: 4 }]);
        expect(connections).toBe(2);
    });

    it('keeps redirects manual and cancels an in-flight native request', async () => {
        const server = createServer((request, response) => {
            if (request.url === '/redirect') {
                response.writeHead(302, { location: 'http://127.0.0.1/secret' });
                response.end();
            }
        });
        const port = await listen(server);
        const origin = `http://pinned.invalid:${port}`;
        const redirect = await fetch(`${origin}/redirect`, { dispatcher: dispatcher(origin), redirect: 'manual' });
        expect(redirect.status).toBe(302);
        await redirect.body?.cancel();
        const controller = new AbortController();
        const pending = fetch(`${origin}/pending`, { dispatcher: dispatcher(origin), signal: controller.signal });
        const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        controller.abort();
        await assertion;
    });

    it('cancels streaming bodies and surfaces truncated responses', async () => {
        const server = createServer((_request, response) => {
            response.writeHead(200, { 'content-length': '100' });
            response.write('x');
        });
        const port = await listen(server);
        const origin = `http://pinned.invalid:${port}`;
        const response = await fetch(origin, { dispatcher: dispatcher(origin) });
        await response.body?.cancel();
        const broken = await fetch(origin, { dispatcher: dispatcher(origin) });
        const assertion = expect(broken.text()).rejects.toThrow();
        server.closeAllConnections();
        await assertion;
    });

    it('rejects cross-origin dispatch and empty address snapshots', () => {
        expect(() => createPinnedDispatcher('http://a.invalid', [])).toThrow('at least one');
        const onError = vi.fn();
        const result = createPinnedDispatcher('http://a.invalid', [{ address: '127.0.0.1', family: 4 }]).dispatch(
            { origin: 'http://b.invalid', path: '/', method: 'GET', headers: {}, body: null },
            { onConnect: vi.fn(), onHeaders: () => true, onData: () => true, onComplete: vi.fn(), onError },
        );
        expect(result).toBe(false);
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('different origin') }),
        );
    });

    it.each([
        { headers: ['Authorization', 'Basic flat', 'Content-Type', 'text/plain'] },
        {
            headers: [
                ['Authorization', 'Basic flat'],
                ['Content-Type', 'text/plain'],
            ],
        },
    ] as const)('accepts native header representation %#', async ({ headers }) => {
        const port = await listen(
            createServer((request, response) => {
                expect(request.headers.authorization).toBe('Basic flat');
                expect(request.headers['content-type']).toBe('text/plain');
                response.end('ok');
            }),
        );
        const origin = `http://pinned.invalid:${port}`;
        await new Promise<void>((resolve, reject) => {
            createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
                { origin, path: '/', method: 'GET', headers, body: null },
                {
                    onConnect: () => undefined,
                    onHeaders: () => true,
                    onData: () => true,
                    onComplete: () => resolve(),
                    onError: reject,
                },
            );
        });
    });

    it('uses the original HTTPS hostname for SNI and certificate verification', async () => {
        const certPath = fileURLToPath(new URL('./fixtures/pinned-test-cert.pem', import.meta.url));
        const [cert, key] = await Promise.all([
            readFile(certPath),
            readFile(new URL('./fixtures/pinned-test-key.pem', import.meta.url)),
        ]);
        const observed: Array<{ host: string | undefined; servername: string | false | null }> = [];
        const server = createHttpsServer({ cert, key }, (request, response) => {
            observed.push({ host: request.headers.host, servername: (request.socket as TLSSocket).servername });
            response.end('trusted');
        });
        const port = await listen(server);
        const moduleUrl = new URL('../src/pinned-dispatcher.ts', import.meta.url).href;
        const code = `
            const {createPinnedDispatcher} = await import(${JSON.stringify(moduleUrl)});
            const addresses = [{address:'127.0.0.1',family:4}];
            const good = 'https://pinned.invalid:${port}';
            console.log(await (await fetch(good,{dispatcher:createPinnedDispatcher(good,addresses)})).text());
            const bad = 'https://wrong.invalid:${port}';
            try { await fetch(bad,{dispatcher:createPinnedDispatcher(bad,addresses)}); throw new Error('certificate mismatch was accepted'); }
            catch (error) { if (error.cause?.code !== 'ERR_TLS_CERT_ALTNAME_INVALID') throw error; console.log('mismatch blocked'); }
        `;
        const { stdout } = await promisify(execFile)(
            process.execPath,
            ['--import', 'tsx', '--input-type=module', '-e', code],
            {
                env: { ...process.env, NODE_EXTRA_CA_CERTS: certPath },
                timeout: 10_000,
            },
        );
        expect(stdout.trim()).toBe('trusted\nmismatch blocked');
        expect(observed).toEqual([{ host: `pinned.invalid:${port}`, servername: 'pinned.invalid' }]);
    });

    it('prevents a rebinding system lookup from redirecting native fetch to a local server', async () => {
        let internalRequests = 0;
        const port = await listen(
            createServer((_request, response) => {
                internalRequests += 1;
                response.end('{}');
            }),
        );
        const clientUrl = new URL('../src/client.ts', import.meta.url).href;
        // Intercept only the TCP connect primitive in a subprocess: an approved
        // TEST-NET destination fails locally without internet traffic. If fetch
        // performs another system lookup, that resolver returns the real local
        // server and the fake credential would reach it (the original defect).
        const code = `
            import dns from 'node:dns';
            import net from 'node:net';
            import {syncBuiltinESMExports} from 'node:module';
            let lookups = 0;
            dns.lookup = (_host, options, callback) => {
                lookups++;
                if (options.all) callback(null,[{address:'127.0.0.1',family:4}]);
                else callback(null,'127.0.0.1',4);
            };
            const connect = net.Socket.prototype.connect;
            net.Socket.prototype.connect = function(...args) {
                const options = args[0];
                const target = Array.isArray(options) ? options[0] : options;
                if (target && typeof target === 'object' && typeof target.lookup === 'function') {
                    const lookup = target.lookup;
                    target.lookup = (hostname, lookupOptions, callback) => lookup(hostname, lookupOptions, (error,address,family) => {
                        if ((Array.isArray(address) ? address[0]?.address : address) === '203.0.113.10') callback(Object.assign(new Error('approved endpoint unavailable'),{code:'ENETUNREACH'}));
                        else callback(error,address,family);
                    });
                }
                return connect.apply(this,args);
            };
            syncBuiltinESMExports();
            const {TestRailClient} = await import(${JSON.stringify(clientUrl)});
            const client = new TestRailClient({baseUrl:'http://rebind.invalid:${port}',allowInsecure:true,email:'test@example.com',apiKey:'fake',maxRetries:0,timeout:1000,dnsLookup:async()=>[{address:'203.0.113.10',family:4}]});
            try { await client.projects.getProject(1);throw new Error('rebound request succeeded'); }
            catch(error) { if (!error.message.includes('Network error')) throw error; }
            finally {client.destroy();}
            console.log(lookups);
        `;
        const { stdout } = await promisify(execFile)(
            process.execPath,
            ['--import', 'tsx', '--input-type=module', '-e', code],
            { timeout: 10_000 },
        );
        expect(stdout.trim()).toBe('0');
        expect(internalRequests).toBe(0);
    });

    it.each(['json', 'multipart'] as const)('settles an early-rejected %s upload', async (kind) => {
        connectToLocalFixture();
        const port = await listen(
            createServer((request, response) => {
                request.resume();
                response.writeHead(400);
                response.end('{}');
            }),
        );
        const origin = `http://upload.invalid:${port}`;
        const client = new TestRailClient({
            baseUrl: origin,
            allowInsecure: true,
            email: 'test@example.com',
            apiKey: 'test',
            dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }],
        });
        try {
            const operation = client.trackOperation(() =>
                kind === 'json'
                    ? client.cases.addCase(1, { title: 'x', custom_large: 'x'.repeat(16 * 1024 * 1024) })
                    : client.attachments.addAttachmentToCase(
                          1,
                          new globalThis.Blob(['x'.repeat(16 * 1024 * 1024)]),
                          'test.txt',
                      ),
            );
            await expect(operation.result).rejects.toMatchObject({ status: 400 });
            await operation.settled;
        } finally {
            client.destroy();
        }
    });

    it.each(['pinned', 'native'] as const)(
        'waits for deferred %s multipart cancellation after an early response',
        async (transport) => {
            if (transport === 'pinned') connectToLocalFixture();
            let releaseCancel: () => void = () => undefined;
            let didCancel: () => void = () => undefined;
            const cancellation = new Promise<void>((resolve) => {
                releaseCancel = resolve;
            });
            const cancelled = new Promise<void>((resolve) => {
                didCancel = resolve;
            });
            vi.spyOn(globalThis.Blob.prototype, 'stream').mockImplementation(() => {
                let first = true;
                return new globalThis.ReadableStream<Uint8Array<ArrayBuffer>>({
                    pull(controller) {
                        if (first) {
                            first = false;
                            controller.enqueue(new Uint8Array(64 * 1024));
                        }
                    },
                    cancel() {
                        didCancel();
                        return cancellation;
                    },
                });
            });
            const port = await listen(
                createServer((_request, response) => {
                    response.writeHead(413);
                    response.end('{}');
                }),
            );
            const origin = `http://${transport === 'pinned' ? 'slow-upload.invalid' : '127.0.0.1'}:${port}`;
            const client = new TestRailClient({
                baseUrl: origin,
                allowInsecure: true,
                email: 'test@example.com',
                apiKey: 'test',
                ...(transport === 'pinned'
                    ? {
                          dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }],
                      }
                    : { allowPrivateHosts: true }),
            });
            try {
                const operation = client.trackOperation(() =>
                    client.attachments.addAttachmentToCase(
                        1,
                        new globalThis.Blob([new Uint8Array(16 * 1024 * 1024)]),
                        'test.bin',
                    ),
                );
                let settled = false;
                void operation.settled.then(() => {
                    settled = true;
                });
                await expect(operation.result).rejects.toMatchObject({ status: 413 });
                await cancelled;
                expect(settled).toBe(false);
                releaseCancel();
                await operation.settled;
                expect(settled).toBe(true);
            } finally {
                releaseCancel();
                client.destroy();
            }
        },
    );

    it('honors response backpressure and resumes delivery', async () => {
        const port = await listen(
            createServer((_request, response) => {
                response.write('first');
                globalThis.setImmediate(() => response.end('last'));
            }),
        );
        const origin = `http://pause.invalid:${port}`;
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            let resumeBody: (() => void) | undefined;
            createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
                { origin, path: '/', method: 'GET', headers: {}, body: null },
                {
                    onConnect: () => undefined,
                    onHeaders: (_status, _headers, resume) => {
                        resumeBody = resume;
                        globalThis.setImmediate(resume);
                        return false;
                    },
                    onData: (chunk) => {
                        chunks.push(chunk);
                        globalThis.setImmediate(() => resumeBody?.());
                        return false;
                    },
                    onComplete: () => resolve(),
                    onError: reject,
                },
            );
        });
        expect(Buffer.concat(chunks).toString()).toBe('firstlast');
    });

    it.each(['connect', 'headers', 'data', 'complete', 'untyped'] as const)(
        'contains a throwing %s handler and closes the request',
        async (phase) => {
            const port = await listen(createServer((_request, response) => response.end('value')));
            const origin = `http://errors.invalid:${port}`;
            const failure = new Error('handler failed');
            const thrown = await new Promise<Error>((resolve) => {
                const failAt = (current: string): void => {
                    if (phase === 'untyped' && current === 'connect') {
                        // eslint-disable-next-line @typescript-eslint/only-throw-error -- an untyped transport callback may throw an arbitrary value
                        throw 'handler failed';
                    }
                    if (current === phase) throw failure;
                };
                createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
                    { origin, path: '/', method: 'GET', headers: {}, body: null },
                    {
                        onConnect: () => failAt('connect'),
                        onHeaders: () => {
                            failAt('headers');
                            return true;
                        },
                        onData: () => {
                            failAt('data');
                            return true;
                        },
                        onComplete: () => failAt('complete'),
                        onError: resolve,
                    },
                );
            });
            if (phase === 'untyped') expect(thrown).toEqual(failure);
            else expect(thrown).toBe(failure);
        },
    );

    it('rejects protocol upgrades and unsupported flattened headers', async () => {
        const port = await listen(
            createServer((_request, response) => {
                response.writeHead(101, { connection: 'Upgrade', upgrade: 'websocket' });
                response.end();
            }),
        );
        const origin = `http://upgrade.invalid:${port}`;
        await expect(fetch(origin, { dispatcher: dispatcher(origin) })).rejects.toThrow('fetch failed');
        expect(() =>
            createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
                { origin, path: '/', method: 'GET', headers: ['dangling'], body: null },
                {
                    onConnect: vi.fn(),
                    onHeaders: () => true,
                    onData: () => true,
                    onComplete: vi.fn(),
                    onError: vi.fn(),
                },
            ),
        ).toThrow('flattened fetch headers');
    });

    it('supports repeated headers without changing the caller array', async () => {
        const headers = [
            ['x-test', 'first'],
            ['x-test', 'second'],
            ['x-test', 'third'],
        ] as const;
        const port = await listen(
            createServer((request, response) => {
                expect(request.headers['x-test']).toBe('first, second, third');
                response.end();
            }),
        );
        const origin = `http://headers.invalid:${port}`;
        await new Promise<void>((resolve, reject) =>
            createPinnedDispatcher(origin, [{ address: '127.0.0.1', family: 4 }]).dispatch(
                { origin, path: '/', method: 'GET', headers, body: null },
                {
                    onConnect: () => undefined,
                    onHeaders: () => true,
                    onData: () => true,
                    onComplete: () => resolve(),
                    onError: reject,
                },
            ),
        );
        expect(headers).toEqual([
            ['x-test', 'first'],
            ['x-test', 'second'],
            ['x-test', 'third'],
        ]);
    });

    it('rejects untrusted TLS certificates through native fetch', async () => {
        const [cert, key] = await Promise.all([
            readFile(new URL('./fixtures/pinned-test-cert.pem', import.meta.url)),
            readFile(new URL('./fixtures/pinned-test-key.pem', import.meta.url)),
        ]);
        const port = await listen(createHttpsServer({ cert, key }));
        const origin = `https://pinned.invalid:${port}`;
        await expect(fetch(origin, { dispatcher: dispatcher(origin) })).rejects.toMatchObject({
            cause: expect.objectContaining({ code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }),
        });
    });

    it('passes the validated snapshot to every fetch and rejects malformed DNS answers before dispatch', async () => {
        const fetchSpy = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response('{"id":1,"name":"p","suite_mode":1,"url":"u"}'));
        const lookup = vi.fn().mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
        const client = new TestRailClient({
            baseUrl: 'https://public.invalid',
            email: 'test@example.com',
            apiKey: 'test',
            dnsLookup: lookup,
            fetch: fetchSpy,
            enableCache: false,
        });
        try {
            await client.projects.getProject(1);
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ dispatcher: expect.objectContaining({ dispatch: expect.any(Function) }) }),
            );
            lookup.mockResolvedValue([{ address: 'not-an-address', family: 4 }]);
            await expect(client.projects.getProject(2)).rejects.toThrow('invalid IP address');
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        } finally {
            client.destroy();
        }
    });
});
