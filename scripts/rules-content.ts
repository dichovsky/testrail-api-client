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
        'This package is a TypeScript client and CLI for the TestRail REST API.',
        'It has one runtime dependency: Zod. It uses ESM only and provides two interfaces:',
        '',
        '- **Programmatic SDK**: `import { TestRailClient } from "@dichovsky/testrail-api-client"`',
        '- **CLI**: the `testrail` executable (or `npx testrail`)',
        '',
        `The CLI provides ${actions.length} actions across ${resources.length} resources`,
        `(${readCount} read, ${writeCount} write, ${destructiveCount} destructive).`,
        'Every CLI action calls a method on one of the `TestRailClient` domain modules.',
        '',
        '## When to use each interface',
        '',
        '- **CLI**: Use the CLI for shell scripts, CI steps, ad-hoc queries, and single writes.',
        '  The CLI outputs JSON to `stdout` by default. Set credentials with environment variables',
        '  (`TESTRAIL_BASE_URL`, `TESTRAIL_EMAIL`, and `TESTRAIL_API_KEY`).',
        '- **Programmatic SDK**: Use the SDK in TypeScript or JavaScript code that requires',
        '  typed responses, shared rate limiting across requests, or in-memory response caching.',
        '  Create an instance with `new TestRailClient({ baseUrl, email, apiKey })`.',
        '  Call methods on the domain modules (for example, `client.projects.getProject(1)`).',
        '',
        '## Quick start (CLI)',
        '',
        'Use Node.js 26 or newer. Node.js 26 is the default development runtime.',
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
        '# Write (validated by Zod; --dry-run previews without calling the API)',
        'npx testrail run add 5 --data \'{"name":"CI build 123","include_all":true}\'',
        '',
        '# Destructive (requires BOTH --yes and TESTRAIL_ALLOW_DESTRUCTIVE=1)',
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
        '## Key rules for agents',
        '',
        '- **One runtime dependency (Zod).** Do not add any other runtime dependency.',
        '- **No `any`.** Use `unknown` and narrow the type. Declare explicit parameter and return types on public APIs.',
        '- **No mutation.** Return new objects. Never mutate input objects in place.',
        '- **Validate all numeric IDs** as positive integers before any network call.',
        '  Import `validateId` from `../validation.js` and call `validateId(id, "name")`.',
        '  Validate plan-entry UUIDs with `validateEntryId` from the same module (SEC #29).',
        '- **Validate CLI write payloads with Zod** schemas in `src/schemas/*.ts`',
        '  (re-exported through `src/schemas.ts`).',
        '  The SDK uses these schemas for compile-time types only.',
        '  The CLI validates write payloads at runtime.',
        '  For example, a new result requires at least one of `status_id`, `comment`, or `assignedto_id`.',
        '  Call `.parse(input)` on the exported schema to validate dynamic SDK inputs at runtime.',
        '  `custom_*` fields pass through `.passthrough()` unchanged.',
        '  Schemas do not coerce types (`"5"` does not convert to `5`).',
        '- **Caching**: The client caches GET responses in memory for 5 minutes by default.',
        '  Any successful write clears the entire cache. `get*Page()` caches pages in a separate strict',
        '  namespace. `getAll*()` bypasses cache reads, cache writes, and in-flight sharing.',
        '  In-flight request sharing requires matching header and body timeouts.',
        '- **Pagination**: 24 list endpoints provide three methods.',
        '  `get*()` returns the item array from one response.',
        '  `get*Page()` returns `Page<T>` with envelope metadata.',
        '  `getAll*()` follows validated `_links.next` continuations within page, item, duration, and byte limits.',
        '  Aggregate reads never return partial results. Bare arrays stop after one page.',
        '- **CLI response validation**: Entity-field mismatches print a redacted warning by default.',
        '  Pass `--strict-responses` or set `TESTRAIL_STRICT_RESPONSES=1` to fail on the first mismatch.',
        '  Warnings include only the HTTP method, CLI command, and masked issue paths.',
        '- **Retry policy**: Ordinary GET requests retry on 5xx, 429, and network errors with exponential backoff.',
        '  Report execution GETs and write requests (POST, PUT, DELETE) retry only on 429 to prevent duplicate operations.',
        '  Multipart uploads never retry. The client honors the `Retry-After` header.',
        '- **Redirects**: Every request sets `redirect: "manual"`. The client rejects all 3xx',
        '  responses with `TestRailApiError` and never caches them.',
        '- **Response-body limits**: The client enforces a 10 MiB limit for JSON/text responses.',
        '  Binary responses have a 100 MiB limit. A wall-clock deadline limits each body read.',
        '- **Lifecycle**: Call `client.destroy()` when finished. The CLI registers process signal handlers automatically.',
        '',
        '## Error model',
        '',
        '| Class                     | Thrown when                                                       |',
        '| ------------------------- | ----------------------------------------------------------------- |',
        '| `TestRailApiError`        | HTTP, network, or protocol error, including malformed list outer structure |',
        '| `TestRailPaginationError` | Malformed page or continuation, or exceeded pagination safety limit |',
        '| `TestRailValidationError` | Invalid configuration, ID, or parameter                           |',
        '',
        '`TestRailPaginationError` extends `TestRailValidationError` and adds',
        '`reason`, `pagesFetched`, and `itemsFetched`.',
        '',
        'A throwing `onSchemaMismatch` hook runs before downstream list or page decoders.',
        'Never treat a hook error as proof that a write did not execute on the server.',
        '',
        'The CLI exits with code `0` on success and non-zero on failure. Most errors exit with `1`.',
        'A destructive command without `TESTRAIL_ALLOW_DESTRUCTIVE=1` exits with `2`.',
        'The CLI writes JSON output to `stdout` and `Error: <message>` to `stderr`.',
        '',
        '## Destructive actions',
        '',
        'All destructive CLI commands require both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`:',
        '',
        actions
            .filter((a) => a.destructive === true)
            .map((a) => `- \`${a.resource} ${a.action}\``)
            .join('\n'),
        '',
        '`--dry-run` always overrides `--yes` and previews the action locally without calling the API.',
        '`--soft` sends `soft=1` to TestRail to preview affected item counts on supported delete commands.',
        '',
        '## Authentication',
        '',
        '- **Never** pass the API key on `argv`. `--api-key <key>` was removed in v3.0',
        '  because command-line arguments are visible to other local processes and logs.',
        '- Use the `TESTRAIL_API_KEY` environment variable. If you cannot use an environment',
        '  variable, pipe the key via `stdin`: `echo "$KEY" | npx testrail … --api-key-stdin`.',
        '- Because `--api-key-stdin` reads `stdin`, pass write payloads with `--data` or `--data-file`.',
        '',
        '## DO NOT',
        '',
        '- Do not add runtime dependencies other than Zod.',
        '- Do not use `any`. Use `unknown` and narrow the type.',
        '- Do not mutate objects in place. Return new objects.',
        '- Do not hardcode numeric constants; use `src/constants.ts`.',
        '- Do not call `request()` without validating IDs first.',
        '- Do not pass the API key on `argv`.',
        '- Do not skip `npm run typecheck` before committing.',
        '- Do not manually edit `CODEMAP.md`, `docs/API-MAPPING.md`, `skill/reference/payload-schemas.yaml`, or `AGENTS.md`.',
        '  Do not manually edit generated sections in `skill/SKILL.md` or `skill/reference/commands.md`.',
        '  Run the matching `npm run` generator script after editing source files.',
        '',
        '## See also',
        '',
        '- [CONTRIBUTING.md](CONTRIBUTING.md): Setup, verification, and contributor conventions',
        '- [CLAUDE.md](CLAUDE.md): Implementation rules and endpoint procedures',
        '- [skill/SKILL.md](skill/SKILL.md): Installed CLI agent guidance and references',
        '- [CODEMAP.md](CODEMAP.md): Generated index of public methods, types, errors, and constants',
        '- [docs/API-MAPPING.md](docs/API-MAPPING.md): Endpoint, SDK, CLI, and recipe coverage',
        '- [README.md](README.md): Installation and quick starts',
        '- [docs/SDK.md](docs/SDK.md): SDK configuration, lifecycle, and response handling',
        '- [docs/CLI.md](docs/CLI.md): CLI authentication, payloads, output, and diagnostics',
        '- [docs/NETWORKING.md](docs/NETWORKING.md): Private servers, DNS, proxies, and certificates',
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
        '> Vendor-neutral instructions for AI coding agents working in this',
        '> repository. Follows the [agents.md](https://agents.md/) specification.',
        '',
        '## Project: `@dichovsky/testrail-api-client`',
        '',
        renderRulesBody(actions),
        '## Build / verify commands',
        '',
        '```bash',
        'npm run verify                 # Build, static/drift checks, coverage, package smoke',
        'npm test                       # Vitest suite only (no implicit pre-hook)',
        'npm run test:coverage          # Coverage report',
        'npm run build                  # Compile to dist/',
        'npm run lint                   # Oxlint (type-aware)',
        'npm run typecheck              # Native TypeScript 7 check',
        'npm run codemap                # Regenerate CODEMAP.md',
        'npm run mapping                # Regenerate docs/API-MAPPING.md',
        'npm run skill                  # Regenerate skill/SKILL.md + reference/',
        'npm run agents-md              # Regenerate AGENTS.md',
        '```',
        '',
        'Run `npm run verify` to execute all local checks. `.npmrc` disables implicit',
        'pre and post hooks, so `npm test` does not run static or drift checks.',
        'CI runs the `*:check` scripts for every generator and fails on drift.',
        'After you change `src/cli/metadata/*.ts`, `src/schemas/*.ts`, or any',
        'module method JSDoc tag, regenerate all artifacts.',
        '',
    ].join('\n');
}
