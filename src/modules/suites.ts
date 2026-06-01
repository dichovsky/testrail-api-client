import { TestRailClientCore } from '../client-core.js';
import type { Suite, SoftDeleteOptions } from '../types.js';
import { SuiteSchema, SoftDeletePreviewSchema } from '../schemas.js';
import type { AddSuitePayload, SoftDeletePreview, UpdateSuitePayload } from '../schemas.js';
import { z } from 'zod';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';

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
     * Get all suites for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail GET get_suites/{project_id}
     */
    async getSuites(projectId: number): Promise<Suite[]> {
        validateId(projectId, 'projectId');
        // `get_suites` is bimodal across TestRail versions: it returns a bare
        // array up to 9.3.0, and a paginated `{ offset, limit, size, _links,
        // suites: [...] }` wrapper from 9.3.1+ (documented breaking change).
        // Accept both shapes so the client works regardless of server version —
        // the bare array stays the common path; the wrapper is unwrapped via
        // `.suites ?? []`. `z.object` strips the extra pagination keys.
        const raw = await this.client.request<Suite[] | { suites?: Suite[] }>({
            method: 'GET',
            endpoint: `get_suites/${projectId}`,
            schema: z.union([z.array(SuiteSchema), z.object({ suites: z.array(SuiteSchema).nullish() })]),
        });
        return Array.isArray(raw) ? raw : (raw.suites ?? []);
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
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw);
        }
    }
}
