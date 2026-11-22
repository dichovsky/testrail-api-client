// This file is a repository example. If you copy it into an application, import
// the SDK from '@dichovsky/testrail-api-client'. Also use the timer limit of the
// application.
import { TestRailClient, TestRailValidationError, CaseFieldSchema } from '../src/index.js';
import type { AddCaseFieldResponse, CaseField, TestRailConfig } from '../src/index.js';
import { MAX_NODE_TIMER_DELAY_MS } from '../src/constants.js';

function pause(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }
        const finish = (): void => {
            clearTimeout(timer);
            signal.removeEventListener('abort', finish);
            resolve();
        };
        const timer = setTimeout(finish, ms);
        signal.addEventListener('abort', finish, { once: true });
    });
}

export interface ReadinessOptions {
    readonly timeoutMs: number;
    readonly initialDelayMs: number;
    readonly maxDelayMs: number;
    readonly maxAttempts: number;
    readonly signal?: AbortSignal;
    /** Validate the intended type, project/template scope, and options. */
    readonly verify: (field: CaseField) => boolean;
}

export type ReadinessResult = {
    /** Always keep the successful POST result, including on cancellation. */
    readonly created: AddCaseFieldResponse;
    readonly attempts: number;
} & (
    | { readonly state: 'ready'; readonly field: CaseField }
    | { readonly state: 'conflict'; readonly field: CaseField }
    | {
          readonly state: 'pending';
          readonly reason:
              | 'deadline'
              | 'cancelled'
              | 'attempt_limit'
              | 'invalid_identity'
              | 'invalid_inventory'
              | 'invalid_config'
              | 'read_failed'
              | 'verification_failed';
      }
);

/**
 * Returns the readiness state of a new case field. The function sends only GET
 * requests. Call it AFTER a successful addCaseField(). The function never
 * creates a field or writes dependent cases. A pending result does not show
 * whether the creation succeeded. `created` stays authoritative.
 */
export async function waitForCaseField(
    config: TestRailConfig,
    created: AddCaseFieldResponse,
    options: ReadinessOptions,
): Promise<ReadinessResult> {
    for (const value of [options.timeoutMs, options.initialDelayMs, options.maxDelayMs, options.maxAttempts]) {
        if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_NODE_TIMER_DELAY_MS) {
            throw new RangeError('Readiness bounds must be positive integers within the Node timer limit.');
        }
    }
    if (options.initialDelayMs > options.maxDelayMs) {
        throw new RangeError('initialDelayMs must not exceed maxDelayMs.');
    }

    let attempts = 0;
    const pending = (reason: Extract<ReadinessResult, { state: 'pending' }>['reason']): ReadinessResult => ({
        state: 'pending',
        created,
        attempts,
        reason,
    });
    if (
        typeof created !== 'object' ||
        created === null ||
        !Number.isSafeInteger(created.id) ||
        created.id <= 0 ||
        typeof created.system_name !== 'string' ||
        !created.system_name.startsWith('custom_')
    ) {
        return pending('invalid_identity');
    }
    if (options.signal?.aborted === true) return pending('cancelled');

    const deadline = new AbortController();
    const deadlineAt = globalThis.performance.now() + options.timeoutMs;
    const expired = (): boolean => deadline.signal.aborted || globalThis.performance.now() >= deadlineAt;
    const stopReason = (): 'deadline' | 'cancelled' => (expired() ? 'deadline' : 'cancelled');
    const timer = setTimeout(() => deadline.abort(), options.timeoutMs);
    const signal = AbortSignal.any(
        options.signal === undefined ? [deadline.signal] : [deadline.signal, options.signal],
    );
    const fetchImpl = config.fetch ?? globalThis.fetch;
    let reader: TestRailClient | undefined;
    let onAbort: (() => void) | undefined;
    try {
        // A dedicated reader prevents cached omissions and never clears the cache
        // of another client. The reader has no automatic retries. Thus,
        // maxAttempts counts actual GET requests.
        reader = new TestRailClient({
            ...config,
            enableCache: false,
            maxRetries: 0,
            registerProcessHandlers: false,
            fetch: (input, init) => {
                if (expired()) deadline.abort();
                signal.throwIfAborted();
                return fetchImpl(input, {
                    ...init,
                    signal: AbortSignal.any(
                        init?.signal === undefined || init.signal === null ? [signal] : [signal, init.signal],
                    ),
                });
            },
        });
        const client = reader;
        const stopped = new Promise<ReadinessResult>((resolve) => {
            onAbort = () => resolve(pending(stopReason()));
            signal.addEventListener('abort', onAbort, { once: true });
        });
        const poll = async (): Promise<ReadinessResult> => {
            let delayMs = options.initialDelayMs;
            while (!signal.aborted && !expired() && attempts < options.maxAttempts) {
                attempts += 1;
                let inventory: unknown;
                try {
                    inventory = await client.metadata.getCaseFields();
                } catch {
                    return pending(signal.aborted || expired() ? stopReason() : 'read_failed');
                }
                if (signal.aborted || expired()) return pending(stopReason());
                // SDK response validation is advisory. Readiness requires a
                // complete array with valid field/configuration shapes.
                const parsed = CaseFieldSchema.array().safeParse(inventory);
                if (signal.aborted || expired()) return pending(stopReason());
                if (!parsed.success) return pending('invalid_inventory');
                const matches = parsed.data.filter(
                    (field) => field.id === created.id || field.system_name === created.system_name,
                );
                const field = matches[0];
                if (field !== undefined) {
                    if (matches.length !== 1 || field.id !== created.id || field.system_name !== created.system_name) {
                        return { state: 'conflict', created, attempts, field };
                    }
                    try {
                        const verified = options.verify(field);
                        if (signal.aborted || expired()) return pending(stopReason());
                        return { state: verified ? 'ready' : 'conflict', created, attempts, field };
                    } catch {
                        return pending(signal.aborted || expired() ? stopReason() : 'verification_failed');
                    }
                }
                if (attempts < options.maxAttempts) {
                    await pause(delayMs, signal);
                    delayMs = Math.min(delayMs * 2, options.maxDelayMs);
                }
            }
            return pending(signal.aborted || expired() ? stopReason() : 'attempt_limit');
        };
        // Also limit a slow custom DNS/fetch implementation that ignores abort.
        // When the implementation settles, poll sees the signal and does no
        // more work.
        return await Promise.race([poll(), stopped]);
    } catch (error) {
        // A configuration rejection occurs before any GET. Keep the creation
        // result, but tell the caller to fix the reader configuration before a
        // retry.
        if (reader === undefined && error instanceof TestRailValidationError) return pending('invalid_config');
        return pending('read_failed');
    } finally {
        clearTimeout(timer);
        if (onAbort !== undefined) signal.removeEventListener('abort', onAbort);
        deadline.abort();
        reader?.destroy();
    }
}
