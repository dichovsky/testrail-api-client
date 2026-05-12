import { TestRailClientCore } from '../client-core.js';
import type { Test, GetTestsOptions } from '../types.js';
import { TestSchema } from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';

export class TestModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getTest(testId: number): Promise<Test> {
        this.client.validateId(testId, 'testId');
        return this.client.parse<Test>(TestSchema, await this.client.request<unknown>('GET', `get_test/${testId}`));
    }

    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        this.client.validateId(runId, 'runId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_tests/${runId}`, {
            status_id: serializeIdList(options?.status_id),
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ tests?: Test[] }>(z.object({ tests: z.array(TestSchema).optional() }), raw).tests ?? []
        );
    }
}
