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
    UpdateCasesPayloadSchema,
    DeleteCasesPayloadSchema,
    CopyCasesToSectionPayloadSchema,
    MoveCasesToSectionPayloadSchema,
    AddCaseFieldPayloadSchema,
    AddCaseFieldConfigPayloadSchema,
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
    AddProjectPayloadSchema,
    UpdateProjectPayloadSchema,
    AddSuitePayloadSchema,
    UpdateSuitePayloadSchema,
    AddSectionPayloadSchema,
    UpdateSectionPayloadSchema,
    AddMilestonePayloadSchema,
    UpdateMilestonePayloadSchema,
    AddVariablePayloadSchema,
    UpdateVariablePayloadSchema,
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

describe('UpdateCasesPayloadSchema', () => {
    it('parses a minimal valid payload (case_ids only)', () => {
        const parsed = UpdateCasesPayloadSchema.parse({ case_ids: [1, 2, 3] });
        expect(parsed.case_ids).toEqual([1, 2, 3]);
    });

    it('parses case_ids plus shared fields', () => {
        const parsed = UpdateCasesPayloadSchema.parse({
            case_ids: [1, 2],
            priority_id: 3,
            milestone_id: 10,
            refs: 'JIRA-1',
        });
        expect(parsed.priority_id).toBe(3);
        expect(parsed.refs).toBe('JIRA-1');
    });

    it('rejects when case_ids is missing', () => {
        expect(() => UpdateCasesPayloadSchema.parse({ priority_id: 1 })).toThrow();
    });

    it('rejects when case_ids contains a string (no coercion)', () => {
        expect(() => UpdateCasesPayloadSchema.parse({ case_ids: ['1', '2'] })).toThrow();
    });

    it('rejects wrong type on a shared optional field (no coercion)', () => {
        expect(() => UpdateCasesPayloadSchema.parse({ case_ids: [1], priority_id: 'high' })).toThrow();
    });

    it('preserves unknown custom_* fields via passthrough()', () => {
        const parsed = UpdateCasesPayloadSchema.parse({
            case_ids: [1],
            custom_qa_state: 'approved',
        }) as Record<string, unknown>;
        expect(parsed['custom_qa_state']).toBe('approved');
    });
});

describe('DeleteCasesPayloadSchema', () => {
    it('parses a valid payload', () => {
        const parsed = DeleteCasesPayloadSchema.parse({ case_ids: [1, 2] });
        expect(parsed.case_ids).toEqual([1, 2]);
    });

    it('rejects when case_ids is missing', () => {
        expect(() => DeleteCasesPayloadSchema.parse({})).toThrow();
    });

    it('rejects case_ids with non-number elements', () => {
        expect(() => DeleteCasesPayloadSchema.parse({ case_ids: [1, '2'] })).toThrow();
    });

    it('rejects body-level `soft` (must be query flag, not body field)', () => {
        // Guards against an agent pasting `{ "case_ids": [1], "soft": true }`
        // expecting a server-side preview — TestRail toggles soft-preview via
        // the query string, so a body `soft` would silently passthrough and
        // could turn intended preview into a hard delete (or vice versa).
        expect(() => DeleteCasesPayloadSchema.parse({ case_ids: [1], soft: true })).toThrow(/soft/);
    });

    it('rejects body-level `soft: false` too (any presence is misuse)', () => {
        expect(() => DeleteCasesPayloadSchema.parse({ case_ids: [1], soft: false })).toThrow(/soft/);
    });
});

describe('CopyCasesToSectionPayloadSchema', () => {
    it('parses a valid payload', () => {
        const parsed = CopyCasesToSectionPayloadSchema.parse({ case_ids: [10, 11] });
        expect(parsed.case_ids).toEqual([10, 11]);
    });

    it('rejects when case_ids is missing', () => {
        expect(() => CopyCasesToSectionPayloadSchema.parse({})).toThrow();
    });

    it('passes through extra fields without dropping them', () => {
        const parsed = CopyCasesToSectionPayloadSchema.parse({
            case_ids: [1],
            note: 'tracking',
        }) as Record<string, unknown>;
        expect(parsed['note']).toBe('tracking');
    });
});

describe('MoveCasesToSectionPayloadSchema', () => {
    it('parses a valid payload (case_ids + suite_id required)', () => {
        const parsed = MoveCasesToSectionPayloadSchema.parse({ case_ids: [1], suite_id: 7 });
        expect(parsed.suite_id).toBe(7);
    });

    it('rejects when suite_id is missing', () => {
        expect(() => MoveCasesToSectionPayloadSchema.parse({ case_ids: [1] })).toThrow();
    });

    it('rejects when case_ids is missing', () => {
        expect(() => MoveCasesToSectionPayloadSchema.parse({ suite_id: 7 })).toThrow();
    });

    it('rejects when suite_id is a string (no coercion)', () => {
        expect(() => MoveCasesToSectionPayloadSchema.parse({ case_ids: [1], suite_id: '7' })).toThrow();
    });
});

describe('AddCaseFieldConfigPayloadSchema', () => {
    it('parses a minimal valid config (required context + options only)', () => {
        const parsed = AddCaseFieldConfigPayloadSchema.parse({
            context: { is_global: true, project_ids: [] },
            options: { is_required: false, default_value: '' },
        });
        expect(parsed.context.is_global).toBe(true);
        expect(parsed.options.default_value).toBe('');
    });

    it('parses a config with all optional options fields', () => {
        const parsed = AddCaseFieldConfigPayloadSchema.parse({
            context: { is_global: false, project_ids: [1, 2] },
            options: {
                is_required: true,
                default_value: 'medium',
                items: '1, Low\n2, Medium\n3, High',
                format: 'markdown',
                rows: '5',
            },
        });
        expect(parsed.context.project_ids).toEqual([1, 2]);
        expect(parsed.options.items).toContain('Medium');
    });

    it('rejects when context is missing', () => {
        expect(() =>
            AddCaseFieldConfigPayloadSchema.parse({
                options: { is_required: false, default_value: '' },
            }),
        ).toThrow();
    });

    it('rejects when options.is_required is missing', () => {
        expect(() =>
            AddCaseFieldConfigPayloadSchema.parse({
                context: { is_global: true, project_ids: [] },
                options: { default_value: '' },
            }),
        ).toThrow();
    });

    it('rejects when options.default_value is missing (required as a string)', () => {
        expect(() =>
            AddCaseFieldConfigPayloadSchema.parse({
                context: { is_global: true, project_ids: [] },
                options: { is_required: false },
            }),
        ).toThrow();
    });

    it('rejects wrong type on context.is_global (no coercion)', () => {
        expect(() =>
            AddCaseFieldConfigPayloadSchema.parse({
                context: { is_global: 'true', project_ids: [] },
                options: { is_required: false, default_value: '' },
            }),
        ).toThrow();
    });
});

describe('AddCaseFieldPayloadSchema', () => {
    const validConfig = {
        context: { is_global: true, project_ids: [] },
        options: { is_required: false, default_value: '' },
    };

    it('parses a minimal valid payload (type + name + label + configs[])', () => {
        const parsed = AddCaseFieldPayloadSchema.parse({
            type: 'String',
            name: 'preconds',
            label: 'Preconditions',
            configs: [validConfig],
        });
        expect(parsed.name).toBe('preconds');
        expect(parsed.configs).toHaveLength(1);
    });

    it('parses a fully-populated payload', () => {
        const parsed = AddCaseFieldPayloadSchema.parse({
            type: 'Dropdown',
            name: 'severity',
            label: 'Severity',
            description: 'Defect severity for triage',
            include_all: false,
            template_ids: [1, 2],
            configs: [
                {
                    context: { is_global: false, project_ids: [1, 2] },
                    options: { is_required: true, default_value: '2', items: '1,Low\n2,Medium\n3,High' },
                },
            ],
        });
        expect(parsed.template_ids).toEqual([1, 2]);
        expect(parsed.include_all).toBe(false);
    });

    it('rejects when type is missing', () => {
        expect(() => AddCaseFieldPayloadSchema.parse({ name: 'x', label: 'X', configs: [validConfig] })).toThrow();
    });

    it('rejects when name is missing', () => {
        expect(() => AddCaseFieldPayloadSchema.parse({ type: 'String', label: 'X', configs: [validConfig] })).toThrow();
    });

    it('rejects when label is missing', () => {
        expect(() => AddCaseFieldPayloadSchema.parse({ type: 'String', name: 'x', configs: [validConfig] })).toThrow();
    });

    it('rejects when configs is missing', () => {
        expect(() => AddCaseFieldPayloadSchema.parse({ type: 'String', name: 'x', label: 'X' })).toThrow();
    });

    it('rejects when configs[] item is malformed (missing context)', () => {
        expect(() =>
            AddCaseFieldPayloadSchema.parse({
                type: 'String',
                name: 'x',
                label: 'X',
                configs: [{ options: { is_required: false, default_value: '' } }],
            }),
        ).toThrow();
    });

    it('rejects wrong type on type field (no coercion)', () => {
        expect(() =>
            AddCaseFieldPayloadSchema.parse({ type: 7, name: 'x', label: 'X', configs: [validConfig] }),
        ).toThrow();
    });

    it('rejects wrong type on template_ids (no coercion)', () => {
        expect(() =>
            AddCaseFieldPayloadSchema.parse({
                type: 'String',
                name: 'x',
                label: 'X',
                template_ids: ['1', '2'],
                configs: [validConfig],
            }),
        ).toThrow();
    });

    it('preserves unknown top-level fields via passthrough()', () => {
        const parsed = AddCaseFieldPayloadSchema.parse({
            type: 'String',
            name: 'x',
            label: 'X',
            configs: [validConfig],
            future_field: 'preserve me',
        }) as Record<string, unknown>;
        expect(parsed['future_field']).toBe('preserve me');
    });

    it('parses a payload with an empty configs[] array (schema permits it; server enforces)', () => {
        // TestRail server requires at least one config in practice, but the
        // payload schema only validates structural shape. An empty array is
        // structurally valid; a missing `configs` key is not (rejected
        // elsewhere). Surfacing the server-side 400 stays the responsibility
        // of the upstream API per the .passthrough() / fail-open design.
        const parsed = AddCaseFieldPayloadSchema.parse({
            type: 'String',
            name: 'x',
            label: 'X',
            configs: [],
        });
        expect(parsed.configs).toEqual([]);
    });

    it('parses a payload with multiple configs[] entries', () => {
        const parsed = AddCaseFieldPayloadSchema.parse({
            type: 'String',
            name: 'x',
            label: 'X',
            configs: [
                validConfig,
                {
                    context: { is_global: false, project_ids: [42] },
                    options: { is_required: true, default_value: 'fallback' },
                },
            ],
        });
        expect(parsed.configs).toHaveLength(2);
        expect(parsed.configs[1]?.context.project_ids).toEqual([42]);
    });

    it('preserves unknown fields inside a nested configs[] entry via passthrough()', () => {
        const parsed = AddCaseFieldPayloadSchema.parse({
            type: 'String',
            name: 'x',
            label: 'X',
            configs: [
                {
                    ...validConfig,
                    future_nested_field: 'preserve me too',
                },
            ],
        });
        // Index into the parsed array as an untyped record to assert the
        // passthrough survival of an unknown nested field.
        const nested = parsed.configs[0] as unknown as Record<string, unknown>;
        expect(nested['future_nested_field']).toBe('preserve me too');
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

    it('parses include_all + case_ids selection update', () => {
        const parsed = UpdateRunPayloadSchema.parse({
            include_all: false,
            case_ids: [1, 2, 3],
        });
        expect(parsed.include_all).toBe(false);
        expect(parsed.case_ids).toEqual([1, 2, 3]);
    });

    it('rejects non-string name', () => {
        expect(() => UpdateRunPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('rejects non-number milestone_id', () => {
        expect(() => UpdateRunPayloadSchema.parse({ milestone_id: '5' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateRunPayloadSchema.parse({ custom_status: 'in_progress' }) as Record<string, unknown>;
        expect(parsed['custom_status']).toBe('in_progress');
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

// ── Structural-setup payloads ─────────────────────────────────────────────

describe('AddProjectPayloadSchema', () => {
    it('parses a minimal valid payload (name only)', () => {
        expect(AddProjectPayloadSchema.parse({ name: 'P' }).name).toBe('P');
    });

    it('parses a fully-populated payload', () => {
        const parsed = AddProjectPayloadSchema.parse({
            name: 'P',
            announcement: 'a',
            show_announcement: true,
            suite_mode: 3,
        });
        expect(parsed.suite_mode).toBe(3);
    });

    it('rejects payload missing required name', () => {
        expect(() => AddProjectPayloadSchema.parse({ suite_mode: 1 })).toThrow();
    });

    it('rejects non-numeric suite_mode (no coercion)', () => {
        expect(() => AddProjectPayloadSchema.parse({ name: 'P', suite_mode: '1' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddProjectPayloadSchema.parse({ name: 'P', custom_tier: 'gold' }) as Record<string, unknown>;
        expect(parsed['custom_tier']).toBe('gold');
    });
});

describe('UpdateProjectPayloadSchema', () => {
    it('parses an empty body (all fields optional)', () => {
        expect(UpdateProjectPayloadSchema.parse({})).toEqual({});
    });

    it('parses a partial update', () => {
        expect(UpdateProjectPayloadSchema.parse({ name: 'New' }).name).toBe('New');
    });

    it('rejects non-boolean show_announcement', () => {
        expect(() => UpdateProjectPayloadSchema.parse({ show_announcement: 'yes' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateProjectPayloadSchema.parse({ custom_x: 1 }) as Record<string, unknown>;
        expect(parsed['custom_x']).toBe(1);
    });
});

describe('AddSuitePayloadSchema', () => {
    it('parses a minimal valid payload', () => {
        expect(AddSuitePayloadSchema.parse({ name: 'S' }).name).toBe('S');
    });

    it('rejects missing name', () => {
        expect(() => AddSuitePayloadSchema.parse({ description: 'd' })).toThrow();
    });

    it('rejects non-string description', () => {
        expect(() => AddSuitePayloadSchema.parse({ name: 'S', description: 42 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddSuitePayloadSchema.parse({ name: 'S', custom_kind: 'manual' }) as Record<string, unknown>;
        expect(parsed['custom_kind']).toBe('manual');
    });
});

describe('UpdateSuitePayloadSchema', () => {
    it('parses an empty body', () => {
        expect(UpdateSuitePayloadSchema.parse({})).toEqual({});
    });

    it('parses partial updates', () => {
        expect(UpdateSuitePayloadSchema.parse({ name: 'S2' }).name).toBe('S2');
    });

    it('rejects non-string name', () => {
        expect(() => UpdateSuitePayloadSchema.parse({ name: 9 })).toThrow();
    });
});

describe('AddSectionPayloadSchema', () => {
    it('parses a minimal valid payload (single-suite-mode)', () => {
        expect(AddSectionPayloadSchema.parse({ name: 'Sec' }).name).toBe('Sec');
    });

    it('parses a payload with suite_id (multi-suite-mode)', () => {
        const parsed = AddSectionPayloadSchema.parse({ name: 'Sec', suite_id: 22 });
        expect(parsed.suite_id).toBe(22);
    });

    it('parses a payload with parent_id', () => {
        const parsed = AddSectionPayloadSchema.parse({ name: 'Sub', parent_id: 11 });
        expect(parsed.parent_id).toBe(11);
    });

    it('rejects missing name', () => {
        expect(() => AddSectionPayloadSchema.parse({ suite_id: 22 })).toThrow();
    });

    it('rejects non-number suite_id (no coercion)', () => {
        expect(() => AddSectionPayloadSchema.parse({ name: 'Sec', suite_id: '22' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddSectionPayloadSchema.parse({ name: 'Sec', custom_tag: 'reg' }) as Record<string, unknown>;
        expect(parsed['custom_tag']).toBe('reg');
    });
});

describe('UpdateSectionPayloadSchema', () => {
    it('parses an empty body', () => {
        expect(UpdateSectionPayloadSchema.parse({})).toEqual({});
    });

    it('rejects non-string description', () => {
        expect(() => UpdateSectionPayloadSchema.parse({ description: 1 })).toThrow();
    });
});

describe('AddMilestonePayloadSchema', () => {
    it('parses a minimal valid payload (name only)', () => {
        expect(AddMilestonePayloadSchema.parse({ name: 'M' }).name).toBe('M');
    });

    it('parses a fully-populated payload', () => {
        const parsed = AddMilestonePayloadSchema.parse({
            name: 'M',
            description: 'd',
            due_on: 1700000000,
            start_on: 1690000000,
            parent_id: 5,
            refs: 'JIRA-1',
        });
        expect(parsed.due_on).toBe(1700000000);
    });

    it('rejects missing name', () => {
        expect(() => AddMilestonePayloadSchema.parse({ refs: 'X' })).toThrow();
    });

    it('rejects non-numeric due_on (no coercion)', () => {
        expect(() => AddMilestonePayloadSchema.parse({ name: 'M', due_on: '1700000000' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddMilestonePayloadSchema.parse({ name: 'M', custom_owner: 'u' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('u');
    });
});

describe('UpdateMilestonePayloadSchema', () => {
    it('parses an empty body', () => {
        expect(UpdateMilestonePayloadSchema.parse({})).toEqual({});
    });

    it('parses state-toggle fields (is_completed / is_started)', () => {
        const parsed = UpdateMilestonePayloadSchema.parse({ is_completed: true, is_started: false });
        expect(parsed.is_completed).toBe(true);
        expect(parsed.is_started).toBe(false);
    });

    it('rejects non-boolean is_completed', () => {
        expect(() => UpdateMilestonePayloadSchema.parse({ is_completed: 'yes' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateMilestonePayloadSchema.parse({ custom_owner: 'x' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('x');
    });
});

describe('AddVariablePayloadSchema', () => {
    it('parses a minimal valid payload', () => {
        expect(AddVariablePayloadSchema.parse({ name: 'env' }).name).toBe('env');
    });

    it('rejects missing name', () => {
        expect(() => AddVariablePayloadSchema.parse({})).toThrow();
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => AddVariablePayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddVariablePayloadSchema.parse({ name: 'env', custom_owner: 'u' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('u');
    });
});

describe('UpdateVariablePayloadSchema', () => {
    it('parses an empty body (name is optional)', () => {
        expect(UpdateVariablePayloadSchema.parse({})).toEqual({});
    });

    it('parses a payload with name', () => {
        expect(UpdateVariablePayloadSchema.parse({ name: 'region' }).name).toBe('region');
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => UpdateVariablePayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateVariablePayloadSchema.parse({ custom_owner: 'x' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('x');
    });
});
