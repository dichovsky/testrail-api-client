import { TestRailClientCore } from '../client-core.js';
import type { Result, GetResultsOptions } from '../types.js';
import type { AddResultPayload, AddResultsForCasesPayload, AddResultsPayload } from '../schemas.js';
import { ResultSchema } from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';

export class ResultModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_results/{test_id} */
    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        validateId(testId, 'testId');
        validatePaginationParams(options?.limit, options?.offset);
        const createdAfter = options?.createdAfter ?? options?.created_after;
        const createdBefore = options?.createdBefore ?? options?.created_before;
        const createdBy = options?.createdBy ?? options?.created_by;
        const statusId = options?.statusId ?? options?.status_id;
        const defectsFilter = options?.defectsFilter ?? options?.defects_filter;
        const endpoint = buildEndpoint(`get_results/${testId}`, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: serializeIdList(createdBy),
            status_id: serializeIdList(statusId),
            defects_filter: defectsFilter,
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.request<{ results?: Result[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ results: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ results: z.array(ResultSchema).nullish() }),
                })
            ).results ?? []
        );
    }

    /** @testrail GET get_results_for_case/{run_id}/{case_id} */
    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        validateId(runId, 'runId');
        validateId(caseId, 'caseId');
        validatePaginationParams(options?.limit, options?.offset);
        const createdAfter = options?.createdAfter ?? options?.created_after;
        const createdBefore = options?.createdBefore ?? options?.created_before;
        const createdBy = options?.createdBy ?? options?.created_by;
        const statusId = options?.statusId ?? options?.status_id;
        const defectsFilter = options?.defectsFilter ?? options?.defects_filter;
        const endpoint = buildEndpoint(`get_results_for_case/${runId}/${caseId}`, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: serializeIdList(createdBy),
            status_id: serializeIdList(statusId),
            defects_filter: defectsFilter,
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.request<{ results?: Result[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ results: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ results: z.array(ResultSchema).nullish() }),
                })
            ).results ?? []
        );
    }

    /** @testrail GET get_results_for_run/{run_id} */
    async getResultsForRun(runId: number, options?: GetResultsOptions): Promise<Result[]> {
        validateId(runId, 'runId');
        validatePaginationParams(options?.limit, options?.offset);
        const createdAfter = options?.createdAfter ?? options?.created_after;
        const createdBefore = options?.createdBefore ?? options?.created_before;
        const createdBy = options?.createdBy ?? options?.created_by;
        const statusId = options?.statusId ?? options?.status_id;
        const endpoint = buildEndpoint(`get_results_for_run/${runId}`, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: serializeIdList(createdBy),
            status_id: serializeIdList(statusId),
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.request<{ results?: Result[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ results: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ results: z.array(ResultSchema).nullish() }),
                })
            ).results ?? []
        );
    }

    /** @testrail POST add_result/{test_id} */
    async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
        validateId(testId, 'testId');
        return this.client.request<Result>({
            method: 'POST',
            endpoint: `add_result/${testId}`,
            schema: ResultSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST add_result_for_case/{run_id}/{case_id} */
    async addResultForCase(runId: number, caseId: number, payload: AddResultPayload): Promise<Result> {
        validateId(runId, 'runId');
        validateId(caseId, 'caseId');
        return this.client.request<Result>({
            method: 'POST',
            endpoint: `add_result_for_case/${runId}/${caseId}`,
            schema: ResultSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST add_results_for_cases/{run_id} */
    async addResultsForCases(runId: number, payload: AddResultsForCasesPayload): Promise<Result[]> {
        validateId(runId, 'runId');
        return this.client.request<Result[]>({
            method: 'POST',
            endpoint: `add_results_for_cases/${runId}`,
            schema: z.array(ResultSchema),
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST add_results/{run_id} */
    async addResults(runId: number, payload: AddResultsPayload): Promise<Result[]> {
        validateId(runId, 'runId');
        return this.client.request<Result[]>({
            method: 'POST',
            endpoint: `add_results/${runId}`,
            schema: z.array(ResultSchema),
            body: { kind: 'json', data: payload },
        });
    }
}
