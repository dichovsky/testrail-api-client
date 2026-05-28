import { TestRailClientCore } from '../client-core.js';
import type { Test, GetTestsOptions } from '../types.js';
import { TestSchema } from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';

export class TestModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_test/{test_id} */
    async getTest(testId: number): Promise<Test> {
        this.client.validateId(testId, 'testId');
        return this.client.request<Test>({
            method: 'GET',
            endpoint: `get_test/${testId}`,
            schema: TestSchema,
        });
    }

    /** @testrail GET get_tests/{run_id} */
    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        this.client.validateId(runId, 'runId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_tests/${runId}`, {
            status_id: serializeIdList(options?.status_id),
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
}
