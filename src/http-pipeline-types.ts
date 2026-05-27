/* global FormData */

/**
 * Internal types for the unified HTTP pipeline (ARCH #1).
 * Not re-exported from src/index.ts — consumed only by client-core.ts.
 */

/** Policy that classifies a (status, method) pair as retryable or not. */
export interface RetryPolicy {
    /** True if this HTTP status code is retryable for the given method. */
    isStatusRetryable(status: number, method: string): boolean;
    /** True if a thrown network TypeError is retryable for the given method. */
    isNetworkErrorRetryable(method: string): boolean;
}

/**
 * Shape of the outbound request body.
 *
 * - `none`     — no body (GET, DELETE with no payload)
 * - `json`     — `JSON.stringify(data)` with `Content-Type: application/json`
 * - `formdata` — async builder returns `{ body, cleanup }`; caller owns cleanup
 */
export type BodyShape =
    | { readonly kind: 'none' }
    | { readonly kind: 'json'; readonly data: unknown }
    | { readonly kind: 'formdata'; readonly build: () => Promise<{ body: FormData; cleanup: () => void }> };

/**
 * Cache participation for a pipeline invocation.
 *
 * - `key === undefined` disables both read and write.
 * - `skipRead === true` bypasses the cache-read and coalesce check but still
 *   allows a cache-write on success. Used on retry to avoid a deadlock where
 *   the retry looks up `pendingRequests` and finds the still-pending parent.
 */
export interface CachePolicy {
    readonly key: string | undefined;
    readonly skipRead: boolean;
}

/**
 * Full spec for one pipeline execution. The public request methods build this
 * and delegate to `executePipeline()`.
 */
export interface PipelineSpec<TParsed> {
    readonly method: string;
    readonly endpoint: string;
    readonly body: BodyShape;
    /**
     * When `true`, the pipeline adds `Content-Type: application/json` to
     * outbound headers. Set `false` for binary GETs and multipart POSTs where
     * the fetch API or response type determines the header.
     */
    readonly sendJsonContentType: boolean;
    readonly retryPolicy: RetryPolicy;
    readonly cache: CachePolicy;
    /** Parses the successful Response body into the caller's return type. */
    parseSuccess(response: Response): Promise<TParsed>;
    /**
     * Optional hook fired immediately after a successful response is received
     * but before `parseSuccess()`. Used to invalidate the GET cache on writes.
     */
    onSuccessBeforeParse?(): void;
}
