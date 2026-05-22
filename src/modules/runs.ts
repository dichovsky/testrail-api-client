import { TestRailClientCore } from '../client-core.js';
import type { Run, GetRunsOptions, SoftDeleteOptions } from '../types.js';
import type { AddRunPayload, UpdateRunPayload, SoftDeletePreview } from '../schemas.js';
import { RunSchema, SoftDeletePreviewSchema } from '../schemas.js';
import { z } from 'zod';

export class RunModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_run/{run_id} */
    async getRun(runId: number): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('GET', `get_run/${runId}`, RunSchema);
    }

    /** @testrail GET get_runs/{project_id} */
    async getRuns(projectId: number, options?: GetRunsOptions): Promise<Run[]> {
        this.client.validateId(projectId, 'projectId');
        const { createdAfter, createdBefore, createdBy, isCompleted, milestoneId, refsFilter, suiteId, limit, offset } =
            options ?? {};
        this.client.validatePaginationParams(limit, offset);
        if (milestoneId !== undefined) {
            this.client.validateId(milestoneId, 'milestoneId');
        }
        if (suiteId !== undefined) {
            this.client.validateId(suiteId, 'suiteId');
        }
        if (createdBy !== undefined) {
            createdBy.forEach((userId) => this.client.validateId(userId, 'createdBy'));
        }
        const createdByFilter = createdBy && createdBy.length > 0 ? createdBy.join(',') : undefined;
        const endpoint = this.client.buildEndpoint(`get_runs/${projectId}`, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: createdByFilter,
            is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
            milestone_id: milestoneId,
            refs_filter: refsFilter,
            suite_id: suiteId,
            limit,
            offset,
        });
        return (
            (
                await this.client.requestParsed<{ runs?: Run[] }>(
                    'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ runs: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    z.object({ runs: z.array(RunSchema).nullish() }),
                )
            ).runs ?? []
        );
    }

    /** @testrail POST add_run/{project_id} */
    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Run>('POST', `add_run/${projectId}`, RunSchema, payload);
    }

    /** @testrail POST update_run/{run_id} */
    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('POST', `update_run/${runId}`, RunSchema, payload);
    }

    /** @testrail POST close_run/{run_id} */
    async closeRun(runId: number): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('POST', `close_run/${runId}`, RunSchema);
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
        this.client.validateId(runId, 'runId');
        const endpoint = this.client.buildEndpoint(`delete_run/${runId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>('POST', endpoint);
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw);
        }
    }
}
