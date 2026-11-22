// Retry backoff bounds
export const BASE_RETRY_DELAY_MS = 1000;
export const MAX_RETRY_DELAY_MS = 10000;

/** Maximum allowed request timeout: 5 minutes */
export const MAX_TIMEOUT_MS = 5 * 60 * 1000;

/** HTTP status code for a successful response whose protocol shape is unusable. */
export const HTTP_OK_STATUS = 200;

// TestRailConfig defaults
export const DEFAULT_TIMEOUT_MS = 30000;
export const DEFAULT_MAX_RETRIES = 3;
/** Maximum retry attempts accepted by `TestRailConfig.maxRetries`. */
export const MAX_RETRIES = 10;
export const DEFAULT_CACHE_TTL_MS = 300000; // 5 minutes
export const DEFAULT_CACHE_CLEANUP_INTERVAL_MS = 60000; // 1 minute
/** Number of nested `cause` levels that the client keeps when it copies a custom `fetch` failure onto a TestRailApiError. */
export const MAX_SANITIZED_CAUSE_DEPTH = 4;
/** Maximum delay that Node.js timers accept. A larger delay overflows to a 1 ms delay. */
export const MAX_NODE_TIMER_DELAY_MS = 2_147_483_647;
/**
 * Established constructor-compatible email syntax for TestRail credentials.
 *
 * The pattern anchors the domain dot to the first dot after the leading
 * character, because `[^\s@.]*` cannot consume a dot. Thus, a non-matching
 * candidate has exactly one split to try. The equivalent `[^\s@]+\.[^\s@]+`
 * accepts the same strings but tries each split. For a long run of dots, these
 * tries become a quadratic walk. The walk runs synchronously in the
 * constructor, on a value that the caller supplies.
 */
export const TESTRAIL_CONFIG_EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s@.]*\.[^\s@]+$/;
/**
 * Shape check for the email address of a TestRail user. The
 * `get_user_by_email` lookup and the `add_user` / `update_user` payloads share
 * this check. The pattern requires exactly one '@' and non-empty local and
 * domain parts without whitespace.
 *
 * The pattern intentionally does NOT require a dotted (FQDN) domain. RFC 5321
 * permits single-label domains (admin@localhost, user@corp) and
 * domain-literals (user@[192.168.1.1]). Self-hosted, LDAP, AD, and SSO
 * instances legitimately store such addresses. Thus, these addresses must
 * reach the API, and the client must not reject them (#236). Authoritative
 * format validation is TestRail's responsibility. The credential email above
 * keeps its own, separate syntax.
 */
export const TESTRAIL_USER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
export const DEFAULT_MAX_CACHE_SIZE = 1000;
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

/**
 * Maximum page size accepted by TestRail's paginated/bulk API endpoints.
 *
 * TestRail caps `limit` at 250 server-side and returns HTTP 400 for `limit` of
 * 0 or > 250 (live-audit findings B.30/B.31). `validatePaginationParams`
 * rejects an out-of-range `limit` on the client side. Thus, callers get a clear
 * `TestRailValidationError`, not a server round-trip and an opaque 400.
 */
export const MAX_PAGINATION_LIMIT = 250;

/** Defaults and hard bounds for bounded multi-page aggregation. */
export const DEFAULT_PAGE_SIZE = MAX_PAGINATION_LIMIT;
export const DEFAULT_MAX_PAGES = 100;
export const DEFAULT_MAX_ITEMS = 25_000;
export const DEFAULT_MAX_PAGINATION_DURATION_MS = MAX_TIMEOUT_MS;
export const DEFAULT_MAX_PAGINATION_BYTES = 100 * 1024 * 1024;
export const MAX_PAGINATION_BYTES = 1024 * 1024 * 1024;

/**
 * Per-response byte caps (SEC #12 — unbounded body OOM protection).
 *
 * Each fetch site streams the response body through {@link readBodyWithLimits}.
 * That function aborts when the body exceeds `maxBytes`. Thus, a malicious or
 * misconfigured upstream cannot exhaust the client heap. JSON, text, and
 * multipart-error bodies share the JSON cap. Only `requestBinary` (attachment
 * downloads) gets the larger binary cap.
 *
 * `DEFAULT_MAX_JSON_RESPONSE_BYTES` (10 MiB) is sufficient for the largest
 * realistic `get_cases`/`get_results` response bodies (TestRail returns
 * ~100 KB per 1k cases). Callers with bulk-export workloads override the
 * default through `maxJsonResponseBytes`.
 *
 * `DEFAULT_MAX_BINARY_RESPONSE_BYTES` (100 MiB) is sufficient for typical
 * attachments (screenshots, video clips). Larger attachments require an
 * explicit `maxBinaryResponseBytes` override. They can also cause OOM on
 * small-memory hosts. A separate item tracks stream-to-disk support.
 *
 * `MAX_RESPONSE_BYTES_LIMIT` (1 GiB) is the hard ceiling that the
 * configuration validator accepts. The client rejects any larger value at
 * construction time. Thus, a caller cannot disable the guard with
 * `Number.MAX_SAFE_INTEGER`.
 */
export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_BINARY_RESPONSE_BYTES = 100 * 1024 * 1024;
export const MAX_RESPONSE_BYTES_LIMIT = 1024 * 1024 * 1024;

/**
 * Maximum size in bytes for a --data-file payload (1 MiB).
 *
 * SEC #17: `readFileSync` with no size cap could exhaust memory on a
 * large file. The cap is sufficient for the largest realistic JSON body
 * (bulk case payloads with thousands of cases). The cap also makes OOM
 * impossible.
 */
export const MAX_DATA_FILE_BYTES = 1_048_576;

/**
 * CLI stdin read cap. CTF audit #24: `readFileSync(0, 'utf-8')` reads
 * the entire pipe into memory without a limit. A pipe larger than container
 * memory (typical CI runner: 512 MB–1 GB) OOM-kills the process. On
 * 64-bit hosts, V8 throws RangeError at ~1 GB on strings. A cap of 1 MiB is
 * sufficient for the largest realistic JSON body (bulk case payloads with
 * thousands of cases). The cap also makes OOM impossible.
 *
 * Both the body-stdin path (resolveBody) and the --api-key-stdin path use
 * this cap. A credential is at most a few hundred bytes. The 1 MiB cap is
 * orders of magnitude larger than any sensible API key.
 */
export const MAX_STDIN_BYTES = 1024 * 1024;

/** Maximum number of unique advisory response-schema warnings per CLI run. */
export const MAX_CLI_SCHEMA_MISMATCH_WARNINGS = 10;

/** Hard processing and output bounds for opt-in CLI diagnostic records. */
export const MAX_CLI_DIAGNOSTIC_INPUT_BYTES = 64 * 1024;
export const MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES = 16 * 1024;
export const MAX_CLI_DIAGNOSTIC_CREDENTIAL_CHARS = 4096;
export const MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS = 2048;
export const MAX_CLI_DIAGNOSTIC_NODES = 128;
export const MAX_CLI_DIAGNOSTIC_DEPTH = 6;
export const MAX_CLI_DIAGNOSTIC_DECODE_PASSES = 3;
export const CLI_DIAGNOSTIC_FILE_MODE = 0o600;
export const CLI_DIAGNOSTIC_DIRECTORY_MODE = 0o700;
export const CLI_DIAGNOSTIC_PERMISSION_MASK = 0o777;
/** Deadline to clear inherited macOS ACLs on a diagnostic reservation. */
export const CLI_DIAGNOSTIC_ACL_TIMEOUT_MS = 1000;

/**
 * Multipart form field name TestRail expects for an attachment upload.
 *
 * This name is no longer a cross-module agreement. `src/upload-source.ts` both
 * appends this entry and reads it back from the form. Earlier, a mismatch
 * could leave `ownUploadStreams` with a no-op cleanup. Then `settled` could
 * resolve while the upload was still streaming. The current code cannot
 * express that mismatch. The constant stays exported only so that tests can
 * drive `ownUploadStreams` with a hand-built FormData.
 */
export const MULTIPART_FIELD_NAME = 'attachment';

/**
 * CLI binary stdin upload cap (PR3a — `--file -` sentinel). The text-body
 * `MAX_STDIN_BYTES` is too small for binary attachment uploads (screenshots,
 * videos, log archives). The cap is 100 MiB to match
 * `DEFAULT_MAX_BINARY_RESPONSE_BYTES`. Thus, the upload and download ceilings
 * are symmetric, with an order-of-magnitude headroom below
 * `MAX_RESPONSE_BYTES_LIMIT` (1 GiB). A producer that streams more than this
 * cap is almost certainly a misconfiguration (wrong pipe, unbounded `tail -f`,
 * or a DoS attempt). The read fails fast in that case.
 *
 * This cap is a hard ceiling. It is not configurable through TestRailConfig,
 * because the cap prevents process OOM at the CLI layer. The cap is not a
 * throttle for the API. Callers who legitimately need to upload more should
 * split the file or use the upcoming streaming-upload path (BACKLOG:
 * `streaming upload for large files`).
 */
export const MAX_STDIN_UPLOAD_BYTES = 100 * 1024 * 1024;

/**
 * CLI stdin wall-clock deadline for the `--file -` binary upload (PR3a;
 * SEC #24 partial mitigation). The byte cap (`MAX_STDIN_UPLOAD_BYTES`)
 * prevents memory exhaustion. But a producer can hold the pipe open and never
 * send more than the cap, for example a stalled `curl`, `tail -f`, or an
 * unclosed FIFO. Without a deadline, such a producer would leave the CLI
 * blocked on stdin indefinitely.
 *
 * The value of 30 seconds matches `DEFAULT_TIMEOUT_MS`. Thus, a stdin-piped
 * upload stops within the same time limit as a network request. The reader
 * uses `AbortController`, not a polling loop. Thus, the wait is non-blocking,
 * and cancellation propagates cleanly through `for await (chunk of stdin)`.
 */
export const STDIN_READ_TIMEOUT_MS = 30000;

/** The standard-input file descriptor. */
export const STDIN_FD = 0;

/**
 * Pause between attempts when a synchronous text read of stdin reports
 * `EAGAIN` (a non-blocking descriptor with no data yet). The retries stop at
 * `STDIN_READ_TIMEOUT_MS`.
 */
export const STDIN_RETRY_INTERVAL_MS = 10;

/**
 * Indent width (in spaces) for the CLI YAML renderer. Two-space indent is the
 * usual standard in major YAML packages (PyYAML, js-yaml, ruamel). It also
 * matches the project's prettier configuration for JSON output. The constant
 * is in this file so that the renderer does not have a hardcoded literal.
 */
export const YAML_INDENT_SPACES = 2;

/** Idle socket lifetime for the DNS-pinned native-fetch transport pool. */
export const DEFAULT_TRANSPORT_IDLE_TIMEOUT_MS = 5_000;
