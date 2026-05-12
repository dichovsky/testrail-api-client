/**
 * Unit tests for the 7 write-payload Zod schemas in src/schemas.ts.
 *
 * Validates that each schema:
 * - parses minimal valid payloads,
 * - rejects payloads missing a required field,
 * - rejects payloads with the wrong type (no value coercion — Q8 decision),
 * - lets unknown / `custom_*` fields pass through unchanged (`.passthrough()`).
 *
 * The schemas are the source of truth — when a future PR changes them,
 * these tests are the safety net that prevents silent drift.
 */
import { describe, it, expect } from 'vitest';
import {
    AddCasePayloadSchema,
    UpdateCasePayloadSchema,
    AddRunPayloadSchema,
    UpdateRunPayloadSchema,
    AddResultPayloadSchema,
    AddResultForCasePayloadSchema,
    AddResultsForCasesPayloadSchema,
} from '../src/schemas.js';

describe('AddCasePayloadSchema', () => {
    it('parses a minimal valid payload (title only)', () => {
        const parsed = AddCasePayloadSchema.parse({ title: 'New case' });
        expect(parsed.title).toBe('New case');
    });

    it('parses a fully-populated payload', () => {
        const parsed = AddCasePayloadSchema.parse({
            title: 'Full case',
            template_id: 1,
            type_id: 2,
            priority_id: 3,
            estimate: '5m',
            milestone_id: 4,
            refs: 'JIRA-1, JIRA-2',
            custom_fields: { steps: 'do thing' },
        });
        expect(parsed.refs).toBe('JIRA-1, JIRA-2');
    });

    it('rejects when title is missing', () => {
        expect(() => AddCasePayloadSchema.parse({})).toThrow();
    });

    it('rejects when title is wrong type (no coercion)', () => {
        expect(() => AddCasePayloadSchema.parse({ title: 123 })).toThrow();
    });

    it('rejects when type_id is a string (no coercion)', () => {
        expect(() => AddCasePayloadSchema.parse({ title: 'x', type_id: '2' })).toThrow();
    });

    it('preserves unknown custom_* fields via passthrough()', () => {
        const parsed = AddCasePayloadSchema.parse({ title: 'x', custom_steps_separated: [{ s: 'a' }] }) as Record<
            string,
            unknown
        >;
        expect(parsed['custom_steps_separated']).toEqual([{ s: 'a' }]);
    });
});

describe('UpdateCasePayloadSchema', () => {
    it('parses an empty object (every field optional)', () => {
        const parsed = UpdateCasePayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses a partial update with only one field', () => {
        const parsed = UpdateCasePayloadSchema.parse({ title: 'Renamed' });
        expect(parsed.title).toBe('Renamed');
    });

    it('rejects wrong type on optional field (no coercion)', () => {
        expect(() => UpdateCasePayloadSchema.parse({ priority_id: 'high' })).toThrow();
    });
});

describe('AddRunPayloadSchema', () => {
    it('parses a minimal valid payload (name only)', () => {
        const parsed = AddRunPayloadSchema.parse({ name: 'Smoke run' });
        expect(parsed.name).toBe('Smoke run');
    });

    it('rejects when name is missing', () => {
        expect(() => AddRunPayloadSchema.parse({ suite_id: 1 })).toThrow();
    });

    it('parses case_ids as a number array', () => {
        const parsed = AddRunPayloadSchema.parse({ name: 'r', case_ids: [1, 2, 3] });
        expect(parsed.case_ids).toEqual([1, 2, 3]);
    });

    it('rejects case_ids with string elements (no coercion)', () => {
        expect(() => AddRunPayloadSchema.parse({ name: 'r', case_ids: ['1', '2'] })).toThrow();
    });
});

describe('UpdateRunPayloadSchema', () => {
    it('parses an empty object', () => {
        expect(UpdateRunPayloadSchema.parse({})).toEqual({});
    });

    it('parses a name-only update', () => {
        const parsed = UpdateRunPayloadSchema.parse({ name: 'New name' });
        expect(parsed.name).toBe('New name');
    });
});

describe('AddResultPayloadSchema', () => {
    it('parses a minimal valid payload (status_id only)', () => {
        const parsed = AddResultPayloadSchema.parse({ status_id: 1 });
        expect(parsed.status_id).toBe(1);
    });

    it('rejects when status_id is missing', () => {
        expect(() => AddResultPayloadSchema.parse({ comment: 'ok' })).toThrow();
    });

    it('rejects when status_id is a string (no coercion)', () => {
        expect(() => AddResultPayloadSchema.parse({ status_id: '1' })).toThrow();
    });

    it('preserves unknown custom_* fields via passthrough', () => {
        const parsed = AddResultPayloadSchema.parse({ status_id: 5, custom_step_results: [{ a: 1 }] }) as Record<
            string,
            unknown
        >;
        expect(parsed['custom_step_results']).toEqual([{ a: 1 }]);
    });
});

describe('AddResultForCasePayloadSchema', () => {
    it('parses a minimal payload (case_id + status_id)', () => {
        const parsed = AddResultForCasePayloadSchema.parse({ case_id: 7, status_id: 1 });
        expect(parsed.case_id).toBe(7);
        expect(parsed.status_id).toBe(1);
    });

    it('rejects when case_id is missing', () => {
        expect(() => AddResultForCasePayloadSchema.parse({ status_id: 1 })).toThrow();
    });

    it('rejects when status_id is missing', () => {
        expect(() => AddResultForCasePayloadSchema.parse({ case_id: 7 })).toThrow();
    });
});

describe('AddResultsForCasesPayloadSchema', () => {
    it('parses a payload with an array of results', () => {
        const parsed = AddResultsForCasesPayloadSchema.parse({
            results: [
                { case_id: 1, status_id: 1 },
                { case_id: 2, status_id: 5, comment: 'failed' },
            ],
        });
        expect(parsed.results).toHaveLength(2);
    });

    it('parses a payload with an empty results array', () => {
        const parsed = AddResultsForCasesPayloadSchema.parse({ results: [] });
        expect(parsed.results).toEqual([]);
    });

    it('rejects when results is missing', () => {
        expect(() => AddResultsForCasesPayloadSchema.parse({})).toThrow();
    });

    it('rejects when a nested result lacks case_id', () => {
        expect(() =>
            AddResultsForCasesPayloadSchema.parse({
                results: [{ status_id: 1 }],
            }),
        ).toThrow();
    });

    it('rejects when results is not an array', () => {
        expect(() => AddResultsForCasesPayloadSchema.parse({ results: 'not-an-array' })).toThrow();
    });
});
