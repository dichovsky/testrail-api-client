import { TestRailClientCore } from '../client-core.js';
import { VariableSchema } from '../schemas.js';
import type { Variable, AddVariablePayload, UpdateVariablePayload } from '../schemas.js';
import { validateId } from '../validation.js';
import type { Page, PaginationSafetyOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export type GetAllVariablesOptions = PaginationSafetyOptions;

interface VariablePaginationControls {
    limit?: number;
    offset?: number;
}

export const VARIABLES_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    VariablePaginationControls,
    GetAllVariablesOptions,
    Variable
>({
    operations: ['get_variables'],
    collectionKey: 'variables',
    itemSchema: VariableSchema,
    response: 'envelope',
    requestControls: false,
    prepare: ({ projectId }) => {
        validateId(projectId, 'projectId');
        return {
            operation: 'get_variables',
            pathParameters: [projectId],
        };
    },
});

export class VariableModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_variables/{project_id} */
    async getVariables(projectId: number): Promise<Variable[]> {
        return VARIABLES_PAGINATION.items(this.client, { projectId });
    }

    /** Get one response page without sending undocumented request controls. */
    async getVariablesPage(projectId: number): Promise<Page<Variable>> {
        return VARIABLES_PAGINATION.page(this.client, { projectId });
    }

    /** Get every variable under the configured pagination safety bounds. */
    async getAllVariables(projectId: number, options?: GetAllVariablesOptions): Promise<Variable[]> {
        return VARIABLES_PAGINATION.all(this.client, { projectId }, options);
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
