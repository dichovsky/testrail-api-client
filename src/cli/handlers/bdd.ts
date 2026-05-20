import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveOut } from '../file-output.js';
import { resolveFile } from '../file-input.js';
import { safeWriteText } from '../safe-write.js';
import { safeJsonStringify } from '../output.js';

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

    const text = await ctx.client.getBdd(caseId);

    if (resolved.target === 'stdout') {
        process.stdout.write(text);
        const ack = {
            caseId,
            out: '<stdout>',
            size: Buffer.byteLength(text, 'utf-8'),
        };
        if (ctx.errRaw !== undefined) {
            ctx.errRaw(`${safeJsonStringify(ack)}\n`);
        }
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
 * Upload a `.feature` file to a case as its BDD content. Mirrors the
 * `attachment add-to-case` flow exactly: stat the `--file`, emit dry-run
 * preview if requested, otherwise hand the path to the streaming multipart
 * pipeline (bytes are read from disk via `node:fs.openAsBlob` — never loaded
 * into the CLI's heap). Supports `--file -` (stdin) under the same byte cap
 * and wall-clock deadline as attachment uploads (`MAX_STDIN_UPLOAD_BYTES`,
 * `STDIN_READ_TIMEOUT_MS`). Async because `resolveFile` may drain stdin.
 */
export async function handleBddAdd(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const resolved = await resolveFile(
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
            ...(resolved.source === 'stdin' && { source: 'stdin' }),
        });
        return;
    }

    // For stdin: pass drained bytes directly (a pipe cannot be openAsBlob'd).
    // For file: pass the descriptor so the multipart pipeline streams from disk.
    const payload =
        resolved.source === 'stdin' && resolved.contents !== undefined
            ? resolved.contents
            : { path: resolved.path, fd: resolved.fd };
    ctx.out(await ctx.client.addBdd(caseId, payload, resolved.filename));
}
