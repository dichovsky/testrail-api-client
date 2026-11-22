import { ZodError } from 'zod';
import type { PaginationErrorReason } from './pagination.js';
import { MAX_SANITIZED_CAUSE_DEPTH } from './constants.js';

/**
 * Thrown when communication with TestRail fails, or when the client cannot use
 * a successful response safely. Causes include non-2xx responses, network and
 * body-processing failures, and unrecognized outer response structures. The
 * optional `response` keeps the raw server value for programmatic inspection.
 * Callers should not put `response` in logs, because it can contain instance
 * data.
 */
export class TestRailApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly response?: unknown,
        options?: ErrorOptions,
    ) {
        super(`TestRail API error: ${status} ${statusText}`, options);
        this.name = 'TestRailApiError';
    }
}

/**
 * Builds the status-0 {@link TestRailApiError} for a failure below HTTP. For
 * example: a refused or reset connection, a TLS or DNS failure, or a body that
 * stops mid-stream. The function keeps `reason` as `cause`, because Node
 * reports most of these failures only as "fetch failed". Node puts the
 * actionable detail on the original error.
 * Pass `options.cause` when `reason` came from caller code (see
 * {@link sanitizedCause}). In `options`, an `undefined` cause means "attach
 * none". It never means "fall back to `reason`".
 */
export function networkError(reason: unknown, context = '', options?: { readonly cause: unknown }): TestRailApiError {
    const message = `${context}${reason instanceof Error ? reason.message : String(reason)}`;
    const cause = options === undefined ? reason : options.cause;
    return new TestRailApiError(0, `Network error: ${message}`, message, cause === undefined ? undefined : { cause });
}

const dnsLookupFailures = new WeakSet<object>();

/**
 * Builds the network error for a DNS lookup that failed or returned no
 * addresses. The function marks the error, so that {@link isDnsLookupFailure}
 * can identify it among other network failures.
 */
export function dnsLookupError(reason: unknown, hostname: string): TestRailApiError {
    const error = networkError(reason, `DNS lookup failed for "${hostname}": `);
    dnsLookupFailures.add(error);
    return error;
}

/**
 * Returns true when `error` is the client error for a failed DNS lookup. The
 * function compares object identity, not message text.
 */
export function isDnsLookupFailure(error: unknown): boolean {
    return typeof error === 'object' && error !== null && dnsLookupFailures.has(error);
}

const SAFE_CAUSE_FIELDS = ['code', 'errno', 'syscall'] as const;

/**
 * Returns a plain copy of a failure that caller-supplied code raised, for
 * example a custom `fetch`. The copy contains the string name, the message, and
 * the primitive `code`, `errno`, and `syscall` values. The function copies
 * `cause` in the same way, recursively.
 * HTTP adapters often put the request that they received into their errors, and
 * the client passes the Authorization header to `fetch` in `init.headers`.
 * If the client attached the raw object, that credential would be visible to
 * any logger that walks the cause chain. The function drops non-Error objects
 * and functions. It keeps primitives.
 */
export function sanitizedCause(reason: unknown, depth = 0): unknown {
    if (!(reason instanceof Error)) {
        return (typeof reason === 'object' && reason !== null) || typeof reason === 'function' ? undefined : reason;
    }
    const nested =
        depth < MAX_SANITIZED_CAUSE_DEPTH && reason.cause !== undefined
            ? { cause: sanitizedCause(reason.cause, depth + 1) }
            : undefined;
    // An AggregateError (one connect failure per address) keeps its members,
    // copied the same way, because they hold the only actionable detail.
    const copy =
        reason instanceof AggregateError
            ? new AggregateError(
                  depth < MAX_SANITIZED_CAUSE_DEPTH
                      ? (reason.errors as readonly unknown[]).map((member) => sanitizedCause(member, depth + 1))
                      : [],
                  reason.message,
                  nested,
              )
            : new Error(reason.message, nested);
    const name: unknown = reason.name;
    if (typeof name === 'string') copy.name = name;
    for (const field of SAFE_CAUSE_FIELDS) {
        const value: unknown = Reflect.get(reason, field);
        if (typeof value === 'string' || typeof value === 'number') {
            Object.defineProperty(copy, field, { value, enumerable: true });
        }
    }
    return copy;
}

/**
 * Thrown when TestRail rejects a request because the instance does not have the
 * required Enterprise license or subscription. TestRail returns HTTP 403 with a
 * body such as "Not an Enterprise license/subscription." (live-audit findings
 * B.22/B.33). This class is a subclass of {@link TestRailApiError}, so existing
 * `catch (TestRailApiError)` handlers still catch it. Callers that want to branch
 * on the license restriction specifically can use
 * `instanceof TestRailLicenseError`.
 */
export class TestRailLicenseError extends TestRailApiError {
    constructor(status: number, statusText: string, response?: unknown) {
        super(status, statusText, response);
        this.name = 'TestRailLicenseError';
    }
}

/**
 * Matches the TestRail 403 bodies for an Enterprise license or subscription.
 * TestRail uses two phrasings for the same condition. The phrasing changes with
 * the endpoint:
 *
 *   get_variables / get_datasets → `"Not an Enterprise license/subscription."`
 *   get_case_statuses            → `"You do not have permission to access this
 *                                    endpoint (Requires Enterprise license…"`
 *
 * An earlier pattern anchored on `not an enterprise …` and matched only the
 * first phrasing. Thus `getCaseStatuses()` threw a plain `TestRailApiError` on a
 * non-Enterprise instance. Callers that branch on `instanceof TestRailLicenseError`
 * to degrade gracefully did not catch that error. The pattern now accepts both
 * lead-ins.
 *
 * The pattern intentionally does not match the bare `enterprise licen…` stem.
 * The body can be an arbitrary document (a corporate proxy's HTML 403 page) or
 * can echo an entity name (a project called "Enterprise Licensing"). Either body
 * would then classify as a license restriction. A caller that branches on
 * `instanceof TestRailLicenseError` would then disable a feature permanently
 * because of a transient ACL problem. Thus the pattern prefers strictness: a
 * missed phrasing degrades to a plain {@link TestRailApiError}, which is the 5.x
 * behavior.
 */
const LICENSE_RESTRICTION_RE = /(?:not an|requires)\s+enterprise (?:licen|subscription)/i;

/**
 * Returns true when an HTTP error is a TestRail Enterprise license or
 * subscription restriction. Such an error has status 403 and a body that names
 * an Enterprise license or subscription. `body` is the raw response text. The
 * function parses `body` leniently. If `body` is not JSON or has no string
 * `error` field, the function matches the raw text. Thus a non-JSON body or a future wrapper shape
 * still classifies correctly. The match stays narrow, so ordinary 403 responses
 * (permission denials that do not mention Enterprise licensing) stay plain
 * {@link TestRailApiError} errors.
 */
export function isLicenseRestriction(status: number, body: unknown): boolean {
    if (status !== 403 || typeof body !== 'string') {
        return false;
    }
    try {
        const parsed: unknown = JSON.parse(body);
        if (parsed !== null && typeof parsed === 'object' && 'error' in parsed) {
            const errorValue: unknown = parsed.error;
            if (typeof errorValue === 'string') {
                return LICENSE_RESTRICTION_RE.test(errorValue);
            }
        }
    } catch {
        // Non-JSON body — fall through to matching the raw text below.
    }
    return LICENSE_RESTRICTION_RE.test(body);
}

/**
 * Thrown when client configuration or method parameters fail validation.
 */
export class TestRailValidationError extends Error {
    constructor(
        message: string,
        public readonly details?: unknown,
    ) {
        super(`TestRail Validation Error: ${message}`);
        this.name = 'TestRailValidationError';
    }
}

/**
 * Thrown when a bounded multi-page read cannot complete safely. HTTP and
 * network failures stay {@link TestRailApiError} errors. This subtype is for
 * client-side failures of page structure, continuation, and aggregation policy.
 */
export class TestRailPaginationError extends TestRailValidationError {
    constructor(
        public readonly reason: PaginationErrorReason,
        message: string,
        public readonly pagesFetched: number,
        public readonly itemsFetched: number,
        context: Readonly<Record<string, string | number | boolean | null>> = {},
    ) {
        super(message, { reason, pagesFetched, itemsFetched, ...context });
        this.name = 'TestRailPaginationError';
    }
}

/**
 * Converts a `ZodError` into a `TestRailValidationError`.
 */
export function handleZodError(error: ZodError): TestRailValidationError {
    return new TestRailValidationError('Schema validation failed', error.format());
}
