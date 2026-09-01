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
    AddCaseFieldResponseSchema,
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
    LabelWriteResponseSchema,
    AddLabelPayloadSchema,
    UpdateLabelPayloadSchema,
    DeleteLabelsPayloadSchema,
    UpdateTestLabelsPayloadSchema,
    UpdateTestsLabelsPayloadSchema,
    AddVariablePayloadSchema,
    UpdateVariablePayloadSchema,
    AddGroupPayloadSchema,
    UpdateGroupPayloadSchema,
    AddDatasetPayloadSchema,
    UpdateDatasetPayloadSchema,
    AddSharedStepPayloadSchema,
    UpdateSharedStepPayloadSchema,
    AddConfigurationGroupPayloadSchema,
    UpdateConfigurationGroupPayloadSchema,
    AddConfigurationPayloadSchema,
    UpdateConfigurationPayloadSchema,
    UserAddPayloadSchema,
    UserUpdatePayloadSchema,
    AttachmentSchema,
} from '../src/schemas.js';
import type { UpdateProjectUserAssignmentPayload } from '../src/schemas.js';

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
            labels: [1, 'regression'],
            is_legacy: false,
            custom_fields: { steps: 'do thing' },
        });
        expect(parsed.refs).toBe('JIRA-1, JIRA-2');
        expect(parsed.labels).toEqual([1, 'regression']);
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

    it('rejects unsupported label value types', () => {
        expect(() => AddCasePayloadSchema.parse({ title: 'x', labels: [{ id: 1 }] })).toThrow();
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

    it('parses documented section, label, and legacy-content fields', () => {
        const parsed = UpdateCasePayloadSchema.parse({
            section_id: 4,
            labels: [1, 'smoke'],
            is_legacy: true,
        });
        expect(parsed).toMatchObject({ section_id: 4, labels: [1, 'smoke'], is_legacy: true });
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
            section_id: 4,
            labels: [1, 'regression'],
            is_legacy: true,
        });
        expect(parsed.priority_id).toBe(3);
        expect(parsed.refs).toBe('JIRA-1');
        expect(parsed.labels).toEqual([1, 'regression']);
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

    it('accepts an omitted default_value for field types that forbid it', () => {
        expect(
            AddCaseFieldConfigPayloadSchema.parse({
                context: { is_global: true, project_ids: '' },
                options: { is_required: false },
            }),
        ).toEqual({
            context: { is_global: true, project_ids: '' },
            options: { is_required: false },
        });
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

    it('rejects an empty configs[] array', () => {
        expect(() =>
            AddCaseFieldPayloadSchema.parse({
                type: 'String',
                name: 'x',
                label: 'X',
                configs: [],
            }),
        ).toThrow();
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

// SPEC #2.1.12 — response schema for `add_case_field` POST. Distinct from
// `CaseFieldSchema` (the GET response shape): `configs` is a JSON-encoded
// string and boolean-style fields surface as 0/1 integers.
describe('AddCaseFieldResponseSchema', () => {
    const baseValid = {
        id: 33,
        name: 'my_multiselect',
        system_name: 'custom_my_multiselect',
        entity_id: 1,
        label: 'My Multiselect',
        description: 'my custom Multiselect description',
        type_id: 12,
        location_id: 2,
        display_order: 7,
        configs:
            '[{"context":{"is_global":true,"project_ids":""},"options":{"is_required":false,"items":"1, One\\n2, Two"},"id":"9f105ba2-1ed0-45e0-b459-18d890bad86e"}]',
        is_multi: 1,
        is_active: 1,
        status_id: 1,
        is_system: 0,
        include_all: 1,
        template_ids: [],
    };

    it('parses the upstream-documented POST response example verbatim', () => {
        const parsed = AddCaseFieldResponseSchema.parse(baseValid);
        expect(parsed.id).toBe(33);
        expect(parsed.system_name).toBe('custom_my_multiselect');
    });

    it('models configs as a JSON-encoded string (not a parsed array)', () => {
        const parsed = AddCaseFieldResponseSchema.parse(baseValid);
        expect(typeof parsed.configs).toBe('string');
        // The string must be JSON-parseable — callers depend on this contract.
        const decoded = JSON.parse(parsed.configs) as Array<Record<string, unknown>>;
        expect(Array.isArray(decoded)).toBe(true);
        expect(decoded[0]).toHaveProperty('context');
        expect(decoded[0]).toHaveProperty('options');
    });

    it('rejects when configs is an array (GET-shape leak)', () => {
        expect(() =>
            AddCaseFieldResponseSchema.parse({
                ...baseValid,
                configs: [
                    {
                        context: { is_global: true, project_ids: [] },
                        options: { is_required: false, default_value: '' },
                    },
                ],
            }),
        ).toThrow();
    });

    it('rejects when configs is a non-string non-array (e.g. number)', () => {
        expect(() => AddCaseFieldResponseSchema.parse({ ...baseValid, configs: 42 })).toThrow();
    });

    it('models is_active / include_all as numbers (0/1), not booleans', () => {
        // Booleans must NOT pass — POST response surfaces these as 0/1 integers.
        expect(() => AddCaseFieldResponseSchema.parse({ ...baseValid, is_active: true })).toThrow();
        expect(() => AddCaseFieldResponseSchema.parse({ ...baseValid, include_all: false })).toThrow();
    });

    it('accepts a payload with the admin-internal fields absent (forward-compat)', () => {
        const minimal = {
            id: 1,
            name: 'x',
            system_name: 'custom_x',
            label: 'X',
            type_id: 1,
            display_order: 1,
            configs: '[]',
            is_active: 1,
            include_all: 1,
            template_ids: [],
        };
        const parsed = AddCaseFieldResponseSchema.parse(minimal);
        expect(parsed.entity_id ?? null).toBeNull();
        expect(parsed.location_id ?? null).toBeNull();
    });

    it('preserves unknown top-level fields via passthrough()', () => {
        const parsed = AddCaseFieldResponseSchema.parse({
            ...baseValid,
            future_response_field: 'preserve me',
        }) as Record<string, unknown>;
        expect(parsed['future_response_field']).toBe('preserve me');
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

    it('parses documented start and due timestamps', () => {
        const parsed = AddRunPayloadSchema.parse({ name: 'r', start_on: 1_646_058_600, due_on: 1_648_650_671 });
        expect(parsed.start_on).toBe(1_646_058_600);
        expect(parsed.due_on).toBe(1_648_650_671);
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

    it('parses documented start and due timestamps', () => {
        const parsed = UpdateRunPayloadSchema.parse({ start_on: 1_646_058_600, due_on: 1_648_650_671 });
        expect(parsed.start_on).toBe(1_646_058_600);
        expect(parsed.due_on).toBe(1_648_650_671);
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
    it('parses a single-suite payload without suite_id', () => {
        expect(AddPlanEntryPayloadSchema.parse({ name: 'single-suite entry' })).toEqual({
            name: 'single-suite entry',
        });
    });

    it('parses suite_id for a multi-suite or baseline project', () => {
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

    it('parses SPEC #2.1.6 fields (start_on / due_on / refs) on the request side', () => {
        // Declared on the write schema so consumers have a statically-typed path to set
        // these documented TestRail request fields. `zObject` is `.passthrough()`, so
        // undeclared keys would still reach the wire, but they'd be typed as `unknown`
        // (or absent) on the inferred payload — i.e. no IDE/tsc help to set them, and
        // wrong-typed values would not be rejected at parse time.
        const parsed = AddPlanEntryPayloadSchema.parse({
            suite_id: 1,
            start_on: 1646058600,
            due_on: 1648650671,
            refs: 'SAN-100',
        });
        expect(parsed.start_on).toBe(1646058600);
        expect(parsed.due_on).toBe(1648650671);
        expect(parsed.refs).toBe('SAN-100');
    });

    // SPEC #2.1.6 — wrong-type rejection. Mirrors the `AddMilestonePayloadSchema`
    // convention in this file. `it.each` keeps the three fields in sync so a future
    // schema slip on any one of them fails loudly.
    it.each([
        ['start_on as ISO string', { start_on: '2026-05-22' }],
        ['due_on as ISO string', { due_on: '2026-06-01' }],
        ['refs as number', { refs: 42 }],
    ])('rejects %s', (_label, badField) => {
        expect(() => AddPlanEntryPayloadSchema.parse({ suite_id: 1, ...badField })).toThrow();
    });
});

describe('UpdatePlanEntryPayloadSchema', () => {
    it('parses an empty partial-update payload', () => {
        const parsed = UpdatePlanEntryPayloadSchema.parse({});
        expect(parsed).toEqual({});
    });

    it('parses a name update', () => {
        const parsed = UpdatePlanEntryPayloadSchema.parse({
            name: 'renamed entry',
        });
        expect(parsed.name).toBe('renamed entry');
    });

    it('does not advertise fields that TestRail explicitly does not support', () => {
        expect(Object.keys(UpdatePlanEntryPayloadSchema.shape)).not.toEqual(
            expect.arrayContaining(['suite_id', 'config_ids', 'runs']),
        );
    });

    it('parses SPEC #2.1.6 fields (start_on / due_on / refs) on the update request side', () => {
        const parsed = UpdatePlanEntryPayloadSchema.parse({
            start_on: 1646058600,
            due_on: 1648650671,
            refs: 'SAN-101',
        });
        expect(parsed.start_on).toBe(1646058600);
        expect(parsed.due_on).toBe(1648650671);
        expect(parsed.refs).toBe('SAN-101');
    });

    // SPEC #2.1.6 — symmetric wrong-type rejection on the update path.
    it.each([
        ['start_on as ISO string', { start_on: '2026-05-22' }],
        ['due_on as ISO string', { due_on: '2026-06-01' }],
        ['refs as number', { refs: 42 }],
    ])('rejects %s', (_label, badField) => {
        expect(() => UpdatePlanEntryPayloadSchema.parse(badField)).toThrow();
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
            start_on: 1_646_058_600,
            due_on: 1_648_650_671,
            include_all: false,
            case_ids: [10, 20, 30],
            refs: 'JIRA-1',
        });
        expect(parsed.case_ids).toEqual([10, 20, 30]);
        expect(parsed.refs).toBe('JIRA-1');
        expect(parsed.start_on).toBe(1_646_058_600);
        expect(parsed.due_on).toBe(1_648_650_671);
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

    it('parses all documented mutable fields', () => {
        const parsed = UpdateRunInPlanEntryPayloadSchema.parse({
            description: 'updated',
            assignedto_id: 7,
            start_on: 1_646_058_600,
            due_on: 1_648_650_671,
            include_all: false,
            case_ids: [1, 2],
            refs: 'JIRA-2',
        });
        expect(parsed.description).toBe('updated');
        expect(parsed.case_ids).toEqual([1, 2]);
        expect(parsed.refs).toBe('JIRA-2');
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

    it('accepts a single-suite entry without suite_id', () => {
        expect(
            AddPlanPayloadSchema.parse({
                name: 'R',
                entries: [{ name: 'single-suite entry' }],
            }).entries,
        ).toEqual([{ name: 'single-suite entry' }]);
    });

    it('lets custom_* fields pass through unchanged', () => {
        const parsed = AddPlanPayloadSchema.parse({ name: 'R', custom_tag: 'foo' }) as Record<string, unknown>;
        expect(parsed['custom_tag']).toBe('foo');
    });

    // SPEC #2.1.6 — `add_plan` request body table lists `start_on` (timestamp, false)
    // and `due_on` (timestamp, false). `refs` is NOT in the request body table for
    // `add_plan` (only in the response) and must not be in the inferred payload.
    it('parses SPEC #2.1.6 fields (start_on / due_on) on the add_plan request side', () => {
        const parsed = AddPlanPayloadSchema.parse({
            name: 'Plan with dates',
            start_on: 1646058600,
            due_on: 1648650671,
        });
        expect(parsed.start_on).toBe(1646058600);
        expect(parsed.due_on).toBe(1648650671);
    });

    it.each([
        ['start_on as ISO string', { start_on: '2026-05-22' }],
        ['due_on as ISO string', { due_on: '2026-06-01' }],
    ])('rejects %s on add_plan', (_label, badField) => {
        expect(() => AddPlanPayloadSchema.parse({ name: 'R', ...badField })).toThrow();
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
        });
        expect(parsed.name).toBe('renamed');
    });

    it('does not advertise add-only entries or the undocumented assignedto_id field', () => {
        expect(Object.keys(UpdatePlanPayloadSchema.shape)).not.toEqual(
            expect.arrayContaining(['entries', 'assignedto_id']),
        );
    });

    it('rejects non-string description', () => {
        expect(() => UpdatePlanPayloadSchema.parse({ description: 123 })).toThrow();
    });

    // SPEC #2.1.6 — `update_plan` "supports the same POST fields as `add_plan`"
    // (except `entries`), per the Plans API doc. So `start_on` / `due_on` are
    // valid on the update path.
    it('parses SPEC #2.1.6 fields (start_on / due_on) on the update_plan request side', () => {
        const parsed = UpdatePlanPayloadSchema.parse({
            start_on: 1646058600,
            due_on: 1648650671,
        });
        expect(parsed.start_on).toBe(1646058600);
        expect(parsed.due_on).toBe(1648650671);
    });

    it.each([
        ['start_on as ISO string', { start_on: '2026-05-22' }],
        ['due_on as ISO string', { due_on: '2026-06-01' }],
    ])('rejects %s on update_plan', (_label, badField) => {
        expect(() => UpdatePlanPayloadSchema.parse(badField)).toThrow();
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
    it('exposes an exclusive user-assignment identifier type', () => {
        const byId: UpdateProjectUserAssignmentPayload = { id: 1, role_id: 3 };
        const byUserId: UpdateProjectUserAssignmentPayload = { user_id: 2, role_id: null };
        // @ts-expect-error Exactly one official user identifier form is required.
        const missingIdentifier: UpdateProjectUserAssignmentPayload = { role_id: 3 };
        // @ts-expect-error The two official identifier forms are mutually exclusive.
        const ambiguousIdentifier: UpdateProjectUserAssignmentPayload = { id: 1, user_id: 2, role_id: 3 };

        expect([byId, byUserId, missingIdentifier, ambiguousIdentifier]).toHaveLength(4);
    });

    it('parses an empty body (all fields optional)', () => {
        expect(UpdateProjectPayloadSchema.parse({})).toEqual({});
    });

    it('parses a partial update', () => {
        expect(UpdateProjectPayloadSchema.parse({ name: 'New' }).name).toBe('New');
    });

    it('rejects non-boolean show_announcement', () => {
        expect(() => UpdateProjectPayloadSchema.parse({ show_announcement: 'yes' })).toThrow();
    });

    it('parses project-level role, group, and user access assignments', () => {
        const parsed = UpdateProjectPayloadSchema.parse({
            default_role_id: 3,
            groups: [
                { id: 7, role_id: 0 },
                { id: 8, role_id: null },
            ],
            users: [
                { user_id: 4, role_id: null },
                { id: 5, role_id: 0 },
            ],
        });

        expect(parsed).toEqual({
            default_role_id: 3,
            groups: [
                { id: 7, role_id: 0 },
                { id: 8, role_id: null },
            ],
            users: [
                { user_id: 4, role_id: null },
                { id: 5, role_id: 0 },
            ],
        });
    });

    it('rejects invalid or ambiguous project access assignments', () => {
        expect(() => UpdateProjectPayloadSchema.parse({ groups: [{ id: 0, role_id: 3 }] })).toThrow();
        expect(() => UpdateProjectPayloadSchema.parse({ users: [{ role_id: 3 }] })).toThrow();
        expect(() => UpdateProjectPayloadSchema.parse({ users: [{ id: 1, user_id: 2, role_id: 3 }] })).toThrow();
        expect(() => UpdateProjectPayloadSchema.parse({ users: [{ id: 1, role_id: -1 }] })).toThrow();
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

describe('AddGroupPayloadSchema', () => {
    it('parses a minimal valid payload (name only)', () => {
        expect(AddGroupPayloadSchema.parse({ name: 'QA' }).name).toBe('QA');
    });

    it('parses a payload with user_ids', () => {
        const parsed = AddGroupPayloadSchema.parse({ name: 'QA', user_ids: [1, 2, 3] });
        expect(parsed.user_ids).toEqual([1, 2, 3]);
    });

    it('rejects missing name', () => {
        expect(() => AddGroupPayloadSchema.parse({})).toThrow();
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => AddGroupPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('rejects non-array user_ids', () => {
        expect(() => AddGroupPayloadSchema.parse({ name: 'QA', user_ids: 'nope' })).toThrow();
    });

    it('rejects non-number user_ids entries', () => {
        expect(() => AddGroupPayloadSchema.parse({ name: 'QA', user_ids: ['1', 2] })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddGroupPayloadSchema.parse({ name: 'QA', custom_owner: 'u' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('u');
    });
});

describe('UpdateGroupPayloadSchema', () => {
    it('parses an empty body (all fields optional)', () => {
        expect(UpdateGroupPayloadSchema.parse({})).toEqual({});
    });

    it('parses a payload with name only', () => {
        expect(UpdateGroupPayloadSchema.parse({ name: 'QA renamed' }).name).toBe('QA renamed');
    });

    it('parses a payload with user_ids only', () => {
        const parsed = UpdateGroupPayloadSchema.parse({ user_ids: [5, 6] });
        expect(parsed.user_ids).toEqual([5, 6]);
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => UpdateGroupPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('rejects non-number user_ids entries', () => {
        expect(() => UpdateGroupPayloadSchema.parse({ user_ids: [true] })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateGroupPayloadSchema.parse({ custom_owner: 'x' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('x');
    });
});

describe('AddDatasetPayloadSchema', () => {
    it('parses a minimal valid payload', () => {
        expect(AddDatasetPayloadSchema.parse({ name: 'Staging matrix' }).name).toBe('Staging matrix');
    });

    it('rejects missing name', () => {
        expect(() => AddDatasetPayloadSchema.parse({})).toThrow();
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => AddDatasetPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('parses an optional variable-name to value map', () => {
        const parsed = AddDatasetPayloadSchema.parse({
            name: 'Browser matrix',
            variables: { browser: 'Chrome', locale: 'en-US' },
        });
        expect(parsed.variables).toEqual({ browser: 'Chrome', locale: 'en-US' });
    });

    it('rejects non-string variable values without coercion', () => {
        expect(() => AddDatasetPayloadSchema.parse({ name: 'matrix', variables: { browser: 42 } })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddDatasetPayloadSchema.parse({
            name: 'matrix',
            custom_owner: 'qa',
        }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('qa');
    });
});

describe('UpdateDatasetPayloadSchema', () => {
    it('parses an empty body (name is optional)', () => {
        expect(UpdateDatasetPayloadSchema.parse({})).toEqual({});
    });

    it('parses a payload with name', () => {
        expect(UpdateDatasetPayloadSchema.parse({ name: 'Production matrix' }).name).toBe('Production matrix');
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => UpdateDatasetPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('parses an optional variable-name to value map', () => {
        const parsed = UpdateDatasetPayloadSchema.parse({
            variables: { browser: 'Firefox', locale: 'de-DE' },
        });
        expect(parsed.variables).toEqual({ browser: 'Firefox', locale: 'de-DE' });
    });

    it('rejects non-string variable values without coercion', () => {
        expect(() => UpdateDatasetPayloadSchema.parse({ variables: { browser: false } })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateDatasetPayloadSchema.parse({ custom_owner: 'x' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('x');
    });
});

describe('AddSharedStepPayloadSchema', () => {
    it('parses a minimal valid payload (title only)', () => {
        expect(AddSharedStepPayloadSchema.parse({ title: 'Login Steps' }).title).toBe('Login Steps');
    });

    it('parses a payload with custom_steps_separated', () => {
        const parsed = AddSharedStepPayloadSchema.parse({
            title: 'Login',
            custom_steps_separated: [{ content: 'Open URL', expected: 'Page loads' }],
        });
        expect(parsed.custom_steps_separated).toEqual([{ content: 'Open URL', expected: 'Page loads' }]);
    });

    it('rejects missing title', () => {
        expect(() => AddSharedStepPayloadSchema.parse({})).toThrow();
    });

    it('rejects non-string title (no coercion)', () => {
        expect(() => AddSharedStepPayloadSchema.parse({ title: 42 })).toThrow();
    });

    it('rejects non-array custom_steps_separated', () => {
        expect(() => AddSharedStepPayloadSchema.parse({ title: 'x', custom_steps_separated: 'oops' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddSharedStepPayloadSchema.parse({
            title: 'Login',
            custom_owner: 'qa',
        }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('qa');
    });
});

describe('UpdateSharedStepPayloadSchema', () => {
    it('parses an empty body', () => {
        expect(UpdateSharedStepPayloadSchema.parse({})).toEqual({});
    });

    it('parses partial updates (title only)', () => {
        expect(UpdateSharedStepPayloadSchema.parse({ title: 'Renamed' }).title).toBe('Renamed');
    });

    it('parses a payload with custom_steps_separated', () => {
        const parsed = UpdateSharedStepPayloadSchema.parse({
            custom_steps_separated: [{ content: 'step' }],
        });
        expect(parsed.custom_steps_separated).toEqual([{ content: 'step' }]);
    });

    it('rejects non-string title', () => {
        expect(() => UpdateSharedStepPayloadSchema.parse({ title: 9 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateSharedStepPayloadSchema.parse({ custom_owner: 'qa' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('qa');
    });
});

describe('AddConfigurationGroupPayloadSchema', () => {
    it('parses a minimal valid payload', () => {
        expect(AddConfigurationGroupPayloadSchema.parse({ name: 'Browsers' }).name).toBe('Browsers');
    });

    it('rejects missing name', () => {
        expect(() => AddConfigurationGroupPayloadSchema.parse({})).toThrow();
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => AddConfigurationGroupPayloadSchema.parse({ name: 42 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddConfigurationGroupPayloadSchema.parse({
            name: 'Browsers',
            custom_owner: 'qa',
        }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('qa');
    });
});

describe('UpdateConfigurationGroupPayloadSchema', () => {
    it('parses an empty body', () => {
        expect(UpdateConfigurationGroupPayloadSchema.parse({})).toEqual({});
    });

    it('parses a rename payload', () => {
        expect(UpdateConfigurationGroupPayloadSchema.parse({ name: 'Desktop Browsers' }).name).toBe('Desktop Browsers');
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => UpdateConfigurationGroupPayloadSchema.parse({ name: 0 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateConfigurationGroupPayloadSchema.parse({ custom_owner: 'qa' }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('qa');
    });
});

describe('AddConfigurationPayloadSchema', () => {
    it('parses a minimal valid payload', () => {
        expect(AddConfigurationPayloadSchema.parse({ name: 'Chrome' }).name).toBe('Chrome');
    });

    it('rejects missing name', () => {
        expect(() => AddConfigurationPayloadSchema.parse({})).toThrow();
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => AddConfigurationPayloadSchema.parse({ name: ['Chrome'] })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = AddConfigurationPayloadSchema.parse({
            name: 'Chrome',
            custom_version: '120',
        }) as Record<string, unknown>;
        expect(parsed['custom_version']).toBe('120');
    });
});

describe('UpdateConfigurationPayloadSchema', () => {
    it('parses an empty body', () => {
        expect(UpdateConfigurationPayloadSchema.parse({})).toEqual({});
    });

    it('parses a rename payload', () => {
        expect(UpdateConfigurationPayloadSchema.parse({ name: 'Chrome (stable)' }).name).toBe('Chrome (stable)');
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => UpdateConfigurationPayloadSchema.parse({ name: true })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateConfigurationPayloadSchema.parse({ custom_version: '120' }) as Record<string, unknown>;
        expect(parsed['custom_version']).toBe('120');
    });
});

describe('UserAddPayloadSchema', () => {
    it('parses the documented minimal payload (name + email)', () => {
        const parsed = UserAddPayloadSchema.parse({
            name: 'Alice',
            email: 'alice@example.com',
        });
        expect(parsed.name).toBe('Alice');
        expect(parsed.email).toBe('alice@example.com');
    });

    it('parses a fully-populated payload', () => {
        const parsed = UserAddPayloadSchema.parse({
            name: 'Bob',
            email: 'bob@example.com',
            is_active: true,
            is_admin: true,
            role_id: 3,
            group_ids: [1, 2],
            mfa_required: false,
            email_notifications: true,
            sso_enabled: true,
            assigned_projects: [4, 5],
        });
        expect(parsed.role_id).toBe(3);
        expect(parsed.group_ids).toEqual([1, 2]);
        expect(parsed.assigned_projects).toEqual([4, 5]);
    });

    it('rejects missing name', () => {
        expect(() => UserAddPayloadSchema.parse({ email: 'a@b.com' })).toThrow();
    });

    it('rejects empty name', () => {
        expect(() => UserAddPayloadSchema.parse({ name: '', email: 'a@b.com' })).toThrow();
    });

    it('rejects missing email', () => {
        expect(() => UserAddPayloadSchema.parse({ name: 'Alice' })).toThrow();
    });

    it('rejects invalid email format', () => {
        expect(() => UserAddPayloadSchema.parse({ name: 'Alice', email: 'not-an-email' })).toThrow();
    });

    it('rejects non-string name (no coercion)', () => {
        expect(() => UserAddPayloadSchema.parse({ name: 42, email: 'a@b.com' })).toThrow();
    });

    it('rejects invalid assigned project IDs', () => {
        expect(() =>
            UserAddPayloadSchema.parse({ name: 'Alice', email: 'a@b.com', assigned_projects: [1, 0] }),
        ).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UserAddPayloadSchema.parse({
            name: 'Alice',
            email: 'alice@example.com',
            custom_attr: 'value',
        }) as Record<string, unknown>;
        expect(parsed['custom_attr']).toBe('value');
    });
});

describe('UserUpdatePayloadSchema', () => {
    it('parses an empty body (all fields optional; PATCH semantics)', () => {
        expect(UserUpdatePayloadSchema.parse({})).toEqual({});
    });

    it('parses a partial update (name only)', () => {
        const parsed = UserUpdatePayloadSchema.parse({ name: 'Alice Smith' });
        expect(parsed.name).toBe('Alice Smith');
    });

    it('parses a deactivation payload', () => {
        const parsed = UserUpdatePayloadSchema.parse({ is_active: false });
        expect(parsed.is_active).toBe(false);
    });

    it('rejects invalid email format on update', () => {
        expect(() => UserUpdatePayloadSchema.parse({ email: 'not-an-email' })).toThrow();
    });

    it('rejects empty name (min 1)', () => {
        expect(() => UserUpdatePayloadSchema.parse({ name: '' })).toThrow();
    });

    it('parses Enterprise access-control fields', () => {
        expect(UserUpdatePayloadSchema.parse({ is_admin: true, sso_enabled: true, assigned_projects: [2, 3] })).toEqual(
            { is_admin: true, sso_enabled: true, assigned_projects: [2, 3] },
        );
    });

    it('rejects non-boolean is_active (no coercion)', () => {
        expect(() => UserUpdatePayloadSchema.parse({ is_active: 'true' })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UserUpdatePayloadSchema.parse({ custom_attr: 'value' }) as Record<string, unknown>;
        expect(parsed['custom_attr']).toBe('value');
    });
});

describe('AttachmentSchema', () => {
    // SPEC #2.1.14 — upload-POST response { attachment_id: N } has no `name`;
    // nullish() must accept this shape at the schema level (the upload runtime
    // path goes through requestMultipart which bypasses Zod, so this proves
    // the type contract is honest).
    it('parses the upload-POST shape { attachment_id: N } with no `name`', () => {
        const parsed = AttachmentSchema.parse({ attachment_id: 10 });
        expect(parsed.attachment_id).toBe(10);
        expect(parsed.name).toBeUndefined();
    });
});

describe('LabelWriteResponseSchema', () => {
    it('normalizes flat and wrapped label responses to the flat entity', () => {
        const label = { id: 7, title: 'Release 2.0' };
        expect(LabelWriteResponseSchema.parse(label)).toEqual(label);
        expect(LabelWriteResponseSchema.parse({ label })).toEqual(label);
    });
});

describe('AddLabelPayloadSchema', () => {
    it('parses a payload with title', () => {
        expect(AddLabelPayloadSchema.parse({ title: 'Release 2.0' }).title).toBe('Release 2.0');
    });

    it('rejects a payload missing title', () => {
        expect(() => AddLabelPayloadSchema.parse({})).toThrow();
    });
});

describe('UpdateLabelPayloadSchema', () => {
    it('parses a payload with project_id and title', () => {
        const parsed = UpdateLabelPayloadSchema.parse({ project_id: 1, title: 'Release 2.0' });
        expect(parsed).toMatchObject({ project_id: 1, title: 'Release 2.0' });
    });

    it('rejects a payload missing either required field', () => {
        expect(() => UpdateLabelPayloadSchema.parse({})).toThrow();
        expect(() => UpdateLabelPayloadSchema.parse({ title: 'x' })).toThrow();
        expect(() => UpdateLabelPayloadSchema.parse({ project_id: 1 })).toThrow();
    });

    it('rejects invalid project_id and non-string title (no coercion)', () => {
        expect(() => UpdateLabelPayloadSchema.parse({ project_id: 0, title: 'x' })).toThrow();
        expect(() => UpdateLabelPayloadSchema.parse({ project_id: 1, title: 42 })).toThrow();
    });

    it('lets custom_* fields pass through', () => {
        const parsed = UpdateLabelPayloadSchema.parse({
            project_id: 1,
            title: 'x',
            custom_owner: 'y',
        }) as Record<string, unknown>;
        expect(parsed['custom_owner']).toBe('y');
    });
});

describe('DeleteLabelsPayloadSchema', () => {
    it('parses one or more positive label IDs', () => {
        expect(DeleteLabelsPayloadSchema.parse({ label_ids: [1, 2] }).label_ids).toEqual([1, 2]);
    });

    it('rejects empty or invalid ID lists', () => {
        expect(() => DeleteLabelsPayloadSchema.parse({ label_ids: [] })).toThrow();
        expect(() => DeleteLabelsPayloadSchema.parse({ label_ids: [1, 0] })).toThrow();
        expect(() => DeleteLabelsPayloadSchema.parse({ label_ids: [1, 2.5] })).toThrow();
    });
});

describe('UpdateTestLabelsPayloadSchema', () => {
    it('parses labels as a mix of numeric IDs and string titles', () => {
        const parsed = UpdateTestLabelsPayloadSchema.parse({ labels: [1, 'regression', 2] });
        expect(parsed.labels).toEqual([1, 'regression', 2]);
    });

    it('parses an empty labels array (clears labels)', () => {
        expect(UpdateTestLabelsPayloadSchema.parse({ labels: [] }).labels).toEqual([]);
    });

    it('rejects a payload missing labels (required)', () => {
        expect(() => UpdateTestLabelsPayloadSchema.parse({})).toThrow();
    });

    it('rejects a labels element that is neither number nor string (no coercion)', () => {
        expect(() => UpdateTestLabelsPayloadSchema.parse({ labels: [{ id: 1 }] })).toThrow();
    });
});

describe('UpdateTestsLabelsPayloadSchema', () => {
    it('parses test_ids + labels', () => {
        const parsed = UpdateTestsLabelsPayloadSchema.parse({ test_ids: [1, 2, 3], labels: ['smoke'] });
        expect(parsed.test_ids).toEqual([1, 2, 3]);
        expect(parsed.labels).toEqual(['smoke']);
    });

    it('rejects a payload missing test_ids (required)', () => {
        expect(() => UpdateTestsLabelsPayloadSchema.parse({ labels: ['x'] })).toThrow();
    });

    it('rejects non-numeric test_ids (no coercion)', () => {
        expect(() => UpdateTestsLabelsPayloadSchema.parse({ test_ids: ['1'], labels: [] })).toThrow();
    });
});
