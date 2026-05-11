import { TestRailClientCore } from '../client-core.js';
import type { Result, GetResultsOptions, AddResultPayload, AddResultsForCasesPayload } from '../types.js';
import { ResultSchema } from '../schemas.js';
import { z } from 'zod';

function serializeIdList(ids?: number[]): string | undefined {
    return ids !== undefined && ids.length > 0 ? ids.join(',') : undefined;
}

export class ResultModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.client.validateId(testId, 'testId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_results/${testId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: serializeIdList(options?.created_by),
            status_id: serializeIdList(options?.status_id),
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ results?: Result[] }>(z.object({ results: z.array(ResultSchema).optional() }), raw)
                .results ?? []
        );
    }

    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.client.validateId(runId, 'runId');
        this.client.validateId(caseId, 'caseId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_results_for_case/${runId}/${caseId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: serializeIdList(options?.created_by),
            status_id: serializeIdList(options?.status_id),
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ results?: Result[] }>(z.object({ results: z.array(ResultSchema).optional() }), raw)
                .results ?? []
        );
    }

    async getResultsForRun(runId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.client.validateId(runId, 'runId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_results_for_run/${runId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: serializeIdList(options?.created_by),
            status_id: serializeIdList(options?.status_id),
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ results?: Result[] }>(z.object({ results: z.array(ResultSchema).optional() }), raw)
                .results ?? []
        );
    }

    async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
        this.client.validateId(testId, 'testId');
        return this.client.parse<Result>(
            ResultSchema,
            await this.client.request<unknown>('POST', `add_result/${testId}`, payload),
        );
    }

    async addResultForCase(runId: number, caseId: number, payload: AddResultPayload): Promise<Result> {
        this.client.validateId(runId, 'runId');
        this.client.validateId(caseId, 'caseId');
        return this.client.parse<Result>(
            ResultSchema,
            await this.client.request<unknown>('POST', `add_result_for_case/${runId}/${caseId}`, payload),
        );
    }

    async addResultsForCases(runId: number, payload: AddResultsForCasesPayload): Promise<Result[]> {
        this.client.validateId(runId, 'runId');
        return this.client.parse<Result[]>(
            z.array(ResultSchema),
            await this.client.request<unknown>('POST', `add_results_for_cases/${runId}`, payload),
        );
    }
}
