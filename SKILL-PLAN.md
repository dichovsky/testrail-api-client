# SKILL-PLAN — Publish `testrail-cli` Skill alongside npm Package

## Goal

Publish a Claude Code skill (`testrail-cli`) bundled inside the
`@dichovsky/testrail-api-client` npm package that teaches coding agents how to
use the `testrail` CLI to query **and write** TestRail entities. The skill
installs into a project (or global) Claude Code skills directory via a new
`testrail install-skill` CLI subcommand.

This requires first extending the CLI from read-only (current state) to include
6 write actions, because the skill must never document commands that don't
exist.

## Out of Scope (tracked in `BACKLOG.md`)

The full deferred list is captured in `BACKLOG.md` (created in PR 1). Notable
deferrals: project/suite/section/plan/milestone/user writes, all deletes,
attachment upload, bulk writes beyond `result add-bulk`, non-Claude-Code agent
formats (Cursor, Continue), output formats beyond `json`/`table`, interactive
prompts, telemetry, postinstall hooks, symlink install mode, localization.

## Architectural Decisions (locked during interview)

| #    | Decision                                                                                                                                                                             | Rationale                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Q1   | Claude Code skill format only                                                                                                                                                        | Native auto-load via `description` matching; one well-supported format beats three half-baked ones |
| Q2   | CLI surface only (no programmatic API in skill)                                                                                                                                      | Programmatic users have `README` + `CODEMAP`; skill stays focused                                  |
| Q3   | `name: testrail-cli`, write-verb-inclusive description                                                                                                                               | Trigger fires for both read and write intents                                                      |
| Q4–5 | ~12 hand-written recipes, 3 use `jq` with Node fallback documented once                                                                                                              | Context budget protection at the shell                                                             |
| Q6   | 6 write actions: `case add/update`, `result add/add-bulk`, `run add/close`                                                                                                           | Covers the two anchor workflows (author cases; publish CI results)                                 |
| Q7   | Body input via `--data` / `--data-file` / stdin (mutually exclusive) + `--dry-run` + positional path params; no value coercion                                                       | Agents produce JSON natively; one mechanism uniform across actions                                 |
| Q8   | Zod payload schemas in `src/schemas.ts` are source of truth; `z.infer` derives TS types; redundant interfaces removed from `src/types.ts`                                            | Matches existing response-schema pattern in repo; eliminates drift                                 |
| Q9   | Extract `src/cli/` directory with per-resource handlers before adding writes                                                                                                         | Avoids landing 600-LOC monolith; enables isolated handler tests                                    |
| Q10  | Hybrid skill generation: sentinel-delimited generated sections (command table, payload schemas) + hand-written recipes/prose; mirrors existing `scripts/generate-codemap.js` pattern | Drift impossible on mechanical content; recipes stay judgment-driven                               |
| Q11  | `install-skill`: `--project` default, copy (no symlink), fail-by-default + `--force`, `--print-path` flag                                                                            | Cross-platform, predictable, safe                                                                  |
| Q12  | Tier C testing: unit per handler + body-source isolation + subprocess integration + generator tests (~58 new cases); maintain 98%+ coverage                                          | Project bar > global bar                                                                           |
| Q13  | Frontmatter: `name`, `description`, `version`, `license`, `homepage`; skill version always equals package version                                                                    | Auto-derivable; agents can verify alignment                                                        |

## Release Sequence — 4 PRs, then v2.1.0

### PR 1 — CLI refactor + BACKLOG.md (shipped on `feat/cli-refactor-and-backlog`)

Pure refactor in spirit; two small defensive fixes folded in after Copilot review surfaced pre-existing edge cases preserved by the move (see commit `7050e84` and below).

**Files added:**

- `src/cli/index.ts` — thin entrypoint: arg parse, dispatch, auth resolution, handler invocation (wrapped in `async main()` to prevent fall-through after `process.exit()` in test contexts)
- `src/cli/auth.ts` — env-var + `--flag` resolution; fail-fast on missing
- `src/cli/output.ts` — JSON/table renderers (moved from `cli.ts`); guards both output paths against pathological inputs: `valueToString` wraps `JSON.stringify` in try/catch with `[Object]` fallback, `renderTable` accesses row fields via a defensive helper that handles `null`/primitive rows, and `createOutput`'s `--format json` path delegates to `safeJsonStringify` which falls back to a structured `{ error: 'unserializable', message }` JSON object on circular refs or nested `BigInt`
- `src/cli/ids.ts` — `parseId` (throws `IdParseError`), `optInt` (moved from `cli.ts`)
- `src/cli/dispatch.ts` — single `HANDLERS` map (resource:action → handler) replaces the prior `switch`; the allowed-resource and allowed-action-per-resource lists are derived from the map's keys, so adding a new handler entry automatically updates dispatch behavior and error messages with no parallel registry to keep in sync
- `src/cli/handler-context.ts` — shared `HandlerArgs` / `HandlerContext` / `Handler` types
- `src/cli/handlers/{project,suite,case,run,result,milestone,user}.ts` — one async handler per resource:action
- `BACKLOG.md` — checkbox-grouped deferred items
- `tests/cli-helpers.test.ts` — direct unit tests for the extracted helpers (symbol/function `valueToString`, `parseId` boundaries, `resolveAuth` precedence, `dispatch` error wording, defensive guards)

**Files modified:**

- `src/cli.ts` → 1-line re-export of `src/cli/index.ts` (preserves `bin` entry, `./cli` subpath export, and `tests/cli.test.ts` import path)

`package.json` was **not** modified — `files: ["dist", ...]` already ships every subdirectory under `dist/`, so the new `dist/cli/` tree is published automatically.

**Tests:** 462 existing tests stay green; +41 new unit tests in `cli-helpers.test.ts` (extracted-helper edge cases + defensive-guard coverage). Total: 503. Coverage 98.05%.

**Risks (now resolved):**

- Import cycles → avoided by injecting `out`/`err` via `HandlerContext` instead of module-level imports
- `process.exit()` fall-through in tests → eliminated by wrapping the entrypoint in `async main()` with explicit `return` after each exit

**Deferred to follow-up (see `BACKLOG.md`):**

- Stricter numeric parsing in `parseId`/`optInt` (reject `'1e3'`, `'0x10'`) — tightening accept/reject semantics is a minor breaking change, doesn't belong in a refactor PR.

### PR 2 — Payload schemas as source of truth

**Files modified:**

- `src/schemas.ts` — add `AddCasePayloadSchema`, `UpdateCasePayloadSchema`, `AddRunPayloadSchema`, `UpdateRunPayloadSchema`, `AddResultPayloadSchema`, `AddResultsForCasesPayloadSchema`, `AddResultForCasePayloadSchema` using existing `zObject` (`.passthrough()`) helper
- `src/types.ts` — delete the 7 handwritten payload interfaces
- `src/index.ts` — re-export `z.infer` types under the original interface names (backwards compatible)

**Tests:** all existing tests must still pass; add schema-validation tests for valid input / missing required / unknown `custom_*` passthrough.

**Risks:** internal use sites of deleted interfaces — surfaced by `npm run typecheck` (already in `prepublishOnly`).

### PR 3 — CLI write actions

**Files added:**

- `src/cli/body.ts` — body-source resolution: `--data` | `--data-file` | stdin; mutex enforcement; JSON parse; Zod validation
- `src/cli/handlers/case-write.ts` — `case add`, `case update`
- `src/cli/handlers/result-write.ts` — `result add`, `result add-bulk`
- `src/cli/handlers/run-write.ts` — `run add`, `run close`
- `src/cli/metadata.ts` — single source describing every resource×action: `{ resource, action, path_params, body_schema, summary }`. Consumed by both the dispatcher and the skill generator (Q10 source of truth)

**Files modified:**

- `src/cli/dispatch.ts` — register the 6 new handlers
- `src/cli/index.ts` — add new flags to `parseArgs`: `--data`, `--data-file`, `--dry-run`
- `CLAUDE.md` — append "Add CLI write action" workflow to Common Tasks

**Tests:**

- `tests/cli-handlers.test.ts` (new) — ~30 cases: happy + Zod reject + dry-run per handler
- `tests/cli-body-source.test.ts` (new) — ~10 cases: each source, mutex, malformed JSON
- `tests/cli.test.ts` (extend) — ~6 subprocess cases

**Risks:** stdin handling in tests — use `vitest`'s `stdin` mock or temp pipes.

### PR 4 — Skill bundle + install subcommand + drift check

**Files added:**

- `skill/SKILL.md` — frontmatter + 10 sections + sentinel-delimited generated regions + 12 hand-written recipes
- `scripts/generate-skill.js` — reads `src/schemas.ts` + `src/cli/metadata.ts`; renders command table + payload-schema sections between `<!-- GENERATED:* -->` sentinels
- `src/cli/handlers/install-skill.ts` — file-copy logic; flags `--global`, `--project` (default), `--force`, `--print-path`, `--quiet`; resolves bundled `SKILL.md` via `import.meta.url`
- `tests/generate-skill.test.ts` (new) — ~6 cases: fixture render, sentinel mismatch error, idempotency
- `tests/cli.test.ts` (extend) — ~6 cases: install-skill to tmpdir, refuse-overwrite, `--force`, `--print-path`

**Files modified:**

- `package.json`:
    - `files`: add `"skill"`
    - `scripts`: add `"skill": "node scripts/generate-skill.js"`; `pretest` runs `skill` then `git diff --exit-code skill/SKILL.md`
    - `version`: bump to `2.1.0`
- `README.md` — add "Using with AI coding agents" section: document `npx testrail install-skill`, link to the bundled skill, mention auto-load trigger
- `src/cli/dispatch.ts` — register `install-skill` handler
- `src/cli/index.ts` — register new flags (`--global`, `--force`, `--print-path`)

**Risks:**

- Generator non-determinism (key ordering, line endings). Mitigation: sorted keys, forced LF.
- `git diff --exit-code` blocks contributors who forgot to run `npm run skill`. Mitigation: clear `pretest` failure message pointing at `npm run skill`.

### Release v2.1.0

After PR 4 merges:

1. `npm run prepublishOnly` (full check: typecheck + lint + tests + build + clean maps + generator-diff)
2. Tag `v2.1.0`
3. `npm publish`
4. Smoke test: `npx -p @dichovsky/testrail-api-client@2.1.0 testrail install-skill --print-path`

## Risks & Mitigations

| Risk                                                             | Severity                   | Mitigation                                                                 |
| ---------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| CLI refactor breaks downstream importers of `src/cli.ts` exports | Low — undocumented surface | Keep `src/cli.ts` as 1-line re-export                                      |
| Zod schema migration changes public type shape                   | Medium                     | `tsc --noEmit` in `prepublishOnly`; if shape genuinely changes, bump 3.0.0 |
| Generator non-determinism on Windows                             | Medium                     | Force LF; sort all keys; CI on macOS + Linux                               |
| Skill `description` over- or under-triggers                      | Medium                     | Iterate post-release; cheapest thing to change                             |
| Agents pass strings instead of numbers in JSON                   | Low                        | Q8: reject (no coercion); clear Zod error                                  |
| `jq` not installed in user environment                           | Low                        | Skill shows Node fallback; only 3 of 12 recipes use `jq`                   |

## Definition of Done

- [ ] All 4 PRs merged to `main`
- [ ] `npm test` passes; coverage ≥98%
- [ ] `npm run prepublishOnly` succeeds locally and in CI
- [ ] `BACKLOG.md` reflects every Q13 out-of-scope item
- [ ] `README.md` documents `testrail install-skill`
- [ ] Smoke test from `npx` against the published version produces a valid `.claude/skills/testrail-cli/SKILL.md`
- [ ] Manual end-to-end: install skill in a sample project; Claude Code auto-loads it when asked to query TestRail; agent runs `testrail` commands successfully
