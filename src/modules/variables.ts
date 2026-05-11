import { TestRailClientCore } from '../client-core.js';
import type { Variable, AddVariablePayload, UpdateVariablePayload } from '../types.js';
import { VariableSchema } from '../schemas.js';

export class VariableModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getVariables(projectId: number): Promise<Variable[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Variable[]>(
            VariableSchema.array(),
            await this.client.request<unknown>('GET', `get_variables/${projectId}`),
        );
    }

    async addVariable(projectId: number, payload: AddVariablePayload): Promise<Variable> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Variable>(
            VariableSchema,
            await this.client.request<unknown>('POST', `add_variable/${projectId}`, payload),
        );
    }

    async updateVariable(variableId: number, payload: UpdateVariablePayload): Promise<Variable> {
        this.client.validateId(variableId, 'variableId');
        return this.client.parse<Variable>(
            VariableSchema,
            await this.client.request<unknown>('POST', `update_variable/${variableId}`, payload),
        );
    }

    async deleteVariable(variableId: number): Promise<void> {
        this.client.validateId(variableId, 'variableId');
        await this.client.request<void>('POST', `delete_variable/${variableId}`);
    }
}
