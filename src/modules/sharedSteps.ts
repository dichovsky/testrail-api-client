import { TestRailClientCore } from '../client-core.js';
import type { SharedStep, AddSharedStepPayload, UpdateSharedStepPayload } from '../types.js';
import { SharedStepSchema } from '../schemas.js';

export class SharedStepModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        this.client.validateId(sharedStepId, 'sharedStepId');
        return this.client.parse<SharedStep>(
            SharedStepSchema,
            await this.client.request<unknown>('GET', `get_shared_step/${sharedStepId}`),
        );
    }

    async getSharedSteps(projectId: number): Promise<SharedStep[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<SharedStep[]>(
            SharedStepSchema.array(),
            await this.client.request<unknown>('GET', `get_shared_steps/${projectId}`),
        );
    }

    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<SharedStep>(
            SharedStepSchema,
            await this.client.request<unknown>('POST', `add_shared_step/${projectId}`, payload),
        );
    }

    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        this.client.validateId(sharedStepId, 'sharedStepId');
        return this.client.parse<SharedStep>(
            SharedStepSchema,
            await this.client.request<unknown>('POST', `update_shared_step/${sharedStepId}`, payload),
        );
    }

    async deleteSharedStep(sharedStepId: number): Promise<void> {
        this.client.validateId(sharedStepId, 'sharedStepId');
        await this.client.request<void>('POST', `delete_shared_step/${sharedStepId}`);
    }
}
