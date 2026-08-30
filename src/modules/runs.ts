import { TestRailClientCore } from '../client-core.js';
import { serializeIdFilter } from '../utils.js';
import type { Run, GetRunsOptions, SoftDeleteOptions } from '../types.js';
import type { AddRunPayload, UpdateRunPayload, SoftDeletePreview } from '../schemas.js';
import { RunSchema, SoftDeletePreviewSchema } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotOptionFields, snapshotPaginatedRequestOptions } from './pagination-options.js';

export type GetAllRunsOptions = Omit<GetRunsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

export class RunModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_run/{run_id} */
    async getRun(runId: number): Promise<Run> {
        validateId(runId, 'runId');
        return this.client.request<Run>({ method: 'GET', endpoint: `get_run/${runId}`, schema: RunSchema });
    }

    /** @testrail GET get_runs/{project_id} */
    async getRuns(projectId: number, options?: GetRunsOptions): Promise<Run[]> {
        return unwrapList<Run>('runs', await this.requestRuns(projectId, options));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getRunsPage(projectId: number, options?: GetRunsOptions): Promise<Page<Run>> {
        return decodePage<Run>('runs', await this.requestRuns(projectId, options, { pageProjection: true }));
    }

    /** Get every run under the configured pagination safety bounds. */
    async getAllRuns(projectId: number, options?: GetAllRunsOptions): Promise<Run[]> {
        const filters = snapshotOptionFields(options, [
            'createdAfter',
            'createdBefore',
            'createdBy',
            'includePlanRuns',
            'isCompleted',
            'milestoneId',
            'refs',
            'refsFilter',
            'suiteId',
        ]);
        return collectAllPages<Run>({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async (request) => {
                const pageOptions: GetRunsOptions = {
                    ...filters,
                    // Controlled collectors always resolve both values before
                    // invoking this adapter; only envelope-driven collectors
                    // can receive `undefined` request controls.
                    limit: request.limit as number,
                    offset: request.offset as number,
                };
                const raw = await this.requestRuns(projectId, pageOptions, {
                    bypassCache: request.bypassCache,
                    remainingTimeMs: request.remainingTimeMs,
                    deadlineAt: request.deadlineAt,
                });
                return decodePage<Run>('runs', raw);
            },
        });
    }

    private async requestRuns(
        projectId: number,
        options?: GetRunsOptions,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
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
            limit,
            offset,
        } = options ?? {};
        validatePaginationParams(limit, offset);
        const endpoint = buildEndpoint(`get_runs/${projectId}`, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: serializeIdFilter(createdBy, 'createdBy'),
            include_plan_runs: includePlanRuns !== undefined ? (includePlanRuns ? 1 : 0) : undefined,
            is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
            milestone_id: serializeIdFilter(milestoneId, 'milestoneId'),
            // The current API uses `refs`; pre-10.4 servers use `refs_filter`.
            // When the deprecated alias is supplied, send both spellings so
            // the same public option remains effective across server versions.
            refs: refs ?? refsFilter,
            refs_filter: refs === undefined ? refsFilter : undefined,
            suite_id: serializeIdFilter(suiteId, 'suiteId'),
            limit,
            offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('runs', RunSchema) : listOf('runs', RunSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
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
