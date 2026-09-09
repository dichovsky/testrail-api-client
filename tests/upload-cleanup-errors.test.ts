import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient, type TestRailConfig } from '../src/index.js';
import { BASE_CONFIG } from './helpers.js';

function deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: Error) => void;
} {
    let resolve: (value: T) => void = () => undefined;
    let reject: (reason: Error) => void = () => undefined;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

function controlledUpload(): {
    reading: ReturnType<typeof deferred<{ done: boolean; value?: Uint8Array }>>;
    cancelling: ReturnType<typeof deferred<void>>;
    fetching: ReturnType<typeof deferred<Response>>;
    read: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    releaseLock: ReturnType<typeof vi.fn>;
    fetch: typeof globalThis.fetch;
    consumer: () => {
        reader: globalThis.ReadableStreamDefaultReader<Uint8Array>;
        result: Promise<unknown>;
    };
} {
    const reading = deferred<{ done: boolean; value?: Uint8Array }>();
    const cancelling = deferred<void>();
    const fetching = deferred<Response>();
    const read = vi.fn(() => reading.promise);
    const cancel = vi.fn(() => cancelling.promise);
    const releaseLock = vi.fn();
    vi.spyOn(globalThis.Blob.prototype, 'stream').mockReturnValue({
        getReader: () => ({ read, cancel, releaseLock }),
    } as unknown as ReturnType<globalThis.Blob['stream']>);
    let consumer: { reader: globalThis.ReadableStreamDefaultReader<Uint8Array>; result: Promise<unknown> } | undefined;
    const fetch = vi.fn<typeof globalThis.fetch>((_url, options) => {
        if (!(options?.body instanceof globalThis.FormData)) throw new Error('Expected FormData');
        const file = options.body.get('attachment');
        if (!(file instanceof globalThis.Blob)) throw new Error('Expected attachment Blob');
        const reader = file.stream().getReader();
        consumer = { reader, result: reader.read().catch((error: unknown) => error) };
        return fetching.promise;
    });
    return {
        reading,
        cancelling,
        fetching,
        read,
        cancel,
        releaseLock,
        fetch,
        consumer: () => {
            if (consumer === undefined) throw new Error('Fetch has not started consuming the upload');
            return consumer;
        },
    };
}

describe('public multipart cleanup error handling', () => {
    const clients = new Set<TestRailClient>();
    const clientWith = (overrides: Partial<TestRailConfig>): TestRailClient => {
        const client = new TestRailClient({
            ...BASE_CONFIG,
            enableCache: false,
            cacheCleanupInterval: 0,
            maxRetries: 0,
            ...overrides,
        });
        clients.add(client);
        return client;
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        clients.forEach((client) => client.destroy());
        clients.clear();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('shares an in-progress consumer cancellation with subsequent pipeline cleanup', async () => {
        const upload = controlledUpload();
        const client = clientWith({ fetch: upload.fetch });
        const operation = client.trackOperation(() =>
            client.attachments.addAttachmentToCase(1, new Uint8Array([1]), 'evidence.bin'),
        );
        const result = operation.result.catch((error: unknown) => error);
        const settled = vi.fn();
        void operation.settled.then(settled);
        await vi.advanceTimersByTimeAsync(0);
        expect(upload.read).toHaveBeenCalledOnce();

        const consumer = upload.consumer();
        const consumerCleanup = consumer.reader.cancel('the encoder stopped consuming');
        upload.fetching.reject(new Error('transport failed after consumer cancellation'));
        expect(await result).toMatchObject({
            status: 0,
            statusText: 'Network error: transport failed after consumer cancellation',
        });
        expect(upload.cancel).toHaveBeenCalledOnce();
        expect(upload.releaseLock).not.toHaveBeenCalled();
        expect(settled).not.toHaveBeenCalled();

        upload.reading.resolve({ done: true });
        await vi.advanceTimersByTimeAsync(0);
        expect(settled).not.toHaveBeenCalled();
        upload.cancelling.resolve(undefined);
        await consumerCleanup;
        await expect(consumer.result).resolves.toEqual({ done: true, value: undefined });
        consumer.reader.releaseLock();
        await operation.settled;
        expect(upload.cancel).toHaveBeenCalledOnce();
        expect(upload.releaseLock).toHaveBeenCalledOnce();
        expect(settled).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('propagates a source read failure to the FormData consumer before the transport finishes', async () => {
        const upload = controlledUpload();
        const client = clientWith({ fetch: upload.fetch });
        const operation = client.trackOperation(() =>
            client.attachments.addAttachmentToCase(1, new Uint8Array([1]), 'evidence.bin'),
        );
        const result = operation.result.catch((error: unknown) => error);
        const settled = vi.fn();
        void operation.settled.then(settled);
        await vi.advanceTimersByTimeAsync(0);
        const failure = new Error('upload source read failed');
        upload.reading.reject(failure);
        const consumer = upload.consumer();
        await expect(consumer.result).resolves.toBe(failure);
        consumer.reader.releaseLock();
        expect(upload.releaseLock).toHaveBeenCalledOnce();
        expect(upload.cancel).not.toHaveBeenCalled();
        expect(settled).not.toHaveBeenCalled();

        upload.fetching.reject(failure);
        expect(await result).toMatchObject({ status: 0, statusText: 'Network error: upload source read failed' });
        await operation.settled;
        expect(upload.cancel).not.toHaveBeenCalled();
        expect(settled).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('preserves the transport error when cancel and releaseLock throw, then waits for the late read', async () => {
        const upload = controlledUpload();
        upload.cancel.mockImplementation(() => {
            throw new Error('reader.cancel threw synchronously');
        });
        upload.releaseLock.mockImplementation(() => {
            throw new Error('reader.releaseLock failed during cleanup');
        });
        const client = clientWith({ fetch: upload.fetch });
        const operation = client.trackOperation(() =>
            client.attachments.addAttachmentToCase(1, new Uint8Array([1]), 'evidence.bin'),
        );
        const result = operation.result.catch((error: unknown) => error);
        const settled = vi.fn();
        void operation.settled.then(settled);
        await vi.advanceTimersByTimeAsync(0);
        upload.fetching.reject(new Error('original transport failure'));
        expect(await result).toMatchObject({ status: 0, statusText: 'Network error: original transport failure' });
        expect(upload.cancel).toHaveBeenCalledOnce();
        expect(upload.releaseLock).toHaveBeenCalledOnce();
        expect(settled).not.toHaveBeenCalled();
        const consumer = upload.consumer();
        await expect(consumer.result).resolves.toEqual({ done: true, value: undefined });
        consumer.reader.releaseLock();

        upload.reading.reject(new Error('late source read failure'));
        await operation.settled;
        expect(settled).toHaveBeenCalledOnce();
        expect(upload.cancel).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });
});
