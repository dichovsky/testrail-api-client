import { TestRailClientCore } from '../client-core.js';
import type { Status, Priority, ResultField, CaseField, CaseType, Template, Role, CaseStatus } from '../types.js';
import {
    StatusSchema,
    PrioritySchema,
    ResultFieldSchema,
    CaseFieldSchema,
    CaseTypeSchema,
    TemplateSchema,
    RoleSchema,
    CaseStatusSchema,
} from '../schemas.js';
import type { AddCaseFieldPayload } from '../schemas.js';
import { z } from 'zod';

export class MetadataModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getStatuses(): Promise<Status[]> {
        return this.client.requestParsed<Status[]>('GET', 'get_statuses', z.array(StatusSchema));
    }

    async getCaseStatuses(): Promise<CaseStatus[]> {
        return this.client.requestParsed<CaseStatus[]>('GET', 'get_case_statuses', z.array(CaseStatusSchema));
    }

    async getPriorities(): Promise<Priority[]> {
        return this.client.requestParsed<Priority[]>('GET', 'get_priorities', z.array(PrioritySchema));
    }

    async getResultFields(): Promise<ResultField[]> {
        return this.client.requestParsed<ResultField[]>('GET', 'get_result_fields', z.array(ResultFieldSchema));
    }

    async getCaseFields(): Promise<CaseField[]> {
        return this.client.requestParsed<CaseField[]>('GET', 'get_case_fields', z.array(CaseFieldSchema));
    }

    /**
     * Create a new custom case field (admin-only). The endpoint is
     * `POST add_case_field` with no path or query params. Returns the
     * newly created `CaseField`, including its assigned `id`, `system_name`,
     * and `display_order`.
     *
     * Server validates: `name` must be a valid system slug (lowercase,
     * alphanumeric + underscore); field-type-specific rules (e.g. `Steps`
     * fields reject `options.items`). We do NOT enforce these client-side —
     * `AddCaseFieldPayloadSchema.passthrough()` lets TestRail be the source
     * of truth on quirks, and a 400 from the server surfaces with the
     * upstream message.
     */
    async addCaseField(payload: AddCaseFieldPayload): Promise<CaseField> {
        return this.client.requestParsed<CaseField>('POST', 'add_case_field', CaseFieldSchema, payload);
    }

    async getCaseTypes(): Promise<CaseType[]> {
        return this.client.requestParsed<CaseType[]>('GET', 'get_case_types', z.array(CaseTypeSchema));
    }

    async getTemplates(projectId: number): Promise<Template[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Template[]>('GET', `get_templates/${projectId}`, z.array(TemplateSchema));
    }

    async getRoles(): Promise<Role[]> {
        return this.client.requestParsed<Role[]>('GET', 'get_roles', z.array(RoleSchema));
    }
}
