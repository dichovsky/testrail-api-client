import type { CacheEntry } from './types.js';
import { startOperation, observeOperation, type OperationHandle } from './operation-tracking.js';

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

export interface CacheResolution<Raw, T> {
    readonly key: string | undefined;
    /** Request policy can differ without changing the stored response identity. */
    readonly pendingKey?: string;
    /**
     * Whether this request may become the shared upstream request for later
     * callers. Deadline-bearing requests set this to false because their
     * transport can abort before an unbounded caller's wait should end.
     */
    readonly shareInFlight: boolean;
    /** Applies caller-specific waiting policy to cache hits and shared work. */
    readonly wait: (promise: Promise<T>) => Promise<T>;
    /** Performs upstream work, returning the raw response before caller transformations. */
    readonly load: () => Promise<Raw>;
    /** Decodes one caller's response and reports whether the raw response may be stored. */
    readonly decode: (raw: Raw) => CacheLoadResult<T>;
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
    private readonly pending = new Map<string, OperationHandle<unknown>>();
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
    public resolve<Raw, T>(resolution: CacheResolution<Raw, T>): Promise<T> {
        const { key } = resolution;
        if (key === undefined) {
            return startOperation(async () => resolution.decode(await resolution.load()).value).result;
        }

        const cached = this.read<Raw>(key);
        if (cached !== undefined) {
            return resolution.wait(Promise.resolve(cached).then((raw) => resolution.decode(raw).value));
        }

        const pendingKey = resolution.pendingKey ?? key;
        const existing = this.pending.get(pendingKey) as OperationHandle<Raw> | undefined;
        if (existing !== undefined) {
            void observeOperation(existing.settled);
            // Copy raw JSON before applying this caller's schema. Transformed
            // values can contain functions or class instances that cannot be
            // preserved by structuredClone.
            return resolution.wait(
                existing.result.then((raw) => resolution.decode(globalThis.structuredClone(raw)).value),
            );
        }

        const startedAtGeneration = this.generation;
        // `startOperation` invokes the loader synchronously inside its scope, so
        // the caller can begin transport setup and this entry can be published
        // before `resolve()` returns. Normalize a synchronous loader throw into
        // the promised error contract here; `startOperation` itself deliberately
        // preserves non-Error reasons for `trackOperation` callbacks.
        const upstream = startOperation(async () => {
            let work: Promise<Raw>;
            try {
                work = resolution.load();
            } catch (error) {
                throw error instanceof Error ? error : new Error(String(error));
            }
            const raw = await work;
            // Keep a pristine snapshot even if a caller's transform changes
            // its input. Decode inside the operation so work started by a
            // transform or mismatch hook remains part of its settlement.
            const snapshot = globalThis.structuredClone(raw);
            const { value, cacheable } = resolution.decode(raw);
            if (cacheable && startedAtGeneration === this.generation) {
                this.write(key, snapshot);
            }
            return { raw: snapshot, value };
        });

        if (resolution.shareInFlight) {
            const shared = { result: upstream.result.then(({ raw }) => raw), settled: upstream.settled };
            this.pending.set(pendingKey, shared);
            shared.result
                .finally(() => {
                    if (this.pending.get(pendingKey) === shared) {
                        this.pending.delete(pendingKey);
                    }
                })
                .catch(() => undefined);
        }

        return upstream.result.then(({ value }) => value);
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
