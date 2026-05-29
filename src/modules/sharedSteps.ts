import { TestRailClientCore } from '../client-core.js';
import type { HistoryEntry } from '../types.js';
import type { SharedStep, AddSharedStepPayload, UpdateSharedStepPayload } from '../schemas.js';
import { SharedStepSchema, HistoryEntrySchema } from '../schemas.js';
import { z } from 'zod';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';

export interface GetSharedStepHistoryOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export class SharedStepModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_shared_step/{shared_step_id} */
    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        validateId(sharedStepId, 'sharedStepId');
        return this.client.request<SharedStep>({
            method: 'GET',
            endpoint: `get_shared_step/${sharedStepId}`,
            schema: SharedStepSchema,
        });
    }

    /** @testrail GET get_shared_steps/{project_id} */
    async getSharedSteps(projectId: number): Promise<SharedStep[]> {
        validateId(projectId, 'projectId');
        return this.client.request<SharedStep[]>({
            method: 'GET',
            endpoint: `get_shared_steps/${projectId}`,
            schema: SharedStepSchema.array(),
        });
    }

    /** @testrail POST add_shared_step/{project_id} */
    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        validateId(projectId, 'projectId');
        return this.client.request<SharedStep>({
            method: 'POST',
            endpoint: `add_shared_step/${projectId}`,
            schema: SharedStepSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_shared_step/{shared_step_id} */
    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        validateId(sharedStepId, 'sharedStepId');
        return this.client.request<SharedStep>({
            method: 'POST',
            endpoint: `update_shared_step/${sharedStepId}`,
            schema: SharedStepSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_shared_step/{shared_step_id} */
    async deleteSharedStep(sharedStepId: number): Promise<void> {
        validateId(sharedStepId, 'sharedStepId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_shared_step/${sharedStepId}`,
        });
    }

    /** @testrail GET get_shared_step_history/{shared_step_id} */
    async getSharedStepHistory(sharedStepId: number, options?: GetSharedStepHistoryOptions): Promise<HistoryEntry[]> {
        validateId(sharedStepId, 'sharedStepId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_shared_step_history/${sharedStepId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.request<{ history?: HistoryEntry[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ history: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ history: z.array(HistoryEntrySchema).nullish() }),
                })
            ).history ?? []
        );
    }
}
