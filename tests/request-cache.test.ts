import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestCache, type CacheLoadResult } from '../src/request-cache.js';

const createCache = (overrides: Partial<ConstructorParameters<typeof RequestCache>[0]> = {}): RequestCache =>
    new RequestCache({
        enableStorage: true,
        ttlMs: 1_000,
        cleanupIntervalMs: 0,
        maxEntries: 100,
        ...overrides,
    });

const resolve = <T>(
    cache: RequestCache,
    key: string,
    load: () => Promise<CacheLoadResult<T>>,
    shareInFlight = true,
): Promise<T> =>
    cache.resolve({
        key,
        shareInFlight,
        wait: (promise) => promise,
        load,
    });

describe('RequestCache', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('clones values on storage and retrieval', async () => {
        const cache = createCache();
        const source = { nested: { value: 1 } };
        const load = vi.fn(async () => ({ value: source, cacheable: true }));

        const first = await resolve(cache, 'project:1', load);
        source.nested.value = 2;
        first.nested.value = 3;

        await expect(resolve(cache, 'project:1', load)).resolves.toEqual({ nested: { value: 1 } });
        expect(load).toHaveBeenCalledTimes(1);
        cache.dispose();
    });

    it('coalesces identical upstream work even when storage is disabled', async () => {
        const cache = createCache({ enableStorage: false });
        let release: ((value: CacheLoadResult<number>) => void) | undefined;
        const load = vi.fn(
            () =>
                new Promise<CacheLoadResult<number>>((resolveLoad) => {
                    release = resolveLoad;
                }),
        );

        const first = resolve(cache, 'project:1', load);
        const second = resolve(cache, 'project:1', load);
        release?.({ value: 7, cacheable: true });

        await expect(Promise.all([first, second])).resolves.toEqual([7, 7]);
        expect(load).toHaveBeenCalledTimes(1);
        await resolve(cache, 'project:1', async () => ({ value: 8, cacheable: true }));
        cache.dispose();
    });

    it('does not store results marked non-cacheable', async () => {
        const cache = createCache();
        const load = vi
            .fn<() => Promise<CacheLoadResult<number>>>()
            .mockResolvedValueOnce({ value: 1, cacheable: false })
            .mockResolvedValueOnce({ value: 2, cacheable: true });

        await expect(resolve(cache, 'project:1', load)).resolves.toBe(1);
        await expect(resolve(cache, 'project:1', load)).resolves.toBe(2);
        await expect(resolve(cache, 'project:1', load)).resolves.toBe(2);
        expect(load).toHaveBeenCalledTimes(2);
        cache.dispose();
    });

    it.each([new Error('synchronous load failed'), 'synchronous load failed'])(
        'normalizes a synchronously thrown loader value into a rejected promise: %#',
        async (thrown) => {
            const cache = createCache();

            await expect(
                resolve(cache, 'project:1', () => {
                    // Deliberately exercise normalization of a non-Error throw
                    // from an untyped user-supplied loader.
                    // eslint-disable-next-line @typescript-eslint/only-throw-error
                    throw thrown;
                }),
            ).rejects.toThrow('synchronous load failed');
            cache.dispose();
        },
    );

    it('prevents work started before invalidation from repopulating storage', async () => {
        const cache = createCache();
        let release: ((value: CacheLoadResult<number>) => void) | undefined;
        const stale = resolve(
            cache,
            'project:1',
            () =>
                new Promise<CacheLoadResult<number>>((resolveLoad) => {
                    release = resolveLoad;
                }),
        );

        cache.invalidate();
        const freshLoad = vi.fn(async () => ({ value: 2, cacheable: true }));
        const fresh = resolve(cache, 'project:1', freshLoad);
        release?.({ value: 1, cacheable: true });

        await expect(stale).resolves.toBe(1);
        await expect(fresh).resolves.toBe(2);
        await expect(resolve(cache, 'project:1', freshLoad)).resolves.toBe(2);
        expect(freshLoad).toHaveBeenCalledTimes(1);
        cache.dispose();
    });

    it('evicts the least-recently-used entry without evicting a touched entry', async () => {
        const cache = createCache({ maxEntries: 2 });
        const load = (value: number) => async (): Promise<CacheLoadResult<number>> => ({ value, cacheable: true });

        await resolve(cache, 'a', load(1));
        await resolve(cache, 'b', load(2));
        await resolve(cache, 'a', load(10)); // touch a
        await resolve(cache, 'c', load(3)); // evict b

        const reloadA = vi.fn(load(10));
        const reloadB = vi.fn(load(20));
        await expect(resolve(cache, 'a', reloadA)).resolves.toBe(1);
        await expect(resolve(cache, 'b', reloadB)).resolves.toBe(20);
        expect(reloadA).not.toHaveBeenCalled();
        expect(reloadB).toHaveBeenCalledTimes(1);
        cache.dispose();
    });

    it('does not publish deadline-bearing work for later callers to join', async () => {
        const cache = createCache();
        let releaseFirst: ((value: CacheLoadResult<number>) => void) | undefined;
        const firstLoad = vi.fn(
            () =>
                new Promise<CacheLoadResult<number>>((resolveLoad) => {
                    releaseFirst = resolveLoad;
                }),
        );
        const secondLoad = vi.fn(async () => ({ value: 2, cacheable: true }));

        const bounded = resolve(cache, 'project:1', firstLoad, false);
        await expect(resolve(cache, 'project:1', secondLoad)).resolves.toBe(2);
        releaseFirst?.({ value: 1, cacheable: true });
        await expect(bounded).resolves.toBe(1);
        expect(firstLoad).toHaveBeenCalledTimes(1);
        expect(secondLoad).toHaveBeenCalledTimes(1);
        cache.dispose();
    });

    it('expires entries and stops its cleanup timer on dispose', async () => {
        vi.useFakeTimers();
        const cache = createCache({ ttlMs: 100, cleanupIntervalMs: 50 });
        const load = vi
            .fn<() => Promise<CacheLoadResult<number>>>()
            .mockResolvedValueOnce({ value: 1, cacheable: true })
            .mockResolvedValueOnce({ value: 2, cacheable: true });

        await resolve(cache, 'project:1', load);
        expect(vi.getTimerCount()).toBe(1);
        await vi.advanceTimersByTimeAsync(101);
        await expect(resolve(cache, 'project:1', load)).resolves.toBe(2);
        expect(load).toHaveBeenCalledTimes(2);

        cache.dispose();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('expires an entry on read when periodic cleanup is disabled', async () => {
        vi.useFakeTimers();
        const cache = createCache({ ttlMs: 100, cleanupIntervalMs: 0 });
        const load = vi
            .fn<() => Promise<CacheLoadResult<number>>>()
            .mockResolvedValueOnce({ value: 1, cacheable: true })
            .mockResolvedValueOnce({ value: 2, cacheable: true });

        await expect(resolve(cache, 'project:1', load)).resolves.toBe(1);
        await vi.advanceTimersByTimeAsync(101);
        await expect(resolve(cache, 'project:1', load)).resolves.toBe(2);
        expect(load).toHaveBeenCalledTimes(2);
        cache.dispose();
    });
});
