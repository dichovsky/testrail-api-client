import type { TestRailConfig, CacheEntry, UploadFileInput, UploadFilePathInput } from './types.js';
import { base64Encode, sleep } from './utils.js';
import { TestRailApiError, TestRailValidationError, handleZodError } from './errors.js';
import pkg from '../package.json' with { type: 'json' };
import { isIP } from 'node:net';
import { openAsBlob, closeSync } from 'node:fs';
import { ZodError, type ZodType } from 'zod';
import type { PipelineSpec, RequestSpec } from './http-pipeline-types.js';
import { getRetryPolicy } from './retry-policy.js';

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

type DnsLookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

async function validatePublicHost(hostname: string, dnsLookup?: DnsLookupFn): Promise<void> {
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
        if (dnsLookup) {
            lookups = await dnsLookup(bare);
        } else {
            const dns = await import('node:dns/promises');
            lookups = await dns.lookup(bare, { all: true });
        }
    } catch (err) {
        if (err instanceof TestRailValidationError) throw err;
        const message = err instanceof Error ? err.message : 'Unknown error';
        throw new TestRailValidationError(
            `baseUrl DNS validation failed for "${hostname}": ${message}. ` +
                'Set allowPrivateHosts: true to allow deployments where DNS validation is not desired.',
        );
    }

    if (lookups.length === 0) {
        throw new TestRailValidationError(
            `baseUrl DNS validation returned no addresses for "${hostname}". ` +
                'Set allowPrivateHosts: true to allow deployments where DNS validation is not applicable.',
        );
    }

    for (const lookup of lookups) {
        if (isPrivateOrLoopbackIP(lookup.address, lookup.family)) {
            throw new TestRailValidationError(
                `baseUrl resolves to a private/loopback host ("${hostname}" -> "${lookup.address}"). ` +
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
    private readonly dnsLookup: DnsLookupFn | undefined;

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
            process.emitWarning(
                'maxCacheSize is set to 0 (unlimited). ' +
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
        this.dnsLookup = config.dnsLookup;

        if (config.allowInsecure === true && new URL(config.baseUrl).protocol === 'http:') {
            process.emitWarning(
                '[testrail-api-client] allowInsecure is enabled. ' +
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

    /**
     * Sliding window rate limiter. Always prunes timestamps outside the window
     * and records the current request so the window count stays accurate.
     *
     * Accounting unit: the window records **one slot per distinct upstream
     * request**, not per caller. Concurrent callers that share the same cache
     * key and receive an in-flight promise via the `pendingRequests` early
     * return in {@link executePipeline} (and `request`) are coalesced into that
     * single upstream request and are intentionally NOT recorded separately —
     * they issue no new network call, so charging them a slot would over-count
     * the actual load placed on TestRail. This is pre-existing behavior, by
     * design; the window measures upstream requests, not per-caller fan-in.
     *
     * Transient overshoot at tight limits: because retries are recorded but not
     * rejected (see `enforce` below), the recorded in-window count can briefly
     * exceed `maxRequests` by up to `maxRetries` slots. This is intended —
     * retries are continuations of an already-admitted request, not new
     * admissions, so they are not gated even when the window is at capacity.
     *
     * @param enforce - When `true` (initial attempt), throws if the window is
     *   already at capacity. When `false` (a retry of an already-admitted
     *   request), the request is still recorded but the admission throw is
     *   skipped: a retry must not be rejected with a local 429, which would
     *   mask the server-side condition that triggered the retry.
     * @throws {TestRailApiError} when `enforce` and the limit is exceeded
     */
    private checkRateLimit(enforce: boolean): void {
        const now = Date.now();
        const windowStart = now - this.rateLimiter.windowMs;

        // Clean old requests outside the window
        this.rateLimiter.requests = this.rateLimiter.requests.filter((time) => time > windowStart);

        if (enforce && this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
            // requests[] is push-appended and order-preserving-filtered, so it is
            // always ascending — the oldest in-window timestamp is requests[0].
            // This branch only runs when length >= maxRequests (>= 1, validated),
            // so the array is non-empty; `?? now` only satisfies the index type.
            const oldestRequest = this.rateLimiter.requests[0] ?? now;
            const waitTime = oldestRequest + this.rateLimiter.windowMs - now;
            throw new TestRailApiError(429, 'Too Many Requests', {
                message: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`,
                waitTimeMs: waitTime,
            });
        }

        this.rateLimiter.requests.push(now);
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

        // Re-setting an already-present key must not trip eviction: Map.set on
        // an existing key updates in place without growing size, so evicting the
        // oldest entry first would drop an innocent entry and leave the cache
        // below capacity. Delete the key first so the set below is a clean insert.
        //
        // The re-set is genuinely reachable, not theoretical: a `skipRead: true`
        // retry re-runs the success path and re-sets the same cacheKey, and a
        // concurrent (non-coalesced) request can populate that key between the
        // initial attempt and the retry's write. This guard defends that race —
        // it's a real defensive correctness fix, not an unreachable branch.
        if (this.cache.has(cacheKey)) {
            this.cache.delete(cacheKey);
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
     * Executes a single HTTP request against the TestRail API. The behavior of
     * each call is driven by the {@link RequestSpec} record (response kind,
     * body shape, schema, retry policy). Modules dispatch every API call
     * through this method.
     *
     * Behavioural guarantees (preserved verbatim across the refactor):
     *
     *   - GET responses are cached. Adding `spec.schema` switches the cache to
     *     the `PARSED:GET:{endpoint}` namespace so a raw response and a
     *     validated response for the same endpoint never collide.
     *     Schema-invalid responses are never cached.
     *   - Writes (non-GET) clear the entire cache before parsing.
     *   - DNS revalidation runs fresh on every call.
     *   - Identical in-flight GETs are coalesced (SEC #23).
     *   - Retry contract: 429 retries for all methods; 5xx + network errors
     *     retry only on GET; `'binaryGet'` retries 5xx/network always;
     *     `'none'` (multipart uploads) never retries.
     *   - `Retry-After` is honored on every retryable response, capped at
     *     {@link MAX_RETRY_DELAY_MS}.
     *   - 3xx is surfaced as `TestRailApiError`, never followed, never cached.
     *   - Response-body byte cap + wall-clock deadline apply to every fetch.
     *
     * @throws {TestRailApiError} On any HTTP error, network error, rate-limit
     *                            hit, timeout, oversized body, or redirect.
     * @throws {TestRailValidationError} When a `schema` is supplied and the
     *                                   response does not conform.
     * @throws {Error} When called after `destroy()`.
     */
    public async request<T>(spec: RequestSpec<T>): Promise<T> {
        const { method, endpoint, body, schema, responseKind = 'json', retry = 'full' } = spec;

        // Cache key namespace selection — preserves the prior split where the
        // raw `request<T>()` and the validated `requestParsed<T>()` lived in
        // separate namespaces (`GET:` vs `PARSED:GET:`). Without that split a
        // raw response could be returned unvalidated, or a Zod-transformed
        // value could surface to a raw-bytes caller.
        let cacheKey: string | undefined;
        if (method === 'GET' && responseKind === 'json') {
            cacheKey = schema !== undefined ? `PARSED:GET:${endpoint}` : `GET:${endpoint}`;
        }

        // When a schema is supplied, validation gates the cache write so a
        // malformed response never poisons the cache. We replicate the
        // historical `requestParsed` flow here: parse the body unvalidated,
        // then run Zod, then write the validated value to the cache.
        // Without a schema, the pipeline writes the parsed body directly.
        const writeValidatedAfterPipeline = schema !== undefined && method === 'GET' && responseKind === 'json';

        // Custom check for in-flight coalescing for the validated case. The
        // pipeline's own coalescing uses `cacheKey` against `pendingRequests`;
        // for the validated path we register the *validated* Promise so two
        // concurrent getProject(1) calls share Zod work rather than re-parsing
        // the same body twice. Mirror of the prior requestParsed behavior.
        if (writeValidatedAfterPipeline && cacheKey !== undefined) {
            if (this.isDestroyed) {
                throw new Error('Cannot use TestRailClient after destroy() has been called');
            }
            const cached = this.getCachedData<T>(cacheKey);
            if (cached !== undefined) return cached;
            const existing = this.pendingRequests.get(cacheKey) as Promise<T> | undefined;
            if (existing !== undefined) return existing;
        }

        const validatedPromise: Promise<T> = (async () => {
            if (responseKind === 'binary') {
                return this.executeBinary<T>(endpoint, retry);
            }
            if (responseKind === 'text') {
                return this.executeText<T>(method, endpoint, body, retry);
            }
            // JSON
            if (writeValidatedAfterPipeline && schema !== undefined) {
                // Validated GET: run the pipeline with NO cache (it would
                // otherwise write the raw body); validate; cache the result.
                const raw = await this.executeJson<unknown>(method, endpoint, body, retry, undefined);
                const validated = this.parse<T>(schema, raw);
                if (cacheKey !== undefined) {
                    this.setCachedData(cacheKey, validated);
                }
                return validated;
            }
            // Validated POST (non-cached) or raw JSON path.
            const result = await this.executeJson<T>(method, endpoint, body, retry, cacheKey);
            if (schema !== undefined) {
                return this.parse<T>(schema, result);
            }
            return result;
        })();

        if (writeValidatedAfterPipeline && cacheKey !== undefined) {
            this.pendingRequests.set(cacheKey, validatedPromise);
            validatedPromise
                .finally(() => {
                    this.pendingRequests.delete(cacheKey);
                })
                .catch(() => {});
        }

        return validatedPromise;
    }

    /**
     * JSON pipeline (`responseKind: 'json'`). Builds the JSON `PipelineSpec`
     * and delegates to {@link executePipeline}. The caller controls cache key
     * directly because the validated-GET path needs to skip the pipeline's
     * built-in cache write.
     */
    private async executeJson<T>(
        method: string,
        endpoint: string,
        body: RequestSpec<unknown>['body'],
        retry: 'full' | 'binaryGet' | 'none',
        cacheKey: string | undefined,
    ): Promise<T> {
        const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: this.bodyTimeout };
        const pipelineSpec: PipelineSpec<T> = {
            method,
            endpoint,
            body: this.buildPipelineBody(body),
            sendJsonContentType: body?.kind !== 'multipart',
            retryPolicy: getRetryPolicy(retry),
            cache: { key: cacheKey, skipRead: false },
            parseSuccess: async (response: Response) => {
                const responseText = await readBodyAsText(response, jsonLimits);
                if (!responseText) return {} as T;
                try {
                    return JSON.parse(responseText) as T;
                } catch {
                    throw new TestRailApiError(0, 'Invalid JSON response from TestRail API');
                }
            },
            ...this.cacheInvalidationHook(method, body),
        };
        return this.executePipeline<T>(pipelineSpec);
    }

    /**
     * Cache-invalidation hook shared by the JSON and text pipelines. Any write
     * (non-GET) or multipart upload flushes the entire GET cache before the
     * response is parsed; a plain GET returns an empty spread so reads never
     * clear the cache.
     */
    private cacheInvalidationHook(
        method: string,
        body: RequestSpec<unknown>['body'],
    ): { onSuccessBeforeParse?: () => void } {
        return method !== 'GET' || body?.kind === 'multipart'
            ? {
                  onSuccessBeforeParse: (): void => {
                      this.clearCache();
                  },
              }
            : {};
    }

    /**
     * Text pipeline (`responseKind: 'text'`). Returns the raw response body
     * as a `string`. Used for the BDD endpoint (`get_bdd/{case_id}`), which
     * returns a Gherkin `.feature` file as `text/plain`. Intentionally
     * bypasses the GET cache so its key cannot collide with a JSON
     * `request<T>()` to the same endpoint.
     */
    private async executeText<T>(
        method: string,
        endpoint: string,
        body: RequestSpec<unknown>['body'],
        retry: 'full' | 'binaryGet' | 'none',
    ): Promise<T> {
        const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: this.bodyTimeout };
        return this.executePipeline<T>({
            method,
            endpoint,
            body: this.buildPipelineBody(body),
            sendJsonContentType: body?.kind !== 'multipart',
            retryPolicy: getRetryPolicy(retry),
            cache: { key: undefined, skipRead: false },
            parseSuccess: async (response: Response) => (await readBodyAsText(response, jsonLimits)) as T,
            ...this.cacheInvalidationHook(method, body),
        });
    }

    /**
     * Binary pipeline (`responseKind: 'binary'`). Returns the response body
     * as `ArrayBuffer`. GET-only by construction (the retry policy assumes a
     * safe retry on 5xx/network).
     */
    private async executeBinary<T>(endpoint: string, retry: 'full' | 'binaryGet' | 'none'): Promise<T> {
        return this.executePipeline<T>({
            method: 'GET',
            endpoint,
            body: { kind: 'none' },
            sendJsonContentType: false,
            retryPolicy: getRetryPolicy(retry),
            cache: { key: undefined, skipRead: false },
            parseSuccess: async (response: Response) => {
                const bytes = await readBodyWithLimits(response, {
                    maxBytes: this.maxBinaryResponseBytes,
                    deadlineMs: this.bodyTimeout,
                });
                const buf =
                    bytes.byteLength === bytes.buffer.byteLength
                        ? (bytes.buffer as ArrayBuffer)
                        : (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
                return buf as T;
            },
        });
    }

    /**
     * Converts a {@link RequestBody} (the public-to-modules shape) into the
     * pipeline-internal {@link BodyShape}. Multipart bodies are wrapped in
     * the streaming builder that drives `node:fs.openAsBlob` for path inputs
     * and closes the caller-supplied fd in `finally`.
     */
    private buildPipelineBody(body: RequestSpec<unknown>['body']): PipelineSpec<unknown>['body'] {
        if (body === undefined) {
            return { kind: 'none' };
        }
        if (body.kind === 'json') {
            return { kind: 'json', data: body.data };
        }
        return this.buildMultipartBody(body.file, body.filename);
    }

    /**
     * Constructs the streaming-multipart body builder. Mirrors the original
     * `requestMultipart` lifecycle exactly: the caller-supplied fd is tracked
     * locally (never mutated, SEC #30), `/dev/fd/<N>` or `/proc/self/fd/<N>`
     * are used on POSIX to allow `openAsBlob` to take over the descriptor,
     * and the cleanup function in `finally` closes the fd if it was never
     * transferred to the kernel.
     */
    private buildMultipartBody(file: UploadFileInput, filename: string): PipelineSpec<unknown>['body'] {
        // Track the caller-supplied fd locally so we never mutate the input
        // descriptor (SEC #30 — immutability). `fdToClose` is set to undefined
        // as soon as we close the fd so cleanup never double-closes.
        let fdToClose: number | undefined = isFilePathInput(file) ? file.fd : undefined;
        return {
            kind: 'formdata',
            build: async () => {
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
                        if (fdToClose !== undefined) {
                            if (process.platform === 'darwin') {
                                uploadPath = `/dev/fd/${fdToClose}`;
                            } else if (process.platform === 'linux') {
                                uploadPath = `/proc/self/fd/${fdToClose}`;
                            } else {
                                // Non-POSIX: use the original path directly; close the
                                // fd now since /dev/fd symlinks aren't available.
                                try {
                                    closeSync(fdToClose);
                                } catch {
                                    // best-effort
                                }
                                fdToClose = undefined; // prevent duplicate close in cleanup
                            }
                        }

                        blob = await openAsBlob(uploadPath, opts);

                        // `/dev/fd/<N>` and `/proc/self/fd/<N>` are kernel-resolved
                        // symlinks: the OS dereferenced the symlink and opened a new,
                        // independent file description to the same inode. Our original
                        // fd N is now redundant — close it early to shrink the
                        // concurrent-fd window (SEC #30). If openAsBlob threw above,
                        // this block is never reached and cleanup closes fd N.
                        if (fdToClose !== undefined) {
                            try {
                                closeSync(fdToClose);
                            } catch {
                                // best-effort cleanup
                            }
                            fdToClose = undefined;
                        }
                    } else if (file instanceof globalThis.Blob) {
                        blob = file;
                    } else {
                        // Copy binary-like input into a plain Uint8Array to satisfy BlobPart type constraints
                        blob = new globalThis.Blob([new Uint8Array(file)]);
                    }
                    formData.append('attachment', blob, filename);

                    return {
                        // By the time this `cleanup` runs (via executePipeline's
                        // `finally`), the caller-supplied fd has already been closed and
                        // `fdToClose` reset to undefined on every path that reaches this
                        // return: on POSIX after `openAsBlob` succeeds (the early-close
                        // block above), on non-POSIX before `openAsBlob`, and in the
                        // `catch (buildErr)` arm before it rethrows (so this object is
                        // never returned in that case). There is therefore no fd left to
                        // close here — cleanup is an intentional no-op. The descriptor is
                        // still tracked so the `catch` arm can close it if build throws.
                        body: formData,
                        cleanup: () => undefined,
                    };
                } catch (buildErr) {
                    // If build throws before returning cleanup, close the fd here
                    // so executePipeline's formdataCleanup?.() (undefined) doesn't leak.
                    if (fdToClose !== undefined) {
                        try {
                            closeSync(fdToClose);
                        } catch {
                            // best-effort
                        }
                        fdToClose = undefined;
                    }
                    throw buildErr;
                }
            },
        };
    }

    /**
     * Shared HTTP pipeline: DNS validation, rate limiting, fetch, redirect guard,
     * error-body read, retry (via spec.retryPolicy), success parse, cache write.
     *
     * Cache semantics (spec.cache):
     *   key === undefined  — no cache participation at all.
     *   key set, skipRead false  — read + coalesce + write on success.
     *   key set, skipRead true   — skip read/coalesce; still write on success.
     *     Used on retry to avoid a deadlock where the retry looks up pendingRequests
     *     and finds the still-pending parent promise.
     */
    private async executePipeline<TParsed>(spec: PipelineSpec<TParsed>, retryCount = 0): Promise<TParsed> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        await this.awaitDnsValidation();

        const { key: cacheKey, skipRead } = spec.cache;

        if (cacheKey !== undefined && !skipRead) {
            const cached = this.getCachedData<TParsed>(cacheKey);
            if (cached !== undefined) return cached;

            // Coalesce concurrent identical requests (SEC #23): return the
            // in-flight promise instead of starting a new upstream request.
            // Callers served here share the already-admitted upstream request
            // and are intentionally NOT charged a separate rate-limit slot —
            // checkRateLimit below is skipped on this path. The window records
            // one slot per distinct upstream request, not per coalesced caller
            // (see checkRateLimit's accounting-unit note).
            const existing = this.pendingRequests.get(cacheKey) as Promise<TParsed> | undefined;
            if (existing !== undefined) return existing;
        }

        // Enforce admission only on the initial attempt. A retry of an
        // already-admitted request is still recorded (so the sliding-window
        // count stays accurate and server-side limits are respected) but must
        // not be rejected by a local 429, which would mask the server 5xx/429
        // that triggered the retry.
        this.checkRateLimit(retryCount === 0);

        const url = `${this.baseUrl}/index.php?/api/v2/${spec.endpoint}`;
        const headers: Record<string, string> = {
            Authorization: `Basic ${this.auth}`,
            'User-Agent': USER_AGENT,
        };
        if (spec.sendJsonContentType) {
            headers['Content-Type'] = 'application/json';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const retrySpec: PipelineSpec<TParsed> = { ...spec, cache: { key: cacheKey, skipRead: true } };

        const fetchPromise: Promise<TParsed> = (async () => {
            let formdataCleanup: (() => void) | undefined;
            try {
                const options: RequestInit = {
                    method: spec.method,
                    headers,
                    signal: controller.signal,
                    // BACKLOG #4: never follow redirects automatically. The SSRF guard
                    // validates the *initial* hostname only; a 3xx Location pointing at
                    // a private/metadata IP would otherwise bypass it.
                    redirect: 'manual',
                };
                if (spec.body.kind === 'json') {
                    options.body = JSON.stringify(spec.body.data);
                } else if (spec.body.kind === 'formdata') {
                    const built = await spec.body.build();
                    options.body = built.body;
                    formdataCleanup = built.cleanup;
                }
                // kind === 'none': no body

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
                        if (bodyErr instanceof TestRailApiError) throw bodyErr;
                        errorText = 'Unknown error';
                    }

                    const { status } = response;
                    if (spec.retryPolicy.isStatusRetryable(status, spec.method) && retryCount < this.maxRetries) {
                        const retryAfterMs = this.parseRetryAfterMs(response);
                        const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
                        await sleep(delay);
                        return this.executePipeline<TParsed>(retrySpec, retryCount + 1);
                    }

                    // The raw server body may contain stack traces, internal paths,
                    // or secret values. Keep it in the structured `response` field for
                    // programmatic inspection but do not embed it in the message string,
                    // which callers commonly pass to loggers.
                    throw new TestRailApiError(status, response.statusText, errorText);
                }

                spec.onSuccessBeforeParse?.();
                const result = await spec.parseSuccess(response);
                if (cacheKey !== undefined) {
                    this.setCachedData(cacheKey, result);
                }
                return result;
            } catch (error) {
                clearTimeout(timeoutId);

                if (error instanceof TestRailApiError) throw error;

                if ((error as Error).name === 'AbortError') {
                    throw new TestRailApiError(408, `Request timeout after ${this.timeout}ms`);
                }

                if (spec.retryPolicy.isNetworkErrorRetryable(spec.method) && retryCount < this.maxRetries) {
                    await sleep(this.getRetryDelay(retryCount));
                    return this.executePipeline<TParsed>(retrySpec, retryCount + 1);
                }

                throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
            } finally {
                formdataCleanup?.();
            }
        })();

        // Register the in-flight promise so concurrent callers with the same
        // cache key (and skipRead=false) share this single fetch (SEC #23).
        // Remove on settle so rejections don't permanently block a cache key.
        if (cacheKey !== undefined && !skipRead) {
            this.pendingRequests.set(cacheKey, fetchPromise);
            // Suppress the rejection on the cleanup chain; callers own the
            // returned promise and are responsible for catching it.
            fetchPromise
                .finally(() => {
                    this.pendingRequests.delete(cacheKey);
                })
                .catch(() => {});
        }

        return fetchPromise;
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
        await validatePublicHost(this.hostname, this.dnsLookup);
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
}
