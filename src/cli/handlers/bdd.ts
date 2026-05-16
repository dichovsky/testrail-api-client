import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveOut } from '../file-output.js';
import { resolveFile } from '../file-input.js';
import { safeWriteText } from '../safe-write.js';

/**
 * Download a case's BDD (Gherkin `.feature`) content to a local file.
 *
 * Distinct from `attachment get`: the body is **text**, not binary. Reuses
 * the `--out`/`--force` infrastructure from `file-output.ts`; the resolved
 * string content is written with `utf-8` encoding. JSON ack on stdout
 * reports caseId, out path, and byte count for confirmation.
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

    const text = await ctx.client.getBdd(caseId);
    safeWriteText(resolved.path, text, ctx.force);
    ctx.out({
        caseId,
        out: resolved.path,
        size: Buffer.byteLength(text, 'utf-8'),
    });
}

/**
 * Upload a `.feature` file to a case as its BDD content. Mirrors the
 * `attachment add-to-case` flow exactly: stat the `--file`, emit dry-run
 * preview if requested, otherwise read bytes and POST multipart.
 */
export async function handleBddAdd(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const resolved = resolveFile(
        {
            ...(ctx.args.file !== undefined && { fileFlag: ctx.args.file }),
            ...(ctx.args.filename !== undefined && { filenameFlag: ctx.args.filename }),
        },
        { read: !ctx.dryRun },
    );
    if (!resolved.ok) throw new Error(resolved.error);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'bdd add',
            caseId,
            file: resolved.path,
            filename: resolved.filename,
            size: resolved.size,
        });
        return;
    }

    if (resolved.contents === undefined) {
        // resolveFile with read:true guarantees `contents`; defensive only.
        throw new Error('file contents missing after read');
    }
    ctx.out(await ctx.client.addBdd(caseId, resolved.contents, resolved.filename));
}
