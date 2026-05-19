import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddVariablePayloadSchema, UpdateVariablePayloadSchema } from '../../schemas.js';

export async function handleVariableAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddVariablePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'variable add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addVariable(projectId, body.payload));
}

export async function handleVariableUpdate(ctx: HandlerContext): Promise<void> {
    const variableId = parseId(ctx.args.pathParams[0], 'variable_id');
    const body = resolveBody(ctx.bodyInput, UpdateVariablePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'variable update',
            variableId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateVariable(variableId, body.payload));
}

/**
 * Destructive: deletes a variable. Gated by `--yes`; `--dry-run` wins for
 * preview-without-API. TestRail's `delete_variable` does NOT support the
 * `soft=1` server-side preview, so `--soft` is rejected here rather than
 * silently dropped — keeping destructive intent unambiguous (mirrors the
 * `milestone delete` / `project delete` pattern).
 */
export async function handleVariableDelete(ctx: HandlerContext): Promise<void> {
    const variableId = parseId(ctx.args.pathParams[0], 'variable_id');

    if (ctx.args.soft === true) {
        throw new Error('variable delete does not support --soft.');
    }

    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'variable delete', variableId, destructive: true });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.deleteVariable(variableId);
    ctx.out({ variableId, deleted: true });
}
