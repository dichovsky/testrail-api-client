import {
    Agent as HttpAgent,
    request as httpRequest,
    type ClientRequest,
    type ClientRequestArgs,
    type IncomingMessage,
} from 'node:http';
import { Agent as HttpsAgent, request as httpsRequest, type RequestOptions } from 'node:https';
import type { LookupFunction } from 'node:net';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { observeOperation } from './operation-tracking.js';
import { DEFAULT_TRANSPORT_IDLE_TIMEOUT_MS } from './constants.js';

/** Validated DNS answers; the connection resolver must use this exact snapshot. */
export interface PinnedAddress {
    readonly address: string;
    readonly family: number;
}

interface PinnedRequestOptions extends RequestOptions {
    readonly autoSelectFamily: boolean;
    readonly validatedAddressKey: string;
}

// Keep pools separate when a hostname's validated address set changes. These
// pools have the same process-wide lifetime as native fetch's default pool;
// idle sockets are unreferenced and expire, and never belong to a client view.
class PinnedHttpAgent extends HttpAgent {
    override getName(options: ClientRequestArgs & { validatedAddressKey?: string } = {}): string {
        return `${super.getName(options)}:${options.validatedAddressKey ?? ''}`;
    }
}

class PinnedHttpsAgent extends HttpsAgent {
    override getName(options: RequestOptions & { validatedAddressKey?: string } = {}): string {
        return `${super.getName(options)}:${options.validatedAddressKey ?? ''}`;
    }
}

const httpAgent = new PinnedHttpAgent({ keepAlive: true, timeout: DEFAULT_TRANSPORT_IDLE_TIMEOUT_MS });
const httpsAgent = new PinnedHttpsAgent({ keepAlive: true, timeout: DEFAULT_TRANSPORT_IDLE_TIMEOUT_MS });

/** The dispatch subset passed by Node's native fetch, which owns HTTP decoding. */
interface FetchDispatchOptions {
    readonly origin: string | URL;
    readonly path: string;
    readonly method: string;
    readonly headers: Record<string, string> | readonly (string | readonly [string, string])[];
    readonly body: AsyncIterable<Uint8Array> | null;
}

interface LegacyFetchDispatchHandler {
    onConnect(abort: (error: Error) => void): void;
    onHeaders(status: number, headers: Buffer[], resume: () => void, statusText: string): boolean;
    onData(chunk: Buffer): boolean;
    onComplete(trailers: Buffer[]): void;
    onError(error: Error): void;
}

interface FetchDispatchController {
    readonly aborted: boolean;
    readonly paused: boolean;
    readonly reason: Error | null;
    rawHeaders: Buffer[] | null;
    rawTrailers: Buffer[] | null;
    abort(reason?: Error): void;
    pause(): void;
    resume(): void;
}

interface ModernFetchDispatchHandler {
    onRequestStart(controller: FetchDispatchController, context: null): void;
    onResponseStarted?(): void;
    onResponseStart(
        controller: FetchDispatchController,
        status: number,
        headers: Record<string, string | string[]>,
        statusText: string,
    ): void;
    onResponseData(controller: FetchDispatchController, chunk: Buffer): void;
    onResponseEnd(controller: FetchDispatchController, trailers: Record<string, string | string[]>): void;
    onResponseError(controller: FetchDispatchController, error: Error): void;
}

type FetchDispatchHandler = LegacyFetchDispatchHandler | ModernFetchDispatchHandler;

/** Bridge Undici 8's controller callbacks and Node 24's legacy callbacks. */
function legacyHandler(handler: FetchDispatchHandler, pauseResponse: () => void): LegacyFetchDispatchHandler {
    if ('onConnect' in handler) return handler;
    let paused = false;
    let aborted = false;
    let reason: Error | null = null;
    let abortRequest: ((error: Error) => void) | undefined;
    let resumeResponse: (() => void) | undefined;
    const controller: FetchDispatchController = {
        get aborted() {
            return aborted;
        },
        get paused() {
            return paused;
        },
        get reason() {
            return reason;
        },
        rawHeaders: null,
        rawTrailers: null,
        abort(error = new globalThis.DOMException('The operation was aborted.', 'AbortError')): void {
            if (aborted) return;
            aborted = true;
            reason = error;
            abortRequest?.(error);
        },
        pause(): void {
            paused = true;
            pauseResponse();
        },
        resume(): void {
            if (!paused) return;
            paused = false;
            resumeResponse?.();
        },
    };
    const parsedHeaders = (headers: Buffer[]): Record<string, string | string[]> =>
        requestHeaders(
            headers.map((header, index) =>
                index % 2 === 0 ? header.toString('latin1').toLowerCase() : header.toString('latin1'),
            ),
        );
    return {
        onConnect(abort): void {
            abortRequest = abort;
            handler.onRequestStart(controller, null);
        },
        onHeaders(status, headers, resume, statusText): boolean {
            controller.rawHeaders = headers;
            resumeResponse = resume;
            handler.onResponseStarted?.();
            handler.onResponseStart(controller, status, parsedHeaders(headers), statusText);
            return !paused;
        },
        onData(chunk): boolean {
            handler.onResponseData(controller, chunk);
            return !paused;
        },
        onComplete(trailers): void {
            controller.rawTrailers = trailers;
            handler.onResponseEnd(controller, parsedHeaders(trailers));
        },
        onError(error): void {
            handler.onResponseError(controller, error);
        },
    };
}

function isHeaderList(
    headers: FetchDispatchOptions['headers'],
): headers is readonly (string | readonly [string, string])[] {
    return Array.isArray(headers);
}

function requestHeaders(headers: FetchDispatchOptions['headers']): Record<string, string | string[]> {
    if (!isHeaderList(headers)) return { ...headers };
    const result = Object.create(null) as Record<string, string | string[]>;
    for (let index = 0; index < headers.length; index += 1) {
        const entry = headers[index];
        let key: string;
        let value: string;
        if (typeof entry === 'string') {
            const next = headers[index + 1];
            if (typeof next !== 'string') throw new Error('Invalid flattened fetch headers');
            key = entry;
            value = next;
            index += 1;
        } else if (entry !== undefined) {
            [key, value] = entry;
        } else {
            throw new Error('Invalid fetch headers');
        }
        const previous = result[key];
        result[key] =
            previous === undefined ? value : [...(typeof previous === 'string' ? [previous] : previous), value];
    }
    return result;
}

/**
 * Node fetch's documented dispatcher extension, implemented with stdlib HTTP.
 * The original hostname remains authoritative for Host, TLS SNI, and certificate
 * verification. Only socket DNS is replaced, using answers already classified
 * by the host guard. Fetch retains redirect and decompression ownership.
 */
export function createPinnedDispatcher(
    origin: string,
    addresses: readonly PinnedAddress[],
): {
    dispatch(options: FetchDispatchOptions, handler: FetchDispatchHandler): boolean;
    hasStoppedUploading(): boolean;
} {
    const pinned = addresses.map(({ address, family }) => ({ address, family }));
    if (pinned.length === 0) throw new Error('A pinned dispatcher requires at least one validated address');
    // Pool identity describes an address set, while connection attempts retain
    // the resolver's original ordering and family preference.
    const addressKey = JSON.stringify([...new Set(pinned.map(({ address, family }) => `${family}:${address}`))].sort());
    const requests: ClientRequest[] = [];
    const lookup: LookupFunction = (_hostname, options, callback) => {
        // Node's automatic family selection can try every approved answer. No
        // second system DNS lookup can substitute an unchecked address.
        const matches =
            options.family === 4 || options.family === 6
                ? pinned.filter(({ family }) => family === options.family)
                : pinned;
        const first = matches[0];
        if (first === undefined) {
            callback(
                Object.assign(new Error('No approved DNS address matches the requested IP family'), {
                    code: 'ENOTFOUND',
                }),
                [],
            );
        } else if (options.all === true) callback(null, matches);
        else callback(null, first.address, first.family);
    };

    return {
        hasStoppedUploading(): boolean {
            return requests.length > 0 && requests.every((request) => request.destroyed || request.writableFinished);
        },
        dispatch(options, dispatchHandler): boolean {
            let responseBody: IncomingMessage | undefined;
            const handler = legacyHandler(dispatchHandler, () => {
                responseBody?.pause();
            });
            if (String(options.origin) !== origin) {
                handler.onError(new Error('Pinned dispatcher cannot dispatch a different origin'));
                return false;
            }
            const url = new URL(origin);
            const requestOptions: PinnedRequestOptions = {
                method: options.method,
                path: options.path,
                headers: { ...requestHeaders(options.headers), host: url.host },
                lookup,
                autoSelectFamily: true,
                validatedAddressKey: addressKey,
                agent: url.protocol === 'https:' ? httpsAgent : httpAgent,
            };
            const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, requestOptions);
            requests.push(request);
            let finished = false;
            const fail = (error: Error): void => {
                if (finished) return;
                finished = true;
                request.destroy();
                handler.onError(error);
            };
            const guarded = (callback: () => void): void => {
                try {
                    callback();
                } catch (error) {
                    fail(error instanceof Error ? error : new Error(String(error)));
                }
            };
            request.on('error', fail);
            request.on('upgrade', (_response, socket) => {
                socket.destroy();
                fail(new Error('HTTP protocol upgrades are not supported'));
            });
            request.on('response', (response) => {
                responseBody = response;
                response.on('error', fail);
                response.on('data', (chunk: Buffer) => {
                    if (!finished)
                        guarded(() => {
                            if (!handler.onData(chunk)) response.pause();
                        });
                });
                response.on('end', () => {
                    if (finished) return;
                    guarded(() =>
                        handler.onComplete(response.rawTrailers.map((value) => Buffer.from(value, 'latin1'))),
                    );
                    finished = true;
                    // A server can reject an upload before consuming it. Stop
                    // the losing producer once the response is complete; its
                    // pipeline remains observed until source cleanup settles.
                    if (!request.writableFinished) request.destroy();
                });
                const resume = (): void => {
                    response.resume();
                };
                guarded(() => {
                    if (
                        !handler.onHeaders(
                            response.statusCode ?? 0,
                            response.rawHeaders.map((value) => Buffer.from(value, 'latin1')),
                            resume,
                            response.statusMessage ?? '',
                        )
                    )
                        response.pause();
                });
            });
            guarded(() => handler.onConnect(fail));
            if (finished) return true;
            if (options.body === null) request.end();
            else void observeOperation(pipeline(Readable.from(options.body), request)).catch(fail);
            return true;
        },
    };
}
