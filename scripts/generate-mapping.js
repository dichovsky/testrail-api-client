#!/usr/bin/env node
/**
 * Generates docs/API-MAPPING.md — coverage matrix mapping every TestRail API
 * endpoint to its client method, CLI command, and skill recipe.
 *
 * Run: node scripts/generate-mapping.js          (regenerate)
 *      node scripts/generate-mapping.js --check  (verify committed file is up to date)
 *
 * Sources of truth (Phase 1):
 *   - docs/testrail-endpoints.json   ← upstream TestRail endpoint inventory
 *                                      (hand-curated, Zod-validated here)
 *   - src/modules/*.ts               ← client method bodies; AST-crawled for
 *                                      `this.client.request*('METHOD', '<path>')`
 *                                      call sites to bind endpoint → method name.
 *   - src/cli/metadata.ts            ← ACTIONS[] array; AST-parsed for the
 *                                      resource:action surface of the CLI.
 *
 * Pure helpers (Zod schema, path normalization, CLI heuristic map, cell
 * renderers, document assembler) live in `scripts/mapping-renderer.mjs` so
 * `tests/generate-mapping.test.ts` can exercise them without touching the
 * filesystem.
 *
 * Phase 1 limitations (resolved in later PRs):
 *   - No JSDoc @testrail tags yet. Endpoint→method binding is inferred from
 *     literal arguments to request*(); methods that build their path via
 *     `buildEndpoint(...)` or other helpers won't be matched and will show '—'
 *     for client-method even though they are implemented. Phase 2 adds
 *     @testrail tags and switches the join source.
 *   - No `apiEndpoint` field on ActionSpec yet, so CLI cell uses a name-based
 *     heuristic mapping `{resource, action}` → TestRail operation name.
 *     Phase 2 adds apiEndpoint and the heuristic goes away.
 *   - Skill recipe cell links only to the SKILL.md command-table anchor for
 *     each CLI action. Phase 3 adds `recipe-for:` HTML comments so that rich
 *     numbered recipes get linked directly when present.
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
import { EndpointsArraySchema, guessCliCommand, normalizePathForMatch, renderDocument } from './mapping-renderer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CHECK_MODE = process.argv.includes('--check');

const OUTPUT_PATH = join(ROOT, 'docs', 'API-MAPPING.md');
const ENDPOINTS_JSON_PATH = join(ROOT, 'docs', 'testrail-endpoints.json');
const MODULES_DIR = join(ROOT, 'src', 'modules');
const METADATA_PATH = join(ROOT, 'src', 'cli', 'metadata.ts');

// ── AST helpers ──────────────────────────────────────────────────────────────

function extractPathLiteral(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        return node.text;
    }
    if (ts.isTemplateExpression(node)) {
        let out = node.head.text;
        for (const span of node.templateSpans) {
            out += '${X}' + span.literal.text;
        }
        return out;
    }
    return null;
}

// Walk a module file: for each method declaration on the exported class, find
// `this.client.request*(...)` calls and pull out method+path from string-literal
// arguments. Bind endpoint → method-name.
function crawlModuleFile(filePath) {
    const source = readFileSync(filePath, 'utf8');
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
    const out = [];

    function recordCall(methodName, call) {
        const callee = call.expression;
        if (!ts.isPropertyAccessExpression(callee)) return;
        const verbId = callee.name;
        if (!ts.isIdentifier(verbId)) return;
        const verb = verbId.text;
        if (!verb.startsWith('request')) return;

        const inner = callee.expression;
        if (!ts.isPropertyAccessExpression(inner)) return;
        if (inner.name.text !== 'client') return;
        if (inner.expression.kind !== ts.SyntaxKind.ThisKeyword) return;

        // Determine HTTP method + which arg is the path:
        //   request<T>(method, endpoint, payload?, ...)
        //   requestParsed<T>(method, endpoint, schema, payload?)
        //   requestText(method, endpoint)
        //   requestBinary(endpoint)     ← GET only by construction
        //   requestMultipart<T>(endpoint, file, filename)  ← POST only
        let httpMethod = null;
        let pathArg = null;
        if (verb === 'requestBinary') {
            httpMethod = 'GET';
            pathArg = call.arguments[0];
        } else if (verb === 'requestMultipart') {
            httpMethod = 'POST';
            pathArg = call.arguments[0];
        } else if (verb === 'request' || verb === 'requestParsed' || verb === 'requestText') {
            const methodArg = call.arguments[0];
            if (methodArg && (ts.isStringLiteral(methodArg) || ts.isNoSubstitutionTemplateLiteral(methodArg))) {
                httpMethod = methodArg.text;
            }
            pathArg = call.arguments[1];
        } else {
            return;
        }

        if (!httpMethod || !pathArg) return;
        const pathRaw = extractPathLiteral(pathArg);
        if (pathRaw === null) return;

        const { line } = sf.getLineAndCharacterOfPosition(call.getStart(sf));
        out.push({
            moduleFile: filePath,
            methodName,
            method: httpMethod,
            pathRaw,
            pathNormalized: normalizePathForMatch(pathRaw),
            line: line + 1,
        });
    }

    function visitMethod(method) {
        if (!method.name || !ts.isIdentifier(method.name)) return;
        const methodName = method.name.text;
        function walk(node) {
            if (ts.isCallExpression(node)) {
                recordCall(methodName, node);
            }
            ts.forEachChild(node, walk);
        }
        if (method.body) walk(method.body);
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

// Parse src/cli/metadata.ts to extract `{ resource, action }` for every entry
// in the `ACTIONS` array literal. Pure AST walk; no runtime import.
function loadCliActions() {
    const source = readFileSync(METADATA_PATH, 'utf8');
    const sf = ts.createSourceFile(METADATA_PATH, source, ts.ScriptTarget.Latest, true);
    const actions = [];

    function literalValue(node) {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            return node.text;
        }
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
                if (entry.resource && entry.action) {
                    actions.push({ resource: entry.resource, action: entry.action });
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return actions;
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

    // 2. Crawl modules
    const moduleFiles = readdirSync(MODULES_DIR)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => join(MODULES_DIR, f))
        .sort();
    const callSites = [];
    for (const file of moduleFiles) {
        callSites.push(...crawlModuleFile(file));
    }

    const callSiteIndex = new Map();
    for (const cs of callSites) {
        const key = `${cs.method} ${cs.pathNormalized}`;
        if (!callSiteIndex.has(key)) callSiteIndex.set(key, cs);
    }

    // 3. Load CLI actions
    const actions = loadCliActions();
    const actionsSet = new Set(actions.map((a) => `${a.resource}:${a.action}`));

    // 4. Build rows
    const rows = endpoints.map((endpoint) => {
        const normalized = normalizePathForMatch(endpoint.path);
        const key = `${endpoint.method} ${normalized}`;
        const match = callSiteIndex.get(key) ?? null;
        const cliKey = guessCliCommand(endpoint.operation, actionsSet);
        return { endpoint, match, cliKey };
    });

    // 5. Group + sort
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

    // 6. Render + write/check
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
