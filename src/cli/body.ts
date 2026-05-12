import { readFileSync } from 'node:fs';
import type { z } from 'zod';
import type { BodyInput } from './handler-context.js';

/**
 * Source of a parsed body. Reported alongside the resolution result so
 * handlers (or callers writing recipes) can log which input mechanism the
 * agent actually used.
 */
export type BodySource = 'data' | 'file' | 'stdin';

export type BodyResolution<T> = { ok: true; payload: T; source: BodySource } | { ok: false; error: string };

/**
 * Resolve a write-action body from one of three mutually-exclusive sources:
 *
 * - `--data <json-string>` (provided via `BodyInput.dataFlag`)
 * - `--data-file <path>` (provided via `BodyInput.dataFileFlag`; read via
 *   readFileSync so failures surface as a structured `ok: false` rather than
 *   crashing the CLI)
 * - stdin (provided via `BodyInput.stdin`; the caller is responsible for
 *   reading and detecting non-TTY availability before populating this field)
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
        input.stdin !== undefined ? 'stdin' : null,
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
        try {
            raw = readFileSync(input.dataFileFlag, 'utf-8');
        } catch (e) {
            return {
                ok: false,
                error: `Cannot read --data-file '${input.dataFileFlag}': ${e instanceof Error ? e.message : String(e)}`,
            };
        }
        source = 'file';
    } else {
        // stdin is the only remaining source (sources.length === 1, and the other two are undefined).
        raw = input.stdin as string;
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
