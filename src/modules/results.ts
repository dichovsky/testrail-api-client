import { TestRailClientCore } from '../client-core.js';
import type { Result, GetResultsOptions } from '../types.js';
import type { AddResultPayload, AddResultsForCasesPayload, AddResultsPayload, EditResultPayload } from '../schemas.js';
import { ResultSchema } from '../schemas.js';
import { TestRailValidationError } from '../errors.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { collectAllPages, decodePage } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotOptionFields, snapshotPaginatedRequestOptions } from './pagination-options.js';

export interface GetAllResultsOptions extends Omit<GetResultsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

type PageTransportOptions = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

export class ResultModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_results/{test_id} */
    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        validateId(testId, 'testId');
        return unwrapList<Result>('results', await this.requestResultsPage(`get_results/${testId}`, options, true));
    }

    /** Fetch one normalized results-for-test page. */
    async getResultsPage(testId: number, options?: GetResultsOptions): Promise<Page<Result>> {
        validateId(testId, 'testId');
        return decodePage<Result>(
            'results',
            await this.requestResultsPage(`get_results/${testId}`, options, true, { pageProjection: true }),
        );
    }

    /** Fetch every results-for-test page under explicit aggregate safety bounds. */
    async getAllResults(testId: number, options?: GetAllResultsOptions): Promise<Result[]> {
        validateId(testId, 'testId');
        return this.collectResults(`get_results/${testId}`, options, true);
    }

    /** @testrail GET get_results_for_case/{run_id}/{case_id} */
    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        validateId(runId, 'runId');
        validateId(caseId, 'caseId');
        return unwrapList<Result>(
            'results',
            await this.requestResultsPage(`get_results_for_case/${runId}/${caseId}`, options, true),
        );
    }

    /** Fetch one normalized results-for-case page. */
    async getResultsForCasePage(runId: number, caseId: number, options?: GetResultsOptions): Promise<Page<Result>> {
        validateId(runId, 'runId');
        validateId(caseId, 'caseId');
        return decodePage<Result>(
            'results',
            await this.requestResultsPage(`get_results_for_case/${runId}/${caseId}`, options, true, {
                pageProjection: true,
            }),
        );
    }

    /** Fetch every results-for-case page under explicit aggregate safety bounds. */
    async getAllResultsForCase(runId: number, caseId: number, options?: GetAllResultsOptions): Promise<Result[]> {
        validateId(runId, 'runId');
        validateId(caseId, 'caseId');
        return this.collectResults(`get_results_for_case/${runId}/${caseId}`, options, true);
    }

    /** @testrail GET get_results_for_run/{run_id} */
    async getResultsForRun(runId: number, options?: GetResultsOptions): Promise<Result[]> {
        validateId(runId, 'runId');
        return unwrapList<Result>(
            'results',
            await this.requestResultsPage(`get_results_for_run/${runId}`, options, false),
        );
    }

    /** Fetch one normalized results-for-run page. */
    async getResultsForRunPage(runId: number, options?: GetResultsOptions): Promise<Page<Result>> {
        validateId(runId, 'runId');
        return decodePage<Result>(
            'results',
            await this.requestResultsPage(`get_results_for_run/${runId}`, options, false, { pageProjection: true }),
        );
    }

    /** Fetch every results-for-run page under explicit aggregate safety bounds. */
    async getAllResultsForRun(runId: number, options?: GetAllResultsOptions): Promise<Result[]> {
        validateId(runId, 'runId');
        return this.collectResults(`get_results_for_run/${runId}`, options, false);
    }

    private async collectResults(
        endpointBase: string,
        options: GetAllResultsOptions | undefined,
        includeDefectsFilter: boolean,
    ): Promise<Result[]> {
        const filters = snapshotOptionFields(options, [
            'createdAfter',
            'createdBefore',
            'createdBy',
            'statusId',
            'defectsFilter',
            'created_after',
            'created_before',
            'created_by',
            'status_id',
            'defects_filter',
        ]);
        return collectAllPages({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async ({ offset, limit, bypassCache, remainingTimeMs, deadlineAt }) =>
                decodePage<Result>(
                    'results',
                    await this.requestResultsPage(
                        endpointBase,
                        {
                            ...filters,
                            ...(limit !== undefined && { limit }),
                            ...(offset !== undefined && { offset }),
                        },
                        includeDefectsFilter,
                        { bypassCache, remainingTimeMs, deadlineAt },
                    ),
                ),
        });
    }

    private async requestResultsPage(
        endpointBase: string,
        options: GetResultsOptions | undefined,
        includeDefectsFilter: boolean,
        transport?: PageTransportOptions,
    ): Promise<unknown> {
        validatePaginationParams(options?.limit, options?.offset);
        const createdAfter = options?.createdAfter ?? options?.created_after;
        const createdBefore = options?.createdBefore ?? options?.created_before;
        const createdBy = options?.createdBy ?? options?.created_by;
        const statusId = options?.statusId ?? options?.status_id;
        if (createdBy !== undefined) {
            createdBy.forEach((userId) => validateId(userId, 'createdBy'));
        }
        if (statusId !== undefined) {
            statusId.forEach((id) => validateId(id, 'statusId'));
        }
        const defectsFilter = includeDefectsFilter ? (options?.defectsFilter ?? options?.defects_filter) : undefined;
        const endpoint = buildEndpoint(endpointBase, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: serializeIdList(createdBy),
            status_id: serializeIdList(statusId),
            defects_filter: defectsFilter,
            limit: options?.limit,
            offset: options?.offset,
        });
        const pageProjection = transport?.pageProjection === true || transport?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('results', ResultSchema) : listOf('results', ResultSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(transport?.bypassCache !== undefined && { bypassCache: transport.bypassCache }),
            ...(transport?.remainingTimeMs !== undefined && { remainingTimeMs: transport.remainingTimeMs }),
            ...(transport?.deadlineAt !== undefined && { deadlineAt: transport.deadlineAt }),
        });
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

    /**
     * Partially update an existing result (TestRail 10.4+). Only supplied
     * standard or `custom_*` fields are changed by TestRail.
     * @testrail POST edit_result/{result_id}
     */
    async editResult(resultId: number, payload: EditResultPayload): Promise<Result> {
        validateId(resultId, 'resultId');
        if (Object.keys(payload).length === 0) {
            throw new TestRailValidationError('At least one result field is required');
        }
        return this.client.request<Result>({
            method: 'POST',
            endpoint: `edit_result/${resultId}`,
            schema: ResultSchema,
            body: { kind: 'json', data: payload },
        });
    }
}
