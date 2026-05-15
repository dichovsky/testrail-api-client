/**
 * Unit tests for the write-payload Zod schemas in src/schemas.ts.
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
    MoveSectionPayloadSchema,
    AddRunPayloadSchema,
    UpdateRunPayloadSchema,
    AddResultPayloadSchema,
    AddResultForCasePayloadSchema,
    AddResultsForCasesPayloadSchema,
    AddResultForTestPayloadSchema,
    AddResultsPayloadSchema,
    PlanEntryRunPayloadSchema,
    AddPlanEntryPayloadSchema,
    UpdatePlanEntryPayloadSchema,
    AddRunToPlanEntryPayloadSchema,
    UpdateRunInPlanEntryPayloadSchema,
    AddPlanPayloadSchema,
    UpdatePlanPayloadSchema,
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

describe('MoveSectionPayloadSchema', () => {
    it('parses an empty object (both fields optional)', () => {
        const parsed = MoveSectionPayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses parent_id=null (explicit move-to-root)', () => {
        const parsed = MoveSectionPayloadSchema.parse({ parent_id: null });
        expect(parsed.parent_id).toBeNull();
    });

    it('parses after_id=null (move-to-top)', () => {
        const parsed = MoveSectionPayloadSchema.parse({ after_id: null });
        expect(parsed.after_id).toBeNull();
    });

    it('parses parent_id and after_id together as numbers', () => {
        const parsed = MoveSectionPayloadSchema.parse({ parent_id: 5, after_id: 10 });
        expect(parsed.parent_id).toBe(5);
        expect(parsed.after_id).toBe(10);
    });

    it('parses parent_id=null with after_id as a number', () => {
        const parsed = MoveSectionPayloadSchema.parse({ parent_id: null, after_id: 42 });
        expect(parsed.parent_id).toBeNull();
        expect(parsed.after_id).toBe(42);
    });

    it('rejects parent_id as a string (no coercion)', () => {
        expect(() => MoveSectionPayloadSchema.parse({ parent_id: '5' })).toThrow();
    });

    it('rejects after_id as a string (no coercion)', () => {
        expect(() => MoveSectionPayloadSchema.parse({ after_id: '10' })).toThrow();
    });

    it('preserves unknown fields via passthrough()', () => {
        const parsed = MoveSectionPayloadSchema.parse({
            parent_id: 1,
            custom_meta: { reason: 'restructure' },
        }) as Record<string, unknown>;
        expect(parsed['custom_meta']).toEqual({ reason: 'restructure' });
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

describe('AddResultForTestPayloadSchema', () => {
    it('parses a minimal payload (test_id + status_id)', () => {
        const parsed = AddResultForTestPayloadSchema.parse({ test_id: 42, status_id: 1 });
        expect(parsed.test_id).toBe(42);
        expect(parsed.status_id).toBe(1);
    });

    it('rejects when test_id is missing', () => {
        expect(() => AddResultForTestPayloadSchema.parse({ status_id: 1 })).toThrow();
    });

    it('rejects when status_id is missing', () => {
        expect(() => AddResultForTestPayloadSchema.parse({ test_id: 42 })).toThrow();
    });

    it('passes through custom_* fields unchanged', () => {
        const parsed = AddResultForTestPayloadSchema.parse({
            test_id: 42,
            status_id: 1,
            custom_browser: 'firefox',
        }) as Record<string, unknown>;
        expect(parsed['custom_browser']).toBe('firefox');
    });
});

describe('AddResultsPayloadSchema', () => {
    it('parses a payload with an array of results', () => {
        const parsed = AddResultsPayloadSchema.parse({
            results: [
                { test_id: 1, status_id: 1 },
                { test_id: 2, status_id: 5, comment: 'failed' },
            ],
        });
        expect(parsed.results).toHaveLength(2);
    });

    it('parses a payload with an empty results array', () => {
        const parsed = AddResultsPayloadSchema.parse({ results: [] });
        expect(parsed.results).toEqual([]);
    });

    it('rejects when results is missing', () => {
        expect(() => AddResultsPayloadSchema.parse({})).toThrow();
    });

    it('rejects when a nested result lacks test_id', () => {
        expect(() =>
            AddResultsPayloadSchema.parse({
                results: [{ status_id: 1 }],
            }),
        ).toThrow();
    });

    it('rejects when results is not an array', () => {
        expect(() => AddResultsPayloadSchema.parse({ results: 'not-an-array' })).toThrow();
    });
});

describe('PlanEntryRunPayloadSchema', () => {
    it('parses an empty payload (every field optional)', () => {
        const parsed = PlanEntryRunPayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses a fully-populated payload', () => {
        const parsed = PlanEntryRunPayloadSchema.parse({
            name: 'Linux run',
            description: 'd',
            assignedto_id: 7,
            include_all: false,
            case_ids: [1, 2, 3],
            config_ids: [4, 5],
            refs: 'JIRA-1',
        });
        expect(parsed.config_ids).toEqual([4, 5]);
    });

    it('rejects non-string name', () => {
        expect(() => PlanEntryRunPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = PlanEntryRunPayloadSchema.parse({ custom_label: 'beta' }) as Record<string, unknown>;
        expect(parsed['custom_label']).toBe('beta');
    });
});

describe('AddPlanEntryPayloadSchema', () => {
    it('parses a minimal valid payload (suite_id only)', () => {
        const parsed = AddPlanEntryPayloadSchema.parse({ suite_id: 1 });
        expect(parsed.suite_id).toBe(1);
    });

    it('parses a payload with nested runs', () => {
        const parsed = AddPlanEntryPayloadSchema.parse({
            suite_id: 1,
            include_all: true,
            config_ids: [10, 11],
            runs: [{ config_ids: [10] }, { config_ids: [11] }],
        });
        expect(parsed.runs).toHaveLength(2);
    });

    it('rejects payload missing suite_id', () => {
        expect(() => AddPlanEntryPayloadSchema.parse({ name: 'oops' })).toThrow();
    });

    it('rejects non-number suite_id', () => {
        expect(() => AddPlanEntryPayloadSchema.parse({ suite_id: '1' })).toThrow();
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = AddPlanEntryPayloadSchema.parse({ suite_id: 1, custom_owner: 'team-a' }) as Record<
            string,
            unknown
        >;
        expect(parsed['custom_owner']).toBe('team-a');
    });
});

describe('UpdatePlanEntryPayloadSchema', () => {
    it('parses an empty payload (suite_id optional on update)', () => {
        const parsed = UpdatePlanEntryPayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses a payload with name + runs', () => {
        const parsed = UpdatePlanEntryPayloadSchema.parse({
            name: 'renamed entry',
            runs: [{ name: 'override' }],
        });
        expect(parsed.name).toBe('renamed entry');
    });

    it('rejects non-array runs', () => {
        expect(() => UpdatePlanEntryPayloadSchema.parse({ runs: 'nope' })).toThrow();
    });
});

describe('AddRunToPlanEntryPayloadSchema', () => {
    it('parses a minimal valid payload (config_ids only)', () => {
        const parsed = AddRunToPlanEntryPayloadSchema.parse({ config_ids: [1] });
        expect(parsed.config_ids).toEqual([1]);
    });

    it('parses a fully-populated payload', () => {
        const parsed = AddRunToPlanEntryPayloadSchema.parse({
            config_ids: [1, 2],
            description: 'Smoke',
            assignedto_id: 7,
            include_all: false,
            case_ids: [10, 20, 30],
            refs: 'JIRA-1',
        });
        expect(parsed.case_ids).toEqual([10, 20, 30]);
        expect(parsed.refs).toBe('JIRA-1');
    });

    it('rejects payload missing config_ids', () => {
        expect(() => AddRunToPlanEntryPayloadSchema.parse({})).toThrow();
    });

    it('rejects payload with config_ids of wrong type', () => {
        expect(() => AddRunToPlanEntryPayloadSchema.parse({ config_ids: 'all' })).toThrow();
    });

    it('rejects payload with non-numeric config_ids elements', () => {
        expect(() => AddRunToPlanEntryPayloadSchema.parse({ config_ids: ['1'] })).toThrow();
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = AddRunToPlanEntryPayloadSchema.parse({
            config_ids: [1],
            custom_owner: 'team-a',
        }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('team-a');
    });
});

describe('UpdateRunInPlanEntryPayloadSchema', () => {
    it('parses an empty payload (all fields optional)', () => {
        const parsed = UpdateRunInPlanEntryPayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses a payload with all four mutable fields', () => {
        const parsed = UpdateRunInPlanEntryPayloadSchema.parse({
            description: 'updated',
            assignedto_id: 7,
            include_all: false,
            case_ids: [1, 2],
        });
        expect(parsed.description).toBe('updated');
        expect(parsed.case_ids).toEqual([1, 2]);
    });

    it('rejects bad types for case_ids', () => {
        expect(() => UpdateRunInPlanEntryPayloadSchema.parse({ case_ids: 'all' })).toThrow();
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = UpdateRunInPlanEntryPayloadSchema.parse({ custom_owner: 'team-a' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('team-a');
    });
});

describe('AddPlanPayloadSchema', () => {
    it('parses a minimal valid payload (name only)', () => {
        const parsed = AddPlanPayloadSchema.parse({ name: 'Release 1.0' });
        expect(parsed.name).toBe('Release 1.0');
    });

    it('parses a payload with nested entries', () => {
        const parsed = AddPlanPayloadSchema.parse({
            name: 'Release 1.0',
            milestone_id: 4,
            entries: [{ suite_id: 1, include_all: true }, { suite_id: 2 }],
        });
        expect(parsed.entries).toHaveLength(2);
    });

    it('rejects payload missing name', () => {
        expect(() => AddPlanPayloadSchema.parse({})).toThrow();
    });

    it('rejects payload with entry missing suite_id', () => {
        expect(() =>
            AddPlanPayloadSchema.parse({
                name: 'R',
                entries: [{ name: 'broken' }],
            }),
        ).toThrow();
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = AddPlanPayloadSchema.parse({ name: 'R', custom_tag: 'foo' }) as Record<string, unknown>;
        expect(parsed['custom_tag']).toBe('foo');
    });
});

describe('UpdatePlanPayloadSchema', () => {
    it('parses an empty payload (all fields optional)', () => {
        const parsed = UpdatePlanPayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses a payload with multiple fields', () => {
        const parsed = UpdatePlanPayloadSchema.parse({
            name: 'renamed',
            description: 'd',
            milestone_id: 9,
            assignedto_id: 7,
        });
        expect(parsed.name).toBe('renamed');
    });

    it('rejects non-string description', () => {
        expect(() => UpdatePlanPayloadSchema.parse({ description: 123 })).toThrow();
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = UpdatePlanPayloadSchema.parse({ custom_state: 'frozen' }) as Record<string, unknown>;
        expect(parsed['custom_state']).toBe('frozen');
    });
});
