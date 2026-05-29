import { AddCaseFieldPayloadSchema } from '../../schemas.js';
import { createWriteHandler } from '../write-handler-factory.js';

/**
 * `case-field add` — create a custom case field (admin-only). No path params;
 * the payload carries `type`, `name`, `label`, and `configs[]`.
 */
export const handleCaseFieldAdd = createWriteHandler({
    action: 'case-field add',
    bodySchema: AddCaseFieldPayloadSchema,
    call: (client, _nums, body) => client.metadata.addCaseField(body),
});
