import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { TestRailValidationError, type TestRailClient } from '../src/client.js';
import type { GetProjectsOptions } from '../src/modules/projects.js';
import type { Result } from '../src/types.js';
import {
    CopyCasesToSectionPayloadSchema,
    DeleteCasesPayloadSchema,
    EditResultPayloadSchema,
    MoveCasesToSectionPayloadSchema,
    UpdateCasesPayloadSchema,
    UpdateTestsLabelsPayloadSchema,
    type UpdateTestsLabelsPayload,
} from '../src/schemas.js';
import { createClient, mockOk, MOCK_RESULT } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

/** Endpoint (path + query) of the Nth fetch call, percent-decoded. */
function sentEndpoint(call = 0): string {
    const [url] = mockFetch.mock.calls[call] as [string];
    return decodeURIComponent(url.split('/api/v2/')[1] ?? '');
}

/** Parsed JSON body of the Nth fetch call. */
function sentBody(call = 0): unknown {
    const [, init] = mockFetch.mock.calls[call] as [string, { body: string }];
    return JSON.parse(init.body);
}

describe('10.0.0 module regressions', () => {
    let client: TestRailClient;

    beforeEach(() => {
        mockFetch.mockReset();
        client = createClient();
    });

    afterEach(() => {
        client.destroy();
    });

    describe('label writes unwrap { label } when the entity drifts (functional-modules#2)', () => {
        // `created_on` as an ISO string fails LabelSchema, so advisory validation
        // returns the raw body and the schema transform never runs.
        const drifted = { id: 7, title: 'x', created_on: '2026-01-01' };

        it('addLabel returns the flat label', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ label: drifted }));
            await expect(client.labels.addLabel(1, { title: 'x' })).resolves.toEqual(drifted);
        });

        it('updateLabel returns the flat label', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ label: drifted }));
            await expect(client.labels.updateLabel(7, { project_id: 1, title: 'x' })).resolves.toEqual(drifted);
        });

        it('keeps a flat drifted label unchanged', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(drifted));
            await expect(client.labels.addLabel(1, { title: 'x' })).resolves.toEqual(drifted);
        });

        it('keeps a flat label that carries its own `label` key (flat form wins, as in the schema union)', async () => {
            const flat = { id: 7, title: 'x', label: { id: 99 } };
            mockFetch.mockResolvedValueOnce(mockOk(flat));
            await expect(client.labels.addLabel(1, { title: 'x' })).resolves.toEqual(flat);
        });

        it.each([
            ['a string', 'x'],
            ['an array', [drifted]],
            ['null', null],
        ])('returns the raw body when `label` holds %s instead of an object', async (_label, value) => {
            const raw = { label: value };
            mockFetch.mockResolvedValueOnce(mockOk(raw));
            await expect(client.labels.addLabel(1, { title: 'x' })).resolves.toEqual(raw);
        });
    });

    describe('ID-list filters accept a scalar or a readonly list (functional-modules#3)', () => {
        const ids: readonly number[] = [1, 2];
        const page = (key: string): Response =>
            mockOk({ offset: 0, limit: 250, size: 0, _links: { next: null, prev: null }, [key]: [] });

        it.each<[string, string, (c: TestRailClient) => Promise<unknown>, string]>([
            ['getPlans createdBy', 'plans', (c) => c.plans.getPlans(1, { createdBy: 5 }), 'created_by=5'],
            ['getPlans milestoneId', 'plans', (c) => c.plans.getPlans(1, { milestoneId: 5 }), 'milestone_id=5'],
            ['getPlans created_by', 'plans', (c) => c.plans.getPlans(1, { created_by: 5 }), 'created_by=5'],
            ['getPlans milestone_id', 'plans', (c) => c.plans.getPlans(1, { milestone_id: ids }), 'milestone_id=1,2'],
            ['getTests statusId', 'tests', (c) => c.tests.getTests(1, { statusId: 5 }), 'status_id=5'],
            ['getTests labelId', 'tests', (c) => c.tests.getTests(1, { labelId: ids }), 'label_id=1,2'],
            ['getTests status_id', 'tests', (c) => c.tests.getTests(1, { status_id: ids }), 'status_id=1,2'],
            ['getTests label_id', 'tests', (c) => c.tests.getTests(1, { label_id: 5 }), 'label_id=5'],
            ['getResults statusId', 'results', (c) => c.results.getResults(1, { statusId: 5 }), 'status_id=5'],
            ['getResults status_id', 'results', (c) => c.results.getResults(1, { status_id: ids }), 'status_id=1,2'],
            [
                'getResultsForRun createdBy',
                'results',
                (c) => c.results.getResultsForRun(1, { createdBy: 5, statusId: ids }),
                'created_by=5&status_id=1,2',
            ],
            [
                'getResultsForRun created_by',
                'results',
                (c) => c.results.getResultsForRun(1, { created_by: ids }),
                'created_by=1,2',
            ],
            ['getRuns createdBy', 'runs', (c) => c.runs.getRuns(1, { createdBy: ids }), 'created_by=1,2'],
            ['getRuns scalar createdBy', 'runs', (c) => c.runs.getRuns(1, { createdBy: 5 }), 'created_by=5'],
        ])('%s', async (_name, key, call, query) => {
            mockFetch.mockResolvedValueOnce(page(key));
            await call(client);
            expect(sentEndpoint()).toContain(`&${query}`);
        });

        it.each<[string, (c: TestRailClient) => Promise<unknown>, string]>([
            ['getPlans', (c) => c.plans.getPlans(1, { createdBy: 0 }), 'createdBy must be a positive integer'],
            ['getTests', (c) => c.tests.getTests(1, { statusId: 1.5 }), 'statusId must be a positive integer'],
            ['getResults', (c) => c.results.getResults(1, { statusId: -1 }), 'statusId must be a positive integer'],
        ])('%s rejects an invalid scalar with TestRailValidationError', async (_name, call, message) => {
            await expect(call(client)).rejects.toThrow(TestRailValidationError);
            await expect(call(client)).rejects.toThrow(message);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('body-carried ID lists are validated before any request (functional-modules#6)', () => {
        const bulkWrites: [string, (c: TestRailClient, ids: number[]) => Promise<unknown>][] = [
            ['updateCases', (c, ids) => c.cases.updateCases(1, { case_ids: ids })],
            ['deleteCases', (c, ids) => c.cases.deleteCases(1, 2, { case_ids: ids })],
            ['copyCasesToSection', (c, ids) => c.cases.copyCasesToSection(1, { case_ids: ids })],
            ['moveCasesToSection', (c, ids) => c.cases.moveCasesToSection(1, { case_ids: ids, suite_id: 1 })],
        ];

        it.each(bulkWrites)('%s rejects an empty case_ids list', async (_name, call) => {
            await expect(call(client, [])).rejects.toThrow(TestRailValidationError);
            await expect(call(client, [])).rejects.toThrow('caseIds must contain at least one positive integer');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it.each(bulkWrites)('%s rejects an invalid case ID', async (_name, call) => {
            await Promise.all(
                [-1, 0, 1.5, Number.NaN].map((bad) =>
                    expect(call(client, [1, bad])).rejects.toThrow('caseIds[1] must be a positive integer'),
                ),
            );
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it.each(bulkWrites)('%s rejects a case_ids value that is not an array', async (_name, call) => {
            await expect(call(client, 5 as unknown as number[])).rejects.toThrow(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('deleteCases still sends a valid list unchanged', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const payload = { case_ids: [3, 4] };
            await client.cases.deleteCases(1, 2, payload);
            expect(sentBody()).toEqual({ case_ids: [3, 4] });
            expect(payload).toEqual({ case_ids: [3, 4] });
        });

        it('addCases rejects an empty list', async () => {
            await expect(client.cases.addCases(1, [])).rejects.toThrow(TestRailValidationError);
            await expect(client.cases.addCases(1, [])).rejects.toThrow('cases must contain at least one case');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('updateTests rejects a missing or empty test_ids list with TestRailValidationError', async () => {
            const missing = { labels: [1] } as unknown as UpdateTestsLabelsPayload;
            await expect(client.tests.updateTests(missing)).rejects.toThrow(TestRailValidationError);
            await expect(client.tests.updateTests({ test_ids: [], labels: [1] })).rejects.toThrow(
                'testIds must contain at least one positive integer',
            );
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it.each([
            ['UpdateCasesPayloadSchema', UpdateCasesPayloadSchema, {}],
            ['DeleteCasesPayloadSchema', DeleteCasesPayloadSchema, {}],
            ['CopyCasesToSectionPayloadSchema', CopyCasesToSectionPayloadSchema, {}],
            ['MoveCasesToSectionPayloadSchema', MoveCasesToSectionPayloadSchema, { suite_id: 1 }],
        ])('%s requires a non-empty list of positive integer case IDs', (_name, schema, rest) => {
            expect(schema.safeParse({ ...rest, case_ids: [1, 2] }).success).toBe(true);
            for (const bad of [[], [0], [-1], [1.5]]) {
                expect(schema.safeParse({ ...rest, case_ids: bad }).success).toBe(false);
            }
        });

        it('UpdateTestsLabelsPayloadSchema requires a non-empty list of positive integer test IDs', () => {
            expect(UpdateTestsLabelsPayloadSchema.safeParse({ test_ids: [1], labels: [] }).success).toBe(true);
            for (const bad of [[], [0], [-1], [1.5]]) {
                expect(UpdateTestsLabelsPayloadSchema.safeParse({ test_ids: bad, labels: [] }).success).toBe(false);
            }
        });
    });

    describe('editResult ignores undefined-valued keys when counting fields (functional-modules#7)', () => {
        it('rejects a payload whose only keys are undefined before fetching', async () => {
            await expect(client.results.editResult(41, { comment: undefined })).rejects.toThrow(
                'At least one result field is required',
            );
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('EditResultPayloadSchema applies the same rule', () => {
            expect(EditResultPayloadSchema.safeParse({ comment: undefined }).success).toBe(false);
            expect(EditResultPayloadSchema.safeParse({ comment: undefined, defects: 'TR-7' }).success).toBe(true);
            expect(EditResultPayloadSchema.safeParse({ custom_quality_gate: 'approved' }).success).toBe(true);
        });
    });

    describe('timestamp filters are validated before any request (functional-modules#9)', () => {
        const page = (key: string): Response =>
            mockOk({ offset: 0, limit: 250, size: 0, _links: { next: null, prev: null }, [key]: [] });
        const invalid: [string, unknown][] = [
            ['NaN', Number.NaN],
            ['Infinity', Number.POSITIVE_INFINITY],
            ['a fraction', -1.5],
            ['a negative integer', -1],
            ['a numeric string', '100'],
        ];
        const filters: [string, (c: TestRailClient, value: number) => Promise<unknown>][] = [
            ['getCases createdAfter', (c, v) => c.cases.getCases(1, { createdAfter: v })],
            ['getCases createdBefore', (c, v) => c.cases.getCases(1, { createdBefore: v })],
            ['getCases updatedAfter', (c, v) => c.cases.getCases(1, { updatedAfter: v })],
            ['getCases updatedBefore', (c, v) => c.cases.getCases(1, { updatedBefore: v })],
            ['getPlans createdAfter', (c, v) => c.plans.getPlans(1, { createdAfter: v })],
            ['getPlans createdBefore', (c, v) => c.plans.getPlans(1, { createdBefore: v })],
            ['getPlans created_after', (c, v) => c.plans.getPlans(1, { created_after: v })],
            ['getPlans created_before', (c, v) => c.plans.getPlans(1, { created_before: v })],
            ['getRuns createdAfter', (c, v) => c.runs.getRuns(1, { createdAfter: v })],
            ['getRuns createdBefore', (c, v) => c.runs.getRuns(1, { createdBefore: v })],
            ['getResultsForRun createdAfter', (c, v) => c.results.getResultsForRun(1, { createdAfter: v })],
            ['getResultsForRun createdBefore', (c, v) => c.results.getResultsForRun(1, { createdBefore: v })],
            ['getResultsForRun created_after', (c, v) => c.results.getResultsForRun(1, { created_after: v })],
            ['getResultsForRun created_before', (c, v) => c.results.getResultsForRun(1, { created_before: v })],
            ['getSharedSteps createdAfter', (c, v) => c.sharedSteps.getSharedSteps(1, { createdAfter: v })],
            ['getSharedSteps createdBefore', (c, v) => c.sharedSteps.getSharedSteps(1, { createdBefore: v })],
            ['getSharedSteps updatedAfter', (c, v) => c.sharedSteps.getSharedSteps(1, { updatedAfter: v })],
            ['getSharedSteps updatedBefore', (c, v) => c.sharedSteps.getSharedSteps(1, { updatedBefore: v })],
        ];

        it.each(filters)('%s rejects every invalid timestamp', async (name, call) => {
            const option = name.split(' ')[1]?.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
            await Promise.all(
                invalid.flatMap(([, value]) => {
                    const pending = call(client, value as number);
                    return [
                        expect(pending).rejects.toThrow(TestRailValidationError),
                        expect(pending).rejects.toThrow(`${option} must be a non-negative integer Unix timestamp`),
                    ];
                }),
            );
            expect(mockFetch).not.toHaveBeenCalled();
        });

        // `null` from an untyped caller means "not supplied" for every timestamp
        // filter, as the `camel ?? snake` adapters (plans, results) already did.
        it.each(filters)('%s treats null as not supplied instead of sending "null"', async (_name, call) => {
            mockFetch.mockResolvedValueOnce(
                mockOk({
                    offset: 0,
                    limit: 250,
                    size: 0,
                    _links: { next: null, prev: null },
                    cases: [],
                    runs: [],
                    plans: [],
                    results: [],
                    shared_steps: [],
                }),
            );
            await call(client, null as unknown as number);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(sentEndpoint()).not.toMatch(/_(?:after|before)=/);
        });

        it.each<[string, (c: TestRailClient) => Promise<unknown>]>([
            ['getCases typeId', (c) => c.cases.getCases(1, { typeId: null as unknown as number })],
            ['getTests labelId', (c) => c.tests.getTests(1, { labelId: null as unknown as number })],
        ])('%s treats a null ID filter as not supplied', async (_name, call) => {
            mockFetch.mockResolvedValueOnce(
                mockOk({ offset: 0, limit: 250, size: 0, _links: { next: null, prev: null }, cases: [], tests: [] }),
            );
            await call(client);
            expect(sentEndpoint()).not.toMatch(/(?:type|label)_id=/);
        });

        it.each<[string, (c: TestRailClient, ids: number[]) => Promise<unknown>]>([
            ['deleteCases', (c, ids) => c.cases.deleteCases(1, 2, { case_ids: ids })],
            ['updateTests', (c, ids) => c.tests.updateTests({ test_ids: ids, labels: ['x'] })],
            ['getCases typeId', (c, ids) => c.cases.getCases(1, { typeId: ids })],
        ])('%s rejects a sparse ID list before any request', async (_name, call) => {
            const sparse: number[] = [];
            sparse[0] = 1;
            sparse[2] = 3;
            await expect(call(client, sparse)).rejects.toThrow(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('still sends valid timestamps, including 0', async () => {
            mockFetch.mockResolvedValueOnce(page('cases'));
            await client.cases.getCases(1, { createdAfter: 0, updatedBefore: 1_763_683_200 });
            expect(sentEndpoint()).toBe('get_cases/1&created_after=0&updated_before=1763683200');
        });

        it('getBdds drops a non-array, non-string refs value like getCases does', async () => {
            mockFetch.mockResolvedValueOnce(page('bdd'));
            await client.bdd.getBdds(1, { refs: null as unknown as string });
            expect(sentEndpoint()).toBe('get_bdds/1');
        });
    });

    describe('Result.quality_rating accepts the documented object of dimension scores (api-currency#9)', () => {
        const rating = { factual_accuracy: 4, relevance: 5 };

        it('a read of a rated result does not report a schema mismatch', async () => {
            const onSchemaMismatch = vi.fn();
            const observed = createClient({ onSchemaMismatch });
            try {
                mockFetch.mockResolvedValueOnce(mockOk([{ ...MOCK_RESULT, quality_rating: rating }]));
                const [result] = await observed.results.getResults(2);
                expect(result?.quality_rating).toEqual(rating);
                expect(onSchemaMismatch).not.toHaveBeenCalled();
            } finally {
                observed.destroy();
            }
        });

        it('types the field as a number or a record of scores', () => {
            expectTypeOf<Result['quality_rating']>().toEqualTypeOf<
                number | Record<string, unknown> | null | undefined
            >();
        });
    });

    describe('getProjectsPage is declared with the current options type (architecture#4)', () => {
        it('names GetProjectsOptions, not the deprecated GetProjectsPageOptions alias', () => {
            // The two types are identical, so only the declaration text differs:
            // the shipped .d.ts must not show a deprecated name on a current method.
            const source = readFileSync(new URL('../src/modules/projects.ts', import.meta.url), 'utf8');
            const uses = source.split('\n').filter((line) => line.includes('GetProjectsPageOptions'));
            expect(uses).toEqual(['export type GetProjectsPageOptions = GetProjectsOptions;']);
            expectTypeOf<Parameters<TestRailClient['projects']['getProjectsPage']>[0]>().toEqualTypeOf<
                GetProjectsOptions | undefined
            >();
        });
    });
});
