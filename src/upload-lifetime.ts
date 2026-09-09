import { bindOperation, observeOperation } from './operation-tracking.js';

/**
 * Observe the streams actually consumed by fetch's FormData encoder. The
 * appended File belongs to this FormData; caller-owned Blobs remain untouched.
 * Keep FormData's native boundary, filename escaping, and content length.
 */
export function ownUploadStreams(formData: globalThis.FormData): () => void {
    const file = formData.get('attachment');
    if (!(file instanceof globalThis.Blob)) return () => undefined;
    const originalStream = file.stream.bind(file);
    const active = new Set<() => Promise<void>>();
    let closed = false;

    Object.defineProperty(file, 'stream', {
        value: bindOperation((): globalThis.ReadableStream<Uint8Array> => {
            if (closed) throw new Error('Upload stream is closed');
            const reader = originalStream().getReader();
            let outputController: globalThis.ReadableStreamDefaultController<Uint8Array> | undefined;
            let finished = false;
            let finish: () => void = () => undefined;
            void observeOperation(
                new Promise<void>((resolve) => {
                    finish = resolve;
                }),
            );
            const complete = (): void => {
                finished = true;
                active.delete(cancel);
                try {
                    reader.releaseLock();
                } catch {
                    /* best-effort release after cancellation */
                }
                finish();
            };
            let cancellation: Promise<void> | undefined;
            const cancel = bindOperation((): Promise<void> => {
                if (cancellation !== undefined) return cancellation;
                if (finished) return Promise.resolve();
                finished = true;
                try {
                    outputController?.close();
                } catch {
                    // A consumer-initiated cancellation already closed it.
                }
                try {
                    cancellation = observeOperation(reader.cancel()).then(complete, complete);
                } catch {
                    complete();
                    cancellation = Promise.resolve();
                }
                return cancellation;
            });
            active.add(cancel);

            return new globalThis.ReadableStream<Uint8Array>({
                start(controller): void {
                    outputController = controller;
                },
                pull: bindOperation(async (controller): Promise<void> => {
                    try {
                        const next = await observeOperation(reader.read());
                        if (finished) return;
                        if (next.done) {
                            complete();
                            controller.close();
                        } else {
                            controller.enqueue(next.value);
                        }
                    } catch (error) {
                        if (!finished) {
                            complete();
                            controller.error(error);
                        }
                    }
                }),
                cancel,
            });
        }),
    });

    return () => {
        closed = true;
        // Cancellation is requested promptly, but settlement waits for the
        // underlying cancel AND any outstanding reads, not just this call.
        for (const cancel of active) void cancel();
    };
}
