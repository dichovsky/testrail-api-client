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
    private readonly finish: () => void;
    readonly settled: Promise<void>;

    constructor() {
        let finish: () => void = () => undefined;
        this.settled = new Promise<void>((resolve) => {
            finish = resolve;
        });
        this.finish = finish;
    }

    observe(promise: Promise<unknown>): void {
        this.pending += 1;
        // Observe both outcomes without changing the original promise. In
        // particular, losing deadline/cancellation promises may reject late.
        void promise.then(
            () => this.release(),
            () => this.release(),
        );
    }

    release(): void {
        this.pending -= 1;
        if (this.pending === 0) this.finish();
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
    return { result, settled: scope.settled };
}
