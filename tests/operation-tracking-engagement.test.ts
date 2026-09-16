import { describe, expect, it } from 'vitest';
import { observeOperation, startOperation } from '../src/operation-tracking.js';
import { TestRailClient } from '../src/index.js';
import { BASE_CONFIG } from './helpers.js';

/**
 * Engagement is latched per process, so this lives in its own file: Vitest gives
 * each test file a fresh module registry, and every assertion below depends on
 * whether `trackOperation` has been called yet. Ordering inside the file is
 * deliberate and load-bearing.
 *
 * Why the latch exists: entering an `AsyncLocalStorage` installs context
 * propagation for the whole process. On Node 24 that is `AsyncContextFrame`
 * (~1% overhead), but on the Node 20/22 lines this package supports it is the
 * async_hooks promise hook, measured at roughly +170% on promise traffic that
 * has nothing to do with this client. Embedders who never call
 * `trackOperation` must not pay it.
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
