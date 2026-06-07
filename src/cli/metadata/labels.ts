import { UpdateLabelPayloadSchema } from '../../schemas.js';
import { handleLabelGet, handleLabelList } from '../handlers/label.js';
import { handleLabelUpdate } from '../handlers/label-write.js';
import type { ActionSpec } from './types.js';

/**
 * `label` actions in their original relative order (TestRail Labels API, 2025):
 *   [0] get    — read (single label by ID)
 *   [1] list   — read (project's labels, paginated)
 *   [2] update — write (rename)
 *
 * TestRail exposes no `add_label` / `delete_label` REST endpoint — label
 * create/delete is trcli-only — so the CLI surface is get/list/update only,
 * matching the documented API.
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
        isWrite: false,
        handler: handleLabelList,
    },
    {
        resource: 'label',
        action: 'update',
        summary: 'Rename an existing label (title max 20 chars; propagates to all cases/tests using it)',
        pathParams: [{ name: 'label_id', description: 'TestRail label ID' }],
        apiEndpoint: 'POST update_label/{label_id}',
        bodySchema: UpdateLabelPayloadSchema,
        helpExample: `--data '{"title":"..."}'  (max 20 chars)`,
        isWrite: true,
        handler: handleLabelUpdate,
    },
];
