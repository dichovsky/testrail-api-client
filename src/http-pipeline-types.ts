/* global FormData */

import type { ZodType } from 'zod';
import type { UploadFileInput } from './types.js';
import type { RequestBudget } from './request-budget.js';

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
    | {
          readonly kind: 'formdata';
          readonly build: () => Promise<{ body: FormData; cleanup: () => void }>;
          /**
           * Idempotently release any resource the source holds without having
           * built. The pipeline calls this when a request fails before reaching
           * `build()` — a destroyed client, a rejected host, an already-spent
           * budget — because `cleanup` was never handed out on those paths and
           * the caller's file descriptor would otherwise leak.
           */
          readonly release: () => void;
      };

/**
 * Full spec for one pipeline execution. The public `request<T>(spec)` method
 * builds this and delegates to `executePipeline()`.
 */
export interface PipelineSpec<TParsed> {
    readonly method: string;
    readonly endpoint: string;
    readonly body: BodyShape;
    /**
     * Header/connect/response-wait timeout in ms for this execution. Resolved
     * once in `request<T>()` from `spec.timeout ?? this.timeout`, then applied
     * to the `AbortController` (and its 408 message) for every attempt/retry.
     */
    readonly timeout: number;
    /**
     * Body-read wall-clock deadline in ms for this execution (SEC #21).
     * Resolved from `spec.bodyTimeout ?? this.bodyTimeout` and applied to every
     * response-body read (success and error paths).
     */
    readonly bodyTimeout: number;
    /**
     * Wall-clock allowance for this execution, shared by every retry. Created
     * once in `request<T>()`; see {@link RequestBudget}.
     */
    readonly budget: RequestBudget;
    /**
     * When `true`, the pipeline adds `Content-Type: application/json` to
     * outbound headers. Set `false` for binary GETs and multipart POSTs where
     * the fetch API or response type determines the header.
     */
    readonly sendJsonContentType: boolean;
    readonly retryPolicy: RetryPolicy;
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
 * Declared execution intent for the small set of requests whose handling cannot
 * be derived from their shape.
 *
 * Every other request's retry policy and cacheability follow from `method`,
 * `body.kind` and `responseKind` — see {@link deriveRetryPolicy}. These two
 * cases are genuinely irreducible because they describe what the *endpoint*
 * does, which the request shape cannot express:
 *
 * - `side-effecting-read` — a GET that mutates server state. TestRail's
 *   `run_report` builds a new report and the template may email it, so a 5xx or
 *   network failure leaves an ambiguous outcome that must not be repeated, and
 *   a cached response would hide a generation the caller asked for. Retries 429
 *   only: the rate limiter rejects before execution, so nothing was generated.
 * - `fresh-read` — a GET that must be executed, not served from or published to
 *   the cache. Multi-page aggregation uses it so an aggregate cannot combine
 *   differently aged cached pages or evict unrelated entries.
 *
 * Both replace the former `retry` + `bypassCache` field pair, whose legal
 * combinations were documented rather than enforced.
 */
export type RequestIntent = 'side-effecting-read' | 'fresh-read';

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
 * - retry policy       → **derived**, never declared. See
 *                        {@link deriveRetryPolicy}: a multipart body is
 *                        non-idempotent so it never retries, a binary GET
 *                        retries 5xx/network, everything else gets the full
 *                        policy. `intent` covers the two cases the shape
 *                        cannot express.
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
     * succeeds (schema-invalid responses are never cached). A `page` cache
     * variant uses `PAGE:PARSED:GET:{endpoint}`. When omitted on a GET, the
     * raw body is cached under `GET:{endpoint}`.
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
    /**
     * Declared intent for the two endpoint classes whose handling cannot be
     * derived from the request's shape. Omit it for every ordinary request:
     * the retry policy and cacheability follow from `method`, `body.kind` and
     * `responseKind`. See {@link RequestIntent}.
     */
    readonly intent?: RequestIntent;
    /**
     * @internal Optional validated-cache namespace. Explicit pagination Page
     * reads use `page` so their stricter envelope schema cannot share cached
     * collection-only wrappers with legacy one-response list methods.
     */
    readonly cacheVariant?: 'page';
    /**
     * @internal Absolute aggregate wall-clock deadline. Pagination computes
     * this once before the first page so adapter work cannot silently rebase
     * the duration budget. It clips both request phases without increasing a
     * stricter client/view timeout and is shared by retries.
     */
    readonly deadlineAt?: number;
    /**
     * @internal Per-request override for the connect/send/response-headers
     * timeout, in milliseconds. Set by {@link TestRailClient.withTimeout}
     * (callers use `client.withTimeout(ms)` rather than populating this
     * directly). Falls back to the client-wide `timeout` when omitted.
     */
    readonly timeout?: number;
    /**
     * @internal Per-request override for the body-read deadline, in
     * milliseconds (SEC #21). Set by {@link TestRailClient.withTimeout} so the
     * body deadline tracks the overridden `timeout` (unless the client set
     * `bodyTimeout` explicitly). Falls back to the client-wide `bodyTimeout`.
     */
    readonly bodyTimeout?: number;
}
