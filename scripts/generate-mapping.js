#!/usr/bin/env node
/**
 * Generates docs/API-MAPPING.md — coverage matrix mapping every TestRail API
 * endpoint to its client method, CLI command, and skill recipe.
 *
 * Run: node scripts/generate-mapping.js          (regenerate)
 *      node scripts/generate-mapping.js --check  (verify committed file is up to date)
 *
 * Sources of truth (Phase 2):
 *   - docs/testrail-endpoints.json   ← upstream TestRail endpoint inventory
 *                                      (hand-curated, Zod-validated here)
 *   - src/modules/*.ts               ← `@testrail GET path/{id}` JSDoc tags on
 *                                      each method; AST-extracted to bind
 *                                      endpoint → method name.
 *   - src/cli/metadata.ts            ← `ACTIONS[]` array; each entry carries
 *                                      `apiEndpoint: 'METHOD path'`.
 *
 * Pure helpers (Zod schema, path normalization, tag parsing, cell renderers,
 * document assembler) live in `scripts/mapping-renderer.mjs` so
 * `tests/generate-mapping.test.ts` can exercise them without touching the
 * filesystem.
 *
 * Drift gates (Phase 2):
 *   A — Drift: committed `docs/API-MAPPING.md` must match generator output.
 *       Enforced by `--check` mode, wired into `pretest` and CI.
 *   B — Code↔JSON: every `@testrail` tag in `src/modules/*.ts` must reference
 *       an endpoint that exists in `docs/testrail-endpoints.json`. Catches
 *       typos and renames in either direction.
 *   C — ActionSpec↔JSDoc: every `apiEndpoint` field on an `ACTIONS` entry
 *       must match a `@testrail` tag on some method in `src/modules/*.ts`.
 *       Catches CLI claims about endpoints the client doesn't implement.
 *
 * D (coverage regression) is intentionally NOT enforced — shrinkage is
 * sometimes legitimate (TestRail deprecates endpoints); PR review catches
 * accidental removals.
 *
 * Determinism: no timestamps; tables and per-resource sections sorted by
 * stable keys; running twice produces byte-identical output.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- sibling .mjs helper module, not part of the TS build
import { EndpointsArraySchema, normalizePathForMatch, parseTestrailTag, renderDocument } from './mapping-renderer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CHECK_MODE = process.argv.includes('--check');

const OUTPUT_PATH = join(ROOT, 'docs', 'API-MAPPING.md');
const ENDPOINTS_JSON_PATH = join(ROOT, 'docs', 'testrail-endpoints.json');
const MODULES_DIR = join(ROOT, 'src', 'modules');
const METADATA_PATH = join(ROOT, 'src', 'cli', 'metadata.ts');

// ── AST helpers ──────────────────────────────────────────────────────────────

/**
 * Extract the `@testrail` JSDoc tag content from a method declaration.
 * Returns the raw text after `@testrail ` (e.g., `'GET get_case/{case_id}'`),
 * or null if no such tag exists.
 */
function getTestrailTagText(method) {
    const tags = ts.getJSDocTags(method);
    for (const tag of tags) {
        if (tag.tagName && tag.tagName.text === 'testrail') {
            const c = tag.comment;
            if (typeof c === 'string') return c;
            if (Array.isArray(c)) return c.map((n) => (typeof n === 'string' ? n : (n.text ?? ''))).join('');
        }
    }
    return null;
}

/**
 * Walk a module file: for each method declaration on the exported class, read
 * its `@testrail` JSDoc tag. Returns the binding from endpoint → method.
 *
 * @returns {Array<{ moduleFile, methodName, method, path, line }>}
 */
function crawlModuleFile(filePath) {
    const source = readFileSync(filePath, 'utf8');
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
    const out = [];

    function visitMethod(member) {
        if (!member.name || !ts.isIdentifier(member.name)) return;
        const methodName = member.name.text;
        const tagText = getTestrailTagText(member);
        if (!tagText) return;
        const parsed = parseTestrailTag(tagText);
        if (!parsed) {
            console.error(
                `[generate-mapping] ${filePath}: unparseable @testrail tag on \`${methodName}\` — expected "METHOD path", got "${tagText.trim()}"`,
            );
            process.exit(1);
        }
        const { line } = sf.getLineAndCharacterOfPosition(member.getStart(sf));
        out.push({
            moduleFile: filePath,
            methodName,
            method: parsed.method,
            path: parsed.path,
            line: line + 1,
        });
    }

    function visit(node) {
        if (ts.isClassDeclaration(node)) {
            for (const member of node.members) {
                if (ts.isMethodDeclaration(member)) visitMethod(member);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return out;
}

/**
 * Parse `src/cli/metadata.ts` ACTIONS array. Returns one entry per CLI action
 * with `resource`, `action`, `apiEndpoint`.
 */
function loadCliActions() {
    const source = readFileSync(METADATA_PATH, 'utf8');
    const sf = ts.createSourceFile(METADATA_PATH, source, ts.ScriptTarget.Latest, true);
    const actions = [];

    function literalValue(node) {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        return undefined;
    }

    function visit(node) {
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === 'ACTIONS' &&
            node.initializer
        ) {
            let arr = node.initializer;
            while (ts.isAsExpression(arr)) arr = arr.expression;
            if (!ts.isArrayLiteralExpression(arr)) return;
            for (const el of arr.elements) {
                if (!ts.isObjectLiteralExpression(el)) continue;
                const entry = {};
                for (const prop of el.properties) {
                    if (!ts.isPropertyAssignment(prop)) continue;
                    if (!ts.isIdentifier(prop.name)) continue;
                    const v = literalValue(prop.initializer);
                    if (v !== undefined) entry[prop.name.text] = v;
                }
                if (entry.resource && entry.action && entry.apiEndpoint) {
                    actions.push({
                        resource: entry.resource,
                        action: entry.action,
                        apiEndpoint: entry.apiEndpoint,
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return actions;
}

// ── Cross-validation gates ───────────────────────────────────────────────────

/**
 * Gate B: every `@testrail` tag must reference an endpoint in the JSON.
 * Gate C: every `ActionSpec.apiEndpoint` must reference an endpoint that has
 *         a `@testrail` tag (i.e., the client actually implements it).
 *
 * Both gates produce error lists; the generator exits non-zero if either is
 * non-empty.
 */
function validateGates(callSites, actions, endpoints) {
    const jsonKeys = new Set(endpoints.map((e) => `${e.method} ${normalizePathForMatch(e.path)}`));
    const tagKeys = new Set(callSites.map((c) => `${c.method} ${normalizePathForMatch(c.path)}`));

    const errors = [];

    // Gate B
    for (const cs of callSites) {
        const key = `${cs.method} ${normalizePathForMatch(cs.path)}`;
        if (!jsonKeys.has(key)) {
            const rel = cs.moduleFile.replace(ROOT + '/', '');
            errors.push(
                `[gate B] ${rel}:${cs.line} — \`${cs.methodName}\` has @testrail "${cs.method} ${cs.path}" but this endpoint is not in docs/testrail-endpoints.json`,
            );
        }
    }

    // Gate C
    for (const a of actions) {
        const parsed = parseTestrailTag(a.apiEndpoint);
        if (!parsed) {
            errors.push(
                `[gate C] ACTIONS entry \`${a.resource}:${a.action}\` has malformed apiEndpoint: "${a.apiEndpoint}"`,
            );
            continue;
        }
        const key = `${parsed.method} ${normalizePathForMatch(parsed.path)}`;
        if (!tagKeys.has(key)) {
            errors.push(
                `[gate C] ACTIONS entry \`${a.resource}:${a.action}\` claims apiEndpoint "${a.apiEndpoint}" but no method in src/modules/*.ts has a matching @testrail tag`,
            );
        }
    }

    return errors;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    // 1. Load + validate endpoints JSON
    const rawJson = JSON.parse(readFileSync(ENDPOINTS_JSON_PATH, 'utf8'));
    const parsed = EndpointsArraySchema.safeParse(rawJson);
    if (!parsed.success) {
        console.error('docs/testrail-endpoints.json failed validation:');
        for (const issue of parsed.error.issues) {
            console.error(`  · [${issue.path.join('.')}] ${issue.message}`);
        }
        process.exit(1);
    }
    const endpoints = parsed.data;

    // 2. Crawl modules (JSDoc-based)
    const moduleFiles = readdirSync(MODULES_DIR)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => join(MODULES_DIR, f))
        .sort();
    const callSites = [];
    for (const file of moduleFiles) {
        callSites.push(...crawlModuleFile(file));
    }

    // 3. Load CLI actions
    const actions = loadCliActions();

    // 4. Run drift gates
    const errors = validateGates(callSites, actions, endpoints);
    if (errors.length > 0) {
        console.error('docs/API-MAPPING.md generator failed cross-validation:');
        for (const e of errors) console.error(`  · ${e}`);
        process.exit(1);
    }

    // 5. Index for joins
    const callSiteIndex = new Map();
    for (const cs of callSites) {
        const key = `${cs.method} ${normalizePathForMatch(cs.path)}`;
        if (!callSiteIndex.has(key)) callSiteIndex.set(key, cs);
    }
    const actionByEndpoint = new Map();
    for (const a of actions) {
        const parsedEp = parseTestrailTag(a.apiEndpoint);
        if (!parsedEp) continue;
        const key = `${parsedEp.method} ${normalizePathForMatch(parsedEp.path)}`;
        if (!actionByEndpoint.has(key)) actionByEndpoint.set(key, `${a.resource}:${a.action}`);
    }

    // 6. Build rows
    const rows = endpoints.map((endpoint) => {
        const key = `${endpoint.method} ${normalizePathForMatch(endpoint.path)}`;
        const match = callSiteIndex.get(key) ?? null;
        const cliKey = actionByEndpoint.get(key) ?? null;
        return { endpoint, match, cliKey };
    });

    // 7. Group + sort
    const byResource = new Map();
    for (const row of rows) {
        const r = row.endpoint.resource;
        if (!byResource.has(r)) byResource.set(r, []);
        byResource.get(r).push(row);
    }
    const grouped = Array.from(byResource.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([resource, rs]) => ({
            resource,
            rows: rs.sort((a, b) => {
                if (a.endpoint.method !== b.endpoint.method) {
                    return a.endpoint.method === 'GET' ? -1 : 1;
                }
                return a.endpoint.operation.localeCompare(b.endpoint.operation);
            }),
        }));

    // 8. Render + write/check
    const out = renderDocument(grouped, ROOT + '/');
    if (CHECK_MODE) {
        const committed = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, 'utf8') : '';
        if (committed !== out) {
            console.error('docs/API-MAPPING.md is out of date. Run `npm run mapping` and commit the result.');
            process.exit(1);
        }
        console.log('docs/API-MAPPING.md is up to date.');
        return;
    }
    writeFileSync(OUTPUT_PATH, out);
    console.log(
        `Wrote docs/API-MAPPING.md (${grouped.length} resources, ${rows.length} endpoints, ${rows.filter((r) => r.match).length} client-bound, ${rows.filter((r) => r.cliKey).length} CLI-bound).`,
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
