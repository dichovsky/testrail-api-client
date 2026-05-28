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
