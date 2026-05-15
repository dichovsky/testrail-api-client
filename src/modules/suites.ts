import { TestRailClientCore } from '../client-core.js';
import type { Suite } from '../types.js';
import { SuiteSchema } from '../schemas.js';
import type { AddSuitePayload, UpdateSuitePayload } from '../schemas.js';
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
     * Delete a suite.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSuite(suiteId: number): Promise<void> {
        this.client.validateId(suiteId, 'suiteId');
        await this.client.request<void>('POST', `delete_suite/${suiteId}`);
    }
}
