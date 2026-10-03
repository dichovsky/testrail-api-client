import { afterEach, describe, expect, it, vi } from 'vitest';
import { channel } from 'node:diagnostics_channel';
import { Socket } from 'node:net';
import { PassThrough } from 'node:stream';
import { observeUploadTransport } from '../src/upload-transport.js';

const target = 'https://upload.example.test/index.php?/api/v2/add_attachment_to_case/1';
const url = new URL(target);
const create = channel('undici:request:create');
const sendHeaders = channel('undici:client:sendHeaders');
const bodySent = channel('undici:request:bodySent');
const requestError = channel('undici:request:error');
const http2Created = channel('http2.client.stream.created');
const observers = new Set<ReturnType<typeof observeUploadTransport>>();
const sockets = new Set<Socket>();

function observer(): ReturnType<typeof observeUploadTransport> {
    const observation = observeUploadTransport(target, 'POST');
    observers.add(observation);
    return observation;
}

function socket(): Socket {
    const connection = new Socket();
    sockets.add(connection);
    return connection;
}

function request(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return { origin: url.origin, path: `${url.pathname}${url.search}`, method: 'POST', ...overrides };
}

function sent(request: object, socket: Socket, http1 = true): void {
    sendHeaders.publish({
        request,
        socket,
        headers: http1 ? `POST ${url.pathname}${url.search} HTTP/1.1\r\n` : ':method: POST\r\n',
    });
}

function http2Headers(): Record<string, string> {
    return { ':authority': url.host, ':scheme': 'https', ':method': 'POST', ':path': `${url.pathname}${url.search}` };
}

afterEach(() => {
    for (const observation of observers) observation.dispose();
    for (const connection of sockets) connection.destroy();
    observers.clear();
    sockets.clear();
    vi.restoreAllMocks();
});

describe('multipart native transport proof', () => {
    it('requires an exact target and async scope before taking socket ownership', () => {
        const observation = observer();
        const connection = socket();
        const unrelated = request();
        create.publish({ request: unrelated });
        sent(unrelated, connection);
        observation.run(() => {
            for (const override of [{ origin: 'https://other.test' }, { path: '/other' }, { method: 'GET' }]) {
                const other = request(override);
                create.publish({ request: other });
                sent(other, connection);
            }
        });
        expect(observation.stop()).toBe(false);
        expect(connection.destroyed).toBe(false);
    });

    it('destroys only the current HTTP/1 upload socket and accepts URL origins', () => {
        const observation = observer();
        const connection = socket();
        const upload = request({ origin: new URL(url.origin) });
        observation.run(() => create.publish({ request: upload }));
        // A pooled connection may emit from an older async context. Identity
        // from its scoped create event still identifies our request.
        sent(upload, connection);
        expect(observation.stop()).toBe(true);
        expect(connection.destroyed).toBe(true);
        expect(observation.stop()).toBe(true);
    });

    it.each([bodySent, requestError])(
        'accepts request-specific completion without taking an unobserved socket',
        (done) => {
            const observation = observer();
            const upload = request();
            observation.run(() => create.publish({ request: upload }));
            done.publish({ request: request() });
            expect(observation.stop()).toBe(false);
            done.publish({ request: upload });
            expect(observation.stop()).toBe(true);
        },
    );

    it('never destroys an HTTP/1 socket reassigned to an unrelated request outside the upload scope', () => {
        const observation = observer();
        const connection = socket();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, connection);
        const nextRequest = request();
        sent(nextRequest, connection);
        expect(observation.stop()).toBe(true);
        expect(connection.destroyed).toBe(false);
    });

    it('isolates concurrent uploads to the same URL across asynchronous callbacks', async () => {
        const first = observer();
        const second = observer();
        const firstSocket = socket();
        const secondSocket = socket();
        const firstRequest = request();
        const secondRequest = request();
        await Promise.all([
            first.run(async () => {
                await Promise.resolve();
                create.publish({ request: firstRequest });
                sent(firstRequest, firstSocket);
            }),
            second.run(async () => {
                await Promise.resolve();
                create.publish({ request: secondRequest });
                sent(secondRequest, secondSocket);
            }),
        ]);
        expect(first.stop()).toBe(true);
        expect(firstSocket.destroyed).toBe(true);
        expect(secondSocket.destroyed).toBe(false);
        expect(second.stop()).toBe(true);
        expect(secondSocket.destroyed).toBe(true);
    });

    it('requires proof for every captured request while stopping those it owns', () => {
        const observation = observer();
        const connection = socket();
        observation.run(() => {
            const upload = request();
            create.publish({ request: upload });
            sent(upload, connection);
            create.publish({ request: request() });
        });
        expect(observation.stop()).toBe(false);
        expect(connection.destroyed).toBe(true);
    });

    it.each([false, true])('does not destroy or infer reassignment for an H2 socket (reassigned: %s)', (reassigned) => {
        const observation = observer();
        const connection = socket();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, connection, false);
        if (reassigned) sent(request(), connection, false);
        expect(observation.stop()).toBe(false);
        expect(connection.destroyed).toBe(false);
        connection.destroy();
        expect(observation.stop()).toBe(true);
    });

    it('does not destroy a previously HTTP/1 socket after unknown headers change its ownership', () => {
        const observation = observer();
        const connection = socket();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, connection);
        sendHeaders.publish({ request: request(), socket: connection });
        expect(observation.stop()).toBe(false);
        expect(connection.destroyed).toBe(false);
    });

    it('destroys only the matched HTTP/2 stream, preserving a shared socket and unrelated stream', () => {
        const observation = observer();
        const connection = socket();
        const stream = new PassThrough();
        const unrelated = new PassThrough();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        // Pooled connection callbacks can carry an older async context, so
        // the immediately preceding owned sendHeaders identity pairs the stream.
        sent(upload, connection, false);
        http2Created.publish({ stream, headers: http2Headers() });
        http2Created.publish({ stream: unrelated, headers: http2Headers() });
        expect(observation.stop()).toBe(true);
        expect(stream.destroyed).toBe(true);
        expect(unrelated.destroyed).toBe(false);
        expect(connection.destroyed).toBe(false);
        unrelated.destroy();
    });

    it('does not assume HTTP/2 ownership from an async context without exact request identity', () => {
        const observation = observer();
        const stream = new PassThrough();
        observation.run(() => http2Created.publish({ stream, headers: http2Headers() }));
        expect(observation.stop()).toBe(false);
        expect(stream.destroyed).toBe(false);
        stream.destroy();
    });

    it('does not capture a different queued H2 request running under this upload async context', () => {
        const observation = observer();
        const connection = socket();
        const ownStream = new PassThrough();
        const otherStream = new PassThrough();
        const upload = request();
        observation.run(() => {
            create.publish({ request: upload });
            sent(upload, connection, false);
            http2Created.publish({ stream: ownStream, headers: http2Headers() });
            sent(request(), connection, false);
            http2Created.publish({ stream: otherStream, headers: http2Headers() });
        });
        expect(observation.stop()).toBe(true);
        expect(ownStream.destroyed).toBe(true);
        expect(otherStream.destroyed).toBe(false);
        expect(connection.destroyed).toBe(false);
        otherStream.destroy();
    });

    it('expires a preceding H2 request identity before an unrelated later stream is created', async () => {
        const observation = observer();
        const stream = new PassThrough();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, socket(), false);
        await Promise.resolve();
        http2Created.publish({ stream, headers: http2Headers() });
        expect(observation.stop()).toBe(false);
        expect(stream.destroyed).toBe(false);
        stream.destroy();
    });

    it.each([bodySent, requestError])('clears H2 pairing when the request finishes before stream creation', (done) => {
        const observation = observer();
        const stream = new PassThrough();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, socket(), false);
        done.publish({ request: upload });
        http2Created.publish({ stream, headers: http2Headers() });
        expect(observation.stop()).toBe(true);
        expect(stream.destroyed).toBe(false);
        stream.destroy();
    });

    it.each([':authority', ':scheme', ':method', ':path'])('rejects an HTTP/2 stream with different %s', (key) => {
        const observation = observer();
        const stream = new PassThrough();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, socket(), false);
        observation.run(() => http2Created.publish({ stream, headers: { ...http2Headers(), [key]: 'other' } }));
        expect(observation.stop()).toBe(false);
        expect(stream.destroyed).toBe(false);
        stream.destroy();
    });

    it('ignores malformed events and transport objects without throwing into diagnostic publishers', () => {
        const observation = observer();
        const upload = request();
        observation.run(() => {
            for (const message of [null, [], 'invalid', {}, { request: null }, { request: [] }])
                create.publish(message);
            create.publish({ request: upload });
            sendHeaders.publish({ request: upload, socket: {} });
            for (const message of [null, {}, { headers: [] }, { headers: http2Headers(), stream: {} }]) {
                http2Created.publish(message);
            }
        });
        expect(observation.stop()).toBe(false);
    });

    it.each([create, http2Created])('fails closed if a diagnostic object throws while being inspected', (event) => {
        const observation = observer();
        const connection = socket();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, connection);
        const invalid = new Proxy(
            {},
            {
                get: () => {
                    throw new Error('malformed diagnostic');
                },
            },
        );
        expect(() => event.publish(invalid)).not.toThrow();
        expect(observation.stop()).toBe(false);
        expect(connection.destroyed).toBe(false);
    });

    it('fails closed if a native transport cannot be synchronously destroyed', () => {
        const observation = observer();
        const connection = socket();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, connection);
        const destroy = vi.spyOn(connection, 'destroy').mockImplementation(() => {
            throw new Error('destroy failed');
        });
        expect(observation.stop()).toBe(false);
        destroy.mockImplementation(() => connection);
        expect(observation.stop()).toBe(false);
        destroy.mockRestore();
    });

    it('fails closed when the HTTP/2 stream refuses destruction', () => {
        const observation = observer();
        const stream = new PassThrough();
        const upload = request();
        observation.run(() => create.publish({ request: upload }));
        sent(upload, socket(), false);
        observation.run(() => http2Created.publish({ stream, headers: http2Headers() }));
        const destroy = vi.spyOn(stream, 'destroy').mockImplementation(() => {
            throw new Error('destroy failed');
        });
        expect(observation.stop()).toBe(false);
        destroy.mockImplementation(() => stream);
        expect(observation.stop()).toBe(false);
        destroy.mockRestore();
        stream.destroy();
    });

    it('removes every listener deterministically even when the scoped fetch throws synchronously', () => {
        const observation = observer();
        try {
            expect(() =>
                observation.run(() => {
                    throw new Error('fetch failed');
                }),
            ).toThrow('fetch failed');
        } finally {
            observation.dispose();
        }
        const upload = request();
        const connection = socket();
        const stream = new PassThrough();
        observation.run(() => {
            create.publish({ request: upload });
            sent(upload, connection);
            http2Created.publish({ stream, headers: http2Headers() });
        });
        expect(observation.stop()).toBe(false);
        expect(connection.destroyed).toBe(false);
        expect(stream.destroyed).toBe(false);
        stream.destroy();
    });
});
