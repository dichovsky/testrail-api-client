import { TestRailClientCore } from '../client-core.js';
import { VariableSchema } from '../schemas.js';
import type { Variable, AddVariablePayload, UpdateVariablePayload } from '../schemas.js';
import { validateId } from '../validation.js';

export class VariableModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_variables/{project_id} */
    async getVariables(projectId: number): Promise<Variable[]> {
        validateId(projectId, 'projectId');
        return this.client.request<Variable[]>({
            method: 'GET',
            endpoint: `get_variables/${projectId}`,
            schema: VariableSchema.array(),
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
