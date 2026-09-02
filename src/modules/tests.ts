import { TestRailClientCore } from '../client-core.js';
import { TestRailValidationError } from '../errors.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import type {
    TestWithDataResponse,
    UpdateTestLabelsPayload,
    UpdateTestsLabelsPayload,
    UpdateTestsResponse,
} from '../schemas.js';
import { TestSchema, TestWithDataResponseSchema, UpdateTestsResponseSchema } from '../schemas.js';
import type { GetTestsOptions, Test, TestWithData } from '../types.js';
import { serializeIdList } from '../utils.js';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetAllTestsOptions extends Omit<GetTestsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

export interface GetTestOptions {
    /** `1` includes results and attachments; `0` returns the ordinary test. */
    withData?: '0' | '1';
}

export const TESTS_PAGINATION = createPaginatedListExecutor<
    { readonly runId: number },
    GetTestsOptions,
    GetAllTestsOptions,
    Test
>({
    operations: ['get_tests'],
    collectionKey: 'tests',
    itemSchema: TestSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ runId }, options) => {
        validateId(runId, 'runId');
        const statusId = options?.statusId ?? options?.status_id;
        const labelId = options?.labelId ?? options?.label_id;
        if (statusId !== undefined) statusId.forEach((id) => validateId(id, 'statusId'));
        if (labelId !== undefined) labelId.forEach((id) => validateId(id, 'labelId'));
        return {
            operation: 'get_tests',
            pathParameters: [runId],
            query: { status_id: serializeIdList(statusId), label_id: serializeIdList(labelId) },
        };
    },
});

export class TestModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_test/{test_id} */
    async getTest(testId: number, options: { withData: '1' }): Promise<TestWithData>;
    async getTest(testId: number, options?: GetTestOptions): Promise<Test>;
    async getTest(testId: number, options?: GetTestOptions): Promise<Test | TestWithData> {
        validateId(testId, 'testId');
        const withData: unknown = options?.withData;
        if (withData !== undefined && withData !== '0' && withData !== '1') {
            throw new TestRailValidationError('withData must be "0" or "1"');
        }
        const endpoint = buildEndpoint(`get_test/${testId}`, { with_data: withData });
        if (withData === '1') {
            const response = await this.client.request<TestWithDataResponse>({
                method: 'GET',
                endpoint,
                schema: TestWithDataResponseSchema,
            });
            return {
                ...response.test,
                results: [...response.results],
                attachments: [...response.attachments],
            };
        }
        return this.client.request<Test>({ method: 'GET', endpoint, schema: TestSchema });
    }

    /** @testrail GET get_tests/{run_id} */
    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        return TESTS_PAGINATION.items(this.client, { runId }, options);
    }

    /** Fetch one normalized tests page while preserving TestRail pagination metadata. */
    async getTestsPage(runId: number, options?: GetTestsOptions): Promise<Page<Test>> {
        return TESTS_PAGINATION.page(this.client, { runId }, options);
    }

    /** Fetch every tests page under explicit aggregate safety bounds. */
    async getAllTests(runId: number, options?: GetAllTestsOptions): Promise<Test[]> {
        return TESTS_PAGINATION.all(this.client, { runId }, options);
    }

    /**
     * Update the labels assigned to a single test (TestRail Labels API, 2025).
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
     * Bulk-assign the same labels to many tests and return TestRail's acknowledgement.
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
