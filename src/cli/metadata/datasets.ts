import { AddDatasetPayloadSchema, UpdateDatasetPayloadSchema } from '../../schemas.js';
import { handleDatasetGet, handleDatasetList } from '../handlers/dataset.js';
import { handleDatasetAdd, handleDatasetDelete, handleDatasetUpdate } from '../handlers/dataset-write.js';
import type { ActionSpec } from './types.js';

/**
 * `dataset` actions in their original relative order:
 *   [0] get    — read
 *   [1] list   — read
 *   [2] add    — write
 *   [3] update — write
 *   [4] delete — write (destructive)
 */
export const datasetActions: readonly ActionSpec[] = [
    {
        resource: 'dataset',
        action: 'get',
        summary: 'Fetch a single dataset by ID',
        pathParams: [{ name: 'dataset_id', description: 'TestRail dataset ID' }],
        apiEndpoint: 'GET get_dataset/{dataset_id}',
        isWrite: false,
        handler: handleDatasetGet,
    },
    {
        resource: 'dataset',
        action: 'list',
        summary: 'List datasets in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_datasets/{project_id}',
        isWrite: false,
        handler: handleDatasetList,
    },
    {
        resource: 'dataset',
        action: 'add',
        summary: 'Create a new dataset in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_dataset/{project_id}',
        bodySchema: AddDatasetPayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleDatasetAdd,
    },
    {
        resource: 'dataset',
        action: 'update',
        summary: 'Update an existing dataset (rename)',
        pathParams: [{ name: 'dataset_id', description: 'TestRail dataset ID' }],
        apiEndpoint: 'POST update_dataset/{dataset_id}',
        bodySchema: UpdateDatasetPayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleDatasetUpdate,
    },
    {
        resource: 'dataset',
        action: 'delete',
        summary: 'Delete a dataset (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'dataset_id', description: 'TestRail dataset ID' }],
        apiEndpoint: 'POST delete_dataset/{dataset_id}',
        isWrite: true,
        destructive: true,
        helpExample: '(no body; --soft NOT supported by TestRail)',
        handler: handleDatasetDelete,
    },
];
