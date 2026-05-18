import { TestRailClientCore } from '../client-core.js';
import type { Run, GetRunsOptions, SoftDeleteOptions } from '../types.js';
import type { AddRunPayload, UpdateRunPayload, SoftDeletePreview } from '../schemas.js';
import { RunSchema, SoftDeletePreviewSchema } from '../schemas.js';
import { z } from 'zod';

export class RunModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getRun(runId: number): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('GET', `get_run/${runId}`, RunSchema);
    }

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
                    z.object({ runs: z.array(RunSchema).optional() }),
                )
            ).runs ?? []
        );
    }

    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Run>('POST', `add_run/${projectId}`, RunSchema, payload);
    }

    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('POST', `update_run/${runId}`, RunSchema, payload);
    }

    async closeRun(runId: number): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('POST', `close_run/${runId}`, RunSchema);
    }

    /**
     * Delete a test run and all associated test results. Pass
     * `{ soft: true }` for TestRail's server-side preview (`soft=1`) —
     * the API call still happens but nothing is deleted; TestRail returns
     * counts of affected entities. TestRail 6.5+ for soft-mode.
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
