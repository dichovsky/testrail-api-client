import { MAX_PAGINATION_LIMIT } from './constants.js';
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
 * Validates that an attachment ID is either a positive integer or a
 * well-formed RFC 4122 UUID string (TestRail 7.1+ attachment IDs are UUIDs;
 * older / Cloud instances use integers). Accepting arbitrary strings would
 * allow path-traversal sequences (e.g. `../../admin`) to be injected into
 * the URL — only the regex-checked UUID form is accepted for strings.
 *
 * No `.trim()` is applied deliberately — mirrors `validateEntryId` (strict
 * programmatic contract). CLI parsers (`parseAttachmentId` / `parseEntryId`)
 * trim argv input before calling here; callers that skip trim get a rejection.
 * @throws {TestRailValidationError} When the value is neither a positive integer nor a UUID string
 */
export function validateAttachmentId(id: number | string): void {
    const ok =
        (typeof id === 'number' && Number.isInteger(id) && id > 0) || (typeof id === 'string' && ENTRY_ID_RE.test(id));
    if (!ok) {
        throw new TestRailValidationError('attachmentId must be a positive integer or a UUID string');
    }
}

/**
 * Validates optional pagination parameters.
 *
 * `limit` must be a positive integer no greater than {@link MAX_PAGINATION_LIMIT}
 * (TestRail's server-side bulk cap; values outside `[1, 250]` are rejected with a
 * 400 server-side — live-audit findings B.30/B.31). `offset` must be a
 * non-negative integer.
 * @throws {TestRailValidationError} When limit is not a positive integer ≤ 250, or offset is not a non-negative integer
 */
export function validatePaginationParams(limit?: number, offset?: number): void {
    if (limit !== undefined) {
        if (typeof limit !== 'number' || !Number.isInteger(limit) || limit <= 0) {
            throw new TestRailValidationError('limit must be a positive integer');
        }
        if (limit > MAX_PAGINATION_LIMIT) {
            throw new TestRailValidationError(`limit must not exceed ${MAX_PAGINATION_LIMIT}`);
        }
    }
    if (offset !== undefined) {
        if (typeof offset !== 'number' || !Number.isInteger(offset) || offset < 0) {
            throw new TestRailValidationError('offset must be a non-negative integer');
        }
    }
}
