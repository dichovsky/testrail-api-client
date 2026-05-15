# BACKLOG

Deferred work items captured during the v2.1.0 skill-publishing design
(`SKILL-PLAN.md`). Each item is intentionally **not** in v2.1.0; this file is
the registry that prevents silent scope creep and gives future PRs a starting
point.

Conventions:

- `[ ]` open · `[x]` shipped · `[~]` partially shipped · `[!]` decided **won't
  do** (kept for the explicit "no")
- **Effort**: S (≤½ day) · M (1–2 days) · L (1+ week)
- **Trigger**: what would justify pulling this into a release

---

## CLI write surface — structural setup

These map to existing `TestRailClient` methods but aren't exposed in the v2.1
CLI. v2.1 ships only the 6 actions that cover _author cases_ and _publish
results_; structural setup is rare per-project work that humans typically do
once via the TestRail UI.

- [ ] **`project add` / `project update`** — `addProject` / `updateProject`. **Effort:** S. **Trigger:** multi-tenant agent provisioning workflows.
- [ ] **`suite add` / `suite update`** — `addSuite` / `updateSuite`. **Effort:** S. **Trigger:** agents bootstrapping greenfield TestRail projects.
- [ ] **`section add` / `section update`** — `addSection` / `updateSection`. **Effort:** S. **Trigger:** agents authoring large batches of cases that need new sections.
- [ ] **`milestone add` / `milestone update`** — `addMilestone` / `updateMilestone`. **Effort:** S. **Trigger:** release-coordination automations.
- [ ] **`user add` / `user update`** — `addUser` / `updateUser`. **Effort:** S. **Trigger:** identity-provisioning workflows. Note: TestRail 7.3+ only.
- [x] **`plan add` / `plan update` / `plan add-entry`** — `addPlan` / `updatePlan` / `addPlanEntry`. Shipped together with `plan get` / `plan list` (the 5 actions closed plan's read/write asymmetry). Plan payload schemas migrated from handwritten interfaces in `types.ts` to Zod in `schemas.ts` (matches the precedent for run/case/result payloads). Nested `entries[]` are fully Zod-validated; nested `runs[]` inside an entry use a separate `PlanEntryRunPayloadSchema` (all fields optional, including `name`) since TestRail derives the run name from the config. `plan close`, `plan delete`, `plan-entry update`, `plan-entry delete` remain deferred — the last two also need a UUID-style string-ID parser (`entry_id` is a string, not a number).

## CLI write surface — destructive operations

Deliberately omitted from v2.1 to keep agents away from irrecoverable actions
without explicit human review. Programmatic API still exposes them.

- [ ] **`case delete`** — `deleteCase`. **Effort:** S. **Trigger:** explicit user demand; consider gating behind `--yes` or a confirmation env var.
- [ ] **`run delete`** — `deleteRun`. **Effort:** S. **Trigger:** same.
- [ ] **`suite delete` / `section delete` / `milestone delete` / `project delete`** — corresponding client methods. **Effort:** S each. **Trigger:** same.
- [ ] **`result delete`** — N/A (TestRail API doesn't support deleting individual results). Will not implement.

## CLI write surface — bulk operations

v2.1 ships `result add-bulk` because results are inherently many-per-run.
Other bulk endpoints are deferred.

- [ ] **`case add-bulk`** — multi-case authoring in one call. **Effort:** M (payload validation, partial-failure semantics). **Trigger:** agents generating cases from large spec files.
- [ ] **`run add-bulk`** — N/A (TestRail API doesn't expose bulk run creation). Won't implement.

## CLI feature extensions

- [ ] **Output format: `yaml`** — `--format yaml`. **Effort:** S (requires a dep or hand-rolled emitter). **Trigger:** Kubernetes-adjacent workflows.
- [ ] **Output format: `csv`** — `--format csv`. **Effort:** S. **Trigger:** spreadsheet-import use cases.
- [x] **Attachment upload** — `addAttachmentToCase`, `addAttachmentToResult`, etc. Shipped as `attachment add-to-case|result|run|plan|plan-entry --file <path> [--filename <name>]`. Actual effort was S+ (the programmatic multipart code path already existed in `client-core.ts`).
- [x] **Attachment download** — `getAttachment`. Shipped as `attachment get <id> --out <path> [--force]`. Refuses to overwrite without `--force`.
- [ ] **Watch mode** — `testrail run watch <run_id>` polling until completion. **Effort:** M. **Trigger:** CI orchestrators waiting on async test execution.
- [!] **Interactive prompts** — `--interactive` mode for human input. **Won't do.** Conflicts with agent/scripting target audience; humans should use the TestRail web UI.
- [!] **Telemetry / usage analytics** — **Won't do.** Conflicts with zero-dependency ethos; user-hostile.

## Attachment surface — deferred follow-ups

Shipped in the v2.2 attachment-surface PR: 11 read/write/download actions + `attachment delete` (gated by `--yes`). The destructive-ops gating pattern (`--yes` flag; `--dry-run` wins) was locked in here and is now the precedent for all future delete actions.

- [ ] **Binary stdin upload** — `cat foo.png | attachment add-to-case 42 --filename foo.png`. **Effort:** S (handle binary stdin platform issues; require `--filename`). **Trigger:** agents that pipe artifacts from another tool without a temp file. Currently the CLI suppresses stdin when `--file` is set; we'd reverse that gate.
- [ ] **Binary stdout download** — `attachment get 42 --out -` to stream to stdout for piping (e.g. `| sha256sum`). **Effort:** S. **Trigger:** Unix-y shell composition use cases. Requires `isTTY` refusal to prevent terminal corruption.
- [ ] **Pagination on `attachment list-for-*`** — programmatic methods don't currently accept `limit`/`offset`. **Effort:** S+ (extend programmatic API first, then CLI flags). **Trigger:** cases/runs with hundreds of attachments hitting TestRail's default page size.
- [ ] **Streaming upload for very large files** — `--file` currently buffers fully into a `Uint8Array`. TestRail accepts up to 256 MB. **Effort:** M (route around the existing `requestMultipart` which expects `Blob | Uint8Array`). **Trigger:** real-world memory pressure on CI runners.
- [ ] **Destructive-ops env-var alternative** — accept `TESTRAIL_ALLOW_DESTRUCTIVE=1` as an alternative to `--yes`. **Effort:** S. **Trigger:** documented user request from CI environments that prefer env-var-based gating. (Currently `--yes` is the only path; chose flag-only in v2.2 design for per-command audit clarity.)

## Skill scope expansion

- [ ] **Programmatic TypeScript API recipes in the skill** — current skill is CLI-only by design (Q2). **Effort:** M (substantial content; would double skill length). **Trigger:** real demand from agents that import the package rather than shell out.
- [ ] **Cursor rules file (`.cursor/rules/testrail.mdc`)** — same content as `SKILL.md`, Cursor format. **Effort:** S (port + new generator output). **Trigger:** documented user request from Cursor users.
- [ ] **Continue rules** — same. **Effort:** S. **Trigger:** same.
- [ ] **Generic `AGENTS.md`** — a flat markdown variant for arbitrary agents. **Effort:** S (mostly the same content). **Trigger:** user request.
- [ ] **Localization (non-English)** — translate skill body. **Effort:** L (translation + per-language generator). **Trigger:** documented non-English user base.

## `install-skill` enhancements

- [!] **Symlink install option** — **Won't do** (Q11). Windows permission issues; broken-symlink edge cases; install is fast enough to rerun on update.
- [!] **`postinstall` auto-install hook** — **Won't do** (Q11). Anti-pattern: runs without consent, breaks CI, hits users who don't use Claude Code.
- [ ] **`testrail uninstall-skill`** — remove installed skill file. **Effort:** S. **Trigger:** user feedback that manual `rm` is friction.
- [ ] **Multi-version skill management** — e.g., side-by-side skill installs for multiple installed package versions. **Effort:** M. **Trigger:** monorepos pinning different versions.
- [ ] **Claude Code plugin marketplace publish** — separate distribution channel. **Effort:** M (process + metadata). **Trigger:** if a Claude Code marketplace launches that makes this the canonical distribution mechanism.

## Drift detection — beyond generator diff

The v2.1 plan locks in hybrid generation with `<!-- GENERATED -->` sentinels +
`prepublishOnly` diff check. Stronger guarantees are deferred.

- [ ] **Snapshot test for recipe code blocks** — parse SKILL.md, extract fenced `bash` blocks, run each against the binary with `fetch` mocked, assert exit codes. **Effort:** M. **Trigger:** a regression where a recipe drifts despite the schema-level generator catching most things.
- [ ] **Generator runs in CI separately from `pretest`** — explicit GitHub Action that fails the PR with a clear "run `npm run skill`" message. **Effort:** S. **Trigger:** contributor confusion about the existing `pretest` failure message.

## Quality / verification

- [ ] **Coverage delta enforcement** — fail CI if coverage drops below 98% (currently a soft target). **Effort:** S (Vitest config). **Trigger:** a PR that lands with regressed coverage.
- [ ] **CLI fuzz tests** — random JSON bodies into write actions, assert Zod rejection. **Effort:** M. **Trigger:** real-world payload-shape bugs.
- [ ] **Stricter numeric parsing in `parseId` / `optInt`** — current `Number(raw)` + `Number.isInteger` check accepts non-decimal numeric literals like `'1e3'` (→ 1000) and `'0x10'` (→ 16). Reject these with a `/^[1-9]\d*$/` (or `/^\d+$/` for `optInt`) pre-check so the CLI rejects what its error message claims to require (decimal positive integers). **Effort:** S. **Trigger:** Copilot review on PR #53; deferred from PR 1 because tightening accept/reject semantics is a (minor) breaking behavior change and PR 1 was scoped as "no behavior change". Bundle with any future v2.x release that documents breaking input-validation tightening.

## TestRail API methods — not yet implemented

Gap analysis against the [TestRail API reference](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference). These are programmatic-client gaps (independent of CLI exposure); each would land as a new method on `TestRailClient` + Zod schema + tests.

Implementation conventions for every item below: add the method to the relevant module in `src/modules/`, validate IDs via `this.client.validateId(...)`, parse responses with `this.client.parse(Schema, raw)`, define request payload + response schemas in `src/schemas.ts` with `.passthrough()` so `custom_*` fields survive, re-export public types from `src/index.ts`, and add tests to the matching `tests/client-*.test.ts`. See `CLAUDE.md` → "Add API endpoint" for the full checklist.

### BDDs ([API docs](https://support.testrail.com/hc/en-us/articles/7832161593620-BDDs)) — entire category, TestRail 7.5+

- [x] **`getBdd(caseId)`** — Shipped with the "BDD endpoints" PR. `GET get_bdd/{case_id}` returns raw Gherkin `.feature` text (TestRail 7.5+). Required extending `TestRailClientCore` with a new `requestText()` method that mirrors `request<T>()`'s retry/rate-limit/timeout/DNS pipeline but swaps the JSON parse for `response.text()`. Lives in a new `src/modules/bdd.ts` module (not `cases.ts`) since BDDs are a distinct TestRail concept. CLI: `bdd get <case_id> --out <path> [--force]` writes UTF-8 text and emits an ack with byte count.
- [x] **`addBdd(caseId, file, filename)`** — Shipped with the "BDD endpoints" PR. `POST add_bdd/{case_id}` with a multipart `.feature` upload via the existing `requestMultipart` pipeline. Returns the updated `Case` (verified against `CaseSchema`). CLI: `bdd add <case_id> --file <path> [--filename <name>]` (mirrors `attachment add-to-case` semantics, including dry-run preview).

### Cases ([API docs](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases)) — bulk and history

- [ ] **`updateCases(suiteId, payload)`** — `POST update_cases/{suite_id}` with body `{ case_ids: number[], ...sharedFields }`. Bulk-applies the same field values to many cases. Reuses `UpdateCasePayloadSchema` shape + `case_ids` array. **Effort:** M (payload schema, partial-failure semantics, doc the "all-or-nothing" server behavior). **Module:** `cases.ts`. **Trigger:** agents performing field-level batch edits.
- [ ] **`deleteCases(suiteId, payload, options?)`** — `POST delete_cases/{suite_id}&project_id=X[&soft=1]`. Body: `{ case_ids: number[] }`. **Effort:** S. **Module:** `cases.ts`. **Trigger:** cleanup automations.
- [ ] **`copyCasesToSection(sectionId, caseIds)`** — `POST copy_cases_to_section/{section_id}` with body `{ case_ids: number[] }`. **Effort:** S. **Module:** `cases.ts`. **Trigger:** suite reorganization tooling.
- [ ] **`moveCasesToSection(sectionId, payload)`** — `POST move_cases_to_section/{section_id}` with body `{ case_ids: number[], suite_id?: number, section_id: number }`. **Effort:** S. **Module:** `cases.ts`. **Trigger:** same as above.
- [x] **`getHistoryForCase(caseId, options?)`** — Shipped with the "History/statuses" PR alongside `getSharedStepHistory` and `getCaseStatuses`. Exposed on CLI as `case history <case_id> [--limit N] [--offset N]`. Shares the new `HistoryEntrySchema` with `getSharedStepHistory` (one schema, `.passthrough()` covers `timestamp` vs `created_on` divergence).

### Case Fields ([API docs](https://support.testrail.com/hc/en-us/articles/7077272415636-Case-fields))

- [x] **`addCaseField(payload)`** — Shipped with the "addCaseField" PR. `POST add_case_field` (admin-only; admin permissions required on the TestRail server). Inlined `AddCaseFieldPayloadSchema` with a dedicated nested `AddCaseFieldConfigPayloadSchema` for `configs[]` — mirrors the response-side `context`/`options` shape but lives as a separate write payload so future response-only fields can't drift in. `.passthrough()` lets TestRail be the source of truth on field-type-specific quirks (Steps rejects `items`, `name` must be a system slug). Returns the newly created `CaseField`. Exposed on CLI as `case-field add --data ...` (no path params; first hyphenated-resource write action, following the `case-status` precedent).

### Plans ([API docs](https://support.testrail.com/hc/en-us/articles/7077711537684-Plans)) — per-entry run management

- [x] **`addRunToPlanEntry(planId, entryId, payload)` / `updateRunInPlanEntry(runId, payload)` / `deleteRunFromPlanEntry(runId)`** — Shipped together as the "Plan entry runs" PR. Three programmatic methods on `TestRailClient` (no CLI surface — deferred to a future PR once the `plan-entry` resource naming is settled). Two new dedicated payload schemas (`AddRunToPlanEntryPayloadSchema` with `config_ids` required; `UpdateRunInPlanEntryPayloadSchema` with the four mutable fields, all optional) — distinct from the loose `PlanEntryRunPayloadSchema` used for nested entries, matching Decision Log Q8 (honest fail-fast > silent fix). `update_run_in_plan_entry` rejects `name` / `config_ids` / `refs` client-side because the endpoint silently drops them.

### Results ([API docs](https://support.testrail.com/hc/en-us/articles/7077819312404-Results))

- [x] **`addResults(runId, payload)`** — Shipped together with CLI `result add-bulk-by-test <run_id> --data ...`. New dedicated payload schemas (`AddResultForTestPayloadSchema` with `test_id`+`status_id` required; `AddResultsPayloadSchema` wraps the array). Inlined rather than extending `AddResultPayloadSchema` (same precedent as `AddResultForCasePayloadSchema`) — keeps `.passthrough()` behavior unambiguous and the inferred type a plain object literal. Returns `Result[]` matching the server response order.

### Sections ([API docs](https://support.testrail.com/hc/en-us/articles/7077853258868-Sections))

- [x] **`moveSection(sectionId, payload)`** — Shipped with the "moveSection" PR. `POST move_section/{section_id}` (TestRail 6.5.2+). Body: `{ parent_id?: number | null, after_id?: number | null }`. Both fields modelled as `z.number().nullable().optional()` so `null` (explicit "move to root" / "move to top") and field-omitted ("don't change that axis") stay semantically distinct end-to-end — `null` survives JSON serialization to the API rather than being elided. Returns no body (`Promise<void>`); callers wanting the post-move state should `getSection(sectionId)`. Exposed on CLI as `section move <section_id> --data '{"parent_id":null,"after_id":42}'`. First section-namespaced CLI write action — new `src/cli/handlers/section-write.ts` mirrors the case-write pattern.

### Shared Steps ([API docs](https://support.testrail.com/hc/en-us/articles/7077874763156-Shared-steps))

- [x] **`getSharedStepHistory(sharedUpdateId, options?)`** — Shipped with the "History/statuses" PR. Exposed on CLI as `shared-step history <shared_update_id> [--limit N] [--offset N]`. The PR also introduced `shared-step get/list` CLI actions so the new namespace is not half-built (the programmatic methods already existed).

### Statuses ([API docs](https://support.testrail.com/hc/en-us/articles/7077935129364-Statuses))

- [x] **`getCaseStatuses()`** — Shipped with the "History/statuses" PR. Dedicated `CaseStatusSchema` keyed on `case_status_id` (not `id`), keeping it disjoint from the result-status `StatusSchema`. Exposed on CLI as `case-status list` — the first metadata-style endpoint to land in the CLI; justified by its distinct purpose vs. `getStatuses`, not as a precedent for the other metadata getters.

### Suggested grouping for future PRs

1. **Bulk case operations PR** — `updateCases`, `deleteCases`, `copyCasesToSection`, `moveCasesToSection` (share suite/section validation).
2. **Plan entry runs PR** — `addRunToPlanEntry`, `updateRunInPlanEntry`, `deleteRunFromPlanEntry` (cohesive feature).
3. ~~**BDD PR**~~ — `getBdd`, `addBdd` (shipped).
4. ~~**History/statuses PR**~~ — `getHistoryForCase`, `getSharedStepHistory`, `getCaseStatuses` (shipped).
5. **Standalone** — ~~`addResults`~~ (shipped), ~~`moveSection`~~ (shipped), ~~`addCaseField`~~ (shipped) (independent).

---

## Decision Log

Items below have explicit **won't do** status from v2.1 design. Listed here so
future contributors don't re-propose them without new information.

| Item                                            | Decided in      | Reason                                                                        |
| ----------------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| Postinstall hook                                | Q2              | User-hostile; ignorable via `--ignore-scripts`; conflicts with zero-dep ethos |
| Symlink install                                 | Q11             | Windows permission issues; broken-symlink edge cases                          |
| Interactive CLI prompts                         | Q13             | Conflicts with agent/scripting target audience                                |
| Telemetry                                       | Q13 calibration | Conflicts with zero-dep ethos                                                 |
| Value coercion in payload schemas               | Q8              | Honest fail-fast > silent fix; surfaces agent bugs                            |
| Programmatic API recipes in the CLI skill       | Q2              | Skill stays focused; `README` + `CODEMAP` cover programmatic use              |
| Cursor / Continue / generic agent formats in v1 | Q1              | One well-supported format > three half-baked ones                             |

When pulling an item out of "won't do", document the new information that
changed the calculus.
