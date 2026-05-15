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
