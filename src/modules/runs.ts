import { TestRailClientCore } from '../client-core.js';
import type { Run, GetRunsOptions } from '../types.js';
import type { AddRunPayload, UpdateRunPayload } from '../schemas.js';
import { RunSchema } from '../schemas.js';
import { z } from 'zod';

export class RunModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getRun(runId: number): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.parse<Run>(RunSchema, await this.client.request<unknown>('GET', `get_run/${runId}`));
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
        const raw = await this.client.request<unknown>('GET', endpoint);
        return this.client.parse<{ runs?: Run[] }>(z.object({ runs: z.array(RunSchema).optional() }), raw).runs ?? [];
    }

    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Run>(
            RunSchema,
            await this.client.request<unknown>('POST', `add_run/${projectId}`, payload),
        );
    }

    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.parse<Run>(
            RunSchema,
            await this.client.request<unknown>('POST', `update_run/${runId}`, payload),
        );
    }

    async closeRun(runId: number): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.parse<Run>(RunSchema, await this.client.request<unknown>('POST', `close_run/${runId}`));
    }

    async deleteRun(runId: number): Promise<void> {
        this.client.validateId(runId, 'runId');
        await this.client.request<void>('POST', `delete_run/${runId}`);
    }
}
