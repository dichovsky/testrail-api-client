import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { ReadableStreamReadResult } from 'node:stream/web';
import { TestRailClient, TestRailApiError, type OperationHandle, type Project } from '../src/index.js';
import type { TestRailConfig } from '../src/types.js';
import { BASE_CONFIG, MOCK_PROJECT, mockOk } from './helpers.js';

function deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason: unknown) => void;
} {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function settlementProbe(operation: OperationHandle<unknown>): ReturnType<typeof vi.fn> {
    const settled = vi.fn();
    void operation.settled.then(settled);
    return settled;
}

function controlledBody(): {
    response: Response;
    read: ReturnType<typeof deferred<ReadableStreamReadResult<Uint8Array>>>;
    cancellation: ReturnType<typeof deferred<void>>;
    reader: {
        read: ReturnType<typeof vi.fn>;
        cancel: ReturnType<typeof vi.fn>;
        releaseLock: ReturnType<typeof vi.fn>;
    };
} {
    const read = deferred<ReadableStreamReadResult<Uint8Array>>();
    const cancellation = deferred<void>();
    const reader = {
        read: vi.fn(() => read.promise),
        cancel: vi.fn(() => cancellation.promise),
        releaseLock: vi.fn(),
    };
    // A deliberately non-conforming reader keeps read and cancel independent.
    // Real streams commonly finish read immediately when cancel is requested.
    const response = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new globalThis.Headers(),
        body: { getReader: () => reader },
    } as unknown as Response;
    return { response, read, cancellation, reader };
}

describe('TestRailClient.trackOperation settlement', () => {
    const clients = new Set<TestRailClient>();
    let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>;

    function createClient(overrides: Partial<TestRailConfig> = {}): TestRailClient {
        const client = new TestRailClient({
            ...BASE_CONFIG,
            enableCache: false,
            cacheCleanupInterval: 0,
            maxRetries: 0,
            timeout: 1_000,
            bodyTimeout: 20,
            fetch,
            ...overrides,
        });
        clients.add(client);
        return client;
    }

    beforeEach(() => {
        vi.useFakeTimers();
        fetch = vi.fn<typeof globalThis.fetch>();
    });

    afterEach(() => {
        for (const client of clients) client.destroy();
        clients.clear();
        vi.useRealTimers();
    });

    it.each([undefined, 100] as const)(
        'preserves a response when fetch ignores the header timeout (aggregate budget %s)',
        async (maxDurationMs) => {
            const headers = deferred<Response>();
            fetch.mockReturnValue(headers.promise);
            const client = createClient({ timeout: 10 });
            const operation = client.trackOperation<Project | Project[]>(() =>
                maxDurationMs === undefined
                    ? client.projects.getProject(1)
                    : client.projects.getAllProjects({ maxDurationMs }),
            );
            await vi.advanceTimersByTimeAsync(10);
            expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
            const value = maxDurationMs === undefined ? MOCK_PROJECT : [MOCK_PROJECT];
            headers.resolve(new Response(JSON.stringify(value)));
            await expect(operation.result).resolves.toEqual(value);
            await operation.settled;
        },
    );

    it('preserves synchronous callback values and exposes the public handle type', async () => {
        const client = createClient();
        const value = { callerValue: 'retained' };
        const operation = client.trackOperation(() => value);
        expectTypeOf(operation).toEqualTypeOf<OperationHandle<typeof value>>();

        await expect(operation.result).resolves.toBe(value);
        await expect(operation.settled).resolves.toBeUndefined();
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each(['synchronous', 'asynchronous'] as const)('preserves %s callback errors', async (kind) => {
        const client = createClient();
        const failure = new Error('caller failure');
        const operation = client.trackOperation(() => {
            if (kind === 'synchronous') throw failure;
            return Promise.reject(failure);
        });

        await expect(operation.result).rejects.toBe(failure);
        await expect(operation.settled).resolves.toBeUndefined();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('preserves the exact reason of a synchronous non-Error callback throw', async () => {
        const client = createClient();
        const reason = { kind: 'caller-defined failure' };
        const operation = client.trackOperation(() => {
            // Untyped consumers can throw any value; tracking must not normalize it.
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw reason;
        });

        await expect(operation.result).rejects.toBe(reason);
        await expect(operation.settled).resolves.toBeUndefined();
    });

    it('preserves public method errors from a throwing response hook', async () => {
        const failure = new Error('strict response mismatch');
        const client = createClient({
            maxRetries: 3,
            onSchemaMismatch: () => {
                throw failure;
            },
        });
        fetch.mockResolvedValueOnce(mockOk({ id: 'invalid project' }));
        const operation = client.trackOperation(() => client.projects.getProject(1));

        await expect(operation.result).rejects.toBe(failure);
        await expect(operation.settled).resolves.toBeUndefined();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it.each(['resolve', 'reject'] as const)(
        'keeps timed-out aggregate DNS owned until its late %s without starting fetch',
        async (completion) => {
            const dns = deferred<{ address: string; family: number }[]>();
            const dnsLookup = vi.fn(() => dns.promise);
            const client = createClient({ allowPrivateHosts: false, dnsLookup });
            const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 10 }));
            const result = operation.result.catch((error: unknown) => error);
            const settled = settlementProbe(operation);

            await vi.advanceTimersByTimeAsync(10);
            expect(await result).toMatchObject({ name: 'TestRailPaginationError', reason: 'max_duration' });
            expect(dnsLookup).toHaveBeenCalledTimes(1);
            expect(fetch).not.toHaveBeenCalled();
            expect(settled).not.toHaveBeenCalled();

            if (completion === 'resolve') dns.resolve([{ address: '93.184.216.34', family: 4 }]);
            else dns.reject(new Error('late DNS failure'));

            await operation.settled;
            expect(settled).toHaveBeenCalledTimes(1);
            expect(fetch).not.toHaveBeenCalled();
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it('observes fetch rejection after the aggregate result has timed out', async () => {
        const upstream = deferred<Response>();
        fetch.mockReturnValueOnce(upstream.promise);
        const client = createClient({ maxRetries: 3 });
        const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 10 }));
        const result = operation.result.catch((error: unknown) => error);
        const settled = settlementProbe(operation);

        await vi.advanceTimersByTimeAsync(10);
        expect(await result).toMatchObject({ reason: 'max_duration' });
        expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        expect(settled).not.toHaveBeenCalled();

        upstream.reject(new TypeError('fetch ignored abort, then failed'));
        await operation.settled;
        expect(settled).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['resolve', 'reject'] as const)(
        'owns unread-body cancellation after late fetch headers until cleanup %s',
        async (completion) => {
            const upstream = deferred<Response>();
            const cancellation = deferred<void>();
            const cancel = vi.fn(() => cancellation.promise);
            const body = new globalThis.ReadableStream<Uint8Array>({ cancel });
            const response = new Response(body);
            const getReader = vi.spyOn(body, 'getReader');
            fetch.mockReturnValueOnce(upstream.promise);
            const client = createClient();
            const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 10 }));
            const result = operation.result.catch((error: unknown) => error);
            const settled = settlementProbe(operation);

            await vi.advanceTimersByTimeAsync(10);
            expect(await result).toMatchObject({ reason: 'max_duration' });
            expect(settled).not.toHaveBeenCalled();
            upstream.resolve(response);
            await vi.advanceTimersByTimeAsync(0);
            expect(cancel).toHaveBeenCalledTimes(1);
            expect(getReader).not.toHaveBeenCalled();
            expect(settled).not.toHaveBeenCalled();

            if (completion === 'resolve') cancellation.resolve(undefined);
            else cancellation.reject(new Error('late cancellation failure'));

            await operation.settled;
            expect(settled).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it('keeps redirect cleanup owned while preserving the HTTP error', async () => {
        const cancellation = deferred<void>();
        const cancel = vi.fn(() => cancellation.promise);
        fetch.mockResolvedValueOnce(new Response(new globalThis.ReadableStream({ cancel }), { status: 302 }));
        const client = createClient();
        const operation = client.trackOperation(() => client.projects.getProject(1));
        const settled = settlementProbe(operation);

        await expect(operation.result).rejects.toMatchObject({ name: TestRailApiError.name, status: 302 });
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(settled).not.toHaveBeenCalled();
        cancellation.resolve(undefined);
        await operation.settled;
        expect(settled).toHaveBeenCalledTimes(1);
    });

    it.each(['read-first', 'cancel-first'] as const)(
        'waits for both the timed-out body read and cancellation, completing %s',
        async (completionOrder) => {
            const body = controlledBody();
            fetch.mockResolvedValueOnce(body.response);
            const client = createClient();
            const operation = client.trackOperation(() => client.projects.getProject(1));
            const result = operation.result.catch((error: unknown) => error);
            const settled = settlementProbe(operation);

            await vi.advanceTimersByTimeAsync(20);
            expect(await result).toMatchObject({ status: 0, statusText: 'Body read timeout' });
            expect(body.reader.read).toHaveBeenCalledTimes(1);
            expect(body.reader.cancel).toHaveBeenCalledTimes(1);
            expect(body.reader.releaseLock).toHaveBeenCalledTimes(1);
            expect(settled).not.toHaveBeenCalled();

            if (completionOrder === 'read-first') body.read.resolve({ done: true, value: undefined });
            else body.cancellation.resolve(undefined);
            await vi.advanceTimersByTimeAsync(0);
            expect(settled).not.toHaveBeenCalled();

            if (completionOrder === 'read-first') body.cancellation.reject(new Error('cancel failed late'));
            else body.read.reject(new Error('read failed late'));
            await operation.settled;
            expect(settled).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it.each(['arrayBuffer', 'text'] as const)(
        'waits for a non-cancellable %s fallback read after its result timeout',
        async (fallback) => {
            const bytes = deferred<ArrayBuffer>();
            const text = deferred<string>();
            const arrayBuffer = vi.fn(() => bytes.promise);
            const readText = vi.fn(() => text.promise);
            const response = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new globalThis.Headers(),
                body: null,
                ...(fallback === 'arrayBuffer' ? { arrayBuffer } : { text: readText }),
            } as unknown as Response;
            fetch.mockResolvedValueOnce(response);
            const client = createClient();
            const operation = client.trackOperation(() => client.projects.getProject(1));
            const result = operation.result.catch((error: unknown) => error);
            const settled = settlementProbe(operation);

            await vi.advanceTimersByTimeAsync(20);
            expect(await result).toMatchObject({ statusText: 'Body read timeout' });
            expect(settled).not.toHaveBeenCalled();
            if (fallback === 'arrayBuffer') {
                expect(arrayBuffer).toHaveBeenCalledTimes(1);
                bytes.resolve(new ArrayBuffer(0));
            } else {
                expect(readText).toHaveBeenCalledTimes(1);
                text.reject(new Error('fallback failed after timeout'));
            }

            await operation.settled;
            expect(settled).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it('keeps byte-limit cancellation owned after the body read has already finished', async () => {
        const body = controlledBody();
        fetch.mockResolvedValueOnce(body.response);
        const client = createClient({ maxJsonResponseBytes: 1 });
        const operation = client.trackOperation(() => client.projects.getProject(1));
        const result = operation.result.catch((error: unknown) => error);
        const settled = settlementProbe(operation);

        body.read.resolve({ done: false, value: new Uint8Array([1, 2]) });
        expect(await result).toMatchObject({ status: 0, statusText: 'Response body too large' });
        expect(body.reader.cancel).toHaveBeenCalledTimes(1);
        expect(settled).not.toHaveBeenCalled();
        body.cancellation.resolve(undefined);
        await operation.settled;
        expect(settled).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('retains aggregate body cleanup when the configured body timeout is disabled', async () => {
        const body = controlledBody();
        fetch.mockResolvedValueOnce(body.response);
        const client = createClient({ bodyTimeout: 0 });
        const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 10 }));
        const result = operation.result.catch((error: unknown) => error);
        const settled = settlementProbe(operation);

        await vi.advanceTimersByTimeAsync(10);
        expect(await result).toMatchObject({ reason: 'max_duration' });
        expect(body.reader.cancel).toHaveBeenCalledOnce();
        expect(settled).not.toHaveBeenCalled();
        body.read.resolve({ done: true, value: undefined });
        await vi.advanceTimersByTimeAsync(0);
        expect(settled).not.toHaveBeenCalled();
        body.cancellation.resolve(undefined);
        await operation.settled;
    });

    it('settles an interrupted aggregate retry delay without waiting for its original timer', async () => {
        fetch.mockResolvedValueOnce(new Response('retry later', { status: 503, headers: { 'Retry-After': '1' } }));
        const client = createClient({ maxRetries: 3 });
        const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 10 }));
        const result = operation.result.catch((error: unknown) => error);
        const settled = settlementProbe(operation);

        await vi.advanceTimersByTimeAsync(0);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(settled).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(10);
        expect(await result).toMatchObject({ reason: 'max_duration' });
        await operation.settled;
        expect(settled).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('retains already-started driver work when the callback throws synchronously', async () => {
        const body = controlledBody();
        fetch.mockResolvedValueOnce(body.response);
        const client = createClient();
        const failure = new Error('caller failed after starting a request');
        const operation = client.trackOperation(() => {
            void client.projects.getProject(1).catch(() => undefined);
            throw failure;
        });
        const settled = settlementProbe(operation);

        await expect(operation.result).rejects.toBe(failure);
        await vi.advanceTimersByTimeAsync(20);
        expect(body.reader.cancel).toHaveBeenCalledTimes(1);
        expect(settled).not.toHaveBeenCalled();
        body.read.resolve({ done: true, value: undefined });
        body.cancellation.resolve(undefined);
        await operation.settled;
        expect(settled).toHaveBeenCalledTimes(1);
    });

    it.each(['tracked', 'untracked'] as const)(
        'joins the full body cleanup of a coalesced %s initiator with cache storage disabled',
        async (initiator) => {
            const body = controlledBody();
            fetch.mockResolvedValueOnce(body.response);
            const client = createClient({ enableCache: false });
            const first =
                initiator === 'tracked' ? client.trackOperation(() => client.projects.getProject(1)) : undefined;
            const firstResult = (first?.result ?? client.projects.getProject(1)).catch((error: unknown) => error);
            const firstSettled = first === undefined ? undefined : settlementProbe(first);
            await vi.advanceTimersByTimeAsync(0);
            const joiner = client.trackOperation(() => client.projects.getProject(1));
            const joinerResult = joiner.result.catch((error: unknown) => error);
            const joinerSettled = settlementProbe(joiner);

            await vi.advanceTimersByTimeAsync(20);
            expect(await firstResult).toMatchObject({ statusText: 'Body read timeout' });
            expect(await joinerResult).toBe(await firstResult);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(joinerSettled).not.toHaveBeenCalled();
            if (firstSettled !== undefined) expect(firstSettled).not.toHaveBeenCalled();

            body.read.resolve({ done: true, value: undefined });
            await vi.advanceTimersByTimeAsync(0);
            expect(joinerSettled).not.toHaveBeenCalled();
            if (firstSettled !== undefined) expect(firstSettled).not.toHaveBeenCalled();
            body.cancellation.resolve(undefined);
            await joiner.settled;
            if (first !== undefined) await first.settled;
            expect(joinerSettled).toHaveBeenCalledTimes(1);
            if (firstSettled !== undefined) expect(firstSettled).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it('includes nested driver work even when the outer callback returns immediately', async () => {
        const body = controlledBody();
        fetch.mockResolvedValueOnce(body.response);
        const client = createClient();
        const outer = client.trackOperation(() => ({
            nested: client.trackOperation(() => client.projects.getProject(1)),
            value: 'outer callback finished',
        }));
        const outerSettled = settlementProbe(outer);
        const { nested, value } = await outer.result;
        const nestedResult = nested.result.catch((error: unknown) => error);
        const nestedSettled = settlementProbe(nested);
        expect(value).toBe('outer callback finished');

        await vi.advanceTimersByTimeAsync(20);
        expect(await nestedResult).toMatchObject({ statusText: 'Body read timeout' });
        expect(outerSettled).not.toHaveBeenCalled();
        expect(nestedSettled).not.toHaveBeenCalled();
        body.read.resolve({ done: true, value: undefined });
        body.cancellation.resolve(undefined);

        await Promise.all([outer.settled, nested.settled]);
        expect(outerSettled).toHaveBeenCalledTimes(1);
        expect(nestedSettled).toHaveBeenCalledTimes(1);
    });

    it('isolates simultaneous scopes while one cleans up and another retries', async () => {
        const body = controlledBody();
        const secondProject = { ...MOCK_PROJECT, id: 2 };
        const thirdProject = { ...MOCK_PROJECT, id: 3 };
        fetch
            .mockResolvedValueOnce(body.response)
            .mockResolvedValueOnce(new Response('retry later', { status: 503, headers: { 'Retry-After': '1' } }))
            .mockResolvedValueOnce(mockOk(thirdProject))
            .mockResolvedValueOnce(mockOk(secondProject));
        const client = createClient({ maxRetries: 1 });
        const first = client.trackOperation(() => client.projects.getProject(1));
        const firstResult = first.result.catch((error: unknown) => error);
        const firstSettled = settlementProbe(first);
        await vi.advanceTimersByTimeAsync(0);
        const retrying = client.trackOperation(() => ({ request: client.projects.getProject(2) }));
        const { request: retryResult } = await retrying.result;
        const retrySettled = settlementProbe(retrying);
        await vi.advanceTimersByTimeAsync(0);
        const independent = client.trackOperation(() => client.projects.getProject(3));
        await expect(independent.result).resolves.toEqual(thirdProject);
        await independent.settled;
        expect(firstSettled).not.toHaveBeenCalled();
        expect(retrySettled).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(20);
        expect(await firstResult).toMatchObject({ statusText: 'Body read timeout' });
        body.read.resolve({ done: true, value: undefined });
        body.cancellation.resolve(undefined);
        await first.settled;
        expect(firstSettled).toHaveBeenCalledTimes(1);
        expect(retrySettled).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(3);

        await vi.advanceTimersByTimeAsync(980);
        await expect(retryResult).resolves.toEqual(secondProject);
        await retrying.settled;
        expect(retrySettled).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(4);
        expect(vi.getTimerCount()).toBe(0);
    });
});
