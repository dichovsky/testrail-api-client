import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddResultPayloadSchema, AddResultsForCasesPayloadSchema, AddResultsPayloadSchema } from '../../schemas.js';

export async function handleResultAddByTest(ctx: HandlerContext): Promise<void> {
    const testId = parseId(ctx.args.pathParams[0], 'test_id');
    const body = resolveBody(ctx.bodyInput, AddResultPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'result add-by-test',
            testId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addResult(testId, body.payload));
}

export async function handleResultAdd(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const caseId = parseId(ctx.args.pathParams[1], 'case_id');
    const body = resolveBody(ctx.bodyInput, AddResultPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'result add',
            runId,
            caseId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addResultForCase(runId, caseId, body.payload));
}

export async function handleResultAddBulk(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const body = resolveBody(ctx.bodyInput, AddResultsForCasesPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'result add-bulk',
            runId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addResultsForCases(runId, body.payload));
}

export async function handleResultAddBulkByTest(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const body = resolveBody(ctx.bodyInput, AddResultsPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'result add-bulk-by-test',
            runId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addResults(runId, body.payload));
}
