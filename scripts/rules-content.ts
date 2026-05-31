/**
 * Shared source-of-truth content for the generated agent-instruction
 * artifact `AGENTS.md`. The shared body (`renderRulesBody`) is
 * format-neutral; `renderAgentsMd` wraps it with a header and a
 * trailing "Build / verify commands" section.
 *
 * Determinism: every helper here is pure and order-stable. ACTIONS is
 * iterated in declaration order (matches metadata.ts insertion order,
 * preserved by ES module evaluation). No timestamps, no randomness.
 */

interface ActionLike {
    resource: string;
    action: string;
    isWrite?: boolean;
    destructive?: boolean;
}

/** Resource list pulled from ACTIONS, deduped while preserving order. */
export function resourceList(actions: readonly ActionLike[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const a of actions) {
        if (!seen.has(a.resource)) {
            seen.add(a.resource);
            result.push(a.resource);
        }
    }
    return result;
}

/**
 * Format-neutral body of the rules document. Each format wraps this in its
 * own frontmatter / header so the actual usage guidance stays in one place.
 */
export function renderRulesBody(actions: readonly ActionLike[]): string {
    const resources = resourceList(actions);
    const writeCount = actions.filter((a) => a.isWrite === true).length;
    const readCount = actions.length - writeCount;
    const destructiveCount = actions.filter((a) => a.destructive === true).length;

    return [
        '## What `@dichovsky/testrail-api-client` is',
        '',
        'A TypeScript client + CLI for the TestRail REST API with one runtime',
        'dependency: Zod. ESM only. Ships two surfaces:',
        '',
        '- **Programmatic**: `import { TestRailClient } from "@dichovsky/testrail-api-client"`',
        '- **CLI**: the `testrail` binary (also `npx testrail`)',
        '',
        `Today the CLI exposes ${actions.length} actions across ${resources.length} resources`,
        `(${readCount} read, ${writeCount} write, ${destructiveCount} destructive). The`,
        'programmatic API is a strict superset — every CLI action calls a',
        'method on one of the `TestRailClient` domain modules.',
        '',
        '## When to use which surface',
        '',
        '- **CLI** — shell scripts, CI steps, ad-hoc queries, one-shot writes.',
        '  Output is JSON to stdout by default. Auth via env vars',
        '  (`TESTRAIL_BASE_URL` / `TESTRAIL_EMAIL` / `TESTRAIL_API_KEY`).',
        '- **Programmatic** — TypeScript/JavaScript code that needs typed',
        '  responses, retry/rate-limit reuse across many calls, or response',
        '  caching. Construct `new TestRailClient({ baseUrl, email, apiKey })`',
        '  and call methods through the domain modules, e.g.',
        '  `client.projects.getProject(1)`.',
        '',
        '## Quick start (CLI)',
        '',
        '```bash',
        'export TESTRAIL_BASE_URL="https://example.testrail.io"',
        'export TESTRAIL_EMAIL="agent@example.com"',
        'export TESTRAIL_API_KEY="…"',
        '',
        '# Read',
        'npx testrail project list',
        'npx testrail case get 42',
        '',
        '# Write (Zod-validated; --dry-run previews without API call)',
        'npx testrail run add 5 --data \'{"name":"CI build 123","include_all":true}\'',
        '',
        '# Destructive — requires BOTH the per-invocation flag and env unlock',
        'TESTRAIL_ALLOW_DESTRUCTIVE=1 npx testrail run close 100 --yes',
        '```',
        '',
        '## Quick start (programmatic)',
        '',
        '```typescript',
        "import { TestRailClient, TestRailApiError } from '@dichovsky/testrail-api-client';",
        '',
        'const client = new TestRailClient({',
        '    baseUrl: process.env.TESTRAIL_BASE_URL!,',
        '    email: process.env.TESTRAIL_EMAIL!,',
        '    apiKey: process.env.TESTRAIL_API_KEY!,',
        '});',
        '',
        'try {',
        '    const project = await client.projects.getProject(1);',
        '    console.log(project.name);',
        '} catch (e) {',
        '    if (e instanceof TestRailApiError) {',
        '        console.error(`HTTP ${e.status}: ${e.statusText}`);',
        '    }',
        '    throw e;',
        '} finally {',
        '    client.destroy();',
        '}',
        '```',
        '',
        '## Key invariants agents should know',
        '',
        '- **One runtime dep: Zod.** Do not add another dependency to solve a',
        '  problem; pick a stdlib primitive or refactor.',
        '- **No `any`.** Use `unknown` + narrowing. Public APIs have explicit',
        '  parameter and return types.',
        '- **No mutation.** Return new objects; never mutate input.',
        '- **All numeric IDs validated** as positive integers before any',
        '  network call. Use the leaf-module function:',
        "  `import { validateId } from '../validation.js';` then",
        '  `validateId(id, "name")`. Plan-entry IDs use `validateEntryId`',
        '  from the same module (SEC #29 UUID format).',
        '- **Write payloads validated by Zod** schemas in `src/schemas/*.ts`',
        '  (re-exported through the `src/schemas.ts` barrel).',
        '  `custom_*` fields pass through `.passthrough()` unchanged. No',
        '  coercion: `"5"` is NOT silently converted to `5`.',
        '- **Caching**: GET responses cached in-process ~5 min. Any write',
        '  invalidates the entire cache.',
        '- **Retry**: GET retries on 5xx/429/network errors with exponential',
        '  backoff. Writes (POST/PUT/DELETE) retry only on 429 (rate-limited);',
        '  5xx and network errors surface immediately to prevent duplicate',
        '  writes. `Retry-After` honored.',
        '- **Redirects**: every fetch sets `redirect: "manual"`. A 3xx surfaces',
        '  as `TestRailApiError` and never poisons the GET cache (SSRF guard).',
        '- **Response-body limits**: 10 MiB JSON / 100 MiB binary ceilings plus',
        '  a wall-clock deadline. Exceeding either throws `TestRailApiError`',
        '  with no retry.',
        '- **Lifecycle**: call `client.destroy()` when done (or use the CLI,',
        '  which opts in to process signal handlers).',
        '',
        '## Error model',
        '',
        '| Class                     | Thrown when                                                  |',
        '| ------------------------- | ------------------------------------------------------------ |',
        '| `TestRailApiError`        | HTTP error, network error, rate limit, timeout, invalid JSON |',
        '| `TestRailValidationError` | Bad config, invalid ID, invalid params                       |',
        '',
        'CLI exits 0 on success and non-zero on failure. Most failures exit 1;',
        'a destructive action blocked by the missing env unlock exits 2 so CI',
        'can distinguish it. JSON goes to stdout on success,',
        '`Error: <message>` to stderr on failure.',
        '',
        '## Destructive actions',
        '',
        'All destructive CLI actions require BOTH `--yes` and',
        '`TESTRAIL_ALLOW_DESTRUCTIVE=1`:',
        '',
        actions
            .filter((a) => a.destructive === true)
            .map((a) => `- \`${a.resource} ${a.action}\``)
            .join('\n'),
        '',
        '`--dry-run` always wins over `--yes` — pass both to preview without',
        "calling the API. `--soft` adds TestRail's server-side preview",
        '(returns affected-entity counts without deleting) on the subset of',
        'deletes that support it; `--dry-run` is purely client-side.',
        '',
        '## Authentication',
        '',
        '- **Never** pass the API key on argv. `--api-key <key>` was removed',
        '  in v3.0 because argv is visible via `/proc/<pid>/cmdline`, shell',
        '  history, CI step logs, and crash dumps.',
        '- Prefer `TESTRAIL_API_KEY` env var. If the env var is not an option,',
        '  pipe via stdin: `echo "$KEY" | npx testrail … --api-key-stdin`.',
        '- `--api-key-stdin` consumes stdin, so JSON bodies for write actions',
        '  must come from `--data` or `--data-file` in that case.',
        '',
        '## DO NOT',
        '',
        '- Add runtime dependencies beyond Zod (the single-dependency posture',
        '  is intentional).',
        '- Use `any`. Use `unknown` + narrowing or a generic.',
        '- Mutate objects in-place. Return new objects.',
        '- Hardcode numeric values; use `src/constants.ts`.',
        '- Call `request()` without ID validation.',
        '- Pass the API key on argv (`--api-key` was removed in v3.0).',
        '- Skip `npm run typecheck` before committing.',
        '- Hand-edit `CODEMAP.md`, `docs/API-MAPPING.md`, `skill/SKILL.md`',
        '  generated sections, or `AGENTS.md`',
        '  — they are all generated. Re-run the matching `npm run` script',
        '  after editing the source.',
        '',
        '## See also',
        '',
        '- `CLAUDE.md` — full architecture context (Claude Code instructions)',
        '- `skill/SKILL.md` — Claude Code skill: command surface, recipes, and',
        '  programmatic TypeScript API examples',
        '- `CODEMAP.md` — every public method, type, error class, and constant',
        '  with file:line links (auto-generated)',
        '- `docs/API-MAPPING.md` — TestRail endpoint ↔ client method ↔ CLI ↔',
        '  skill recipe coverage matrix',
        '- `README.md` — package install, configuration options, programmatic',
        '  API tour',
        '',
    ].join('\n');
}

/**
 * Generic `AGENTS.md` — vendor-neutral format per https://agents.md/. The
 * convention is a single markdown file at the repo root that any
 * agent/harness can read for project conventions, build commands, and
 * "what to know" pointers.
 */
export function renderAgentsMd(actions: readonly ActionLike[]): string {
    return [
        '# AGENTS.md',
        '',
        '> Vendor-neutral guidance for AI coding agents working in this',
        '> repository. Follows the [agents.md](https://agents.md/) convention.',
        '',
        '## Project: `@dichovsky/testrail-api-client`',
        '',
        renderRulesBody(actions),
        '## Build / verify commands',
        '',
        '```bash',
        'npm test                       # Run all tests (Vitest)',
        'npm run test:coverage          # Coverage report',
        'npm run build                  # Compile to dist/',
        'npm run lint                   # ESLint',
        'npm run typecheck              # tsc --noEmit',
        'npm run codemap                # Regenerate CODEMAP.md',
        'npm run mapping                # Regenerate docs/API-MAPPING.md',
        'npm run skill                  # Regenerate skill/SKILL.md',
        'npm run agents-md              # Regenerate AGENTS.md',
        '```',
        '',
        'CI runs `*:check` variants for each generator; drift fails the build.',
        'After changing `src/cli/metadata/*.ts`, `src/schemas/*.ts`, or any',
        'module method JSDoc, regenerate all artifacts.',
        '',
    ].join('\n');
}
