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
        return this.client.requestParsed<Test>('GET', `get_test/${testId}`, TestSchema);
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
                await this.client.requestParsed<{ tests?: Test[] }>(
                    'GET',
                    endpoint,
                    z.object({ tests: z.array(TestSchema).nullish() }),
                )
            ).tests ?? []
        );
    }
}
