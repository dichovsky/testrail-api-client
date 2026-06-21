import { ZodError } from 'zod';

/**
 * Thrown when the TestRail API returns a non-2xx response or a network error occurs.
 */
export class TestRailApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly response?: unknown,
    ) {
        super(`TestRail API error: ${status} ${statusText}`);
        this.name = 'TestRailApiError';
    }
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

/** Matches TestRail's Enterprise-license/subscription 403 body. */
const LICENSE_RESTRICTION_RE = /not an enterprise (license|subscription)/i;

/**
 * Returns true when an HTTP error denotes a TestRail Enterprise-license/
 * subscription restriction: status 403 with the documented error body
 * (`{"error":"Not an Enterprise license/subscription."}`). `body` is the raw
 * response text; it is parsed leniently and falls back to a substring match so a
 * non-JSON body or a future wrapper shape still classifies correctly. The match
 * is deliberately narrow so ordinary 403s (permission denials) stay plain
 * {@link TestRailApiError}.
 */
export function isLicenseRestriction(status: number, body: unknown): boolean {
    if (status !== 403 || typeof body !== 'string') {
        return false;
    }
    let message = body;
    try {
        const parsed: unknown = JSON.parse(body);
        if (parsed !== null && typeof parsed === 'object' && 'error' in parsed) {
            const errorValue: unknown = parsed.error;
            if (typeof errorValue === 'string') {
                message = errorValue;
            }
        }
    } catch {
        // Non-JSON body — fall back to a substring match against the raw text.
    }
    return LICENSE_RESTRICTION_RE.test(message);
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
 * Utility to convert ZodError into TestRailValidationError.
 */
export function handleZodError(error: ZodError): TestRailValidationError {
    return new TestRailValidationError('Schema validation failed', error.format());
}
