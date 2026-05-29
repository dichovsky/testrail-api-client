import { TestRailClientCore } from '../client-core.js';
import type { Test, GetTestsOptions } from '../types.js';
import { TestSchema } from '../schemas.js';
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
        const endpoint = buildEndpoint(`get_tests/${runId}`, {
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
