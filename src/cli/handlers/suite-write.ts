import { AddSuitePayloadSchema, UpdateSuitePayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleSuiteAdd = createWriteHandler({
    action: 'suite add',
    pathParams: ['project_id'],
    bodySchema: AddSuitePayloadSchema,
    call: (client, [projectId], body) => client.suites.addSuite(projectId, body),
});

export const handleSuiteUpdate = createWriteHandler({
    action: 'suite update',
    pathParams: ['suite_id'],
    bodySchema: UpdateSuitePayloadSchema,
    call: (client, [suiteId], body) => client.suites.updateSuite(suiteId, body),
});

/**
 * Destructive: deletes a suite and everything inside it (sections, cases,
 * runs, plans). `--soft` invokes TestRail's server-side preview (`soft=1`).
 */
export const handleSuiteDelete = createDestructiveHandler({
    action: 'suite delete',
    pathParams: ['suite_id'],
    softMode: 'optional',
    call: (client, [suiteId], _entry, soft) => client.suites.deleteSuite(suiteId, { soft }),
});
