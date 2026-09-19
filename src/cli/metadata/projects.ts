import { AddProjectPayloadSchema, UpdateProjectPayloadSchema } from '../../schemas.js';
import { handleProjectGet, handleProjectList } from '../handlers/project.js';
import { handleProjectAdd, handleProjectDelete, handleProjectUpdate } from '../handlers/project-write.js';
import { defineActions } from './types.js';

/**
 * `project` actions, split the way the barrel consumes them. `ACTIONS`
 * interleaves reads and writes from several resources, so each half is its own
 * export rather than a slice of one array — an index that nothing checks.
 */
export const projectReadActions = defineActions([
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
        flags: [{ name: 'is-completed' }],
        isWrite: false,
        handler: handleProjectList,
    },
]);

export const projectWriteActions = defineActions([
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
]);
