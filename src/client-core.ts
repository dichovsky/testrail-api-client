import type { TestRailConfig, CacheEntry } from './types.js';
import { base64Encode, sleep } from './utils.js';
import { TestRailApiError, TestRailValidationError } from './errors.js';
import {
    BASE_RETRY_DELAY_MS,
    MAX_RETRY_DELAY_MS,
    MAX_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_MAX_RETRIES,
    DEFAULT_CACHE_TTL_MS,
    DEFAULT_CACHE_CLEANUP_INTERVAL_MS,
    DEFAULT_MAX_CACHE_SIZE,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_WINDOW_MS,
} from './constants.js';

// VULN-03: Reject loopback, link-local, and private-range hosts to prevent SSRF.
// All requests carry a full Authorization header, making the client a credentialed
// probe for internal services when baseUrl is attacker-controlled.
// NOTE: This check is purely syntactic (regex on the hostname string). It does NOT
// resolve DNS, so a public-looking hostname that resolves to a private IP, or a
// DNS-rebinding attack, can still bypass this protection. For full SSRF prevention
// use a network-level egress filter or a proxy that validates resolved addresses.
const PRIVATE_HOST_PATTERNS: RegExp[] = [
    /^localhost\.?$/i, // matches "localhost" with or without trailing dot
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fe80:/i, // IPv6 link-local (fe80::/10)
    /^f[cd][0-9a-f]{2}:/i, // IPv6 unique-local (fc00::/7 covers fc** and fd**)
    /^0\./,
];

function validatePublicHost(hostname: string): void {
    // Strip enclosing brackets from IPv6 literals (e.g. "[::1]" → "::1")
    const bare = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
    for (const pattern of PRIVATE_HOST_PATTERNS) {
        if (pattern.test(bare)) {
            throw new TestRailValidationError(
                `baseUrl resolves to a private/loopback host ("${hostname}"). ` +
                    'Set allowPrivateHosts: true to allow on-premise deployments.',
            );
        }
    }
}

const activeClients = new Set<TestRailClientCore>();
let processHandlersRegistered = false;

// Synchronous-only cleanup — safe to call on process exit
function cleanupAllClients(): void {
    for (const client of activeClients) {
        client.destroy();
    }
}

function registerProcessHandlers(): void {
    if (processHandlersRegistered) {
        return;
    }

    if (typeof process !== 'undefined' && typeof process.on === 'function') {
        process.on('exit', cleanupAllClients);
        process.on('SIGINT', () => {
            cleanupAllClients();
            process.exit(130);
        });
        process.on('SIGTERM', () => {
            cleanupAllClients();
            process.exit(143);
        });
        processHandlersRegistered = true;
    }
}

/**
 * HTTP pipeline, caching, rate limiting, retry logic, and lifecycle management.
 * Extended by {@link TestRailClient} which adds all API endpoint methods.
 */
export class TestRailClientCore {
    private readonly baseUrl: string;
    // VULN-04: Declared non-readonly so it can be zeroed in destroy() to reduce
    // the window during which the credential is recoverable from a heap dump.
    private auth: string;
    private readonly timeout: number;
    private readonly maxRetries: number;
    private readonly enableCache: boolean;
    private readonly cacheTtl: number;
    private readonly cacheCleanupInterval: number;
    private readonly maxCacheSize: number;
    private readonly cache = new Map<string, CacheEntry<unknown>>();
    private cacheCleanupTimer: ReturnType<typeof setInterval> | undefined;
    private readonly rateLimiter: { maxRequests: number; windowMs: number; requests: number[] };
    private isDestroyed = false;

    constructor(config: TestRailConfig) {
        this.validateConfig(config);
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.auth = base64Encode(`${config.email}:${config.apiKey}`);
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
        this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.enableCache = config.enableCache ?? true;
        this.cacheTtl = config.cacheTtl ?? DEFAULT_CACHE_TTL_MS;
        this.cacheCleanupInterval = config.cacheCleanupInterval ?? DEFAULT_CACHE_CLEANUP_INTERVAL_MS;
        // VULN-07: maxCacheSize=0 means unbounded and risks memory exhaustion.
        // Warn at construction time so callers are aware of the risk.
        if (config.maxCacheSize === 0 && (config.enableCache ?? true)) {
            // eslint-disable-next-line no-console
            console.warn(
                'Warning: maxCacheSize is set to 0 (unlimited). ' +
                    'This can cause unbounded memory growth. Consider setting a positive limit.',
            );
        }
        this.maxCacheSize = config.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE;
        this.rateLimiter = {
            maxRequests: config.rateLimiter?.maxRequests ?? DEFAULT_RATE_LIMIT_MAX_REQUESTS,
            windowMs: config.rateLimiter?.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS,
            requests: [],
        };

        // Register this instance for automatic cleanup
        activeClients.add(this);
        registerProcessHandlers();

        // Start periodic cache cleanup if enabled
        if (this.enableCache && this.cacheCleanupInterval > 0) {
            this.startCacheCleanup();
        }
    }

    private validateConfig(config: TestRailConfig): void {
        if (!config.baseUrl || typeof config.baseUrl !== 'string') {
            throw new TestRailValidationError('baseUrl is required and must be a string');
        }

        if (!config.email || typeof config.email !== 'string') {
            throw new TestRailValidationError('email is required and must be a string');
        }

        if (!config.apiKey || typeof config.apiKey !== 'string') {
            throw new TestRailValidationError('apiKey is required and must be a string');
        }

        // Validate URL format
        try {
            const url = new URL(config.baseUrl);
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new TestRailValidationError('baseUrl must use http or https protocol');
            }

            // VULN-01: Block HTTP unless explicitly opted in — Basic auth credentials are base64
            // only; any network observer can decode them from a cleartext HTTP request.
            if (url.protocol === 'http:' && config.allowInsecure !== true) {
                throw new TestRailValidationError(
                    'baseUrl must use HTTPS. HTTP sends credentials in cleartext. ' +
                        'Set allowInsecure: true only in isolated development environments.',
                );
            }

            // VULN-03: Block SSRF targets (loopback, link-local, private ranges) unless
            // the caller explicitly opts in for on-premise/private-network deployments.
            if (config.allowPrivateHosts !== true) {
                validatePublicHost(url.hostname);
            }
        } catch (err) {
            if (err instanceof TestRailValidationError) {
                throw err;
            }
            throw new TestRailValidationError('baseUrl must be a valid URL');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(config.email)) {
            throw new TestRailValidationError('email must be a valid email address');
        }

        // Validate timeout if provided
        if (config.timeout !== undefined) {
            if (typeof config.timeout !== 'number' || config.timeout <= 0 || config.timeout > MAX_TIMEOUT_MS) {
                throw new TestRailValidationError('timeout must be a positive number not exceeding 5 minutes');
            }
        }

        // Validate maxRetries if provided
        if (config.maxRetries !== undefined) {
            if (typeof config.maxRetries !== 'number' || config.maxRetries < 0 || config.maxRetries > 10) {
                throw new TestRailValidationError('maxRetries must be a number between 0 and 10');
            }
        }

        // Validate maxCacheSize if provided
        if (config.maxCacheSize !== undefined) {
            if (
                typeof config.maxCacheSize !== 'number' ||
                !Number.isInteger(config.maxCacheSize) ||
                config.maxCacheSize < 0
            ) {
                throw new TestRailValidationError('maxCacheSize must be a non-negative integer');
            }
        }

        // VULN-06: Validate rateLimiter config values.
        // Zero or negative maxRequests silently disables or inverts limiting.
        // Zero or negative windowMs makes the window always empty, disabling limiting.
        if (config.rateLimiter !== undefined) {
            if (config.rateLimiter === null || typeof config.rateLimiter !== 'object') {
                throw new TestRailValidationError('rateLimiter must be an object with maxRequests and windowMs');
            }
            if (
                typeof config.rateLimiter.maxRequests !== 'number' ||
                !Number.isInteger(config.rateLimiter.maxRequests) ||
                config.rateLimiter.maxRequests < 1
            ) {
                throw new TestRailValidationError('rateLimiter.maxRequests must be a positive integer');
            }
            if (
                typeof config.rateLimiter.windowMs !== 'number' ||
                !Number.isInteger(config.rateLimiter.windowMs) ||
                config.rateLimiter.windowMs < 1
            ) {
                throw new TestRailValidationError('rateLimiter.windowMs must be a positive integer');
            }
        }
    }

    private getRetryDelay(retryCount: number): number {
        return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS);
    }

    /**
     * Parses the Retry-After header value to milliseconds
     *
     * @param response - The HTTP response containing the Retry-After header
     * @returns The delay in milliseconds, or null if header is absent or invalid
     */
    private parseRetryAfterMs(response: Response): number | null {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter === null || retryAfter === '') {
            return null;
        }

        // Try parsing as seconds (numeric value)
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds) && seconds > 0) {
            // VULN-02: Cap server-supplied delay to MAX_RETRY_DELAY_MS to prevent a
            // malicious/compromised server from freezing the client indefinitely.
            return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
        }

        // Try parsing as HTTP-date format
        const date = new Date(retryAfter);
        if (!isNaN(date.getTime())) {
            const delayMs = date.getTime() - Date.now();
            // VULN-02: Same cap applied to HTTP-date format.
            return delayMs > 0 ? Math.min(delayMs, MAX_RETRY_DELAY_MS) : null;
        }

        return null; // Invalid format
    }

    /** Sliding window rate limiter. @throws {TestRailApiError} when limit exceeded */
    private checkRateLimit(): void {
        const now = Date.now();
        const windowStart = now - this.rateLimiter.windowMs;

        // Clean old requests outside the window
        this.rateLimiter.requests = this.rateLimiter.requests.filter((time) => time > windowStart);

        if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
            const oldestRequest = Math.min(...this.rateLimiter.requests);
            const waitTime = oldestRequest + this.rateLimiter.windowMs - now;
            throw new TestRailApiError(
                `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`,
            );
        }

        this.rateLimiter.requests.push(now);
    }

    /**
     * Validates that an ID is a positive integer.
     * @throws {TestRailValidationError} When ID is invalid
     */
    protected validateId(id: number, name: string): void {
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new TestRailValidationError(`${name} must be a positive integer`);
        }
    }

    /**
     * Validates that a string entry ID is non-empty.
     * @throws {TestRailValidationError} When entryId is not a non-empty string
     */
    protected validateEntryId(entryId: string): void {
        if (typeof entryId !== 'string' || entryId.trim() === '') {
            throw new TestRailValidationError('entryId must be a non-empty string');
        }
    }

    /**
     * Validates optional pagination parameters.
     * @throws {TestRailValidationError} When limit is not a positive integer or offset is not a non-negative integer
     */
    protected validatePaginationParams(limit?: number, offset?: number): void {
        if (limit !== undefined) {
            if (typeof limit !== 'number' || !Number.isInteger(limit) || limit <= 0) {
                throw new TestRailValidationError('limit must be a positive integer');
            }
        }
        if (offset !== undefined) {
            if (typeof offset !== 'number' || !Number.isInteger(offset) || offset < 0) {
                throw new TestRailValidationError('offset must be a non-negative integer');
            }
        }
    }

    /**
     * Builds a TestRail endpoint URL with optional query parameters.
     * Appends params using `&key=value` (TestRail URL quirk — uses `&`, not `?`).
     * Keys and values are automatically percent-encoded via `encodeURIComponent`.
     * Do NOT pre-encode values before passing them; doing so will cause double-encoding.
     */
    protected buildEndpoint(base: string, params: Record<string, string | number | undefined> = {}): string {
        const parts: string[] = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                // VULN-05: Encode values to prevent parameter injection via string values
                // containing `&`, `=`, or `#`.
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
            }
        }
        return parts.length > 0 ? `${base}&${parts.join('&')}` : base;
    }

    private getCachedData<T>(cacheKey: string): T | undefined {
        if (!this.enableCache) {
            return undefined;
        }

        const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
        if (entry !== undefined && entry.expiry > Date.now()) {
            // Move to end to mark as recently used (LRU behavior)
            this.cache.delete(cacheKey);
            this.cache.set(cacheKey, entry);
            return entry.data;
        }

        // Clean expired entry
        if (entry !== undefined) {
            this.cache.delete(cacheKey);
        }

        return undefined;
    }

    private setCachedData<T>(cacheKey: string, data: T): void {
        if (!this.enableCache) {
            return;
        }

        // Enforce cache size limit if not zero
        if (this.maxCacheSize > 0 && this.cache.size >= this.maxCacheSize) {
            // Map preserves insertion order; first key is the oldest (LRU eviction)
            // Cache is non-empty here (size >= maxCacheSize > 0), so next().value is always defined
            const oldestKey = this.cache.keys().next().value as string;
            this.cache.delete(oldestKey);
        }

        this.cache.set(cacheKey, {
            data,
            expiry: Date.now() + this.cacheTtl,
        });
    }

    /**
     * Clears the entire cache.
     */
    public clearCache(): void {
        this.cache.clear();
    }

    private startCacheCleanup(): void {
        this.cacheCleanupTimer = setInterval(() => {
            this.cleanupExpiredCache();
        }, this.cacheCleanupInterval);

        // When cache cleanup is enabled (enableCache is true and cacheCleanupInterval > 0),
        // ensure this timer doesn't prevent process exit in Node.js; the unref check keeps
        // compatibility with non-Node.js environments where unref may not exist.
        this.cacheCleanupTimer.unref?.();
    }

    private stopCacheCleanup(): void {
        if (this.cacheCleanupTimer !== undefined) {
            clearInterval(this.cacheCleanupTimer);
            this.cacheCleanupTimer = undefined;
        }
    }

    private cleanupExpiredCache(): void {
        const now = Date.now();

        // Collect keys of expired entries first to avoid mutating the Map
        // while iterating over its live iterator.
        const keysToDelete: string[] = [];
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry <= now) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
    }

    /**
     * Releases all resources held by this client instance.
     * Stops the cache cleanup timer, clears the cache, and removes this instance
     * from the active-clients registry. Safe to call multiple times (idempotent).
     * Also called automatically on `exit`, `SIGINT`, and `SIGTERM`.
     */
    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;
        this.stopCacheCleanup();
        this.clearCache();

        // VULN-04: Zero the in-memory credential to reduce exposure window.
        this.auth = '';

        // Remove this instance from the active clients set
        activeClients.delete(this);
    }

    /**
     * Makes an HTTP request to the TestRail API with caching, rate limiting, and retry logic.
     *
     * @param method - HTTP method (GET, POST)
     * @param endpoint - API endpoint path (without base URL prefix)
     * @param data - Optional request body
     * @param retryCount - Current retry attempt (internal — do not pass)
     * @param skipCache - Skip cache lookup and storage for this request
     * @throws {TestRailApiError} When the API request fails or network error occurs
     * @throws {Error} When called after `destroy()`
     */
    protected async request<T>(
        method: string,
        endpoint: string,
        data?: unknown,
        retryCount = 0,
        skipCache = false,
    ): Promise<T> {
        // Prevent use after destroy
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        // Check cache for GET requests
        if (method === 'GET' && !skipCache) {
            const cacheKey = `${method}:${endpoint}`;
            const cachedData = this.getCachedData<T>(cacheKey);
            if (cachedData !== undefined) {
                return cachedData;
            }
        }

        // Apply rate limiting
        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
        const headers: Record<string, string> = {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'TestRail API Client TypeScript/1.0.0',
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const options: RequestInit = {
            method,
            headers,
            signal: controller.signal,
        };

        if (data !== undefined) {
            options.body = JSON.stringify(data);
        }

        try {
            const response: Response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');

                // Retry strategy for 5xx (Server Errors) and 429 (Too Many Requests).
                // For 429, respect the Retry-After header if present; otherwise use exponential backoff.
                if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
                    const retryAfterMs = response.status === 429 ? this.parseRetryAfterMs(response) : null;
                    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
                    await sleep(delay);
                    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
                }

                // VULN-08: The raw server body may contain stack traces, internal paths,
                // or secret values. Keep it in the structured `response` field for
                // programmatic inspection but do not embed it in the message string,
                // which callers commonly pass to loggers.
                throw new TestRailApiError(
                    `TestRail API error: ${response.status} ${response.statusText}`,
                    response.status,
                    response.statusText,
                    errorText,
                );
            }

            // Invalidate cache after mutating requests to avoid stale GET results.
            // Done before the empty-body check so empty responses (e.g. delete endpoints)
            // also clear the cache.
            if (method !== 'GET') {
                this.clearCache();
            }

            const responseText = await response.text();
            if (!responseText) {
                return {} as T;
            }

            try {
                const result = JSON.parse(responseText) as T;

                // Cache successful GET responses
                if (method === 'GET' && !skipCache) {
                    const cacheKey = `${method}:${endpoint}`;
                    this.setCachedData(cacheKey, result);
                }

                return result;
            } catch {
                throw new TestRailApiError('Invalid JSON response from TestRail API');
            }
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof TestRailApiError) {
                throw error;
            }

            const isAbortError = (error as Error).name === 'AbortError';

            // Don't retry timeout errors to avoid excessive wait times
            if (isAbortError) {
                throw new TestRailApiError(`Request timeout after ${this.timeout}ms`);
            }

            // Retry on network errors up to the maximum number of retries
            if (retryCount < this.maxRetries) {
                await sleep(this.getRetryDelay(retryCount));
                return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
            }

            throw new TestRailApiError(
                `Network error: ${(error as Error).message}`,
                undefined,
                undefined,
                (error as Error).message,
            );
        }
    }

    /**
     * Makes a multipart/form-data POST request to the TestRail API.
     * Used exclusively for file attachment uploads. Applies rate limiting
     * and throws on failure, but does NOT retry (uploads are not idempotent).
     *
     * @param endpoint - API endpoint path (without base URL prefix)
     * @param file - File content as Blob, Uint8Array, or File
     * @param filename - Filename to send in the multipart disposition
     * @throws {TestRailApiError} When the API request fails or network error occurs
     * @throws {Error} When called after `destroy()`
     */
    protected async requestMultipart<T>(
        endpoint: string,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<T> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;

        const formData = new globalThis.FormData();
        let blob: globalThis.Blob;
        if (file instanceof globalThis.Blob) {
            blob = file;
        } else {
            // Copy binary-like input into a plain Uint8Array to satisfy BlobPart type constraints
            blob = new globalThis.Blob([new Uint8Array(file)]);
        }
        formData.append('attachment', blob, filename);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${this.auth}`,
                    'User-Agent': 'TestRail API Client TypeScript/1.0.0',
                    // Do NOT set Content-Type — fetch sets it automatically with the boundary
                },
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new TestRailApiError(
                    `TestRail API error: ${response.status} ${response.statusText}`,
                    response.status,
                    response.statusText,
                    errorText,
                );
            }

            // Invalidate cache after upload
            this.clearCache();

            const responseText = await response.text();
            if (!responseText) {
                return {} as T;
            }

            try {
                return JSON.parse(responseText) as T;
            } catch {
                throw new TestRailApiError('Invalid JSON response from TestRail API');
            }
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof TestRailApiError) {
                throw error;
            }

            const isAbortError = (error as Error).name === 'AbortError';
            if (isAbortError) {
                throw new TestRailApiError(`Request timeout after ${this.timeout}ms`);
            }

            throw new TestRailApiError(
                `Network error: ${(error as Error).message}`,
                undefined,
                undefined,
                (error as Error).message,
            );
        }
    }

    /**
     * Makes a GET request to the TestRail API and returns the raw binary response.
     * Used for downloading attachment contents.
     *
     * @param endpoint - API endpoint path (without base URL prefix)
     * @throws {TestRailApiError} When the API request fails or network error occurs
     * @throws {Error} When called after `destroy()`
     */
    protected async requestBinary(endpoint: string, retryCount = 0): Promise<ArrayBuffer> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${this.auth}`,
                    'User-Agent': 'TestRail API Client TypeScript/1.0.0',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');

                // Retry strategy for 5xx (Server Errors) and 429 (Too Many Requests).
                // For 429, respect Retry-After header if present; otherwise use exponential backoff.
                if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
                    const retryAfterMs = response.status === 429 ? this.parseRetryAfterMs(response) : null;
                    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
                    await sleep(delay);
                    return this.requestBinary(endpoint, retryCount + 1);
                }

                throw new TestRailApiError(
                    `TestRail API error: ${response.status} ${response.statusText}`,
                    response.status,
                    response.statusText,
                    errorText,
                );
            }

            return response.arrayBuffer();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof TestRailApiError) {
                throw error;
            }

            const isAbortError = (error as Error).name === 'AbortError';
            if (isAbortError) {
                throw new TestRailApiError(`Request timeout after ${this.timeout}ms`);
            }

            if (retryCount < this.maxRetries) {
                await sleep(this.getRetryDelay(retryCount));
                return this.requestBinary(endpoint, retryCount + 1);
            }

            throw new TestRailApiError(
                `Network error: ${(error as Error).message}`,
                undefined,
                undefined,
                (error as Error).message,
            );
        }
    }
}
