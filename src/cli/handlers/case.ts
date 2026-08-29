import type { HandlerContext } from '../handler-context.js';
import { IdParseError, parseId, parseIdList, optInt } from '../ids.js';
import { parseOptionalId, parseOptionalIdList, parseOptionalRefs } from '../filters.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleCaseGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    ctx.out(await ctx.client.cases.getCase(id));
}

export async function handleCaseList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const suiteId = parseOptionalId(ctx.args.suiteId, '--suite-id');
    const sectionId = parseOptionalId(ctx.args.sectionId, '--section-id');
    const typeId = parseOptionalIdList(ctx.args.typeId, '--type-id');
    const priorityId = parseOptionalIdList(ctx.args.priorityId, '--priority-id');
    const templateId = parseOptionalIdList(ctx.args.templateId, '--template-id');
    const milestoneId = parseOptionalIdList(ctx.args.milestoneId, '--milestone-id');
    const createdAfter = parseOptionalId(ctx.args.createdAfter, '--created-after');
    const createdBefore = parseOptionalId(ctx.args.createdBefore, '--created-before');
    const createdBy = parseOptionalIdList(ctx.args.createdBy, '--created-by');
    const updatedAfter = parseOptionalId(ctx.args.updatedAfter, '--updated-after');
    const updatedBefore = parseOptionalId(ctx.args.updatedBefore, '--updated-before');
    const updatedBy = parseOptionalIdList(ctx.args.updatedBy, '--updated-by');
    const labelId = parseOptionalIdList(ctx.args.labelId, '--label-id');
    const refs = parseOptionalRefs(ctx.args.refs);
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const filters = {
        ...(suiteId !== undefined && { suiteId }),
        ...(sectionId !== undefined && { sectionId }),
        ...(typeId !== undefined && { typeId }),
        ...(priorityId !== undefined && { priorityId }),
        ...(templateId !== undefined && { templateId }),
        ...(milestoneId !== undefined && { milestoneId }),
        ...(createdAfter !== undefined && { createdAfter }),
        ...(createdBefore !== undefined && { createdBefore }),
        ...(createdBy !== undefined && { createdBy }),
        ...(ctx.args.filter !== undefined && { filter: ctx.args.filter }),
        ...(updatedAfter !== undefined && { updatedAfter }),
        ...(updatedBefore !== undefined && { updatedBefore }),
        ...(updatedBy !== undefined && { updatedBy }),
        ...(labelId !== undefined && { labelId }),
        ...(refs !== undefined && { refs }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.cases.getCases(pid, pageOptions),
        page: () => ctx.client.cases.getCasesPage(pid, pageOptions),
        all: () =>
            ctx.client.cases.getAllCases(pid, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.args),
            }),
    });
}

export async function handleCaseTitles(ctx: HandlerContext): Promise<void> {
    const caseIds = parseIdList(ctx.args.pathParams[0], 'case_ids');
    if (caseIds === undefined) {
        throw new IdParseError('case_ids must be a comma-separated list of positive integers (got: none)');
    }
    ctx.out(await ctx.client.cases.getCaseTitles(caseIds));
}

export async function handleCaseHistory(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.cases.getHistoryForCase(id, pageOptions),
        page: () => ctx.client.cases.getHistoryForCasePage(id, pageOptions),
        all: () => ctx.client.cases.getAllHistoryForCase(id, getPaginatedRequestOptions(ctx.args)),
    });
}
