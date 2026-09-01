import type { HandlerContext } from '../handler-context.js';
import { optInt, parseId } from '../ids.js';
import { resolveOut } from '../file-output.js';
import { safeWriteText } from '../safe-write.js';
import { emitStdoutAck } from '../output.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';
import { parseOptionalId, parseOptionalIdList, parseOptionalRefs } from '../filters.js';
import { setupUpload, uploadPayload } from '../upload.js';

/** List project BDD entries through the TestRail 10.5+ paginated endpoint. */
export async function handleBddList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.projectId, '--project-id');
    const suiteId = parseOptionalId(ctx.args.suiteId, '--suite-id');
    const sectionId = parseOptionalId(ctx.args.sectionId, '--section-id');
    const labelId = parseOptionalIdList(ctx.args.labelId, '--label-id');
    const refs = parseOptionalRefs(ctx.args.refs);
    const limit = ctx.pagination?.limit ?? optInt(ctx.args.limit);
    const offset = ctx.pagination?.offset ?? optInt(ctx.args.offset);
    const filters = {
        ...(suiteId !== undefined && { suiteId }),
        ...(sectionId !== undefined && { sectionId }),
        ...(labelId !== undefined && { labelId }),
        ...(refs !== undefined && { refs }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.bdd.getBdds(projectId, pageOptions),
        page: () => ctx.client.bdd.getBddsPage(projectId, pageOptions),
        all: () =>
            ctx.client.bdd.getAllBdds(projectId, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.pagination ?? ctx.args),
            }),
    });
}

/**
 * Download a case's BDD (Gherkin `.feature`) content to a local file or to
 * stdout (`--out -`).
 *
 * Distinct from `attachment get`: the body is **text**, not binary. Reuses
 * the `--out`/`--force` infrastructure from `file-output.ts`; the resolved
 * string content is written with `utf-8` encoding. JSON ack on stdout
 * reports caseId, out path, and byte count for confirmation.
 *
 * When `--out -`: text is written verbatim to `process.stdout` (no JSON
 * envelope, no trailing newline beyond what TestRail already returned) and
 * the JSON ack is rerouted to stderr so the stdout stream remains pure
 * Gherkin for downstream tools.
 */
export async function handleBddGet(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const resolved = resolveOut(
        { ...(ctx.args.out !== undefined && { outFlag: ctx.args.out }) },
        { force: ctx.force, dryRun: ctx.dryRun },
    );
    if (!resolved.ok) throw new Error(resolved.error);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'bdd get',
            caseId,
            out: resolved.path,
        });
        return;
    }

    const text = await ctx.client.bdd.getBdd(caseId);

    if (resolved.target === 'stdout') {
        emitStdoutAck(text, { caseId, out: '<stdout>', size: Buffer.byteLength(text, 'utf-8') }, ctx.errRaw);
        return;
    }

    safeWriteText(resolved.path, text, ctx.force);
    ctx.out({
        caseId,
        out: resolved.path,
        size: Buffer.byteLength(text, 'utf-8'),
    });
}

/**
 * Upload a `.feature` file to a section, creating a BDD case. Mirrors the
 * `attachment add-to-case` flow exactly: stat the `--file`, emit dry-run
 * preview if requested, otherwise hand the path to the streaming multipart
 * pipeline (bytes are read from disk via `node:fs.openAsBlob` — never loaded
 * into the CLI's heap). Supports `--file -` (stdin) under the same byte cap
 * and wall-clock deadline as attachment uploads (`MAX_STDIN_UPLOAD_BYTES`,
 * `STDIN_READ_TIMEOUT_MS`). Async because `resolveFile` may drain stdin.
 */
export async function handleBddAdd(ctx: HandlerContext): Promise<void> {
    const sectionId = parseId(ctx.args.pathParams[0], 'section_id');
    const upload = await setupUpload(ctx, 'bdd add', { sectionId });
    if (upload === null) return;
    ctx.out(await ctx.client.bdd.addBdd(sectionId, uploadPayload(upload), upload.filename));
}

/** Replace an existing case's BDD content with a `.feature` file. */
export async function handleBddUpdate(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const upload = await setupUpload(ctx, 'bdd update', { caseId });
    if (upload === null) return;
    ctx.out(await ctx.client.bdd.updateBdd(caseId, uploadPayload(upload), upload.filename));
}
