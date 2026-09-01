/**
 * Pure helpers for scripts/generate-mapping.ts. Extracted as a sibling module
 * so they can be exercised by tests/generate-mapping.test.ts without invoking
 * the whole AST-crawl + filesystem pipeline.
 *
 * Nothing here reads files or has side effects. Side-effectful orchestration
 * (loading JSON, walking modules, writing output) stays in generate-mapping.ts.
 *
 * Phase 2 changes: the Phase-1 `CLI_OPERATION_MAP` / `guessCliCommand` heuristic
 * is gone. Each `ActionSpec` now carries an explicit `apiEndpoint` field, so
 * the generator looks up the CLI cell directly. The generator also cross-
 * validates `@testrail` JSDoc tags against the JSON inventory (gate B) and
 * `ActionSpec.apiEndpoint` against the tags (gate C).
 */

import { z } from 'zod';

export const PaginationMetadataSchema = z.object({
    response: z.enum(['envelope', 'nested-envelope']),
    requestControls: z.boolean(),
    collectionKey: z.string().regex(/^[a-z][a-z0-9_]*$/, 'collectionKey must be snake_case'),
});

export type PaginationMetadata = z.infer<typeof PaginationMetadataSchema>;

// ── Zod schema for testrail-endpoints.json ────────────────────────────────────

export const EndpointSchema = z.object({
    resource: z.string().min(1),
    operation: z.string().regex(/^[a-z][a-z0-9_]*$/, 'operation must be snake_case'),
    method: z.enum(['GET', 'POST']),
    path: z
        .string()
        .regex(/^[a-z][a-z0-9_]*(\/\{[a-z][a-z0-9_]*\})*$/, 'path must look like operation/{snake_case_param}/{...}'),
    summary: z.string().min(1),
    docUrl: z.string().url().optional(),
    pagination: PaginationMetadataSchema.optional(),
});

export type Endpoint = z.infer<typeof EndpointSchema>;

export const EndpointsArraySchema = z.array(EndpointSchema).superRefine((arr, ctx) => {
    const seen = new Map<string, number>();
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item === undefined) continue;
        const key = `${item.method} ${item.path}`;
        const prev = seen.get(key);
        if (prev !== undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Duplicate endpoint "${key}" at index ${i} (first seen at index ${prev})`,
                path: [i],
            });
        } else {
            seen.set(key, i);
        }
    }
});

// ── Path normalization ───────────────────────────────────────────────────────

/**
 * Normalize a path so JSON entries and `@testrail` JSDoc tags can be compared.
 * Strips TestRail's `&key=val` query suffix (which appears in some endpoints).
 * Both sides use `{snake_case}` placeholders already, so no further work is
 * needed there.
 */
export function normalizePathForMatch(raw: string): string {
    const amp = raw.indexOf('&');
    return amp === -1 ? raw : raw.slice(0, amp);
}

/**
 * Parse a `@testrail` JSDoc tag value into `{ method, path }`. Accepts forms
 * like `GET get_case/{case_id}` or `POST add_project`. Returns `null` for
 * unparseable input so callers can decide how to report the error.
 */
export function parseTestrailTag(text: string): { method: string; path: string } | null {
    const trimmed = text.trim();
    const match = trimmed.match(/^(GET|POST)\s+(\S+)$/);
    if (match === null) return null;
    return { method: match[1] as string, path: match[2] as string };
}

// ── Skill recipe parsing (Phase 3) ────────────────────────────────────────────

/**
 * GitHub-flavored heading anchor: lowercase, strip everything that isn't
 * alphanumeric / space / hyphen, then replace spaces with hyphens. Matches
 * GitHub's behavior for `### 1. Smoke-test auth & connectivity` → `#1-smoke-test-auth--connectivity`.
 */
export function slugifyHeading(heading: string): string {
    return heading
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s/g, '-');
}

export interface SkillRecipe {
    number: number;
    title: string;
    anchor: string;
}

/**
 * Walk a SKILL.md body looking for `### N. Title` recipe headings followed by
 * `<!-- recipe-for: resource:action[, ...] -->` HTML comments. Returns a map
 * keyed by `resource:action` → `{ number, title, anchor }`. When a recipe
 * tag lists multiple actions, every listed action maps to the same recipe.
 *
 * Skips the GENERATED sections (anything between `<!-- GENERATED:` markers)
 * so generator-rendered tables can't poison the parse.
 */
export function parseSkillRecipes(skillSource: string): Map<string, SkillRecipe> {
    const recipes = new Map<string, SkillRecipe>();
    const lines = skillSource.split('\n');
    let inGenerated = false;
    let currentRecipe: SkillRecipe | null = null;
    for (const raw of lines) {
        if (raw.startsWith('<!-- GENERATED:')) {
            inGenerated = true;
            continue;
        }
        if (raw.startsWith('<!-- /GENERATED:')) {
            inGenerated = false;
            continue;
        }
        if (inGenerated) continue;

        const headingMatch = raw.match(/^###\s+(\d+)\.\s+(.+?)\s*$/);
        if (headingMatch !== null) {
            const number = Number.parseInt(headingMatch[1] as string, 10);
            const title = headingMatch[2] as string;
            currentRecipe = { number, title, anchor: slugifyHeading(`${number}. ${title}`) };
            continue;
        }

        const tagMatch = raw.match(/^<!--\s*recipe-for:\s*(.+?)\s*-->\s*$/);
        if (tagMatch !== null && currentRecipe !== null) {
            const keys = (tagMatch[1] as string)
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean);
            for (const key of keys) {
                if (!recipes.has(key)) recipes.set(key, currentRecipe);
            }
        }
    }
    return recipes;
}

// ── Cross-validation gates (B, C, C2, D — pure, testable) ────────────────────

export interface CallSite {
    moduleFile: string;
    methodName: string;
    method: string;
    path: string;
    line: number;
}

export interface ActionEntry {
    resource: string;
    action: string;
    apiEndpoint: string;
    skillRecipeExempt?: boolean;
    pagination?: PaginationMetadata;
}

export interface ValidateGatesInput {
    callSites: CallSite[];
    actions: ActionEntry[];
    endpoints: { method: string; path: string; pagination?: PaginationMetadata | undefined }[];
    recipes: Map<string, SkillRecipe>;
    rootPrefix?: string;
}

/**
 * Gate B:  every `@testrail` tag must reference an endpoint in the JSON.
 * Gate C:  every `ActionSpec.apiEndpoint` must reference an endpoint that has
 *          a `@testrail` tag (i.e., the client actually implements it).
 * Gate C2: bidirectional binding between `ACTIONS` and skill recipes —
 *          (forward) every `<!-- recipe-for: resource:action -->` HTML comment
 *          in `skill/SKILL.md` must reference an existing entry in `ACTIONS`
 *          (catches typos / stale tags after an action is renamed or removed),
 *          AND
 *          (reverse) every `ACTIONS` entry must have ≥1 matching `recipe-for:`
 *          binding in `skill/SKILL.md` unless the spec sets
 *          `skillRecipeExempt: true` (catches the silent-recipe-drop regression
 *          seen in PR #114 / PR #118 where the one-way forward check let
 *          recipes vanish during rebase).
 * Gate D:  the mirror image of gate C — every `@testrail`-tagged client
 *          method must be claimed by at least one `ActionSpec.apiEndpoint`
 *          (i.e., the SDK method is actually reachable from the CLI). Unlike
 *          C2's reverse check, gate D has NO exemption escape hatch: the
 *          SDK⇒CLI half of this repo's layer-coverage invariant is
 *          documented as absolute and exception-free (every `@testrail`-
 *          tagged SDK method must surface as ≥1 CLI command), so there is no
 *          `*Exempt` flag to opt out with.
 * Gate E:  pagination metadata is bidirectional between the endpoint inventory
 *          and `ActionSpec`: neither side may add, omit, or alter a pagination
 *          contract without the other changing in the same commit.
 *
 * All gates produce error lists; the caller exits non-zero if any is
 * non-empty.
 */
export function validateGates({
    callSites,
    actions,
    endpoints,
    recipes,
    rootPrefix = '',
}: ValidateGatesInput): string[] {
    const jsonKeys = new Set(endpoints.map((e) => `${e.method} ${normalizePathForMatch(e.path)}`));
    const tagKeys = new Set(callSites.map((c) => `${c.method} ${normalizePathForMatch(c.path)}`));
    const actionKeys = new Set(actions.map((a) => `${a.resource}:${a.action}`));
    const actionEndpointKeys = new Set(
        actions
            .map((a) => parseTestrailTag(a.apiEndpoint))
            .filter((p): p is { method: string; path: string } => p !== null)
            .map((p) => `${p.method} ${normalizePathForMatch(p.path)}`),
    );
    const endpointByKey = new Map(
        endpoints.map((endpoint) => [`${endpoint.method} ${normalizePathForMatch(endpoint.path)}`, endpoint]),
    );

    const errors: string[] = [];

    // Gate B
    for (const cs of callSites) {
        const key = `${cs.method} ${normalizePathForMatch(cs.path)}`;
        if (!jsonKeys.has(key)) {
            const rel =
                rootPrefix.length > 0 && cs.moduleFile.startsWith(rootPrefix)
                    ? cs.moduleFile.slice(rootPrefix.length)
                    : cs.moduleFile;
            errors.push(
                `[gate B] ${rel}:${cs.line} — \`${cs.methodName}\` has @testrail "${cs.method} ${cs.path}" but this endpoint is not in docs/testrail-endpoints.json`,
            );
        }
    }

    // Gate C
    for (const a of actions) {
        const parsed = parseTestrailTag(a.apiEndpoint);
        if (parsed === null) {
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

    // Gate C2 (forward): every `recipe-for:` tag in SKILL.md must reference an
    // existing ACTIONS entry. Catches typos and stale recipe tags when an
    // action is renamed or removed.
    for (const [key, recipe] of recipes) {
        if (!actionKeys.has(key)) {
            errors.push(
                `[gate C2 forward] skill/SKILL.md recipe #${recipe.number} ("${recipe.title}") has \`recipe-for: ${key}\` but no such resource:action exists in ACTIONS`,
            );
        }
    }

    // Gate C2 (reverse): every ACTIONS entry must have ≥1 matching
    // `recipe-for:` binding in skill/SKILL.md, unless the spec opts out via
    // `skillRecipeExempt: true`. Closes the silent-recipe-drop regression
    // (PR #114 dropped recipe #34; PR #118 dropped C3+C5 during rebase) that
    // the one-way forward check could not detect.
    for (const a of actions) {
        if (a.skillRecipeExempt === true) continue;
        const key = `${a.resource}:${a.action}`;
        if (!recipes.has(key)) {
            errors.push(
                `[gate C2 reverse] ACTIONS entry \`${key}\` has no \`<!-- recipe-for: ${key} -->\` binding in skill/SKILL.md. Add a numbered recipe with that tag, or set \`skillRecipeExempt: true\` on the ActionSpec (with a justification comment) if the action genuinely does not warrant a curated recipe.`,
            );
        }
    }

    // Gate D: the mirror image of gate C — every `@testrail`-tagged client
    // method must be claimed by at least one `ActionSpec.apiEndpoint`. No
    // exemption escape hatch: the SDK⇒CLI layer-coverage invariant is
    // absolute and exception-free.
    for (const cs of callSites) {
        const key = `${cs.method} ${normalizePathForMatch(cs.path)}`;
        if (!actionEndpointKeys.has(key)) {
            const rel =
                rootPrefix.length > 0 && cs.moduleFile.startsWith(rootPrefix)
                    ? cs.moduleFile.slice(rootPrefix.length)
                    : cs.moduleFile;
            errors.push(
                `[gate D] ${rel}:${cs.line} — \`${cs.methodName}\` has @testrail "${cs.method} ${cs.path}" but no ActionSpec entry surfaces it on the CLI`,
            );
        }
    }

    const samePagination = (left: PaginationMetadata, right: PaginationMetadata): boolean =>
        left.response === right.response &&
        left.requestControls === right.requestControls &&
        left.collectionKey === right.collectionKey;

    // Gate E (endpoint inventory → ACTIONS): every registered endpoint must
    // have an ActionSpec with the exact same pagination contract.
    for (const endpoint of endpoints) {
        const pagination = endpoint.pagination;
        if (pagination === undefined) continue;
        const endpointKey = `${endpoint.method} ${normalizePathForMatch(endpoint.path)}`;
        const matches = actions.filter((action) => {
            const parsed = parseTestrailTag(action.apiEndpoint);
            return parsed !== null && `${parsed.method} ${normalizePathForMatch(parsed.path)}` === endpointKey;
        });
        const mismatches = matches.filter(
            (action) => action.pagination === undefined || !samePagination(action.pagination, pagination),
        );
        if (matches.length === 0 || mismatches.length > 0) {
            const mismatchKeys = mismatches.map((action) => `${action.resource}:${action.action}`).join(', ');
            errors.push(
                `[gate E endpoint→ACTIONS] endpoint "${endpointKey}" declares pagination ${JSON.stringify(pagination)} but its ActionSpec metadata does not match${mismatchKeys === '' ? '' : ` (${mismatchKeys})`}`,
            );
        }
    }

    // Gate E (ACTIONS → endpoint inventory): CLI metadata cannot invent or
    // disagree with an endpoint pagination contract.
    for (const action of actions) {
        if (action.pagination === undefined) continue;
        const parsed = parseTestrailTag(action.apiEndpoint);
        if (parsed === null) continue; // Gate C reports malformed apiEndpoint.
        const endpointKey = `${parsed.method} ${normalizePathForMatch(parsed.path)}`;
        const endpoint = endpointByKey.get(endpointKey);
        if (endpoint?.pagination === undefined || !samePagination(action.pagination, endpoint.pagination)) {
            errors.push(
                `[gate E ACTIONS→endpoint] ActionSpec \`${action.resource}:${action.action}\` declares pagination ${JSON.stringify(action.pagination)} but endpoint "${endpointKey}" does not carry the same contract`,
            );
        }
    }

    return errors;
}

// ── Cell renderers ───────────────────────────────────────────────────────────
//
// `docs/API-MAPPING.md` lives one directory below the repo root, so all links
// to repo-root files (src/, skill/, etc.) must be prefixed with `../` to
// resolve correctly. The `LINK_PREFIX` constant centralizes this so a future
// move of the output file is a one-line change.

const LINK_PREFIX = '../';
const SKILL_COMMAND_TABLE_ANCHOR = `${LINK_PREFIX}skill/SKILL.md#command-surface`;
const TESTRAIL_DOCS_BASE = 'https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference';

export function renderEndpointCell(ep: { method: string; path: string; docUrl?: string | undefined }): string {
    const text = `\`${ep.method} ${ep.path}\``;
    const url = ep.docUrl ?? TESTRAIL_DOCS_BASE;
    return `[${text}](${url})`;
}

export function renderClientCell(
    match: { moduleFile: string; methodName: string; line: number } | null,
    rootPrefix: string,
): string {
    if (match === null) return '—';
    const rel =
        rootPrefix.length > 0 && match.moduleFile.startsWith(rootPrefix)
            ? match.moduleFile.slice(rootPrefix.length)
            : match.moduleFile;
    return `[\`${match.methodName}\`](${LINK_PREFIX}${rel}#L${match.line})`;
}

export function renderCliCell(cliKeys: readonly string[]): string {
    if (cliKeys.length === 0) return '—';
    return cliKeys.map((cliKey) => `\`${cliKey.replace(':', ' ')}\``).join('<br>');
}

/**
 * For each CLI action, link its numbered recipe (via `recipe-for:` tag in
 * SKILL.md), or fall back to the generated command-table anchor. Returns an
 * em-dash when the endpoint row has no CLI binding at all.
 */
export function renderSkillCell(cliKeys: readonly string[], recipes?: Map<string, SkillRecipe>): string {
    if (cliKeys.length === 0) return '—';
    return cliKeys
        .map((cliKey) => {
            const recipe = recipes !== undefined ? recipes.get(cliKey) : undefined;
            if (recipe !== undefined) {
                return `[recipe #${recipe.number}](${LINK_PREFIX}skill/SKILL.md#${recipe.anchor})`;
            }
            return `[command-table](${SKILL_COMMAND_TABLE_ANCHOR})`;
        })
        .join('<br>');
}

// ── Aggregate renderers ───────────────────────────────────────────────────────

export interface MappingRow {
    endpoint: Endpoint;
    match: { moduleFile: string; methodName: string; line: number } | null;
    cliKeys: readonly string[];
}

export interface GroupedResource {
    resource: string;
    rows: MappingRow[];
}

/** Anchor slug for a resource section heading (lowercase, spaces → hyphens). */
function resourceSlug(resource: string): string {
    return resource.toLowerCase().replace(/\s+/g, '-');
}

export function renderSummaryTable(grouped: GroupedResource[], recipes?: Map<string, SkillRecipe>): string {
    const lines = [
        '| Resource | TestRail endpoints | Client-bound endpoints | CLI-bound endpoints | CLI actions | Skill recipe actions |',
        '| --- | ---: | ---: | ---: | ---: | ---: |',
    ];
    const totals = { ep: 0, client: 0, cliEndpoints: 0, cliActions: 0, skillActions: 0 };
    for (const { resource, rows } of grouped) {
        const ep = rows.length;
        const client = rows.filter((r) => r.match !== null).length;
        const cliEndpoints = rows.filter((r) => r.cliKeys.length > 0).length;
        const cliActions = rows.reduce((count, row) => count + row.cliKeys.length, 0);
        const skillActions =
            recipes !== undefined
                ? rows.reduce((count, row) => count + row.cliKeys.filter((cliKey) => recipes.has(cliKey)).length, 0)
                : 0;
        totals.ep += ep;
        totals.client += client;
        totals.cliEndpoints += cliEndpoints;
        totals.cliActions += cliActions;
        totals.skillActions += skillActions;
        const slug = resourceSlug(resource);
        lines.push(
            `| [${resource}](#${slug}) | ${ep} | ${client} | ${cliEndpoints} | ${cliActions} | ${skillActions} |`,
        );
    }
    lines.push(
        `| **Total** | **${totals.ep}** | **${totals.client}** | **${totals.cliEndpoints}** | **${totals.cliActions}** | **${totals.skillActions}** |`,
    );
    return lines.join('\n');
}

export function renderResourceSection(
    resource: string,
    rows: MappingRow[],
    rootPrefix: string,
    recipes?: Map<string, SkillRecipe>,
): string {
    const slug = resourceSlug(resource);
    const header = [`## ${resource}`, '', `<a id="${slug}"></a>`, ''];
    const table = ['| Endpoint | Client method | CLI action(s) | Skill recipe(s) |', '| --- | --- | --- | --- |'];
    for (const row of rows) {
        table.push(
            `| ${renderEndpointCell(row.endpoint)} | ${renderClientCell(row.match, rootPrefix)} | ${renderCliCell(row.cliKeys)} | ${renderSkillCell(row.cliKeys, recipes)} |`,
        );
    }
    return [...header, ...table, ''].join('\n');
}

export function renderDocument(
    grouped: GroupedResource[],
    rootPrefix: string,
    recipes?: Map<string, SkillRecipe>,
): string {
    const lines = [
        '<!-- Generated by scripts/generate-mapping.ts. Do not edit by hand. -->',
        '',
        '# TestRail API Mapping',
        '',
        'Coverage matrix linking every TestRail API endpoint to its implementation in this package: the client method, CLI action(s), and agent skill recipe(s). Rows with `—` indicate gaps (endpoint exists in TestRail but not yet surfaced at that layer).',
        '',
        '**Sources of truth.** The endpoint inventory is hand-curated in [`docs/testrail-endpoints.json`](testrail-endpoints.json). Client methods are bound via `@testrail` JSDoc tags on each method in `src/modules/*.ts`. CLI commands are read from the `apiEndpoint` field on each entry in `ACTIONS` in `src/cli/metadata.ts`.',
        '',
        '**Version target.** The inventory is audited against TestRail 10.7.0; source provenance, cumulative-release additions, resolved mismatches, and known upstream documentation conflicts are recorded in [`docs/TESTRAIL-10.7.0-COMPATIBILITY.md`](TESTRAIL-10.7.0-COMPATIBILITY.md).',
        '',
        '**Drift gates.** The generator validates six things on every run: every `@testrail` tag references an endpoint that exists in the JSON (gate B); every `ActionSpec.apiEndpoint` references an endpoint that has a matching `@testrail` tag (gate C); every `<!-- recipe-for: resource:action -->` HTML comment in `skill/SKILL.md` references an existing entry in `ACTIONS` (gate C2); every `@testrail`-tagged client method is claimed by at least one `ActionSpec.apiEndpoint`, with no exemption escape hatch (gate D); endpoint and `ActionSpec` pagination metadata agree bidirectionally (gate E); the committed file matches generator output (gate A, enforced by `npm run mapping:check` in `pretest` and CI).',
        '',
        '**Skill recipes** are surfaced two ways. When a numbered recipe in `skill/SKILL.md` carries a `<!-- recipe-for: resource:action -->` HTML comment, the skill cell links directly to that recipe — a curated, hand-written workflow showing how an agent uses the action in context. Otherwise the cell links to the auto-generated command-table entry as a fallback. The summary distinguishes endpoint coverage from action counts because more than one CLI action can intentionally use the same TestRail endpoint.',
        '',
        '## Summary',
        '',
        renderSummaryTable(grouped, recipes),
        '',
    ];
    for (const { resource, rows } of grouped) {
        lines.push(renderResourceSection(resource, rows, rootPrefix, recipes));
    }
    return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}
