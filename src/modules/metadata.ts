import { TestRailClientCore } from '../client-core.js';
import type { Status, Priority, ResultField, CaseField, CaseType, Template, Role } from '../types.js';
import {
    StatusSchema,
    PrioritySchema,
    ResultFieldSchema,
    CaseFieldSchema,
    CaseTypeSchema,
    TemplateSchema,
    RoleSchema,
} from '../schemas.js';
import { z } from 'zod';

export class MetadataModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getStatuses(): Promise<Status[]> {
        return this.client.parse<Status[]>(
            z.array(StatusSchema),
            await this.client.request<unknown>('GET', 'get_statuses'),
        );
    }

    async getPriorities(): Promise<Priority[]> {
        return this.client.parse<Priority[]>(
            z.array(PrioritySchema),
            await this.client.request<unknown>('GET', 'get_priorities'),
        );
    }

    async getResultFields(): Promise<ResultField[]> {
        return this.client.parse<ResultField[]>(
            z.array(ResultFieldSchema),
            await this.client.request<unknown>('GET', 'get_result_fields'),
        );
    }

    async getCaseFields(): Promise<CaseField[]> {
        return this.client.parse<CaseField[]>(
            z.array(CaseFieldSchema),
            await this.client.request<unknown>('GET', 'get_case_fields'),
        );
    }

    async getCaseTypes(): Promise<CaseType[]> {
        return this.client.parse<CaseType[]>(
            z.array(CaseTypeSchema),
            await this.client.request<unknown>('GET', 'get_case_types'),
        );
    }

    async getTemplates(projectId: number): Promise<Template[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Template[]>(
            z.array(TemplateSchema),
            await this.client.request<unknown>('GET', `get_templates/${projectId}`),
        );
    }

    async getRoles(): Promise<Role[]> {
        return this.client.parse<Role[]>(z.array(RoleSchema), await this.client.request<unknown>('GET', 'get_roles'));
    }
}
