import { AddProjectPayloadSchema, UpdateProjectPayloadSchema } from '../../schemas.js';
import { handleProjectGet, handleProjectList } from '../handlers/project.js';
import { handleProjectAdd, handleProjectDelete, handleProjectUpdate } from '../handlers/project-write.js';
import type { ActionSpec } from './types.js';

/**
 * `project` actions in their original relative order:
 *   [0] get   — read
 *   [1] list  — read
 *   [2] add   — write (structural-setup)
 *   [3] update — write (structural-setup)
 *   [4] delete — write (destructive)
 *
 * The barrel in `src/cli/metadata.ts` slices this array to preserve the
 * interleaved layout of the original `ACTIONS` literal.
 */
export const projectActions: readonly ActionSpec[] = [
    {
        resource: 'project',
        action: 'get',
        summary: 'Fetch a single project by ID',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_project/{project_id}',
        isWrite: false,
        handler: handleProjectGet,
    },
    {
        resource: 'project',
        action: 'list',
        summary: 'List all projects (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_projects',
        isWrite: false,
        handler: handleProjectList,
    },
    {
        resource: 'project',
        action: 'add',
        summary: 'Create a new project (no path params, payload-only)',
        pathParams: [],
        apiEndpoint: 'POST add_project',
        bodySchema: AddProjectPayloadSchema,
        helpExample: `--data '{"name":"...","suite_mode":1}'`,
        isWrite: true,
        handler: handleProjectAdd,
    },
    {
        resource: 'project',
        action: 'update',
        summary: 'Update an existing project (partial fields)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST update_project/{project_id}',
        bodySchema: UpdateProjectPayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleProjectUpdate,
    },
    {
        resource: 'project',
        action: 'delete',
        summary:
            'Delete a project and everything inside it (highest blast radius; requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST delete_project/{project_id}',
        isWrite: true,
        destructive: true,
        helpExample: '(no body; --soft NOT supported by TestRail; highest blast radius)',
        handler: handleProjectDelete,
    },
];
