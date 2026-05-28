import type { RetryPolicy } from './http-pipeline-types.js';

/**
 * Full retry policy: 429 for all methods; 5xx + network errors only for GET.
 *
 * Used by the default JSON and text pipelines — both handle GET and write
 * methods and must not retry writes on 5xx (ambiguous server state).
 */
const FULL_RETRY_POLICY: RetryPolicy = {
    isStatusRetryable(status: number, method: string): boolean {
        if (status === 429) return true;
        return status >= 500 && method === 'GET';
    },
    isNetworkErrorRetryable(method: string): boolean {
        return method === 'GET';
    },
};

/**
 * Binary-GET retry policy: 429 + 5xx + network errors always retried.
 *
 * Used by binary downloads (attachments) — always issued as GET, so all error
 * classes are safe to retry.
 */
const BINARY_GET_RETRY_POLICY: RetryPolicy = {
    isStatusRetryable(status: number): boolean {
        return status === 429 || status >= 500;
    },
    isNetworkErrorRetryable(): boolean {
        return true;
    },
};

/**
 * No-retry policy: nothing is retried.
 *
 * Used by multipart uploads — non-idempotent and TestRail does not document
 * retry semantics for attachment creation, so zero retries is the safe default.
 */
const NO_RETRY_POLICY: RetryPolicy = {
    isStatusRetryable(): boolean {
        return false;
    },
    isNetworkErrorRetryable(): boolean {
        return false;
    },
};

/** Named retry policies exposed by `RequestSpec.retry`. */
export type RetryPolicyName = 'full' | 'binaryGet' | 'none';

/**
 * Resolve a named retry policy. Policies are frozen module-level singletons
 * so no allocation happens per request.
 */
export function getRetryPolicy(name: RetryPolicyName): RetryPolicy {
    switch (name) {
        case 'full':
            return FULL_RETRY_POLICY;
        case 'binaryGet':
            return BINARY_GET_RETRY_POLICY;
        case 'none':
            return NO_RETRY_POLICY;
    }
}
