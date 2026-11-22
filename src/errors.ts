import { ZodError } from 'zod';
import type { PaginationErrorReason } from './pagination.js';
import { MAX_SANITIZED_CAUSE_DEPTH } from './constants.js';

/**
 * Thrown when communication with TestRail fails or a successful response cannot
 * be used safely. This includes non-2xx responses, network/body-processing
 * failures, and unrecognized outer response structures. The optional `response`
 * retains the raw server value for programmatic inspection; callers should not
 * expose it in logs because it can contain instance data.
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
 * Builds the status-0 {@link TestRailApiError} for a failure below HTTP: a
 * refused or reset connection, a TLS or DNS failure, a body that stops
 * mid-stream. `reason` is kept as `cause` because Node reports most of these as
 * a bare "fetch failed" and puts the actionable detail on the original error.
 * Pass `options.cause` when `reason` came from caller code (see
 * {@link sanitizedCause}); an `undefined` cause there means "attach none",
 * never "fall back to `reason`".
 */
export function networkError(reason: unknown, context = '', options?: { readonly cause: unknown }): TestRailApiError {
    const message = `${context}${reason instanceof Error ? reason.message : String(reason)}`;
    const cause = options === undefined ? reason : options.cause;
    return new TestRailApiError(0, `Network error: ${message}`, message, cause === undefined ? undefined : { cause });
}

const SAFE_CAUSE_FIELDS = ['code', 'errno', 'syscall'] as const;

/**
 * A plain copy of a failure raised by caller-supplied code (a custom `fetch`):
 * its string name, message, and primitive `code`, `errno`, and `syscall`, recursing
 * into `cause`. HTTP adapters often embed the request they were given in their
 * errors, and the client passes the Authorization header to `fetch` in
 * `init.headers`. Attaching the raw object would expose that credential to any
 * logger that walks the cause chain. Non-Error objects and functions are dropped;
 * primitives are kept.
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
 * Thrown when TestRail rejects a request because the instance lacks the required
 * Enterprise license/subscription (HTTP 403 with a "Not an Enterprise
 * license/subscription." body — live-audit findings B.22/B.33). A subclass of
 * {@link TestRailApiError}, so existing `catch (TestRailApiError)` handlers still
 * catch it; callers that want to branch on license gating specifically can use
 * `instanceof TestRailLicenseError`.
 */
export class TestRailLicenseError extends TestRailApiError {
    constructor(status: number, statusText: string, response?: unknown) {
        super(status, statusText, response);
        this.name = 'TestRailLicenseError';
    }
}

/**
 * Matches TestRail's Enterprise-license/subscription 403 bodies. TestRail
 * phrases the same condition two ways depending on the endpoint:
 *
 *   get_variables / get_datasets → `"Not an Enterprise license/subscription."`
 *   get_case_statuses            → `"You do not have permission to access this
 *                                    endpoint (Requires Enterprise license…"`
 *
 * Anchoring on `not an enterprise …` matched only the first, so
 * `getCaseStatuses()` surfaced a plain `TestRailApiError` on a non-Enterprise
 * instance and callers branching on `instanceof TestRailLicenseError` to degrade
 * gracefully missed it. Both lead-ins are accepted instead.
 *
 * Deliberately not loosened all the way to the bare `enterprise licen…` stem:
 * the body may be an arbitrary document (a corporate proxy's HTML 403 page) or
 * echo an entity name (a project called "Enterprise Licensing"), and either
 * would then classify as a license restriction — leaving a caller that branches
 * on `instanceof TestRailLicenseError` with a feature permanently disabled over
 * a transient ACL problem. The asymmetry favors strictness: a missed phrasing
 * degrades to a plain {@link TestRailApiError}, which is what 5.x did anyway.
 */
const LICENSE_RESTRICTION_RE = /(?:not an|requires)\s+enterprise (?:licen|subscription)/i;

/**
 * Returns true when an HTTP error denotes a TestRail Enterprise-license/
 * subscription restriction: status 403 whose body names an Enterprise licence or
 * subscription. `body` is the raw response text; it is parsed leniently and falls
 * back to a substring match so a non-JSON body or a future wrapper shape still
 * classifies correctly. The match stays narrow enough that ordinary 403s
 * (permission denials that do not mention Enterprise licensing) remain plain
 * {@link TestRailApiError}.
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
 * network failures remain {@link TestRailApiError}; this subtype represents
 * client-side page structure, continuation, and aggregation-policy failures.
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
 * Utility to convert ZodError into TestRailValidationError.
 */
export function handleZodError(error: ZodError): TestRailValidationError {
    return new TestRailValidationError('Schema validation failed', error.format());
}
