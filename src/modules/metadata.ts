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

    /** @testrail GET get_statuses */
    async getStatuses(): Promise<Status[]> {
        return this.client.requestParsed<Status[]>('GET', 'get_statuses', z.array(StatusSchema));
    }

    /** @testrail GET get_case_statuses */
    async getCaseStatuses(): Promise<CaseStatus[]> {
        return this.client.requestParsed<CaseStatus[]>('GET', 'get_case_statuses', z.array(CaseStatusSchema));
    }

    /** @testrail GET get_priorities */
    async getPriorities(): Promise<Priority[]> {
        return this.client.requestParsed<Priority[]>('GET', 'get_priorities', z.array(PrioritySchema));
    }

    /** @testrail GET get_result_fields */
    async getResultFields(): Promise<ResultField[]> {
        return this.client.requestParsed<ResultField[]>('GET', 'get_result_fields', z.array(ResultFieldSchema));
    }

    /** @testrail GET get_case_fields */
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
     *
     * @testrail POST add_case_field
     */
    async addCaseField(payload: AddCaseFieldPayload): Promise<CaseField> {
        return this.client.requestParsed<CaseField>('POST', 'add_case_field', CaseFieldSchema, payload);
    }

    /** @testrail GET get_case_types */
    async getCaseTypes(): Promise<CaseType[]> {
        return this.client.requestParsed<CaseType[]>('GET', 'get_case_types', z.array(CaseTypeSchema));
    }

    /** @testrail GET get_templates/{project_id} */
    async getTemplates(projectId: number): Promise<Template[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Template[]>('GET', `get_templates/${projectId}`, z.array(TemplateSchema));
    }

    /** @testrail GET get_roles */
    async getRoles(): Promise<Role[]> {
        return this.client.requestParsed<Role[]>('GET', 'get_roles', z.array(RoleSchema));
    }
}
