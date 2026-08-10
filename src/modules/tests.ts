import { TestRailClientCore } from '../client-core.js';
import type { Test, GetTestsOptions } from '../types.js';
import { TestSchema, UpdateTestsResponseSchema } from '../schemas.js';
import type { UpdateTestLabelsPayload, UpdateTestsLabelsPayload, UpdateTestsResponse } from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { listOf, unwrapList } from './list.js';

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
        const raw = await this.client.request<Test[] | { tests?: Test[] }>({
            method: 'GET',
            endpoint,
            schema: listOf('tests', TestSchema),
        });
        return unwrapList<Test>('tests', raw);
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
     * Returns TestRail's acknowledgement — `{ test_ids, labels }` — not the
     * updated tests. An earlier revision modelled the response as a test list;
     * that was a guess made while the docs were unreachable, and because the
     * acknowledgement carries no `tests` key it resolved `[]` on every
     * successful call, reporting "0 tests updated" for work the server had done.
     * See {@link UpdateTestsResponseSchema} for the documented shape.
     *
     * @testrail POST update_tests
     */
    async updateTests(payload: UpdateTestsLabelsPayload): Promise<UpdateTestsResponse> {
        payload.test_ids.forEach((id) => validateId(id, 'testId'));
        return this.client.request<UpdateTestsResponse>({
            method: 'POST',
            endpoint: 'update_tests',
            schema: UpdateTestsResponseSchema,
            body: { kind: 'json', data: payload },
        });
    }
}
