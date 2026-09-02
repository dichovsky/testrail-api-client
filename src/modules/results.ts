import { z } from 'zod';
import { TestRailClientCore } from '../client-core.js';
import { TestRailValidationError } from '../errors.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import type { AddResultPayload, AddResultsForCasesPayload, AddResultsPayload, EditResultPayload } from '../schemas.js';
import { ResultSchema } from '../schemas.js';
import type { GetResultsForRunOptions, GetResultsOptions, Result } from '../types.js';
import { serializeIdList } from '../utils.js';
import { validateId } from '../validation.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetAllResultsOptions extends Omit<GetResultsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

export interface GetAllResultsForRunOptions
    extends Omit<GetResultsForRunOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

interface ResultsPaginationArgs {
    readonly operation: 'get_results';
    readonly testId: number;
}

interface ResultsForCasePaginationArgs {
    readonly operation: 'get_results_for_case';
    readonly runId: number;
    readonly caseId: number;
}

interface ResultsForRunPaginationArgs {
    readonly operation: 'get_results_for_run';
    readonly runId: number;
}

type ResultPaginationArgs = ResultsPaginationArgs | ResultsForCasePaginationArgs | ResultsForRunPaginationArgs;

export const RESULTS_PAGINATION = createPaginatedListExecutor<
    ResultPaginationArgs,
    GetResultsForRunOptions,
    GetAllResultsForRunOptions,
    Result
>({
    operations: ['get_results', 'get_results_for_case', 'get_results_for_run'],
    collectionKey: 'results',
    itemSchema: ResultSchema,
    response: 'envelope',
    requestControls: true,
    prepare: (args, options) => {
        let pathParameters: readonly number[];
        switch (args.operation) {
            case 'get_results':
                validateId(args.testId, 'testId');
                pathParameters = [args.testId];
                break;
            case 'get_results_for_case':
                validateId(args.runId, 'runId');
                validateId(args.caseId, 'caseId');
                pathParameters = [args.runId, args.caseId];
                break;
            case 'get_results_for_run':
                validateId(args.runId, 'runId');
                pathParameters = [args.runId];
                break;
        }

        const includeCreatedFilters = args.operation === 'get_results_for_run';
        const createdAfter = includeCreatedFilters ? (options?.createdAfter ?? options?.created_after) : undefined;
        const createdBefore = includeCreatedFilters ? (options?.createdBefore ?? options?.created_before) : undefined;
        const createdBy = includeCreatedFilters ? (options?.createdBy ?? options?.created_by) : undefined;
        const statusId = options?.statusId ?? options?.status_id;
        if (createdBy !== undefined) createdBy.forEach((userId) => validateId(userId, 'createdBy'));
        if (statusId !== undefined) statusId.forEach((id) => validateId(id, 'statusId'));

        return {
            operation: args.operation,
            pathParameters,
            query: {
                created_after: createdAfter,
                created_before: createdBefore,
                created_by: serializeIdList(createdBy),
                status_id: serializeIdList(statusId),
                defects_filter: options?.defectsFilter ?? options?.defects_filter,
            },
        };
    },
});

export class ResultModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_results/{test_id} */
    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        return RESULTS_PAGINATION.items(this.client, { operation: 'get_results', testId }, options);
    }

    /** Fetch one normalized results-for-test page. */
    async getResultsPage(testId: number, options?: GetResultsOptions): Promise<Page<Result>> {
        return RESULTS_PAGINATION.page(this.client, { operation: 'get_results', testId }, options);
    }

    /** Fetch every results-for-test page under explicit aggregate safety bounds. */
    async getAllResults(testId: number, options?: GetAllResultsOptions): Promise<Result[]> {
        return RESULTS_PAGINATION.all(this.client, { operation: 'get_results', testId }, options);
    }

    /** @testrail GET get_results_for_case/{run_id}/{case_id} */
    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        return RESULTS_PAGINATION.items(this.client, { operation: 'get_results_for_case', runId, caseId }, options);
    }

    /** Fetch one normalized results-for-case page. */
    async getResultsForCasePage(runId: number, caseId: number, options?: GetResultsOptions): Promise<Page<Result>> {
        return RESULTS_PAGINATION.page(this.client, { operation: 'get_results_for_case', runId, caseId }, options);
    }

    /** Fetch every results-for-case page under explicit aggregate safety bounds. */
    async getAllResultsForCase(runId: number, caseId: number, options?: GetAllResultsOptions): Promise<Result[]> {
        return RESULTS_PAGINATION.all(this.client, { operation: 'get_results_for_case', runId, caseId }, options);
    }

    /** @testrail GET get_results_for_run/{run_id} */
    async getResultsForRun(runId: number, options?: GetResultsForRunOptions): Promise<Result[]> {
        return RESULTS_PAGINATION.items(this.client, { operation: 'get_results_for_run', runId }, options);
    }

    /** Fetch one normalized results-for-run page. */
    async getResultsForRunPage(runId: number, options?: GetResultsForRunOptions): Promise<Page<Result>> {
        return RESULTS_PAGINATION.page(this.client, { operation: 'get_results_for_run', runId }, options);
    }

    /** Fetch every results-for-run page under explicit aggregate safety bounds. */
    async getAllResultsForRun(runId: number, options?: GetAllResultsForRunOptions): Promise<Result[]> {
        return RESULTS_PAGINATION.all(this.client, { operation: 'get_results_for_run', runId }, options);
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
     * Partially update an existing result (TestRail 10.4+).
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
