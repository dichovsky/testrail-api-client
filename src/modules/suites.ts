import { TestRailClientCore } from '../client-core.js';
import type { Suite, SoftDeleteOptions } from '../types.js';
import { SuiteSchema, SoftDeletePreviewSchema } from '../schemas.js';
import type { AddSuitePayload, SoftDeletePreview, UpdateSuitePayload } from '../schemas.js';
import { z } from 'zod';

export class SuiteModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Get a suite by ID.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSuite(suiteId: number): Promise<Suite> {
        this.client.validateId(suiteId, 'suiteId');
        return this.client.parse<Suite>(SuiteSchema, await this.client.request<unknown>('GET', `get_suite/${suiteId}`));
    }

    /**
     * Get all suites for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSuites(projectId: number): Promise<Suite[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Suite[]>(
            z.array(SuiteSchema),
            await this.client.request<unknown>('GET', `get_suites/${projectId}`),
        );
    }

    /**
     * Add a suite to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSuite(projectId: number, payload: AddSuitePayload): Promise<Suite> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Suite>(
            SuiteSchema,
            await this.client.request<unknown>('POST', `add_suite/${projectId}`, payload),
        );
    }

    /**
     * Update a suite.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSuite(suiteId: number, payload: UpdateSuitePayload): Promise<Suite> {
        this.client.validateId(suiteId, 'suiteId');
        return this.client.parse<Suite>(
            SuiteSchema,
            await this.client.request<unknown>('POST', `update_suite/${suiteId}`, payload),
        );
    }

    /**
     * Delete a suite and everything inside it (sections, cases, runs, plans).
     * Pass `{ soft: true }` for TestRail's server-side preview (`soft=1`) —
     * the API call still happens but nothing is deleted; TestRail returns
     * counts of affected entities. TestRail 6.5+ for soft-mode.
     *
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSuite(suiteId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteSuite(suiteId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteSuite(suiteId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteSuite(suiteId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        this.client.validateId(suiteId, 'suiteId');
        const endpoint = this.client.buildEndpoint(`delete_suite/${suiteId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>('POST', endpoint);
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw);
        }
    }
}
