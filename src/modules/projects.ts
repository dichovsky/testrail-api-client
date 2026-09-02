import { TestRailClientCore } from '../client-core.js';
import type { Project } from '../types.js';
import { ProjectSchema } from '../schemas.js';
import type { AddProjectPayload, UpdateProjectPayload } from '../schemas.js';
import { validateId } from '../validation.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetProjectsOptions {
    /** `true` to return only completed projects, `false` for active projects. */
    isCompleted?: boolean;
    limit?: number;
    offset?: number;
}

/** @deprecated Use {@link GetProjectsOptions}. */
export type GetProjectsPageOptions = GetProjectsOptions;

export type GetAllProjectsOptions = Omit<GetProjectsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

export const PROJECTS_PAGINATION = createPaginatedListExecutor<
    Record<never, never>,
    GetProjectsOptions,
    GetAllProjectsOptions,
    Project
>({
    operations: ['get_projects'],
    collectionKey: 'projects',
    itemSchema: ProjectSchema,
    response: 'envelope',
    requestControls: true,
    prepare: (_args, options) => ({
        operation: 'get_projects',
        query: {
            is_completed: options?.isCompleted !== undefined ? (options.isCompleted ? 1 : 0) : undefined,
        },
    }),
});

export class ProjectModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Get a project by ID.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail GET get_project/{project_id}
     */
    async getProject(projectId: number): Promise<Project> {
        validateId(projectId, 'projectId');
        return this.client.request<Project>({
            method: 'GET',
            endpoint: `get_project/${projectId}`,
            schema: ProjectSchema,
        });
    }

    /**
     * Get the projects from one TestRail response.
     * @throws {TestRailValidationError} When limit or offset is invalid
     * @throws {TestRailApiError} When the API request fails
     * @testrail GET get_projects
     */
    async getProjects(options?: GetProjectsOptions): Promise<Project[]>;
    /** @deprecated Pass a {@link GetProjectsOptions} object instead. */
    async getProjects(limit?: number, offset?: number): Promise<Project[]>;
    async getProjects(optionsOrLimit?: GetProjectsOptions | number, legacyOffset?: number): Promise<Project[]> {
        const options =
            typeof optionsOrLimit === 'number'
                ? { limit: optionsOrLimit, ...(legacyOffset !== undefined && { offset: legacyOffset }) }
                : optionsOrLimit === undefined && legacyOffset !== undefined
                  ? { offset: legacyOffset }
                  : optionsOrLimit;
        return PROJECTS_PAGINATION.items(this.client, {}, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getProjectsPage(options?: GetProjectsPageOptions): Promise<Page<Project>> {
        return PROJECTS_PAGINATION.page(this.client, {}, options);
    }

    /** Get every project under the configured pagination safety bounds. */
    async getAllProjects(options?: GetAllProjectsOptions): Promise<Project[]> {
        return PROJECTS_PAGINATION.all(this.client, {}, options);
    }

    /** @testrail POST add_project */
    async addProject(payload: AddProjectPayload): Promise<Project> {
        return this.client.request<Project>({
            method: 'POST',
            endpoint: 'add_project',
            schema: ProjectSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_project/{project_id} */
    async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project> {
        validateId(projectId, 'projectId');
        return this.client.request<Project>({
            method: 'POST',
            endpoint: `update_project/${projectId}`,
            schema: ProjectSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_project/{project_id} */
    async deleteProject(projectId: number): Promise<void> {
        validateId(projectId, 'projectId');
        await this.client.request<void>({ method: 'POST', endpoint: `delete_project/${projectId}` });
    }
}
