/**
 * Pure helpers for scripts/generate-mapping.js. Extracted as a sibling module
 * so they can be exercised by tests/generate-mapping.test.ts without invoking
 * the whole AST-crawl + filesystem pipeline.
 *
 * Nothing here reads files or has side effects. Side-effectful orchestration
 * (loading JSON, walking modules, writing output) stays in generate-mapping.js.
 *
 * Phase 2 changes: the Phase-1 `CLI_OPERATION_MAP` / `guessCliCommand` heuristic
 * is gone. Each `ActionSpec` now carries an explicit `apiEndpoint` field, so
 * the generator looks up the CLI cell directly. The generator also cross-
 * validates `@testrail` JSDoc tags against the JSON inventory (gate B) and
 * `ActionSpec.apiEndpoint` against the tags (gate C).
 */

import { z } from 'zod';

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
});

export const EndpointsArraySchema = z.array(EndpointSchema).superRefine((arr, ctx) => {
    const seen = new Map();
    for (let i = 0; i < arr.length; i++) {
        const key = `${arr[i].method} ${arr[i].path}`;
        if (seen.has(key)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Duplicate endpoint "${key}" at index ${i} (first seen at index ${seen.get(key)})`,
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
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizePathForMatch(raw) {
    const amp = raw.indexOf('&');
    return amp === -1 ? raw : raw.slice(0, amp);
}

/**
 * Parse a `@testrail` JSDoc tag value into `{ method, path }`. Accepts forms
 * like `GET get_case/{case_id}` or `POST add_project`. Returns `null` for
 * unparseable input so callers can decide how to report the error.
 *
 * @param {string} text
 * @returns {{ method: string, path: string } | null}
 */
export function parseTestrailTag(text) {
    const trimmed = text.trim();
    const match = trimmed.match(/^(GET|POST)\s+(\S+)$/);
    if (!match) return null;
    return { method: match[1], path: match[2] };
}

// ── Skill recipe parsing (Phase 3) ────────────────────────────────────────────

/**
 * GitHub-flavored heading anchor: lowercase, strip everything that isn't
 * alphanumeric / space / hyphen, then replace spaces with hyphens. Matches
 * GitHub's behavior for `### 1. Smoke-test auth & connectivity` → `#1-smoke-test-auth--connectivity`.
 *
 * @param {string} heading raw text after `### ` markdown prefix
 * @returns {string}
 */
export function slugifyHeading(heading) {
    return heading
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s/g, '-');
}

/**
 * Walk a SKILL.md body looking for `### N. Title` recipe headings followed by
 * `<!-- recipe-for: resource:action[, ...] -->` HTML comments. Returns a map
 * keyed by `resource:action` → `{ number, title, anchor }`. When a recipe
 * tag lists multiple actions, every listed action maps to the same recipe.
 *
 * Skips the GENERATED sections (anything between `<!-- GENERATED:` markers)
 * so generator-rendered tables can't poison the parse.
 *
 * @param {string} skillSource full SKILL.md content
 * @returns {Map<string, { number: number, title: string, anchor: string }>}
 */
export function parseSkillRecipes(skillSource) {
    const recipes = new Map();
    const lines = skillSource.split('\n');
    let inGenerated = false;
    let currentRecipe = null;
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
        if (headingMatch) {
            const number = Number.parseInt(headingMatch[1], 10);
            const title = headingMatch[2];
            currentRecipe = { number, title, anchor: slugifyHeading(`${number}. ${title}`) };
            continue;
        }

        const tagMatch = raw.match(/^<!--\s*recipe-for:\s*(.+?)\s*-->\s*$/);
        if (tagMatch && currentRecipe) {
            const keys = tagMatch[1]
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

// ── Cell renderers ───────────────────────────────────────────────────────────
//
// `docs/API-MAPPING.md` lives one directory below the repo root, so all links
// to repo-root files (src/, skill/, etc.) must be prefixed with `../` to
// resolve correctly. The `LINK_PREFIX` constant centralizes this so a future
// move of the output file is a one-line change.

const LINK_PREFIX = '../';
const SKILL_COMMAND_TABLE_ANCHOR = `${LINK_PREFIX}skill/SKILL.md#command-surface`;
const TESTRAIL_DOCS_BASE = 'https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference';

export function renderEndpointCell(ep) {
    const text = `\`${ep.method} ${ep.path}\``;
    const url = ep.docUrl ?? TESTRAIL_DOCS_BASE;
    return `[${text}](${url})`;
}

export function renderClientCell(match, rootPrefix) {
    if (!match) return '—';
    const rel = match.moduleFile.replace(rootPrefix, '');
    return `[\`${match.methodName}\`](${LINK_PREFIX}${rel}#L${match.line})`;
}

export function renderCliCell(cliKey) {
    if (!cliKey) return '—';
    return `\`${cliKey.replace(':', ' ')}\``;
}

/**
 * If the CLI action has a numbered recipe (via `recipe-for:` tag in SKILL.md),
 * link directly to that recipe. Otherwise fall back to the generated command-
 * table anchor. Returns em-dash when the row has no CLI binding at all.
 */
export function renderSkillCell(cliKey, recipes) {
    if (!cliKey) return '—';
    const recipe = recipes && recipes.get ? recipes.get(cliKey) : null;
    if (recipe) {
        return `[recipe #${recipe.number}](${LINK_PREFIX}skill/SKILL.md#${recipe.anchor})`;
    }
    return `[command-table](${SKILL_COMMAND_TABLE_ANCHOR})`;
}

// ── Aggregate renderers ───────────────────────────────────────────────────────

export function renderSummaryTable(grouped, recipes) {
    const lines = [
        '| Resource | TestRail endpoints | Client methods | CLI commands | Skill exposure |',
        '| --- | ---: | ---: | ---: | ---: |',
    ];
    const totals = { ep: 0, client: 0, cli: 0, skill: 0 };
    for (const { resource, rows } of grouped) {
        const ep = rows.length;
        const client = rows.filter((r) => r.match).length;
        const cli = rows.filter((r) => r.cliKey).length;
        // Skill count: rows whose cliKey has a recipe-for: tag in SKILL.md.
        const skill = recipes ? rows.filter((r) => r.cliKey && recipes.has(r.cliKey)).length : 0;
        totals.ep += ep;
        totals.client += client;
        totals.cli += cli;
        totals.skill += skill;
        const slug = resource.toLowerCase().replace(/\s+/g, '-');
        lines.push(`| [${resource}](#${slug}) | ${ep} | ${client} | ${cli} | ${skill} |`);
    }
    lines.push(`| **Total** | **${totals.ep}** | **${totals.client}** | **${totals.cli}** | **${totals.skill}** |`);
    return lines.join('\n');
}

export function renderResourceSection(resource, rows, rootPrefix, recipes) {
    const slug = resource.toLowerCase().replace(/\s+/g, '-');
    const header = [`## ${resource}`, '', '<a id="' + slug + '"></a>', ''];
    const table = ['| Endpoint | Client method | CLI command | Skill recipe |', '| --- | --- | --- | --- |'];
    for (const row of rows) {
        table.push(
            `| ${renderEndpointCell(row.endpoint)} | ${renderClientCell(row.match, rootPrefix)} | ${renderCliCell(row.cliKey)} | ${renderSkillCell(row.cliKey, recipes)} |`,
        );
    }
    return [...header, ...table, ''].join('\n');
}

export function renderDocument(grouped, rootPrefix, recipes) {
    const lines = [
        '<!-- Generated by scripts/generate-mapping.js. Do not edit by hand. -->',
        '',
        '# TestRail API Mapping',
        '',
        'Coverage matrix linking every TestRail API endpoint to its implementation in this package: the client method, the CLI command, and the agent skill recipe. Rows with `—` indicate gaps (endpoint exists in TestRail but not yet surfaced at that layer).',
        '',
        '**Sources of truth.** The endpoint inventory is hand-curated in [`docs/testrail-endpoints.json`](testrail-endpoints.json). Client methods are bound via `@testrail` JSDoc tags on each method in `src/modules/*.ts`. CLI commands are read from the `apiEndpoint` field on each entry in `ACTIONS` in `src/cli/metadata.ts`.',
        '',
        '**Drift gates.** The generator validates three things on every run: every `@testrail` tag references an endpoint that exists in the JSON (gate B); every `ActionSpec.apiEndpoint` references an endpoint that has a matching `@testrail` tag (gate C); the committed file matches generator output (gate A, enforced by `npm run mapping:check` in `pretest` and CI).',
        '',
        '**Skill recipes** are surfaced two ways. When a numbered recipe in `skill/SKILL.md` carries a `<!-- recipe-for: resource:action -->` HTML comment, the skill cell links directly to that recipe — a curated, hand-written workflow showing how an agent uses the action in context. Otherwise the cell links to the auto-generated command-table entry as a fallback. The summary table\'s "Skill exposure" column counts only the curated-recipe rows; the command-table itself covers every CLI-bound row.',
        '',
        '## Summary',
        '',
        renderSummaryTable(grouped, recipes),
        '',
    ];
    for (const { resource, rows } of grouped) {
        lines.push(renderResourceSection(resource, rows, rootPrefix, recipes));
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
