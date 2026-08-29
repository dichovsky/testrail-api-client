import { AddLabelPayloadSchema, DeleteLabelsPayloadSchema, UpdateLabelPayloadSchema } from '../../schemas.js';
import type { HandlerContext } from '../handler-context.js';
import { resolveBody } from '../body.js';
import { IdParseError } from '../ids.js';
import { createDestructiveHandler, createWriteHandler } from '../write-handler-factory.js';

/** `label add <project_id>` — create a project-scoped label. */
export const handleLabelAdd = createWriteHandler({
    action: 'label add',
    pathParams: ['project_id'],
    bodySchema: AddLabelPayloadSchema,
    call: (client, [projectId], body) => client.labels.addLabel(projectId, body),
});

/**
 * `label update <label_id>` — rename a label. The new title flows in via the
 * JSON body (`{"project_id":1,"title":"..."}`); TestRail caps it at 20 chars
 * and the rename propagates to every case/test carrying the label.
 */
export const handleLabelUpdate = createWriteHandler({
    action: 'label update',
    pathParams: ['label_id'],
    bodySchema: UpdateLabelPayloadSchema,
    call: (client, [labelId], body) => client.labels.updateLabel(labelId, body),
});

/** Destructive: delete one label by ID. TestRail offers no soft preview. */
export const handleLabelDelete = createDestructiveHandler({
    action: 'label delete',
    pathParams: ['label_id'],
    call: (client, [labelId]) => client.labels.deleteLabel(labelId),
});

/**
 * Destructive bulk label deletion. This is body-bearing, so it cannot use the
 * no-body destructive factory; it mirrors the same dry-run/soft/confirmation
 * ordering while validating `label_ids` through the shared payload schema.
 */
export async function handleLabelDeleteBulk(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `label delete-bulk takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    const body = resolveBody(ctx.bodyInput, DeleteLabelsPayloadSchema);
    if (!body.ok) throw new Error(body.error);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'label delete-bulk',
            destructive: true,
            payload: body.payload,
            source: body.source,
        });
        return;
    }

    if (ctx.args.soft === true) {
        throw new Error('label delete-bulk does not support --soft.');
    }
    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.labels.deleteLabels(body.payload);
    ctx.out({ labelIds: body.payload.label_ids, deleted: true });
}
