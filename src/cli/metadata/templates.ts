import type { ActionSpec } from './types.js';

/**
 * `template` actions:
 *   [0] list — read
 */
export const templateActions: readonly ActionSpec[] = [
    {
        resource: 'template',
        action: 'list',
        summary: 'List case templates available in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_templates/{project_id}',
        isWrite: false,
    },
];
