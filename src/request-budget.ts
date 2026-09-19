import { TestRailApiError } from './errors.js';
import { bindOperation, observeOperation } from './operation-tracking.js';
import { sleep } from './utils.js';

/**
 * The wall-clock allowance for one `request<T>()` call, and everything that
 * follows from it.
 *
 * "How long may this take" used to be four spec fields — `timeout`,
 * `bodyTimeout`, `deadlineAt`, `remainingTimeMs` — plus arithmetic inlined at
 * ~36 sites in `client-core.ts`, with the same 408 constructed six separate
 * times and the header-phase allowance re-derived in both the happy path and
 * the catch. None of it was a module, so answering "what deadline does *this*
 * body read get?" meant reading two unrelated places.
 *
 * A budget is created once per call and asked questions. It owns absolute
 * time, the split between the header phase and the body phase, clipping a
 * configured timeout down to what is left, racing a promise against expiry,
 * waiting between retries, and the `408` it raises when the allowance is gone.
 * Retries share the budget, so time already spent is never refunded.
 *
 * An **unbounded** budget (no aggregate deadline) answers every question with
 * the caller's configured value and never raises. That is the ordinary
 * single-request case; only multi-page aggregation supplies a deadline.
 */
export interface RequestBudget {
    /** True when an aggregate deadline applies. Unbounded budgets never expire. */
    readonly bounded: boolean;

    /** True when the allowance is already gone. Always false when unbounded. */
    readonly expired: boolean;

    /**
     * Whether the allowance was already gone at `instant`. Lets a caller that
     * has captured a timestamp judge several things against that one reading
     * rather than re-sampling the clock per check.
     */
    expiredBy(instant: number): boolean;

    /**
     * What remains for a phase the caller would otherwise bound by
     * `configuredMs`, never lengthening a stricter configured value. `0` means
     * "the caller set no limit", so the whole remaining allowance is returned.
     *
     * @throws {TestRailApiError} 408 when the allowance is already gone.
     */
    allowanceFor(configuredMs: number): number;

    /**
     * Race `promise` against expiry. Rejects with 408 if the budget runs out
     * first, invoking `onExpiry` so the caller can abort the losing work. The
     * promise is observed for operation tracking either way.
     */
    bound<T>(promise: Promise<T>, onExpiry?: () => void): Promise<T>;

    /** Wait `delayMs` between retries without outliving the budget. */
    delay(delayMs: number): Promise<void>;
}

const AGGREGATE_EXPIRED = 'Aggregate request deadline exceeded';

/**
 * Marks an error as this module's own. Not derived from `status` or
 * `statusText`: `statusText` is the server's reason phrase, so a 408 whose
 * phrase happened to match would otherwise be mistaken for the caller's own
 * deadline. A module-private symbol cannot arrive over the wire.
 */
const BUDGET_EXPIRY = Symbol('requestBudget.expired');

/**
 * Raised whenever the allowance is gone. One construction site — including the
 * two in `client-core.ts`, which ask a budget whether it expired and then need
 * the error that answer implies.
 */
export function budgetExpiredError(): TestRailApiError {
    const error = new TestRailApiError(408, AGGREGATE_EXPIRED);
    Object.defineProperty(error, BUDGET_EXPIRY, { value: true, enumerable: false });
    return error;
}

/**
 * Whether `error` is this module reporting that a budget ran out.
 *
 * Exists so a caller that supplied the deadline can recognise the resulting
 * failure as its own, instead of re-deriving "did we expire?" by reading a
 * clock. Those two answers disagree: `bound()` schedules `setTimeout` against
 * the deadline, and Node timers may fire up to a millisecond EARLY relative to
 * `Date.now()`, so a caller re-checking the wall clock can be told the deadline
 * has not passed by the very rejection announcing that it has.
 */
export function isBudgetExpiry(error: unknown): boolean {
    return typeof error === 'object' && error !== null && BUDGET_EXPIRY in error;
}

export interface RequestBudgetOptions {
    /**
     * Absolute wall-clock instant the allowance runs out. Omit for an
     * unbounded budget.
     */
    readonly deadlineAt?: number | undefined;
    /** Injected for tests; defaults to `Date.now`. */
    readonly now?: () => number;
}

export function createRequestBudget({ deadlineAt, now = Date.now }: RequestBudgetOptions = {}): RequestBudget {
    if (deadlineAt === undefined) {
        return {
            bounded: false,
            expired: false,
            expiredBy: () => false,
            allowanceFor: (configuredMs) => configuredMs,
            bound: <T>(promise: Promise<T>): Promise<T> => {
                void observeOperation(promise);
                return promise;
            },
            delay: (delayMs) => observeOperation(sleep(delayMs)),
        };
    }

    // `Math.ceil` so a sub-millisecond remainder still counts as time left,
    // matching the behaviour every call site relied on before.
    const remaining = (): number => Math.ceil(deadlineAt - now());

    const bound = <T>(promise: Promise<T>, onExpiry?: () => void): Promise<T> => {
        void observeOperation(promise);
        const left = remaining();
        if (left <= 0) {
            // The caller has already created the losing operation. Attach a
            // rejection handler before cancelling so an immediate abort cannot
            // surface as an unhandled rejection.
            void promise.catch(() => undefined);
            onExpiry?.();
            return Promise.reject(budgetExpiredError());
        }

        // Definitely-assigned: the `Promise` executor runs synchronously, so
        // the timer exists before `race` is reached. The older spelling guarded
        // this with `timeoutId !== undefined`, an unfalsifiable branch that
        // still cost coverage against the repo's 98% branch floor.
        let timeoutId!: ReturnType<typeof setTimeout>;
        const expiry = new Promise<never>((_resolve, reject) => {
            timeoutId = setTimeout(
                bindOperation(() => {
                    reject(budgetExpiredError());
                    onExpiry?.();
                }),
                left,
            );
        });
        return Promise.race([promise, expiry]).finally(() => {
            clearTimeout(timeoutId);
        });
    };

    return {
        bounded: true,
        get expired(): boolean {
            return remaining() <= 0;
        },
        expiredBy: (instant) => instant >= deadlineAt,
        allowanceFor: (configuredMs) => {
            const left = remaining();
            if (left <= 0) throw budgetExpiredError();
            return configuredMs === 0 ? left : Math.min(configuredMs, left);
        },
        bound,
        delay: (delayMs) => {
            const controller = new AbortController();
            return bound(sleep(delayMs, controller.signal), () => {
                controller.abort();
            });
        },
    };
}
