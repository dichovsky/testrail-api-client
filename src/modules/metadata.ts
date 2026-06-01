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
} from '../schemas.js';
import type { AddCaseFieldPayload, AddCaseFieldResponse } from '../schemas.js';
import { z } from 'zod';

export class MetadataModule {
    constructor(private readonly client: TestRailClientCore) {}

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
        return this.client.request<CaseStatus[]>({
            method: 'GET',
            endpoint: 'get_case_statuses',
            schema: z.array(CaseStatusSchema),
        });
    }

    /** @testrail GET get_priorities */
    async getPriorities(): Promise<Priority[]> {
        return this.client.request<Priority[]>({
            method: 'GET',
            endpoint: 'get_priorities',
            schema: z.array(PrioritySchema),
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
        // `get_roles` is a TestRail 7.3+ bulk-API endpoint and is paginated from
        // the version it was introduced — it returns the `{ offset, limit, size,
        // _links, roles: [...] }` wrapper, never a bare array. Parse the wrapper
        // (not `z.array(RoleSchema)`, which rejects the object). `.nullish()`
        // accepts both `null` and an omitted key for an empty list. Mirrors the
        // sibling `getGroups` paginated-wrapper fix (PR #200).
        return (
            (
                await this.client.request<{ roles?: Role[] }>({
                    method: 'GET',
                    endpoint: 'get_roles',
                    schema: z.object({ roles: z.array(RoleSchema).nullish() }),
                })
            ).roles ?? []
        );
    }
}
