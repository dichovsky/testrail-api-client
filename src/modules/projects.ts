import { TestRailClientCore } from '../client-core.js';
import type { Project } from '../types.js';
import { ProjectSchema } from '../schemas.js';
import type { AddProjectPayload, UpdateProjectPayload } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';

export interface GetProjectsPageOptions {
    limit?: number;
    offset?: number;
}

export type GetAllProjectsOptions = PaginatedRequestOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs'>> & {
    pageProjection?: boolean;
};

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
    async getProjects(limit?: number, offset?: number): Promise<Project[]> {
        return unwrapList<Project>('projects', await this.requestProjects(limit, offset));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getProjectsPage(options?: GetProjectsPageOptions): Promise<Page<Project>> {
        return decodePage<Project>(
            'projects',
            await this.requestProjects(options?.limit, options?.offset, { pageProjection: true }),
        );
    }

    /** Get every project under the configured pagination safety bounds. */
    async getAllProjects(options?: GetAllProjectsOptions): Promise<Project[]> {
        return collectAllPages<Project>({
            ...(options ?? {}),
            fetchPage: async (request) => {
                const raw = await this.requestProjects(request.limit, request.offset, {
                    bypassCache: request.bypassCache,
                    remainingTimeMs: request.remainingTimeMs,
                });
                return decodePage<Project>('projects', raw);
            },
        });
    }

    private async requestProjects(
        limit?: number,
        offset?: number,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validatePaginationParams(limit, offset);
        const endpoint = buildEndpoint('get_projects', { limit, offset });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('projects', ProjectSchema) : listOf('projects', ProjectSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
        });
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
        validateId(projectId, 'projectId');
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
        validateId(projectId, 'projectId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_project/${projectId}`,
        });
    }
}
