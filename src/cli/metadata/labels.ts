import { AddLabelPayloadSchema, DeleteLabelsPayloadSchema, UpdateLabelPayloadSchema } from '../../schemas.js';
import { handleLabelGet, handleLabelList } from '../handlers/label.js';
import {
    handleLabelAdd,
    handleLabelDelete,
    handleLabelDeleteBulk,
    handleLabelUpdate,
} from '../handlers/label-write.js';
import type { ActionSpec } from './types.js';

/**
 * `label` actions in their original relative order (TestRail Labels API, 2025):
 *   [0] get    — read (single label by ID)
 *   [1] list   — read (project's labels, paginated)
 *   [2] add         — write (create)
 *   [3] update      — write (rename)
 *   [4] delete      — destructive write (single label)
 *   [5] delete-bulk — destructive write (body carries label IDs)
 */
export const labelActions: readonly ActionSpec[] = [
    {
        resource: 'label',
        action: 'get',
        summary: 'Fetch a single label by ID',
        pathParams: [{ name: 'label_id', description: 'TestRail label ID' }],
        apiEndpoint: 'GET get_label/{label_id}',
        isWrite: false,
        handler: handleLabelGet,
    },
    {
        resource: 'label',
        action: 'list',
        summary: "List a project's labels (paginated)",
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_labels/{project_id}',
        pagination: { response: 'envelope', requestControls: true, collectionKey: 'labels' },
        isWrite: false,
        handler: handleLabelList,
    },
    {
        resource: 'label',
        action: 'add',
        summary: 'Create a label in a project (title max 20 chars)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_label/{project_id}',
        bodySchema: AddLabelPayloadSchema,
        helpExample: `--data '{"title":"..."}'  (max 20 chars)`,
        isWrite: true,
        handler: handleLabelAdd,
    },
    {
        resource: 'label',
        action: 'update',
        summary: 'Rename an existing label (title max 20 chars; propagates to all cases/tests using it)',
        pathParams: [{ name: 'label_id', description: 'TestRail label ID' }],
        apiEndpoint: 'POST update_label/{label_id}',
        bodySchema: UpdateLabelPayloadSchema,
        helpExample: `--data '{"project_id":1,"title":"..."}'  (max 20 chars)`,
        isWrite: true,
        handler: handleLabelUpdate,
    },
    {
        resource: 'label',
        action: 'delete',
        summary: 'Delete a label',
        pathParams: [{ name: 'label_id', description: 'TestRail label ID' }],
        apiEndpoint: 'POST delete_label/{label_id}',
        isWrite: true,
        destructive: true,
        handler: handleLabelDelete,
    },
    {
        resource: 'label',
        action: 'delete-bulk',
        summary: 'Delete multiple labels (IDs in body)',
        pathParams: [],
        apiEndpoint: 'POST delete_labels',
        bodySchema: DeleteLabelsPayloadSchema,
        helpExample: `--data '{"label_ids":[1,2,3]}'  (no path param)`,
        isWrite: true,
        destructive: true,
        handler: handleLabelDeleteBulk,
    },
];
