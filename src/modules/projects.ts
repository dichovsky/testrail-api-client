import { TestRailClientCore } from '../client-core.js';
import type { Project } from '../types.js';
import { ProjectSchema } from '../schemas.js';
import type { AddProjectPayload, UpdateProjectPayload } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotOptionFields, snapshotPaginatedRequestOptions } from './pagination-options.js';

export interface GetProjectsOptions {
    /** `true` to return only completed projects, `false` for active projects */
    isCompleted?: boolean;
    limit?: number;
    offset?: number;
}

/** @deprecated Use {@link GetProjectsOptions}. */
export type GetProjectsPageOptions = GetProjectsOptions;

export type GetAllProjectsOptions = Omit<GetProjectsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
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
    async getProjects(options?: GetProjectsOptions): Promise<Project[]>;
    /** @deprecated Pass a `GetProjectsOptions` object instead. */
    async getProjects(limit?: number, offset?: number): Promise<Project[]>;
    async getProjects(optionsOrLimit?: GetProjectsOptions | number, legacyOffset?: number): Promise<Project[]> {
        const options =
            typeof optionsOrLimit === 'number'
                ? { limit: optionsOrLimit, ...(legacyOffset !== undefined && { offset: legacyOffset }) }
                : optionsOrLimit === undefined && legacyOffset !== undefined
                  ? { offset: legacyOffset }
                  : optionsOrLimit;
        return unwrapList<Project>('projects', await this.requestProjects(options));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getProjectsPage(options?: GetProjectsPageOptions): Promise<Page<Project>> {
        return decodePage<Project>('projects', await this.requestProjects(options, { pageProjection: true }));
    }

    /** Get every project under the configured pagination safety bounds. */
    async getAllProjects(options?: GetAllProjectsOptions): Promise<Project[]> {
        const filters = snapshotOptionFields(options, ['isCompleted']);
        return collectAllPages<Project>({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async (request) => {
                const raw = await this.requestProjects(
                    {
                        ...filters,
                        limit: request.limit as number,
                        offset: request.offset as number,
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                );
                return decodePage<Project>('projects', raw);
            },
        });
    }

    private async requestProjects(options?: GetProjectsOptions, controls?: PaginationFetchControls): Promise<unknown> {
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint('get_projects', {
            is_completed: options?.isCompleted !== undefined ? (options.isCompleted ? 1 : 0) : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('projects', ProjectSchema) : listOf('projects', ProjectSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
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
