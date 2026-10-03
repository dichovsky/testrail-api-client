import { AsyncLocalStorage } from 'node:async_hooks';
import { channel } from 'node:diagnostics_channel';
import { Socket } from 'node:net';
import { Duplex } from 'node:stream';

const uploadScopes = new AsyncLocalStorage<symbol>();

interface NativeUpload {
    readonly socket?: Socket;
    readonly http1?: boolean;
    readonly stream?: Duplex;
    readonly stopped: boolean;
}

interface SocketOwner {
    readonly request: object;
    readonly http1: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Proves native upload shutdown without assuming an arbitrary fetch function
 * honors AbortSignal. Undici's documented diagnostics identify the request and
 * its actual HTTP/1 socket or HTTP/2 stream; the original FormData and global
 * dispatcher remain untouched. Observers live only for this attempt and never
 * throw into Undici.
 */
export function observeUploadTransport(
    target: string,
    method: string,
): {
    run<T>(callback: () => T): T;
    stop(): boolean;
    dispose(): void;
} {
    const url = new URL(target);
    const token = Symbol('upload');
    const requests = new Map<object, NativeUpload>();
    const socketOwners = new WeakMap<Socket, SocketOwner>();
    const streams = new Set<Duplex>();
    let pendingHttp2Request: { readonly request: object; readonly state: NativeUpload } | undefined;
    let observationsValid = true;
    const observe = (callback: (message: Record<string, unknown>, request: Record<string, unknown>) => void) => {
        return (message: unknown): void => {
            try {
                if (isRecord(message) && isRecord(message['request'])) callback(message, message['request']);
                else observationsValid = false;
            } catch {
                // Diagnostic payloads are process-wide and other publishers may
                // provide malformed objects or throwing getters. Unknown state
                // must never become permission to close a truncated file.
                observationsValid = false;
            }
        };
    };
    const subscriptions = [
        {
            name: 'undici:request:create',
            listener: observe((_message, request) => {
                const origin = request['origin'];
                if (
                    uploadScopes.getStore() === token &&
                    (origin instanceof URL ? origin.origin : origin) === url.origin &&
                    request['path'] === `${url.pathname}${url.search}` &&
                    request['method'] === method
                ) {
                    requests.set(request, { stopped: false });
                }
            }),
        },
        {
            name: 'undici:client:sendHeaders',
            listener: observe((message, request) => {
                pendingHttp2Request = undefined;
                const socket = message['socket'];
                if (!(socket instanceof Socket)) return;
                const headers = message['headers'];
                const http1 =
                    typeof headers === 'string' &&
                    typeof request['method'] === 'string' &&
                    typeof request['path'] === 'string' &&
                    headers.startsWith(`${request['method']} ${request['path']} HTTP/1.1\r\n`);
                // Observe reassignment even outside this upload's async scope:
                // a pooled socket may already carry a different request when
                // parsing the old response finally completes.
                socketOwners.set(socket, { request, http1 });
                const state = requests.get(request);
                if (state !== undefined) {
                    const nextState = { ...state, socket, http1 };
                    requests.set(request, nextState);
                    if (!http1) {
                        const pending = { request, state: nextState };
                        pendingHttp2Request = pending;
                        // Undici synchronously creates the HTTP/2 stream after
                        // publishing sendHeaders. Do not carry that identity
                        // into an unrelated later stream creation.
                        globalThis.queueMicrotask(() => {
                            if (pendingHttp2Request === pending) pendingHttp2Request = undefined;
                        });
                    }
                }
            }),
        },
        ...['undici:request:bodySent', 'undici:request:error'].map((name) => ({
            name,
            listener: observe((_message, request) => {
                if (pendingHttp2Request?.request === request) pendingHttp2Request = undefined;
                const state = requests.get(request);
                if (state !== undefined) requests.set(request, { ...state, stopped: true });
            }),
        })),
    ];
    const onHttp2Stream = (message: unknown): void => {
        try {
            const pending = pendingHttp2Request;
            pendingHttp2Request = undefined;
            if (!isRecord(message) || !isRecord(message['headers'])) {
                observationsValid = false;
                return;
            }
            const headers = message['headers'];
            const stream = message['stream'];
            // A pooled socket can still carry the first request's async scope
            // while dispatching a later upload. Scope alone is insufficient:
            // require the immediately preceding exact Undici request identity.
            if (
                pending === undefined ||
                headers[':authority'] !== url.host ||
                headers[':scheme'] !== url.protocol.slice(0, -1) ||
                headers[':method'] !== method ||
                headers[':path'] !== `${url.pathname}${url.search}` ||
                !(stream instanceof Duplex)
            ) {
                return;
            }
            streams.add(stream);
            requests.set(pending.request, { ...pending.state, stream });
        } catch {
            observationsValid = false;
        }
    };
    subscriptions.push({ name: 'http2.client.stream.created', listener: onHttp2Stream });
    for (const { name, listener } of subscriptions) channel(name).subscribe(listener);

    return {
        run<T>(callback: () => T): T {
            return uploadScopes.run(token, callback);
        },
        stop(): boolean {
            if (!observationsValid || requests.size === 0) return false;
            let stopped = true;
            for (const stream of streams) {
                try {
                    stream.destroy();
                    stopped = stream.destroyed && stopped;
                } catch {
                    stopped = false;
                }
            }
            for (const [request, state] of requests) {
                if (state.stopped) continue;
                if (state.stream?.destroyed === true) continue;
                const socket = state.socket;
                if (socket === undefined) {
                    stopped = false;
                    continue;
                }
                if (socket.destroyed) continue;
                const owner = socketOwners.get(socket);
                // HTTP/2 multiplexes requests over one socket. Only HTTP/1's
                // single body writer allows ownership or socket destruction to
                // prove this upload stopped without harming other requests.
                if (state.http1 !== true || owner?.http1 !== true) {
                    stopped = false;
                    continue;
                }
                if (owner.request !== request) continue;
                // An early complete response does not stop Undici's request
                // producer. Destroy only the socket still owned by this upload
                // before allowing its multipart part to close normally.
                try {
                    socket.destroy();
                    stopped = socket.destroyed && stopped;
                } catch {
                    stopped = false;
                }
            }
            return stopped;
        },
        dispose(): void {
            for (const { name, listener } of subscriptions) channel(name).unsubscribe(listener);
        },
    };
}
