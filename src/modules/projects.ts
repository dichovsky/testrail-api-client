import { TestRailClientCore } from '../client-core.js';
import type { Project } from '../types.js';
import { ProjectSchema } from '../schemas.js';
import type { AddProjectPayload, UpdateProjectPayload } from '../schemas.js';
import { z } from 'zod';

export class ProjectModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Get a project by ID.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getProject(projectId: number): Promise<Project> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse(ProjectSchema, await this.client.request<unknown>('GET', `get_project/${projectId}`));
    }

    /**
     * Get all projects.
     * @throws {TestRailValidationError} When limit or offset is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getProjects(limit?: number, offset?: number): Promise<Project[]> {
        this.client.validatePaginationParams(limit, offset);
        const endpoint = this.client.buildEndpoint('get_projects', { limit, offset });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ projects?: Project[] }>(z.object({ projects: z.array(ProjectSchema).optional() }), raw)
                .projects ?? []
        );
    }

    /**
     * Add a new project.
     * @throws {TestRailApiError} When the API request fails
     */
    async addProject(payload: AddProjectPayload): Promise<Project> {
        return this.client.parse<Project>(
            ProjectSchema,
            await this.client.request<unknown>('POST', 'add_project', payload),
        );
    }

    /**
     * Update an existing project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Project>(
            ProjectSchema,
            await this.client.request<unknown>('POST', `update_project/${projectId}`, payload),
        );
    }

    /**
     * Delete a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteProject(projectId: number): Promise<void> {
        this.client.validateId(projectId, 'projectId');
        await this.client.request<void>('POST', `delete_project/${projectId}`);
    }
}
