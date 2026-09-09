import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient, type TestRailConfig } from '../src/index.js';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: Error) => void } {
    let resolve: (value: T) => void = () => undefined;
    let reject: (reason: Error) => void = () => undefined;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

describe('tracked multipart resource lifetime', () => {
    const clients: TestRailClient[] = [];
    const clientWith = (options: Partial<TestRailConfig>): TestRailClient => {
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            enableCache: false,
            registerProcessHandlers: false,
            ...options,
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

    it('preserves native FormData encoding and caller Blob while tracking actual consumption', async () => {
        let sentBody = '';
        const fetch = vi.fn<typeof globalThis.fetch>(async (url, options) => {
            const encoded = new globalThis.Request(url, options);
            sentBody = await encoded.text();
            expect(encoded.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
            return new Response('{"attachment_id":42}');
        });
        const client = clientWith({ fetch });
        const blob = new globalThis.Blob(['file payload'], { type: 'text/plain' });
        const originalStream: unknown = Reflect.get(blob, 'stream');
        const operation = client.trackOperation(() => client.attachments.addAttachmentToCase(1, blob, 'evidence.txt'));
        await expect(operation.result).resolves.toEqual({ attachment_id: 42 });
        await operation.settled;
        expect(sentBody).toContain('name="attachment"; filename="evidence.txt"');
        expect(sentBody).toContain('Content-Type: text/plain');
        expect(sentBody).toContain('file payload');
        expect(Reflect.get(blob, 'stream')).toBe(originalStream);
        expect(Object.hasOwn(blob, 'stream')).toBe(false);
    });

    it.each(['network', 'timeout', 'success'] as const)(
        'retains %s upload ownership until cancellation and late read both settle',
        async (failure) => {
            vi.useFakeTimers();
            const reading = deferred<{ done: boolean; value?: Uint8Array }>();
            const cancelling = deferred<void>();
            const read = vi.fn(() => reading.promise);
            const cancel = vi.fn(() => cancelling.promise);
            const releaseLock = vi.fn();
            vi.spyOn(globalThis.Blob.prototype, 'stream').mockReturnValue({
                getReader: () => ({ read, cancel, releaseLock }),
            } as unknown as ReturnType<globalThis.Blob['stream']>);
            const fetching = deferred<Response>();
            let uploadedFile: globalThis.Blob | undefined;
            const fetch = vi.fn<typeof globalThis.fetch>((_url, options) => {
                const body = options?.body;
                if (!(body instanceof globalThis.FormData)) throw new Error('Expected FormData');
                const file = body.get('attachment');
                if (!(file instanceof globalThis.Blob)) throw new Error('Expected Blob');
                uploadedFile = file;
                void file
                    .stream()
                    .getReader()
                    .read()
                    .catch(() => undefined);
                if (failure === 'timeout') {
                    options?.signal?.addEventListener('abort', () => {
                        const error = new Error('aborted');
                        error.name = 'AbortError';
                        fetching.reject(error);
                    });
                }
                return fetching.promise;
            });
            const client = clientWith({ fetch, timeout: 10 });
            const operation = client.trackOperation(() =>
                client.attachments.addAttachmentToCase(1, new Uint8Array([1]), 'file.bin'),
            );
            let settled = false;
            void operation.settled.then(() => {
                settled = true;
            });
            const assertion =
                failure === 'success'
                    ? expect(operation.result).resolves.toEqual({ attachment_id: 42 })
                    : expect(operation.result).rejects.toMatchObject({ status: failure === 'timeout' ? 408 : 0 });
            await vi.advanceTimersByTimeAsync(0);
            expect(read).toHaveBeenCalledOnce();
            if (failure === 'timeout') await vi.advanceTimersByTimeAsync(10);
            else if (failure === 'success') fetching.resolve(new Response('{"attachment_id":42}'));
            else fetching.reject(new Error('transport failed'));
            await assertion;
            expect(cancel).toHaveBeenCalledOnce();
            expect(settled).toBe(false);
            if (failure === 'success') cancelling.reject(new Error('late upload cancellation failure'));
            else cancelling.resolve();
            await vi.advanceTimersByTimeAsync(0);
            expect(settled).toBe(false);
            reading.reject(new Error('late upload read failure'));
            await operation.settled;
            expect(settled).toBe(true);
            expect(releaseLock).toHaveBeenCalledOnce();
            expect(() => uploadedFile?.stream()).toThrow('Upload stream is closed');
        },
    );
});
