import { TestRailClientCore } from '../client-core.js';
import type { Status, Priority, ResultField, CaseField, CaseType, Template, Role, CaseStatus } from '../types.js';
import { validateId } from '../validation.js';
import {
    StatusSchema,
    PrioritySchema,
    ResultFieldSchema,
    CaseFieldSchema,
    AddCaseFieldResponseSchema,
    CaseTypeSchema,
    TemplateSchema,
    RoleSchema,
    CaseStatusSchema,
    DynamicFilterFieldSchema,
    TestRailVersionSchema,
} from '../schemas.js';
import type { AddCaseFieldPayload, AddCaseFieldResponse, DynamicFilterField, TestRailVersion } from '../schemas.js';
import { z } from 'zod';
import type { Page, PaginationSafetyOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export type GetAllCaseStatusesOptions = PaginationSafetyOptions;
export type GetAllRolesOptions = PaginationSafetyOptions;

interface MetadataPaginationControls {
    limit?: number;
    offset?: number;
}

export const CASE_STATUSES_PAGINATION = createPaginatedListExecutor<
    undefined,
    MetadataPaginationControls,
    GetAllCaseStatusesOptions,
    CaseStatus
>({
    operations: ['get_case_statuses'],
    collectionKey: 'case_statuses',
    itemSchema: CaseStatusSchema,
    response: 'envelope',
    requestControls: false,
    prepare: () => ({ operation: 'get_case_statuses' }),
});

export const ROLES_PAGINATION = createPaginatedListExecutor<
    undefined,
    MetadataPaginationControls,
    GetAllRolesOptions,
    Role
>({
    operations: ['get_roles'],
    collectionKey: 'roles',
    itemSchema: RoleSchema,
    response: 'envelope',
    requestControls: false,
    prepare: () => ({ operation: 'get_roles' }),
});

export class MetadataModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_version */
    async getVersion(): Promise<TestRailVersion> {
        return this.client.request<TestRailVersion>({
            method: 'GET',
            endpoint: 'get_version',
            schema: TestRailVersionSchema,
        });
    }

    /** @testrail GET get_statuses */
    async getStatuses(): Promise<Status[]> {
        return this.client.request<Status[]>({
            method: 'GET',
            endpoint: 'get_statuses',
            schema: z.array(StatusSchema),
        });
    }

    /** @testrail GET get_case_statuses */
    async getCaseStatuses(): Promise<CaseStatus[]> {
        return CASE_STATUSES_PAGINATION.items(this.client, undefined);
    }

    /** Get one response page without sending undocumented request controls. */
    async getCaseStatusesPage(): Promise<Page<CaseStatus>> {
        return CASE_STATUSES_PAGINATION.page(this.client, undefined);
    }

    /** Get every case status under the configured pagination safety bounds. */
    async getAllCaseStatuses(options?: GetAllCaseStatusesOptions): Promise<CaseStatus[]> {
        return CASE_STATUSES_PAGINATION.all(this.client, undefined, options);
    }

    /** @testrail GET get_priorities */
    async getPriorities(): Promise<Priority[]> {
        return this.client.request<Priority[]>({
            method: 'GET',
            endpoint: 'get_priorities',
            schema: z.array(PrioritySchema),
        });
    }

    /** @testrail GET get_dynamic_filter_fields/{project_id} */
    async getDynamicFilterFields(projectId: number): Promise<DynamicFilterField[]> {
        validateId(projectId, 'projectId');
        return this.client.request<DynamicFilterField[]>({
            method: 'GET',
            endpoint: `get_dynamic_filter_fields/${projectId}`,
            schema: z.array(DynamicFilterFieldSchema),
        });
    }

    /** @testrail GET get_result_fields */
    async getResultFields(): Promise<ResultField[]> {
        return this.client.request<ResultField[]>({
            method: 'GET',
            endpoint: 'get_result_fields',
            schema: z.array(ResultFieldSchema),
        });
    }

    /** @testrail GET get_case_fields */
    async getCaseFields(): Promise<CaseField[]> {
        return this.client.request<CaseField[]>({
            method: 'GET',
            endpoint: 'get_case_fields',
            schema: z.array(CaseFieldSchema),
        });
    }

    /**
     * Create a new custom case field (admin-only). The endpoint is
     * `POST add_case_field` with no path or query params. Returns an
     * `AddCaseFieldResponse` (NOT `CaseField`) — see SPEC #2.1.12 in
     * `src/schemas.ts`: the POST response shape diverges from
     * `get_case_fields` GET in two ways:
     *
     *   - `configs` is a JSON-encoded string (not a parsed array). Callers
     *     that need the structured form must `JSON.parse(response.configs)`.
     *   - Boolean-style fields (`is_active`, `include_all`, `is_multi`,
     *     `is_system`) surface as `0`/`1` integers, and several
     *     admin-internal fields (`entity_id`, `location_id`, `status_id`)
     *     appear here but not on GET.
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
    async addCaseField(payload: AddCaseFieldPayload): Promise<AddCaseFieldResponse> {
        return this.client.request<AddCaseFieldResponse>({
            method: 'POST',
            endpoint: 'add_case_field',
            schema: AddCaseFieldResponseSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail GET get_case_types */
    async getCaseTypes(): Promise<CaseType[]> {
        return this.client.request<CaseType[]>({
            method: 'GET',
            endpoint: 'get_case_types',
            schema: z.array(CaseTypeSchema),
        });
    }

    /** @testrail GET get_templates/{project_id} */
    async getTemplates(projectId: number): Promise<Template[]> {
        validateId(projectId, 'projectId');
        return this.client.request<Template[]>({
            method: 'GET',
            endpoint: `get_templates/${projectId}`,
            schema: z.array(TemplateSchema),
        });
    }

    /** @testrail GET get_roles */
    async getRoles(): Promise<Role[]> {
        return ROLES_PAGINATION.items(this.client, undefined);
    }

    /** Get one response page without sending undocumented request controls. */
    async getRolesPage(): Promise<Page<Role>> {
        return ROLES_PAGINATION.page(this.client, undefined);
    }

    /** Get every role under the configured pagination safety bounds. */
    async getAllRoles(options?: GetAllRolesOptions): Promise<Role[]> {
        return ROLES_PAGINATION.all(this.client, undefined, options);
    }
}
