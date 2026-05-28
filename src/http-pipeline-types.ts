/* global FormData */

import type { ZodType } from 'zod';
import type { UploadFileInput } from './types.js';
import type { RetryPolicyName } from './retry-policy.js';

/**
 * Internal types for the unified HTTP pipeline (ARCH #1).
 * `RequestSpec` is the public-to-modules surface; everything else is
 * consumed only by `client-core.ts`.
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
 * Full spec for one pipeline execution. The public `request<T>(spec)` method
 * builds this and delegates to `executePipeline()`.
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

/**
 * Outbound body for a `RequestSpec`. JSON bodies serialize via `JSON.stringify`.
 * Multipart bodies stream from a file descriptor or in-memory buffer.
 */
export type RequestBody =
    | { readonly kind: 'json'; readonly data: unknown }
    | { readonly kind: 'multipart'; readonly file: UploadFileInput; readonly filename: string };

/**
 * Public-to-modules description of a single HTTP request. Modules call
 * `TestRailClientCore.request<T>(spec)` instead of the historical
 * `request/requestText/requestBinary/requestMultipart/requestParsed` quintet.
 *
 * Behavioural defaults (preserving the prior API exactly):
 *
 * - GET + `schema`     → cache key `PARSED:GET:{endpoint}`
 * - GET + no schema    → cache key `GET:{endpoint}`
 * - non-GET            → no cache; write invalidates the cache before parse
 * - `responseKind`     → defaults to `'json'`
 * - `retry`            → defaults to `'full'` (the only sensible default for
 *                        JSON and text); binary GETs use `'binaryGet'` and
 *                        multipart uploads use `'none'`
 */
// `T` is a phantom-but-witnessed type parameter — it captures the caller's
// expected return type at `request<T>(spec: RequestSpec<T>): Promise<T>`.
// `schema?` is intentionally untyped (see field doc) so we cannot bind T
// there; `__t?` is a never-emitted brand witness that prevents TS's
// `noUnusedLocals` (TS6133) from rejecting the phantom on the interface.
export interface RequestSpec<T> {
    /** @internal Phantom brand; never set or read. */
    readonly __t?: T;
    readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    readonly endpoint: string;
    readonly body?: RequestBody;
    /**
     * Zod schema for validating the response. When set on a GET, the parsed
     * value is cached under `PARSED:GET:{endpoint}` only after validation
     * succeeds (schema-invalid responses are never cached). When omitted on
     * a GET, the raw body is cached under `GET:{endpoint}`.
     *
     * Typed as untyped `ZodType` (no `<T>` generic) deliberately — Zod 4 +
     * TypeScript `exactOptionalPropertyTypes` make `ZodType<T>` invariant in
     * `T`, which would reject every schema in this codebase (e.g. fields
     * declared `number | null` on the result type but `number | null | undefined`
     * on the Zod-inferred output). The caller's generic `T` is the contract
     * for the parsed return value; we trust the caller to pair the schema
     * with a matching `T` (Zod's structural inference is approximate enough
     * that this is the only practical seam).
     */
    readonly schema?: ZodType;
    /** Default `'json'`. `'text'` returns the raw response body; `'binary'` returns `ArrayBuffer`. */
    readonly responseKind?: 'json' | 'text' | 'binary';
    /** Default `'full'`. Use `'binaryGet'` for binary downloads, `'none'` for uploads. */
    readonly retry?: RetryPolicyName;
}
