import { TestRailClientCore } from '../client-core.js';
import type { Suite, SoftDeleteOptions } from '../types.js';
import { SuiteSchema, SoftDeletePreviewSchema } from '../schemas.js';
import type { AddSuitePayload, SoftDeletePreview, UpdateSuitePayload } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotPaginatedRequestOptions } from './pagination-options.js';

export interface GetSuitesOptions {
    limit?: number;
    offset?: number;
}

export type GetAllSuitesOptions = PaginatedRequestOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

export class SuiteModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Get a suite by ID.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail GET get_suite/{suite_id}
     */
    async getSuite(suiteId: number): Promise<Suite> {
        validateId(suiteId, 'suiteId');
        return this.client.request<Suite>({
            method: 'GET',
            endpoint: `get_suite/${suiteId}`,
            schema: SuiteSchema,
        });
    }

    /**
     * Get the suites from one TestRail response for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail GET get_suites/{project_id}
     */
    async getSuites(projectId: number, options?: GetSuitesOptions): Promise<Suite[]> {
        return unwrapList<Suite>('suites', await this.requestSuites(projectId, options));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getSuitesPage(projectId: number, options?: GetSuitesOptions): Promise<Page<Suite>> {
        return decodePage<Suite>('suites', await this.requestSuites(projectId, options, { pageProjection: true }));
    }

    /** Get every suite under the configured pagination safety bounds. */
    async getAllSuites(projectId: number, options?: GetAllSuitesOptions): Promise<Suite[]> {
        return collectAllPages<Suite>({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async (request) => {
                const pageOptions: GetSuitesOptions = {
                    limit: request.limit as number,
                    offset: request.offset as number,
                };
                const raw = await this.requestSuites(projectId, pageOptions, {
                    bypassCache: request.bypassCache,
                    remainingTimeMs: request.remainingTimeMs,
                    deadlineAt: request.deadlineAt,
                });
                return decodePage<Suite>('suites', raw);
            },
        });
    }

    private async requestSuites(
        projectId: number,
        options?: GetSuitesOptions,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        validatePaginationParams(options?.limit, options?.offset);
        // `get_suites` is bimodal across TestRail versions: it returns a bare
        // array up to 9.3.0, and a paginated `{ offset, limit, size, _links,
        // suites: [...] }` wrapper from 9.3.1+ (documented breaking change).
        // Accept both shapes so the client works regardless of server version;
        // keep envelope metadata for the explicit page and aggregate projections.
        const endpoint = buildEndpoint(`get_suites/${projectId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('suites', SuiteSchema) : listOf('suites', SuiteSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
    }

    /**
     * Add a suite to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail POST add_suite/{project_id}
     */
    async addSuite(projectId: number, payload: AddSuitePayload): Promise<Suite> {
        validateId(projectId, 'projectId');
        return this.client.request<Suite>({
            method: 'POST',
            endpoint: `add_suite/${projectId}`,
            schema: SuiteSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Update a suite.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail POST update_suite/{suite_id}
     */
    async updateSuite(suiteId: number, payload: UpdateSuitePayload): Promise<Suite> {
        validateId(suiteId, 'suiteId');
        return this.client.request<Suite>({
            method: 'POST',
            endpoint: `update_suite/${suiteId}`,
            schema: SuiteSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Delete a suite and everything inside it (sections, cases, runs, plans).
     * Pass `{ soft: true }` for TestRail's server-side preview (`soft=1`) —
     * the API call still happens but nothing is deleted; TestRail returns
     * counts of affected entities. TestRail 6.5+ for soft-mode.
     *
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail POST delete_suite/{suite_id}
     */
    async deleteSuite(suiteId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteSuite(suiteId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteSuite(suiteId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteSuite(suiteId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        validateId(suiteId, 'suiteId');
        const endpoint = buildEndpoint(`delete_suite/${suiteId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>({ method: 'POST', endpoint });
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw, {
                method: 'POST',
                endpoint,
            });
        }
    }
}
