import { TestRailClientCore } from '../client-core.js';
import type { SharedStep, AddSharedStepPayload, UpdateSharedStepPayload, HistoryEntry } from '../types.js';
import { SharedStepSchema, HistoryEntrySchema } from '../schemas.js';
import { z } from 'zod';

export interface GetSharedStepHistoryOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export class SharedStepModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        this.client.validateId(sharedStepId, 'sharedStepId');
        return this.client.requestParsed<SharedStep>('GET', `get_shared_step/${sharedStepId}`, SharedStepSchema);
    }

    async getSharedSteps(projectId: number): Promise<SharedStep[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<SharedStep[]>(
            'GET',
            `get_shared_steps/${projectId}`,
            SharedStepSchema.array(),
        );
    }

    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<SharedStep>('POST', `add_shared_step/${projectId}`, SharedStepSchema, payload);
    }

    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        this.client.validateId(sharedStepId, 'sharedStepId');
        return this.client.requestParsed<SharedStep>(
            'POST',
            `update_shared_step/${sharedStepId}`,
            SharedStepSchema,
            payload,
        );
    }

    async deleteSharedStep(sharedStepId: number): Promise<void> {
        this.client.validateId(sharedStepId, 'sharedStepId');
        await this.client.request<void>('POST', `delete_shared_step/${sharedStepId}`);
    }

    async getSharedStepHistory(sharedUpdateId: number, options?: GetSharedStepHistoryOptions): Promise<HistoryEntry[]> {
        this.client.validateId(sharedUpdateId, 'sharedUpdateId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_shared_step_history/${sharedUpdateId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.requestParsed<{ history?: HistoryEntry[] }>(
                    'GET',
                    endpoint,
                    z.object({ history: z.array(HistoryEntrySchema).optional() }),
                )
            ).history ?? []
        );
    }
}
