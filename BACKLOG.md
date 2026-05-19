# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to BACKLOG-ARCHIVE.md.

Archive file: [`BACKLOG-ARCHIVE.md`](BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🖥️ CLI / Skill

- [ ] 🟢 📦 CLI: `user add` / `user update` (7.3+; password UX unresolved — superseded by endpoint items below)
- [ ] 🟡 📦 CLI: `case add-bulk`
- [ ] 🟢 📦 CLI: `--format yaml`
- [ ] 🟢 📦 CLI: `--format csv`
- [ ] 🟡 📦 CLI: `run watch <run_id>`
- [ ] 🟢 📦 CLI: binary stdin upload
- [ ] 🟢 📦 CLI: binary stdout download
- [ ] 🟡 📦 CLI: pagination on `attachment list-for-*`
- [ ] 🟡 ♻️ CLI: streaming upload for large files
- [ ] 🟢 📦 CLI: destructive env-var gate (`TESTRAIL_ALLOW_DESTRUCTIVE=1`)
- [ ] 🟡 📦 SKILL: programmatic TS API recipes
- [ ] 🟢 📦 SKILL: `.cursor/rules/testrail.mdc`
- [ ] 🟢 📦 SKILL: Continue rules
- [ ] 🟢 📦 SKILL: generic `AGENTS.md`
- [ ] 🔴 📦 SKILL: localization (non-English)
- [ ] 🟢 📦 SKILL: `testrail uninstall-skill`
- [ ] 🟡 📦 SKILL: multi-version skill management
- [ ] 🟡 📦 SKILL: Claude Code marketplace publish

### API coverage gaps (from `docs/API-MAPPING.md`; ⚠️ = destructive, `--yes` gate required)

#### 🔴 P0 — daily-use endpoints

- [ ] 🔴 📦 CLI: `run update` (POST `update_run/{run_id}`)
- [ ] 🔴 📦 CLI: `test get` (GET `get_test/{test_id}`)
- [ ] 🔴 📦 CLI: `test list` (GET `get_tests/{run_id}`)
- [ ] 🔴 📦 CLI: `result list-for-test` (GET `get_results/{test_id}`)
- [ ] 🔴 📦 CLI: `result list-for-case` (GET `get_results_for_case/{run_id}/{case_id}`)
<!-- `get_results_for_run/{run_id}` is already covered by the existing `result list` CLI command.
     `add_result_for_case/{run_id}/{case_id}` is already covered by the existing `result add` CLI command.
     See docs/API-MAPPING.md (Results section) for the binding. -->

- [x] 🔴 📦 CLI: `plan add-run-to-entry` (POST `add_run_to_plan_entry/{plan_id}/{entry_id}`)
- [x] 🔴 📦 CLI: `plan update-entry` (POST `update_plan_entry/{plan_id}/{entry_id}`)
- [x] 🔴 📦 CLI: `plan update-run-in-entry` (POST `update_run_in_plan_entry/{run_id}`)
- [ ] 🔴 📦 ⚠️ CLI: `plan close` (POST `close_plan/{plan_id}`)
- [ ] 🔴 📦 ⚠️ CLI: `plan delete` (POST `delete_plan/{plan_id}`)
- [ ] 🔴 📦 ⚠️ CLI: `plan delete-entry` (POST `delete_plan_entry/{plan_id}/{entry_id}`)
- [ ] 🔴 📦 ⚠️ CLI: `plan delete-run-from-entry` (POST `delete_run_from_plan_entry/{run_id}`)
- [ ] 🔴 📦 SKILL recipe: Plan entries lifecycle (add → add-run → update → delete cascade)
- [ ] 🔴 📦 SKILL recipe: Results pipeline — choosing per-test vs per-case vs bulk endpoints

#### 🟡 P1 — common metadata & admin

- [ ] 🟡 📦 CLI: `report list` (GET `get_reports/{project_id}`)
- [ ] 🟡 📦 CLI: `report run` (GET `run_report/{report_template_id}`)
- [ ] 🟡 📦 CLI: `shared-step add` (POST `add_shared_step/{project_id}`)
- [ ] 🟡 📦 CLI: `shared-step update` (POST `update_shared_step/{shared_step_id}`)
- [ ] 🟡 📦 ⚠️ CLI: `shared-step delete` (POST `delete_shared_step/{shared_step_id}`)
- [ ] 🟡 📦 CLI: `configuration list` (GET `get_configs/{project_id}`)
- [ ] 🟡 📦 CLI: `configuration-group add` (POST `add_config_group/{project_id}`)
- [ ] 🟡 📦 CLI: `configuration-group update` (POST `update_config_group/{config_group_id}`)
- [ ] 🟡 📦 ⚠️ CLI: `configuration-group delete` (POST `delete_config_group/{config_group_id}`)
- [ ] 🟡 📦 CLI: `configuration add` (POST `add_config/{config_group_id}`)
- [ ] 🟡 📦 CLI: `configuration update` (POST `update_config/{config_id}`)
- [ ] 🟡 📦 ⚠️ CLI: `configuration delete` (POST `delete_config/{config_id}`)
- [ ] 🟡 📦 CLI: `variable list` (GET `get_variables/{project_id}`)
- [ ] 🟡 📦 CLI: `variable add` (POST `add_variable/{project_id}`)
- [ ] 🟡 📦 CLI: `variable update` (POST `update_variable/{variable_id}`)
- [ ] 🟡 📦 ⚠️ CLI: `variable delete` (POST `delete_variable/{variable_id}`)
- [ ] 🟡 📦 CLI: `case-field list` (GET `get_case_fields`)
- [ ] 🟡 📦 CLI: `result-field list` (GET `get_result_fields`)
- [ ] 🟡 📦 CLI: `status list` (GET `get_statuses`)
- [ ] 🟡 📦 CLI: `template list` (GET `get_templates/{project_id}`)
- [ ] 🟡 📦 SKILL recipe: Bulk case delete with `--soft` server-side preview
- [ ] 🟡 📦 SKILL recipe: Configuration groups & configs hierarchy management

#### 🟢 P2 — admin & low-traffic endpoints

- [ ] 🟢 📦 CLI: `group get` (GET `get_group/{group_id}`)
- [ ] 🟢 📦 CLI: `group list` (GET `get_groups`)
- [ ] 🟢 📦 CLI: `group add` (POST `add_group`)
- [ ] 🟢 📦 CLI: `group update` (POST `update_group/{group_id}`)
- [ ] 🟢 📦 ⚠️ CLI: `group delete` (POST `delete_group/{group_id}`)
- [ ] 🟢 📦 CLI: `dataset get` (GET `get_dataset/{dataset_id}`)
- [ ] 🟢 📦 CLI: `dataset list` (GET `get_datasets/{project_id}`)
- [ ] 🟢 📦 CLI: `dataset add` (POST `add_dataset/{project_id}`)
- [ ] 🟢 📦 CLI: `dataset update` (POST `update_dataset/{dataset_id}`)
- [ ] 🟢 📦 ⚠️ CLI: `dataset delete` (POST `delete_dataset/{dataset_id}`)
- [ ] 🟢 📦 CLI: `user get-by-email` (GET `get_user_by_email`)
- [ ] 🟢 📦 CLI: `user get-current` (GET `get_current_user`)
- [ ] 🟢 📦 CLI: `role list` (GET `get_roles`)
- [ ] 🟢 📦 CLI: `priority list` (GET `get_priorities`)
- [ ] 🟢 📦 CLI: `case-type list` (GET `get_case_types`)
- [ ] 🟢 📦 SKILL recipe: Shared step propagation + history audit
- [ ] 🟢 📦 SKILL recipe: Data-driven runs via Variables + Datasets

## 🔒 Security

- [ ] 🟡 🐛 SEC #5: TOCTOU symlink-clobber on install target (`cli/install-skill.ts`)
- [ ] 🟡 🐛 SEC #7: TOCTOU symlink-follow on attachment upload (`cli/file-input.ts`)
- [ ] 🟢 🐛 SEC #14: Mutable cached references let callers poison future reads
- [ ] 🟢 🐛 SEC #15: IPv6 SSRF allowlist gaps (`fec0::/10`, `2002::/16`, `64:ff9b::/96`)
- [ ] 🟡 🐛 SEC #17: `--data-file` follows symlinks with no size cap
- [ ] 🟢 🐛 SEC #19: `mkdirSync` omits explicit mode under permissive umask
- [ ] 🟢 🐛 SEC #20: `baseUrl` accepts embedded userinfo
- [ ] 🟢 🐛 SEC #22: Prototype-chain property access crashes dispatch
- [ ] 🟢 🐛 SEC #23: Identical GETs stampede into parallel upstream calls
- [ ] 🟢 🐛 SEC #24: stdin wall-clock deadline still missing (size cap shipped)
- [ ] 🟢 🐛 SEC #26: `allowInsecure: true` lacks runtime warning / audit trail
- [ ] 🟢 🐛 SEC #28: throwing `destroy()` aborts cleanup of later clients
- [ ] 🟡 🐛 SEC #29: `validateEntryId` accepts any non-empty string

## 🏗️ Architecture

- [ ] 🟡 ♻️ ARCH #1: Extract `HttpPipeline` seam — collapse `request<T>`/`requestText`/`requestMultipart`/`requestBinary` (`client-core.ts`) into one pipeline + four response-parser adapters; concentrate retry-eligibility matrix
- [ ] 🟢 ♻️ ARCH #2: Write-handler factory — collapse 10 `cli/handlers/*-write.ts` files (36 handlers, 732 LOC) into declarative specs over a `createWriteHandler({pathParams, schema, clientMethod, destructive?})` factory; identical 4-step dance (parseId × N → resolveBody → dry-run branch → client call) repeated per handler
- [ ] 🟡 ♻️ ARCH #3: Promote `ACTIONS` (`cli/metadata.ts`, 607 LOC) to single source of truth — generate `dispatch.ts` HANDLERS (175 LOC) and `cli/index.ts` HELP text from it; new actions today require 3+ edit sites (handler + dispatch + metadata + HELP), drift caught only by tests not types
- [ ] 🟡 ♻️ ARCH #4: `Endpoint` registry — colocate method/URL/payload-schema/response-schema per endpoint; generate `modules/*.ts` methods and CLI handlers as adapters (depends on #2 + #3)
- [ ] 🟢 ♻️ ARCH #5: Revisit thin `modules/*.ts` wrappers — `variables.ts` (27 LOC), `reports.ts` (17), `datasets.ts` (32), `tests.ts` (33): every method is `validateId` + `requestParsed`/`request`, zero orchestration; collapses naturally once #4 lands; standalone value low
- [ ] 🟢 ♻️ ARCH #6: Extract pure helpers (`validateId`/`validateEntryId`/`validatePaginationParams`/`buildEndpoint` at `client-core.ts:444-493`) into standalone modules — they don't read `this`; today every caller needs a `TestRailClientCore` reference; would also let `cli/ids.ts:parseId` reuse the rule instead of duplicating it
- [ ] 🟡 ♻️ ARCH #7: Eliminate hand-written 1517-line facade (`client.ts`) — 131 `async` wrapper methods forwarding to 18 modules; either deprecate flat surface in favor of namespaced (`client.projects.getProject`) or generate the facade from module signatures at build time; contradicts ARCHITECTURE.md §3.2 — reopen because JSDoc/types are no longer the load-bearing reason (modules carry the same)
- [ ] 🟢 ♻️ ARCH #8: Fix `scripts/generate-mapping.js` Phase 1 parser — detect `buildEndpoint(base, params)` call sites and replace CLI name-heuristic; today `docs/API-MAPPING.md` shows `—` for implemented endpoints (e.g. `get_cases`, `get_runs`, `result:list`, `shared-step:history`); add `@testrail` JSDoc tags + `apiEndpoint` field on `ActionSpec` per the doc's caveat; turn on CI drift gate

## 🧪 QA / Verification

- [ ] 🟡 🧪 QA: snapshot test for recipe code blocks
- [ ] 🟢 🧪 QA: separate CI job for skill-generation drift
- [ ] 🟢 🧪 QA: coverage delta enforcement (98% floor)
- [ ] 🟡 🧪 QA: CLI fuzz tests
