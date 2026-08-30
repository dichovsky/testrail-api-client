import { handleDynamicFilterFieldList } from '../handlers/dynamic-filter-field.js';
import type { ActionSpec } from './types.js';

/** `dynamic-filter-field` actions. */
export const dynamicFilterFieldActions: readonly ActionSpec[] = [
    {
        resource: 'dynamic-filter-field',
        action: 'list',
        summary: 'List fields available for dynamic filtering in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_dynamic_filter_fields/{project_id}',
        isWrite: false,
        handler: handleDynamicFilterFieldList,
    },
];
