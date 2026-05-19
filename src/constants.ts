// Retry backoff bounds
export const BASE_RETRY_DELAY_MS = 1000;
export const MAX_RETRY_DELAY_MS = 10000;

/** Maximum allowed request timeout: 5 minutes */
export const MAX_TIMEOUT_MS = 5 * 60 * 1000;

// TestRailConfig defaults
export const DEFAULT_TIMEOUT_MS = 30000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_CACHE_TTL_MS = 300000; // 5 minutes
export const DEFAULT_CACHE_CLEANUP_INTERVAL_MS = 60000; // 1 minute
export const DEFAULT_MAX_CACHE_SIZE = 1000;
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

/**
 * Per-response byte caps (SEC #12 — unbounded body OOM protection).
 *
 * Every fetch site streams the response body through {@link readBodyWithLimits}
 * which aborts once `maxBytes` is exceeded so a malicious or misconfigured
 * upstream cannot exhaust client heap. JSON/text/multipart-error bodies share
 * the JSON cap; only `requestBinary` (attachment downloads) gets the larger
 * binary cap.
 *
 * `DEFAULT_MAX_JSON_RESPONSE_BYTES` (10 MiB) covers the largest realistic
 * `get_cases`/`get_results` payloads (TestRail returns ~100 KB per 1k cases).
 * Callers with bulk-export workloads override via `maxJsonResponseBytes`.
 *
 * `DEFAULT_MAX_BINARY_RESPONSE_BYTES` (100 MiB) covers typical attachments
 * (screenshots, video clips). Larger attachments require an explicit
 * `maxBinaryResponseBytes` override and risk OOM on small-memory hosts —
 * stream-to-disk is tracked as a separate item.
 *
 * `MAX_RESPONSE_BYTES_LIMIT` (1 GiB) is the hard ceiling accepted by the
 * config validator; anything larger is rejected at construction time so a
 * caller cannot disable the guard by passing `Number.MAX_SAFE_INTEGER`.
 */
export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_BINARY_RESPONSE_BYTES = 100 * 1024 * 1024;
export const MAX_RESPONSE_BYTES_LIMIT = 1024 * 1024 * 1024;

/**
 * Wall-clock deadline applied to the response-body read (SEC #21 — slowloris-on-body).
 *
 * Before this cap, the request timeout was cleared as soon as response headers
 * arrived. An attacker (or a buggy intermediary) could then dribble the body
 * one byte at a time indefinitely while holding the socket open. The body
 * read now runs against `bodyTimeout` (default: same as `timeout`).
 *
 * `undefined` here means "fall back to `config.timeout`"; explicit `0` means
 * "no body deadline" (only the byte cap protects). Most callers want the
 * default.
 */
export const DEFAULT_BODY_TIMEOUT_MS: number | undefined = undefined;

/**
 * CLI stdin read cap. CTF audit #24: `readFileSync(0, 'utf-8')` reads
 * the entire pipe into memory unbounded. A pipe larger than container
 * memory (typical CI runner: 512 MB–1 GB) OOM-kills the process; on
 * 64-bit hosts V8 throws RangeError at ~1 GB on strings. 1 MiB covers
 * the largest realistic JSON body (bulk case payloads with thousands
 * of cases) while making OOM impossible.
 *
 * Used by both the body-stdin path (resolveBody) and the --api-key-stdin
 * path (a credential is at most a few hundred bytes; the 1 MiB cap is
 * orders of magnitude beyond any sensible API key).
 */
export const MAX_STDIN_BYTES = 1024 * 1024;

/**
 * CLI binary stdin upload cap (PR3a — `--file -` sentinel). The text-body
 * `MAX_STDIN_BYTES` is too small for binary attachment uploads (screenshots,
 * videos, log archives). Sized at 100 MiB to match
 * `DEFAULT_MAX_BINARY_RESPONSE_BYTES`: symmetric upload/download ceilings and
 * an order-of-magnitude headroom below `MAX_RESPONSE_BYTES_LIMIT` (1 GiB).
 * A producer streaming more than this is almost certainly a misconfiguration
 * (wrong pipe, unbounded `tail -f`, or a DoS attempt); fail fast.
 *
 * Hard ceiling — not configurable via TestRailConfig because the cap exists
 * to prevent process OOM at the CLI layer, not to throttle the API. Callers
 * who legitimately need to upload more should split the file or use the
 * upcoming streaming-upload path (BACKLOG: `streaming upload for large files`).
 */
export const MAX_STDIN_UPLOAD_BYTES = 100 * 1024 * 1024;

/**
 * CLI stdin wall-clock deadline for the `--file -` binary upload (PR3a;
 * SEC #24 partial mitigation). The byte cap (`MAX_STDIN_UPLOAD_BYTES`)
 * defends against memory exhaustion, but a producer that holds the pipe
 * open without ever sending more than the cap (a stalled `curl`, `tail -f`,
 * an unclosed FIFO) would leave the CLI blocked on stdin indefinitely.
 *
 * 30 seconds matches `DEFAULT_TIMEOUT_MS` so a stdin-piped upload terminates
 * within the same envelope as a network request. The reader uses
 * `AbortController` rather than a polling loop so the wait is non-blocking
 * and cancellation propagates cleanly through `for await (chunk of stdin)`.
 */
export const STDIN_READ_TIMEOUT_MS = 30000;
