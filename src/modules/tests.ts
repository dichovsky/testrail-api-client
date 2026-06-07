import { TestRailClientCore } from '../client-core.js';
import type { Test, GetTestsOptions } from '../types.js';
import { TestSchema } from '../schemas.js';
import type { UpdateTestLabelsPayload, UpdateTestsLabelsPayload } from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';

export class TestModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_test/{test_id} */
    async getTest(testId: number): Promise<Test> {
        validateId(testId, 'testId');
        return this.client.request<Test>({
            method: 'GET',
            endpoint: `get_test/${testId}`,
            schema: TestSchema,
        });
    }

    /** @testrail GET get_tests/{run_id} */
    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        validateId(runId, 'runId');
        validatePaginationParams(options?.limit, options?.offset);
        const statusId = options?.statusId ?? options?.status_id;
        if (statusId !== undefined) {
            statusId.forEach((id) => validateId(id, 'statusId'));
        }
        const endpoint = buildEndpoint(`get_tests/${runId}`, {
            status_id: serializeIdList(statusId),
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.request<{ tests?: Test[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ tests: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ tests: z.array(TestSchema).nullish() }),
                })
            ).tests ?? []
        );
    }

    /**
     * Update the labels assigned to a single test (TestRail Labels API, 2025).
     * This endpoint mutates labels only — not arbitrary test fields — and
     * returns the test in `get_test` format. The method name mirrors the
     * `update_test` endpoint (per the lib's method=endpoint convention); the
     * label-only scope is documented here so callers don't expect a general
     * test update.
     * @testrail POST update_test/{test_id}
     */
    async updateTest(testId: number, payload: UpdateTestLabelsPayload): Promise<Test> {
        validateId(testId, 'testId');
        return this.client.request<Test>({
            method: 'POST',
            endpoint: `update_test/${testId}`,
            schema: TestSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Bulk-assign the SAME labels to many tests (TestRail Labels API, 2025).
     * `update_tests` takes no path param — the targets are named in the body via
     * `test_ids` — so each ID is validated here before the network call. The
     * endpoint cannot set different labels per test.
     *
     * VERIFY: the response shape is modeled tolerantly as the updated tests
     * (bare array OR `{ tests: [...] }` wrapper, mirroring `getTests` and the
     * `getSuites` bimodal precedent). support.testrail.com blocks automated
     * doc fetch, so this was not byte-confirmed against a live response — if a
     * live instance returns an ack/count object instead, narrow the schema.
     * @testrail POST update_tests
     */
    async updateTests(payload: UpdateTestsLabelsPayload): Promise<Test[]> {
        payload.test_ids.forEach((id) => validateId(id, 'testId'));
        const raw = await this.client.request<Test[] | { tests?: Test[] | null }>({
            method: 'POST',
            endpoint: 'update_tests',
            schema: z.union([z.array(TestSchema), z.object({ tests: z.array(TestSchema).nullish() })]),
            body: { kind: 'json', data: payload },
        });
        return Array.isArray(raw) ? raw : (raw.tests ?? []);
    }
}
