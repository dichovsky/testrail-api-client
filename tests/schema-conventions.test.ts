import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// SPEC #A.1 lint — codifies the rules in CLAUDE.md (Schema authoring conventions) as a
// static-analysis test against src/schemas/*.ts. The cross-domain audit
// (PR #148 wave) found zero conflation violations; this test is the
// regression guard so future schema additions can't drift.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMAS_DIR = resolve(__dirname, '../src/schemas');

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
 * Extract every `<X>Schema` declaration block, exported or not.
 *
 * Block boundaries come from indexing *all* top-level declarations
 * (`const|type|interface|function|class`) — a schema's body runs until whatever
 * is declared next, whichever kind that is — and the result is then filtered to
 * names ending in `Schema`. Unlike {@link extractPayloadBlocks} this also picks
 * up module-private schemas such as `FieldConfigOptionsSchema` and
 * `FieldConfigContextSchema`, which are declared without `export` yet are still
 * response schemas embedded in the exported ones.
 */
function extractAllSchemaBlocks(source: string): { name: string; body: string }[] {
    const declRegex = /^(?:export\s+)?(?:const|type|interface|function|class)\s+(\w+)/gm;
    const starts: { name: string; index: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = declRegex.exec(source)) !== null) {
        const name = match[1];
        if (name === undefined) continue;
        starts.push({ name, index: match.index });
    }
    const blocks: { name: string; body: string }[] = [];
    for (let i = 0; i < starts.length; i++) {
        const current = starts[i];
        if (current === undefined) continue;
        if (!current.name.endsWith('Schema')) continue;
        const next = starts[i + 1];
        const end = next !== undefined ? next.index : source.length;
        blocks.push({ name: current.name, body: source.slice(current.index, end) });
    }
    return blocks;
}

/**
 * Schemas that live in `src/schemas/` but describe caller-supplied *input*
 * rather than a TestRail response. Both are legitimately strict: they guard a
 * trust boundary, so `.optional()` and format validators are correct on them.
 */
const NON_RESPONSE_SCHEMAS = new Set(['TestRailConfigSchema', 'PaginationSchema']);

/** Every schema that models a TestRail **response** body. */
function isResponseSchema(name: string): boolean {
    if (NON_RESPONSE_SCHEMAS.has(name)) return false;
    // `Add*ResponseSchema` models a POST response (§5) — a response despite the
    // `Add` prefix that `isResponseBaseSchema` uses to exclude payloads.
    if (name.endsWith('ResponseSchema')) return true;
    return isResponseBaseSchema(name) || isResponseSubSchema(name);
}

/**
 * A schema name is a response-only base schema (per CLAUDE.md (Schema authoring conventions)
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
 * A schema name is a response-only sub-schema (per CLAUDE.md (Schema authoring conventions)
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

describe('SPEC #A.1 — schema conventions lint (CLAUDE.md (Schema authoring conventions))', () => {
    // PR-B (file-split refactor) moved every Zod schema out of the
    // monolithic `src/schemas.ts` into `src/schemas/<domain>.ts` modules.
    // The lint operates on the concatenated source of those per-domain
    // files so the same regex/heuristics keep working — payload blocks
    // are still all `export const`s, references between schemas still
    // resolve to the same `XxxSchema` identifiers (imports are explicit
    // and visible to the regex extractor).
    const sources = readdirSync(SCHEMAS_DIR)
        .filter((f) => f.endsWith('.ts'))
        .sort()
        .map((f) => readFileSync(join(SCHEMAS_DIR, f), 'utf8'))
        .join('\n');
    const source = stripComments(sources);
    const blocks = extractPayloadBlocks(source);

    it('src/schemas/*.ts contain no .extend() calls (SPEC #A.1 §3 — see CLAUDE.md (Schema authoring conventions))', () => {
        const matches = source.match(/\.extend\(/g) ?? [];
        expect(
            matches,
            `Expected zero .extend() calls (found ${matches.length}). Per §3, inline payload fields rather than .extend()-ing across directions.`,
        ).toHaveLength(0);
    });

    it('payload schemas do not reference response-only base schemas (SPEC #A.1 §4 — see CLAUDE.md (Schema authoring conventions))', () => {
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

    // ── Response-strictness rules (6.0.0) ────────────────────────────────────
    //
    // Deliberately narrow. A "no bare required scalar on a response schema"
    // rule was evaluated and rejected: most matches were primary keys, foreign
    // keys, or `name` — fields present by construction — so the rule produced
    // mostly false positives while still missing wrapper-shape and wire-type
    // drift. These two rules instead encode only what is categorically true and
    // therefore never need an allowlist.

    const responseBlocks = extractAllSchemaBlocks(source).filter((b) => isResponseSchema(b.name));

    // Both forbidden constructs, defined once so the src/schemas and src/modules
    // scans below cannot drift apart. Zod exposes each modifier two ways —
    // `z.string().optional()` and `z.optional(z.string())` — and matching only
    // the method form leaves the wrapper form as a silent bypass carrying
    // exactly the forbidden `T | undefined` semantics.
    const OPTIONAL_SYNTAX = /\.optional\(\)|z\.optional\(/;
    const FORMAT_VALIDATOR = /\.(?:email|url|uuid|regex|startsWith|endsWith|length|min|max)\(/;

    it('response schemas use .nullish(), never .optional() (SPEC #A.1 §2)', () => {
        // `.optional()` is `T | undefined` and rejects an explicit `null`. A
        // TestRail response that nulls the field therefore fails to parse.
        // `.nullish()` accepts null, undefined, and an omitted key.
        const violations = responseBlocks
            .filter((b) => OPTIONAL_SYNTAX.test(b.body))
            .map((b) => `  - ${b.name} uses .optional() on a response field`);
        expect(
            violations,
            `Response schemas must use .nullish() (T | null | undefined), not .optional() (T | undefined) — ` +
                `.optional() rejects an explicit null, which TestRail does send. Offenders:\n${violations.join('\n')}`,
        ).toHaveLength(0);
    });

    it('response schemas carry no format validators (regression guard for #236)', () => {
        // A response parser deserializes whatever the server sends; format
        // enforcement belongs on caller-supplied input. #236: a
        // `z.string().email()` on UserSchema rejected `admin@localhost` and
        // similar RFC-5321-valid addresses, failing entire getUsers() pages.
        // Format validators remain correct on payload and config schemas.
        const violations = responseBlocks
            .filter((b) => FORMAT_VALIDATOR.test(b.body))
            .map((b) => `  - ${b.name} constrains the format/length of a response field`);
        expect(
            violations,
            `Response schemas must accept whatever TestRail sends; format and length validators belong on ` +
                `payload/config schemas only (see #236). Offenders:\n${violations.join('\n')}`,
        ).toHaveLength(0);
    });

    it('classifies a meaningful number of response schemas (guards an always-passing filter)', () => {
        expect(responseBlocks.length).toBeGreaterThan(30);
    });

    it('response schemas declared inline in src/modules/*.ts obey the same two rules', () => {
        // The block classifier above is name-based and only reads src/schemas/.
        // Modules also build response schemas inline in `schema:` expressions
        // (wrapper unions, one-off shapes), and those were invisible to it.
        // All request-side Zod lives in src/schemas/, so every `z.` in a module
        // is response-side and a flat scan needs no allowlist.
        const MODULES_DIR = resolve(__dirname, '../src/modules');
        const violations: string[] = [];
        for (const file of readdirSync(MODULES_DIR).filter((f) => f.endsWith('.ts'))) {
            const body = stripComments(readFileSync(join(MODULES_DIR, file), 'utf8'));
            if (OPTIONAL_SYNTAX.test(body)) violations.push(`  - src/modules/${file} uses .optional() on a response`);
            // Uses the same FORMAT_VALIDATOR as the src/schemas scan. The
            // previous `z\.[\w.]*\.(…)\(` form could never match: `[\w.]*`
            // cannot cross the `()` in `z.string().email()`, so the rule was
            // dead and the #236 regression it cites would have passed silently.
            // The one transport-level exception is the TestRail pagination
            // protocol's hard page-size ceiling. It is not an entity-field
            // format guess: Page decoding enforces the same published bound,
            // and the response schema must reject it before cache insertion so
            // an impossible envelope cannot poison strict Page reads.
            const withoutPaginationProtocolBound = body.replace(/\.max\(MAX_PAGINATION_LIMIT\)/g, '');
            if (FORMAT_VALIDATOR.test(withoutPaginationProtocolBound)) {
                violations.push(`  - src/modules/${file} constrains a response field's format`);
            }
        }
        expect(
            violations,
            `Inline response schemas in src/modules must follow the same rules as src/schemas ` +
                `(.nullish() not .optional(); no format validators). Offenders:\n${violations.join('\n')}`,
        ).toHaveLength(0);
    });
});
