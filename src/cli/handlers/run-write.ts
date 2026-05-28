import { AddRunPayloadSchema, UpdateRunPayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleRunAdd = createWriteHandler({
    action: 'run add',
    pathParams: ['project_id'],
    bodySchema: AddRunPayloadSchema,
    call: (client, [projectId], body) => client.addRun(projectId, body),
});

export const handleRunUpdate = createWriteHandler({
    action: 'run update',
    pathParams: ['run_id'],
    bodySchema: UpdateRunPayloadSchema,
    call: (client, [runId], body) => client.updateRun(runId, body),
});

/**
 * Destructive: closes a run. Irreversible (TestRail has no `open_run`
 * endpoint). Takes no body. Returns the closed run. `--soft` is not applicable
 * and is silently ignored (close is not a delete).
 */
export const handleRunClose = createDestructiveHandler({
    action: 'run close',
    pathParams: ['run_id'],
    softMode: 'ignore',
    kind: 'close',
    call: (client, [runId]) => client.closeRun(runId),
});

/**
 * Destructive: deletes a run and all associated results. `--soft` invokes
 * TestRail's server-side preview (`soft=1`).
 */
export const handleRunDelete = createDestructiveHandler({
    action: 'run delete',
    pathParams: ['run_id'],
    softMode: 'optional',
    call: (client, [runId], _entry, soft) => client.deleteRun(runId, { soft }),
});
