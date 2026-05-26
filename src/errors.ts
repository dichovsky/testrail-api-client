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

/** Thrown when TestRail returns 429 Too Many Requests or the client-side rate limiter fires. */
export class TestRailRateLimitError extends TestRailApiError {
    constructor(status: number, statusText: string, response?: unknown) {
        super(status, statusText, response);
        this.name = 'TestRailRateLimitError';
    }
}

/** Thrown when TestRail returns 401 Unauthorized or 403 Forbidden. */
export class TestRailAuthError extends TestRailApiError {
    constructor(status: number, statusText: string, response?: unknown) {
        super(status, statusText, response);
        this.name = 'TestRailAuthError';
    }
}

/** Thrown when TestRail returns 404 Not Found. */
export class TestRailNotFoundError extends TestRailApiError {
    constructor(status: number, statusText: string, response?: unknown) {
        super(status, statusText, response);
        this.name = 'TestRailNotFoundError';
    }
}

/** Thrown when a request times out (408 / AbortError) or the response-body read deadline fires. */
export class TestRailTimeoutError extends TestRailApiError {
    constructor(status: number, statusText: string, response?: unknown) {
        super(status, statusText, response);
        this.name = 'TestRailTimeoutError';
    }
}

/**
 * Returns the most specific TestRailApiError subclass for a given HTTP status.
 * Falls back to TestRailApiError for unclassified statuses.
 */
export function createApiError(status: number, statusText: string, response?: unknown): TestRailApiError {
    if (status === 429) return new TestRailRateLimitError(status, statusText, response);
    if (status === 401 || status === 403) return new TestRailAuthError(status, statusText, response);
    if (status === 404) return new TestRailNotFoundError(status, statusText, response);
    if (status === 408) return new TestRailTimeoutError(status, statusText, response);
    return new TestRailApiError(status, statusText, response);
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
