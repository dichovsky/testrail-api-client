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
export const DEFAULT_DNS_VALIDATION_MAX_WAIT_MS = 2000;
