import { UpdateLabelPayloadSchema } from '../../schemas.js';
import { createWriteHandler } from '../write-handler-factory.js';

/**
 * `label update <label_id>` — rename a label. The new title flows in via the
 * JSON body (`{"title":"..."}`); TestRail caps it at 20 chars and the rename
 * propagates to every case/test carrying the label.
 */
export const handleLabelUpdate = createWriteHandler({
    action: 'label update',
    pathParams: ['label_id'],
    bodySchema: UpdateLabelPayloadSchema,
    call: (client, [labelId], body) => client.labels.updateLabel(labelId, body),
});
