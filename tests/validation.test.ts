import { describe, it, expect } from 'vitest';
import {
    ENTRY_ID_RE,
    validateId,
    validateEntryId,
    validateAttachmentId,
    validatePaginationParams,
} from '../src/validation.js';
import { TestRailValidationError } from '../src/errors.js';

describe('validation', () => {
    describe('validateId', () => {
        it('accepts positive integers', () => {
            expect(() => validateId(1, 'caseId')).not.toThrow();
            expect(() => validateId(2147483647, 'projectId')).not.toThrow();
        });

        it('rejects zero', () => {
            expect(() => validateId(0, 'caseId')).toThrow(TestRailValidationError);
            expect(() => validateId(0, 'caseId')).toThrow('caseId must be a positive integer');
        });

        it('rejects negative integers', () => {
            expect(() => validateId(-1, 'runId')).toThrow(TestRailValidationError);
            expect(() => validateId(-100, 'runId')).toThrow('runId must be a positive integer');
        });

        it('rejects non-integer numbers', () => {
            expect(() => validateId(1.5, 'caseId')).toThrow(TestRailValidationError);
            expect(() => validateId(Number.NaN, 'caseId')).toThrow(TestRailValidationError);
            expect(() => validateId(Number.POSITIVE_INFINITY, 'caseId')).toThrow(TestRailValidationError);
        });

        it('rejects non-numbers when passed via unsafe cast', () => {
            expect(() => validateId('1' as unknown as number, 'caseId')).toThrow(TestRailValidationError);
            expect(() => validateId(null as unknown as number, 'caseId')).toThrow(TestRailValidationError);
            expect(() => validateId(undefined as unknown as number, 'caseId')).toThrow(TestRailValidationError);
        });

        it('uses the supplied name in the error message', () => {
            expect(() => validateId(0, 'sectionId')).toThrow('sectionId must be a positive integer');
        });
    });

    describe('validateEntryId', () => {
        it('accepts canonical lowercase UUIDs', () => {
            expect(() => validateEntryId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).not.toThrow();
        });

        it('accepts uppercase UUIDs', () => {
            expect(() => validateEntryId('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).not.toThrow();
        });

        it('rejects empty string', () => {
            expect(() => validateEntryId('')).toThrow(TestRailValidationError);
        });

        it('rejects path-traversal sequences (SEC #29)', () => {
            expect(() => validateEntryId('../../etc/passwd')).toThrow(TestRailValidationError);
            expect(() => validateEntryId('..%2F..%2Fadmin')).toThrow(TestRailValidationError);
        });

        it('rejects malformed UUIDs (wrong segment lengths)', () => {
            expect(() => validateEntryId('aaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toThrow(TestRailValidationError);
            expect(() => validateEntryId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee')).toThrow(TestRailValidationError);
        });

        it('rejects non-hex characters', () => {
            expect(() => validateEntryId('zzzzzzzz-bbbb-cccc-dddd-eeeeeeeeeeee')).toThrow(TestRailValidationError);
        });

        it('emits a UUID-format-help error message', () => {
            expect(() => validateEntryId('not-a-uuid')).toThrow(
                'entryId must be a UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
            );
        });
    });

    describe('validateAttachmentId', () => {
        it('accepts a positive integer', () => {
            expect(() => validateAttachmentId(1)).not.toThrow();
            expect(() => validateAttachmentId(2147483647)).not.toThrow();
        });

        it('accepts a well-formed UUID string (TestRail 7.1+)', () => {
            expect(() => validateAttachmentId('2ec27be4-812f-4806-9a5d-d39130d1691a')).not.toThrow();
            expect(() => validateAttachmentId('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).not.toThrow();
        });

        it('rejects zero', () => {
            expect(() => validateAttachmentId(0)).toThrow(TestRailValidationError);
            expect(() => validateAttachmentId(0)).toThrow('attachmentId must be a positive integer or a UUID string');
        });

        it('rejects negative integer', () => {
            expect(() => validateAttachmentId(-1)).toThrow(TestRailValidationError);
        });

        it('rejects non-integer number', () => {
            expect(() => validateAttachmentId(1.5)).toThrow(TestRailValidationError);
        });

        it('rejects an arbitrary non-UUID string (path-traversal guard)', () => {
            expect(() => validateAttachmentId('../../admin')).toThrow(TestRailValidationError);
            expect(() => validateAttachmentId('not-a-uuid')).toThrow(TestRailValidationError);
        });

        it('rejects a malformed UUID (wrong segment length)', () => {
            expect(() => validateAttachmentId('aaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toThrow(TestRailValidationError);
        });
    });

    describe('ENTRY_ID_RE', () => {
        it('matches canonical UUIDs', () => {
            expect(ENTRY_ID_RE.test('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(true);
        });

        it('rejects everything validateEntryId rejects', () => {
            expect(ENTRY_ID_RE.test('')).toBe(false);
            expect(ENTRY_ID_RE.test('../../etc/passwd')).toBe(false);
        });
    });

    describe('validatePaginationParams', () => {
        it('accepts undefined for both', () => {
            expect(() => validatePaginationParams()).not.toThrow();
            expect(() => validatePaginationParams(undefined, undefined)).not.toThrow();
        });

        it('accepts positive limit + non-negative offset', () => {
            expect(() => validatePaginationParams(1)).not.toThrow();
            expect(() => validatePaginationParams(250, 0)).not.toThrow();
            expect(() => validatePaginationParams(250, 250)).not.toThrow();
        });

        it('rejects limit <= 0', () => {
            expect(() => validatePaginationParams(0)).toThrow('limit must be a positive integer');
            expect(() => validatePaginationParams(-1)).toThrow('limit must be a positive integer');
        });

        it('rejects non-integer limit', () => {
            expect(() => validatePaginationParams(1.5)).toThrow(TestRailValidationError);
            expect(() => validatePaginationParams(Number.NaN)).toThrow(TestRailValidationError);
        });

        it('rejects limit above the TestRail bulk cap (250)', () => {
            // Live-audit finding (B.30/B.31): the server returns 400 for limit > 250.
            // Reject client-side with a clearer error than a server round-trip.
            expect(() => validatePaginationParams(251)).toThrow('limit must not exceed 250');
            expect(() => validatePaginationParams(251)).toThrow(TestRailValidationError);
            expect(() => validatePaginationParams(1000)).toThrow('limit must not exceed 250');
            // Boundary: exactly 250 is still accepted.
            expect(() => validatePaginationParams(250)).not.toThrow();
        });

        it('rejects negative offset', () => {
            expect(() => validatePaginationParams(undefined, -1)).toThrow('offset must be a non-negative integer');
        });

        it('rejects non-integer offset', () => {
            expect(() => validatePaginationParams(undefined, 1.5)).toThrow(TestRailValidationError);
        });

        it('validates limit before offset (limit error wins on simultaneous failure)', () => {
            expect(() => validatePaginationParams(0, -1)).toThrow('limit must be a positive integer');
        });
    });
});
