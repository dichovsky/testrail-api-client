/**
 * Thrown when the TestRail API returns a non-2xx response or a network error occurs.
 *
 * @property status - HTTP status code (if available)
 * @property statusText - HTTP status text (if available)
 * @property response - Raw response body (if available)
 */
export class TestRailApiError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly statusText?: string,
        public readonly response?: string,
    ) {
        super(message);
        this.name = 'TestRailApiError';
    }
}

/**
 * Thrown when client configuration or method parameters fail validation.
 */
export class TestRailValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestRailValidationError';
    }
}
