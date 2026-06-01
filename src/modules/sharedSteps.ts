import { TestRailClientCore } from '../client-core.js';
import type { SharedStep, AddSharedStepPayload, UpdateSharedStepPayload, StepHistoryEntry } from '../schemas.js';
import { SharedStepSchema, StepHistoryEntrySchema } from '../schemas.js';
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
        // SPEC #1.6 — `get_shared_steps` is a bulk endpoint: real TestRail
        // returns the paginated `{ offset, limit, size, _links, shared_steps:[…] }`
        // envelope. Accept both the wrapper and a bare array (older/edge servers)
        // and unwrap via `.shared_steps ?? []`, mirroring getSuites.
        const raw = await this.client.request<SharedStep[] | { shared_steps?: SharedStep[] | null }>({
            method: 'GET',
            endpoint: `get_shared_steps/${projectId}`,
            schema: z.union([
                z.array(SharedStepSchema),
                z.object({ shared_steps: z.array(SharedStepSchema).nullish() }),
            ]),
        });
        return Array.isArray(raw) ? raw : (raw.shared_steps ?? []);
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
    async getSharedStepHistory(
        sharedStepId: number,
        options?: GetSharedStepHistoryOptions,
    ): Promise<StepHistoryEntry[]> {
        validateId(sharedStepId, 'sharedStepId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_shared_step_history/${sharedStepId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.request<{ step_history?: StepHistoryEntry[] | null }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.7 — entries live under `step_history` (NOT `history`);
                    // `.nullish()` tolerates `{ step_history: null }` / missing wrapper.
                    schema: z.object({ step_history: z.array(StepHistoryEntrySchema).nullish() }),
                })
            ).step_history ?? []
        );
    }
}
