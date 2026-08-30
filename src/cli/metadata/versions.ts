import { handleVersionGet } from '../handlers/version.js';
import type { ActionSpec } from './types.js';

/** `version` actions. */
export const versionActions: readonly ActionSpec[] = [
    {
        resource: 'version',
        action: 'get',
        summary: 'Get the installed TestRail version',
        pathParams: [],
        apiEndpoint: 'GET get_version',
        isWrite: false,
        handler: handleVersionGet,
    },
];
