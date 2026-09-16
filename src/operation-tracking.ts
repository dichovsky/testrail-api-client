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

/** Starts a scope even without a caller, so later coalesced callers can join it. */
export function startOperation<T>(callback: () => T | PromiseLike<T>): OperationHandle<T> {
    const scope = new OperationScope();
    void observeOperation(scope.settled);
    let result: Promise<T>;
    try {
        result = operations.run(scope, () => Promise.resolve(callback()));
    } catch (error) {
        // Preserve even non-Error callback rejections without changing identity.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        result = Promise.reject(error);
    }
    scope.observe(result);
    scope.release();
    // `observe` attaches a rejection handler to `result`, which would otherwise
    // mark it handled and silence Node's unhandled-rejection report for a
    // caller that awaits only `settled`. Hand out a derived promise instead: it
    // carries the same value and the same rejection reason, and is itself
    // unhandled — and therefore still reported — when the caller ignores it.
    const exposed = result.then(undefined, (error: unknown) => {
        throw error;
    });
    return { result: exposed, settled: scope.settled };
}
