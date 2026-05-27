import { readFileSync, openSync, fstatSync, closeSync, constants } from 'node:fs';
import type { z } from 'zod';
import type { BodyInput } from './handler-context.js';
import { MAX_DATA_FILE_BYTES } from '../constants.js';

/**
 * Source of a parsed body. Reported alongside the resolution result so
 * handlers (or callers writing recipes) can log which input mechanism the
 * agent actually used. `'default'` is reserved for handlers that
 * synthesize an empty body when all three input mechanisms are absent
 * and the underlying schema accepts `{}` (e.g. `handleDatasetUpdate` —
 * partial update where every field is optional). `resolveBody` itself
 * never emits `'default'`; only handlers that opt into the no-body
 * fallback do.
 */
export type BodySource = 'data' | 'file' | 'stdin' | 'default';

export type BodyResolution<T> = { ok: true; payload: T; source: BodySource } | { ok: false; error: string };

/**
 * Resolve a write-action body from one of three mutually-exclusive sources:
 *
 * - `--data <json-string>` (provided via `BodyInput.dataFlag`)
 * - `--data-file <path>` (provided via `BodyInput.dataFileFlag`; read via
 *   readFileSync so failures surface as a structured `ok: false` rather than
 *   crashing the CLI)
 * - stdin (provided via `BodyInput.readStdin` thunk; the caller is
 *   responsible for non-TTY detection — only set the thunk when stdin is
 *   piped. The resolver invokes the thunk *only* when stdin is the
 *   selected source, so read actions and no-body writes never drain it.)
 *
 * After source resolution: JSON-parse the raw string, then validate against
 * the supplied Zod schema. No coercion is applied (Q8 lock from
 * SKILL-PLAN.md) — wrong types are rejected immediately so agent payload
 * bugs surface at the CLI boundary rather than the API call site.
 *
 * Typed via `S extends z.ZodTypeAny` so the inferred payload type carries
 * through to the caller — `resolveBody(input, AddCasePayloadSchema)` returns
 * `BodyResolution<AddCasePayload>`, not `BodyResolution<unknown>`.
 *
 * @param input  raw inputs from the CLI argv + stdin reader
 * @param schema Zod schema for the expected payload shape
 */
export function resolveBody<S extends z.ZodTypeAny>(input: BodyInput, schema: S): BodyResolution<z.infer<S>> {
    const sources = [
        input.dataFlag !== undefined ? 'data' : null,
        input.dataFileFlag !== undefined ? 'file' : null,
        input.readStdin !== undefined ? 'stdin' : null,
    ].filter((s): s is BodySource => s !== null);

    if (sources.length === 0) {
        return {
            ok: false,
            error: 'Body required. Pass a JSON payload via --data <json>, --data-file <path>, or stdin pipe.',
        };
    }
    if (sources.length > 1) {
        return {
            ok: false,
            error: `Multiple body sources provided (${sources.join(', ')}). Use exactly one of --data, --data-file, or stdin.`,
        };
    }

    let raw: string;
    let source: BodySource;
    if (input.dataFlag !== undefined) {
        raw = input.dataFlag;
        source = 'data';
    } else if (input.dataFileFlag !== undefined) {
        let fd: number | undefined;
        try {
            fd = openSync(input.dataFileFlag, constants.O_RDONLY | constants.O_NOFOLLOW);
            const stat = fstatSync(fd);
            if (!stat.isFile()) {
                return { ok: false, error: `--data-file '${input.dataFileFlag}' is not a regular file.` };
            }
            if (stat.size > MAX_DATA_FILE_BYTES) {
                return {
                    ok: false,
                    error: `--data-file '${input.dataFileFlag}' exceeds maximum size of ${MAX_DATA_FILE_BYTES} bytes.`,
                };
            }
            raw = readFileSync(fd, 'utf-8');
        } catch (e) {
            return {
                ok: false,
                error: `Cannot read --data-file '${input.dataFileFlag}': ${e instanceof Error ? e.message : String(e)}`,
            };
        } finally {
            if (fd !== undefined) {
                try {
                    closeSync(fd);
                } catch {
                    /* best-effort */
                }
            }
        }
        source = 'file';
    } else {
        // stdin is the only remaining source. Invoke the thunk now (and only
        // now) so the underlying readFileSync(0) call happens lazily.
        try {
            raw = (input.readStdin as () => string)();
        } catch (e) {
            return {
                ok: false,
                error: `Cannot read stdin: ${e instanceof Error ? e.message : String(e)}`,
            };
        }
        source = 'stdin';
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
        return { ok: false, error: `Payload validation failed: ${result.error.message}` };
    }

    return { ok: true, payload: result.data, source };
}
