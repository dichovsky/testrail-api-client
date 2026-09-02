import { TestRailClientCore } from '../client-core.js';
import { serializeIdFilter } from '../utils.js';
import type { Run, GetRunsOptions, SoftDeleteOptions } from '../types.js';
import type { AddRunPayload, UpdateRunPayload, SoftDeletePreview } from '../schemas.js';
import { RunSchema, SoftDeletePreviewSchema } from '../schemas.js';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export type GetAllRunsOptions = Omit<GetRunsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

export const RUNS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetRunsOptions,
    GetAllRunsOptions,
    Run
>({
    operations: ['get_runs'],
    collectionKey: 'runs',
    itemSchema: RunSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
        validateId(projectId, 'projectId');
        const {
            createdAfter,
            createdBefore,
            createdBy,
            includePlanRuns,
            isCompleted,
            milestoneId,
            refs,
            refsFilter,
            suiteId,
        } = options ?? {};
        return {
            operation: 'get_runs',
            pathParameters: [projectId],
            query: {
                created_after: createdAfter,
                created_before: createdBefore,
                created_by: serializeIdFilter(createdBy, 'createdBy'),
                include_plan_runs: includePlanRuns !== undefined ? (includePlanRuns ? 1 : 0) : undefined,
                is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
                milestone_id: serializeIdFilter(milestoneId, 'milestoneId'),
                refs: refs ?? refsFilter,
                refs_filter: refs === undefined ? refsFilter : undefined,
                suite_id: serializeIdFilter(suiteId, 'suiteId'),
            },
        };
    },
});

export class RunModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_run/{run_id} */
    async getRun(runId: number): Promise<Run> {
        validateId(runId, 'runId');
        return this.client.request<Run>({ method: 'GET', endpoint: `get_run/${runId}`, schema: RunSchema });
    }

    /** @testrail GET get_runs/{project_id} */
    async getRuns(projectId: number, options?: GetRunsOptions): Promise<Run[]> {
        return RUNS_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getRunsPage(projectId: number, options?: GetRunsOptions): Promise<Page<Run>> {
        return RUNS_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every run under the configured pagination safety bounds. */
    async getAllRuns(projectId: number, options?: GetAllRunsOptions): Promise<Run[]> {
        return RUNS_PAGINATION.all(this.client, { projectId }, options);
    }

    /** @testrail POST add_run/{project_id} */
    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        validateId(projectId, 'projectId');
        return this.client.request<Run>({
            method: 'POST',
            endpoint: `add_run/${projectId}`,
            schema: RunSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_run/{run_id} */
    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        validateId(runId, 'runId');
        return this.client.request<Run>({
            method: 'POST',
            endpoint: `update_run/${runId}`,
            schema: RunSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST close_run/{run_id} */
    async closeRun(runId: number): Promise<Run> {
        validateId(runId, 'runId');
        return this.client.request<Run>({
            method: 'POST',
            endpoint: `close_run/${runId}`,
            schema: RunSchema,
        });
    }

    /**
     * Delete a test run and all associated test results. Pass
     * `{ soft: true }` for TestRail's server-side preview (`soft=1`) —
     * the API call still happens but nothing is deleted; TestRail returns
     * counts of affected entities. TestRail 6.5+ for soft-mode.
     *
     * @testrail POST delete_run/{run_id}
     */
    async deleteRun(runId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteRun(runId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: accepts a `SoftDeleteOptions` variable with a
    // boolean `soft` computed at runtime; returns the union.
    async deleteRun(runId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteRun(runId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        validateId(runId, 'runId');
        const endpoint = buildEndpoint(`delete_run/${runId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>({ method: 'POST', endpoint });
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw, {
                method: 'POST',
                endpoint,
            });
        }
    }
}
