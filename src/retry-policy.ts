import type { RetryPolicy } from './http-pipeline-types.js';

/**
 * Full retry policy: 429 for all methods; 5xx + network errors only for GET.
 *
 * Used by `request<T>` and `requestText` — both handle GET and write methods
 * and must not retry writes on 5xx (ambiguous server state).
 */
export function fullRetryPolicy(): RetryPolicy {
    return {
        isStatusRetryable(status: number, method: string): boolean {
            if (status === 429) return true;
            return status >= 500 && method === 'GET';
        },
        isNetworkErrorRetryable(method: string): boolean {
            return method === 'GET';
        },
    };
}

/**
 * Binary-GET retry policy: 429 + 5xx + network errors always retried.
 *
 * Used by `requestBinary` — always issued as GET (attachment download), so
 * all error classes are safe to retry.
 */
export function binaryGetRetryPolicy(): RetryPolicy {
    return {
        isStatusRetryable(status: number): boolean {
            return status === 429 || status >= 500;
        },
        isNetworkErrorRetryable(): boolean {
            return true;
        },
    };
}

/**
 * No-retry policy: nothing is retried.
 *
 * Used by `requestMultipart` — multipart upload is not idempotent and TestRail
 * does not document retry semantics for attachment creation, so zero retries
 * is the safe default.
 */
export function noRetryPolicy(): RetryPolicy {
    return {
        isStatusRetryable(): boolean {
            return false;
        },
        isNetworkErrorRetryable(): boolean {
            return false;
        },
    };
}
