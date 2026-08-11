import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailApiError, TestRailClient, TestRailLicenseError, TestRailValidationError } from '../src/client.js';
import type { SchemaMismatch } from '../src/types.js';
import { BASE_CONFIG, MOCK_MILESTONE, MOCK_RUN, mockOk } from './helpers.js';

/**
 * 6.0.0 — response validation is advisory.
 *
 * A response that fails its Zod schema no longer throws: the raw body is
 * returned unchanged and `onSchemaMismatch` is notified. Caller-supplied input
 * (client config, CLI write payloads) is unaffected and still fails closed.
 *
 * These tests cover the policy itself. Per-field schema corrections shipped
 * alongside it live with their domains in `client-endpoints.test.ts`.
 */

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('advisory response validation (6.0.0)', () => {
    let mismatches: SchemaMismatch[];
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        mismatches = [];
        client = new TestRailClient({
            ...BASE_CONFIG,
            onSchemaMismatch: (m) => {
                mismatches.push(m);
            },
        });
    });

    describe('comment-only result regression', () => {
        // A comment-only result — a comment recorded with no status change —
        // comes back with `status_id: null`. Because list endpoints validate a
        // whole page at once, one such row used to invalidate the whole page.
        // This is a fully synthetic fixture matching that response structure.
        const commentOnlyRow = {
            id: 11,
            test_id: 21,
            status_id: null,
            created_on: 1,
            assignedto_id: null,
            comment: 'Comment only',
            defects: null,
            created_by: 3,
            case_id: 31,
            defects_data: [],
            attachment_ids: [],
        };
        const normalRow = { id: 12, test_id: 22, status_id: 1, created_on: 2 };

        it('returns every row of a page containing comment-only results', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [normalRow, commentOnlyRow, normalRow] }));
            const results = await client.results.getResultsForRun(1);
            expect(results).toHaveLength(3);
            expect(results[1]?.status_id).toBeNull();
        });

        it('does not report a mismatch — status_id: null is now modelled', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [commentOnlyRow] }));
            await client.results.getResultsForRun(1);
            expect(mismatches).toHaveLength(0);
        });

        it('echoes a comment-only result back from addResult without throwing', async () => {
            // The write succeeded; only the echoed response failed to parse.
            mockFetch.mockResolvedValueOnce(mockOk(commentOnlyRow));
            const created = await client.results.addResult(21, { status_id: 1, comment: 'Comment only' });
            expect(created.status_id).toBeNull();
        });
    });

    describe('an unmodelled mismatch degrades instead of failing', () => {
        // A shape nothing in the schema anticipates: status_id as a string.
        const driftedRow = { id: 1, test_id: 2, status_id: '1' };

        it('returns the raw body unchanged rather than throwing', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [driftedRow] }));
            const results = await client.results.getResultsForRun(1);
            expect(results[0]?.status_id).toBe('1');
        });

        it('reports the mismatch with the originating request and the Zod error', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [driftedRow] }));
            await client.results.getResultsForRun(1);

            expect(mismatches).toHaveLength(1);
            const [mismatch] = mismatches;
            expect(mismatch?.method).toBe('GET');
            expect(mismatch?.endpoint).toContain('get_results_for_run/1');
            // List reads parse through `listOf()`, a union, so the top-level
            // issue is `invalid_union` and the offending path sits one level
            // down under `issues[0].errors[<branch>]`. Assert the detail is
            // reachable rather than pinning the nesting.
            expect(mismatch?.error.issues[0]?.code).toBe('invalid_union');
            expect(JSON.stringify(mismatch?.error.issues)).toContain('status_id');
            // `data` is the raw body, which is also what the caller received.
            expect(mismatch?.data).toEqual({ results: [driftedRow] });
        });

        it('keeps the surrounding valid rows', async () => {
            const good = { id: 9, test_id: 9, status_id: 5 };
            mockFetch.mockResolvedValueOnce(mockOk({ results: [good, driftedRow, good] }));
            const results = await client.results.getResultsForRun(1);
            expect(results).toHaveLength(3);
        });

        it('is silent when no hook is configured', async () => {
            const silent = new TestRailClient(BASE_CONFIG);
            mockFetch.mockResolvedValueOnce(mockOk({ results: [driftedRow] }));
            await expect(silent.results.getResultsForRun(1)).resolves.toHaveLength(1);
            silent.destroy();
        });
    });

    describe('strict mode is one line away', () => {
        it('restores fail-closed behavior when the hook throws', async () => {
            const strict = new TestRailClient({
                ...BASE_CONFIG,
                onSchemaMismatch: ({ error }) => {
                    throw error;
                },
            });
            mockFetch.mockResolvedValueOnce(mockOk({ results: [{ id: 1, test_id: 2, status_id: '1' }] }));
            await expect(strict.results.getResultsForRun(1)).rejects.toThrow();
            strict.destroy();
        });

        it('leaves a conforming response untouched in strict mode', async () => {
            const strict = new TestRailClient({
                ...BASE_CONFIG,
                onSchemaMismatch: ({ error }) => {
                    throw error;
                },
            });
            mockFetch.mockResolvedValueOnce(mockOk({ results: [{ id: 1, test_id: 2, status_id: 1 }] }));
            await expect(strict.results.getResultsForRun(1)).resolves.toHaveLength(1);
            strict.destroy();
        });
    });

    describe('input validation still fails closed', () => {
        it('rejects an invalid id before any request is issued', async () => {
            await expect(client.results.getResultsForRun(0)).rejects.toThrow('runId must be a positive integer');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('rejects a malformed client configuration at construction', () => {
            expect(() => new TestRailClient({ ...BASE_CONFIG, baseUrl: 'not-a-url' })).toThrow();
        });
    });

    describe('getCaseStatuses parses the documented response', () => {
        it('accepts the stock Approved/Draft rows (abbreviation: null, is_untested absent)', async () => {
            // Both defects at once: `abbreviation` is null on the built-in
            // statuses, and `is_untested` belongs to get_statuses so it is never
            // emitted here. Either alone failed every row of every call.
            const documented = [
                { case_status_id: 1, name: 'Approved', abbreviation: null, is_default: false, is_approved: true },
                { case_status_id: 2, name: 'Draft', abbreviation: null, is_default: true, is_approved: false },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(documented));

            const statuses = await client.metadata.getCaseStatuses();
            expect(statuses).toHaveLength(2);
            expect(statuses[0]?.abbreviation).toBeNull();
            expect(statuses[0]?.is_untested).toBeUndefined();
            expect(mismatches).toHaveLength(0);
        });
    });

    describe('list endpoints accept both the envelope and a bare array', () => {
        // Multiple endpoints have returned a bare array despite a documented
        // wrapper. These unions cost nothing — the method contract stays
        // `Entity[]` either way — and remove a whole class of total failure.
        const cases: [string, () => Promise<unknown[]>, string, unknown][] = [
            [
                'getCases',
                () => client.cases.getCases(1),
                'cases',
                {
                    id: 1,
                    title: 'C',
                    section_id: 1,
                    suite_id: 1,
                    created_by: 1,
                    created_on: 1,
                    updated_by: 1,
                    updated_on: 1,
                },
            ],
            [
                'getSections',
                () => client.sections.getSections(1),
                'sections',
                { id: 1, suite_id: 1, name: 'S', display_order: 1, depth: 0 },
            ],
            [
                'getUsers',
                () => client.users.getUsers(),
                'users',
                { id: 1, name: 'Example User', email: 'user@example.com', is_active: true },
            ],
            ['getVariables', () => client.variables.getVariables(1), 'variables', { id: 1, name: 'v' }],
            ['getDatasets', () => client.datasets.getDatasets(1), 'datasets', { id: 1, name: 'd' }],
            [
                'getHistoryForCase',
                () => client.cases.getHistoryForCase(42),
                'history',
                { id: 1, user_id: 1, type_id: 1 },
            ],
            [
                'getResultsForRun',
                () => client.results.getResultsForRun(1),
                'results',
                { id: 1, test_id: 2, status_id: 1 },
            ],
            [
                'getTests',
                () => client.tests.getTests(1),
                'tests',
                { id: 1, case_id: 1, status_id: 5, run_id: 1, title: 'T' },
            ],
            ['getRuns', () => client.runs.getRuns(1), 'runs', MOCK_RUN],
            ['getMilestones', () => client.milestones.getMilestones(1), 'milestones', MOCK_MILESTONE],
            ['getRoles', () => client.metadata.getRoles(), 'roles', { id: 1, name: 'Admin', is_default: false }],
            ['getGroups', () => client.users.getGroups(), 'groups', { id: 1, name: 'G' }],
            ['getLabels', () => client.labels.getLabels(1), 'labels', { id: 1, title: 'L' }],
        ];

        it.each(cases)('%s accepts the paginated envelope', async (_name, call, key, entity) => {
            mockFetch.mockResolvedValueOnce(
                mockOk({ offset: 0, limit: 250, size: 1, _links: { next: null, prev: null }, [key]: [entity] }),
            );
            await expect(call()).resolves.toHaveLength(1);
            expect(mismatches).toHaveLength(0);
        });

        it.each(cases)('%s accepts a bare array', async (_name, call, _key, entity) => {
            mockFetch.mockResolvedValueOnce(mockOk([entity]));
            await expect(call()).resolves.toHaveLength(1);
            expect(mismatches).toHaveLength(0);
        });

        it.each(cases)('%s returns [] for an empty envelope', async (_name, call, key) => {
            mockFetch.mockResolvedValueOnce(mockOk({ [key]: null }));
            await expect(call()).resolves.toEqual([]);
        });
    });

    describe('reported response-shape regressions', () => {
        // All payloads below are synthetic and retain only the structures needed
        // to exercise each defect.

        it('getHistoryForCase parses an OBJECT-shaped changes[].options (report #3)', async () => {
            // The doc's field table calls `options` an array; the wire sends an
            // object for some dropdown-style custom-field changes.
            const wire = {
                history: [
                    {
                        id: 1,
                        type_id: 1,
                        created_on: 1,
                        user_id: 1,
                        changes: [
                            {
                                type_id: 1,
                                old_text: ' Option A ',
                                new_text: ' Option B ',
                                label: 'Example Category',
                                options: {
                                    is_required: false,
                                    default_value: '0',
                                    items: '0, Option A\n1, Option B\n2, Option C',
                                },
                                field: 'custom_example_category',
                                old_value: 0,
                                new_value: '1',
                            },
                        ],
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(wire));

            const history = await client.cases.getHistoryForCase(1);
            expect(history[0]?.changes?.[0]?.options).toEqual({
                is_required: false,
                default_value: '0',
                items: '0, Option A\n1, Option B\n2, Option C',
            });
            expect(mismatches).toHaveLength(0);
        });

        it('getHistoryForCase still parses the documented array-shaped options (report #3)', async () => {
            // The union keeps the documented form so a field type that does emit
            // an array is not traded away for the object fix.
            const wire = {
                history: [{ id: 1, type_id: 1, created_on: 1, user_id: 1, changes: [{ options: [] }] }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(wire));
            await client.cases.getHistoryForCase(1);
            expect(mismatches).toHaveLength(0);
        });

        it('getResultFields parses array-shaped options.items (report #6)', async () => {
            // `items` is commonly a newline-delimited string, but some result
            // field configurations return an array of {name, machine_name}.
            const wire = [
                {
                    id: 1,
                    name: 'array_items',
                    system_name: 'custom_array_items',
                    label: 'Array Items',
                    type_id: 16,
                    display_order: 1,
                    is_active: true,
                    include_all: true,
                    template_ids: [],
                    configs: [
                        {
                            context: { is_global: true, project_ids: null },
                            options: {
                                is_required: true,
                                items: [
                                    { name: 'Option A', machine_name: 'option_a' },
                                    { name: 'Option B', machine_name: 'option_b' },
                                ],
                            },
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(wire));

            const fields = await client.metadata.getResultFields();
            expect(fields[0]?.configs[0]?.options.items).toHaveLength(2);
            expect(mismatches).toHaveLength(0);
        });

        it('getCaseFields still parses the newline-delimited string form of items (report #6)', async () => {
            const wire = [
                {
                    id: 1,
                    name: 'example_category',
                    system_name: 'custom_example_category',
                    label: 'Example Category',
                    type_id: 6,
                    display_order: 1,
                    is_active: true,
                    include_all: true,
                    template_ids: [],
                    configs: [
                        {
                            context: { is_global: true, project_ids: '' },
                            options: { is_required: false, default_value: '0', items: '0, Option A\n1, Option B' },
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(wire));

            const fields = await client.metadata.getCaseFields();
            expect(fields[0]?.configs[0]?.options.items).toBe('0, Option A\n1, Option B');
            expect(mismatches).toHaveLength(0);
        });

        it('getAttachmentsForTest accepts the bare array TestRail actually returns (report #2)', async () => {
            // Structural, not data-dependent: get_attachments_for_test returns a
            // bare array even when empty, while the _for_case and _for_run
            // siblings return the paginated wrapper.
            mockFetch.mockResolvedValueOnce(mockOk([]));
            await expect(client.attachments.getAttachmentsForTest(1)).resolves.toEqual([]);
            expect(mismatches).toHaveLength(0);
        });

        it('getUsers parses mfa_required delivered as 0 rather than false (report #4)', async () => {
            mockFetch.mockResolvedValueOnce(
                mockOk({
                    users: [
                        {
                            id: 1,
                            name: 'Example User',
                            email: 'user@example.com',
                            is_active: true,
                            mfa_required: 0,
                        },
                    ],
                }),
            );
            const users = await client.users.getUsers();
            expect(users[0]?.mfa_required).toBe(0);
            expect(mismatches).toHaveLength(0);
        });

        it('getResultFields parses a config that omits default_value entirely (report #5)', async () => {
            const wire = [
                {
                    id: 1,
                    name: 'defects',
                    system_name: 'defects',
                    label: 'Defects',
                    type_id: 1,
                    display_order: 1,
                    is_active: true,
                    include_all: true,
                    template_ids: [],
                    configs: [{ context: { is_global: true, project_ids: null }, options: { is_required: false } }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(wire));
            await expect(client.metadata.getResultFields()).resolves.toHaveLength(1);
            expect(mismatches).toHaveLength(0);
        });

        // TestRail words the same condition two ways. Anchoring on
        // "not an enterprise …" matched get_variables/get_datasets but not
        // get_case_statuses, so a caller branching on
        // `instanceof TestRailLicenseError` to degrade gracefully missed it.
        it.each([
            ['get_datasets phrasing', '{"error":"Not an Enterprise license/subscription."}'],
            [
                'get_case_statuses phrasing',
                '{"error":"You do not have permission to access this endpoint (Requires Enterprise license)."}',
            ],
        ])('classifies the %s of an Enterprise-license 403 (report #8)', async (_label, body) => {
            mockFetch.mockResolvedValueOnce(new Response(body, { status: 403, statusText: 'Forbidden' }));
            await expect(client.metadata.getCaseStatuses()).rejects.toThrow(TestRailLicenseError);
        });

        it('leaves an ordinary 403 as a plain TestRailApiError (report #8 — no over-widening)', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response('{"error":"You do not have permission to access this endpoint."}', {
                    status: 403,
                    statusText: 'Forbidden',
                }),
            );
            const err = await client.metadata.getCaseStatuses().catch((e: unknown) => e);
            expect(err).toBeInstanceOf(TestRailApiError);
            expect(err).not.toBeInstanceOf(TestRailLicenseError);
        });

        it.each([
            [
                'a proxy HTML page that merely mentions the phrase',
                '<html><body><h1>403 Forbidden</h1><p>Contact IT about your Enterprise subscription.</p></body></html>',
            ],
            [
                'a permission denial echoing an entity named after it',
                '{"error":"No access to project Enterprise Licensing."}',
            ],
        ])('does not misclassify %s as a license restriction', async (_label, body) => {
            // The non-JSON fallback matches the entire raw document, so the bare
            // "enterprise licen…" stem would classify a corporate proxy's
            // boilerplate — and a caller branching on `instanceof
            // TestRailLicenseError` would disable a feature permanently over a
            // transient ACL problem. Both real TestRail phrasings lead with
            // "Not an …" or "Requires …"; neither of these does.
            mockFetch.mockResolvedValueOnce(new Response(body, { status: 403, statusText: 'Forbidden' }));
            const err = await client.metadata.getCaseStatuses().catch((e: unknown) => e);
            expect(err).toBeInstanceOf(TestRailApiError);
            expect(err).not.toBeInstanceOf(TestRailLicenseError);
        });

        it('getAttachmentsForCase parses a numeric data_id (report #7)', async () => {
            const attachment = {
                id: 101,
                name: 'image.png',
                filetype: 'png',
                cassandra_file_id: '00000000-0000-4000-8000-000000000001',
                size: 1024,
                created_on: 1,
                project_id: 1,
                user_id: 2,
                // The defect: documented as a string, delivered as an integer.
                data_id: 101,
                is_image: true,
                icon: 'bitmap',
            };
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: [attachment] }));
            const attachments = await client.attachments.getAttachmentsForCase(1);
            expect(attachments[0]?.data_id).toBe(101);
            expect(mismatches).toHaveLength(0);
        });
    });

    describe('soft-delete previews survive an explicit null counter', () => {
        it('parses a preview where a counter is null rather than omitted', async () => {
            // `.optional()` is `T | undefined` and rejects an explicit null, so
            // a null counter used to fail the parse of a destructive-delete
            // preview — the call where a trustworthy answer matters most.
            mockFetch.mockResolvedValueOnce(mockOk({ affected_tests: null, affected_cases: 3 }));
            const preview = await client.cases.deleteCase(1, { soft: true });
            expect(preview?.affected_cases).toBe(3);
            expect(mismatches).toHaveLength(0);
        });

        it('reports the originating endpoint when a preview does drift', async () => {
            // The soft-delete previews call parse() directly rather than
            // through request(), so they have to thread the request context by
            // hand. Without it the hook fires with empty method/endpoint and
            // cannot say which call drifted — on a destructive operation.
            mockFetch.mockResolvedValueOnce(mockOk({ affected_cases: 'three' }));
            await client.cases.deleteCase(7, { soft: true });

            expect(mismatches).toHaveLength(1);
            expect(mismatches[0]?.method).toBe('POST');
            expect(mismatches[0]?.endpoint).toContain('delete_case/7');
        });
    });

    describe('a list read never degrades to a silent zero rows', () => {
        // The failure mode `listOf`/`unwrapList` exist to prevent: a body that
        // is not the expected list resolving to `[]` with no error and no hook
        // notification, so a caller reads "this run has no results" and acts on
        // it. Valid outer shapes return rows; invalid outer shapes both report
        // a mismatch and fail closed rather than fabricating an empty list.

        it('unwraps get_history_for_case documented outer-array-of-envelope shape', async () => {
            // The documented example wraps the pagination object in an outer
            // array: `[{ offset, limit, size, _links, history: [...] }]`. Without
            // a branch for it the raw outer array came back, and unwrapList
            // treated any array as already normalized — handing the caller the
            // envelope itself as result[0], typed HistoryEntry but with no id.
            const entry = { id: 5, user_id: 1, type_id: 1, created_on: 1 };
            mockFetch.mockResolvedValueOnce(
                mockOk([
                    {
                        offset: 0,
                        limit: 250,
                        size: 1,
                        _links: { next: null, prev: null },
                        history: [entry],
                    },
                ]),
            );
            const history = await client.cases.getHistoryForCase(1);
            expect(history).toEqual([entry]);
            expect(history[0]?.id).toBe(5);
            expect(mismatches).toHaveLength(0);
        });

        it('still accepts the bare envelope and the bare array for case history', async () => {
            const entry = { id: 5, user_id: 1, type_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk({ history: [entry] }));
            await expect(client.cases.getHistoryForCase(1)).resolves.toEqual([entry]);
            mockFetch.mockResolvedValueOnce(mockOk([entry]));
            await expect(client.cases.getHistoryForCase(1)).resolves.toEqual([entry]);
            expect(mismatches).toHaveLength(0);
        });

        it('reports and rejects an object without the envelope key', async () => {
            // `{ [key]: ... }` is `.nullable()`, not `.nullish()`. With
            // `.nullish()` this object would parse *successfully* to `{}` —
            // silent, invisible even to a hook-configured client.
            mockFetch.mockResolvedValueOnce(mockOk({ error: 'Something went wrong' }));
            await expect(client.results.getResultsForRun(1)).rejects.toThrow(TestRailApiError);
            expect(mismatches).toHaveLength(1);
            expect(mismatches[0]?.endpoint).toContain('get_results_for_run/1');
        });

        it('reports and rejects when the envelope key is renamed', async () => {
            // A server-side rename, or a `key` typo between the paired listOf
            // and unwrapList calls, lands here.
            mockFetch.mockResolvedValueOnce(mockOk({ result_list: [{ id: 1, test_id: 2, status_id: 1 }] }));
            await expect(client.results.getResultsForRun(1)).rejects.toThrow(TestRailApiError);
            expect(mismatches).toHaveLength(1);
        });

        it('reports and rejects a single-entity body', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ id: 1, test_id: 2, status_id: 1 }));
            await expect(client.results.getResultsForRun(1)).rejects.toThrow(TestRailApiError);
            expect(mismatches).toHaveLength(1);
        });

        it('still treats an explicit null key as an empty list, with no mismatch', async () => {
            // Observed behavior (PR #130) — the key is present, so this is a
            // genuine empty page rather than an unrecognized body.
            mockFetch.mockResolvedValueOnce(mockOk({ results: null }));
            await expect(client.results.getResultsForRun(1)).resolves.toEqual([]);
            expect(mismatches).toHaveLength(0);
        });

        it('reports and rejects when the envelope key holds a non-array', async () => {
            // Without the Array.isArray guard in unwrapList this resolved to the
            // string "oops" typed as Result[]: `.map` throws TypeError, `.length`
            // reports 4, and for...of iterates characters.
            mockFetch.mockResolvedValueOnce(mockOk({ results: 'oops' }));
            await expect(client.results.getResultsForRun(1)).rejects.toThrow(TestRailApiError);
            expect(mismatches).toHaveLength(1);
        });

        it('reports and rejects when the whole body is a scalar', async () => {
            mockFetch.mockResolvedValueOnce(mockOk('nope'));
            await expect(client.results.getResultsForRun(1)).rejects.toThrow(TestRailApiError);
            expect(mismatches).toHaveLength(1);
        });
    });

    describe('the hook is caller-supplied input and fails closed', () => {
        it('rejects a non-function hook at construction, not on first mismatch', () => {
            // Previously this constructed cleanly and threw a bare TypeError from
            // inside the client on the first mismatch — potentially after a
            // successful write, leaving the caller unsure whether to retry.
            expect(
                () => new TestRailClient({ ...BASE_CONFIG, onSchemaMismatch: 'warn' as unknown as () => void }),
            ).toThrow(/onSchemaMismatch must be a function/);
        });

        it('rejects an async hook instead of silently failing open', async () => {
            // An async hook satisfies the `void` return type but cannot restore
            // fail-closed validation: its throw becomes a rejected promise nobody
            // awaits, so the raw body would be returned as though strict mode
            // were off.
            // TypeScript's void-return rule accepts this signature, so `tsc`
            // alone never flags it. Typed lint does (`no-misused-promises`) —
            // hence the disable here — but a consumer without that rule enabled
            // gets no compile-time warning at all, which is what the runtime
            // guard is for.
            const asyncHook = new TestRailClient({
                ...BASE_CONFIG,
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onSchemaMismatch: async () => {
                    throw new Error('strict');
                },
            });
            mockFetch.mockResolvedValueOnce(mockOk({ results: [{ id: 1, test_id: 2, status_id: '1' }] }));
            await expect(asyncHook.results.getResultsForRun(1)).rejects.toThrow(/onSchemaMismatch must be synchronous/);
            asyncHook.destroy();
        });

        it('leaves no unhandled rejection behind when the async hook rejects', async () => {
            // The rejection is swallowed deliberately: an unhandled rejection
            // terminates Node >= 15 by default, so a migration typo in a hook
            // would take the host process down.
            const seen: unknown[] = [];
            const onUnhandled = (reason: unknown): void => {
                seen.push(reason);
            };
            process.on('unhandledRejection', onUnhandled);
            try {
                const asyncHook = new TestRailClient({
                    ...BASE_CONFIG,
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onSchemaMismatch: async () => {
                        throw new Error('boom');
                    },
                });
                mockFetch.mockResolvedValueOnce(mockOk({ results: [{ id: 1, test_id: 2, status_id: '1' }] }));
                await expect(asyncHook.results.getResultsForRun(1)).rejects.toThrow(TestRailValidationError);
                asyncHook.destroy();
                await new Promise((r) => setTimeout(r, 0));
                expect(seen).toEqual([]);
            } finally {
                process.off('unhandledRejection', onUnhandled);
            }
        });
    });
});
