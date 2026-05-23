import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// SPEC #A.1 lint — codifies the rules in docs/SCHEMA-CONVENTIONS.md as a
// static-analysis test against src/schemas.ts. The cross-domain audit
// (PR #148 wave) found zero conflation violations; this test is the
// regression guard so future schema additions can't drift.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMAS_PATH = resolve(__dirname, '../src/schemas.ts');

/**
 * Strip block comments and line comments from the source so references
 * inside comments (e.g., the `.extend(...)` examples in docs/header
 * comments) are not treated as code. Block-comment stripping runs first
 * so a line comment inside a block comment is also removed.
 */
function stripComments(source: string): string {
    const withoutBlock = source.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutLine = withoutBlock.replace(/\/\/.*$/gm, '');
    return withoutLine;
}

/**
 * Extract every `export const (Add|Update)<X>PayloadSchema = ...` block. A
 * block runs from its `export const` line to (but not including) the next
 * top-of-file `export ` declaration or end of file. Works for both
 * `zObject({...})` definitions (multi-line) and one-liner array forms like
 * `AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1);`.
 */
function extractPayloadBlocks(source: string): { name: string; body: string }[] {
    const blocks: { name: string; body: string }[] = [];
    const exportRegex = /^export\s+(?:const|type|interface|function|class)\s+(\w+)/gm;
    const starts: { name: string; index: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(source)) !== null) {
        const name = match[1];
        if (name === undefined) continue;
        starts.push({ name, index: match.index });
    }
    for (let i = 0; i < starts.length; i++) {
        const current = starts[i];
        if (current === undefined) continue;
        if (!/^(?:Add|Update)\w+PayloadSchema$/.test(current.name)) continue;
        const next = starts[i + 1];
        const end = next !== undefined ? next.index : source.length;
        blocks.push({ name: current.name, body: source.slice(current.index, end) });
    }
    return blocks;
}

/**
 * A schema name is a response-only base schema (per docs/SCHEMA-CONVENTIONS.md
 * §1) when it does NOT start with `Add`/`Update` AND does NOT end with one of
 * the recognised non-base suffixes (sub-schema suffixes from §4, plus the
 * payload/response endpoint suffixes).
 */
function isResponseBaseSchema(name: string): boolean {
    if (/^(?:Add|Update)/.test(name)) return false;
    if (/(?:Embedded|Entry|Config|History|Payload|Response)Schema$/.test(name)) return false;
    return name.endsWith('Schema');
}

/**
 * A schema name is a response-only sub-schema (per docs/SCHEMA-CONVENTIONS.md
 * §4) when its suffix word is exactly `EmbeddedSchema`, `EntrySchema`,
 * `ConfigSchema`, or `HistorySchema`. The full-suffix check correctly
 * excludes payload-side sub-schemas like `PlanEntryRunPayloadSchema`
 * (ends in `PayloadSchema`, not `EntrySchema`).
 */
function isResponseSubSchema(name: string): boolean {
    return /(?:Embedded|Entry|Config|History)Schema$/.test(name);
}

/**
 * Extract every `XxxSchema`-like identifier appearing inside a block body
 * (after the assignment side; we use the whole block for simplicity and
 * exclude the leading `export const NAME =` self-reference).
 */
function referencedSchemas(block: { name: string; body: string }): string[] {
    const refs = new Set<string>();
    const tokenRegex = /\b([A-Z][a-zA-Z0-9]*Schema)\b/g;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(block.body)) !== null) {
        const ref = match[1];
        if (ref === undefined || ref === block.name) continue;
        refs.add(ref);
    }
    return Array.from(refs);
}

describe('SPEC #A.1 — schema conventions lint (docs/SCHEMA-CONVENTIONS.md)', () => {
    const rawSource = readFileSync(SCHEMAS_PATH, 'utf8');
    const source = stripComments(rawSource);
    const blocks = extractPayloadBlocks(source);

    it('src/schemas.ts contains no .extend() calls (SPEC #A.1 §3 — see docs/SCHEMA-CONVENTIONS.md)', () => {
        const matches = source.match(/\.extend\(/g) ?? [];
        expect(
            matches,
            `Expected zero .extend() calls (found ${matches.length}). Per §3, inline payload fields rather than .extend()-ing across directions.`,
        ).toHaveLength(0);
    });

    it('payload schemas do not reference response-only base schemas (SPEC #A.1 §4 — see docs/SCHEMA-CONVENTIONS.md)', () => {
        const violations: { payload: string; references: string[] }[] = [];
        for (const block of blocks) {
            const offenders = referencedSchemas(block).filter(isResponseBaseSchema);
            if (offenders.length > 0) {
                violations.push({ payload: block.name, references: offenders });
            }
        }
        const message = violations
            .map((v) => `  - ${v.payload} references response-only base schema(s): ${v.references.join(', ')}`)
            .join('\n');
        expect(
            violations,
            `Payload schemas must not reuse response-only base schemas. Define a dedicated payload schema instead (see §4). Offenders:\n${message}`,
        ).toHaveLength(0);
    });

    it('payload schemas do not reference response-only sub-schemas (EmbeddedSchema, EntrySchema, ConfigSchema, HistorySchema)', () => {
        const violations: { payload: string; references: string[] }[] = [];
        for (const block of blocks) {
            const offenders = referencedSchemas(block).filter(isResponseSubSchema);
            if (offenders.length > 0) {
                violations.push({ payload: block.name, references: offenders });
            }
        }
        const message = violations
            .map((v) => `  - ${v.payload} references response-only sub-schema(s): ${v.references.join(', ')}`)
            .join('\n');
        expect(
            violations,
            `Payload schemas must not reuse response-only sub-schemas (see §4 — define an Add*PayloadSchema sub-schema instead, e.g., PlanEntryRunPayloadSchema). Offenders:\n${message}`,
        ).toHaveLength(0);
    });

    it('extracts at least one payload block (sanity check — guards against an always-passing regex)', () => {
        expect(blocks.length).toBeGreaterThan(20);
        // The current schema file defines ~30 Add*/Update*PayloadSchema blocks.
        // If this number drops sharply, the block-extraction heuristic broke.
    });
});
