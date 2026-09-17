import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it, vi } from 'vitest';
import { observeOperation, startOperation } from '../src/operation-tracking.js';
import { ownUploadStreams } from '../src/upload-lifetime.js';
import { MULTIPART_FIELD_NAME } from '../src/constants.js';
import { TestRailClient } from '../src/index.js';
import { BASE_CONFIG } from './helpers.js';

/**
 * Engagement is latched per process, so this lives in its own file: Vitest gives
 * each test file a fresh module registry, and every assertion below depends on
 * whether `trackOperation` has been called yet. Ordering inside the file is
 * deliberate and load-bearing.
 *
 * Why the latch exists: entering an `AsyncLocalStorage` installs context
 * propagation for the whole process and can never be undone. On Node 24 — the
 * only line this package supports — that is `AsyncContextFrame`, ~1% overhead
 * on promise traffic that has nothing to do with this client. Embedders who
 * never call `trackOperation` must not pay it.
 */
describe('operation tracking engagement', () => {
    // A resource that never finishes. Inside a scope it pins `settled` forever;
    // with no scope, `observeOperation` is a no-op and settlement is unaffected.
    const neverSettles = (): Promise<never> => new Promise<never>(() => undefined);

    const settlesPromptly = async (settled: Promise<void>): Promise<boolean> =>
        Promise.race([
            settled.then(() => true),
            new Promise<boolean>((resolve) => {
                setTimeout(() => resolve(false), 25);
            }),
        ]);

    it('creates no scope before the first trackOperation call', async () => {
        const handle = startOperation(() => {
            void observeOperation(neverSettles());
            return 'unscoped';
        });

        await expect(handle.result).resolves.toBe('unscoped');
        // Settles despite the pending resource: nothing observed it, because no
        // scope was entered. This is the assertion that fails if the latch is
        // removed and every request enters AsyncLocalStorage again.
        await expect(settlesPromptly(handle.settled)).resolves.toBe(true);
    });

    // Must stay ahead of the engagement test below: once `trackOperation` latches
    // the feature on, entering `AsyncLocalStorage` is expected and this assertion
    // no longer means anything.
    it('owns upload streams without entering AsyncLocalStorage before engagement', async () => {
        const runSpy = vi.spyOn(AsyncLocalStorage.prototype, 'run');
        try {
            const formData = new globalThis.FormData();
            formData.append(MULTIPART_FIELD_NAME, new globalThis.File(['payload'], 'upload.txt'));
            const cleanup = ownUploadStreams(formData);

            const file = formData.get(MULTIPART_FIELD_NAME);
            if (!(file instanceof globalThis.File)) throw new Error('expected the appended upload File');

            // Drive the same overrides fetch's FormData encoder drives: the
            // `stream()` override plus the underlying source's `pull`.
            await expect(new Response(file.stream()).text()).resolves.toBe('payload');
            cleanup();

            // An upload is an ordinary SDK call. A consumer who never calls
            // `trackOperation` must not have process-wide context tracking
            // installed on their behalf — it costs ~1% on unrelated promise
            // traffic, and it can never be undone.
            expect(runSpy).not.toHaveBeenCalled();
        } finally {
            runSpy.mockRestore();
        }
    });

    it('creates scopes for every later operation once trackOperation engages it', async () => {
        const client = new TestRailClient({ ...BASE_CONFIG, registerProcessHandlers: false });
        try {
            // Engage. The callback itself is trivial; the latch is the point.
            await client.trackOperation(() => undefined).settled;

            const handle = startOperation(() => {
                void observeOperation(neverSettles());
                return 'scoped';
            });

            await expect(handle.result).resolves.toBe('scoped');
            // Now the pending resource is owned, so settlement waits for it.
            await expect(settlesPromptly(handle.settled)).resolves.toBe(false);
        } finally {
            client.destroy();
        }
    });
});
