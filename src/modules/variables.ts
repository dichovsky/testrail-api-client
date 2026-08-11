import { TestRailClientCore } from '../client-core.js';
import { VariableSchema } from '../schemas.js';
import type { Variable, AddVariablePayload, UpdateVariablePayload } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginationRequest, PaginationSafetyOptions } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotPaginationSafetyOptions } from './pagination-options.js';

export type GetAllVariablesOptions = PaginationSafetyOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

interface VariablePaginationControls {
    limit?: number;
    offset?: number;
}

export class VariableModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_variables/{project_id} */
    async getVariables(projectId: number): Promise<Variable[]> {
        return unwrapList<Variable>('variables', await this.requestVariables(projectId));
    }

    /** Get one response page without sending undocumented request controls. */
    async getVariablesPage(projectId: number): Promise<Page<Variable>> {
        return decodePage<Variable>(
            'variables',
            await this.requestVariables(projectId, undefined, { pageProjection: true }),
        );
    }

    /** Get every variable under the configured pagination safety bounds. */
    async getAllVariables(projectId: number, options?: GetAllVariablesOptions): Promise<Variable[]> {
        return collectAllPages<Variable>({
            ...snapshotPaginationSafetyOptions(options),
            requestControls: false,
            fetchPage: (request) =>
                this.requestVariables(
                    projectId,
                    {
                        ...(request.limit === undefined ? {} : { limit: request.limit }),
                        ...(request.offset === undefined ? {} : { offset: request.offset }),
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                ).then((raw) => decodePage<Variable>('variables', raw)),
        });
    }

    private async requestVariables(
        projectId: number,
        pagination?: VariablePaginationControls,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        validatePaginationParams(pagination?.limit, pagination?.offset);
        const endpoint = buildEndpoint(`get_variables/${projectId}`, {
            limit: pagination?.limit,
            offset: pagination?.offset,
        });
        // TestRail documents the standard pagination envelope, while older or
        // edge servers may return a bare array. `listOf` accepts both forms but
        // still requires an envelope to contain `variables`; explicit null is
        // the only envelope representation normalized to an empty list.
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('variables', VariableSchema) : listOf('variables', VariableSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
    }

    /** @testrail POST add_variable/{project_id} */
    async addVariable(projectId: number, payload: AddVariablePayload): Promise<Variable> {
        validateId(projectId, 'projectId');
        return this.client.request<Variable>({
            method: 'POST',
            endpoint: `add_variable/${projectId}`,
            schema: VariableSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_variable/{variable_id} */
    async updateVariable(variableId: number, payload: UpdateVariablePayload): Promise<Variable> {
        validateId(variableId, 'variableId');
        return this.client.request<Variable>({
            method: 'POST',
            endpoint: `update_variable/${variableId}`,
            schema: VariableSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_variable/{variable_id} */
    async deleteVariable(variableId: number): Promise<void> {
        validateId(variableId, 'variableId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_variable/${variableId}`,
        });
    }
}
