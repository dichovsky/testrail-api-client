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
