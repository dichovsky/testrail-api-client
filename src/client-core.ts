import type { TestRailConfig, SchemaMismatch } from './types.js';
import { base64Encode } from './utils.js';
import { TestRailApiError, TestRailLicenseError, TestRailValidationError, isLicenseRestriction } from './errors.js';
import pkg from '../package.json' with { type: 'json' };
import { isIP } from 'node:net';
import { type ZodType } from 'zod';
import type { PipelineSpec, RequestSpec, RetryPolicy } from './http-pipeline-types.js';
import { deriveRetryPolicy } from './retry-policy.js';
import { RequestCache, type CacheLoadResult } from './request-cache.js';
import { isPrivateHostLiteral, isPrivateOrLoopbackIP, validateTestRailConfig } from './config-validation.js';
import {
    startOperation,
    observeOperation,
    engageOperationTracking,
    type OperationHandle,
} from './operation-tracking.js';
import { createUploadSource } from './upload-source.js';
import { budgetExpiredError, createRequestBudget, type RequestBudget } from './request-budget.js';

// Built from the package *name*, not `pkg.description`, which embedded literal
// spaces ("Type-safe ESM TestRail API client and CLI for Node.js/8.0.0").
// RFC 7231 §5.5.3 models User-Agent as product tokens separated by whitespace,
// so a value containing spaces reads as several products and makes upstream
// attribution meaningless.
//
// The npm scope is dropped rather than documented as an exception: RFC 7230
// §3.2.6 excludes `@` and `/` from `tchar`, so `@dichovsky/testrail-api-client`
// would leave the header non-conforming and add a second `/` that makes
// `product/version` ambiguous to parse. `testrail-api-client/8.0.0` is a valid
// product token, and the scope carries no information a server could use.
const USER_AGENT = `${pkg.name.replace(/^@[^/]+\//, '')}/${pkg.version}`;
import {
    BASE_RETRY_DELAY_MS,
    MAX_RETRY_DELAY_MS,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_MAX_RETRIES,
    DEFAULT_CACHE_TTL_MS,
    DEFAULT_CACHE_CLEANUP_INTERVAL_MS,
    DEFAULT_MAX_CACHE_SIZE,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_WINDOW_MS,
    DEFAULT_MAX_JSON_RESPONSE_BYTES,
    DEFAULT_MAX_BINARY_RESPONSE_BYTES,
} from './constants.js';
import { readBodyWithLimits, readBodyAsText } from './body-reader.js';
import { validateTimeout } from './validation.js';

// SSRF guard. All requests carry a full Authorization header, making the client
// a credentialed probe for internal services when baseUrl is attacker-controlled.
// Address classification lives in config-validation (one BlockList shared with
// the construction-time literal check). validatePublicHost() resolves the
// hostname and checks resulting IPs; resolution runs fresh before EVERY
// distinct upstream fetch (not for cache hits or joined callers, and with no
// caching of the construction-time result) so a DNS-rebinding attacker can't
// lock in a public answer once and then flip to a private target. DNS lookup
// errors are fail-closed — callers needing to operate without DNS validation
// must set allowPrivateHosts: true.

type DnsLookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

async function validatePublicHost(hostname: string, dnsLookup?: DnsLookupFn): Promise<void> {
    const bare = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
    const isPrivatePattern = isPrivateHostLiteral(bare);
    if (isPrivatePattern) {
        throw new TestRailValidationError(
            `baseUrl resolves to a private/loopback host ("${hostname}"). ` +
                'Set allowPrivateHosts: true to allow on-premise deployments.',
        );
    }

    // IP literals were classified by isPrivateHostLiteral above; no DNS needed.
    if (isIP(bare) !== 0) {
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
        if (isPrivateOrLoopbackIP(lookup.address)) {
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
 * Effective per-request timeouts resolved once in `request<T>()` and threaded
 * through the `execute*` helpers into the pipeline. `timeout` bounds the
 * DNS resolution plus the connect/send/response-headers phase; `bodyTimeout`
 * bounds the body read. DNS is inside the allowance deliberately: `dns.lookup`
 * has no deadline of its own, so leaving it outside made `timeout` unable to
 * bound the call at all. A caller using an aggressively short `timeout` on a
 * slow resolver can therefore be refused before any request is sent.
 */
interface ResolvedTimeouts {
    readonly timeout: number;
    readonly bodyTimeout: number;
    /** Shared by every retry of this call; see {@link RequestBudget}. */
    readonly budget: RequestBudget;
}

/**
 * Installs `fn` as an own, non-enumerable override of `obj[key]`. Typing `fn`
 * as `T[K]` (instead of the `value: any` a bare `Object.defineProperty` would
 * accept) keeps the override checked against the base method's signature, so a
 * future change to `request`/`clearCache`/`destroy` can't silently drift from
 * the view's delegating overrides. Used by `spawnTimeoutView`.
 */
function defineOverride<T, K extends keyof T>(obj: T, key: K, fn: T[K]): void {
    Object.defineProperty(obj, key, { value: fn, writable: true, configurable: true, enumerable: false });
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
    private readonly requestCache: RequestCache;
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
    /**
     * True when `config.bodyTimeout` was set explicitly. A `withTimeout(ms)`
     * view uses this to decide whether the body deadline should track the new
     * `timeout` (deadline was implicit) or stay pinned (deadline was explicit).
     */
    private readonly bodyTimeoutExplicit: boolean;
    /**
     * The state-owning client. On a normally constructed client this is `this`;
     * on a {@link TestRailClient.withTimeout} view it resolves (via the
     * prototype chain) to the real client so every request runs against the
     * shared request cache, rate limiter, and credential rather than the view.
     */
    protected readonly root: TestRailClientCore;
    private readonly fetchOverride: typeof globalThis.fetch | undefined;
    private readonly dnsLookup: DnsLookupFn | undefined;
    private readonly onSchemaMismatch: ((mismatch: SchemaMismatch) => void) | undefined;

    constructor(config: TestRailConfig) {
        validateTestRailConfig(config);
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        // URL already validated by validateTestRailConfig — this parse cannot throw.
        this.hostname = new URL(config.baseUrl).hostname;
        this.allowPrivateHosts = config.allowPrivateHosts === true;
        this.auth = base64Encode(`${config.email}:${config.apiKey}`);
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
        this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
        const enableCache = config.enableCache ?? true;
        const cacheCleanupInterval = config.cacheCleanupInterval ?? DEFAULT_CACHE_CLEANUP_INTERVAL_MS;
        // maxCacheSize=0 means unbounded and risks memory exhaustion.
        // Warn at construction time so callers are aware of the risk.
        if (config.maxCacheSize === 0 && (config.enableCache ?? true)) {
            process.emitWarning(
                'maxCacheSize is set to 0 (unlimited). ' +
                    'This can cause unbounded memory growth. Consider setting a positive limit.',
            );
        }
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
        this.bodyTimeoutExplicit = config.bodyTimeout !== undefined;
        this.root = this;
        this.fetchOverride = config.fetch;
        this.dnsLookup = config.dnsLookup;
        this.onSchemaMismatch = config.onSchemaMismatch;

        if (config.allowInsecure === true && new URL(config.baseUrl).protocol === 'http:') {
            process.emitWarning(
                '[testrail-api-client] allowInsecure is enabled. ' +
                    'HTTP transmits credentials in cleartext. Use HTTPS in production.',
            );
        }

        // DNS host validation runs fresh before every distinct upstream fetch
        // (see awaitDnsValidation).
        // Resolving once at construction would let a DNS-rebinding attacker pin a
        // public IP for the validation lookup and then flip to a private target
        // before fetch performs its own (independent) lookup. The sync literal check
        // in validateTestRailConfig already blocks private host literals.

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
        this.requestCache = new RequestCache({
            enableStorage: enableCache,
            ttlMs: config.cacheTtl ?? DEFAULT_CACHE_TTL_MS,
            cleanupIntervalMs: cacheCleanupInterval,
            maxEntries: config.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE,
        });
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
        const retryAfter = response.headers.get('Retry-After')?.trim();
        if (retryAfter === undefined || retryAfter === '') {
            return null;
        }

        // Try parsing as seconds (numeric value). `parseInt()` accepts a valid
        // numeric prefix, so enforce the RFC delay-seconds grammar first.
        const seconds = /^\d+$/.test(retryAfter) ? Number.parseInt(retryAfter, 10) : Number.NaN;
        if (!Number.isNaN(seconds) && seconds > 0) {
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
     * The SSRF guard (configuration checks + per-fetch DNS host validation)
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
     * key and receive an in-flight promise through {@link RequestCache} are
     * coalesced into that
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
    private checkRateLimit(enforce: boolean, now = Date.now()): void {
        const windowStart = now - this.rateLimiter.windowMs;

        // Clean old requests outside the window.
        //
        // This allocates a new array per request rather than splicing in
        // place, which looks like an obvious optimisation target. Measured
        // before changing anything: 802 ns/request at the default 100-request
        // window, 4 µs at 1,000, 35 µs at 10,000 — against a network round
        // trip of tens to hundreds of milliseconds. Even the 10,000 case is
        // four orders of magnitude below the call it gates. Splicing in place
        // would also mutate shared state, which this codebase does not do.
        // Leave it alone.
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

    /**
     * Builds a lightweight view of this client that applies `ms` as the request
     * timeout to every call, without constructing a second client. The view is
     * prototype-linked to the state-owning client (`root`): all reads (request
     * cache, rate-limiter window, credential) resolve to `root` through
     * the prototype chain, and the view is deliberately NOT registered in
     * `activeClients` — it has no independent lifecycle.
     *
     * Every public method that *reassigns* primitive instance state must be
     * delegated to `root`, because a bare `this.field = …` on the view would
     * create a shadow own-property instead of mutating `root`. Those methods are
     * `request` (injects the timeout), `clearCache`, and `destroy`; each is
     * routed to `root` so, e.g., `view.destroy()` zeroes the shared credential
     * and disables both the view and `root`, while `view.clearCache()`
     * invalidates the root-owned request cache. Reads need no override.
     *
     * The body-read deadline tracks the new timeout when `root.bodyTimeout` was
     * left implicit (mirrors the constructor's `bodyTimeout ?? timeout`); an
     * explicitly configured `bodyTimeout` is preserved.
     *
     * {@link TestRailClient.withTimeout} calls this and rebinds the domain
     * modules to the returned view so `view.cases.getCase(id)` routes through
     * the injected `request()`.
     *
     * @throws {TestRailValidationError} When `ms` is not a positive number ≤ 5 minutes
     */
    protected spawnTimeoutView(ms: number): this {
        validateTimeout(ms);
        const root = this.root;
        const bodyTimeout = root.bodyTimeoutExplicit ? root.bodyTimeout : ms;
        const view = Object.create(this) as this;
        defineOverride(view, 'request', <T>(spec: RequestSpec<T>): Promise<T> =>
            root.request<T>({ ...spec, timeout: ms, bodyTimeout }),
        );
        // Delegate the state-mutating lifecycle methods to `root` so calling
        // them on a view acts on the shared client instead of shadow-writing
        // the view's own (discarded) primitive fields.
        defineOverride(view, 'clearCache', (): void => root.clearCache());
        defineOverride(view, 'destroy', (): void => root.destroy());
        return view;
    }

    /**
     * Clears the entire cache.
     */
    public clearCache(): void {
        this.requestCache.invalidate();
    }

    /**
     * Run a callback with observable driver resource ownership. `result`
     * retains normal return values, errors, and deadlines. `settled` resolves
     * only after the callback and all started or joined DNS, fetch, body-read,
     * cancellation, upload-stream, retry, and coalesced work have finished.
     * A requested abort alone does not settle an operation. Late failures are
     * observed, and nested operations are included in their parent's lifetime.
     * This does not cancel requests or change destroy()'s behavior. A transport
     * or cancellation that never finishes keeps `settled` pending.
     *
     * The first call latches settlement tracking on for the process. A request
     * already in flight at that moment can be joined for its result but not for
     * its post-result cleanup; every request started afterwards is fully
     * joinable, tracked or not.
     */
    public trackOperation<T>(callback: () => T | PromiseLike<T>): OperationHandle<T> {
        // Latches scope creation for the process. Until the first call, requests
        // skip AsyncLocalStorage entirely so embedders that never track are not
        // charged for context propagation they cannot observe.
        engageOperationTracking();
        return startOperation(callback);
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
            this.requestCache.dispose();
        } finally {
            // Zero the credential and remove from registry unconditionally so a
            // cleanup failure leaves no stale entry and no recoverable
            // credential in the heap.
            this.auth = '';
            activeClients.delete(this);
        }
    }

    /**
     * Executes a single HTTP request against the TestRail API. The behavior of
     * each call is driven by the {@link RequestSpec} record (response kind,
     * body shape, schema, intent). Modules dispatch every API call through
     * this method.
     *
     * Behavioural guarantees (preserved verbatim across the refactor):
     *
     *   - GET responses are cached. Adding `spec.schema` switches the cache to
     *     the `PARSED:GET:{endpoint}` namespace so a raw response and a
     *     validated response for the same endpoint never collide.
     *   - Writes (non-GET) clear the entire cache before parsing.
     *   - DNS revalidation runs before every distinct upstream fetch.
     *   - Identical in-flight GETs are coalesced (SEC #23).
     *   - Retry contract, derived not declared: a multipart body never retries
     *     (it outranks every other input); a side-effecting read retries 429
     *     only; a binary GET retries 5xx/network always; otherwise 429 retries
     *     for all methods and 5xx + network errors retry only on GET.
     *   - `Retry-After` is honored on every retryable response, capped at
     *     {@link MAX_RETRY_DELAY_MS}.
     *   - 3xx is surfaced as `TestRailApiError`, never followed, never cached.
     *   - Response-body byte cap + wall-clock deadline apply to every fetch.
     *
     * A `schema` mismatch does **not** throw — see {@link parse}. The raw body
     * is returned and {@link TestRailConfig.onSchemaMismatch} is notified.
     *
     * @throws {TestRailApiError} On any HTTP error, network error, rate-limit
     *                            hit, timeout, oversized body, or redirect.
     * @throws {Error} When called after `destroy()`.
     */
    public async request<T>(spec: RequestSpec<T>): Promise<T> {
        const { method, endpoint, body, schema, responseKind = 'json', intent } = spec;

        // Derived, never declared. A multipart body is non-idempotent by
        // construction, so the policy follows from the request's shape instead
        // of from six call sites remembering to spell `retry: 'none'`.
        const retryPolicy = deriveRetryPolicy({ bodyKind: body?.kind, responseKind, intent });

        // Validate per-request overrides before they reach the abort timer /
        // body-read deadline. These `@internal` fields are set only by
        // `withTimeout()` (already validated), but validating at this single
        // chokepoint fail-fasts any future/direct caller so a NaN, ±Infinity,
        // negative, or over-cap value can't reintroduce the "after NaNms"
        // immediate-abort class of bug (#237). `bodyTimeout: 0` is the sanctioned
        // "no deadline" value and is left as-is.
        if (spec.timeout !== undefined) validateTimeout(spec.timeout);
        if (spec.bodyTimeout !== undefined && spec.bodyTimeout !== 0) validateTimeout(spec.bodyTimeout);
        if (
            spec.deadlineAt !== undefined &&
            (typeof spec.deadlineAt !== 'number' || !Number.isFinite(spec.deadlineAt))
        ) {
            throw new TestRailValidationError('deadlineAt must be a finite number');
        }
        // Resolve the effective timeouts once. A `withTimeout(ms)` view sets
        // `spec.timeout`/`spec.bodyTimeout`; a normal call leaves them undefined
        // and falls back to the client-wide values. Threaded into every pipeline
        // execution so the override reaches the abort timer and body-read deadline.
        //
        // The budget is created once here and shared by every retry, so time
        // already spent is never refunded. An ordinary call carries no aggregate
        // deadline and gets an unbounded budget, which answers with the caller's
        // configured values and never raises.
        const timeouts: ResolvedTimeouts = {
            timeout: spec.timeout ?? this.timeout,
            bodyTimeout: spec.bodyTimeout ?? this.bodyTimeout,
            budget: createRequestBudget({ deadlineAt: spec.deadlineAt }),
        };

        // Cache key namespace selection — preserves the prior split where the
        // raw `request<T>()` and the validated `requestParsed<T>()` lived in
        // separate namespaces (`GET:` vs `PARSED:GET:`), and adds `PAGE:` for
        // explicit pagination projections with a stricter response schema.
        // Without those splits a raw response could be returned unvalidated,
        // a Zod-transformed value could surface to a raw-bytes caller, or a
        // collection-only legacy wrapper could poison a Page<T> read.
        // Both intents mean "execute this read, don't serve or publish it":
        // a side-effecting GET must reach TestRail every time it is called, and
        // an aggregate page must not be combined with a differently aged one.
        let cacheKey: string | undefined;
        if (method === 'GET' && responseKind === 'json' && intent === undefined) {
            const variant = spec.cacheVariant === 'page' ? 'PAGE:' : '';
            cacheKey = schema !== undefined ? `${variant}PARSED:GET:${endpoint}` : `${variant}GET:${endpoint}`;
        }

        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        // The cache module owns read/coalesce/load/publish as one protocol. The
        // loader reports schema-match disposition so advisory mismatches remain
        // available to the caller without being pinned for the cache TTL.
        const load = async (): Promise<CacheLoadResult<T>> => {
            if (responseKind === 'binary') {
                return { value: await this.executeBinary<T>(endpoint, retryPolicy, timeouts), cacheable: false };
            }
            if (responseKind === 'text') {
                return {
                    value: await this.executeText<T>(method, endpoint, body, retryPolicy, timeouts),
                    cacheable: false,
                };
            }

            const raw = await this.executeJson<unknown>(method, endpoint, body, retryPolicy, timeouts);
            if (schema !== undefined) {
                const { value, matched } = this.parseAdvisory<T>(schema, raw, { method, endpoint });
                return { value, cacheable: cacheKey !== undefined && matched };
            }
            return { value: raw as T, cacheable: cacheKey !== undefined };
        };

        return this.requestCache.resolve({
            key: cacheKey,
            // Bounded initiators are not shared with later unbounded callers;
            // bounded waiters may still join an ordinary shared request.
            shareInFlight: !timeouts.budget.bounded,
            wait: (promise) => timeouts.budget.bound(promise),
            load,
        });
    }

    /**
     * JSON pipeline (`responseKind: 'json'`). Builds the JSON `PipelineSpec`
     * and delegates to {@link executePipeline}. Caching is deliberately outside
     * the transport pipeline and owned by {@link RequestCache}.
     */
    private async executeJson<T>(
        method: string,
        endpoint: string,
        body: RequestSpec<unknown>['body'],
        retryPolicy: RetryPolicy,
        timeouts: ResolvedTimeouts,
    ): Promise<T> {
        const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: timeouts.bodyTimeout };
        const pipelineSpec: PipelineSpec<T> = {
            method,
            endpoint,
            body: this.buildPipelineBody(body),
            sendJsonContentType: body?.kind !== 'multipart',
            timeout: timeouts.timeout,
            bodyTimeout: timeouts.bodyTimeout,
            budget: timeouts.budget,
            retryPolicy,
            parseSuccess: async (response: Response) => {
                const responseText = await readBodyAsText(response, {
                    ...jsonLimits,
                    deadlineMs: timeouts.budget.allowanceFor(timeouts.bodyTimeout),
                });
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
        retryPolicy: RetryPolicy,
        timeouts: ResolvedTimeouts,
    ): Promise<T> {
        const jsonLimits = { maxBytes: this.maxJsonResponseBytes, deadlineMs: timeouts.bodyTimeout };
        return this.executePipeline<T>({
            method,
            endpoint,
            body: this.buildPipelineBody(body),
            sendJsonContentType: body?.kind !== 'multipart',
            timeout: timeouts.timeout,
            bodyTimeout: timeouts.bodyTimeout,
            budget: timeouts.budget,
            retryPolicy,
            parseSuccess: async (response: Response) =>
                (await readBodyAsText(response, {
                    ...jsonLimits,
                    deadlineMs: timeouts.budget.allowanceFor(timeouts.bodyTimeout),
                })) as T,
            ...this.cacheInvalidationHook(method, body),
        });
    }

    /**
     * Binary pipeline (`responseKind: 'binary'`). Returns the response body
     * as `ArrayBuffer`. GET-only by construction (the retry policy assumes a
     * safe retry on 5xx/network).
     */
    private async executeBinary<T>(endpoint: string, retryPolicy: RetryPolicy, timeouts: ResolvedTimeouts): Promise<T> {
        return this.executePipeline<T>({
            method: 'GET',
            endpoint,
            body: { kind: 'none' },
            sendJsonContentType: false,
            timeout: timeouts.timeout,
            bodyTimeout: timeouts.bodyTimeout,
            budget: timeouts.budget,
            retryPolicy,
            parseSuccess: async (response: Response) => {
                const bytes = await readBodyWithLimits(response, {
                    maxBytes: this.maxBinaryResponseBytes,
                    deadlineMs: timeouts.budget.allowanceFor(timeouts.bodyTimeout),
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
     * pipeline-internal {@link BodyShape}. The descriptor lifetime of a
     * multipart body belongs entirely to `src/upload-source.ts`.
     */
    private buildPipelineBody(body: RequestSpec<unknown>['body']): PipelineSpec<unknown>['body'] {
        if (body === undefined) {
            return { kind: 'none' };
        }
        if (body.kind === 'json') {
            return { kind: 'json', data: body.data };
        }
        return createUploadSource(body.file, body.filename);
    }

    /**
     * Shared HTTP pipeline: DNS validation, rate limiting, fetch, redirect guard,
     * error-body read, retry (via spec.retryPolicy), and success parsing.
     * Request caching and coalescing live entirely in {@link RequestCache}.
     */
    private async executePipeline<TParsed>(spec: PipelineSpec<TParsed>, retryCount = 0): Promise<TParsed> {
        try {
            return await this.attemptPipeline<TParsed>(spec, retryCount);
        } catch (error) {
            // A multipart source captures the caller's descriptor when the spec
            // is built, but only releases it from inside `build()`. The
            // preamble below — destroyed client, DNS/SSRF rejection, a spent
            // budget — throws before `build()` runs, so without this the
            // descriptor leaks for the life of the process. Release is
            // idempotent, so a request that did build and clean up is
            // unaffected.
            if (spec.body.kind === 'formdata') spec.body.release();
            throw error;
        }
    }

    private async attemptPipeline<TParsed>(spec: PipelineSpec<TParsed>, retryCount = 0): Promise<TParsed> {
        if (this.isDestroyed) {
            throw new Error('Cannot use TestRailClient after destroy() has been called');
        }

        const url = `${this.baseUrl}/index.php?/api/v2/${spec.endpoint}`;
        const headers: Record<string, string> = {
            Authorization: `Basic ${this.auth}`,
            'User-Agent': USER_AGENT,
        };
        if (spec.sendJsonContentType) {
            headers['Content-Type'] = 'application/json';
        }

        const controller = new AbortController();
        const effectiveTimeout = spec.budget.allowanceFor(spec.timeout);
        const requestDeadlineAt = Date.now() + effectiveTimeout;
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        // The attempt timer starts before DNS, not after it. `dns.lookup`
        // resolves through `getaddrinfo` and carries no JS-visible deadline of
        // its own, so a resolver that drops packets rather than refusing them
        // would otherwise keep this call pending far past `timeout` — while
        // holding one of libuv's four default threadpool slots, starving
        // unrelated fs/crypto work in the host process.
        //
        // The lookup is not cancellable. Like the non-streaming body-read
        // fallback, it may still settle in the background; what it can no
        // longer do is extend the caller-visible wait.
        // `budget.bound` wraps the *raw* lookup so the aggregate deadline and
        // operation-settlement observation keep owning it: a caller tracking
        // the operation must stay un-settled until a late lookup finally
        // resolves or rejects, even though this attempt stopped waiting.
        try {
            await this.raceAttemptDeadline(
                spec.budget.bound(this.awaitDnsValidation()),
                spec.budget,
                controller.signal,
                effectiveTimeout,
            );
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }

        const fetchPromise: Promise<TParsed> = (async () => {
            let formdataCleanup: (() => void) | undefined;
            let receivedResponse: Response | undefined;
            let parsingResponse = false;
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

                // Admit only when an upstream request is actually about to be
                // invoked. DNS, cache lookup, multipart construction, and any
                // expired request/aggregate deadline therefore cannot consume
                // a limiter slot without a corresponding fetch.
                const admissionTime = Date.now();
                if (spec.budget.expiredBy(admissionTime)) {
                    throw budgetExpiredError();
                }
                if (controller.signal.aborted || admissionTime >= requestDeadlineAt) {
                    controller.abort();
                    throw new TestRailApiError(408, `Request timeout after ${effectiveTimeout}ms`);
                }
                // Enforce admission only on the initial attempt. A retry of an
                // already-admitted request is still recorded (so the
                // sliding-window count stays accurate and server-side limits
                // are respected) but must not be rejected by a local 429.
                this.checkRateLimit(retryCount === 0, admissionTime);

                const response: Response = await spec.budget.bound(
                    (this.fetchOverride ?? globalThis.fetch)(url, options).then((received) => {
                        receivedResponse = received;
                        // A custom fetch may ignore abort and return headers
                        // after its result deadline. Own the late body cleanup.
                        if (spec.budget.expired) {
                            this.cancelUnusedBody(received);
                        }
                        return received;
                    }),
                    () => controller.abort(),
                );
                // Headers received — header timeout has done its job. The body
                // read is bounded independently by readBodyWithLimits, so clearing
                // here does not re-open the slowloris-on-body window (SEC #21).
                clearTimeout(timeoutId);

                this.assertNotRedirect(response);

                // A successful write may already have committed upstream.
                // Invalidate GET state before clipping or reading the body can
                // throw, otherwise stale cached reads can survive a mutation.
                if (response.ok) {
                    spec.onSuccessBeforeParse?.();
                }

                const jsonLimits = {
                    maxBytes: this.maxJsonResponseBytes,
                    deadlineMs: spec.budget.allowanceFor(spec.bodyTimeout),
                };

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
                        await spec.budget.delay(delay);
                        return this.executePipeline<TParsed>(spec, retryCount + 1);
                    }

                    // The raw server body may contain stack traces, internal paths,
                    // or secret values. Keep it in the structured `response` field for
                    // programmatic inspection but do not embed it in the message string,
                    // which callers commonly pass to loggers.
                    //
                    // A 403 carrying TestRail's "Not an Enterprise license/subscription."
                    // body is surfaced as the TestRailLicenseError subclass so callers can
                    // branch on license gating (B.22/B.33); it still IS-A TestRailApiError,
                    // so existing handlers keep working.
                    if (isLicenseRestriction(status, errorText)) {
                        throw new TestRailLicenseError(status, response.statusText, errorText);
                    }
                    throw new TestRailApiError(status, response.statusText, errorText);
                }

                parsingResponse = true;
                return await spec.parseSuccess(response);
            } catch (error) {
                clearTimeout(timeoutId);

                // Success-body parsing historically returned its promise
                // directly; its failures must not become network retries.
                if (parsingResponse) throw error;

                if (error instanceof TestRailApiError) throw error;

                // `config.fetch` is public API, so the rejection reason is
                // whatever the caller's adapter produced and is not guaranteed
                // to be an Error. Reading `.name`/`.message` off a nullish
                // reason throws a TypeError out of this very catch block,
                // replacing the TestRailApiError the caller is entitled to.
                const cause = error instanceof Error ? error : new Error(String(error));

                if (cause.name === 'AbortError') {
                    throw spec.budget.expired
                        ? budgetExpiredError()
                        : new TestRailApiError(408, `Request timeout after ${effectiveTimeout}ms`);
                }

                if (spec.retryPolicy.isNetworkErrorRetryable(spec.method) && retryCount < this.maxRetries) {
                    await spec.budget.delay(this.getRetryDelay(retryCount));
                    return this.executePipeline<TParsed>(spec, retryCount + 1);
                }

                throw new TestRailApiError(0, `Network error: ${cause.message}`, cause.message);
            } finally {
                formdataCleanup?.();
                if (receivedResponse !== undefined) this.cancelUnusedBody(receivedResponse);
            }
        })();

        return fetchPromise;
    }

    /**
     * Races `work` against this attempt's abort signal so a phase that runs
     * before `fetch` cannot outlive the attempt's own allowance.
     *
     * `Promise.race` subscribes to `work`, so a rejection arriving after the
     * deadline already won is observed and cannot surface as an unhandled
     * rejection.
     */
    private raceAttemptDeadline<T>(
        work: Promise<T>,
        budget: RequestBudget,
        signal: AbortSignal,
        timeoutMs: number,
    ): Promise<T> {
        // An aggregate deadline and this attempt's own timer can come due in
        // the same tick, and the attempt timer is registered first. Defer to
        // the budget whenever it has expired so the caller that supplied the
        // deadline still recognises the failure as its own — the same
        // precedence the AbortError branch applies.
        const expired = (): TestRailApiError =>
            budget.expired ? budgetExpiredError() : new TestRailApiError(408, `Request timeout after ${timeoutMs}ms`);
        // Unreachable from the sole call site — its controller is constructed
        // three lines earlier and a `setTimeout` cannot fire before the next
        // synchronous statement. Kept anyway: `addEventListener('abort')` on an
        // already-aborted signal never invokes its listener, so a future second
        // call site would hang silently instead of failing. Catalogued as
        // unreachable branch #28 in vitest.config.ts.
        if (signal.aborted) {
            return Promise.reject(expired());
        }
        return Promise.race([
            work,
            new Promise<never>((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(expired()), { once: true });
            }),
        ]);
    }

    /** Observe cancellation of an unread response, including late headers and redirects. */
    private cancelUnusedBody(response: Response): void {
        const body = response.body;
        if (
            body === null ||
            body === undefined ||
            body.locked ||
            response.bodyUsed ||
            typeof body.cancel !== 'function'
        )
            return;
        try {
            void observeOperation(body.cancel()).catch(() => undefined);
        } catch {
            // Non-conforming response cleanup must not replace the result error.
        }
    }

    /**
     * Re-validates the baseUrl hostname against the public-IP allowlist before
     * each distinct upstream fetch. Performing the lookup immediately before
     * upstream work (rather than caching the construction-time result) eliminates
     * the window in which a DNS-rebinding authority could serve a public IP to
     * validation and a private IP to fetch.
     * Lookup errors are fail-closed; callers needing to operate without DNS
     * must set allowPrivateHosts: true.
     */
    private async awaitDnsValidation(): Promise<void> {
        if (this.allowPrivateHosts) return;
        await validatePublicHost(this.hostname, this.dnsLookup);
    }

    /**
     * Validates `data` against `schema` and returns it typed as `T`.
     *
     * **Response validation is advisory.** A mismatch does not throw: `data` is
     * returned unchanged and {@link TestRailConfig.onSchemaMismatch} fires with
     * the detail. Rationale — TestRail's published API contract disagrees with
     * its wire behavior on a recurring basis (a comment-only result sends
     * `status_id: null`; `mfa_required` sends integer `0`; several list
     * endpoints send a bare array where the docs promise a wrapper). Every
     * schema correction shipped by this package to date has *widened* a schema
     * to admit a valid TestRail response, and none has narrowed one to reject an
     * invalid one. Failing closed therefore only ever converted a working
     * response into an outage — and because list endpoints validate a whole
     * page at once, one unmodeled row discarded up to 250 valid ones.
     *
     * The hook is deliberately invoked outside the `safeParse` result handling,
     * so a hook that throws propagates to the caller. That is the supported
     * fail-closed opt-in (see {@link TestRailConfig.onSchemaMismatch}).
     *
     * Caller-supplied input is unaffected: client configuration is validated in
     * the constructor and CLI write payloads in `resolveBody()`, neither of
     * which routes through this method. Both still fail closed.
     *
     * @param schema Zod schema describing the expected response shape.
     * @param data   Raw parsed response body.
     * @param ctx    Originating request, forwarded to the mismatch hook. Required
     *               so a mismatch can always name the call that produced it — the
     *               direct callers (BDD, soft-delete previews) thread it by hand,
     *               and a destructive-op preview reporting an empty endpoint
     *               would be worse than useless.
     */
    public parse<T>(schema: ZodType, data: unknown, ctx: { method: string; endpoint: string }): T {
        return this.parseAdvisory<T>(schema, data, ctx).value;
    }

    /**
     * {@link parse} plus whether the body actually matched its schema.
     * `request()` uses the flag to skip the GET cache write on a mismatch:
     * caching a body the schema rejected would pin it — including the `{}` that
     * {@link executeJson} synthesizes for an empty 200 — for the full TTL,
     * turning a transient proxy blip into minutes of wrong-but-cached answers
     * with no further hook notifications.
     */
    private parseAdvisory<T>(
        schema: ZodType,
        data: unknown,
        ctx: { method: string; endpoint: string },
    ): { value: T; matched: boolean } {
        const result = schema.safeParse(data);
        if (result.success) return { value: result.data as T, matched: true };

        // Outside any try/catch on purpose: a throwing hook is the documented
        // way to restore fail-closed validation.
        const returned: unknown = this.root.onSchemaMismatch?.({
            method: ctx.method,
            endpoint: ctx.endpoint,
            error: result.error,
            data,
        });

        // An `async` hook satisfies the `void` return type but breaks every
        // guarantee the hook documents: a throw inside it becomes a rejected
        // promise, so strict mode silently fails open, and that rejection
        // escapes as an unhandled rejection — which terminates Node >= 15 by
        // default. Swallow the rejection and fail closed loudly instead. The
        // hook is caller-supplied configuration, so TestRailValidationError is
        // the right class.
        if (typeof (returned as PromiseLike<unknown> | undefined)?.then === 'function') {
            void (returned as PromiseLike<unknown>).then(undefined, () => {});
            throw new TestRailValidationError(
                'onSchemaMismatch must be synchronous — it returned a promise. An async hook ' +
                    'cannot restore fail-closed validation (its throw becomes a rejected promise) ' +
                    'and its rejection surfaces as an unhandled rejection. Do async work in a ' +
                    'fire-and-forget call inside a synchronous hook.',
            );
        }

        return { value: data as T, matched: false };
    }
}
