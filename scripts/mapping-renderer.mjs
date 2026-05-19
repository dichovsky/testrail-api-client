/**
 * Pure helpers for scripts/generate-mapping.js. Extracted as a sibling module
 * so they can be exercised by tests/generate-mapping.test.ts without invoking
 * the whole AST-crawl + filesystem pipeline.
 *
 * Nothing here reads files or has side effects. Side-effectful orchestration
 * (loading JSON, walking modules, writing output) stays in generate-mapping.js.
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
 * Normalize both TS source paths (with `${expr}`) and JSON paths (with `{id}`)
 * to a common form so they can be compared. Strips the TestRail query-param
 * suffix (`&foo=...`) which appears in some GET endpoints.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizePathForMatch(raw) {
    let s = raw;
    const amp = s.indexOf('&');
    if (amp !== -1) s = s.slice(0, amp);
    s = s.replace(/\$\{[^}]*\}/g, '{}');
    s = s.replace(/\{[^}]*\}/g, '{}');
    return s;
}

// ── CLI heuristic mapping (Phase 1 only) ──────────────────────────────────────
//
// Maps TestRail snake_case operation names to the `{resource, action}` pair the
// CLI exposes. Intentionally explicit; ambiguity returns null so the table
// doesn't claim wrong wiring. Phase 2 replaces this with `apiEndpoint` field
// on ActionSpec and deletes this map.
export const CLI_OPERATION_MAP = {
    get_project: ['project', 'get'],
    get_projects: ['project', 'list'],
    add_project: ['project', 'add'],
    update_project: ['project', 'update'],
    delete_project: ['project', 'delete'],
    get_suite: ['suite', 'get'],
    get_suites: ['suite', 'list'],
    add_suite: ['suite', 'add'],
    update_suite: ['suite', 'update'],
    delete_suite: ['suite', 'delete'],
    get_section: ['section', 'get'],
    get_sections: ['section', 'list'],
    add_section: ['section', 'add'],
    update_section: ['section', 'update'],
    delete_section: ['section', 'delete'],
    move_section: ['section', 'move'],
    get_case: ['case', 'get'],
    get_cases: ['case', 'list'],
    get_history_for_case: ['case', 'history'],
    add_case: ['case', 'add'],
    update_case: ['case', 'update'],
    update_cases: ['case', 'update-bulk'],
    delete_case: ['case', 'delete'],
    delete_cases: ['case', 'delete-bulk'],
    copy_cases_to_section: ['case', 'copy-to-section'],
    move_cases_to_section: ['case', 'move-to-section'],
    get_case_fields: ['case-field', 'list'],
    add_case_field: ['case-field', 'add'],
    get_run: ['run', 'get'],
    get_runs: ['run', 'list'],
    add_run: ['run', 'add'],
    update_run: ['run', 'update'],
    close_run: ['run', 'close'],
    delete_run: ['run', 'delete'],
    // Results — the CLI exposes a narrower surface than TestRail:
    //   `result:list`             → getResultsForRun       (per src/cli/handlers/result.ts)
    //   `result:add`              → addResultForCase       (per src/cli/handlers/result-write.ts)
    //   `result:add-bulk`         → addResultsForCases
    //   `result:add-bulk-by-test` → addResults
    // The three endpoints with no CLI cover (get_results, get_results_for_case,
    // add_result) are omitted intentionally; they show as '—' in the CLI cell.
    get_results_for_run: ['result', 'list'],
    add_result_for_case: ['result', 'add'],
    add_results: ['result', 'add-bulk-by-test'],
    add_results_for_cases: ['result', 'add-bulk'],
    get_plan: ['plan', 'get'],
    get_plans: ['plan', 'list'],
    add_plan: ['plan', 'add'],
    update_plan: ['plan', 'update'],
    close_plan: ['plan', 'close'],
    delete_plan: ['plan', 'delete'],
    add_plan_entry: ['plan', 'add-entry'],
    get_milestone: ['milestone', 'get'],
    get_milestones: ['milestone', 'list'],
    add_milestone: ['milestone', 'add'],
    update_milestone: ['milestone', 'update'],
    delete_milestone: ['milestone', 'delete'],
    get_user: ['user', 'get'],
    get_users: ['user', 'list'],
    get_current_user: ['user', 'me'],
    get_attachments_for_case: ['attachment', 'list-for-case'],
    get_attachments_for_plan: ['attachment', 'list-for-plan'],
    get_attachments_for_plan_entry: ['attachment', 'list-for-plan-entry'],
    get_attachments_for_run: ['attachment', 'list-for-run'],
    get_attachments_for_test: ['attachment', 'list-for-test'],
    get_attachment: ['attachment', 'get'],
    add_attachment_to_case: ['attachment', 'add-to-case'],
    add_attachment_to_plan: ['attachment', 'add-to-plan'],
    add_attachment_to_plan_entry: ['attachment', 'add-to-plan-entry'],
    add_attachment_to_result: ['attachment', 'add-to-result'],
    add_attachment_to_run: ['attachment', 'add-to-run'],
    delete_attachment: ['attachment', 'delete'],
    // BDD, Statuses, Shared Steps — small CLI surfaces not covered above.
    get_bdd: ['bdd', 'get'],
    add_bdd: ['bdd', 'add'],
    get_case_statuses: ['case-status', 'list'],
    get_shared_step: ['shared-step', 'get'],
    get_shared_steps: ['shared-step', 'list'],
    get_shared_step_history: ['shared-step', 'history'],
};

/**
 * @param {string} operation snake_case TestRail operation
 * @param {Set<string>} actionsSet  e.g. `Set(['case:get','run:add',...])`
 * @returns {string|null}  `'case:get'` or null when no match
 */
export function guessCliCommand(operation, actionsSet) {
    const guess = CLI_OPERATION_MAP[operation];
    if (!guess) return null;
    const key = `${guess[0]}:${guess[1]}`;
    return actionsSet.has(key) ? key : null;
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

export function renderSkillCell(cliKey) {
    if (!cliKey) return '—';
    return `[command-table](${SKILL_COMMAND_TABLE_ANCHOR})`;
}

// ── Aggregate renderers ───────────────────────────────────────────────────────

export function renderSummaryTable(grouped) {
    const lines = [
        '| Resource | TestRail endpoints | Client methods | CLI commands | Skill exposure |',
        '| --- | ---: | ---: | ---: | ---: |',
    ];
    const totals = { ep: 0, client: 0, cli: 0, skill: 0 };
    for (const { resource, rows } of grouped) {
        const ep = rows.length;
        const client = rows.filter((r) => r.match).length;
        const cli = rows.filter((r) => r.cliKey).length;
        const skill = cli;
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

export function renderResourceSection(resource, rows, rootPrefix) {
    const slug = resource.toLowerCase().replace(/\s+/g, '-');
    const header = [`## ${resource}`, '', '<a id="' + slug + '"></a>', ''];
    const table = ['| Endpoint | Client method | CLI command | Skill recipe |', '| --- | --- | --- | --- |'];
    for (const row of rows) {
        table.push(
            `| ${renderEndpointCell(row.endpoint)} | ${renderClientCell(row.match, rootPrefix)} | ${renderCliCell(row.cliKey)} | ${renderSkillCell(row.cliKey)} |`,
        );
    }
    return [...header, ...table, ''].join('\n');
}

export function renderDocument(grouped, rootPrefix) {
    const lines = [
        '<!-- Generated by scripts/generate-mapping.js. Do not edit by hand. -->',
        '',
        '# TestRail API Mapping',
        '',
        'Coverage matrix linking every TestRail API endpoint to its implementation in this package: the client method, the CLI command, and the agent skill recipe. Rows with `—` indicate gaps (endpoint exists in TestRail but not yet surfaced at that layer).',
        '',
        '**Sources of truth.** The endpoint inventory is hand-curated in [`docs/testrail-endpoints.json`](testrail-endpoints.json). Client-method binding is extracted from `this.client.request*()` call-site literals in `src/modules/*.ts`. CLI commands are derived from `ACTIONS` in `src/cli/metadata.ts`.',
        '',
        '**Phase 1 caveats.** Methods that build their endpoint dynamically (via `buildEndpoint(...)` or other helpers) are not yet matched and will appear as `—` in the client-method column even when implemented. The CLI column uses a name-based heuristic. A subsequent PR will add `@testrail` JSDoc tags and an `apiEndpoint` field on `ActionSpec`, replacing both shortcuts and turning on CI drift gates. Skill exposure currently counts only the auto-generated command-table entry; numbered recipes (e.g., "Author a new test case") will be linked individually in a later PR.',
        '',
        '## Summary',
        '',
        renderSummaryTable(grouped),
        '',
    ];
    for (const { resource, rows } of grouped) {
        lines.push(renderResourceSection(resource, rows, rootPrefix));
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
