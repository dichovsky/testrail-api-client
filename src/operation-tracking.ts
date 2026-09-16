import { AsyncLocalStorage } from 'node:async_hooks';

/** The visible result and the independently observable resource lifetime of an operation. */
export interface OperationHandle<T> {
    /** Preserves the callback's value, rejection, and normal deadline behavior. */
    readonly result: Promise<T>;
    /** Resolves after the callback and every started or joined driver task finish. Never rejects. */
    readonly settled: Promise<void>;
}

/** One scope also serves as transferable ownership for a coalesced request. */
class OperationScope {
    private pending = 1;
    private done = false;
    private readonly finish: () => void;
    readonly settled: Promise<void>;

    constructor() {
        let finish: () => void = () => undefined;
        this.settled = new Promise<void>((resolve) => {
            finish = resolve;
        });
        this.finish = finish;
    }

    /**
     * Registers one resource. Callers must observe before whatever currently
     * holds the scope open can settle — in practice the callback's own result,
     * which stays pending for the whole request — so a resource is never
     * registered against an already-settled scope.
     *
     * `Promise.resolve` normalizes the input. Transports, streams, and
     * Response-like objects come from callers and are not guaranteed to return
     * a thenable; observation must never turn that into a TypeError on the
     * caller's result path.
     */
    observe(promise: unknown): void {
        this.pending += 1;
        // Observe both outcomes without changing the original promise. In
        // particular, losing deadline/cancellation promises may reject late.
        void Promise.resolve(promise).then(
            () => this.release(),
            () => this.release(),
        );
    }

    release(): void {
        this.pending -= 1;
        // Settlement is one-shot. `<= 0` plus the `done` latch means neither an
        // unbalanced release nor a late observe can resolve twice or strand a
        // re-opened scope; settlement still cannot be un-done once published.
        if (this.pending <= 0 && !this.done) {
            this.done = true;
            this.finish();
        }
    }
}

const operations = new AsyncLocalStorage<OperationScope | undefined>();

/** Records an actual resource promise before any caller-visible deadline race. */
export function observeOperation<T>(promise: Promise<T>): Promise<T> {
    operations.getStore()?.observe(promise);
    return promise;
}

/** Preserve ownership when a transport invokes a stream outside our async context. */
export function bindOperation<Args extends unknown[], Result>(
    callback: (...args: Args) => Result,
): (...args: Args) => Result {
    const scope = operations.getStore();
    return (...args) => operations.run(scope, () => callback(...args));
}

/**
 * Whether this process has ever asked for settlement tracking. Latched by
 * {@link engageOperationTracking} and never cleared.
 *
 * Entering an `AsyncLocalStorage` even once installs its context tracking for
 * the whole process. On Node 24 that is `AsyncContextFrame` and costs ~1%, but
 * on the Node 20/22 lines this package supports it is the async_hooks promise
 * hook, measured at roughly +170% on promise traffic that has nothing to do
 * with this client. A library must not impose that on embedders who never use
 * `trackOperation`, so scopes are created only once the feature is in play.
 */
let trackingEngaged = false;

/** Latches scope creation on. Called by `TestRailClientCore.trackOperation`. */
export function engageOperationTracking(): void {
    trackingEngaged = true;
}

/**
 * Re-exposes a rejection that {@link OperationScope.observe} has marked handled.
 * Without this, a caller who awaits only `settled` loses the unhandled-rejection
 * report for a failed callback.
 */
function exposeRejection<T>(result: Promise<T>): Promise<T> {
    return result.then(undefined, (error: unknown) => {
        throw error;
    });
}

/** Invokes `callback` synchronously, converting a synchronous throw. */
function invoke<T>(callback: () => T | PromiseLike<T>, run: (fn: () => Promise<T>) => Promise<T>): Promise<T> {
    try {
        return run(() => Promise.resolve(callback()));
    } catch (error) {
        // Preserve even non-Error callback rejections without changing identity.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(error);
    }
}

/**
 * Starts a scope even without a caller, so later coalesced callers can join it.
 *
 * Until tracking is engaged no scope is created, because nothing can observe
 * one: `observeOperation` is a no-op outside a scope, and a joiner can only
 * exist after someone has called `trackOperation`. Requests already in flight
 * when a process first engages tracking are the one exception — a later joiner
 * can await their result but not their post-result resource cleanup.
 */
export function startOperation<T>(callback: () => T | PromiseLike<T>): OperationHandle<T> {
    if (!trackingEngaged && operations.getStore() === undefined) {
        const result = invoke(callback, (fn) => fn());
        // `settled` marks `result` handled here just as `observe` would, so the
        // caller still needs the re-exposed rejection.
        return {
            result: exposeRejection(result),
            settled: result.then(
                () => undefined,
                () => undefined,
            ),
        };
    }

    const scope = new OperationScope();
    void observeOperation(scope.settled);
    const result = invoke(callback, (fn) => operations.run(scope, fn));
    scope.observe(result);
    scope.release();
    return { result: exposeRejection(result), settled: scope.settled };
}
