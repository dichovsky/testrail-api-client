import { TestRailClientCore } from '../client-core.js';
import { VariableSchema } from '../schemas.js';
import type { Variable, AddVariablePayload, UpdateVariablePayload } from '../schemas.js';

export class VariableModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_variables/{project_id} */
    async getVariables(projectId: number): Promise<Variable[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Variable[]>('GET', `get_variables/${projectId}`, VariableSchema.array());
    }

    /** @testrail POST add_variable/{project_id} */
    async addVariable(projectId: number, payload: AddVariablePayload): Promise<Variable> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Variable>('POST', `add_variable/${projectId}`, VariableSchema, payload);
    }

    /** @testrail POST update_variable/{variable_id} */
    async updateVariable(variableId: number, payload: UpdateVariablePayload): Promise<Variable> {
        this.client.validateId(variableId, 'variableId');
        return this.client.requestParsed<Variable>('POST', `update_variable/${variableId}`, VariableSchema, payload);
    }

    /** @testrail POST delete_variable/{variable_id} */
    async deleteVariable(variableId: number): Promise<void> {
        this.client.validateId(variableId, 'variableId');
        await this.client.request<void>('POST', `delete_variable/${variableId}`);
    }
}
