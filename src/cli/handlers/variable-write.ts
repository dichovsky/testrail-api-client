import { AddVariablePayloadSchema, UpdateVariablePayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleVariableAdd = createWriteHandler({
    action: 'variable add',
    pathParams: ['project_id'],
    bodySchema: AddVariablePayloadSchema,
    call: (client, [projectId], body) => client.variables.addVariable(projectId, body),
});

export const handleVariableUpdate = createWriteHandler({
    action: 'variable update',
    pathParams: ['variable_id'],
    bodySchema: UpdateVariablePayloadSchema,
    call: (client, [variableId], body) => client.variables.updateVariable(variableId, body),
});

/**
 * Destructive: deletes a variable. TestRail's `delete_variable` has no
 * `soft=1` preview, so `--soft` is rejected.
 */
export const handleVariableDelete = createDestructiveHandler({
    action: 'variable delete',
    pathParams: ['variable_id'],
    call: (client, [variableId]) => client.variables.deleteVariable(variableId),
});
