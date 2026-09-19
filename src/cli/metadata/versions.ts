import { handleVersionGet } from '../handlers/version.js';
import { defineActions } from './types.js';

/** `version` actions. */
export const versionActions = defineActions([
    {
        resource: 'version',
        action: 'get',
        summary: 'Get the installed TestRail version',
        pathParams: [],
        apiEndpoint: 'GET get_version',
        isWrite: false,
        handler: handleVersionGet,
    },
]);
