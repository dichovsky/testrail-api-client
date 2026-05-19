import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

export async function handleReportList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project id');
    ctx.out(await ctx.client.getReports(projectId));
}

export async function handleReportRun(ctx: HandlerContext): Promise<void> {
    const reportTemplateId = parseId(ctx.args.pathParams[0], 'report template id');
    ctx.out(await ctx.client.runReport(reportTemplateId));
}
