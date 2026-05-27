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
     * @testrail GET get_project/{project_id}
     */
    async getProject(projectId: number): Promise<Project> {
        this.client.validateId(projectId, 'projectId');
        return this.client.request<Project>({
            method: 'GET',
            endpoint: `get_project/${projectId}`,
            schema: ProjectSchema,
        });
    }

    /**
     * Get all projects.
     * @throws {TestRailValidationError} When limit or offset is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail GET get_projects
     */
    async getProjects(limit?: number, offset?: number): Promise<Project[]> {
        this.client.validatePaginationParams(limit, offset);
        const endpoint = this.client.buildEndpoint('get_projects', { limit, offset });
        return (
            (
                await this.client.request<{ projects?: Project[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ projects: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ projects: z.array(ProjectSchema).nullish() }),
                })
            ).projects ?? []
        );
    }

    /**
     * Add a new project.
     * @throws {TestRailApiError} When the API request fails
     * @testrail POST add_project
     */
    async addProject(payload: AddProjectPayload): Promise<Project> {
        return this.client.request<Project>({
            method: 'POST',
            endpoint: 'add_project',
            schema: ProjectSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Update an existing project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail POST update_project/{project_id}
     */
    async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project> {
        this.client.validateId(projectId, 'projectId');
        return this.client.request<Project>({
            method: 'POST',
            endpoint: `update_project/${projectId}`,
            schema: ProjectSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Delete a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail POST delete_project/{project_id}
     */
    async deleteProject(projectId: number): Promise<void> {
        this.client.validateId(projectId, 'projectId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_project/${projectId}`,
        });
    }
}
