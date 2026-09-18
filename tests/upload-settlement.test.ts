import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient, type TestRailConfig } from '../src/index.js';
import { ownUploadStreams } from '../src/upload-source.js';

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

    // The degradation the override guards against, pinned explicitly: with no
    // Blob entry under the shared field name there is nothing to own, so
    // cleanup is inert. Paired with the encoder test below, this is what keeps
    // a silently-inert wrapper from passing for a working one.
    it('degrades to an inert cleanup when no Blob is stored under the field name', () => {
        const empty = new globalThis.FormData();
        expect(ownUploadStreams(empty)()).toBeUndefined();

        const wrongType = new globalThis.FormData();
        wrongType.append('attachment', 'not-a-blob');
        expect(ownUploadStreams(wrongType)()).toBeUndefined();
    });

    // Ownership rests on two runtime assumptions that would otherwise fail
    // silently: FormData stores the appended part as a Blob we may override,
    // and the native multipart encoder reads that part through `File.stream()`.
    // If either stops holding, `ownUploadStreams` degrades to a no-op and
    // `settled` resolves while bytes are still in flight — with no error.
    it('installs a redefinable override that the native FormData encoder actually calls', async () => {
        let overrideCalls = 0;
        let ownsEntry = false;
        const fetch = vi.fn<typeof globalThis.fetch>(async (url, options) => {
            const body = options?.body;
            if (!(body instanceof globalThis.FormData)) throw new Error('Expected FormData');
            const file = body.get('attachment');
            ownsEntry = file instanceof globalThis.Blob && Object.hasOwn(file, 'stream');
            if (!(file instanceof globalThis.Blob)) throw new Error('Expected attachment Blob');

            // Redefining proves the override is configurable; counting proves
            // the encoder goes through the File's own `stream()`.
            const installed = file.stream.bind(file);
            Object.defineProperty(file, 'stream', {
                writable: true,
                configurable: true,
                enumerable: false,
                value: (): globalThis.ReadableStream<Uint8Array> => {
                    overrideCalls += 1;
                    return installed();
                },
            });

            const sent = await new globalThis.Request(url, options).text();
            expect(sent).toContain('file payload');
            return new Response('{"attachment_id":42}');
        });
        const client = clientWith({ fetch });
        const operation = client.trackOperation(() =>
            client.attachments.addAttachmentToCase(1, new globalThis.Blob(['file payload']), 'evidence.txt'),
        );

        await expect(operation.result).resolves.toEqual({ attachment_id: 42 });
        await operation.settled;
        expect(ownsEntry).toBe(true);
        expect(overrideCalls).toBe(1);
    });

    // A clean `close()` would hand the encoder a truncated file followed by a
    // valid closing boundary: a well-formed upload of partial bytes the server
    // stores as complete. Cleanup must error the stream so the body aborts.
    it('errors the in-flight upload stream on cleanup instead of closing it', async () => {
        // A source that yields one chunk and then stalls, so the encoder is
        // mid-file — exactly the state where a clean close truncates.
        const stall = deferred<void>();
        vi.spyOn(globalThis.Blob.prototype, 'stream').mockReturnValue(
            new globalThis.ReadableStream<Uint8Array>({
                async pull(controller): Promise<void> {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    await stall.promise;
                },
            }) as unknown as ReturnType<globalThis.Blob['stream']>,
        );
        const consuming = deferred<globalThis.ReadableStreamDefaultReader<Uint8Array>>();
        const transport = deferred<Response>();
        const fetch = vi.fn<typeof globalThis.fetch>((_url, options) => {
            const body = options?.body;
            if (!(body instanceof globalThis.FormData)) throw new Error('Expected FormData');
            const file = body.get('attachment');
            if (!(file instanceof globalThis.Blob)) throw new Error('Expected attachment Blob');
            consuming.resolve(file.stream().getReader());
            return transport.promise;
        });
        const client = clientWith({ fetch });
        const operation = client.trackOperation(() =>
            client.attachments.addAttachmentToCase(1, new Uint8Array([1, 2, 3, 4]), 'evidence.bin'),
        );
        const result = operation.result.catch((error: unknown) => error);

        const encoderReader = await consuming.promise;
        await expect(encoderReader.read()).resolves.toMatchObject({ done: false });
        const midFileRead = encoderReader.read();
        void midFileRead.catch(() => undefined);

        transport.reject(new Error('transport failed mid-upload'));
        expect(await result).toMatchObject({ status: 0 });

        // Rejects (aborting the request body) rather than resolving
        // `{ done: true }`, which is what a `close()` teardown would produce
        // and which the encoder would encode as a complete, truncated file.
        await expect(midFileRead).rejects.toThrow('Upload aborted before the request completed');
        stall.resolve();
        await operation.settled;
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
