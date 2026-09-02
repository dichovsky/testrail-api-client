import type { CacheEntry } from './types.js';

export interface RequestCacheOptions {
    readonly enableStorage: boolean;
    readonly ttlMs: number;
    readonly cleanupIntervalMs: number;
    readonly maxEntries: number;
}

export interface CacheLoadResult<T> {
    readonly value: T;
    readonly cacheable: boolean;
}

export interface CacheResolution<T> {
    readonly key: string | undefined;
    /**
     * Whether this request may become the shared upstream request for later
     * callers. Deadline-bearing requests set this to false because their
     * transport can abort before an unbounded caller's wait should end.
     */
    readonly shareInFlight: boolean;
    /** Applies caller-specific waiting policy to cache hits and shared work. */
    readonly wait: (promise: Promise<T>) => Promise<T>;
    /** Performs the upstream work and reports whether its result may be stored. */
    readonly load: () => Promise<CacheLoadResult<T>>;
}

/**
 * Owns the complete GET cache protocol: cloning, TTL/LRU storage, concurrent
 * request coalescing, invalidation generations, and cleanup lifecycle.
 *
 * Callers describe one cacheable operation through {@link resolve}; they do
 * not observe cache maps, pending promises, or generation tokens.
 */
export class RequestCache {
    private readonly entries = new Map<string, CacheEntry<unknown>>();
    private readonly pending = new Map<string, Promise<unknown>>();
    private generation = 0;
    private cleanupTimer: ReturnType<typeof setInterval> | undefined;

    public constructor(private readonly options: RequestCacheOptions) {
        if (options.enableStorage && options.cleanupIntervalMs > 0) {
            this.cleanupTimer = setInterval(() => this.removeExpiredEntries(), options.cleanupIntervalMs);
            this.cleanupTimer.unref?.();
        }
    }

    /**
     * Resolves one request through cache read, in-flight coalescing, loading,
     * conditional publication, and pending-promise cleanup.
     */
    public resolve<T>(resolution: CacheResolution<T>): Promise<T> {
        const { key } = resolution;
        if (key === undefined) {
            return resolution.load().then(({ value }) => value);
        }

        const cached = this.read<T>(key);
        if (cached !== undefined) {
            return resolution.wait(Promise.resolve(cached));
        }

        const existing = this.pending.get(key) as Promise<T> | undefined;
        if (existing !== undefined) {
            return resolution.wait(existing);
        }

        const startedAtGeneration = this.generation;
        let upstream: Promise<CacheLoadResult<T>>;
        try {
            // Invoke synchronously so the caller can begin transport setup and
            // expose its controlled promise before resolve() returns. Convert a
            // synchronous loader throw into the promised error contract.
            upstream = resolution.load();
        } catch (error) {
            const rejection = error instanceof Error ? error : new Error(String(error));
            upstream = Promise.reject(rejection);
        }
        const loaded = upstream.then(({ value, cacheable }) => {
            if (cacheable && startedAtGeneration === this.generation) {
                this.write(key, value);
            }
            return value;
        });

        if (resolution.shareInFlight) {
            this.pending.set(key, loaded);
            loaded
                .finally(() => {
                    if (this.pending.get(key) === loaded) {
                        this.pending.delete(key);
                    }
                })
                .catch(() => undefined);
        }

        return loaded;
    }

    /**
     * Invalidates stored and in-flight reads. Work already in progress may
     * finish for its initiating caller, but its generation can no longer
     * publish stale data and later callers will not join it.
     */
    public invalidate(): void {
        this.entries.clear();
        this.pending.clear();
        this.generation += 1;
    }

    /** Stops background cleanup and releases all cache-owned state. */
    public dispose(): void {
        if (this.cleanupTimer !== undefined) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.invalidate();
    }

    private read<T>(key: string): T | undefined {
        if (!this.options.enableStorage) {
            return undefined;
        }

        const entry = this.entries.get(key) as CacheEntry<T> | undefined;
        if (entry === undefined) {
            return undefined;
        }
        if (entry.expiry <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }

        // Map insertion order is the LRU order. Touch on every successful read.
        this.entries.delete(key);
        this.entries.set(key, entry);
        return globalThis.structuredClone(entry.data);
    }

    private write<T>(key: string, value: T): void {
        if (!this.options.enableStorage) {
            return;
        }

        // Replacing an existing key must not evict a different entry merely
        // because the cache was already at capacity.
        this.entries.delete(key);
        if (this.options.maxEntries > 0 && this.entries.size >= this.options.maxEntries) {
            const oldestKey = this.entries.keys().next().value as string;
            this.entries.delete(oldestKey);
        }

        this.entries.set(key, {
            data: globalThis.structuredClone(value),
            expiry: Date.now() + this.options.ttlMs,
        });
    }

    private removeExpiredEntries(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];
        for (const [key, entry] of this.entries) {
            if (entry.expiry <= now) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            this.entries.delete(key);
        }
    }
}
