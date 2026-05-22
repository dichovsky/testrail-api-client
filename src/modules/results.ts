import { TestRailClientCore } from '../client-core.js';
import type { Result, GetResultsOptions } from '../types.js';
import type { AddResultPayload, AddResultsForCasesPayload, AddResultsPayload } from '../schemas.js';
import { ResultSchema } from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';

export class ResultModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_results/{test_id} */
    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.client.validateId(testId, 'testId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_results/${testId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: serializeIdList(options?.created_by),
            status_id: serializeIdList(options?.status_id),
            defects_filter: options?.defects_filter,
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.requestParsed<{ results?: Result[] }>(
                    'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ results: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    z.object({ results: z.array(ResultSchema).nullish() }),
                )
            ).results ?? []
        );
    }

    /** @testrail GET get_results_for_case/{run_id}/{case_id} */
    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.client.validateId(runId, 'runId');
        this.client.validateId(caseId, 'caseId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_results_for_case/${runId}/${caseId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: serializeIdList(options?.created_by),
            status_id: serializeIdList(options?.status_id),
            defects_filter: options?.defects_filter,
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.requestParsed<{ results?: Result[] }>(
                    'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ results: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    z.object({ results: z.array(ResultSchema).nullish() }),
                )
            ).results ?? []
        );
    }

    /** @testrail GET get_results_for_run/{run_id} */
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
        return (
            (
                await this.client.requestParsed<{ results?: Result[] }>(
                    'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ results: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    z.object({ results: z.array(ResultSchema).nullish() }),
                )
            ).results ?? []
        );
    }

    /** @testrail POST add_result/{test_id} */
    async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
        this.client.validateId(testId, 'testId');
        return this.client.requestParsed<Result>('POST', `add_result/${testId}`, ResultSchema, payload);
    }

    /** @testrail POST add_result_for_case/{run_id}/{case_id} */
    async addResultForCase(runId: number, caseId: number, payload: AddResultPayload): Promise<Result> {
        this.client.validateId(runId, 'runId');
        this.client.validateId(caseId, 'caseId');
        return this.client.requestParsed<Result>(
            'POST',
            `add_result_for_case/${runId}/${caseId}`,
            ResultSchema,
            payload,
        );
    }

    /** @testrail POST add_results_for_cases/{run_id} */
    async addResultsForCases(runId: number, payload: AddResultsForCasesPayload): Promise<Result[]> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Result[]>(
            'POST',
            `add_results_for_cases/${runId}`,
            z.array(ResultSchema),
            payload,
        );
    }

    /** @testrail POST add_results/{run_id} */
    async addResults(runId: number, payload: AddResultsPayload): Promise<Result[]> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Result[]>('POST', `add_results/${runId}`, z.array(ResultSchema), payload);
    }
}
