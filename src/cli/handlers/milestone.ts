import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleMilestoneGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'milestone id');
    ctx.out(await ctx.client.milestones.getMilestone(id));
}

export async function handleMilestoneList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.milestones.getMilestones(pid, pageOptions),
        page: () => ctx.client.milestones.getMilestonesPage(pid, pageOptions),
        all: () => ctx.client.milestones.getAllMilestones(pid, getPaginatedRequestOptions(ctx.pagination)),
    });
}
