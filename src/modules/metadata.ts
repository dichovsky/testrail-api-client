import { TestRailClientCore } from '../client-core.js';
import type { Status, Priority, ResultField, CaseField, CaseType, Template, Role, CaseStatus } from '../types.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
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
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginationRequest, PaginationSafetyOptions } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotPaginationSafetyOptions } from './pagination-options.js';

export type GetAllCaseStatusesOptions = PaginationSafetyOptions;
export type GetAllRolesOptions = PaginationSafetyOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

interface MetadataPaginationControls {
    limit?: number;
    offset?: number;
}

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
        return unwrapList<CaseStatus>('case_statuses', await this.requestCaseStatuses());
    }

    /** Get one response page without sending undocumented request controls. */
    async getCaseStatusesPage(): Promise<Page<CaseStatus>> {
        return decodePage<CaseStatus>(
            'case_statuses',
            await this.requestCaseStatuses(undefined, { pageProjection: true }),
        );
    }

    /** Get every case status under the configured pagination safety bounds. */
    async getAllCaseStatuses(options?: GetAllCaseStatusesOptions): Promise<CaseStatus[]> {
        return collectAllPages<CaseStatus>({
            ...snapshotPaginationSafetyOptions(options),
            requestControls: false,
            fetchPage: (request) =>
                this.requestCaseStatuses(
                    {
                        ...(request.limit === undefined ? {} : { limit: request.limit }),
                        ...(request.offset === undefined ? {} : { offset: request.offset }),
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                ).then((raw) => decodePage<CaseStatus>('case_statuses', raw)),
        });
    }

    private async requestCaseStatuses(
        pagination?: MetadataPaginationControls,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validatePaginationParams(pagination?.limit, pagination?.offset);
        const endpoint = buildEndpoint('get_case_statuses', {
            limit: pagination?.limit,
            offset: pagination?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection
                ? pageOf('case_statuses', CaseStatusSchema)
                : listOf('case_statuses', CaseStatusSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
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
        return unwrapList<Role>('roles', await this.requestRoles());
    }

    /** Get one response page without sending undocumented request controls. */
    async getRolesPage(): Promise<Page<Role>> {
        return decodePage<Role>('roles', await this.requestRoles(undefined, { pageProjection: true }));
    }

    /** Get every role under the configured pagination safety bounds. */
    async getAllRoles(options?: GetAllRolesOptions): Promise<Role[]> {
        return collectAllPages<Role>({
            ...snapshotPaginationSafetyOptions(options),
            requestControls: false,
            fetchPage: (request) =>
                this.requestRoles(
                    {
                        ...(request.limit === undefined ? {} : { limit: request.limit }),
                        ...(request.offset === undefined ? {} : { offset: request.offset }),
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                ).then((raw) => decodePage<Role>('roles', raw)),
        });
    }

    private async requestRoles(
        pagination?: MetadataPaginationControls,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validatePaginationParams(pagination?.limit, pagination?.offset);
        const endpoint = buildEndpoint('get_roles', {
            limit: pagination?.limit,
            offset: pagination?.offset,
        });
        // `get_roles` (TestRail 7.3+) documents the `{ offset, limit, size, _links,
        // roles: [...] }` wrapper, but the docs are not a reliable guide to which
        // shape a given server sends — see the `listOf` docblock in `./list.js` for
        // the full rationale. Accept both; `unwrapList` normalizes.
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('roles', RoleSchema) : listOf('roles', RoleSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
    }
}
