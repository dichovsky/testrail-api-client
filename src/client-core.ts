import type { TestRailConfig, CacheEntry, UploadFileInput, UploadFilePathInput } from './types.js';
import { base64Encode, sleep } from './utils.js';
import {
    TestRailApiError,
    TestRailRateLimitError,
    TestRailTimeoutError,
    TestRailValidationError,
    createApiError,
    handleZodError,
} from './errors.js';
import pkg from '../package.json' with { type: 'json' };
import { isIP } from 'node:net';
import { openAsBlob, closeSync } from 'node:fs';
import { ZodError, type ZodType } from 'zod';

/**
 * Narrow `requestMultipart`'s `file` parameter to the streaming-from-disk
 * descriptor. The Blob / Uint8Array / File variants are detected by
 * `instanceof`, so the path variant is recognized by the presence of a
 * `path` string on a non-Blob, non-Uint8Array object.
 *
 * Defined at module scope so the (constant) shape check has no per-call
 * allocation cost. It's indirectly covered through `requestMultipart`
 * tests that exercise both path-descriptor and in-memory inputs.
 */
function isFilePathInput(value: unknown): value is UploadFilePathInput {
    return (
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof globalThis.Blob) &&
        !(value instanceof Uint8Array) &&
        typeof (value as { path?: unknown }).path === 'string'
    );
}

const USER_AGENT = `${pkg.description}/${pkg.version}`;
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
    DEFAULT_MAX_JSON_RESPONSE_BYTES,
    DEFAULT_MAX_BINARY_RESPONSE_BYTES,
    MAX_RESPONSE_BYTES_LIMIT,
} from './constants.js';
import { readBodyWithLimits, readBodyAsText } from './body-reader.js';

// Reject loopback, link-local, and private-range hosts to prevent SSRF.
// All requests carry a full Authorization header, making the client a credentialed
// probe for internal services when baseUrl is attacker-controlled.
// Protection combines syntactic checks (regex on hostname string) with DNS resolution:
// validatePublicHost() resolves the hostname and checks resulting IPs. Resolution
// runs fresh before EVERY request (no caching of the construction-time result) so a
// DNS-rebinding attacker can't lock in a public answer once and then flip to a
// private target. DNS lookup errors are fail-closed — callers needing to operate
// without DNS validation must set allowPrivateHosts: true.
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
    /^fe[c-f][0-9a-f]:/i, // IPv6 site-local (fec0::/10, deprecated but still routable privately)
    /^2002:/i, // 6to4 (2002::/16); embeds IPv4 — can reach private space
    /^64:ff9b::/i, // NAT64 well-known prefix (64:ff9b::/96); maps IPv4 private ranges
    /^0\./,
];

function isPrivateOrLoopbackIPv4(ip: string): boolean {
    const octetParts = ip.split('.');
    if (octetParts.length !== 4 || octetParts.some((part) => !/^\d+$/.test(part))) {
        return false;
    }

    const octets = octetParts.map((part) => Number.parseInt(part, 10));
    if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
        return false;
    }
    const [o0, o1] = octets as [number, number, ...number[]];

    return (
        o0 === 0 ||
        o0 === 10 ||
        o0 === 127 ||
        (o0 === 169 && o1 === 254) ||
        (o0 === 172 && o1 >= 16 && o1 <= 31) ||
        (o0 === 192 && o1 === 168)
    );
}

function isPrivateOrLoopbackIP(ip: string, family?: number): boolean {
    const [normalized] = ip.toLowerCase().split('%') as [string, ...string[]];
    // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1).
    const mappedIPv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    const mappedAddress = mappedIPv4?.[1];
    if (mappedAddress !== undefined) {
        return isPrivateOrLoopbackIPv4(mappedAddress);
    }

    const ipFamily = family ?? isIP(normalized);
    if (ipFamily === 4) {
        return isPrivateOrLoopbackIPv4(normalized);
    }
    if (ipFamily === 6) {
        if (normalized === '::' || normalized === '::1') {
            return true;
        }

        const parts = normalized.split(':') as [string, ...string[]];
        const [firstHextet] = parts;
        return (
            firstHextet.startsWith('fc') ||
            firstHextet.startsWith('fd') ||
            firstHextet.startsWith('fe8') ||
            firstHextet.startsWith('fe9') ||
            firstHextet.startsWith('fea') ||
            firstHextet.startsWith('feb') ||
            firstHextet.startsWith('fec') || // site-local fec0::/10
            firstHextet.startsWith('fed') ||
            firstHextet.startsWith('fee') ||
            firstHextet.startsWith('fef') ||
            firstHextet === '2002' || // 6to4 2002::/16
            (firstHextet === '64' && parts[1] === 'ff9b') // NAT64 64:ff9b::/96
        );
    }

    return false;
}

async function validatePublicHost(hostname: string): Promise<void> {
    const bare = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
    const isPrivatePattern = PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(bare));
    if (isPrivatePattern) {
        throw new TestRailValidationError(
            `baseUrl resolves to a private/loopback host ("${hostname}"). ` +
                'Set allowPrivateHosts: true to allow on-premise deployments.',
        );
    }

    // IP literals don't need DNS resolution — validate the address directly.
    if (isIP(bare) !== 0) {
        if (isPrivateOrLoopbackIP(bare)) {
            throw new TestRailValidationError(
                `baseUrl resolves to a private/loopback host ("${hostname}"). ` +
                    'Set allowPrivateHosts: true to allow on-premise deployments.',
            );
        }
        return;
    }

    // Hostname → resolve fresh. Lookup errors are fail-closed: a server that
    // returns SERVFAIL/NXDOMAIN to our validation lookup but succeeds for
    // fetch's lookup (different timeouts/resolvers) would otherwise yield a
    // one-step SSRF. Callers operating in environments without DNS must set
    // allowPrivateHosts: true to bypass this check entirely.
    let lookups: { address: string; family: number }[];
    try {
        const dns = await import('node:dns/promises');
        lookups = await dns.lookup(bare, { all: true });
    } catch (err) {
        if (err instanceof TestRailValidationError) throw err;
        const message = err instanceof Error ? err.message : 'Unknown error';
        throw new TestRailValidationError(
            `baseUrl DNS validation failed for "${hostname}": ${message}. ` +
                'Set allowPrivateHosts: true to allow deployments where DNS validation is not desired.',
        );
    }

    for (const lookup of lookups) {
        if (lookup.address !== '' && isPrivateOrLoopbackIP(lookup.address, lookup.family)) {
            throw new TestRailValidationError(
                `baseUrl resolves to a private/loopback host ("${hostname}" -> "${lookup.address}"). ` +
                    'Set allowPrivateHosts: true to allow on-premise deployments.',
            );
        }
    }
}

// UUID format for plan entry IDs (SEC #29). All four groups are hex-only so
// path-traversal sequences cannot appear in a validated entry ID.
const ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const activeClients = new Set<TestRailClientCore>();
let processHandlersRegistered = false;

// Synchronous-only cleanup — safe to call on process exit
function cleanupAllClients(): void {
    for (const client of activeClients) {
        try {
            client.destroy();
        } catch {
            // One throwing client must not abort the sweep.
        }
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
    // Declared non-readonly so it can be zeroed in destroy() to reduce
    // the window during which the credential is recoverable from a heap dump.
    private auth: string;
    private readonly timeout: number;
    private readonly maxRetries: number;
    private readonly enableCache: boolean;
    private readonly cacheTtl: number;
    private readonly cacheCleanupInterval: number;
    private readonly maxCacheSize: number;
    private readonly cache = new Map<string, CacheEntry<unknown>>();
    private readonly pendingRequests = new Map<string, Promise<unknown>>();
    private cacheCleanupTimer: ReturnType<typeof setInterval> | undefined;
    private readonly rateLimiter: { maxRequests: number; windowMs: number; requests: number[] };
    private isDestroyed = false;
    private readonly hostname: string;
    private readonly allowPrivateHosts: boolean;
    private readonly maxJsonResponseBytes: number;
    private readonly maxBinaryResponseBytes: number;
    /**
     * Body-read deadline in milliseconds. `0` means no deadline (only the
     * byte cap protects). Resolved from `config.bodyTimeout ?? config.timeout`.
     */
    private readonly bodyTimeout: number;
    private readonly fetchOverride: typeof globalThis.fetch | undefined;

    constructor(config: TestRailConfig) {
        this.validateConfig(config);
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        // URL already validated by validateConfig — this parse cannot throw.
        this.hostname = new URL(config.baseUrl).hostname;
        this.allowPrivateHosts = config.allowPrivateHosts === true;
        this.auth = base64Encode(`${config.email}:${config.apiKey}`);
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
        this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.enableCache = config.enableCache ?? true;
        this.cacheTtl = config.cacheTtl ?? DEFAULT_CACHE_TTL_MS;
        this.cacheCleanupInterval = config.cacheCleanupInterval ?? DEFAULT_CACHE_CLEANUP_INTERVAL_MS;
        // maxCacheSize=0 means unbounded and risks memory exhaustion.
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
        this.maxJsonResponseBytes = config.maxJsonResponseBytes ?? DEFAULT_MAX_JSON_RESPONSE_BYTES;
        this.maxBinaryResponseBytes = config.maxBinaryResponseBytes ?? DEFAULT_MAX_BINARY_RESPONSE_BYTES;
        // `bodyTimeout: 0` is honored as "no deadline" (only the byte cap
        // protects). `undefined` falls back to the request `timeout` so the
        // body read is always bounded unless callers explicitly opt out.
        this.bodyTimeout = config.bodyTimeout ?? this.timeout;
        this.fetchOverride = config.fetch;

        if (config.allowInsecure === true && new URL(config.baseUrl).protocol === 'http:') {
            // eslint-disable-next-line no-console
            console.warn(
                '[testrail-api-client] WARNING: allowInsecure is enabled. ' +
                    'HTTP transmits credentials in cleartext. Use HTTPS in production.',
            );
        }

        // DNS host validation runs fresh before every request (see awaitDnsValidation).
        // Resolving once at construction would let a DNS-rebinding attacker pin a
        // public IP for the validation lookup and then flip to a private target
        // before fetch performs its own (independent) lookup. The sync regex check
        // in validateConfig already blocks obvious private host literals.

        // Register this instance for automatic cleanup
        activeClients.add(this);
        // Process-wide signal handlers are opt-in (default: false). Library
        // consumers (web servers, daemons, embedders) must keep ownership of
        // SIGINT/SIGTERM and the process exit code; CLIs/standalone scripts
        // that own the process lifecycle set this to `true`. Once a handler
        // set is installed it stays installed for the lifetime of the process
        // (`process.on` listeners cannot be safely removed without tracking
        // ownership across all clients).
        if (config.registerProcessHandlers === true) {
            registerProcessHandlers();
        }

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

            // Block HTTP unless explicitly opted in — Basic auth credentials are base64
            // only; any network observer can decode them from a cleartext HTTP request.
            if (url.protocol === 'http:' && config.allowInsecure !== true) {
                throw new TestRailValidationError(
                    'baseUrl must use HTTPS. HTTP sends credentials in cleartext. ' +
                        'Set allowInsecure: true only in isolated development environments.',
                );
            }

            if (url.username !== '' || url.password !== '') {
                throw new TestRailValidationError(
                    'baseUrl must not contain embedded credentials (userinfo). ' +
                        'Use the email and apiKey config fields instead.',
                );
            }

            // Syntactic SSRF protection: reject obvious private hostnames synchronously.
            // The async DNS check in validatePublicHost adds defence-in-depth for rebinding.
            if (config.allowPrivateHosts !== true) {
                const bare =
                    url.hostname.startsWith('[') && url.hostname.endsWith(']')
                        ? url.hostname.slice(1, -1)
                        : url.hostname;
                if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(bare))) {
                    throw new TestRailValidationError(
                        `baseUrl resolves to a private/loopback host ("${url.hostname}"). ` +
                            'Set allowPrivateHosts: true to allow on-premise deployments.',
                    );
                }
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

        // Validate response-body caps (SEC #12). Must be positive integers
        // within MAX_RESPONSE_BYTES_LIMIT so a caller cannot disable the
        // guard by passing Number.MAX_SAFE_INTEGER or a negative value that
        // would silently wrap around to "never trip".
        if (config.maxJsonResponseBytes !== undefined) {
            if (
                typeof config.maxJsonResponseBytes !== 'number' ||
                !Number.isInteger(config.maxJsonResponseBytes) ||
                config.maxJsonResponseBytes <= 0 ||
                config.maxJsonResponseBytes > MAX_RESPONSE_BYTES_LIMIT
            ) {
                throw new TestRailValidationError(
                    `maxJsonResponseBytes must be a positive integer not exceeding ${MAX_RESPONSE_BYTES_LIMIT} bytes`,
                );
            }
        }
        if (config.maxBinaryResponseBytes !== undefined) {
            if (
                typeof config.maxBinaryResponseBytes !== 'number' ||
                !Number.isInteger(config.maxBinaryResponseBytes) ||
                config.maxBinaryResponseBytes <= 0 ||
                config.maxBinaryResponseBytes > MAX_RESPONSE_BYTES_LIMIT
            ) {
                throw new TestRailValidationError(
                    `maxBinaryResponseBytes must be a positive integer not exceeding ${MAX_RESPONSE_BYTES_LIMIT} bytes`,
                );
            }
        }
        // Validate body deadline (SEC #21). `0` is allowed (= no deadline);
        // negative or fractional values are rejected.
        if (config.bodyTimeout !== undefined) {
            if (
                typeof config.bodyTimeout !== 'number' ||
                !Number.isInteger(config.bodyTimeout) ||
                config.bodyTimeout < 0 ||
                config.bodyTimeout > MAX_TIMEOUT_MS
            ) {
                throw new TestRailValidationError('bodyTimeout must be a non-negative integer not exceeding 5 minutes');
            }
        }

        // Validate rateLimiter config values.
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
        if (config.fetch !== undefined && typeof config.fetch !== 'function') {
            throw new TestRailValidationError('fetch must be a function compatible with the Fetch API');
        }
    }

    private getRetryDelay(retryCount: number): number {
        return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS);
    }

    /**
     * Parses the `Retry-After` response header into milliseconds.
     *
     * Honored on every retryable status (429 and any 5xx the caller is willing
     * to retry). The header is valid per RFC 7231 §7.1.3 on 503 and 429; in
     * practice TestRail and front proxies (nginx, Cloudflare) emit it on 502,
     * 503, and 504 during overload or maintenance windows. Treating all
     * retryable 5xx symmetrically keeps the retry-eligibility matrix in one
     * place.
     *
     * Accepts either a delta-seconds integer or an HTTP-date. Server-supplied
     * values are capped at {@link MAX_RETRY_DELAY_MS} so a malicious or
     * misconfigured upstream cannot freeze the client indefinitely. A value of
     * `0`, a past date, or an unparseable string returns `null` so the caller
     * falls back to exponential backoff — this prevents a hot retry loop when
     * the server hint is meaningless.
     *
     * @param response - The HTTP response carrying the header
     * @returns Delay in milliseconds, or `null` if the header is absent, zero,
     *          in the past, or otherwise unparseable
     */
    private parseRetryAfterMs(response: Response): number | null {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter === null || retryAfter === '') {
            return null;
        }

        // Try parsing as seconds (numeric value)
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds) && seconds > 0) {
            // Cap server-supplied delay to MAX_RETRY_DELAY_MS to prevent a
            // malicious/compromised server from freezing the client indefinitely.
            return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
        }

        // Try parsing as HTTP-date format
        const date = new Date(retryAfter);
        if (!isNaN(date.getTime())) {
            const delayMs = date.getTime() - Date.now();
            // Same cap applied to HTTP-date format.
            return delayMs > 0 ? Math.min(delayMs, MAX_RETRY_DELAY_MS) : null;
        }

        return null; // Invalid format
    }

    /**
     * BACKLOG #4: Surfaces 3xx redirect responses as `TestRailApiError`.
     *
     * The SSRF guard (`validateBaseUrl` + DNS pin in `awaitDnsValidation`)
     * validates only the *initial* request host. If the upstream answers with
     * a 3xx pointing at a private/metadata IP and the runtime auto-follows,
     * the network request reaches the protected host before we ever inspect
     * a response — bypassing the guard entirely. We disable auto-follow at
     * every fetch site (`redirect: 'manual'`) and reject the resulting 3xx
     * here so callers see a deterministic, no-retry error. The TestRail API
     * itself never returns 3xx for `/index.php?/api/v2/...`, so a redirect
     * in practice means a misconfigured reverse proxy, a wrong `baseUrl`, or
     * an attacker probing the SSRF surface.
     *
     * @throws {TestRailApiError} When `response.status` is in [300, 400).
     */
    private assertNotRedirect(response: Response): void {
        const status = response.status;
        // Defensive: only act on a valid 3xx integer. A non-numeric or
        // out-of-range status means either a non-redirect response or a
        // malformed mock — neither should false-positive throw here.
        if (typeof status !== 'number' || status < 300 || status >= 400) {
            return;
        }

        const location = response.headers.get('location');
        const body =
            location !== null && location !== ''
                ? `Redirect blocked: Location <${location}>. TestRail API endpoints do not redirect; check baseUrl or your reverse proxy.`
                : `Redirect blocked: response status ${status}. TestRail API endpoints do not redirect; check baseUrl or your reverse proxy.`;
        throw new TestRailApiError(status, response.statusText, body);
    }

    /** Sliding window rate limiter. @throws {TestRailApiError} when limit exceeded */
    private checkRateLimit(): void {
        const now = Date.now();
        const windowStart = now - this.rateLimiter.windowMs;

        // Clean old requests outside the window
        this.rateLimiter.requests = this.rateLimiter.requests.filter((time) => time > windowStart);

        if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
            let oldestRequest = now;
            for (const requestTime of this.rateLimiter.requests) {
                if (requestTime < oldestRequest) {
                    oldestRequest = requestTime;
                }
            }
            const waitTime = oldestRequest + this.rateLimiter.windowMs - now;
            throw new TestRailRateLimitError(429, 'Too Many Requests', {
                message: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`,
                waitTimeMs: waitTime,
            });
        }

        this.rateLimiter.requests.push(now);
    }

    /**
     * Validates that an ID is a positive integer.
     * @throws {TestRailValidationError} When ID is invalid
     */
    public validateId(id: number, name: string): void {
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new TestRailValidationError(`${name} must be a positive integer`);
        }
    }

    /**
     * Validates that an entry ID is a well-formed UUID string.
     * TestRail plan-entry IDs are RFC 4122 UUIDs; accepting arbitrary strings
     * allows path-traversal sequences (e.g. `../../admin`) to be injected into
     * the URL (SEC #29).
     * @throws {TestRailValidationError} When entryId is not a UUID string
     */
    public validateEntryId(entryId: string): void {
        if (typeof entryId !== 'string' || !ENTRY_ID_RE.test(entryId)) {
            throw new TestRailValidationError('entryId must be a UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
        }
    }

    /**
     * Validates optional pagination parameters.
     * @throws {TestRailValidationError} When limit is not a positive integer or offset is not a non-negative integer
     */
    public validatePaginationParams(limit?: number, offset?: number): void {
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
    public buildEndpoint(base: string, params: Record<string, string | number | undefined> = {}): string {
        const parts: string[] = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                // Encode values to prevent parameter injection via string values
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
            return globalThis.structuredClone<T>(entry.data);
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
            data: globalThis.structuredClone(data),
            expiry: Date.now() + this.cacheTtl,
        });
    }

    /**
     * Clears the entire cache.
     */
    public clearCache(): void {
        this.cache.clear();
        // Clear in-flight coalesced GET promises (SEC #23): a POST has just
        // mutated state, so any pending GET for the same resource must re-fetch
        // rather than serving the pre-mutation snapshot to late joiners.
        this.pendingRequests.clear();
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
     *
     * When any client in the process is constructed with
     * `registerProcessHandlers: true` (default `false`), this method is also
     * invoked automatically on `exit`, `SIGINT`, and `SIGTERM` for every
     * active client; otherwise the caller is responsible for invoking it.
     */
    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;
        try {
            this.stopCacheCleanup();
            this.clearCache();
            this.pendingRequests.clear();
        } finally {
            // Zero the credential and remove from registry unconditionally so a
            // throw inside stopCacheCleanup/clearCache leaves no stale entry and
            // no recoverable credential in the heap.
            this.auth = '';
            activeClients.delete(this);
        }
    }

    /**
     * Makes an HTTP request to the TestRail API with caching, rate limiting, and retry logic.
     *
     * Retry contract:
     *   - 429 (rate limit) retries for all methods (rejected before write executes).
     *   - 5xx retries only for GET. Non-GET 5xx surfaces immediately to prevent
     *     duplicate writes when the server may have already processed the request.
     *   - Network errors (fetch TypeError) retry only for GET. AbortError (timeout)
     *     never retries.
     *
     * @param method - HTTP method (GET, POST)
     * @param endpoint - API endpoint path (without base URL prefix)
     * @param data - Optional request body
     * @param retryCount - Current retry attempt (internal — do not pass)
     * @param skipCache - Skip cache lookup and storage for this request
     * @throws {TestRailApiError} When the API request fails or network error occurs
     * @throws {Error} When called after `destroy()`
     */
    public async request<T>(
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

        await this.awaitDnsValidation();

        // Check cache for GET requests
        if (method === 'GET' && !skipCache) {
            const cacheKey = `${method}:${endpoint}`;
            const cachedData = this.getCachedData<T>(cacheKey);
            if (cachedData !== undefined) {
                return cachedData;
            }

            // Coalesce concurrent identical GET requests (SEC #23):
            // if a fetch for this key is already in flight, return that Promise
            // instead of starting a new upstream request.
            const existing = this.pendingRequests.get(cacheKey) as Promise<T> | undefined;
            if (existing !== undefined) {
                return existing;
            }
        }

        // Apply rate limiting
        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
        const headers: Record<string, string> = {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const options: RequestInit = {
            method,
            headers,
            signal: controller.signal,
            // BACKLOG #4: never follow redirects automatically. The SSRF guard
            // validates the *initial* hostname only; a 3xx Location pointing at
            // a private/metadata IP would otherwise bypass it.
            redirect: 'manual',
        };

        if (data !== undefined) {
            options.body = JSON.stringify(data);
        }

        // Wrap the fetch in a named promise so concurrent GET callers with the
        // same cache key (SEC #23) can share a single upstream request.
        const fetchPromise: Promise<T> = (async () => {
            try {
                const response: Response = await (this.fetchOverride ?? globalThis.fetch)(url, options);
                // Headers received — header timeout has done its job. The body
                // read is bounded independently by readBodyWithLimits, so clearing
                // here does not re-open the slowloris-on-body window (SEC #21).
                clearTimeout(timeoutId);

                this.assertNotRedirect(response);

                const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: this.bodyTimeout };

                if (!response.ok) {
                    // Error bodies inherit the same cap so an attacker cannot OOM
                    // the client by responding 4xx/5xx with a 10 GiB payload.
                    // If the body read itself hits a limit (cap or timeout), surface
                    // that TestRailApiError immediately — no retry, since repeating
                    // the request would compound the wait by (maxRetries+1)×bodyTimeout.
                    // Only generic decode errors fall back to 'Unknown error'.
                    let errorText: string;
                    try {
                        errorText = await readBodyAsText(response, jsonLimits);
                    } catch (bodyErr) {
                        if (bodyErr instanceof TestRailApiError) {
                            throw bodyErr;
                        }
                        errorText = 'Unknown error';
                    }

                    // Retry strategy:
                    //   429 (rate limit) — retried for ALL methods. TestRail's rate limiter
                    //     rejects the request before it executes, so a retry on a mutating
                    //     call cannot duplicate writes. Respect Retry-After when present.
                    //   5xx (server error) — retried only for GET. A 5xx on POST/PUT/DELETE
                    //     leaves write state ambiguous (server may have processed the request
                    //     before the failure), so retrying could create duplicate records.
                    //     Non-GET callers see the 5xx surfaced immediately. Retry-After is
                    //     honored on GET 5xx too (BACKLOG SEC #25): TestRail / nginx /
                    //     Cloudflare commonly emit it on 502/503/504 during maintenance, and
                    //     respecting the hint avoids hammering an upstream that already told
                    //     us how long to wait. parseRetryAfterMs falls back to null on zero,
                    //     past dates, or invalid values, so the caller never spins.
                    const isIdempotent = method === 'GET';
                    const status = response.status;
                    const shouldRetry =
                        (status === 429 || (isIdempotent && status >= 500)) && retryCount < this.maxRetries;
                    if (shouldRetry) {
                        const retryAfterMs = this.parseRetryAfterMs(response);
                        const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
                        await sleep(delay);
                        // Force skipCache=true: we're already inside the coalesced
                        // fetchPromise, so the retry must not look up pendingRequests
                        // (which still holds *this* promise) — that would deadlock.
                        return this.request<T>(method, endpoint, data, retryCount + 1, true);
                    }

                    // The raw server body may contain stack traces, internal paths,
                    // or secret values. Keep it in the structured `response` field for
                    // programmatic inspection but do not embed it in the message string,
                    // which callers commonly pass to loggers.
                    throw createApiError(response.status, response.statusText, errorText);
                }

                // Invalidate cache after mutating requests to avoid stale GET results.
                // Done before the empty-body check so empty responses (e.g. delete endpoints)
                // also clear the cache.
                if (method !== 'GET') {
                    this.clearCache();
                }

                const responseText = await readBodyAsText(response, jsonLimits);
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
                    throw new TestRailApiError(0, 'Invalid JSON response from TestRail API');
                }
            } catch (error) {
                clearTimeout(timeoutId);

                if (error instanceof TestRailApiError) {
                    throw error;
                }

                const isAbortError = (error as Error).name === 'AbortError';

                // Don't retry timeout errors to avoid excessive wait times
                if (isAbortError) {
                    throw new TestRailTimeoutError(408, `Request timeout after ${this.timeout}ms`);
                }

                // Retry network errors only for GET. A TypeError from fetch can fire
                // mid-flight (e.g. ECONNRESET after the request bytes are on the wire),
                // so retrying a POST/PUT/DELETE risks duplicating a write the server
                // already processed. GET is idempotent and safe to retry.
                if (method === 'GET' && retryCount < this.maxRetries) {
                    await sleep(this.getRetryDelay(retryCount));
                    // Force skipCache=true for the same reason as the 5xx retry above.
                    return this.request<T>(method, endpoint, data, retryCount + 1, true);
                }

                throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
            }
        })();

        // Register the in-flight promise so concurrent GET callers with the
        // same cache key (and skipCache=false) share this single fetch (SEC #23).
        // Remove on settle so rejections don't permanently block a cache key.
        if (method === 'GET' && !skipCache) {
            const cacheKey = `${method}:${endpoint}`;
            this.pendingRequests.set(cacheKey, fetchPromise);
            // Suppress the rejection on the cleanup chain; callers own the returned
            // promise and are responsible for catching it. Without this, a rejected
            // fetchPromise produces an unhandled rejection on the finally() branch.
            fetchPromise
                .finally(() => {
                    this.pendingRequests.delete(cacheKey);
                })
                .catch(() => {});
        }

        return fetchPromise;
    }

    /**
     * Makes an HTTP request to the TestRail API and returns the raw text body.
     * Used for endpoints whose response is **not** JSON — currently only the
     * BDD endpoint `get_bdd/{case_id}`, which returns a Gherkin `.feature`
     * file as `text/plain`.
     *
     * Mirrors the retry / rate-limit / timeout / DNS-validation pipeline of
     * {@link request} but swaps the JSON parse for `response.text()`.
     * Intentionally bypasses the GET-LRU cache: text-response endpoints are
     * rare and the cache key would collide with the JSON `request<T>()`
     * variant for the same endpoint (e.g. a future endpoint hit by both).
     * Mutating callers (`method !== 'GET'`) still invalidate the JSON cache.
     *
     * @param method - HTTP method (GET, POST)
     * @param endpoint - API endpoint path (without base URL prefix)
     * @param data - Optional request body
     * @param retryCount - Current retry attempt (internal — do not pass)
     * @throws {TestRailApiError} When the API request fails or network error occurs
     * @throws {Error} When called after `destroy()`
     */
    public async requestText(method: string, endpoint: string, data?: unknown, retryCount = 0): Promise<string> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        await this.awaitDnsValidation();

        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
        const headers: Record<string, string> = {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const options: RequestInit = {
            method,
            headers,
            signal: controller.signal,
            // BACKLOG #4: never follow redirects automatically (see request<T>).
            redirect: 'manual',
        };

        if (data !== undefined) {
            options.body = JSON.stringify(data);
        }

        try {
            const response: Response = await (this.fetchOverride ?? globalThis.fetch)(url, options);
            // Body read is bounded by readBodyWithLimits (SEC #21).
            clearTimeout(timeoutId);

            this.assertNotRedirect(response);

            const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: this.bodyTimeout };

            if (!response.ok) {
                // Body-limit errors (cap / timeout) surface immediately — see
                // the same pattern in request<T>() for the full rationale.
                let errorText: string;
                try {
                    errorText = await readBodyAsText(response, jsonLimits);
                } catch (bodyErr) {
                    if (bodyErr instanceof TestRailApiError) {
                        throw bodyErr;
                    }
                    errorText = 'Unknown error';
                }

                // Mirrors the retry contract documented on request<T>():
                // 429 retries for all methods; 5xx retries only for GET.
                // Retry-After is honored on both (BACKLOG SEC #25).
                const isIdempotent = method === 'GET';
                const status = response.status;
                const shouldRetry = (status === 429 || (isIdempotent && status >= 500)) && retryCount < this.maxRetries;
                if (shouldRetry) {
                    const retryAfterMs = this.parseRetryAfterMs(response);
                    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
                    await sleep(delay);
                    return this.requestText(method, endpoint, data, retryCount + 1);
                }

                throw createApiError(response.status, response.statusText, errorText);
            }

            // Mutating calls still invalidate the JSON cache so subsequent
            // GETs see the new state.
            if (method !== 'GET') {
                this.clearCache();
            }

            return readBodyAsText(response, jsonLimits);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof TestRailApiError) {
                throw error;
            }

            const isAbortError = (error as Error).name === 'AbortError';
            if (isAbortError) {
                throw new TestRailTimeoutError(408, `Request timeout after ${this.timeout}ms`);
            }

            // Network errors retry only for GET — see request<T>() for rationale.
            if (method === 'GET' && retryCount < this.maxRetries) {
                await sleep(this.getRetryDelay(retryCount));
                return this.requestText(method, endpoint, data, retryCount + 1);
            }

            throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
        }
    }

    /**
     * Makes a multipart/form-data POST request to the TestRail API.
     * Used exclusively for file attachment uploads. Applies rate limiting
     * and throws on failure, but does NOT retry (uploads are not idempotent —
     * a 5xx mid-stream could leave the server with the attachment already
     * persisted, and retrying would duplicate it).
     *
     * **Streaming.** When `file` is a `{ path }` descriptor the bytes are
     * read from disk on demand via `node:fs.openAsBlob()` — the whole file
     * never lands on the heap. A 100 MB upload grows heap by &lt;1 MB. Callers
     * that already have the bytes in memory may still pass a `Blob`,
     * `Uint8Array`, or `File`; those paths are unchanged for backwards
     * compatibility but obviously do not benefit from streaming.
     *
     * **Abort handling.** The same `AbortSignal` that arms the header timeout
     * is honored throughout the body upload; a timeout mid-stream surfaces as
     * `TestRailApiError(408, ...)` and tears down the socket. Read errors on
     * the file descriptor (e.g. file deleted between `stat` and `fetch`)
     * surface as `TestRailApiError(0, 'Network error: ...')`.
     *
     * @param endpoint - API endpoint path (without base URL prefix)
     * @param file - File content. Either an in-memory variant
     *               (`Blob` / `Uint8Array` / `File`) or a `{ path, type? }`
     *               descriptor for streaming from disk.
     * @param filename - Filename to send in the multipart disposition
     * @throws {TestRailApiError} When the API request fails or network error occurs
     * @throws {Error} When called after `destroy()`
     */
    public async requestMultipart<T>(endpoint: string, file: UploadFileInput, filename: string): Promise<T> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        await this.awaitDnsValidation();

        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            // Build the multipart body inside the try block so file-open
            // failures (ENOENT, EACCES, EISDIR, etc.) surface as a structured
            // TestRailApiError rather than an unhandled TypeError. openAsBlob
            // returns a file-backed Blob whose stream() reads from disk on
            // demand, so fetch consumes the FormData via that stream and the
            // entire file is never resident in memory at once.
            const formData = new globalThis.FormData();
            let blob: globalThis.Blob;
            if (isFilePathInput(file)) {
                const opts: { type?: string } = {};
                if (file.type !== undefined) opts.type = file.type;

                let uploadPath = file.path;
                if (file.fd !== undefined) {
                    if (process.platform === 'darwin') {
                        uploadPath = `/dev/fd/${file.fd}`;
                    } else if (process.platform === 'linux') {
                        uploadPath = `/proc/self/fd/${file.fd}`;
                    } else {
                        // Fall back to original path, and close fd immediately since we aren't using it
                        try {
                            closeSync(file.fd);
                        } catch {
                            // Ignore close errors
                        }
                        // Prevent duplicate close in finally block
                        file.fd = undefined;
                    }
                }

                blob = await openAsBlob(uploadPath, opts);
            } else if (file instanceof globalThis.Blob) {
                blob = file;
            } else {
                // Copy binary-like input into a plain Uint8Array to satisfy BlobPart type constraints
                blob = new globalThis.Blob([new Uint8Array(file)]);
            }
            formData.append('attachment', blob, filename);

            const response = await (this.fetchOverride ?? globalThis.fetch)(url, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${this.auth}`,
                    'User-Agent': USER_AGENT,
                    // Do NOT set Content-Type — fetch sets it automatically with the boundary
                },
                body: formData,
                signal: controller.signal,
                // BACKLOG #4: never follow redirects automatically (see request<T>).
                redirect: 'manual',
            });

            this.assertNotRedirect(response);

            const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: this.bodyTimeout };

            if (!response.ok) {
                // Body-limit errors (cap / timeout) surface immediately — see
                // the same pattern in request<T>() for the full rationale.
                let errorText: string;
                try {
                    errorText = await readBodyAsText(response, jsonLimits);
                } catch (bodyErr) {
                    if (bodyErr instanceof TestRailApiError) {
                        throw bodyErr;
                    }
                    errorText = 'Unknown error';
                }
                throw createApiError(response.status, response.statusText, errorText);
            }

            // Invalidate cache after upload
            this.clearCache();

            const responseText = await readBodyAsText(response, jsonLimits);
            if (!responseText) {
                return {} as T;
            }

            try {
                return JSON.parse(responseText) as T;
            } catch {
                throw new TestRailApiError(0, 'Invalid JSON response from TestRail API');
            }
        } catch (error) {
            if (error instanceof TestRailApiError) {
                throw error;
            }

            const isAbortError = (error as Error).name === 'AbortError';
            if (isAbortError) {
                throw new TestRailTimeoutError(408, `Request timeout after ${this.timeout}ms`);
            }

            throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
        } finally {
            clearTimeout(timeoutId);
            if (isFilePathInput(file) && file.fd !== undefined) {
                try {
                    closeSync(file.fd);
                } catch {
                    // Ignore close errors
                }
            }
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
    public async requestBinary(endpoint: string, retryCount = 0): Promise<ArrayBuffer> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        await this.awaitDnsValidation();

        this.checkRateLimit();

        const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await (this.fetchOverride ?? globalThis.fetch)(url, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${this.auth}`,
                    'User-Agent': USER_AGENT,
                },
                signal: controller.signal,
                // BACKLOG #4: never follow redirects automatically (see request<T>).
                redirect: 'manual',
            });

            // Body read is bounded by readBodyWithLimits (SEC #21).
            clearTimeout(timeoutId);

            this.assertNotRedirect(response);

            if (!response.ok) {
                // Error bodies on the binary endpoint are still JSON/text — use the
                // JSON cap so a server cannot OOM us with a giant error payload.
                // Body-limit errors (cap / timeout) surface immediately — see
                // the same pattern in request<T>() for the full rationale.
                let errorText: string;
                try {
                    errorText = await readBodyAsText(response, {
                        maxBytes: this.maxJsonResponseBytes,
                        deadlineMs: this.bodyTimeout,
                    });
                } catch (bodyErr) {
                    if (bodyErr instanceof TestRailApiError) {
                        throw bodyErr;
                    }
                    errorText = 'Unknown error';
                }

                // Retry strategy for 5xx (Server Errors) and 429 (Too Many Requests).
                // requestBinary is always GET (attachment download) and therefore
                // idempotent — retrying any 5xx is safe.
                // Retry-After is honored on both classes (BACKLOG SEC #25); it falls
                // back to exponential backoff when absent, zero, in the past, or
                // unparseable (see parseRetryAfterMs).
                if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
                    const retryAfterMs = this.parseRetryAfterMs(response);
                    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
                    await sleep(delay);
                    return this.requestBinary(endpoint, retryCount + 1);
                }

                throw createApiError(response.status, response.statusText, errorText);
            }

            // Binary success body: use the larger binary cap.
            const bytes = await readBodyWithLimits(response, {
                maxBytes: this.maxBinaryResponseBytes,
                deadlineMs: this.bodyTimeout,
            });
            // readBodyWithLimits returns a subarray view of a growable buffer
            // that may have spare capacity.  Return an ArrayBuffer that contains
            // exactly the downloaded bytes — slice only when needed to avoid an
            // unnecessary copy when the buffer happens to be exact-sized.
            return bytes.byteLength === bytes.buffer.byteLength
                ? (bytes.buffer as ArrayBuffer)
                : (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof TestRailApiError) {
                throw error;
            }

            const isAbortError = (error as Error).name === 'AbortError';
            if (isAbortError) {
                throw new TestRailTimeoutError(408, `Request timeout after ${this.timeout}ms`);
            }

            if (retryCount < this.maxRetries) {
                await sleep(this.getRetryDelay(retryCount));
                return this.requestBinary(endpoint, retryCount + 1);
            }

            throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
        }
    }

    /**
     * Re-validates the baseUrl hostname against the public-IP allowlist before
     * each request. Performing the lookup per-request (rather than caching the
     * construction-time result) eliminates the window in which a DNS-rebinding
     * authority could serve a public IP to validation and a private IP to fetch.
     * Lookup errors are fail-closed; callers needing to operate without DNS
     * must set allowPrivateHosts: true.
     */
    private async awaitDnsValidation(): Promise<void> {
        if (this.allowPrivateHosts) return;
        await validatePublicHost(this.hostname);
    }

    /**
     * Validates `data` against `schema` and returns it typed as `T`.
     * @throws {TestRailValidationError} When data does not conform to schema
     */
    public parse<T>(schema: ZodType, data: unknown): T {
        try {
            return schema.parse(data) as T;
        } catch (err) {
            if (err instanceof ZodError) {
                throw handleZodError(err);
            }
            throw err;
        }
    }

    /**
     * Performs a request and validates the response against a Zod schema in a
     * single step. For GET requests, the validated result is cached only after
     * successful validation — schema-invalid responses are never written to the
     * cache, eliminating the cache-poisoning failure mode where a malformed
     * response would persist for the full TTL and re-throw on every subsequent
     * call to the same endpoint.
     *
     * Mirrors the retry / rate-limit / timeout / DNS-validation pipeline of
     * {@link request}. POST responses are validated but not cached; POSTs still
     * clear the cache (handled inside {@link request}).
     *
     * Prefer this over `parse(schema, await request<unknown>(...))` in new code.
     *
     * @param method - HTTP method (GET, POST)
     * @param endpoint - API endpoint path (without base URL prefix)
     * @param schema - Zod schema to validate the response against
     * @param data - Optional request body
     * @throws {TestRailApiError} When the API request fails
     * @throws {TestRailValidationError} When the response does not conform to schema
     * @throws {Error} When called after `destroy()`
     */
    public async requestParsed<T>(method: string, endpoint: string, schema: ZodType, data?: unknown): Promise<T> {
        // Validated responses live in their own cache namespace so they cannot
        // collide with raw entries written by direct `request<T>('GET', ...)`
        // callers. Without the split, two failure modes would re-emerge:
        //   (1) a raw response cached by `request()` could be returned here
        //       unvalidated, re-introducing the original cache-poisoning bug;
        //   (2) a Zod-stripped/transformed value written here could surface to
        //       a later `request()` caller that expects the raw JSON body.
        // `clearCache()` (called by every POST) wipes both namespaces, so
        // mutation invalidation still works correctly.
        const cacheKey = method === 'GET' ? `PARSED:${method}:${endpoint}` : undefined;

        if (cacheKey !== undefined) {
            const cachedData = this.getCachedData<T>(cacheKey);
            if (cachedData !== undefined) {
                return cachedData;
            }

            // Coalesce concurrent identical GET requests (SEC #23): if a validated
            // fetch for this key is already in flight, return the shared Promise.
            const existing = this.pendingRequests.get(cacheKey) as Promise<T> | undefined;
            if (existing !== undefined) {
                return existing;
            }
        }

        // Use skipCache=true to bypass request()'s own cache write — we only
        // want to cache after validation has succeeded. POST's cache-clear
        // still fires inside request() because clearCache() is unconditional
        // for non-GET methods regardless of skipCache.
        const fetchPromise: Promise<T> = (async () => {
            const raw = await this.request<unknown>(method, endpoint, data, 0, true);
            const validated = this.parse<T>(schema, raw);
            if (cacheKey !== undefined) {
                this.setCachedData(cacheKey, validated);
            }
            return validated;
        })();

        if (cacheKey !== undefined) {
            this.pendingRequests.set(cacheKey, fetchPromise);
            fetchPromise
                .finally(() => {
                    this.pendingRequests.delete(cacheKey);
                })
                .catch(() => {});
        }

        return fetchPromise;
    }
}
