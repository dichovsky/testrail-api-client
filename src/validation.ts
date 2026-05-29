import { TestRailValidationError } from './errors.js';

/**
 * RFC 4122 UUID pattern for TestRail plan-entry IDs (SEC #29).
 *
 * Exported so `src/cli/ids.ts` can parse-and-validate string CLI input against
 * the same rule the programmatic `validateEntryId` enforces, without having to
 * keep a parallel copy in sync. Accepting arbitrary strings here would let
 * path-traversal sequences (e.g. `../../admin`) be injected into the URL.
 */
export const ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that an ID is a positive integer.
 * @throws {TestRailValidationError} When ID is invalid
 */
export function validateId(id: number, name: string): void {
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
export function validateEntryId(entryId: string): void {
    if (!ENTRY_ID_RE.test(entryId)) {
        throw new TestRailValidationError('entryId must be a UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
    }
}

/**
 * Validates optional pagination parameters.
 * @throws {TestRailValidationError} When limit is not a positive integer or offset is not a non-negative integer
 */
export function validatePaginationParams(limit?: number, offset?: number): void {
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
