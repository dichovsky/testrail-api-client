import { TestRailClientCore } from '../client-core.js';
import type { Suite, SoftDeleteOptions } from '../types.js';
import { SuiteSchema, SoftDeletePreviewSchema } from '../schemas.js';
import type { AddSuitePayload, SoftDeletePreview, UpdateSuitePayload } from '../schemas.js';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetSuitesOptions {
    limit?: number;
    offset?: number;
}

export type GetAllSuitesOptions = PaginatedRequestOptions;

export const SUITES_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetSuitesOptions,
    GetAllSuitesOptions,
    Suite
>({
    operations: ['get_suites'],
    collectionKey: 'suites',
    itemSchema: SuiteSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }) => {
        validateId(projectId, 'projectId');
        return { operation: 'get_suites', pathParameters: [projectId] };
    },
});

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
        return SUITES_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getSuitesPage(projectId: number, options?: GetSuitesOptions): Promise<Page<Suite>> {
        return SUITES_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every suite under the configured pagination safety bounds. */
    async getAllSuites(projectId: number, options?: GetAllSuitesOptions): Promise<Suite[]> {
        return SUITES_PAGINATION.all(this.client, { projectId }, options);
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
