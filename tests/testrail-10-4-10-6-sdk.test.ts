import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import {
    AddPlanPayloadSchema,
    AddPlanEntryPayloadSchema,
    AddRunPayloadSchema,
    AddRunToPlanEntryPayloadSchema,
    EditResultPayloadSchema,
    PlanEntrySchema,
    RunSchema,
    UpdatePlanPayloadSchema,
    UpdatePlanEntryPayloadSchema,
    UpdateRunInPlanEntryPayloadSchema,
    UpdateRunPayloadSchema,
    type EditResultPayload,
} from '../src/schemas.js';
import { createClient, mockOk, MOCK_RESULT, MOCK_RUN } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TestRail 10.4–10.6 SDK additions', () => {
    let client: TestRailClient;

    beforeEach(() => {
        mockFetch.mockReset();
        client = createClient();
    });

    afterEach(() => {
        client.destroy();
    });

    it('edits a result with a partial payload and returns the updated result', async () => {
        const payload: EditResultPayload = {
            comment: 'Corrected after triage',
            custom_step_results: [{ content: 'Step 1', status_id: 1 }],
            custom_quality_gate: 'approved',
        };
        mockFetch.mockResolvedValueOnce(mockOk({ ...MOCK_RESULT, comment: payload.comment }));

        const result = await client.results.editResult(41, payload);

        expect(result.comment).toBe(payload.comment);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('edit_result/41'),
            expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
        );
    });

    it('validates edit-result IDs before fetching', async () => {
        await expect(client.results.editResult(0, {})).rejects.toThrow('resultId must be a positive integer');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects an empty edit-result payload before fetching', async () => {
        await expect(client.results.editResult(41, {})).rejects.toThrow('At least one result field is required');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('accepts partial edit-result fields and rejects a malformed separated-step replacement', () => {
        expect(EditResultPayloadSchema.parse({ defects: 'TR-7' })).toMatchObject({ defects: 'TR-7' });
        expect(() => EditResultPayloadSchema.parse({ custom_step_results: 'not-an-array' })).toThrow();
        expect(() => EditResultPayloadSchema.parse({})).toThrow('At least one result field is required');
        expect(Object.keys(EditResultPayloadSchema.shape)).not.toContain('custom_fields');
    });

    it('returns forward-compatible dynamic-filter field definitions', async () => {
        const response = [
            {
                type_id: 6,
                system_name: 'priority_id',
                label: 'Priority',
                options: '1, Low\n2, High',
                future_metadata: { indexed: true },
            },
            {
                type_id: 1,
                system_name: 'title',
                label: 'Title',
                sub_filters: '1, Is\n5, Contains',
            },
        ];
        mockFetch.mockResolvedValueOnce(mockOk(response));

        const fields = await client.metadata.getDynamicFilterFields(9);

        expect(fields).toEqual(response);
        expect((fields[0] as Record<string, unknown>)['future_metadata']).toEqual({ indexed: true });
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('get_dynamic_filter_fields/9'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('validates the dynamic-filter project ID before fetching', async () => {
        await expect(client.metadata.getDynamicFilterFields(-1)).rejects.toThrow(
            'projectId must be a positive integer',
        );
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns the authenticated TestRail server version', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ version: '10.7.0.1021' }));

        await expect(client.metadata.getVersion()).resolves.toEqual({ version: '10.7.0.1021' });
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/get_version'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('sends the official refs filter for plans', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

        await client.plans.getPlans(3, { refs: 'ENG-101' });

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('refs=ENG-101'), expect.anything());
    });

    it('sends official run filter names and serializes list-valued IDs', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

        await client.runs.getRuns(3, {
            includePlanRuns: true,
            milestoneId: [4, 5],
            refs: 'ENG-101',
            suiteId: [6, 7],
        });

        const url = mockFetch.mock.calls[0]?.[0] as string;
        expect(url).toContain('include_plan_runs=1');
        expect(url).toContain('milestone_id=4%2C5');
        expect(url).toContain('refs=ENG-101');
        expect(url).not.toContain('refs_filter');
        expect(url).toContain('suite_id=6%2C7');
    });

    it('serializes explicit false run booleans as zero', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

        await client.runs.getRuns(3, { includePlanRuns: false, isCompleted: false });

        const url = mockFetch.mock.calls[0]?.[0] as string;
        expect(url).toContain('include_plan_runs=0');
        expect(url).toContain('is_completed=0');
    });

    it('keeps the old refsFilter option as an alias while fixing its wire key', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

        await client.runs.getRuns(3, { refsFilter: 'LEGACY-1' });

        const url = mockFetch.mock.calls[0]?.[0] as string;
        expect(url).toContain('refs=LEGACY-1');
        expect(url).not.toContain('refs_filter');
    });

    it('types and validates dynamic_filters on documented run and plan-entry payloads', () => {
        const dynamic_filters = {
            mode: '1',
            filters: { 'cases:priority_id': { values: [2] } },
        };

        for (const parsed of [
            AddRunPayloadSchema.parse({ name: 'Filtered run', dynamic_filters }),
            UpdateRunPayloadSchema.parse({ dynamic_filters }),
            AddPlanEntryPayloadSchema.parse({ suite_id: 1, dynamic_filters }),
            UpdatePlanEntryPayloadSchema.parse({ dynamic_filters }),
            AddRunToPlanEntryPayloadSchema.parse({ config_ids: [1], dynamic_filters }),
            UpdateRunInPlanEntryPayloadSchema.parse({ dynamic_filters }),
        ]) {
            expect(parsed.dynamic_filters).toEqual(dynamic_filters);
        }

        expect(() => AddRunPayloadSchema.parse({ name: 'Filtered run', dynamic_filters: 'invalid' })).toThrow();
        expect(() => AddRunPayloadSchema.parse({ name: 'Filtered run', dynamic_filters: {} })).toThrow();
        expect(() => AddRunPayloadSchema.parse({ name: 'Filtered run', dynamic_filters: { mode: '1' } })).toThrow();
    });

    it('types the documented scheduling and reference fields on run and plan-entry writes', () => {
        const schedule = { start_on: 1_646_058_600, due_on: 1_648_650_671 };

        expect(AddRunPayloadSchema.parse({ name: 'Scheduled run', ...schedule })).toMatchObject(schedule);
        expect(UpdateRunPayloadSchema.parse(schedule)).toMatchObject(schedule);
        expect(AddRunToPlanEntryPayloadSchema.parse({ config_ids: [1], ...schedule })).toMatchObject(schedule);
        expect(UpdateRunInPlanEntryPayloadSchema.parse({ ...schedule, refs: 'ENG-101' })).toMatchObject({
            ...schedule,
            refs: 'ENG-101',
        });
        expect(Object.keys(UpdatePlanEntryPayloadSchema.shape)).not.toEqual(
            expect.arrayContaining(['suite_id', 'config_ids', 'runs']),
        );
    });

    it('types top-level plan refs and dynamic-filter response fields', () => {
        const dynamic_filters = {
            mode: '1',
            filters: { 'cases:priority_id': { values: [2] } },
        };

        expect(AddPlanPayloadSchema.parse({ name: 'Referenced plan', refs: 'ENG-101' })).toMatchObject({
            refs: 'ENG-101',
        });
        expect(UpdatePlanPayloadSchema.parse({ refs: 'ENG-102' })).toMatchObject({ refs: 'ENG-102' });
        expect(RunSchema.parse({ ...MOCK_RUN, dynamic_filters }).dynamic_filters).toEqual(dynamic_filters);
        expect(
            PlanEntrySchema.parse({
                id: '92ac304e-86e4-4b77-a27a-10d16f1141a2',
                suite_id: 1,
                name: 'Filtered entry',
                description: null,
                assignedto_id: null,
                include_all: false,
                case_ids: [],
                config_ids: [],
                runs: [],
                dynamic_filters,
            }).dynamic_filters,
        ).toEqual(dynamic_filters);
    });
});
