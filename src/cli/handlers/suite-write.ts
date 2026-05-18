import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddSuitePayloadSchema, UpdateSuitePayloadSchema } from '../../schemas.js';

export async function handleSuiteAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddSuitePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'suite add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addSuite(projectId, body.payload));
}

export async function handleSuiteUpdate(ctx: HandlerContext): Promise<void> {
    const suiteId = parseId(ctx.args.pathParams[0], 'suite_id');
    const body = resolveBody(ctx.bodyInput, UpdateSuitePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'suite update',
            suiteId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateSuite(suiteId, body.payload));
}

/**
 * Destructive: deletes a suite and everything inside it (sections, cases,
 * runs, plans). Gated by `--yes`; `--dry-run` wins for preview-without-API.
 * `--soft` invokes TestRail's server-side preview (`soft=1`).
 */
export async function handleSuiteDelete(ctx: HandlerContext): Promise<void> {
    const suiteId = parseId(ctx.args.pathParams[0], 'suite_id');
    const soft = ctx.args.soft === true;

    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'suite delete', suiteId, soft, destructive: true });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    if (soft) {
        const preview = await ctx.client.deleteSuite(suiteId, { soft: true });
        ctx.out({ suiteId, soft: true, deleted: false, preview });
        return;
    }
    await ctx.client.deleteSuite(suiteId, { soft: false });
    ctx.out({ suiteId, soft: false, deleted: true });
}
