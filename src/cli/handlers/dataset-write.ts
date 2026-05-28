import { AddDatasetPayloadSchema, UpdateDatasetPayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleDatasetAdd = createWriteHandler({
    action: 'dataset add',
    pathParams: ['project_id'],
    bodySchema: AddDatasetPayloadSchema,
    call: (client, [projectId], body) => client.addDataset(projectId, body),
});

/**
 * Update a dataset. `UpdateDatasetPayloadSchema` makes every field optional
 * (rename-only at the moment), so an absent body is a legitimate no-op:
 * `allowEmptyBody` resolves it to `{}` with source `'default'` rather than
 * erroring with "Body required".
 */
export const handleDatasetUpdate = createWriteHandler({
    action: 'dataset update',
    pathParams: ['dataset_id'],
    bodySchema: UpdateDatasetPayloadSchema,
    allowEmptyBody: true,
    call: (client, [datasetId], body) => client.updateDataset(datasetId, body),
});

/**
 * Destructive: deletes a dataset. TestRail's `delete_dataset` has no `soft=1`
 * preview, so `--soft` is rejected.
 */
export const handleDatasetDelete = createDestructiveHandler({
    action: 'dataset delete',
    pathParams: ['dataset_id'],
    call: (client, [datasetId]) => client.deleteDataset(datasetId),
});
