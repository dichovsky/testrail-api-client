import type { z } from 'zod';
import type { Handler, HandlerContext } from './handler-context.js';
import type { TestRailClient } from '../client.js';
import { parseId, parseEntryId } from './ids.js';
import { resolveBody } from './body.js';

/**
 * Declarative factories that collapse the ~60 near-identical CLI write
 * handlers into two builders. Each handler used to repeat the same skeleton —
 * parse path params, resolve+validate the JSON body, branch on `--dry-run`,
 * call the client, emit the result. That skeleton now lives here once; each
 * handler is a small spec.
 *
 * Two shapes are covered:
 *   - `createWriteHandler`       — non-destructive body writes (add/update/
 *                                  move/copy/bulk). Emits the API result (or a
 *                                  `formatOutput` envelope for void endpoints).
 *   - `createDestructiveHandler` — delete/close actions. Handles the `--yes`
 *                                  gate, the `--soft` reject/ignore/optional
 *                                  modes, and the `{deleted:true}` vs returned-
 *                                  entity output split.
 *
 * Genuinely irregular handlers stay hand-written: `case delete-bulk` (body +
 * `--project-id` + soft), attachment uploads (`setupUpload` streaming), and
 * `group add` (rejects positional args). They don't fit a shared skeleton
 * without bending the factory out of shape.
 */

/** snake_case path-param name → camelCase preview/output key. */
function camelCase(snake: string): string {
    return snake
        .split('_')
        .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('');
}

/**
 * Numeric path params passed to a handler's `call`, typed as a fixed pair so
 * destructuring (`[projectId]`, `[runId, caseId]`) yields `number` rather than
 * `number | undefined` under `noUncheckedIndexedAccess`. The widest numeric
 * arity in the CLI surface is two (`result add <run_id> <case_id>`); handlers
 * with fewer params simply don't read the unused slot, and no-path handlers
 * ignore the tuple entirely.
 */
export type NumIds = readonly [number, number];

interface ParsedPath {
    /** Numeric path params, in declared order. */
    nums: number[];
    /** The trailing UUID entry param, or '' when the handler has none. */
    entry: string;
    /** Preview/output id keys (camelCased param names → parsed value), in
     *  declared order: numeric params first, then the optional entry param. */
    idBag: Record<string, number | string>;
}

function parsePathArgs(ctx: HandlerContext, pathParams: readonly string[], entryParam: string | undefined): ParsedPath {
    const nums: number[] = [];
    const idBag: Record<string, number | string> = {};
    pathParams.forEach((name, i) => {
        const value = parseId(ctx.args.pathParams[i], name);
        nums.push(value);
        idBag[camelCase(name)] = value;
    });
    let entry = '';
    if (entryParam !== undefined) {
        entry = parseEntryId(ctx.args.pathParams[pathParams.length], entryParam);
        idBag[camelCase(entryParam)] = entry;
    }
    return { nums, entry, idBag };
}

export interface WriteHandlerSpec<S extends z.ZodTypeAny> {
    /** Action label for the dry-run preview, e.g. 'project update'. */
    action: string;
    /** Numeric path params parsed via `parseId`, in argv order. Default: none. */
    pathParams?: readonly string[];
    /** Optional trailing UUID path param parsed via `parseEntryId` (only the
     *  plan-entry write actions use this). */
    entryParam?: string;
    /** Zod schema the body is validated against. */
    bodySchema: S;
    /** When true, an absent body resolves to `{}` with source `'default'`
     *  instead of erroring — PATCH-style updates where every field is optional
     *  (e.g. `dataset update`). */
    allowEmptyBody?: boolean;
    /** Invokes the client method. Receives parsed numeric ids, the validated
     *  body, and the UUID entry (`''` when `entryParam` is unset). */
    call: (client: TestRailClient, nums: NumIds, body: z.infer<S>, entry: string) => Promise<unknown>;
    /** Extra keys merged into the dry-run preview after the ids and before
     *  `payload`/`source` (e.g. `{ count }` for bulk creates). */
    previewExtras?: (body: z.infer<S>) => Record<string, unknown>;
    /** Shapes the success output. Defaults to the raw `call` result; override
     *  for void endpoints that emit a synthetic ack (e.g. `{ moved: true }`). */
    formatOutput?: (nums: NumIds, result: unknown, entry: string) => unknown;
}

export function createWriteHandler<S extends z.ZodTypeAny>(spec: WriteHandlerSpec<S>): Handler {
    const pathParams = spec.pathParams ?? [];
    return async (ctx: HandlerContext): Promise<void> => {
        const { nums, entry, idBag } = parsePathArgs(ctx, pathParams, spec.entryParam);

        const noBody =
            ctx.bodyInput.dataFlag === undefined &&
            ctx.bodyInput.dataFileFlag === undefined &&
            ctx.bodyInput.readStdin === undefined;
        const body =
            spec.allowEmptyBody === true && noBody
                ? { ok: true as const, payload: {} as z.infer<S>, source: 'default' as const }
                : resolveBody(ctx.bodyInput, spec.bodySchema);
        if (!body.ok) throw new Error(body.error);

        if (ctx.dryRun) {
            ctx.out({
                dryRun: true,
                action: spec.action,
                ...idBag,
                ...(spec.previewExtras ? spec.previewExtras(body.payload) : {}),
                payload: body.payload,
                source: body.source,
            });
            return;
        }

        const ids = nums as unknown as NumIds;
        const result = await spec.call(ctx.client, ids, body.payload, entry);
        ctx.out(spec.formatOutput ? spec.formatOutput(ids, result, entry) : result);
    };
}

export interface DestructiveHandlerSpec {
    /** Action label for the dry-run preview, e.g. 'project delete'. */
    action: string;
    /** Numeric path params parsed via `parseId`, in argv order. Default: none. */
    pathParams?: readonly string[];
    /** Optional trailing UUID path param (only `plan delete-entry` uses this). */
    entryParam?: string;
    /**
     * How the action treats `--soft`:
     *   - `'reject'` (default) — throw if `--soft` is passed (TestRail endpoint
     *     has no `soft=1` support).
     *   - `'ignore'` — don't inspect `--soft` (e.g. `run close`).
     *   - `'optional'` — `--soft` triggers TestRail's server-side preview
     *     (`soft=1`); output reports the preview instead of deleting.
     */
    softMode?: 'reject' | 'ignore' | 'optional';
    /**
     * `'delete'` (default) emits `{ ...ids, deleted }` (plus `soft`/`preview`
     * for soft-optional actions). `'close'` emits the entity the API returns.
     */
    kind?: 'delete' | 'close';
    /** Invokes the client method. `soft` is `true` only on the soft-preview
     *  branch of a soft-optional delete. */
    call: (client: TestRailClient, nums: NumIds, entry: string, soft: boolean) => Promise<unknown>;
}

export function createDestructiveHandler(spec: DestructiveHandlerSpec): Handler {
    const pathParams = spec.pathParams ?? [];
    const softMode = spec.softMode ?? 'reject';
    const kind = spec.kind ?? 'delete';
    return async (ctx: HandlerContext): Promise<void> => {
        const { nums, entry, idBag } = parsePathArgs(ctx, pathParams, spec.entryParam);
        const ids = nums as unknown as NumIds;
        const soft = softMode === 'optional' && ctx.args.soft === true;

        if (ctx.dryRun) {
            ctx.out({
                dryRun: true,
                action: spec.action,
                ...idBag,
                ...(softMode === 'optional' ? { soft } : {}),
                destructive: true,
            });
            return;
        }

        if (softMode === 'reject' && ctx.args.soft === true) {
            throw new Error(`${spec.action} does not support --soft.`);
        }

        if (!ctx.confirmDestructive) {
            throw new Error('Destructive action; pass --yes to confirm.');
        }

        if (kind === 'close') {
            ctx.out(await spec.call(ctx.client, ids, entry, false));
            return;
        }

        if (softMode === 'optional') {
            if (soft) {
                const preview = await spec.call(ctx.client, ids, entry, true);
                ctx.out({ ...idBag, soft: true, deleted: false, preview });
                return;
            }
            await spec.call(ctx.client, ids, entry, false);
            ctx.out({ ...idBag, soft: false, deleted: true });
            return;
        }

        await spec.call(ctx.client, ids, entry, false);
        ctx.out({ ...idBag, deleted: true });
    };
}
