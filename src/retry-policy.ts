import type { RequestBody, RequestIntent, RetryPolicy } from './http-pipeline-types.js';

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
 * Rate-limit-only retry policy: 429 is retried, nothing else is.
 *
 * Used by report generation. A `run_report` GET is side-effecting — TestRail
 * builds a new report and the template may email it — so a 5xx or a network
 * failure leaves an ambiguous outcome that must not be repeated. A 429 is not
 * ambiguous: the rate limiter rejects the request before execution, so no
 * report was generated and no mail was sent. That makes it the one status here
 * that is provably safe to retry, and the only one carrying `Retry-After`.
 */
const RATE_LIMIT_RETRY_POLICY: RetryPolicy = {
    isStatusRetryable(status: number): boolean {
        return status === 429;
    },
    isNetworkErrorRetryable(): boolean {
        return false;
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

/** Internal names for the four policies above. Not part of any request spec. */
export type RetryPolicyName = 'full' | 'binaryGet' | 'rateLimitOnly' | 'none';

/**
 * The facts a request's retry policy is derived from. Deliberately not the
 * whole `RequestSpec`: these three are the only inputs, and naming them keeps
 * the derivation a pure function testable without constructing a client.
 */
export interface RetryDerivationInput {
    /** `undefined` when the request carries no body (GET, bodyless DELETE). */
    readonly bodyKind?: RequestBody['kind'] | undefined;
    readonly responseKind: 'json' | 'text' | 'binary';
    readonly intent?: RequestIntent | undefined;
}

/**
 * Select the retry policy for a request from its shape.
 *
 * This is the half that used to be a caller-declared `retry` field, hand-typed
 * at six upload call sites with nothing enforcing the pairing: a multipart POST
 * that omitted it inherited `'full'` and retried 429, duplicating the upload.
 * Deriving it makes that combination unspellable, and covers upload endpoints
 * that do not exist yet.
 *
 * Order matters, and multipart outranks everything: a non-idempotent body is a
 * fact about the bytes already on the wire, which no statement about the
 * endpoint can soften. Checking `intent` first would let
 * `{ bodyKind: 'multipart', intent: 'side-effecting-read' }` resolve to the
 * rate-limit policy and retry a 429 — reintroducing, through the one field this
 * function adds, exactly the duplicate upload it exists to prevent. No call site
 * spells that combination today; the ordering is what keeps it harmless if one
 * ever does.
 */
export function deriveRetryPolicy(input: RetryDerivationInput): RetryPolicy {
    if (input.bodyKind === 'multipart') return NO_RETRY_POLICY;
    if (input.intent === 'side-effecting-read') return RATE_LIMIT_RETRY_POLICY;
    if (input.responseKind === 'binary') return BINARY_GET_RETRY_POLICY;
    return FULL_RETRY_POLICY;
}

/**
 * Resolve a named retry policy. Policies are frozen module-level singletons
 * so no allocation happens per request.
 *
 * Production no longer calls this — `request()` goes through
 * {@link deriveRetryPolicy}. It survives as the reference oracle for
 * `tests/retry-policy.test.ts`, which characterizes each policy exhaustively,
 * and for the identity assertions in `tests/retry-derivation.test.ts` that pin
 * each derived shape to the singleton its call site used to declare by name.
 * Keep the two tied together: a derivation that stopped matching the named
 * policy would otherwise pass both suites.
 */
export function getRetryPolicy(name: RetryPolicyName): RetryPolicy {
    switch (name) {
        case 'full':
            return FULL_RETRY_POLICY;
        case 'binaryGet':
            return BINARY_GET_RETRY_POLICY;
        case 'rateLimitOnly':
            return RATE_LIMIT_RETRY_POLICY;
        case 'none':
            return NO_RETRY_POLICY;
    }
}
