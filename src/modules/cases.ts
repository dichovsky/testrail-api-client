import { TestRailClientCore } from '../client-core.js';
import type { Case, GetCasesOptions } from '../types.js';
import type { AddCasePayload, UpdateCasePayload } from '../schemas.js';
import { CaseSchema } from '../schemas.js';
import { z } from 'zod';

export class CaseModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getCase(caseId: number): Promise<Case> {
        this.client.validateId(caseId, 'caseId');
        return this.client.parse<Case>(CaseSchema, await this.client.request<unknown>('GET', `get_case/${caseId}`));
    }

    async getCases(projectId: number, options?: GetCasesOptions): Promise<Case[]> {
        this.client.validateId(projectId, 'projectId');
        const {
            suiteId,
            sectionId,
            typeId,
            priorityId,
            templateId,
            milestoneId,
            createdAfter,
            createdBefore,
            updatedAfter,
            updatedBefore,
            limit,
            offset,
        } = options ?? {};
        if (suiteId !== undefined) this.client.validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) this.client.validateId(sectionId, 'sectionId');
        if (typeId !== undefined) this.client.validateId(typeId, 'typeId');
        if (priorityId !== undefined) this.client.validateId(priorityId, 'priorityId');
        if (templateId !== undefined) this.client.validateId(templateId, 'templateId');
        if (milestoneId !== undefined) this.client.validateId(milestoneId, 'milestoneId');
        this.client.validatePaginationParams(limit, offset);
        const endpoint = this.client.buildEndpoint(`get_cases/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
            type_id: typeId,
            priority_id: priorityId,
            template_id: templateId,
            milestone_id: milestoneId,
            created_after: createdAfter,
            created_before: createdBefore,
            updated_after: updatedAfter,
            updated_before: updatedBefore,
            limit,
            offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ cases?: Case[] }>(z.object({ cases: z.array(CaseSchema).optional() }), raw).cases ?? []
        );
    }

    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        this.client.validateId(sectionId, 'sectionId');
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.request<unknown>('POST', `add_case/${sectionId}`, payload),
        );
    }

    async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
        this.client.validateId(caseId, 'caseId');
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.request<unknown>('POST', `update_case/${caseId}`, payload),
        );
    }

    async deleteCase(caseId: number): Promise<void> {
        this.client.validateId(caseId, 'caseId');
        await this.client.request<void>('POST', `delete_case/${caseId}`);
    }
}
