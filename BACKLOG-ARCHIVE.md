# BACKLOG archive

Long-form archive moved out of `BACKLOG.md` so the main backlog stays compact
and agent-friendly. This file preserves shipped items, detailed security
writeups, API-gap history, and prior decision/rationale text.

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

- [x] **`project add` / `project update`** — Shipped with the "Structural-setup CLI" PR. `addProject` / `updateProject` exposed as `project add --data ...` (no path param) and `project update <project_id> --data ...`. Migrated `AddProjectPayload` / `UpdateProjectPayload` from handwritten interfaces in `types.ts` to Zod schemas in `schemas.ts` (matches the case/run/result/plan precedent). `suite_mode` left as `z.number().optional()` rather than a `1|2|3` literal union — TestRail rejects invalid values server-side; a client-side literal can't anticipate future modes.
- [x] **`suite add` / `suite update`** — Shipped with the "Structural-setup CLI" PR. `addSuite` / `updateSuite` exposed as `suite add <project_id> --data ...` and `suite update <suite_id> --data ...`. Schemas migrated from `types.ts` to Zod in `schemas.ts`.
- [x] **`section add` / `section update`** — Shipped with the "Structural-setup CLI" PR. `addSection` / `updateSection` exposed as `section add <project_id> --data ...` and `section update <section_id> --data ...`, joining the existing `section move` handler in `section-write.ts`. `suite_id` modelled as optional in `AddSectionPayloadSchema` so both single- and multi-suite-mode projects work — TestRail returns 400 on invalid mode/`suite_id` combinations rather than us double-validating.
- [x] **`milestone add` / `milestone update`** — Shipped with the "Structural-setup CLI" PR. `addMilestone` / `updateMilestone` exposed as `milestone add <project_id> --data ...` and `milestone update <milestone_id> --data ...`. State-toggle fields (`is_completed`, `is_started`) live on the update schema only, mirroring the existing interface.
- [ ] **`user add` / `user update`** — `addUser` / `updateUser`. **Effort:** S. **Trigger:** identity-provisioning workflows. Note: TestRail 7.3+ only. **Deferred from the "Structural-setup CLI" PR** because (a) it's the only structural-setup item with a TestRail-version gate (7.3+), which muddies the version-compatibility story when bundled with version-agnostic actions, and (b) the `password` field raises distinct UX/security questions (env-var sourcing? `--password-stdin`? plaintext in `--data` is a footgun) that warrant their own design grilling rather than inheriting the `--data '{...}'` JSON pattern.
- [x] **`plan add` / `plan update` / `plan add-entry`** — `addPlan` / `updatePlan` / `addPlanEntry`. Shipped together with `plan get` / `plan list` (the 5 actions closed plan's read/write asymmetry). Plan payload schemas migrated from handwritten interfaces in `types.ts` to Zod in `schemas.ts` (matches the precedent for run/case/result payloads). Nested `entries[]` are fully Zod-validated; nested `runs[]` inside an entry use a separate `PlanEntryRunPayloadSchema` (all fields optional, including `name`) since TestRail derives the run name from the config. `plan close`, `plan delete`, `plan-entry update`, `plan-entry delete` remain deferred — the last two also need a UUID-style string-ID parser (`entry_id` is a string, not a number).

## CLI write surface — destructive operations

Deliberately omitted from v2.1 to keep agents away from irrecoverable actions
without explicit human review. Programmatic API still exposes them.

- [x] **`case delete`** — Shipped with the "Destructive single-entity delete CLI surface" PR. `case delete <case_id> [--soft] --yes`. Reuses the locked-in destructive precedent (`--yes` gates; `--dry-run` wins for preview). `--soft` adds TestRail's `?soft=1` server-side preview (returns `affected_*` counts without deleting); programmatic API gained `deleteCase(id, { soft: true })` overload returning the new shared `SoftDeletePreview` (mirrors the existing `deleteCases` precedent).
- [x] **`run delete`** — Shipped with the same PR. `run delete <run_id> [--soft] --yes`. Programmatic API gained `deleteRun(id, { soft: true })` overload.
- [x] **`suite delete` / `section delete` / `milestone delete` / `project delete`** — Shipped with the same PR. `[--soft]` accepted on `suite delete` and `section delete` (TestRail supports `?soft=1` there); `milestone delete` and `project delete` reject `--soft` explicitly because TestRail's endpoints don't accept it and silently dropping would mask destructive intent. `project delete` carries the highest blast radius of the cluster; protected by the same `--yes` gate as the others (TestRail offers no further server-side confirmation hook).
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

- [x] **`updateCases(suiteId, payload)`** — Shipped with the "Bulk case operations" PR. `POST update_cases/{suite_id}` with body `{ case_ids: number[], ...sharedFields }`. Returns the array of updated cases. Inlined `UpdateCasesPayloadSchema` (not `.extend(UpdateCasePayloadSchema)`) to keep the `.passthrough()` behavior unambiguous, mirroring `AddResultForTestPayloadSchema`. Exposed on CLI as `case update-bulk <suite_id> --data ...`. Note: TestRail's online docs list `suite_id` as single-suite-mode optional; the reference Python client (`tolstislon/testrail-api`) and live API both treat it as required, so we keep it required as the path param.
- [x] **`deleteCases(suiteId, projectId, payload, options?)`** — Shipped with the "Bulk case operations" PR. `POST delete_cases/{suite_id}&project_id=X[&soft=1]`. `project_id` is a required positional argument (not buried in options); `options.soft=true` adds `soft=1` (server-side preview — returns counts without deleting). Distinct from CLI `--dry-run` which short-circuits before any API call. CLI: `case delete-bulk <suite_id> --project-id <id> [--soft] --data ... --yes` (destructive, gated by `--yes`; `--dry-run` still wins over `--yes`).
- [x] **`copyCasesToSection(sectionId, payload)`** — Shipped with the "Bulk case operations" PR. `POST copy_cases_to_section/{section_id}` with body `{ case_ids: number[] }`. Returns the new case copies as `Case[]`. CLI: `case copy-to-section <section_id> --data ...`. Schema is intentionally separate from `DeleteCasesPayloadSchema` despite the identical shape — a future field on either endpoint must not silently spread.
- [x] **`moveCasesToSection(sectionId, payload)`** — Shipped with the "Bulk case operations" PR. `POST move_cases_to_section/{section_id}` with body `{ case_ids: number[], suite_id: number }`. **Original BACKLOG draft was wrong on the body shape**: TestRail does NOT take `section_id` in the body (it's path-only), and `suite_id` is required (not optional) — verified against the live API and the reference Python client. CLI: `case move-to-section <section_id> --data ...`.
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

1. ~~**Bulk case operations PR**~~ — `updateCases`, `deleteCases`, `copyCasesToSection`, `moveCasesToSection` (shipped).
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

---

## Security Findings (CTF audit, 2026-05-16)

Three vulnerabilities surfaced during a CTF-style read-through of the request
pipeline and CLI file I/O. Severity is the audit's own rating; effort lines
sketch a minimal fix.

**Status (v2.2):** Findings #1–#3 shipped together. DNS validation now runs
fresh before every request (no construction-time caching) and is fail-closed
on lookup errors; `allowPrivateHosts: true` is the documented escape hatch
for both private-host and DNS-validation-unavailable scenarios. `--out` paths
are lstat-checked (catches broken symlinks) and writes use `wx`/post-lstat to
keep the TOCTOU window microseconds-wide. New tests in
`tests/cli-file-output.test.ts`, `tests/cli-safe-write.test.ts`, and the
`DNS validation` block of `tests/client-features.test.ts`.

**Status (v3.0, CLI safety cluster):** Findings #6, #10, #11, #16, #18, #24
shipped together. `run close` now requires `--yes`. parseArgs unknown flags
are rejected via a post-parse strict gate so typos like `--dryrun` no longer
silently bypass `--dry-run`. `--api-key <key>` argv was removed; the API
key must come from `TESTRAIL_API_KEY` (recommended) or `--api-key-stdin`.
Stderr error messages and `--format table` cell values are sanitized to
strip ANSI/OSC terminal escape sequences. Stdin reads are bounded at 1 MiB
(memory-DoS only — see #24 for the open wall-clock-deadline follow-up).
Breaking-change migration notes in [CHANGELOG.md](CHANGELOG.md).

### 1. DNS-rebinding bypass of SSRF guard — `src/client-core.ts` (Severity: HIGH) — [SHIPPED]

`validatePublicHost()` (~L97–127) resolves the configured `baseUrl` hostname
**once at client construction** and stores the outcome in a single promise
(`dnsValidationPromise`). Every subsequent `request*()` awaits the same
already-settled promise and then calls `fetch(url, …)`, which performs its
**own** DNS lookup against the OS resolver at request time. The two lookups
are independent — the pinned IP from validation never flows into `fetch()`.

Attack: an attacker-controlled authoritative DNS server for `evil.example.com`
returns a public IP (`1.2.3.4`) with a very low TTL during the construction
lookup, then immediately returns `169.254.169.254` (cloud metadata) or
`127.0.0.1` for the next query. The validation passes; `fetch()` hits the
private/loopback target carrying the full `Authorization: Basic <creds>`
header — converting the client into a credentialed SSRF probe.

The synchronous `PRIVATE_HOST_PATTERNS` regex on `url.hostname` doesn't help:
the hostname string is still the attacker's public domain.

**Fix sketch (S):** resolve once with `dns.lookup`, then pass the pinned IP
as the URL host while putting the original hostname in the `Host` header (or
use a custom `undici` Dispatcher / `lookup` agent option). Re-validate IPs on
every request rather than caching the construction-time result.

### 2. Fail-open DNS validation — `src/client-core.ts:118–126` (Severity: HIGH) — [SHIPPED]

Inside `validatePublicHost()` the `dns.lookup` call is wrapped in
`try/catch`. On any non-`TestRailValidationError` throw — including
`SERVFAIL`, `NXDOMAIN`, `REFUSED`, or an `import('node:dns/promises')` failure
under a constrained runtime — the catch emits `console.warn(...)` and
**returns normally**, letting the client proceed to `fetch()`.

Attack: an attacker who controls the authoritative DNS for their domain
serves `SERVFAIL` to the validation lookup (or uses an IDN/punycode form the
local resolver rejects), suppressing the only IP-level check. The
construction-time regex sees a benign-looking hostname; `fetch()` later
resolves the same name to a private IP via the OS resolver, which may be
configured with different timeouts/servers and succeed.

Combined with finding #1, this is a one-step SSRF: rebinding isn't even
required because validation never produces a verdict.

**Fix sketch (S):** treat lookup errors as failures (`allowPrivateHosts:
true` is the documented escape hatch). At minimum, distinguish "lookup
timed out" from "lookup returned a private IP" and only fail-open on the
former when a new `allowDnsFailures` flag is set.

### 3. TOCTOU symlink-clobber in `attachment get --out` — `src/cli/file-output.ts` + `src/cli/handlers/attachment.ts` (Severity: MEDIUM) — [SHIPPED]

`resolveOut()` rejects the call when `existsSync(path)` is true and `--force`
is not set. `existsSync` **follows symlinks** — a broken symlink (target does
not exist) returns `false`. After the check passes, `handleAttachmentGet`
calls `getAttachment()` (a network round-trip, hundreds of ms to seconds),
**then** `writeFileSync(resolved.path, bytes)`. `writeFileSync` opens with
the default `'w'` flag, which **follows symlinks** and truncates/creates
their target.

Attack: in a shared-filesystem context (CI runner, multi-user host, container
with mounted volumes) a co-tenant places a broken symlink at the agent's
expected `--out` path pointing to, e.g., `~/.ssh/authorized_keys` or a CI
secret file. The network round-trip is the attack window. When the
attachment lands, its bytes overwrite the symlink target — silent
arbitrary-file write under the CLI user's UID.

**Fix sketch (S):** open with `flag: 'wx'` on the non-`--force` path so the
kernel atomically refuses an existing path (including broken symlinks);
when `--force` is set, `lstat()` the path first and reject symlinks unless
the user passes an additional opt-in (or use `O_NOFOLLOW` via `open()` +
`fs.write`). Tests: drop a broken symlink, then run `attachment get --out
<symlink>` and assert the target file is unchanged.

### 4. SSRF guard bypassed by HTTP redirect — `src/client-core.ts` (Severity: HIGH) — [OPEN]

All four `fetch()` call sites — `request()` (L624), `requestText()` (L745),
`requestMultipart()` (L829), and `requestBinary()` (L899) — call `fetch(url,
options)` without setting `redirect`. Node's WHATWG `fetch` defaults to
`redirect: 'follow'` (up to 20 hops). `validatePublicHost()` only resolves
and IP-checks the **configured** `baseUrl` hostname; the `Location` header
of any 3xx response is never re-validated against `PRIVATE_HOST_PATTERNS`
or re-resolved through `dns.lookup`.

Attack: a TestRail-shaped origin the user is asked to point at — a
self-hosted instance compromised by an attacker, a typosquatted host, a
proxy in the path, or any reverse-proxy misconfiguration — responds to a
benign endpoint (e.g. `get_user_by_email`) with:

```
HTTP/1.1 302 Found
Location: http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

The client follows the redirect and the upstream `fetch()` happily hits the
AWS IMDSv1 endpoint (or `http://localhost:6379/`, `http://127.0.0.1:9200/`,
`http://internal-admin.testrail.example.com:9000/`, a Docker socket via
`http://localhost/var/run/...`, etc.). The body comes back as the
"TestRail response" — `request<T>()` then tries to `JSON.parse` it and
throws a generic `Invalid JSON response from TestRail API`, **but the
internal GET has already happened** and any side-effect-y endpoint (e.g.
`POST /shutdown` on an admin port reached via a chained 307 that preserves
the method) has fired.

Same-host port-hopping is the cleanest variant: `https://testrail.example.com`
→ `Location: http://testrail.example.com:9200/_cluster/health`. The IP
check on `testrail.example.com` passed at construction; the redirect target
shares the hostname, so even per-request IP validation (finding #1 fix)
wouldn't catch it without also re-validating the **port** and protocol
against the originally configured baseUrl. 307/308 redirects preserve the
HTTP method and body, so a `POST` write can land on an internal write
endpoint.

Credential exposure: undici strips the `Authorization` header on
cross-origin redirects, but **not** on same-origin / same-host
redirects — so the port-hopping variant above also leaks the
`Basic <base64(email:apiKey)>` credential to whatever is listening on the
target port.

This finding is the redirect-shaped cousin of #1/#2: the SSRF guard
inspects the configured URL once and assumes the transport layer will
honor that decision. It doesn't.

**Fix sketch (S):** pass `redirect: 'error'` to all four `fetch()` calls so
any 3xx aborts the request with a `TypeError` (mapped to a
`TestRailApiError` in the existing catch block). For the rare legitimate
redirect (vanity-domain → canonical), prefer `redirect: 'manual'` + a
helper that re-runs `validatePublicHost()` on the `Location` header,
re-checks it shares scheme+host+port with `baseUrl`, then re-issues the
request — capped at one hop. Tests: stand up a local server that returns
`302 Location: http://127.0.0.1:1/`, assert the client throws
`TestRailApiError` and **never** issues a second outbound request to the
loopback target (intercept via `http.Agent` lookup hook or a counter on a
second local listener).

### 5. TOCTOU symlink-clobber in `install-skill` — `src/cli/install-skill.ts` (Severity: MEDIUM) — [OPEN]

Finding #3's `wx`/`lstat` fix covers `attachment get --out`, but **not**
`testrail install-skill`. The handler in `runInstallSkill()` (L44–88) does:

```ts
if (existsSync(target) && !opts.force) {
    // L67 — existsSync FOLLOWS symlinks
    writeErr(`SKILL.md already exists ...`);
    return 1;
}
// ...
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target); // L74 — also follows symlinks
```

`existsSync` returns `false` for a **broken** symlink, so a co-tenant who
plants a dangling symlink at `target` (e.g. `<cwd>/.claude/skills/testrail-cli/SKILL.md
-> ~/.ssh/authorized_keys`) sails through the precondition check.
`copyFileSync(source, target)` then opens the destination with
`O_WRONLY | O_CREAT | O_TRUNC`, which follows the symlink and creates/
truncates the **link target** — writing the bundled SKILL.md bytes into
the attacker-chosen path under the user's UID. No `--force` required.

Attack surface is wider than #3 because:

- The precondition is `existsSync`, not `lstat` — broken symlinks are
  silently accepted; #3's CLI runner explicitly switched to `lstatSync`.
- `--global` extends the writable target to `~/.claude/skills/testrail-cli/`,
  a directory whose ancestors may be created by other tooling with looser
  permissions on shared dev hosts and CI runners.
- The intermediate `mkdirSync(dirname(target), { recursive: true })` will
  happily traverse a symlinked `~/.claude/skills/testrail-cli` pointing at
  any directory the user can write — `copyFileSync` then drops `SKILL.md`
  inside the redirected location. Less destructive (new filename, not a
  clobber), but useful as a staging step (e.g. seeding a SKILL.md inside
  a directory that another tool then sources).

The bytes are predictable (bundled SKILL.md is public on npm), so this is
primarily a **clobber / DoS** primitive rather than a data-exfil one —
overwrite a config file the user relies on (e.g. an `.npmrc`, a Claude
settings JSON, a CI `authorized_keys`) and most lines will be markdown
junk, but a single matching directive line in the SKILL.md text can be
weaponized against the targeted config parser's tolerance for noise.

**Fix sketch (S):** mirror the `safeWriteBinary` pattern from
`src/cli/safe-write.ts`:

1. Replace `existsSync(target)` with `lstatSync(target)` (catch `ENOENT`)
   so broken symlinks are detected, not followed.
2. Replace `copyFileSync(source, target)` with `copyFileSync(source,
target, fs.constants.COPYFILE_EXCL)` on the non-`--force` path so the
   kernel atomically refuses any existing entry — closes the race between
   the precondition check and the copy.
3. On the `--force` path, `lstatSync(target)` and reject symlinks before
   calling `copyFileSync` (mirror `safe-write.ts:30–38`).

Tests: drop a broken symlink at the install target pointing to a sentinel
file outside the test tmpdir, run `runInstallSkill({ force: false, ...})`
and assert (a) the call returns 1 with a "symlink refused" error, (b) the
sentinel file's bytes are unchanged, and (c) the symlink itself still
points where it did. Add a `--force` variant of the same test.

### 6. `run close` is irreversible but not `--yes` gated — `src/cli/handlers/run-write.ts:23–30` + `src/cli/metadata.ts:254–260` (Severity: MEDIUM) — [SHIPPED]

The destructive-ops convention introduced in v2.2 (`--yes` gates anything
the API can't undo; `--dry-run` wins for preview) covers `attachment delete`
and `case delete-bulk`. **`run close` was missed.**

Per the TestRail API reference for `close_run`: _"Please note: Closing a
test run cannot be undone."_ There is no `open_run` endpoint and the web
UI offers no reopen action. The run's results stay readable, but it
becomes immutable — no new results, no edits to existing ones, no
re-association. Functionally identical destructive blast radius to a
delete: an agent that ran `run close 42` instead of `run get 42` has
permanently frozen the run.

Both layers leak this:

- `metadata.ts:254–260`: the `ActionSpec` for `run:close` carries
  `isWrite: true` only — no `destructive: true`. The skill generator that
  ships `SKILL.md` to agents uses this flag to label commands; agents
  reading the skill see `run close` as just-another-write, not as an
  irrecoverable operation.
- `handlers/run-write.ts:23–30`: `handleRunClose` honors `ctx.dryRun` but
  never consults `ctx.confirmDestructive`. Compare with
  `handleAttachmentDelete` (L91–110 of `attachment-write.ts`) and
  `handleCaseDeleteBulk` (L59–96 of `case-write.ts`), both of which throw
  `'Destructive action; pass --yes to confirm.'` when the flag is missing.

Threat model is the same one the v2.2 PR locked in: an agent with shell
access ("clean up old runs") issues `testrail run close <id>` because the
help text shows it as a routine `--isWrite` action, then the human owner
discovers it the next sprint. The cost of the missing gate isn't
data loss (results are still readable) but workflow loss — the run can no
longer accept the late results it was waiting on.

The same audit miss likely applies to two other items already on the
deferred list:

- `plan close` (BACKLOG `## CLI write surface — destructive operations`
  cluster) — when shipped, must inherit the `--yes` gate.
- A future `milestone update` invocation that flips `is_completed: true`
  is structurally a close. The current `milestone update` action carries
  arbitrary body — agents can set `is_completed: true` via the same
  `--data` channel without any gate. Out of scope for this finding (it's
  a general-purpose update, not a dedicated close action), but worth
  noting that "destructive via payload field" is a class the current
  `destructive: true` boolean doesn't catch.

**Fix sketch (S):**

1. Add `destructive: true` to the `run:close` `ActionSpec` in
   `metadata.ts:254`.
2. In `handleRunClose`, insert the standard gate immediately after the
   `dryRun` short-circuit:
    ```ts
    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }
    ```
3. Update the `Destructive actions` line in `HELP` (`src/cli/index.ts:113`)
   to include `run close` in the enumerated list.
4. Regenerate `skill/SKILL.md` via `npm run skill` so the agent-facing
   command table picks up the new `destructive` label.

Tests:

- `tests/cli-write-handlers.test.ts`: add `run close` cases mirroring
  the attachment-delete shape — happy path with `--yes`, reject without
  `--yes`, dry-run-wins-over-yes preview emits `destructive: true`.
- `tests/cli.test.ts`: add a subprocess case asserting exit code 1 and a
  `'pass --yes to confirm'` stderr fragment when `testrail run close 42`
  is invoked without `--yes`.
- `tests/cli-helpers.test.ts`: extend the `destructive` ActionSpec
  inventory test (currently asserts only `attachment:delete` and
  `case:delete-bulk` carry the flag) to require `run:close` as well —
  this is the drift catch for any future close-like action that needs
  the gate.

### 7. TOCTOU symlink-follow on attachment **upload** — `src/cli/file-input.ts` (Severity: MEDIUM) — [OPEN]

Finding #3's fix closed the symlink TOCTOU on the **download** target
(`attachment get --out` → write through `safeWriteBinary`). The mirror
side — the **upload** source (`attachment add-to-case|result|run|plan|
plan-entry` and `bdd add`) — was not touched and still uses the original
follow-the-symlink pattern:

```ts
// src/cli/file-input.ts:46–67
const stat = statSync(path); // ← follows symlinks
if (!stat.isFile()) {
    return { ok: false, error: `--file '${path}' is not a regular file.` };
}
size = stat.size;
// ...
const buf = readFileSync(path); // ← follows symlinks again
```

`statSync` reports the symlink's **target** metadata, so `isFile()` is
true whenever the link points at any regular file. `readFileSync` then
follows the link a second time and reads the target's bytes — which are
streamed straight into `requestMultipart()` and posted to TestRail under
the agent's auth.

**Threat model (matches #3, inverted direction):** in a shared-filesystem
context (CI runner with parallel jobs, multi-user dev host, container
with mounted home volumes), a co-tenant plants a symlink at the agent's
expected `--file` path before the agent runs:

```sh
ln -sf /home/victim/.aws/credentials /tmp/builds/screenshots/test-42.png
```

The agent runs `testrail attachment add-to-case 42 --file /tmp/builds/screenshots/test-42.png`:

1. `statSync` resolves the symlink → reports a 116-byte regular file. ✓
2. `isFile()` passes; `size = 116`.
3. `readFileSync` resolves the symlink again → reads `~/.aws/credentials`.
4. Bytes posted to TestRail as a case attachment named `test-42.png`.
5. Anyone with TestRail read access to that case can now `attachment get
42 --out leaked.txt` and pull the credentials back out.

The TOCTOU is genuine — between the `statSync` (L46) and the
`readFileSync` (L67) is a `basename(path)` call plus the `opts.read`
branch plus all the `setupUpload` dry-run logic in `attachment-write.ts`
that runs on the execute path. Microseconds, but enough for an attacker
who is already racing the agent (the more interesting variant: the
attacker doesn't need the race at all — they can plant the symlink
**before** the agent's `--file` argument is computed, e.g. by reading
the build pipeline's `screenshot-*` output convention and squatting on
that path).

This is strictly more exploitable than finding #3:

- #3 was a **write** primitive (overwrite a user-owned file with
  attacker-predictable content). The bytes were public, so it was a
  DoS/clobber rather than an exfil primitive.
- #7 is a **read** primitive (exfil any file the agent's UID can read).
  Bytes flow outward through TestRail, which an attacker with TestRail
  read access can retrieve. Higher-impact category.

The shipped `safeWriteBinary` pattern doesn't translate directly to the
read side — `O_NOFOLLOW` is the analogue. Node's `readFileSync(path)`
doesn't accept a flag override, but `fs.openSync(path, fs.constants.O_RDONLY |
fs.constants.O_NOFOLLOW)` does, and the resulting fd can be read with
`fs.readSync` or wrapped in `fs.readFileSync(fd)`.

**Fix sketch (S):**

1. Replace the leading `statSync(path)` with `lstatSync(path)`. If
   `isSymbolicLink()` returns true, reject the upload:
    ```ts
    const lst = lstatSync(path);
    if (lst.isSymbolicLink()) {
        return { ok: false, error: `Refusing to upload through symbolic link '${path}'.` };
    }
    if (!lst.isFile()) {
        return { ok: false, error: `--file '${path}' is not a regular file.` };
    }
    ```
2. On the read branch (L67), open with `O_NOFOLLOW` and read via the fd
   so a swap **between** the lstat and the read still surfaces an
   `ELOOP`:
    ```ts
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const buf = readFileSync(fd);
        // ...
    } finally {
        closeSync(fd);
    }
    ```
3. Keep `basename(path)` for the filename derivation — that's a string
   op on the user's argv, not a filesystem operation. The post-`lstat`
   filename is still safe to compute from the argv path.

If the user has a legitimate workflow where the upload **source** is a
symlink (e.g. CI pipelines that symlink artifacts into a "to-upload"
directory), gate the relaxed behaviour behind an explicit opt-in
flag (`--follow-symlinks`) so the default is fail-closed. Mirror the
`--force` / `--yes` precedent.

Tests:

- `tests/cli-file-input.test.ts` (or extend
  `tests/ports/fsAsyncDiffWriter.symlink.test.ts`-style coverage): plant
  a symlink at a tmpdir path pointing at a sentinel file containing
  `SECRET_TOKEN=abc123`, call `resolveFile({ fileFlag: <link> }, {
read: true })`, and assert the call returns `{ ok: false }` and
  **never** reads `SECRET_TOKEN` into the returned `contents` buffer.
- `tests/cli-attachment-handlers.test.ts`: add a `setupUpload`-level
  test asserting the upload short-circuits with a "symlink refused"
  error before `requestMultipart` is invoked (spy on the client to
  assert zero calls).
- `tests/cli.test.ts`: add a subprocess case running `testrail
attachment add-to-case 1 --file <symlink>` and assert exit 1 + the
  sentinel file's bytes are not present in any captured outbound
  request body (use a local listener as the TestRail target).

### 8. Library constructor hijacks host SIGINT/SIGTERM with `process.exit()` — `src/client-core.ts:157–174` (Severity: MEDIUM) — [OPEN]

The package ships **two entrypoints**: a CLI (`bin: ./dist/cli.js`) and a
library (`exports['.'] → ./dist/index.js`). Both share the same
`TestRailClientCore` constructor, which calls `registerProcessHandlers()`:

```ts
// src/client-core.ts:157–173
process.on('exit', cleanupAllClients);
process.on('SIGINT', () => {
    cleanupAllClients();
    process.exit(130);
});
process.on('SIGTERM', () => {
    cleanupAllClients();
    process.exit(143);
});
```

The `process.exit(130)` / `process.exit(143)` are correct for the CLI —
the binary owns the process and should terminate immediately on Ctrl-C.
They are **wrong** for the library — a host application that embeds the
client now has its shutdown path silently overridden.

**Attack / failure path:** a long-running host (HTTP server, queue
worker, daemon, Electron app) registers its own graceful-shutdown
handler:

```ts
process.on('SIGINT', async () => {
    await db.commitInFlight(); // drains 5–30 s of pending transactions
    await connections.closeAll(); // closes WebSockets gracefully
    server.close(() => process.exit(0));
});
```

Later it imports and constructs a TestRailClient (e.g. on first
incoming request that needs to push results). The library's SIGINT
listener gets registered **after** the host's. On Ctrl-C, Node fires
both listeners synchronously in registration order:

1. Host's listener runs; queues `db.commitInFlight()` as a Promise; returns synchronously.
2. Library's listener runs; calls `cleanupAllClients()` (sync) then `process.exit(130)`.
3. `process.exit` terminates the process **without** draining the microtask queue. The host's `await db.commitInFlight()` never completes; in-flight transactions are aborted; the WebSocket peers get RST instead of a clean close.

The result is **partial-write data loss** under signal delivery — an
availability/integrity primitive that an attacker who can deliver SIGINT
(any local user, any container orchestrator scaling the pod down, any
CI step calling `docker stop`) can weaponise to corrupt the host's
durable state.

This is a meaningful security boundary because:

- The library doesn't document that it installs `process.exit` signal
  handlers; nothing in the README or `TestRailConfig` JSDoc warns the
  host. The `registerProcessHandlers()` call is hidden inside the
  constructor.
- `processHandlersRegistered` is module-level, so the host **cannot**
  defensively `process.removeAllListeners('SIGINT')` after import —
  the library re-registers on the next constructor call from another
  module that imports it. In practice the host has no clean way to
  opt out.
- `cleanupAllClients()` itself iterates `activeClients` and calls
  `destroy()` on each — a synchronous operation. The library does
  not actually need `process.exit()` for cleanup correctness; cleanup
  already happens via the `'exit'` listener (L163), which fires
  during the normal exit sequence whether the host's handler exits
  via `process.exit(0)` or natural event-loop drain.

**Fix sketch (S):**

1. **Drop `process.exit()` from SIGINT/SIGTERM listeners.** Keep
   `cleanupAllClients()` so caches/timers are released, but let the
   host's own listener decide when to exit. The `'exit'` listener
   already handles the case where the host exits via natural drain
   or `process.exit(N)`.
2. **Make signal-handler registration opt-in.** Expose a
   `registerSignalHandlers: boolean` flag on `TestRailConfig`
   (default `true` for the CLI's own client construction, `false`
   for library callers). The CLI's `src/cli/index.ts:278` would
   pass `true` explicitly:
    ```ts
    client = new TestRailClient({ ...auth.config, registerSignalHandlers: true });
    ```
    Library users who want cleanup-on-signal can opt in.
3. **Document the trade-off.** Add a `Lifecycle` section to README
   noting that library users should call `client.destroy()` from
   their own shutdown path; the package no longer installs global
   listeners by default.
4. **Cap `MaxListeners` defensively.** Even with the opt-in default,
   detect when the library is loaded from a context that already has
   a non-default `process.listeners('SIGINT').length` and skip
   registration with a one-line `console.warn` rather than silently
   piling onto the host's handler set.

Tests:

- `tests/client-features.test.ts`: spawn a subprocess that constructs
  a `TestRailClient` with the default config, registers its own
  async SIGINT handler that writes a sentinel file after a 200 ms
  delay, and sends SIGINT. Assert that the sentinel **is** written
  (proves the library no longer pre-empts the host's exit) and that
  the process exits with the host's chosen code, not 130.
- `tests/client-features.test.ts`: construct `N` clients with
  `registerSignalHandlers: false` and assert
  `process.listeners('SIGINT').length === 0`.
- `tests/cli.test.ts`: regression — assert the CLI still exits with
  130 on SIGINT (the existing behaviour is the CLI's contract).

### 9. Schema-invalid response poisons GET cache for full TTL — `src/client-core.ts:653–667` (Severity: MEDIUM) — [OPEN]

`request<T>()` caches the **raw `JSON.parse(responseText)` result**
_before_ the calling module runs Zod validation:

```ts
// src/client-core.ts:653–667
const responseText = await response.text();
if (!responseText) return {} as T;
try {
    const result = JSON.parse(responseText) as T;
    if (method === 'GET' && !skipCache) {
        const cacheKey = `${method}:${endpoint}`;
        this.setCachedData(cacheKey, result); // ← cached BEFORE Zod parse
    }
    return result;
} catch {
    throw new TestRailApiError(0, 'Invalid JSON response from TestRail API');
}
```

Validation actually happens one layer up, in each module's
`this.client.parse<T>(Schema, raw)` call (e.g.
`src/modules/users.ts:14`). By the time Zod rejects the payload, the
unvalidated object has already been written to the LRU under
`GET:${endpoint}` with a 5-minute TTL (`DEFAULT_CACHE_TTL_MS`).

**Effect:** a _single_ 2xx response with a JSON-valid but schema-invalid
body wedges every subsequent call to that endpoint for the full TTL.
The caller sees `TestRailValidationError: Schema validation failed`
on the first call, retries (or the next request from another code
path triggers the same fetch), the cache short-circuits to the same
bad object, and Zod throws again — forever, for 5 minutes — with no
network call in between to recover from the transient server hiccup.

This is the _exact_ class of bug the `clearCache()`-on-mutation logic
exists to prevent (stale GETs after writes), inverted: writes can
flush bad cache entries, but pure-read failure modes have no
recovery path short of waiting out the TTL or calling `clearCache()`
manually (a public method, but unmentioned in the README's recovery
guidance because there is no recovery guidance).

**Threat models:**

1. **Server-side hiccup:** TestRail's API returns a 200 with an
   unexpected body shape during a partial outage (cache-tier
   misroute serving a generic 'maintenance' JSON; a misconfigured
   reverse proxy injecting an unrelated 200 page; a TestRail plugin
   that returns the wrong serializer). One bad response → 5 min of
   failure even after the upstream is fixed. Pure availability loss.

2. **Chained with finding #4 (redirect SSRF):** Attacker redirects
   one inbound `GET get_run/42` to an internal endpoint
   (`http://internal-jenkins.example.com/api/queue.json`) that
   returns a valid-JSON-but-wrong-shape response. The Jenkins JSON
   gets cached under `GET:get_run/42`. The client is now stuck
   serving Jenkins data to every consumer that reads run 42 for the
   next 5 minutes — including after the operator restores the DNS /
   removes the bad redirect. Combined with #4 this turns a single
   redirect into a multi-minute persistent client-side data
   substitution.

3. **Chained with finding #1's residual TOCTOU:** even after the
   `[SHIPPED]` #1 fix (revalidate IP every request, no
   construction-time caching), there's still a TOCTOU window
   between `validatePublicHost()` and `fetch()`'s own resolver
   call. A DNS rebind that lands a _single_ request on an internal
   service is the entire payload; after that, the cache serves the
   internal service's response for 5 minutes regardless of which
   public IP subsequent `validatePublicHost()` calls see.

The bug is amplified by `clearCache()`-on-POST: writes from other
endpoints **also** flush the bad entry, masking the issue in
mixed-workload environments and making it harder to diagnose
(reads-only workloads suffer; read-write workloads self-heal at
write cadence).

**Fix sketch (S+):** move the cache write to after schema
validation. Two shapes work:

A. **Validate in `request<T>`** (the smaller change). Accept an
optional `schema?: ZodType` parameter; if present, call
`schema.parse()` and cache the validated output. Modules that
currently call `client.parse(Schema, await client.request(...))`
collapse to one call.

B. **Validate in the module, cache result of `client.parse()`**
(keeps `request<T>` schema-unaware). Introduce a
`client.cachedRequest<T>(method, endpoint, schema)` helper that
does fetch → JSON.parse → schema.parse → cache. Modules opt into
it on a per-call basis. Keeps the existing `request<T>` for
non-validating callers (which there aren't any of today, but the
surface is public).

Whichever shape is picked, **also**:

- Don't cache when `response.ok` is true but `response.text()` is
  empty (currently treated as `{} as T` and cached — same poisoning
  shape: every subsequent call returns `{}` to a `parse<User>`
  that requires an `id`, throws, repeat).
- Add an integration test that exercises the "one bad response →
  next 10 reads all fail with the same error" pattern and asserts
  the second read makes a fresh fetch (i.e. is _not_ served from
  cache).

Tests:

- `tests/client-features.test.ts`: stub `fetch` to return one 200
  with body `'{"unrelated": true}'`, then assert that
  `client.getUser(1)` rejects, and the **second** call to
  `client.getUser(1)` triggers a second `fetch` (not a cache hit).
- `tests/client-features.test.ts`: assert that empty 2xx bodies are
  treated as a cache-miss for the same endpoint on the next call,
  not a cache hit returning `{}`.
- `tests/client-edge-cases.test.ts`: cover the redirect-SSRF×cache
  chain — stub `fetch` to honor one 302 to a different-shape
  endpoint; assert that after the operator clears the bad redirect
  the next read **still** returns the wrong shape until
  `clearCache()` runs (this is the regression that proves the bug
  exists today; flip the assertion when the fix lands).

### 10. `parseArgs({strict: false})` silently swallows typo'd safety flags — `src/cli/index.ts:131–161` (Severity: MEDIUM) — [SHIPPED]

The CLI entrypoint parses argv with `strict: false`:

```ts
// src/cli/index.ts:131–161
const parsed = parseArgs({
    args: process.argv.slice(2),
    options: { 'dry-run': { type: 'boolean', default: false }, 'yes': ..., 'force': ..., ... },
    allowPositionals: true,
    strict: false,
});
```

`strict: false` was chosen defensively (per the v8-ignore comment block
at L164–171: "highly tolerant; this catch funnels any future-Node-
version edge cases through the controlled exit path rather than
crashing the module"). The cost: **unknown flags are silently
accepted, not rejected**. An agent that types `--dryrun` (missing the
hyphen) gets `values['dryrun'] = true` instead of
`values['dry-run'] = true`. The CLI's gate at L272 reads
`const dryRun = values['dry-run'] === true;` — `undefined === true`
is `false`, so the command **executes for real**, not as preview.

The blast radius is exactly the operations the `--dry-run`/`--yes`
gates exist to protect:

- `testrail case delete-bulk 7 --project-id 1 --data '{...}' --yes --dryrun`
  → `--yes` matches; `--dryrun` does not match `--dry-run`; the cases
  are deleted from TestRail. The agent's log entry shows "dry-run
  preview" because that's the flag it intended.
- `testrail attachment delete 42 --yes --dryrun` → attachment
  permanently deleted.
- `testrail run close 99 --dryrun` → run permanently frozen (today
  unguarded per finding #6; even after #6 ships with `--yes`, a
  `--dryrun --yes` pair still closes the run).

A symmetric typo on the destructive flag fails _safe_: `--y` instead
of `--yes` leaves `confirmDestructive === false`, so the handler
throws `'Destructive action; pass --yes to confirm.'` Only the
preview-vs-execute distinction is silent. That's the worse direction
of the asymmetry — agents expect destructive ops to error loudly when
mis-flagged; `--dryrun` errors _quietly_ by executing.

The exposure is amplified for agent users — the target audience per
`CLAUDE.md` ("agents generating cases from large spec files",
"agents that pipe artifacts"). An LLM rewriting a command from
documentation it half-remembers is exactly the path that produces
`--dryrun` from a mental model of "what's the dry-run flag again?".
Human users running the same typo in an interactive shell discover
the issue from the next state, but agents typically don't have a
verification step — they trust their own argv construction.

Other dropped flags hit the same gap:

| Intended flag | Typo            | Effect when typo'd                                                               |
| ------------- | --------------- | -------------------------------------------------------------------------------- |
| `--dry-run`   | `--dryrun`      | preview becomes real call (this finding)                                         |
| `--force`     | `--forced`/`-f` | `--out` write refuses on existing file ⇒ no-op (fail-safe); but for              |
|               |                 | `install-skill --forced` the install fails with "exists" rather than overwriting |
| `--soft`      | `--softdelete`  | `case delete-bulk` becomes a hard delete (the `--soft` server-side preview path  |
|               |                 | is the safer one; mis-flagging here flips the semantics)                         |
| `--quiet`     | `--silent`      | error/output suppression doesn't engage; secrets in error text still emitted     |

The `--soft` row is the _second_ high-severity case after `--dry-run`:
the entire `case delete-bulk --soft` workflow (per BACKLOG's lock-in
note: "`--soft` adds TestRail's `soft=1` query param — a _server-side_
preview where TestRail returns affected-test counts without deleting")
relies on the flag actually being recognised.

**Fix sketch (S):** keep `strict: false` for the defensive purpose
(future-Node tolerance), but add a post-parse validation pass that
rejects any key in `parsed.values` that wasn't declared in `options`:

```ts
const KNOWN_FLAGS = new Set([
    'base-url',
    'email',
    'api-key',
    'format',
    'quiet',
    'help',
    'version',
    'project-id',
    'suite-id',
    'run-id',
    'case-id',
    'limit',
    'offset',
    'data',
    'data-file',
    'dry-run',
    'global',
    'force',
    'print-path',
    'file',
    'filename',
    'out',
    'yes',
    'soft',
]);
for (const key of Object.keys(values)) {
    if (!KNOWN_FLAGS.has(key)) {
        process.stderr.write(`Error: unknown flag '--${key}'. Run --help for the full list.\n`);
        return 1;
    }
}
```

The Set duplicates the `options` keys; a tiny refactor extracts both
from a shared `FLAGS` table so they can't drift. The check runs
before `dispatch()` so a typo aborts with a clear message, no API
call, exit 1.

Tests:

- `tests/cli.test.ts`: subprocess-level: `testrail case delete-bulk 7
--project-id 1 --yes --dryrun --data '{"case_ids":[1]}'` exits 1
  with `unknown flag '--dryrun'` on stderr and `client.deleteCases`
  is **not** called.
- `tests/cli.test.ts`: `testrail attachment delete 1 --yes --dryrun`
  same assertion.
- `tests/cli.test.ts`: positive control — every flag in the canonical
  `KNOWN_FLAGS` set is accepted when spelled correctly.
- `tests/cli-helpers.test.ts`: unit test on the new `KNOWN_FLAGS`
  inventory — must equal `Object.keys(options)` from the parseArgs
  config so adding a flag in one place forces an update in the
  other.

### 11. CLI accepts `--api-key <key>` argv with no stdin/file alternative — `src/cli/auth.ts` + `src/cli/index.ts:136,221` (Severity: MEDIUM) — [SHIPPED]

`resolveAuth()` reads the TestRail credential from `--api-key <key>`
argv as a peer alternative to the `TESTRAIL_API_KEY` env var:

```ts
// src/cli/auth.ts:20–37
export function resolveAuth(flags: AuthFlags, env: AuthEnv): AuthResolution {
    const baseUrl = flags.baseUrl ?? env.TESTRAIL_BASE_URL;
    const email = flags.email ?? env.TESTRAIL_EMAIL;
    const apiKey = flags.apiKey ?? env.TESTRAIL_API_KEY;
    ...
}
```

```ts
// src/cli/index.ts:136
'api-key': { type: 'string' },
// src/cli/index.ts:221
apiKey: values['api-key'] as string | undefined,
```

The CLI HELP at L87–90 lists the two forms as equivalents:

```
Auth (env var or flag):
  TESTRAIL_BASE_URL / --base-url <url>
  TESTRAIL_EMAIL    / --email <email>
  TESTRAIL_API_KEY  / --api-key <key>
```

with no warning that flag-passed secrets are visible to anything that
can read process arguments on the host:

- **`/proc/<pid>/cmdline`** — readable by any local user on Linux by
  default (DAC mode 0o555); a busy CI runner has dozens of agents
  poking processes per minute. `ps auxww` is the convenient form,
  but anything in `/proc` walks straight past it.
- **Shell history** — `~/.bash_history`, `~/.zsh_history`, fish, etc.
  capture the exact command line; `HISTCONTROL=ignoreboth` only
  swallows leading-space commands and dedup'd lines, not secrets.
- **CI dashboards** — `set -x`, BuildKite/CircleCI/GitHub Actions
  step logs, GitLab `CI_DEBUG_TRACE`. The captured stdout is
  retained for 30+ days on most providers and is readable by
  every project member.
- **Container audit trails** — `kubectl get pod -o yaml` shows the
  container's `command:` and `args:`; auditd / eBPF tracers capture
  `execve` argv; cloud audit logs (CloudTrail for ECS, Activity
  Log for AKS) include task definitions verbatim.
- **Process tree dumps** — crash reporters, sysdig captures, perf
  records, and most APM agents grab argv at process start.

The env-var alternative leaks too (env is in `/proc/<pid>/environ`,
visible to the same DAC class), but env at least doesn't appear in
shell history, doesn't survive a `ps` snapshot taken at a different
time, and isn't echoed by `set -x`. The industry-standard mitigation
is a stdin / file alternative for the secret-bearing flag — adopted
by `kubectl --token=$(cat)`, `docker login --password-stdin`,
`gh auth login --with-token`, `aws configure set` (file write), `op
read`, `vault login -method=...`. None of these tools accept the
secret in argv without at minimum a deprecation warning.

The asymmetry here is sharp: every other secret-bearing position in
the codebase is handled correctly. `--data` accepts a JSON body
that _could_ contain a password (e.g. a future `user add` payload —
explicitly deferred in the existing BACKLOG note that calls out
"plaintext in `--data` is a footgun"). The CLI already supports
`--data-file <path>` and stdin pipe (`echo '{...}' | testrail ...`)
as alternatives to inline `--data`, recognising the argv-exposure
problem for body payloads. The exact same problem for the
_credential_ — the secret that authorises every API call — has no
alternative path.

**Threat models:**

1. **Agent-driven CI step:** an LLM agent is given a project's
   TestRail API key in a CI variable and the documented invocation
   pattern. It constructs `testrail run close 42 --base-url ... 
--email ... --api-key sk-xxx` because that's the syntax it found
   in the README. The CI step log captures the full command; the
   log is project-readable; any project member can grep for
   `--api-key` and harvest credentials.
2. **Multi-tenant host:** two unrelated agents share a Linux box
   (a shared dev VM, a Kubernetes node with two pods, a CI runner
   processing parallel jobs). Agent A runs `testrail` with
   `--api-key`. Agent B periodically `cat /proc/*/cmdline | tr '\0' ' '`
   to find credentials. A bash loop at 100 ms cadence catches every
   invocation.
3. **Postmortem disclosure:** a crash report or sysdig capture
   from an unrelated incident is shared with a vendor / posted to
   a bug tracker / attached to a Slack message. The argv is in the
   dump.

The risk class is well-known (CWE-214 "Invocation of Process Using
Visible Sensitive Information"; cf. the original `docker login` CVE
that drove the introduction of `--password-stdin`).

**Fix sketch (S):**

1. **Add `--api-key-stdin`** (boolean): read one line from stdin and
   use it as the API key. Mutually exclusive with `--api-key`. The
   existing stdin-as-body path is gated by `process.stdin.isTTY ===
false && !isFileInputAction`; `--api-key-stdin` would steal stdin
   the same way and must be checked before the body's stdin gate
   (or the auth read and body read collide). Document the precedence:
   if `--api-key-stdin` is set, the body must come from `--data` or
   `--data-file`, not stdin.
2. **Add `--api-key-file <path>`**: read the file's contents
   (trimmed) and use as API key. Validates the path with the same
   `lstatSync` rule from `safe-write.ts` so a symlink to
   `~/.aws/credentials` is rejected (per finding #7's symlink
   discipline).
3. **Keep `--api-key <key>` working** for backwards compatibility,
   but emit a one-line `stderr` deprecation warning when it's used:
   `Warning: --api-key exposes the credential via process argv...
prefer --api-key-stdin or TESTRAIL_API_KEY.` Behind a
   `--silence-api-key-warning` flag for callers that have audited
   their context.
4. **Update HELP** at L87–90 to list the new forms and put the env
   var first as the recommended pattern.

Tests:

- `tests/cli.test.ts`: subprocess: `echo 'sk-xxx' | testrail
project list --base-url ... --email ... --api-key-stdin` succeeds
  with the captured stdin used as auth (mock the API). Verify the
  resulting argv (read from `/proc/self/cmdline` inside the
  subprocess, asserted via a no-op handler that echoes its own
  argv) does **not** contain `sk-xxx`.
- `tests/cli.test.ts`: subprocess: `testrail ... --api-key sk-xxx`
  still works (back-compat) but stderr contains the deprecation
  fragment.
- `tests/cli.test.ts`: subprocess: passing both `--api-key` and
  `--api-key-stdin` is a hard error (exit 1).
- `tests/cli.test.ts`: subprocess: `--api-key-file <symlink>` is
  rejected with the same shape of error as `safeWriteBinary`'s
  symlink refusal.

### 12. Unbounded response body reads OOM the client — `src/client-core.ts:628,653,749,767,843,850,911,925` (Severity: MEDIUM) — [OPEN]

All four `fetch()` call sites drain the response with no size cap:

| Method               | Success path                           | Error path                                |
| -------------------- | -------------------------------------- | ----------------------------------------- |
| `request<T>()`       | `await response.text()` (L653)         | `await response.text().catch(...)` (L628) |
| `requestText()`      | `return response.text()` (L767)        | `await response.text().catch(...)` (L749) |
| `requestMultipart()` | `await response.text()` (L850)         | `await response.text().catch(...)` (L843) |
| `requestBinary()`    | `return response.arrayBuffer()` (L925) | `await response.text().catch(...)` (L911) |

undici's `Response.text()` and `Response.arrayBuffer()` read the entire
body into memory — there's no built-in cap and no streaming budget.
V8 throws `RangeError: Invalid string length` at ~1 GB for strings;
`ArrayBuffer` allocations on 64-bit hosts can climb until the process
hits its v8 heap or container memory limit (more typical: agents in
512 MB / 1 GB CI containers OOM-kill at that boundary).

**Threat models:**

1. **Direct attacker-shaped response** — chains with finding #4
   (redirect-following SSRF): a redirect target chosen by the
   attacker (`http://attacker.example.com/loot.bin`) streams a
   100 GB `Transfer-Encoding: chunked` body. `Content-Length` is
   irrelevant under chunked encoding — undici reads until the
   server closes the stream. The agent's container hits its
   memory limit and is OOM-killed by the kernel / orchestrator
   before the request completes.

2. **Compromised / malicious TestRail-shaped origin** — same
   primitive without needing the redirect chain: any host the user
   configures as `baseUrl` can return an oversized body on any
   endpoint. The client has already shipped credentials in the
   request; the server's response shape is unilateral.

3. **5xx retry amplification** — the request path retries on 5xx
   responses. Each retry re-issues the request, the attacker
   re-responds with another oversized body, and each attempt
   allocates from scratch. Three retries against a 500 MB body
   means four sequential allocations: the client never aggregates
   them, but the _peak_ memory is still ~500 MB plus the previous
   buffer awaiting GC. Under memory pressure the GC stalls,
   throughput collapses, and the next retry pushes the process
   over the line.

4. **Error path amplification on the same call** — even when the
   server returns a non-2xx status, the code at L628/L749/L843/L911
   reads the full error body before throwing. An attacker who
   returns `503` with a 10 GB body wastes the client's memory
   _and_ delays the throw long enough that the rate-limiter
   window slides and the next retry gets through. The error body
   is discarded after being put into the `response` field of
   `TestRailApiError` — but the read has already happened.

5. **Cache amplification (chains with finding #9)** — if the
   oversized body is JSON-parseable, the parsed object is cached
   for the full TTL (5 min default; finding #9 doesn't even
   require schema validity for the cache write). The client now
   holds the oversized object resident _and_ serves it back on
   every subsequent matching GET, multiplying the memory pressure
   across a request burst.

The retry-on-network-error path also bypasses any size budget
because the request layer doesn't know whether the prior failure
was caused by the body read (`response.text()` throwing
`RangeError`) or a transport-level fault — both arrive as
`{ name: 'Error' }` at the catch block.

**Fix sketch (M):** introduce a configurable response-size budget
(default 50 MB for JSON, 256 MB for binary — matching TestRail's
documented attachment limit, plus 1 KB for error bodies). Wire it
through every body read:

1. Add `maxResponseBytes?: number` to `TestRailConfig`. Default to
   `DEFAULT_MAX_RESPONSE_BYTES = 50 * 1024 * 1024` in
   `src/constants.ts`; introduce `DEFAULT_MAX_BINARY_RESPONSE_BYTES`
   = `256 * 1024 * 1024` for `requestBinary`; introduce
   `MAX_ERROR_BODY_BYTES = 64 * 1024` for the error-text reads (64
   KB is plenty — error messages, not payloads).
2. Read bodies through a helper that consumes
   `response.body` (a `ReadableStream`), counts bytes per chunk,
   and aborts via `controller.abort()` (the existing timeout
   controller is in scope) when the limit is exceeded:

    ```ts
    async function readBodyCapped(response: Response, cap: number, controller: AbortController): Promise<Uint8Array> {
        const reader = response.body?.getReader();
        if (!reader) return new Uint8Array();
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > cap) {
                controller.abort();
                throw new TestRailApiError(0, `Response body exceeded ${cap} bytes`);
            }
            chunks.push(value);
        }
        const out = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.byteLength;
        }
        return out;
    }
    ```

3. Decode for the JSON / text variants:
   `new TextDecoder('utf-8').decode(await readBodyCapped(...))`.
4. For `requestBinary`, return the `Uint8Array.buffer` as
   `ArrayBuffer`. Reuse the same helper.
5. Tighten error-body reads to `MAX_ERROR_BODY_BYTES` always —
   error bodies are diagnostic, never load-bearing for
   subsequent logic.

Sites to touch: `src/client-core.ts:628,653,749,767,843,850,911,925`
(eight reads across four methods).

Tests:

- `tests/client-features.test.ts`: stub `fetch` to return a
  `ReadableStream` that yields 1 KB at a time and never closes.
  Wrap a short timeout and assert
  `await client.getProject(1)` rejects with a "body exceeded"
  shape **without** the test runner allocating more than 2× the
  cap (assertion via `process.memoryUsage().heapUsed` delta).
- `tests/client-features.test.ts`: the success path for a 4 KB
  body still works.
- `tests/client-edge-cases.test.ts`: 503 error with a 100 MB body
  is mapped to `TestRailApiError(0, 'Response body exceeded ...')`
  rather than reading the full body before throwing the
  `TestRailApiError(503, ...)`.
- `tests/client-features.test.ts`: `maxResponseBytes` config
  override raises the cap so a legitimate large download (e.g. a
  50 MB attachment via `requestBinary`) succeeds when the user
  knows what they're doing.

### 13. POST retried without idempotency on 5xx / network error → duplicate writes — `src/client-core.ts:630–637, 685–691` (Severity: MEDIUM) — [OPEN]

`request<T>()` retries on the same conditions for every HTTP method:

```ts
// src/client-core.ts:630–637 — 5xx / 429 path
if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
    const retryAfterMs = response.status === 429 ? this.parseRetryAfterMs(response) : null;
    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
    await sleep(delay);
    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
}

// src/client-core.ts:685–691 — network-error path
if (retryCount < this.maxRetries) {
    await sleep(this.getRetryDelay(retryCount));
    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
}
```

The retry condition is method-agnostic — there's no `method === 'GET'`
or `isIdempotent(endpoint)` gate. POSTs are retried under exactly the
same conditions as GETs. `requestBinary` shares the same logic
(L915–920). The only method that opted out is `requestMultipart`,
where the comment at L791–792 explicitly notes "Applies rate limiting
and throws on failure, but does NOT retry (uploads are not
idempotent)." — proving the team is aware of the class of bug, but
only fixed it for one endpoint.

**The distributed-systems failure mode is textbook:**

1. Client `POST add_case/42` → request reaches TestRail.
2. TestRail processes it: case is created, ID 7891 assigned, DB
   committed.
3. TestRail's response (`{ id: 7891, ... }`) is in flight back to
   the client when a network blip / proxy timeout / TestRail
   upstream LB termination drops the connection.
4. Client's `fetch()` sees a network error (or a synthetic 502
   from a fronting load balancer).
5. Client `request<T>` catches, sleeps the backoff, **retries the
   same POST**. TestRail accepts the second `add_case` — case
   7892 is created with identical fields.
6. The client returns case 7892 to the caller. Case 7891 is
   orphaned in TestRail.

For each retry attempt that the server actually received-and-
processed, a duplicate entity is created. With `maxRetries: 3`
(default) under sustained 5xx-then-recover noise, a single
intended write can become 4 entities.

**Affected POST endpoints** (every module method that calls
`this.client.request<unknown>('POST', ...)` with non-idempotent
semantics):

| Endpoint                                                                                 | Duplicate effect                                                           |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `add_case`                                                                               | Two cases with identical title in the same section                         |
| `add_run`                                                                                | Two runs against the same project / suite / case set                       |
| `add_result*` (all forms)                                                                | Two results for the same case in the same run — status counts double-count |
| `add_attachment_to_*`                                                                    | (multipart — already exempt; see L791–792)                                 |
| `add_plan` / `add_plan_entry`                                                            | Plan or entry created twice                                                |
| `add_project` / `add_suite` / `add_section` / `add_milestone` / `add_user` / `add_group` | Twin entities                                                              |
| `update_*`                                                                               | Repeated; latest-write-wins, _usually_ harmless                            |
| `delete_*`                                                                               | Second call 404s; harmless                                                 |
| `close_run`                                                                              | Second call 4xx (already closed); harmless                                 |
| `move_cases_to_section`                                                                  | First call moves; second 4xx (already moved); harmless                     |
| `copy_cases_to_section`                                                                  | **Two copies** of each source case in the target section                   |

The `add_*` family — the create endpoints — are the unsafe ones.
`update_*`, `delete_*`, `close_*`, and `move_*` are naturally
idempotent on the server side (latest-write-wins, or 4xx on the
second attempt).

**Why this matters for the audit set:**

- **Test integrity** — `add_result` doubling under network noise
  silently inflates pass/fail counts. A CI dashboard reading
  TestRail's run stats sees `28 passed, 0 failed` when the real
  shape was `14 passed, 0 failed` with 14 dropped retries. False
  green builds.
- **Agent retry storms** — agents writing results in bulk
  (`result add-bulk`, `result add-bulk-by-test`) are exactly the
  workload that triggers this. A flaky network during a 500-case
  bulk write produces 500–2000 duplicates depending on which
  retries the server saw.
- **Quota / quota-driven licence pressure** — TestRail Enterprise
  bills on test-case count; duplicate creates inflate the count
  and may move a tenant into a higher tier mid-billing-cycle.

**Fix sketch (S+):**

1. **Gate retries on idempotent methods** (the standard HTTP-client
   default). For `request<T>()`, treat GET as the only auto-retried
   method:
    ```ts
    const isIdempotent = method === 'GET';
    if ((response.status >= 500 || response.status === 429)
        && isIdempotent && retryCount < this.maxRetries) { ... }
    ```
    Same gate for the network-error path. POSTs that fail surface
    to the caller; the caller decides whether to retry with
    user-visible cost awareness.
2. **Document the trade-off** in JSDoc for `request<T>` and in the
   `closeRun` / `addCase` / `addResult` JSDoc blocks: "POSTs are
   not auto-retried — a failure may have been processed
   server-side; the caller is responsible for deciding whether to
   re-issue."
3. **(Optional) Surface a `retryablePost: boolean` opt-in on
   `TestRailConfig`** for callers who _want_ the old behaviour
   despite the duplicate risk (e.g., daily idempotent reporting
   imports where the source-of-truth dedupes downstream).
4. **(Optional, longer-horizon) `Idempotency-Key` header** — when
   TestRail supports it (currently not documented), include a
   UUID per logical call so retries are recognised server-side
   and deduped. Skip for now; not actionable until TestRail's API
   exposes the header.

Tests:

- `tests/client-features.test.ts`: stub `fetch` to return one
  502 then one 200; call `client.addCase(1, { title: 't' })` and
  assert `fetch` was called **once**, the error propagates to
  the caller, and no second `add_case` is issued.
- Mirror test for the network-error path: first call rejects
  with a synthetic network error; assert no retry.
- Regression: `client.getProject(1)` retries on 502 as before
  (GET stays auto-retried).
- `tests/client-features.test.ts`: `closeRun` and `deleteRun`
  retry-allowed-as-effectively-idempotent assertion — surfaces
  the per-endpoint decision instead of hiding it in the
  method-name pattern.

### 14. Cache returns mutable reference; caller mutation poisons next read — `src/client-core.ts:462–500` (Severity: LOW–MEDIUM) — [OPEN]

Both `setCachedData()` and `getCachedData()` store and return the
_same object identity_ — no clone, no `Object.freeze`, no defensive
copy at either boundary:

```ts
// src/client-core.ts:467–472
const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
if (entry !== undefined && entry.expiry > Date.now()) {
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, entry);
    return entry.data; // ← reference, not a copy
}
```

```ts
// src/client-core.ts:496–499
this.cache.set(cacheKey, {
    data, // ← reference into the cache, not a copy
    expiry: Date.now() + this.cacheTtl,
});
```

Any caller-side mutation of the returned object — whether
intentional or via downstream code that takes "the response" as a
mutable scratchpad — _is the cache entry from that point on_.
Subsequent cache hits return the mutated object until the TTL
expires (default 5 minutes) or a `POST` flushes the cache.

```ts
const projects = await client.getProjects(); // miss → fetch → cache stores reference
projects[0].name = 'Modified by caller'; // mutates the cached entry in place
const again = await client.getProjects(); // hit → returns same reference
console.log(again[0].name); // 'Modified by caller' — not 'Authoritative'
```

This is the canonical mutable-shared-state hazard described in the
project's own coding directives (`rules/common/coding-style.md`:
"ALWAYS create new objects, NEVER mutate existing ones … prevents
hidden side effects, makes debugging easier, and enables safe
concurrency"). The cache is the one place where the library's
_output_ becomes its _input_ on the next call, so the rule applies
with extra force here.

**Threat models:**

1. **Cross-tenant cache poisoning when one client is shared** — a
   host service that fronts TestRail for multiple downstream
   tenants and shares a single `TestRailClient` instance (common
   pattern for memoised SDK clients). Tenant A reads `getCases(7)`,
   gets the array, mutates `cases[0].title = 'X'` for display
   formatting. Tenant B reads `getCases(7)` 30 seconds later and
   sees `'X'` instead of TestRail's authoritative title. Cross-
   tenant data substitution under shared cache.

2. **Inadvertent test contamination** — a test helper reads
   `getProjects()`, picks `projects[0]`, sets a flag on it for
   later assertion (`(projects[0] as any).__testTag = 'a'`). The
   _next_ test in the same `describe` block reads
   `getProjects()`, sees the tagged object, and conflates "this
   field is from the API" with "this field was added in setup."
   Hard to debug.

3. **Force-multiplier on finding #9** — finding #9 noted that a
   malformed response gets cached for the full TTL. With #14, an
   _attacker_ response that has _valid_ fields plus an extra
   `__noteToFutureCallers: '...'` survives the cache write, the
   schema parse (since schemas use `.passthrough()`), and is
   readable to every caller for the TTL. If a downstream sink
   trusts arbitrary fields, the attacker has a one-shot persistent
   payload-injection slot.

4. **Combined with finding #4 redirect-SSRF** — the redirected
   response gets cached. The mutable reference means a caller
   that wraps and "fixes up" the cached object (e.g., normalises
   field names) writes the fixups _back into the cache_, so the
   poisoned-by-SSRF entry stabilises into a normalised-looking
   shape for the rest of the TTL.

**The defensive contract is also asymmetric for the LRU update:**
the get path does `delete` + `set` to reorder. If a caller has
captured the reference and reads `cache.data` between those two
lines — impossible in single-threaded JS today, but a sharp edge
if the file ever moves to a worker context — the entry could
appear briefly absent.

**Fix sketch (S):** clone at one boundary. Two practical shapes:

A. **Freeze on write** — `Object.freeze` (shallow) or
`structuredClone` + `Object.freeze` at every level:

```ts
private setCachedData<T>(cacheKey: string, data: T): void {
    if (!this.enableCache) return;
    // … LRU eviction unchanged …
    this.cache.set(cacheKey, {
        data: deepFreeze(structuredClone(data)) as T,
        expiry: Date.now() + this.cacheTtl,
    });
}
```

Freezing aborts caller mutations loudly in strict mode (default
for ESM, which this package is). Catches bugs at the mutation
site rather than at the surprising-second-read site.

B. **Clone on read** — `structuredClone(entry.data)` before
returning. Defensive against all caller patterns; costs one
deep copy per hit. For a TestRail SDK with mostly small
payloads (a list of 100 cases is ~50 KB), `structuredClone` is
well under 1 ms.

Pick (B) if you want callers to _be able_ to mutate their
returned object (the natural ergonomic for "this is my copy").
Pick (A) if you want to enforce immutability as a contract.

Also fix the symmetric issue at write time: today, `setCachedData`
holds a reference into the caller's parsed JSON. If the caller
keeps and mutates that reference _before_ the next cache hit
fetches the same key, the mutation is visible to all subsequent
readers. (B) on the read side doesn't solve this — only (A) on
the write side does. So the recommendation is the combined
shape: `structuredClone` on write, `Object.freeze` on the cached
copy, return the frozen reference on read. Net cost: one clone
per cache write, zero clones per cache hit, mutations throw at
the site that did them.

Tests:

- `tests/client-features.test.ts`: read a cached entry, mutate it,
  read again, assert the second read **does not reflect the
  mutation**.
- `tests/client-features.test.ts`: assert `Object.isFrozen(cached)`
  on the returned value (if implementing the freeze variant).
- `tests/client-features.test.ts`: mutate the parsed-JSON object
  immediately after the first call returns; second call returns
  the original shape (covers the write-side reference issue).
- `tests/client-features.test.ts`: measure latency overhead of
  `structuredClone` on a representative 200-case `getCases`
  response and assert the regression is sub-ms (perf guard for
  the chosen fix).

### 15. IPv6 SSRF allowlist gaps: `fec0::/10`, 6to4 `2002::/16`, NAT64 `64:ff9b::/96` — `src/client-core.ts:31–96` (Severity: LOW–MEDIUM) — [OPEN]

The SSRF defense has two layers: the synchronous regex pre-check
`PRIVATE_HOST_PATTERNS` (L31–42) and the post-`dns.lookup` IP
classifier `isPrivateOrLoopbackIP()` (L66–96). Both layers have IPv6
coverage holes that don't surface until you reach them with an
actual address.

**Layer 1 — `PRIVATE_HOST_PATTERNS` (regex on `bare` hostname):**

```ts
/^::1$/                  // IPv6 loopback, canonical only
/^fe80:/i                // link-local
/^f[cd][0-9a-f]{2}:/i    // ULA fc00::/7 (matches fc** and fd**)
```

The third pattern requires the _second_ hex character of the first
hextet to be `c` or `d`. That matches `fc**` (fc00–fcff) and `fd**`
(fd00–fdff), which together cover the ULA `/7` correctly. But it
silently excludes:

- `fe**` where the third nibble is `c`–`f` — i.e. `fec0::/10`, the
  deprecated IPv6 site-local range (RFC 3879 deprecated; still
  routable on Solaris/AIX/legacy enterprise stacks; still allowed
  by Linux `getaddrinfo` and `connect()`). Pattern starts `fe`,
  second nibble `c–f` → not matched by `fe80:` (which is exact)
  and not matched by `f[cd][0-9a-f]{2}:` (second nibble must be
  c/d, but here the first hextet leads with `f`+`e`).
- `2002::/16` (RFC 3056 6to4) — addresses of the form
  `2002:<ipv4-hex>::`. `2002:7f00:0001::` is the 6to4 wrapping of
  `127.0.0.1`. The regex doesn't even attempt to match this.
- `64:ff9b::/96` (RFC 6052 NAT64) — Well-known NAT64 prefix.
  `64:ff9b::a00:1` translates to `10.0.0.1`. Not matched.
- `100::/64` (RFC 6666 IPv6 discard) — not a routing target, but
  not blocked.

**Layer 2 — `isPrivateOrLoopbackIP()` (post-lookup IP classifier):**

```ts
// src/client-core.ts:86–92
return (
    firstHextet.startsWith('fc') ||
    firstHextet.startsWith('fd') ||
    firstHextet.startsWith('fe8') ||
    firstHextet.startsWith('fe9') ||
    firstHextet.startsWith('fea') ||
    firstHextet.startsWith('feb')
);
```

`fec0`–`feff` first-hextet leads (the deprecated site-local space)
match neither `fc*`/`fd*` nor `fe8`/`fe9`/`fea`/`feb`. The classifier
returns `false` — the lookup is accepted as public. Same miss for
`2002:*` (6to4) and `64:ff9b:*` (NAT64); the classifier doesn't unwrap
the embedded IPv4.

The `isPrivateOrLoopbackIPv4` mapped-address handler (L67–73) only
unwraps the `::ffff:a.b.c.d` form — the canonical IPv4-mapped IPv6
prefix — and stops there. 6to4 and NAT64 are _different_ transition
mechanisms that embed IPv4 differently; both walk straight past the
mapped-form check.

**Threat models (in decreasing real-world likelihood):**

1. **6to4 wrapping a private IPv4** — on a network with 6to4
   routing enabled (Linux default if `sit0` is up; common on older
   carrier networks), `https://[2002:7f00:1::]/` connects to
   `127.0.0.1`. The agent's `validatePublicHost()` accepts the
   address (neither layer catches `2002:*`), and `fetch()`
   dispatches the request to the host's loopback. Credentialed
   probe of localhost services — the exact threat the SSRF guard
   is supposed to block.

2. **NAT64 wrapping a private IPv4** — same idea on a network that
   runs DNS64+NAT64 (common in modern IPv6-only carrier mobile
   networks and some IPv6-first cloud deployments).
   `https://[64:ff9b::a00:1]/` → translates to `10.0.0.1` →
   reaches a private VPC service.

3. **`fec0::/10` legacy site-local** — niche; Linux removed
   default routing for fec0::/10 long ago, but the SSRF guard's
   _job_ is to be conservative. The defense should match the
   RFC 4193 ULA boundary (fc00::/7) _and_ the deprecated-but-
   formerly-private fec0::/10 — because attackers will configure
   it where they can.

4. **IPv6 unspecified `::` as base URL** — actually _is_ caught
   (the explicit `normalized === '::'` branch at L80–82), but
   only when the address is canonicalised. A baseUrl of
   `https://[0:0:0:0:0:0:0:0]/` — whether Node's URL parser
   canonicalises to `::` reliably under all version skews —
   is a separate question. The pattern check uses
   `bare === "::"`, equality on the string. Defensive: also
   match the IPv6-unspecified case in `isPrivateOrLoopbackIP`
   via parsed-form classification, not string equality.

**Force-multiplier on existing findings:**

- Combines with **#1's residual TOCTOU**: an attacker who controls
  authoritative DNS for a public-looking hostname can return a
  6to4 or NAT64 address from one `dns.lookup` call (which the
  current classifier accepts) and a `127.0.0.1` from the next.
  Even if `validatePublicHost` is called fresh on every request,
  the classifier's gaps mean it never produces a rejection
  verdict for the 6to4 form.
- Combines with **#4's redirect-follow SSRF**: the redirect
  target's `Location: https://[2002:7f00:1::]/admin` is accepted
  by the (also-broken) classifier when the redirect rewrite
  validation is added per the #4 fix sketch.

**Fix sketch (S):** complete the IPv6 classifier. Add prefix matches
in `isPrivateOrLoopbackIP` for the missing ranges and recognise the
two transition encodings:

```ts
// IPv6 site-local (deprecated, still routable on legacy stacks).
// fec0–feff in the first hextet.
if (firstHextet.length === 4 && firstHextet.startsWith('fe')) {
    const third = firstHextet.charCodeAt(2);
    // 'c' .. 'f' nibble
    if (third >= 0x63 && third <= 0x66) return true;
}

// 6to4 (2002::/16) — extract the embedded IPv4 from hextets 2–3.
if (firstHextet === '2002') {
    const hextets = normalized.split(':');
    const hi = parseInt(hextets[1] ?? '', 16);
    const lo = parseInt(hextets[2] ?? '', 16);
    if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
        const ip = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        if (isPrivateOrLoopbackIPv4(ip)) return true;
    }
}

// NAT64 well-known prefix 64:ff9b::/96 — embedded IPv4 in last 32 bits.
if (normalized.startsWith('64:ff9b:') || normalized.startsWith('64:ff9b::')) {
    // Pull the last two hextets (or the embedded dotted-quad form).
    const dotted = normalized.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (dotted && isPrivateOrLoopbackIPv4(dotted)) return true;
    // Hex-hextet form: 64:ff9b::a00:1 == 10.0.0.1
    const tail = normalized.split('::').pop() ?? normalized;
    const tailHextets = tail.split(':');
    if (tailHextets.length >= 2) {
        const hi = parseInt(tailHextets.at(-2) ?? '', 16);
        const lo = parseInt(tailHextets.at(-1) ?? '', 16);
        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
            const ip = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
            if (isPrivateOrLoopbackIPv4(ip)) return true;
        }
    }
}
```

Also extend `PRIVATE_HOST_PATTERNS` so the synchronous pre-check
catches these literals at construction time without waiting on DNS:

```ts
/^fe[c-f][0-9a-f]:/i,        // fec0::/10
/^2002:/i,                    // 6to4 prefix (gated by IPv4 classifier in layer 2)
/^64:ff9b:/i,                 // NAT64
```

The pattern entries are deliberately broad — they catch the
_literal_ and force the lookup phase (which does the embedded-IPv4
classification) to decide. Pure 6to4/NAT64 wrappers of public IPs
would also trip the pattern but pass the classifier; safe behaviour
for an SSRF guard is to err toward refusal here.

Tests:

- `tests/client-features.test.ts`: every entry in the gap list
  (`https://[fec0::1]/`, `https://[2002:7f00:1::]/`,
  `https://[64:ff9b::a00:1]/`, `https://[fed1::42]/`,
  `https://[2002:c0a8:1::]/`) is rejected by
  `validateConfig` at construction time with the existing
  "private/loopback host" error wording. One assertion per
  entry; parameterise with `it.each`.
- `tests/client-features.test.ts`: `allowPrivateHosts: true`
  continues to accept all of the above (the escape hatch
  contract).
- `tests/client-features.test.ts`: 6to4 wrapping a _public_
  IPv4 (`https://[2002:0808:0808::]/` == `8.8.8.8`) is also
  rejected when the broader pattern fires — and accepted only
  when the network operator opts in via `allowPrivateHosts`.
  Documents the conservative-by-default contract; if a user
  needs 6to4 to a public IPv4, that's a niche workflow that
  should opt in.

### 16. Reflected user input in stderr error messages enables ANSI/OSC terminal injection — `src/cli/output.ts:93`, `src/cli/index.ts:168,282,293`, `src/cli/install-skill.ts:49`, `src/cli/ids.ts:11` (Severity: MEDIUM) — [SHIPPED]

Every CLI error path funnels through one of two shapes:

```ts
// src/cli/output.ts:93
process.stderr.write(`Error: ${message}\n`);

// src/cli/index.ts:168, 282
process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
```

The `message` / `e.message` payload routinely embeds **user-supplied
values**, reflected verbatim:

| Source                                                                  | Message shape                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `IdParseError` (`src/cli/ids.ts:11`)                                    | `` `${name} must be a positive integer (got: ${raw ?? '(none)'})` ``              |
| `TestRailValidationError` — private-host (`client-core.ts:103,140,279`) | `` `baseUrl resolves to a private/loopback host ("${hostname}"...)` ``            |
| `TestRailValidationError` — DNS failure (`client-core.ts:131`)          | `` `baseUrl DNS validation failed for "${hostname}": ${err.message}.` ``          |
| `dispatch` "unknown resource"                                           | `` `Unknown resource '${resource}'. Use: ${Object.keys(RESOURCES).join(', ')}` `` |
| `dispatch` "unknown action"                                             | `` `Unknown action '${action}' for ${resource}. Use: ${actions.join(', ')}` ``    |
| `resolveBody` — JSON parse (`body.ts:91`)                               | `` `Invalid JSON: ${e.message}` `` (includes the parser's character pointer)      |
| `resolveBody` — data-file read (`body.ts:69`)                           | `` `Cannot read --data-file '${path}': ${err.message}` ``                         |
| `resolveFile` — file read (`file-input.ts:54,72`)                       | `` `Cannot stat --file '${path}': ${err.message}` ``                              |
| `resolveOut` — out path (`file-output.ts:55,62,69`)                     | `` `Refusing to write through symbolic link '${path}'.` ``                        |

None of these strip or escape **C0/C1 control characters or
ANSI/OSC escape sequences**. They land in `process.stderr.write()`
which is a TTY in the agent's terminal — and the terminal happily
interprets every escape byte it sees.

**Exploitable terminal behaviours** (common defaults across xterm,
iTerm2, GNOME Terminal, Windows Terminal, VS Code's integrated
terminal):

- `\x1b[2J\x1b[H` — clears screen, parks cursor at home (cheap
  cover-up: hide everything the agent just printed).
- `\x1b]52;c;<base64>\x07` — **OSC 52 clipboard write**.
  Default-on in xterm with `allowWindowOps`; opt-in in some
  others. The attacker writes their value to the user's
  clipboard. Next paste = attacker payload.
- `\x1b]8;;https://attacker.example.com\x07Click here\x1b]8;;\x07`
  — OSC 8 **hyperlink injection**. Terminal renders the text as
  a clickable link to the attacker URL. The user clicks an
  apparent error message and lands on phishing.
- `\x1b[?1049h\x1b[?25l` — switch to alternate screen buffer +
  hide cursor. Subsequent stdout appears in a hidden buffer; the
  user sees an empty terminal and assumes the command hung.
- `\x1bP...\x1b\\` — DCS sequence; some terminals enter "device
  command" mode and silently consume bytes that follow.
- `\x1b[c` — DA (device attributes) — terminal **writes its
  response back to stdin**. With Bash, this can be made to inject
  characters into the next shell prompt (the well-known "terminal
  echo injection" class; cf. CVE-2003-0063, CVE-2017-1000117 for
  git submodule, CVE-2022-29154 for rsync, plus modern variants).

**Threat models:**

1. **Prompt-injected agent runs the CLI on attacker text.** An LLM
   agent is told (by an attacker-controlled document) to "diagnose
   the connection by running `testrail run get <ID>` with ID set
   to <pasted-payload>". The payload contains
   `\x1b]52;c;…\x07` followed by an obviously-invalid character.
   The agent calls `testrail run get '<payload>'`. `parseId`
   rejects with `run_id must be a positive integer (got: <payload>)`
   — the payload bytes go to stderr → clipboard overwritten.
   Next time the user pastes, they paste the attacker's payload.
2. **CI build log poisoning.** A CI job runs `testrail`, the
   error is logged to a CI dashboard that renders ANSI (most do
   — Buildkite, GitLab, GitHub Actions all render the
   xterm-256-color subset). The attacker's `--base-url`
   parameter (read from a misconfigured webhook) injects screen-
   clear escapes that hide later log lines, including a
   successful destructive operation. The audit trail visually
   appears clean.
3. **Terminal hyperlink phishing.** An attacker convinces an
   agent to pass `--base-url 'https://example.com\x1b]8;;phish\x07
real-name\x1b]8;;\x07'`. The URL parse fails; the validation
   error reflects the literal as a hyperlink. The user sees
   `Error: baseUrl must be a valid URL... real-name` and clicks
   the link out of habit.
4. **Shell injection via DA response.** Attacker pipes
   `\x1b[c` into the error stream. The terminal responds with its
   device attributes string back into the readline buffer. With
   `bash`'s default readline binding for some terminal-response
   sequences, this can trigger key combinations the user did
   not type.

The risk class (CWE-150 _Improper Neutralization of Escape,
Meta, or Control Sequences_) has a long history in CLI tools
that surface user input back to a terminal: `rsync` (CVE-2022-
29154), `git` submodule URLs (CVE-2017-1000117), `curl` (CVE-2023-
38545's stderr was specifically out of scope, but curl now strips),
`kubectl` (multiple historical advisories). Every modern CLI tool
ships a sanitiser for at least C0 (`\x00–\x1f`, `\x7f`) on values
echoed back.

**Force-multiplier on existing findings:**

- Pairs with **#10** (typo'd flags silently dropped) — an agent
  that mis-types a flag _and_ passes an injection payload gets
  the payload reflected via the existing error wording.
- Pairs with **#11** (`--api-key` argv exposure) — an attacker
  who can already see the credential via `ps aux` can also
  feed escape payloads via the same argv channel; the CLI's
  reflective errors become the rendering target.

**Fix sketch (S):** strip C0 / C1 controls from every value
embedded in an error message before it reaches
`process.stderr.write`. One centralised helper:

```ts
// Strip control chars (C0: 0x00–0x1F except 0x09 tab; 0x7F DEL;
// C1: 0x80–0x9F). Keep tab and newline only — those are the
// glyphs operators legitimately want in multi-line errors.
function sanitiseForTerminal(s: string): string {
    return s.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, '�');
}
```

Apply at the two write sites (`output.ts:93`,
`install-skill.ts:49`) and at the catch-all wrappers
(`index.ts:168,282,293`). The replacement character `U+FFFD` is
the conventional "an unsafe byte was here" marker (cf.
`response.text()` for invalid UTF-8); it's terminal-safe and
makes the substitution visible to the operator without truncating
the value.

Optional refinement: when stderr is _not_ a TTY (e.g., piped to a
file or a CI log that does _not_ render ANSI), pass through the
raw bytes so debugging tools that parse byte-exact error messages
still work. Detect via `process.stderr.isTTY === true`. Pure
terminals get sanitised, redirected streams get the original.

Tests:

- `tests/cli-helpers.test.ts`: `sanitiseForTerminal` round-trips
  ASCII unchanged, replaces every C0 (except `\t`/`\n`) and C1
  byte with `U+FFFD`.
- `tests/cli.test.ts`: subprocess: `testrail run get $'\x1b]52;c;cGF5bG9hZA==\x07'`
  exits 1 and stderr contains **no** `\x1b]52` byte sequence
  (assert via `Buffer.includes(Buffer.from([0x1b, 0x5d, 0x35, 0x32]))`).
- `tests/cli.test.ts`: subprocess: `testrail run get $'\x1b[2J'`
  same; no `\x1b[2J` bytes leak.
- `tests/cli.test.ts`: the legitimate dotted-quad and IDN
  hostname cases still appear unmodified in error output (no
  false positives on benign text).
- Regression: when stderr is redirected to a file (non-TTY),
  the raw bytes pass through (proves the TTY-aware variant).

### 17. `--data-file` reads through symlinks with no size cap → JSON-body exfil primitive — `src/cli/body.ts:63–71` (Severity: MEDIUM) — [OPEN]

`resolveBody()` reads the `--data-file <path>` argument with a bare
`readFileSync`:

```ts
// src/cli/body.ts:63–71
} else if (input.dataFileFlag !== undefined) {
    try {
        raw = readFileSync(input.dataFileFlag, 'utf-8');
    } catch (e) {
        return {
            ok: false,
            error: `Cannot read --data-file '${input.dataFileFlag}': ${...}`,
        };
    }
    source = 'file';
}
```

Two defensive omissions in one call:

1. **No `lstat` / `O_NOFOLLOW` check.** `readFileSync` follows
   symbolic links to the target. A co-tenant who plants a symlink
   at the agent's expected `--data-file` path (e.g.
   `/tmp/build/payload.json` → `~/.config/something-with-title.json`)
   wins the file content as the request body.
2. **No size cap.** `readFileSync(path, 'utf-8')` allocates the
   entire file into a string. Pointing at `/dev/zero` hangs the
   process while V8 grows a UTF-8 string until OOM; pointing at a
   100 GB regular file does the same; pointing at a fifo / socket
   blocks indefinitely.

This is the symmetric sibling of finding #7 (`--file` upload TOCTOU)
but on a different code path with a _different_ exfil channel: the
file's contents become the **JSON request body sent to TestRail**,
visible to anyone with TestRail read access on the targeted
resource — typically less restricted than the binary attachment
listing.

**Exploit shape — schema-permissive JSON exfil:**

Every CLI write action that consumes `--data-file` runs the parsed
JSON through a Zod schema. With `.passthrough()` enabled on every
`zObject(...)` builder (`src/schemas.ts:3`), extra fields are
**preserved and forwarded** to TestRail verbatim. Several payload
schemas require a single trivial field:

| Schema                      | Hard requirement                | Result if any JSON file has a matching field       |
| --------------------------- | ------------------------------- | -------------------------------------------------- |
| `AddCasePayloadSchema`      | `title: string`                 | Entire JSON sent as a case body                    |
| `AddProjectPayloadSchema`   | `name: string`                  | Entire JSON sent as a project body                 |
| `AddSuitePayloadSchema`     | `name: string`                  | Entire JSON sent as a suite body                   |
| `AddSectionPayloadSchema`   | `name: string`                  | Entire JSON sent as a section body                 |
| `AddMilestonePayloadSchema` | `name: string`                  | Entire JSON sent as a milestone body               |
| `MoveSectionPayloadSchema`  | (all optional) — passes on `{}` | Any JSON file passes; passthrough fields forwarded |

The bar for the symlink target is dramatically lower than callers
might assume — the file only needs to be valid JSON and to contain
the one mandatory field. `~/.config/<app>/recents.json`,
`~/Library/Application Support/<app>/state.json`, browser bookmarks
exports, notion exports, CMS config dumps, GitHub Actions context
JSON (`{ name: "..." }` is everywhere), package-lock summaries —
many JSON files in a user's home directory contain `name` or
`title`. The `MoveSectionPayloadSchema` row is the worst: every
JSON file with a valid root object passes, _all_ extra fields are
forwarded.

After the call, the attacker retrieves the leaked contents by
reading the just-created TestRail entity via the normal API (a
read-only TestRail user account is enough — much weaker than the
attacker's local-co-tenant requirement to plant the symlink).

**Threat models:**

1. **Co-tenant symlink plant on shared CI / dev host.** Same
   threat model as findings #3, #5, #7. The attacker plants
   `/tmp/<build>/payload.json` → `~/.config/<app>/auth-state.json`
   before the agent runs. Agent: `testrail case add 42 --data-file
/tmp/<build>/payload.json`. TestRail receives the file's
   contents as a new case body, viewable to any reader of the
   project.
2. **Prompt-injected agent.** An LLM agent is instructed (via a
   poisoned doc) to "load the config from this canonical path"
   and pipe it to TestRail. The canonical path is a sensitive
   file. No symlink needed — the path itself is the attack.
3. **DoS via device file.** Agent told to use `--data-file
/dev/zero` (a path that reads forever). `readFileSync`
   blocks while V8 allocates; the process OOMs. Process kill
   is the _expected_ recovery, but the work-in-flight (e.g. an
   in-progress test run's interim results) is lost.

The mirror finding #7 fixed `resolveFile`'s upload TOCTOU; the
authors recognised the symlink class for binary inputs but
overlooked the JSON-body input that runs through `resolveBody`
in `body.ts`.

**Fix sketch (S):**

1. Mirror the `resolveFile` lstat + `O_NOFOLLOW` pattern (per
   finding #7's fix sketch):
    ```ts
    let raw: string;
    try {
        const lst = lstatSync(input.dataFileFlag);
        if (lst.isSymbolicLink()) {
            return { ok: false,
                error: `Refusing to read --data-file '${input.dataFileFlag}' through a symbolic link.` };
        }
        if (!lst.isFile()) {
            return { ok: false,
                error: `--data-file '${input.dataFileFlag}' is not a regular file.` };
        }
        const fd = openSync(input.dataFileFlag,
            constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
            raw = readFileSync(fd, { encoding: 'utf-8' });
        } finally {
            closeSync(fd);
        }
    } catch (e) { … }
    ```
2. **Add a size cap.** TestRail rejects bodies beyond a few MB
   server-side; client should refuse far earlier. Constant
   `MAX_DATA_FILE_BYTES = 4 * 1024 * 1024` in `src/constants.ts`.
   Check via `lst.size` _before_ the open:
    ```ts
    if (lst.size > MAX_DATA_FILE_BYTES) {
        return {
            ok: false,
            error:
                `--data-file '${input.dataFileFlag}' is ${lst.size}` + ` bytes; exceeds limit ${MAX_DATA_FILE_BYTES}.`,
        };
    }
    ```
3. **Add the same opt-in for legitimate symlinked artifacts** as
   #7 proposed (`--follow-symlinks` flag, fail-closed by default,
   shared semantics across `--file` and `--data-file`).

Tests:

- `tests/cli-body-source.test.ts`: plant a symlink at a tmpdir
  path pointing at a sentinel JSON file containing
  `{"title":"SECRET_TITLE","note":"…"}`. Call `resolveBody`
  with that path against `AddCasePayloadSchema`; assert
  `{ ok: false }` with the "symlink refused" wording, and that
  the resolved body returned to handlers is empty.
- `tests/cli.test.ts`: subprocess invocation
  `testrail case add 1 --data-file <symlink-pointing-at-secrets>`
  exits 1, never calls `client.addCase`, and **no bytes from the
  sentinel file appear in any captured outbound request body**
  (use a local HTTP listener as the TestRail target with the
  body-capture pattern from finding #4's test scaffold).
- `tests/cli-body-source.test.ts`: oversized regular file
  (`MAX_DATA_FILE_BYTES + 1` bytes) is rejected by the size
  check before the read; `/dev/zero` is rejected because its
  `lstat.size` is 0 but it's not `isFile()` (special).
- Positive control: legitimate `--data-file` with a regular
  4 KB JSON file still succeeds.

### 18. `--format table` reflects TestRail-controlled string fields verbatim to stdout (ANSI/OSC terminal injection on the success path) — `src/cli/output.ts:11–25, 32–51` (Severity: MEDIUM) — [SHIPPED]

Finding #16 closed the **error** reflection path (`stderr` via
`Error: ${message}`). The **success** path has the same class of bug
when the user picks `--format table` — except the reflected bytes
come from **TestRail**, not from the user's own argv.

```ts
// src/cli/output.ts:11–25
export function valueToString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') { … JSON.stringify … }
    if (typeof v === 'string') return v;        // ← raw, no escape encoding
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (typeof v === 'symbol') return v.toString();
    return '[Function]';
}

// src/cli/output.ts:32–51
export function renderTable(data: unknown): string {
    …
    const body = rows.map((r) =>
        keys.map((k, i) => valueToString(getField(r, k)).padEnd(widths[i] ?? k.length)).join(' | '),
    );
    return [header, line, ...body].join('\n');
}

// src/cli/output.ts:83–95
const out = (data: unknown): void => {
    if (opts.quiet) return;
    if (opts.format === 'table') {
        process.stdout.write(`${renderTable(data)}\n`);
    } else {
        process.stdout.write(`${safeJsonStringify(data)}\n`);
    }
};
```

- **JSON output is safe** — `safeJsonStringify` calls
  `JSON.stringify(data, null, 2)`, which encodes ESC `\x1b` as
  ``, all C0 controls as `\u00XX`, etc. The terminal sees the
  literal six-char ``, not the escape byte.
- **Table output is not** — `valueToString` returns the raw string
  for `typeof v === 'string'`. `renderTable` joins those raw strings
  with `' | '` padding and pipes the result to
  `process.stdout.write`. Any C0/C1 byte in a TestRail-side string
  field reaches the terminal as a control byte and is executed.

The relevant TestRail fields that the CLI surfaces via table output:

| Endpoint                                                  | Fields rendered                                                |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| `project get/list`                                        | `name`, `announcement`                                         |
| `suite get/list`                                          | `name`, `description`                                          |
| `case get/list`                                           | `title`, `refs`, `estimate`                                    |
| `section get` (via tree)                                  | `name`, `description`                                          |
| `run get/list`                                            | `name`, `description`, `refs`                                  |
| `milestone get/list`                                      | `name`, `description`                                          |
| `user get/list`                                           | `name`, `email`, `role`                                        |
| `plan get/list`                                           | `name`, `description`                                          |
| `result list`                                             | `comment`, `defects`                                           |
| `shared-step list`                                        | `title`, `custom_steps_separated[*].content` (via passthrough) |
| `bdd get` (returns raw text — already C0-bearing by spec) | Gherkin text                                                   |

Most of those fields accept arbitrary user input via the TestRail
UI; nothing in TestRail's API surface strips C0 control bytes before
storing.

**Threat models:**

1. **Hostile co-tenant on a shared TestRail instance** — a low-
   privilege TestRail user creates a case titled
   `"Innocuous title\x1b]52;c;<base64-of-attacker-payload>\x07"`.
   Any user who later runs `testrail case get <that_id> --format
table` or `testrail case list --project-id ... --format table`
   has the OSC 52 sequence executed by their terminal: clipboard
   overwritten with the attacker's payload. Next `cmd-V` somewhere
   sensitive pastes the attacker's choice.
2. **Cross-project leak via run / milestone descriptions** — the
   `run list` and `milestone list` outputs include `description`
   fields that often hold free-form notes. A user with write
   access to _any_ project in the TestRail tenant can plant
   payloads visible to every other user who lists runs across
   projects in `--format table`.
3. **Chains with finding #4 (redirect SSRF)** — an attacker who
   controls the redirect target returns crafted JSON
   (`{"name": "...\x1b[2J\x1b[?1049h..."}`) that gets surfaced via
   `--format table`. Terminal switches to the alternate screen
   buffer; the user's subsequent commands appear in a hidden
   buffer; the audit trail visible on the primary screen looks
   clean.
4. **Chains with finding #9 (cache poisoning)** — once the
   attacker's response shape is cached for the TTL, every
   `--format table` read from that cache key replays the
   injection. One redirect-borne response, five minutes of
   reliable terminal pwn.

The risk class is the same CWE-150 covered in #16, but with a
strictly larger threat model: the data source is **remote** and
**multi-tenant**, where #16's source was the operator's own argv.
A low-privilege TestRail account is enough; the attacker doesn't
need any local foothold on the operator's machine.

The same `valueToString` function is also exported and used by
test helpers and any consumer that imports `./cli/output.js`
directly (publicly re-exported per `package.json` exports map's
`./cli` subpath via `cli.ts`). Sanitisation should live in the
helper, not at the write site, so downstream callers also benefit.

**Fix sketch (S):** reuse the `sanitiseForTerminal` helper from
finding #16's fix (or introduce it in this fix and have #16's fix
share it):

```ts
function sanitiseForTerminal(s: string): string {
    return s.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, '�');
}

export function valueToString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') { … }
    if (typeof v === 'string') return sanitiseForTerminal(v);   // ← here
    …
}
```

Apply at `valueToString` — the single chokepoint that every table
cell flows through. JSON output already encodes controls, so no
change needed there.

As with #16, gate on `process.stdout.isTTY === true` so non-TTY
pipes (e.g., `testrail case list --format table > cases.tsv`) keep
the raw byte stream for downstream byte-exact tooling. The
sanitisation is a terminal-safety guard, not a sanitisation-at-
storage policy.

Tests:

- `tests/cli-helpers.test.ts`: `valueToString('foo\x1b[2J bar')`
  returns `'foo� bar'` (in TTY mode); returns the raw string in
  non-TTY mode.
- `tests/cli.test.ts`: subprocess: stub the client to return
  `{ id: 1, name: 'Inn\x1b]52;c;cGF5bG9hZA==\x07' }`; run
  `testrail project get 1 --format table`; assert stdout contains
  **no** `\x1b]52` byte sequence.
- `tests/cli.test.ts`: same test under `--format json` is a
  positive control — the encoded `` form appears in JSON
  and is harmless; assert the raw byte does NOT appear (proves
  the JSON path was never vulnerable, fixed-or-not).
- Regression: legitimate non-control content (emoji, RTL, IDN
  hostnames, dotted-quad IPs) round-trips through `valueToString`
  unchanged.

### 19. `install-skill`'s `mkdirSync` omits `mode`, producing world-writable directories under permissive `umask` — `src/cli/install-skill.ts:73` (Severity: LOW–MEDIUM) — [OPEN]

`runInstallSkill()` creates the install target's parent chain with
no explicit mode:

```ts
// src/cli/install-skill.ts:73
mkdirSync(dirname(target), { recursive: true });
```

Node's `fs.mkdirSync` defaults to mode `0o777` (rwxrwxrwx),
_umask-modified_ at the syscall (`mkdir(2)` applies the
process's umask). The resulting directory mode is
`0o777 & ~umask`. On most operator hosts (`umask 022` is the
Linux default) that's `0o755` — owner-write-only, world-readable.
Safe.

But several common operator environments ship a **permissive
umask** by default, and the library has no synchronous control over
it:

- **Distroless / busybox base images** — `busybox sh` historically
  set `umask 000` in its built-in init; even modern minimal
  containers inherit from a parent `sh` that may have set it.
- **Some CI runners** — GitHub Actions self-hosted runners,
  GitLab Kubernetes executors, and several CircleCI legacy
  images run with `umask 000` either explicitly or because the
  pod's PID 1 inherited it.
- **Mounted overlay filesystems** — when `~/.claude` is on a
  bind-mounted host volume from a container, the host's effective
  umask applies, not the container's perceived one.

Under any of those, `mkdirSync(dirname(target), { recursive: true })`
creates **`0o777` (world-writable)** directories at every level the
recursive walk had to create. That's all of:

- `<cwd>/.claude/`
- `<cwd>/.claude/skills/`
- `<cwd>/.claude/skills/testrail-cli/`

(or the `~` variants with `--global`). Any local user on the host
can subsequently:

1. **Drop files into the world-writable dir.** Other tooling that
   reads from `.claude/skills/` — Claude Code's own skills auto-
   loader is the canonical example, plus any third-party tool
   that crawls the same path — picks up attacker-placed
   `SKILL.md`-like files. The agent loads attacker-controlled
   instructions on next launch.
2. **Delete and replace the legitimate SKILL.md.** The file
   itself inherits its mode from `copyFileSync` (which copies
   source mode through umask — generally 0o644 stays 0o644), so
   the _file_ isn't world-writable. But the parent directory
   _is_, and POSIX permits unlinking any file in a writable
   directory regardless of the file's own mode. The attacker
   replaces SKILL.md with a malicious variant.
3. **Plant the symlinks that findings #5, #7, #17 already
   exploit.** This bug _enables_ those bugs to be cheaply
   weaponised on shared hosts — finding #5 requires the
   attacker to already have write access to the target
   directory; finding #19 hands them that access by default
   on permissive-umask hosts.

The umask-dependence makes the gap deceptive:

- Operators auditing on a developer laptop (umask 022) see
  `0o755` and conclude the install is locked down.
- The same code in their CI container produces `0o777`.
- The behaviour is silent — no warning, no log.

**Threat models:**

1. **Co-tenant on shared CI runner** — a runner that processes
   parallel jobs (each job sees the same shared `~`) is a
   multi-user host for the purposes of this finding even though
   nominally each job is "its own user." Pod1 runs
   `testrail install-skill --global`. Pod2 (same host, different
   user/UID) waits for the dir to exist, drops a malicious
   `~/.claude/skills/<other-tool>/SKILL.md`. Pod3 (back to the
   first user) runs Claude Code, which auto-loads the planted
   skill.
2. **Distroless container with persistent volume** — a service
   container running with `umask 000` (because its base image
   was busybox-derived) writes the skill to a persistent volume.
   The volume is later mounted by an admin container for
   debugging — the admin's tooling now has a planted file under
   a world-writable directory the attacker also has access to.
3. **Privilege boundary on a multi-user dev VM** — a shared
   dev server where each developer's `~` is on the same
   filesystem. Dev A's `umask 000` (because they sourced an
   unusual `.bashrc` setup script) installs the skill;
   `~/.claude/skills/testrail-cli/` is world-writable. Dev B
   (unrelated) plants a SKILL.md in dev A's tree pointing at
   their own malicious payload. Next time dev A re-runs Claude
   Code, the agent's runtime profile is partially controlled by
   dev B.

The fix is the same hardening that every well-audited CLI tool
applies when creating dot-directories under the operator's HOME:
pass an explicit, tight mode.

**Fix sketch (S):**

1. Pass an explicit mode on the create. `0o700` for `--global`
   targets (truly under `~`, where the owner is the only
   intended reader/writer) and `0o755` for project-local
   `<cwd>/.claude/skills/` (where other tooling in the project
   _does_ need to read it, but no other user should write):

    ```ts
    const mode = opts.global ? 0o700 : 0o755;
    mkdirSync(dirname(target), { recursive: true, mode });
    ```

2. After the create, **re-`chmod` the target leaf** so that
   even if `recursive: true` short-circuited (the dir already
   existed with a wider mode), the final state is tight:

    ```ts
    chmodSync(dirname(target), mode);
    ```

3. **Lock down the file mode too.** `copyFileSync` copies the
   source's mode but doesn't override the file's perms after
   the copy. Add an explicit `chmodSync(target, 0o600)` for the
   `--global` case and `0o644` for project-local. The
   global-mode file shouldn't be world-readable on a multi-user
   host — there's no reason a skill installed under `~/.claude/`
   needs to be readable by other UIDs.

4. **Warn loudly when the inherited umask is permissive.**
   At construction (or at install-skill entry), check
   `process.umask()` (which returns the current value without
   changing it) and if it's < `0o022`, emit a one-line stderr
   note: `Warning: umask 0xxx may produce overly-permissive
directory perms; --global install paths are being created with
explicit mode 0o700.` Operators on permissive-umask hosts get
   visibility into the trade-off.

Tests:

- `tests/install-skill.test.ts`: temp-dir setup with
  `process.umask(0o000)`, run `runInstallSkill({ force: false,
cwdOverride: tmp, ... })`, then assert
  `lstatSync(join(tmp, '.claude', 'skills', 'testrail-cli')).mode
& 0o777` is `0o755` (project-local case), not `0o777`.
- `tests/install-skill.test.ts`: same but with
  `opts.global = true` and `homeOverride: tmp`; assert mode is
  `0o700`.
- `tests/install-skill.test.ts`: assert the file's mode is
  `0o644` (project-local) / `0o600` (global) regardless of
  source mode and umask.
- Regression: under default umask `0o022`, the install behaviour
  is unchanged from today (same modes, no warnings, no errors).

### 20. `baseUrl` accepted with embedded userinfo (`user:pass@…`) → credential string preserved in heap, URLs, and fetch error metadata — `src/client-core.ts:255–290, 200, 603, 724, 813, 893` (Severity: LOW–MEDIUM) — [OPEN]

`validateConfig` parses `config.baseUrl` through `new URL()` and
checks the protocol and hostname, but **never inspects the URL's
`username` / `password` components**:

```ts
// src/client-core.ts:255–289
try {
    const url = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) { … }
    if (url.protocol === 'http:' && config.allowInsecure !== true) { … }
    // … hostname → PRIVATE_HOST_PATTERNS check …
}
```

`new URL('https://foo:bar@testrail.example.com/').hostname` is just
`testrail.example.com`; the regex check and the eventual DNS lookup
both see the bare hostname and pass. The full string —
`https://foo:bar@testrail.example.com` — is then stored as
`this.baseUrl` after the trailing-slash strip (L200) and
concatenated into every outbound URL:

```ts
// src/client-core.ts:603, 724, 813, 893 (one per fetch site)
const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
```

**What happens at the network layer:** undici's
`Request` constructor strips userinfo from the URL before serialising
the request line (per WHATWG fetch §5.5, "request's URL's username
and password" are removed in the _credentials_ path), AND the client
already sets an explicit `Authorization: Basic` header from
`config.email`/`config.apiKey`, so the userinfo in the URL doesn't
get forwarded as a _second_ auth header on the wire. So the
immediate "two auths sent" failure mode is avoided.

**What still leaks:**

1. **`this.baseUrl` retains the userinfo string for the lifetime
   of the client.** The destroy path at L560 zeroes `this.auth`
   (the proper Authorization-derived secret) but leaves `baseUrl`
   intact — that field is marked `readonly` and isn't touched by
   `destroy()`. A heap snapshot taken at any point during the
   client's life recovers `foo:bar` plaintext. The library
   already calls out the heap-dump risk for `this.auth`
   ("recoverable from a heap dump", L182–183 comment); the same
   risk applies to `this.baseUrl` and is not mitigated.
2. **Every URL string allocated for `fetch()` contains the
   userinfo.** Strings are immutable in V8; until GC reclaims
   them, each constructed URL sits in the heap with the secret
   embedded. With `maxRetries: 3` per call, a flaky run can
   allocate 4× the URL string per logical request.
3. **fetch error surfaces.** undici's `TypeError: fetch failed`
   error sets `error.cause` with diagnostic info; for some failure
   classes (DNS, TLS), the cause includes the host _with_
   userinfo when the URL was the input form. The client's
   network-error wrapper at L691 stuffs `error.message` into a
   `TestRailApiError`:
    ```ts
    throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
    ```
    The CLI then prints `e.message` to stderr (per finding #16's
    reflection surface). If the error message included the
    userinfo-bearing URL (verifiable via Node's
    `--experimental-network-inspection`), the credential reaches
    the user's terminal and CI logs.
4. **The `redirect: 'follow'` default (finding #4) preserves
   userinfo on same-origin redirects** — so any redirect at all
   issued by the server forwards `foo:bar` to the next URL in
   the chain. Even if the explicit Authorization header
   overrides it on the wire, the redirect rewrite metadata still
   moves the literal through internal state.

**Threat models:**

1. **Operator-as-attacker-to-themselves.** An operator who
   "conveniently" puts their TestRail API key in the URL — e.g.,
   migrating from a curl one-liner like `curl
https://email:apikey@testrail.example.com/api/...` — has both
   `--email`/`--api-key` _and_ userinfo in baseUrl. The library
   silently accepts it. Heap dumps, crash reports, CI artifacts
   ("dump environment for debugging") pick up the userinfo
   variant of the credential.
2. **Library mode + log capture.** Host applications that
   construct a `TestRailClient` log their `config` object on
   startup for ops visibility. `JSON.stringify(config)` includes
   `baseUrl` verbatim — the userinfo lands in the structured
   log pipeline (Datadog, Splunk, Logz). Whereas if the URL
   had been rejected at construction, the operator would have
   moved the secret to `email`/`apiKey` (which the log
   convention can redact).
3. **Force-multiplier on finding #11** (`--api-key` argv
   exposure). #11 covered argv-visible credentials. The
   userinfo path is a _second_ uncovered surface for the same
   class of operator mistake — and the library currently
   guarantees neither is rejected nor sanitised.

The fix is a 4-line addition during `validateConfig` parsing
that all major HTTP clients adopt (axios, ky, undici-direct, gh
CLI's URL parser):

**Fix sketch (S):**

1. Reject any `baseUrl` whose URL contains a non-empty
   `username` or `password`:

    ```ts
    // src/client-core.ts:257 (inside the existing try { … } block)
    const url = new URL(config.baseUrl);
    if (url.username !== '' || url.password !== '') {
        throw new TestRailValidationError(
            'baseUrl must not contain userinfo (user:pass@host); ' +
                'pass credentials via the email and apiKey config fields.',
        );
    }
    ```

2. Add a defensive normaliser step on the stored `baseUrl` even
   under `allowPrivateHosts`/escape-hatch paths: serialise the
   URL via `url.origin + url.pathname.replace(/\/$/, '')` rather
   than `config.baseUrl.replace(/\/$/, '')`. `url.origin` is
   guaranteed by WHATWG to _not_ include userinfo, so a future
   bypass that slips past the validation gate still doesn't
   reach `this.baseUrl`. (This is the same hardening pattern as
   #15's "broaden the synchronous check" — failure cases get
   stripped, not just rejected.)

3. Document in the README's Config section that credentials
   belong in `email` / `apiKey`, never in `baseUrl`. The HELP
   text at L87–90 of `index.ts` already lists the env-var /
   flag forms; cross-reference them from a new "Auth" section
   in the README.

Tests:

- `tests/client-features.test.ts`: every variant of userinfo
  rejects at construction with the new error wording —
  `https://u@host/`, `https://u:p@host/`, `https://:p@host/`,
  `https://%40:p@host/` (encoded `@` in username).
- `tests/client-features.test.ts`: a benign `baseUrl` without
  userinfo continues to round-trip through `this.baseUrl`
  unchanged.
- `tests/client-features.test.ts`: even if the validation
  check is bypassed (mock the URL constructor to lie about
  `.username`), the `url.origin`-based normaliser ensures
  `this.baseUrl` never contains the userinfo string. Defence-
  in-depth assertion.
- `tests/client-edge-cases.test.ts`: a redirect from a
  userinfo-bearing URL (per finding #4's eventual fix) does
  _not_ forward the userinfo to the redirect target — the
  normalised baseUrl never had it.

### 21. Slowloris-on-body DoS: timeout cleared before body is read — `src/client-core.ts:611–625, 732–746, 826–840, 896–908` (Severity: MEDIUM) — [OPEN]

All four fetch sites share the same timeout pattern, and the same
bug:

```ts
// src/client-core.ts:611–625 (request<T>; identical at 732/826/896)
const timeoutId = setTimeout(() => controller.abort(), this.timeout);
// …
try {
    const response: Response = await fetch(url, options);
    clearTimeout(timeoutId);              // ← timeout disarmed here
    // …
    const responseText = await response.text();   // ← unbounded wait
```

The `setTimeout(...).then abort` only protects the **headers
roundtrip** — `await fetch(...)` resolves as soon as response
headers arrive, even before any body byte is received. The very
next line clears the timeout, so the body read (`response.text()`,
`response.arrayBuffer()`) runs with **no time budget**.

WHATWG fetch's `AbortController` is plumbed through both the
request _and_ the response body stream — aborting the signal
errors the body read. The library wires that correctly via
`signal: controller.signal` in the `RequestInit`. The bug is
that the timer that would _fire_ the abort gets cancelled the
moment headers land.

**This is textbook slowloris-on-response.** A malicious or
compromised TestRail-shaped origin (or any host reached via #4's
redirect path):

1. Receives the request, returns `200 OK` headers immediately.
2. Drips body bytes one at a time, say one byte every 30
   seconds, for the next 7 days.
3. The client's `response.text()` call sits in an `await` for the
   full week (or until the underlying TCP/HTTP layer gives up on
   its own, which undici's default keep-alive timeout doesn't
   prevent on a steadily-drip-fed connection).

The advertised `timeout: DEFAULT_TIMEOUT_MS = 30_000` (30 s)
config is silently ignored for body reads. Even
`timeout: MAX_TIMEOUT_MS = 300_000` (5 min, the documented upper
bound) doesn't help once headers have landed.

**Affected paths** — every fetch in the codebase:

| Method             | setTimeout site | first clearTimeout (headers) | body read after               |
| ------------------ | --------------- | ---------------------------- | ----------------------------- |
| `request<T>`       | L611            | L625                         | L628 (error) / L653 (success) |
| `requestText`      | L732            | L746                         | L749 / L767                   |
| `requestMultipart` | L826            | L840                         | L843 / L850                   |
| `requestBinary`    | L896            | L908                         | L911 / L925                   |

The pattern is symmetric across all four; fix one, fix the
template for all.

**Force-multipliers on the existing findings:**

- **#4 (redirect SSRF):** an attacker who redirects to a slow-
  responding internal endpoint (e.g., an internal metrics
  scraper that streams metrics at 1 byte/s as a "performance
  preview" — surprisingly common) holds the client open for
  hours. Each held connection consumes one rate-limit slot
  and one socket. A handful of such redirects exhausts the
  agent's rate limiter and its socket pool simultaneously.
- **#12 (unbounded response body):** combined, the attacker
  drips bytes _and_ the buffer grows unbounded. Hits the
  V8 ~1 GB string-length limit after a few days of dripping
  one byte per 30 seconds — by which time the agent is long
  gone, but the rate-limit and socket exhaustion already
  occurred.
- **#13 (POST idempotency):** since 5xx-and-network-error are
  the only retry triggers and slowloris produces neither (the
  server happily returns 200 from the client's perspective),
  retries don't even kick in — the client just hangs in the
  first attempt. No retry storm; just silent stall.
- **#9 (cache poisoning):** the slow drip eventually completes
  (or doesn't); if it does, the bad data is cached for the TTL.
  If it doesn't, the call never returns — no cache write — but
  every subsequent concurrent call to the same endpoint is its
  own fresh slowloris (no shared promise dedup; cf. #14's
  stampede note).

**Fix sketch (M):** keep the timer armed until the body is fully
consumed, OR re-arm it for the body phase. Two practical shapes:

A. **Don't clear until after the body.** Move the
`clearTimeout(timeoutId)` calls to **after** the
corresponding `response.text()` / `response.arrayBuffer()`:

```ts
try {
    const response: Response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        clearTimeout(timeoutId); // ← moved
        // … retry / throw …
    }
    if (method !== 'GET') this.clearCache();
    const responseText = await response.text();
    clearTimeout(timeoutId); // ← moved
    // … parse / return …
} catch (error) {
    clearTimeout(timeoutId); // unchanged
    // … existing catch …
}
```

Simplest patch; the same `this.timeout` budget now covers
headers + body, end-to-end. Aborts mid-body-read via the
existing `controller.abort()` are mapped to `AbortError`
in the existing catch block and produce the existing
408 `TestRailApiError` shape — no new error-class plumbing.

B. **Re-arm with a separate body timeout.** Stricter: track
header arrival as the end of phase 1, then schedule a fresh
`setTimeout` for the body phase with the same (or a shorter)
budget. Lets operators tune them independently
(`headerTimeout` / `bodyTimeout`) via a follow-up config knob.
Defer this shape unless an operator asks; (A) closes the
bug with a minimal patch.

In both shapes, pair the fix with finding #12's size-capped
streamed read so the budget enforces _time_ and the cap enforces
_bytes_ — two orthogonal guards.

Tests:

- `tests/client-features.test.ts`: stub `fetch` to return a
  `Response` whose body is a `ReadableStream` that yields one
  byte every 200 ms (or a custom `setTimeout`-paced
  controller). Set `timeout: 500`. Assert
  `client.getProject(1)` rejects with the 408
  `TestRailApiError` _because the body wasn't fully read in
  time_, not because headers were late. Measure wall-clock —
  the rejection must arrive within ~500 ms + tolerance, not
  after the stream completes.
- `tests/client-features.test.ts`: same pattern for
  `requestBinary` (binary slow-drip), `requestText`,
  `requestMultipart` — proves all four sites are patched.
- Regression: a fast normal response still completes within
  the configured timeout window and does not falsely abort.
- `tests/client-features.test.ts`: error path — a slow-drip
  body on a 5xx response. The body is read for the
  `TestRailApiError.response` field; assert that read is also
  time-budgeted (i.e. the L628/L749/L843/L911 error-body reads
  share the patched clear-timeout site).

### 22. Prototype-chain property access in `dispatch()` crashes the CLI on `Object.prototype` resource names — `src/cli/dispatch.ts:118–131, 144–163` (Severity: LOW) — [OPEN]

`RESOURCES` is built as a plain JS object (its prototype is
`Object.prototype`), and `dispatch()` reads it with bracket-access on
user-supplied argv:

```ts
// src/cli/dispatch.ts:118–131
const RESOURCES: Record<string, readonly string[]> = (() => {
    const grouped: Record<string, string[]> = {};
    for (const key of Object.keys(HANDLERS)) {
        const [resource, action] = key.split(':');
        if (resource === undefined || action === undefined) continue;
        const existing = grouped[resource];
        if (existing === undefined) { grouped[resource] = [action]; }
        else { existing.push(action); }
    }
    return grouped;
})();

// src/cli/dispatch.ts:144–157
export function dispatch(resource: string, action: string): DispatchResult {
    const actions = RESOURCES[resource];        // ← walks proto chain
    if (actions === undefined) {                // ← truthy proto values bypass
        return { ok: false, error: `Unknown resource '${resource}'...` };
    }
    if (!actions.includes(action)) { ... }     // ← TypeError on non-array
    ...
}
```

Standard CWE-1321-adjacent gadget. For every property name that
exists on `Object.prototype`, `RESOURCES[name]` returns the
prototype's value rather than `undefined`:

| `resource` argv                                                                   | `RESOURCES[resource]` returns         | `.includes(...)` outcome                        |
| --------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| `__proto__`                                                                       | `Object.prototype` (the proto itself) | `TypeError: actions.includes is not a function` |
| `constructor`                                                                     | `Object` (the constructor function)   | `TypeError: actions.includes is not a function` |
| `toString`                                                                        | `Function.prototype.toString`         | `TypeError: actions.includes is not a function` |
| `valueOf`                                                                         | `Object.prototype.valueOf`            | `TypeError: actions.includes is not a function` |
| `hasOwnProperty`                                                                  | `Object.prototype.hasOwnProperty`     | `TypeError: actions.includes is not a function` |
| `isPrototypeOf`                                                                   | `Object.prototype.isPrototypeOf`      | `TypeError: actions.includes is not a function` |
| `propertyIsEnumerable`                                                            | …                                     | `TypeError: actions.includes is not a function` |
| `toLocaleString`                                                                  | …                                     | `TypeError: actions.includes is not a function` |
| `__defineGetter__` / `__defineSetter__` / `__lookupGetter__` / `__lookupSetter__` | …                                     | same shape                                      |

Empirical confirmation (Node 24):

```
$ node -e "const r = {}; try { r['__proto__'].includes('x'); } catch(e) { console.log(e.message); }"
r.__proto__.includes is not a function
```

The TypeError propagates up to `main()`'s catch at `index.ts:281`:

```ts
} catch (e: unknown) {
    err(e instanceof Error ? e.message : String(e));
    return 1;
}
```

The user sees a bare `Error: actions.includes is not a function`
on stderr instead of the clean `Unknown resource '__proto__'.
Use: project, suite, ...` shape that every other unknown-resource
case returns.

**Impact assessment:**

- **No data leak.** The TypeError message is generic V8 wording;
  it doesn't reveal the resource string or actions list.
- **No auth bypass.** The dispatch fails before any client is
  constructed (the `RESOURCES[resource]` check at L145 runs
  before `resolveAuth()` at L217).
- **No write-side effect.** Construction of `RESOURCES` (the
  IIFE at L118–131) operates on the static `Object.keys(HANDLERS)`,
  none of which contain `__proto__`-style keys; the
  `grouped[resource] = [action]` write at L125 never gets a
  prototype-poisoning input. The IIFE is safe in isolation; the
  gadget lives entirely on the consumer-side read at L145.
- **Per-invocation DoS only.** The CLI exits 1 on the
  malformed-resource input, which is the same outcome an
  agent would get for any typo. Slightly worse UX (cryptic
  error instead of the canonical "Unknown resource ... Use:
  ..." menu).
- **Class signal.** The vulnerability class is well-known
  (CWE-1321), and even though _this_ instance has low impact,
  the same pattern (`Record<string, …>` with prototype-typed
  default + bracket access on user input) crops up in 5 more
  places in this codebase that should be audited together: 1. `RESOURCES[resource]` (L145) — _this finding_ 2. `HANDLERS[\`${resource}:${action}\`]`(L158) — concatenated
key, accidentally safe:`'**proto**:foo'`isn't on
Object.prototype, so this access returns`undefined`. But
`resource = 'constructor', action = 'prototype'`→`HANDLERS['constructor:prototype']`is`undefined`. Safe
       _by accident_ — change the join character and the safety
       evaporates.
    3. `grouped[resource]`(L123) — write-side; safe per above
       because keys come from`Object.keys(HANDLERS)`.
    4. `Object.keys(RESOURCES).join(', ')`in the error message
       (L149) —`Object.keys`enumerates only own properties, so
       prototype gunk doesn't reach the user-visible string.
       Safe.
    5.`ACTIONS.find(...)`in`getActionSpec` (`metadata.ts:551`) —
       `Array.prototype.find` only iterates indexed entries; no
  proto walk. Safe.

            (1) is the only live bug. (2) is a latent footgun.

**Fix sketch (S):** switch `RESOURCES` to a prototype-less
container so bracket access can't walk into `Object.prototype`:

A. **`Object.create(null)`** — minimal change, preserves the
`Record<string, readonly string[]>` typing:

```ts
const RESOURCES: Record<string, readonly string[]> = (() => {
    const grouped: Record<string, string[]> = Object.create(null);
    for (const key of Object.keys(HANDLERS)) {
        const [resource, action] = key.split(':');
        if (resource === undefined || action === undefined) continue;
        const existing = grouped[resource];
        if (existing === undefined) grouped[resource] = [action];
        else existing.push(action);
    }
    return grouped;
})();
```

`Object.create(null)` produces an object with `__proto__ === null`,
so `grouped['__proto__']` reads literal `undefined` (no
prototype walk) and the existing `if (actions === undefined)`
branch returns the clean error.

B. **`Map<string, readonly string[]>`** — stronger guarantee.
Map's `get()` is fully prototype-isolated and the API forces
the call sites to be explicit:

```ts
const RESOURCES = new Map<string, readonly string[]>();
// … construct … RESOURCES.set(resource, [...existing, action]) …

const actions = RESOURCES.get(resource);
if (actions === undefined) { … }
```

Pick (A) if the goal is the minimum patch; pick (B) if you want
the same hardening applied to `HANDLERS` (L158 latent footgun) at
the same time — `HANDLERS` is the dispatch table that _will_
hit a similar gadget the day someone changes the join char or
introduces a hashed key.

Tests:

- `tests/cli.test.ts`: subprocess: `testrail __proto__ foo` exits
  1 with stderr matching `Unknown resource '__proto__'`. (The
  `''` arg quote prevents bash from expanding; supply via
  argv-array to the test's `spawnSync`.)
- Same for `constructor`, `toString`, `valueOf`, `hasOwnProperty`,
  `propertyIsEnumerable`, `isPrototypeOf`. Use `it.each`.
- `tests/cli-helpers.test.ts`: assert
  `dispatch('__proto__', 'foo').error.startsWith("Unknown resource")`.
- Regression: legitimate `dispatch('project', 'get')` still
  returns `{ ok: true, handler }`.

### 23. Cache stampede: N concurrent identical GETs fan out into N parallel network calls — `src/client-core.ts:591–598, 661–665` (Severity: LOW–MEDIUM) — [OPEN]

The GET-LRU is a _result_ cache, not an _in-flight_ cache. The cache
write only happens after the response body parses; until then, every
concurrent reader sees a miss:

```ts
// src/client-core.ts:591–598 (request<T>)
if (method === 'GET' && !skipCache) {
    const cacheKey = `${method}:${endpoint}`;
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData !== undefined) {
        return cachedData;
    }
}
// … fetch … parse JSON …
// src/client-core.ts:661–665
if (method === 'GET' && !skipCache) {
    const cacheKey = `${method}:${endpoint}`;
    this.setCachedData(cacheKey, result);
}
return result;
```

For `N` concurrent callers of `client.getCase(42)`:

1. Caller 1: cache miss → starts fetch
2. Caller 2 (before caller 1's fetch resolves): cache miss → starts fetch
3. Caller 3: cache miss → starts fetch
4. …
5. Caller N: cache miss → starts fetch
6. All N fetches resolve, each writes to cache (overwrites are no-ops)
7. All N callers return the same data

**N parallel network roundtrips, N cache writes, N rate-limit slots
consumed, N response bodies allocated** — for a logical single read.
Standard "cache stampede" / "dogpile" anti-pattern.

**Compounding bug surfaces:**

1. **Rate limit exhaustion.** `checkRateLimit` (L383–405) records
   each request in a sliding-window array. With the default
   `maxRequests: 100`, a single `Promise.all(ids.map(id =>
client.getCase(id)))` over 100 unique IDs eats 100 slots in
   one tick. The next non-redundant call throws 429 with the
   "wait 60 seconds" message. With _duplicate_ IDs in the
   array, the same endpoint hits N times — pure waste. Agents
   that defensively call `Promise.all([client.getProject(1),
client.getProject(1), ...])` (intending to read once but
   accidentally creating an array with the same ID via a loop
   bug) instantly deplete the budget.

2. **Force-multiplier on finding #12** (unbounded response
   body). The body-size limit is per-response, but with the
   stampede there are N responses allocating in parallel —
   peak memory ≈ N × cap. The fix sketch in #12 set
   `DEFAULT_MAX_RESPONSE_BYTES = 50 MB`; 100-way stampede at
   that cap puts the agent at 5 GB peak before backpressure.

3. **Force-multiplier on finding #21** (slowloris-on-body).
   If the server slow-drips, _every_ stampede caller is its own
   slowloris connection. 100 open sockets per stampede. The
   socket pool exhausts long before the body-read time-budget
   (post-#21 fix) fires for any single call.

4. **Force-multiplier on finding #4** (redirect SSRF). A
   single redirect to an internal endpoint is bad; N parallel
   redirects from a stampede are an internal-port-scan
   amplifier — N TCP connections to the SSRF target instead
   of 1.

5. **Force-multiplier on finding #13** (POST retry idempotency).
   Stampede only affects GET (POSTs always allocate fresh), but
   if a GET stampede causes one of the N concurrent fetches to
   fail with a 5xx, _that one_ retries with backoff — while
   the other N-1 succeed. The retry's exponential-backoff
   sleep happens _after_ its N-1 siblings have already
   populated the cache, so the retry's final fetch is wasted
   work even after the cache is warm.

**Threat models:**

1. **Self-DoS via batch agent.** An agent issues
   `Promise.all(...)` over a deduplication-bug array (e.g.
   `cases.flatMap(c => [c.id, c.id])` — common debounce/coalesce
   error). 200 concurrent calls instead of 100; agent hits the
   rate limit it set for itself.
2. **Cold-cache stampede on startup.** A long-running host
   process restarts; the cache is empty. The first inbound
   request burst (10 dashboards refreshing
   "TestRail status" simultaneously, each calling `getProject(1)`)
   produces 10 parallel calls. With 100 requests/min limit,
   that's 10 percent of the budget on one operation that's
   trivially cacheable.
3. **Chained with finding #9** (cache poisoning). N
   concurrent fetches to a flapping upstream produce N
   _different_ outcomes (caller 1 sees 200 with shape A;
   caller 2 sees 200 with shape B during the flap). The
   last-write-wins semantics of the cache mean only one
   shape ends up cached, but each caller has _already_ used
   their copy. Cross-caller data-integrity drift, undetectable
   from inside any single caller.

**Fix sketch (S):** introduce an in-flight Promise map keyed by the
same `GET:${endpoint}` string so the second-and-later concurrent
readers hook onto the first reader's pending promise:

```ts
// Field on TestRailClientCore:
private readonly inflight = new Map<string, Promise<unknown>>();

// In request<T>(), replace lines 591–598 with:
if (method === 'GET' && !skipCache) {
    const cacheKey = `${method}:${endpoint}`;

    // Hit the result cache first.
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData !== undefined) return cachedData;

    // Result-cache miss → check the in-flight cache.
    const pending = this.inflight.get(cacheKey);
    if (pending !== undefined) return pending as Promise<T>;
}

// After successful parse, register and clean up:
const inflightPromise = doFetchAndParse();   // refactor body into a helper
if (method === 'GET' && !skipCache) {
    this.inflight.set(cacheKey, inflightPromise);
    inflightPromise.finally(() => this.inflight.delete(cacheKey));
}
return inflightPromise as Promise<T>;
```

Key constraints:

- **Coalesce on success _and_ on rejection.** All N concurrent
  callers share the same outcome — if the leader fetch fails,
  every follower sees the same `TestRailApiError`. Don't
  re-issue from the followers (that re-introduces the stampede
  for the retry case).
- **Don't coalesce across `skipCache: true`** — the existing
  escape hatch (5th argument to `request<T>`) is there for
  callers that _need_ a fresh fetch; preserve that contract.
- **Don't coalesce POSTs.** Their `data` parameter differs per
  call; their server-side side effects must not be deduplicated
  (the very thing #13's idempotency fix protects against). The
  `method === 'GET'` gate already provides this; keep it.
- **Apply symmetrically to `requestBinary`.** Same flow, same
  bug, same fix shape — `attachment get` is the canonical
  reader workload that the stampede afflicts hardest (large
  binary, slow round-trips, expensive to repeat).

`requestText` and `requestMultipart` are not affected:
`requestText` already bypasses cache by design (the comment at
L703 notes this is intentional to avoid cross-method collisions);
`requestMultipart` is POST-only.

Tests:

- `tests/client-features.test.ts`: spawn 50 concurrent
  `client.getProject(1)` calls; stub `fetch` to count
  invocations and resolve after a microtask. Assert exactly
  **one** fetch happens. All 50 callers receive identical
  references (or identical-by-value, if combined with #14's
  fix).
- `tests/client-features.test.ts`: 50 concurrent calls where
  the leader's fetch rejects with a 502 (no retry — assume
  `maxRetries: 0` for this test). Assert all 50 receive the
  same `TestRailApiError` and exactly **one** fetch happened.
- `tests/client-features.test.ts`: heterogeneous concurrent
  calls — 30 × `getProject(1)` + 20 × `getProject(2)`. Assert
  exactly **two** fetches happen, partitioned correctly.
- `tests/client-features.test.ts`: regression — sequential
  calls behave identically to today (no inflight entry
  visible to the second call because the first already
  cleaned up via `.finally`).
- `tests/client-edge-cases.test.ts`: a successful concurrent
  burst followed by a `skipCache: true` call still issues a
  fresh fetch (`skipCache` honoured).

### 24. Unbounded stdin read for write-action bodies — `src/cli/index.ts:269`, `src/cli/body.ts:75–78` (Severity: LOW–MEDIUM) — [SHIPPED — partial]

> **Scope shipped in v3.0:** memory-exhaustion DoS only. `readBoundedStdin`
> in `src/cli/stdin.ts` caps accumulated bytes at 1 MiB; pipes larger
> than that throw before any allocation past the cap.
>
> **Follow-up (not shipped):** a producer that holds the pipe open
> without ever sending more than `maxBytes` (e.g. `tail -f`, a FIFO
> writer that never closes, a slow trickle) still blocks the CLI
> indefinitely on the synchronous `fs.readSync` call. Closing that
> requires switching `BodyInput.readStdin` from `() => string` to
> `() => Promise<string>`, replacing the `readSync` loop with an
> async stream reader gated by an `AbortController`/wall-clock
> deadline (e.g. 30 s), and threading the async signature through
> `resolveBody`. Surfaced by Copilot review on PR #70. Track as
> "stdin wall-clock deadline" — extends this finding rather than
> reopens it, since the memory-DoS half is locked in.

The CLI exposes stdin as the third body source (alongside `--data`
and `--data-file`) via a thunk that performs an _unbounded_ read from
file descriptor 0:

```ts
// src/cli/index.ts:269
...(process.stdin.isTTY === false && !isFileInputAction && {
    readStdin: () => readFileSync(0, 'utf-8'),
}),
```

```ts
// src/cli/body.ts:73–78  (resolveBody)
} else {
    try {
        raw = (input.readStdin as () => string)();   // ← reads ALL of stdin
    } catch (e) {
        return { ok: false, error: `Cannot read stdin: ...` };
    }
    ...
}
```

`readFileSync(0, 'utf-8')` blocks until EOF and buffers the entire
stream into a single UTF-8 string. The only gate is the
`process.stdin.isTTY === false` check at index.ts:269 — present
_only_ to avoid trying to drain an interactive terminal — and the
fileInput-action exclusion (which already covers attachment
uploads). There is no size cap, no time budget, no chunk-level
backpressure, and no aware-of-content-shape early termination.

**Concrete failure modes:**

| Invocation                                                  | Outcome                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `yes 'y' \| testrail case add 1`                            | `readFileSync(0)` buffers `y\ny\ny\n...` until V8 hits its ~1 GB string limit → `RangeError`   |
| `cat /dev/zero \| testrail case add 1`                      | Same shape; OOM-kill is faster on 32-bit V8 / constrained containers (kernel OOM-killer fires) |
| `tail -f /var/log/app.log \| testrail case add 1`           | `readFileSync(0)` blocks forever (no EOF); process hangs indefinitely                          |
| `dd if=/dev/random bs=1M count=2048 \| testrail case add 1` | 2 GB string allocation — OOM-killed in any default container                                   |
| `nc -l 4444 \| testrail case add 1`                         | Same as `tail -f`; netcat doesn't close stdin until the remote does                            |

The same gap that finding #17 closed for `--data-file` exists on
the stdin path, with a worse contract: a regular file has a known
size you can `lstat()` _before_ opening; a stdin pipe has no size
metadata at all, so the only sane defence is a hard byte cap plus
a hard wall-clock budget.

The `MAX_DATA_FILE_BYTES` constant proposed in #17 is the natural
ceiling for _both_ paths; the stdin path also needs the
**wall-clock cap** because a slow producer (or a never-closing fifo,
or `tail -f`) has no size to check up-front.

**Threat models:**

1. **Prompt-injected agent piping unbounded streams.** An LLM agent
   is told (via a poisoned doc) to "tail the build log and pipe
   each line as a case-add". The agent constructs
   `tail -f /var/log/build.log | testrail case add 42`. The CLI
   blocks indefinitely; the agent considers the call "in progress"
   and either hangs its own loop or eventually crashes the
   container. Either is a clean DoS primitive against the agent's
   own progress.
2. **Adversarial CI step.** An attacker who controls one upstream
   step in a CI pipeline (e.g., a malicious shared action) emits
   gigabytes of data on its stdout. The next step pipes that
   stdout through `testrail`. The runner OOM-kills the entire job;
   later steps (security scans, audit logging) never run.
3. **Self-DoS via shell mis-quoting.** A human operator writes
   `cat large.json | testrail case add 1` but the file is
   100 MB instead of the expected 1 KB. V8 allocates the
   100 MB string before JSON.parse even sees it. On a CI runner
   with a 512 MB heap cap, the call OOMs _before_ the JSON parser
   could surface the actual error ("body too large; max
   `MAX_REQUEST_BODY_BYTES`").
4. **Force-multiplier on finding #10** (`strict: false` typo'd
   flags). An agent issues
   `echo '{...huge...}' | testrail case add 1 --dryrun --yes`
   (typo'd `--dryrun`). The dry-run gate doesn't engage; the
   massive stdin still gets drained _and_ the real API call
   fires with the bloated payload. TestRail rejects 4xx, but the
   memory and time cost happened.

The CI threat (model 2) is the sharpest: in any pipeline where a
predecessor step's stdout is attacker-influenced, the testrail CLI
becomes a DoS amplifier.

**Fix sketch (S–M):** introduce two caps and read stdin via a stream
with byte counting + timeout:

1. Constants in `src/constants.ts`:
    ```ts
    export const MAX_STDIN_BODY_BYTES = 4 * 1024 * 1024; // same as MAX_DATA_FILE_BYTES from #17
    export const MAX_STDIN_WAIT_MS = 30 * 1000; // 30 s default
    ```
2. Replace the `readFileSync(0)` thunk with a stream-based reader
   that yields a `BodyResolution`-compatible result:
    ```ts
    async function readStdinCapped(
        maxBytes: number,
        timeoutMs: number,
    ): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
        return new Promise((resolve) => {
            const chunks: Buffer[] = [];
            let total = 0;
            const timer = setTimeout(() => {
                process.stdin.removeAllListeners();
                resolve({ ok: false, error: `stdin read exceeded ${timeoutMs} ms` });
            }, timeoutMs);
            process.stdin.on('data', (chunk: Buffer) => {
                total += chunk.byteLength;
                if (total > maxBytes) {
                    clearTimeout(timer);
                    process.stdin.removeAllListeners();
                    resolve({ ok: false, error: `stdin exceeded ${maxBytes} bytes` });
                    return;
                }
                chunks.push(chunk);
            });
            process.stdin.on('end', () => {
                clearTimeout(timer);
                resolve({ ok: true, text: Buffer.concat(chunks).toString('utf-8') });
            });
            process.stdin.on('error', (err) => {
                clearTimeout(timer);
                resolve({ ok: false, error: err.message });
            });
        });
    }
    ```
3. Plumb the async result into `resolveBody`. Today the thunk is
   sync (`() => string`); making it `() => Promise<...>` is a
   small refactor — `resolveBody` already returns
   `BodyResolution<T>` and is awaited at the handler boundary, so
   the only change is dropping the `as () => string` cast and
   awaiting the thunk.
4. **Refuse non-pipe stdin sources defensively.** Today the
   `process.stdin.isTTY === false` gate is the only filter. Add an
   `fstatSync(0).isFIFO() || isSocket() || isCharacterDevice()`
   check; warn and refuse for `isDirectory()` / other surprising
   cases.

Tests:

- `tests/cli-body-source.test.ts`: write `MAX_STDIN_BODY_BYTES + 1`
  bytes to a piped child's stdin; assert exit 1 + the
  "stdin exceeded ... bytes" error fragment + no API call made.
- `tests/cli-body-source.test.ts`: open a fifo, never close it,
  pipe to the CLI's stdin; assert the call rejects with the
  "stdin read exceeded ... ms" error within
  `MAX_STDIN_WAIT_MS + tolerance`.
- `tests/cli-body-source.test.ts`: positive — a normal 4 KB JSON
  on stdin still parses and the call succeeds.
- `tests/cli.test.ts`: subprocess: `yes 'y' | testrail case add 1
--base-url ... --email ... --api-key ...` exits 1 within ~30 s,
  not after V8's RangeError.

### 25. `Retry-After` honored only for 429; ignored on 503 and all other retryable 5xx — `src/client-core.ts:632–636, 751–754, 915–918` (Severity: LOW–MEDIUM) — [OPEN]

All three retryable code paths gate the `Retry-After` parse on
`response.status === 429` and use exponential backoff for every
other 5xx:

```ts
// src/client-core.ts:632–636 (request<T>; identical at 751 and 915)
if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
    const retryAfterMs = response.status === 429 ? this.parseRetryAfterMs(response) : null;
    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
    await sleep(delay);
    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
}
```

`getRetryDelay(retryCount)` is `min(1000 * 2^N, 10000)` — i.e. 1 s,
2 s, 4 s, 8 s, 10 s, … capped at 10 s. With `maxRetries: 3`
(default) the client retries at +1 s, +2 s, +4 s = at most 7 s of
upstream-friendly backoff.

**RFC 7231 §7.1.3 explicitly authorises `Retry-After` on `503
Service Unavailable`:**

> "The `Retry-After` HTTP header field can be used with any
> 3xx (Redirection) … or 503 (Service Unavailable) response to
> indicate how long the user agent ought to wait before making
> a follow-up request."

503 is _the_ canonical advertised-outage status — every well-known
upstream (CloudFront, Cloudflare, NGINX rate-shaping middleware,
Kubernetes ingress with maintenance pages) returns
`503 Retry-After: <N>` when load-shedding. TestRail's own
operational runbook recommends sending `Retry-After` from
maintenance-mode and from its built-in rate guard for batch
upserts.

The client ignores all of that signal. When TestRail (or any proxy
in the path) returns `503 Retry-After: 60` to a fleet of clients,
this client retries at +1 s, +2 s, +4 s — **hitting the upstream 3
times before the operator's stated 60 s window has even opened**.
With three retries per logical call and one rate-limit slot per
attempt, a single batch read hammers the upstream during the very
window it asked to be left alone.

**Compounding bug surfaces:**

1. **Self-DoS during real outages.** A 100-call batch under
   503 conditions multiplies into ~400 fetches (1 initial +
   3 retries × 100) inside the first 7 s — exactly when the
   upstream is least able to handle it. The
   `cleanupAllClients`/`signal handler` discussion in finding
   #8 already noted the library doesn't help operators do graceful
   shutdown; here it actively works _against_ graceful
   degradation.
2. **Cross-tenant noisy-neighbour.** TestRail's per-account
   rate budget is finite; one client that retry-storms during
   503 consumes budget that another client (in the same TestRail
   account) needs to do correct work.
3. **Stampede multiplier on finding #23.** N concurrent
   GETs to a 503-returning upstream each retry 3 times. 100-way
   stampede × 4 attempts = 400 hits in the first 7 s, instead
   of 1 hit + the operator-requested 60 s wait.
4. **Time-budget thrashing with finding #21 (slowloris).** If
   the 503 includes a slow-drip body (some load-shedders
   intentionally slow-respond to throttle clients), the
   _unbounded_ error-body read combined with rapid retries
   produces overlapping slow reads that exhaust the socket
   pool.
5. **The HTTP-date branch of `parseRetryAfterMs` is also
   unreachable for 5xx.** `parseRetryAfterMs` already handles
   both numeric-seconds (`Retry-After: 60`) and HTTP-date
   (`Retry-After: Wed, 21 Oct 2026 07:28:00 GMT`) forms; both
   are dead code for any 5xx because the L632 gate cuts off
   before the parser runs.

The fix is one line — drop the `=== 429` gate so 503 (and every
other 5xx that includes the header) shares the same parse path:

```ts
const retryAfterMs = this.parseRetryAfterMs(response);
const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
```

`parseRetryAfterMs` already returns `null` when the header is
absent or unparseable, so the fallback to `getRetryDelay()` is
preserved for 5xx responses without `Retry-After` (the common
case). And the existing cap at `MAX_RETRY_DELAY_MS = 10 s`
inside `parseRetryAfterMs` prevents a misbehaving / hostile
upstream from holding the client open for hours via
`Retry-After: 999999`.

**Fix sketch (S):** apply the one-line change at three sites:

| Site                          | File:Line                |
| ----------------------------- | ------------------------ |
| `request<T>` retry trigger    | `src/client-core.ts:633` |
| `requestText` retry trigger   | `src/client-core.ts:752` |
| `requestBinary` retry trigger | `src/client-core.ts:916` |

Drop the `response.status === 429 ?` ternary in each. Document the
behaviour in the JSDoc for `request<T>` — operators should know
that the client now respects any `Retry-After` honourably (capped).

Optional: also recognise `Retry-After` on **408 Request Timeout**
and **425 Too Early** (RFC 9110 broadened the field's applicability
in 2022). Both are rare in TestRail's API; defer unless an
operator reports them.

**Defence-in-depth:** the existing
`Math.min(seconds * 1000, MAX_RETRY_DELAY_MS)` cap inside
`parseRetryAfterMs` already protects against the inverse case (a
malicious server hands the client `Retry-After: 86400` to stall
it for a day; the cap clamps to 10 s). The fix here only changes
which response codes consult the parser — the cap path stays
intact.

Tests:

- `tests/client-features.test.ts`: stub `fetch` to return one
  `503 Retry-After: 3` then one `200`; assert wall-clock between
  the two `fetch` calls is ≥3 s (within the cap, so the full
  hint is honoured) and ≤ 10.5 s. Compare with today's `1 s`
  exponential backoff.
- `tests/client-features.test.ts`: stub `503 Retry-After: 99999`;
  assert backoff is clamped to `MAX_RETRY_DELAY_MS = 10 s` (the
  existing cap protects against hostile values).
- `tests/client-features.test.ts`: `500 Internal Server Error`
  _without_ `Retry-After` continues to use exponential backoff
  (`getRetryDelay`) — the fallback path is preserved.
- `tests/client-features.test.ts`: HTTP-date form
  `Retry-After: Wed, 21 Oct 2099 07:28:00 GMT` is also honoured
  on 503 (proves the dead-code branch wakes up).
- `tests/client-features.test.ts`: the same three assertions apply
  to `requestText` (BDD endpoint) and `requestBinary` (attachment
  download) — proves all three retry sites were patched together.

### 26. `allowInsecure: true` enables cleartext credential transmission with no runtime warning or audit trail — `src/client-core.ts:262–269`, `src/types.ts:35` (Severity: LOW–MEDIUM) — [OPEN]

`validateConfig` gates HTTP URLs behind a `config.allowInsecure ===
true` opt-in, with this exact error message when the flag is _not_
set:

```ts
// src/client-core.ts:262–269
if (url.protocol === 'http:' && config.allowInsecure !== true) {
    throw new TestRailValidationError(
        'baseUrl must use HTTPS. HTTP sends credentials in cleartext. ' +
            'Set allowInsecure: true only in isolated development environments.',
    );
}
```

The wording is unambiguous — "credentials in cleartext", "isolated
development environments only". But once `allowInsecure: true` is
actually passed, **nothing happens**. No `console.warn` at
construction, no flag echoed back to the caller, no entry in the
client's state visible to a host application's startup
introspection. The library silently accepts the opt-in and proceeds
to send `Authorization: Basic ${base64(email:apiKey)}` over plain
HTTP for the entire client lifetime.

For comparison, the library _does_ emit a runtime warning for the
much less impactful `maxCacheSize: 0` footgun:

```ts
// src/client-core.ts:212–218
if (config.maxCacheSize === 0 && (config.enableCache ?? true)) {
    console.warn(
        'Warning: maxCacheSize is set to 0 (unlimited). ' +
            'This can cause unbounded memory growth. Consider setting a positive limit.',
    );
}
```

So the precedent and pattern are already established. The asymmetric
treatment is the bug: a config that "can cause unbounded memory
growth" earns a warning; a config that explicitly transmits the
master credential in cleartext does not.

**Real-world failure modes (no exotic threat model needed):**

1. **Production-as-staging drift.** A developer adds
   `allowInsecure: true` to their local-dev config (testing
   against a HTTP local mock), then ships the same config
   shape to production with the flag still set. The credential
   silently leaks on every request. Without a startup warning,
   the regression escapes code review and CI; the only signal
   is somebody sniffing the wire (which by definition only
   surfaces the leak _after_ it has happened).
2. **Copy-paste from migration docs.** Operators porting from
   older self-signed-TLS-only on-prem TestRail setups (where
   the workaround was a stunnel + HTTP origin) copy the flag
   into a new environment that has proper TLS available. The
   flag is unneeded but harmless-looking, so it stays.
3. **Container internal HTTP.** A Kubernetes pod talks to
   TestRail via the cluster's internal HTTP endpoint
   (`http://testrail.internal:8080/`). `allowPrivateHosts:
true` + `allowInsecure: true` is the documented in-cluster
   pattern. Everything works on day 1. On day 30, an operator
   exposes the same client config to a Datadog log shipper that
   captures the request URL _and the Authorization header_ (a
   common Datadog default). The Authorization is `Basic
<base64>` — trivially reversible. The credential is now in
   the SaaS log retention.
4. **Library-mode silent acceptance.** A host application reads
   its config from a `.env` file. An attacker who controls one
   line of that file (limited filesystem foothold, supply-chain
   compromise of a config template) sets
   `TESTRAIL_ALLOW_INSECURE=true`. The host's startup transcript
   doesn't surface the change; the credential begins leaking
   on the next API call.

**Force-multipliers on the existing findings:**

- **#4 (redirect SSRF) on HTTP.** The redirect-follow path is
  defenceless against scheme downgrade — `https://...` → `Location:
http://...` — even _without_ `allowInsecure: true`, because the
  scheme check runs only at construction. Once that scheme-downgrade
  pattern is in play, this finding compounds it: a same-host
  HTTPS-to-HTTP redirect to port 80 strips TLS and leaks the
  Authorization header to any wire-tap. The fix needs to land in
  _both_ findings: #4 forbids cross-scheme redirects; #26 warns
  whenever HTTP is actively in use.
- **#20 (`baseUrl` userinfo).** A baseUrl of
  `http://email:apikey@testrail.local/` with `allowInsecure: true`
  leaks credentials _twice_: once in the userinfo string (per
  #20), and once in the Basic auth header on every request (per
  this finding). Both happen silently.
- **#11 (`--api-key` argv exposure).** Combined: the credential
  is visible via argv _and_ every wire packet. A passive observer
  at any of {ps, journald, tcpdump, netflow} sees the secret.

**Fix sketch (S):**

1. **Emit a startup warning when `allowInsecure: true` is
   active.** Mirror the existing `maxCacheSize: 0` pattern at
   `src/client-core.ts:212–218`:

    ```ts
    // After `this.baseUrl = ...` is set:
    if (config.allowInsecure === true) {
        // eslint-disable-next-line no-console
        console.warn(
            'Warning: allowInsecure is true. Authorization (Basic <base64>) ' +
                'will be sent over plain HTTP and is recoverable by any ' +
                'on-path observer. Use only in isolated dev environments; ' +
                'switch to HTTPS for any environment with shared network ' +
                'access.',
        );
    }
    ```

2. **Suppress the warning programmatically** for legitimate
   on-prem use that doesn't want stderr noise — add an
   `acknowledgeInsecure?: boolean` config field that, when set
   to `true`, treats the operator as having explicitly opted
   into the trade-off. The warning fires _unless_
   `acknowledgeInsecure === true`, so silence is opt-in (a
   second, explicit step), not the default. Matches the
   security-engineering principle "loud by default; quiet only
   on explicit acknowledgement."

3. **Expose `isInsecure(): boolean`** on the public client
   surface so host applications can log "TestRail client
   running in insecure mode" in their own startup transcript.
   Tiny method; readonly on `this.allowInsecure`. Lets the
   host's audit/observability pipeline pick it up without
   parsing stderr.

4. **Cross-reference from #20's fix.** When #20 lands the
   `baseUrl` userinfo rejection, also extend the message to
   note: "credentials belong in `email`/`apiKey`, not in
   `baseUrl` or `allowInsecure` workarounds". A single
   well-worded error message at the top of the validation
   chain frames the whole trust model.

Tests:

- `tests/client-features.test.ts`: construct a client with
  `allowInsecure: true` and assert `console.warn` was called
  once with the expected fragment. (Vitest's
  `vi.spyOn(console, 'warn')` already used in the
  `maxCacheSize: 0` regression test.)
- `tests/client-features.test.ts`: construct with
  `allowInsecure: true, acknowledgeInsecure: true` and
  assert `console.warn` was **not** called.
- `tests/client-features.test.ts`: construct an HTTPS client
  (default) and assert `console.warn` was not called.
- `tests/exports.test.ts`: `TestRailConfig` type exports
  the new `acknowledgeInsecure?: boolean` field.
- `tests/client-features.test.ts`: `client.isInsecure()`
  returns `true` only when both `allowInsecure: true` _and_
  the resolved URL is HTTP (defends against a future bug
  where `allowInsecure: true` is set but the URL is HTTPS
  anyway — that combination shouldn't report "insecure").

### 27. `parseId` silently accepts hex / binary / scientific forms via `Number()` — `src/cli/ids.ts:8–14` (Severity: LOW) — [OPEN]

`parseId` validates positive integers using bare `Number(raw)`:

```ts
// src/cli/ids.ts:8–14
export function parseId(raw: string | undefined, name: string): number {
    const n = Number(raw);
    if (raw === undefined || raw === '' || !Number.isInteger(n) || n <= 0) {
        throw new IdParseError(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
    }
    return n;
}
```

`Number()` is JavaScript's most permissive numeric parser. It
silently accepts every literal form the JS lexer recognises, plus
leading/trailing whitespace. Empirical confirmation (Node 24):

| `raw` input  | `Number(raw)` returns             | `Number.isInteger` | `> 0` | `parseId` outcome         |
| ------------ | --------------------------------- | ------------------ | ----- | ------------------------- |
| `'42'`       | `42`                              | true               | true  | accepted as `42`          |
| `'0x42'`     | `66` (hex)                        | true               | true  | accepted as `66`          |
| `'0b101'`    | `5` (binary)                      | true               | true  | accepted as `5`           |
| `'1e10'`     | `10000000000`                     | true               | true  | accepted as `1e10`        |
| `'  42  '`   | `42` (trimmed)                    | true               | true  | accepted as `42`          |
| `'1.0'`      | `1`                               | true               | true  | accepted as `1`           |
| `'0o7'`      | `NaN` (Number doesn't take octal) | false              | —     | rejected ✓                |
| `'42abc'`    | `NaN`                             | false              | —     | rejected ✓                |
| `'Infinity'` | `Infinity`                        | false              | —     | rejected ✓                |
| `''`         | `0`                               | true               | false | rejected ✓ (`raw === ''`) |

So **`0x42` is silently interpreted as `66`**, **`1e10` is silently
interpreted as `10_000_000_000`**, **`0b101` is silently interpreted as
`5`**, and surrounding whitespace is silently trimmed. The CLI then
puts the decimal form in the URL path: `get_case/66`, `get_case/10000000000`,
`get_case/5` — which is `Number.toString()`'s output, not the input
string.

**Silent semantic confusion failure modes:**

1. **Agent receives ID as opaque string from one upstream, decimal
   from another.** An LLM agent reads "case 0x42" from a markdown
   doc (the author wrote it in hex for readability), then `testrail
case get 0x42`. The CLI returns case **66**, not case **0x42**.
   If the agent's downstream logic compares the returned `case.id`
   (66, an integer) against its original input (the string `"0x42"`),
   identity checks fail; the agent loops "looking for the case it
   just fetched" because string-equality says they differ.
2. **Decimal-looking IDs that hit scientific-notation interpretation.**
   `testrail case get 1e10` — the user _meant_ an ID literally
   spelled `1e10` (which is a perfectly valid TestRail-generated
   identifier shape in some integrations that use base-36 / opaque
   IDs). The CLI sends `get_case/10000000000` instead. TestRail
   returns 404, but the error message doesn't explain the
   transformation.
3. **Whitespace-bearing pasted IDs.** An operator copies a case ID
   from a TestRail link that has a trailing space: `'42 '`. The
   CLI silently trims and accepts. Looks like a feature; _is_ a
   feature for `'42 '` but produces "felt like the system tolerated
   my typo" trust that **doesn't extend to `'42abc'`** (which is
   rejected). The asymmetric tolerance is a UX trap.
4. **Beyond-MAX_SAFE_INTEGER precision loss.** `parseId('9007199254740993')`
   computes `Number('9007199254740993')` = `9007199254740992` (loss
   of precision; the value is past `Number.MAX_SAFE_INTEGER`).
   `Number.isInteger(9007199254740992)` is true. > 0. **Accepted as
   9007199254740992** — a _different_ integer than the user typed.
   The CLI sends a URL for an ID the user did not specify. No
   warning, no error.

The `validateId` method in `client-core.ts:411–415` (the _programmatic_
ID guard) has the same shape — `typeof id !== 'number' ||
!Number.isInteger(id) || id <= 0` — so a programmatic caller passing
`client.getCase(0x42)` is structurally correct (0x42 _is_ 66 at the JS
language level; the caller wrote a literal). The CLI's `parseId`
inherits that shape but applies it to _user-typed strings_, where the
semantic gap matters.

**Threat model is operational, not security-critical:**

- No auth bypass: ID coercion doesn't elevate privileges.
- No SSRF: URL stays on `baseUrl`.
- No data exfil: response is what TestRail returned for the coerced
  ID — usually a 404 or a wrong-resource error.
- The "wrong ID returned" pattern _can_ compound with agent
  trust: an agent that accepts the API response verbatim may
  attach attachments / record results against the coerced ID
  instead of the intended one. The blast radius is the _wrong
  case got attached_ class.

**Fix sketch (S):** replace `Number(raw)` with a stricter parser that
only accepts the decimal-integer form expected by REST URL paths:

```ts
export function parseId(raw: string | undefined, name: string): number {
    if (raw === undefined || raw === '') {
        throw new IdParseError(`${name} must be a positive integer (got: (none))`);
    }
    // Strict decimal-integer pattern: no leading +, no leading zeros (allow
    // bare "0" — rejected later by > 0), no exponent, no hex/binary/octal
    // prefix, no surrounding whitespace.
    if (!/^[1-9]\d*$/.test(raw)) {
        throw new IdParseError(`${name} must be a positive decimal integer (got: ${raw})`);
    }
    const n = Number(raw);
    if (!Number.isSafeInteger(n)) {
        throw new IdParseError(`${name} must be ≤ ${Number.MAX_SAFE_INTEGER} (got: ${raw})`);
    }
    return n;
}
```

- `^[1-9]\d*$` rejects `0`-prefix, hex `0x`, binary `0b`, scientific
  `1e10`, dotted `1.0`, whitespace, sign chars, and non-digits. The
  caller has to pass exactly what they'd put in the URL.
- `Number.isSafeInteger` (instead of `Number.isInteger`) rejects
  values past `2^53 - 1` where precision is lost. TestRail IDs
  realistically fit in 32 bits; the cap is generous.
- The error message now reflects the user input verbatim
  (post-sanitisation per finding #16; `name`-prefixed; ends with
  `got: <raw>` so the operator immediately sees the input that
  failed).

Apply the same hardening to `optInt(raw)` (sibling function at
`src/cli/ids.ts:16–20`) which uses the same lax `Number(raw)` for
pagination args (`--limit`, `--offset`). `optInt` returning silently-
coerced values means `--limit 1e6` becomes 1 million per page —
TestRail server-side caps may or may not catch it, but the _intent_
was different.

Tests:

- `tests/cli-helpers.test.ts`: `parseId('0x42', 'case_id')` throws
  `IdParseError` with the "decimal" wording (currently passes the
  hex case → fails this assertion until fix).
- `tests/cli-helpers.test.ts`: same for `'1e10'`, `'0b101'`,
  `'  42  '`, `'1.0'`, `'+42'`, `'042'` (leading zero).
- `tests/cli-helpers.test.ts`: `parseId('9007199254740993', 'id')`
  throws with the "MAX_SAFE_INTEGER" wording.
- `tests/cli-helpers.test.ts`: `parseId('42', 'id')` returns `42`
  (positive control).
- `tests/cli.test.ts`: subprocess: `testrail case get 0x42` exits 1
  with the new strict error, instead of hitting the API with
  `get_case/66`.

### 28. `cleanupAllClients` has no try-catch — one throwing `destroy()` aborts cleanup for all subsequent clients — `src/client-core.ts:150–155` (Severity: LOW) — [OPEN]

The process-exit / signal-handler cleanup loop iterates
`activeClients` and calls `destroy()` on each with no error
isolation:

```ts
// src/client-core.ts:150–155
// Synchronous-only cleanup — safe to call on process exit
function cleanupAllClients(): void {
    for (const client of activeClients) {
        client.destroy();
    }
}
```

If any one `client.destroy()` throws — for any reason, in any
client — the loop **aborts immediately**. Every subsequent client
in the Set retains:

- The base64-encoded `Basic` credential string in `this.auth`
  (which the comment at L182–183 explicitly notes is "recoverable
  from a heap dump").
- The full GET response cache (potentially containing sensitive
  TestRail data: case bodies, run results, attachment metadata
  with comments).
- The running `cacheCleanupTimer` interval (which doesn't keep
  the process alive due to `unref?.()`, but does keep the
  client object referenced from the timer callback's closure).

The Set iteration order is insertion order, so it's the
_later-constructed_ clients that suffer most — a common pattern in
host applications that bootstrap a "shared" client first and add
per-request clients later. The bootstrap client cleans up; the
later ones leak.

**Why does `destroy()` throw in practice today?** The current
implementation is sync and minimal — `clearInterval`, `cache.clear`,
`auth = ''`, `activeClients.delete(this)`. None of these _should_
throw under normal conditions. So the immediate exploitability is
low. The bug is latent:

1. **Subclass overrides.** `TestRailClient extends TestRailClientCore`;
   a future override of `destroy()` that calls additional cleanup
   (releasing a custom dispatcher, flushing a metrics buffer, etc.)
   can throw. A user-land subclass adding shutdown logic is
   guaranteed to hit this eventually.
2. **Monkey-patched intervals.** Test frameworks that replace
   `setInterval`/`clearInterval` (Vitest's fake timers, Sinon's
   sandbox) can leave the timer in a state where `clearInterval`
   throws on an already-cleared handle. Production rarely sees
   this; CI environments running cleanup-with-fake-timers do.
3. **`activeClients.delete(this)` under Set mutation.** ES spec
   guarantees iterators handle deletion, but **a buggy polyfill
   or a Set proxy** can throw on concurrent delete during
   for-of. Less hypothetical: a test that wraps `activeClients`
   in a Proxy for assertion purposes is exactly the shape of
   code that breaks this.
4. **`this.cache.clear()`** is similarly a Map method that's
   "safe" today but could throw if the cache is replaced by a
   Proxy-backed instance for instrumentation.
5. **Future `destroy()` evolution.** If the library ever adds an
   `await`-aware async cleanup path (graceful shutdown of
   in-flight requests, per finding #8's discussion), the sync
   `destroy()` wrapper that aggregates state will have more
   surface area to throw from.

**The "no-throw guarantee" of the current `destroy()` is an
implicit invariant** that nothing on the type system or the test
suite enforces. The defence-in-depth fix is one line:

**Fix sketch (S):**

```ts
// src/client-core.ts:150–155
function cleanupAllClients(): void {
    for (const client of activeClients) {
        try {
            client.destroy();
        } catch {
            // Swallow per-client errors so one bad apple
            // doesn't strand credentials in the others. Each
            // destroy() is best-effort during shutdown.
        }
    }
}
```

**Why swallow the error rather than log it?**

- This runs from `process.on('exit', ...)` and the SIGINT/SIGTERM
  handlers. The `'exit'` handler executes during process
  teardown — `console.error()` may already be unusable (the
  underlying stream FD may be closed by the runtime's exit
  sequence).
- The handlers either call `process.exit()` immediately (per
  finding #8's discussion of those handlers) or fall through to
  natural exit. Either way, the error is the _last_ event the
  process will see; there's no caller to surface it to.
- The cost of a silent swallow is a debugging blind spot during
  shutdown; the benefit is that **every** client that _can_ be
  cleaned up _will_ be. For a security-relevant cleanup loop
  (credential zeroing), guaranteed completion is the right
  trade.

Optional refinement: gate the swallow behind a
`process.env.TESTRAIL_DEBUG_CLEANUP` check that, when set, emits
the per-client errors via `process.stderr.write` (which is more
likely to be alive during exit than `console.error`'s buffered
chain). Defaults to silent.

**Cross-reference with finding #8:** that finding proposes making
signal handler registration _opt-in_ via `registerSignalHandlers:
false` (default) for library mode. With that fix, this cleanup
loop only runs from CLI mode or operator opt-in — which means the
guaranteed-completion property matters more, not less (operators
chose this cleanup path; it should be reliable).

Tests:

- `tests/client-features.test.ts`: construct two clients, replace
  the first one's `destroy()` with a stub that throws (`Object.assign(c1, { destroy: () => { throw new Error('boom') } })`).
  Call `cleanupAllClients()` directly (export it for tests via
  a `__test__` symbol if needed). Assert: the second client's
  `isDestroyed` is true (proves the loop continued past the
  throw) and `c2.auth` is zeroed.
- `tests/client-features.test.ts`: with three clients where the
  _middle_ one's destroy throws, assert all three of the first
  and last clients reach `isDestroyed === true`. Set position
  in the iteration order must not matter.
- `tests/client-features.test.ts`: positive control —
  `cleanupAllClients()` with all healthy destroys completes
  without invoking the catch path (verifiable via an internal
  counter or by spying on a synthetic destroy method).
- Regression: existing exit-handler tests still pass — no
  observable behaviour change for the all-healthy case.

### 29. `validateEntryId` accepts any non-empty string; entryId is concatenated raw into endpoint URLs (`updatePlanEntry` / `deletePlanEntry` / `addRunToPlanEntry`) — `src/client-core.ts:417–425`, `src/modules/plans.ts:79–98` (Severity: MEDIUM) — [OPEN]

`validateEntryId` is the _only_ gate between the caller's `entryId`
argument and the URL the client constructs:

```ts
// src/client-core.ts:417–425
public validateEntryId(entryId: string): void {
    if (typeof entryId !== 'string' || entryId.trim() === '') {
        throw new TestRailValidationError('entryId must be a non-empty string');
    }
}
```

That's the _entire_ validation. Anything that isn't an empty string
(after trim) passes. The validated value is then directly
template-interpolated into the endpoint path:

```ts
// src/modules/plans.ts:82
await this.client.request<unknown>('POST', `update_plan_entry/${planId}/${entryId}`, payload);
// :89
await this.client.request<void>('POST', `delete_plan_entry/${planId}/${entryId}`);
// :97
await this.client.request<unknown>('POST', `add_run_to_plan_entry/${planId}/${entryId}`, payload);
```

Compare with `validateId` for numeric IDs (`projectId`, `caseId`,
etc.) which enforces `Number.isInteger(id) && id > 0` — a strict
type-and-range gate that makes path-injection impossible. The
string `entryId` path gets none of that discipline.

TestRail's plan entry IDs are documented as **UUID-shape** —
32-character hex with four dashes (e.g.,
`01234567-89ab-cdef-0123-456789abcdef`). The value space is tightly
bounded by the API contract. The validator's "non-empty string"
check is dramatically looser than the actual shape, and the gap
makes the following payloads pass:

| `entryId` value                                       | URL result                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `'../admin/secret'`                                   | `…/update_plan_entry/42/../admin/secret`                             |
| `'foo?injected=true'`                                 | `…/update_plan_entry/42/foo?injected=true`                           |
| `'%2E%2E%2Fadmin'`                                    | URL contains pre-encoded `..` traversal                              |
| `'real-uuid#fragment'`                                | `…/update_plan_entry/42/real-uuid#fragment` (fragment stripped)      |
| `'abc&other=true'`                                    | Query-string injection in the path slot                              |
| `'../../../../../etc/passwd'`                         | Path-traversal text (mostly query-string at the URL layer)           |
| `' '` (single space, fails `.trim() === ''` actually) | Rejected ✓                                                           |
| `'.'`                                                 | `…/update_plan_entry/42/.`                                           |
| `'a'.repeat(1e6)`                                     | 1 MB URL — TestRail rejects 414                                      |
| `'abc\x00inject'`                                     | NUL byte in path — fetch likely rejects, but the encode is undefined |

**At the wire layer:**

- CR/LF (`\r`, `\n`, `\t`) — WHATWG URL parser **rejects** these
  with `TypeError: Invalid URL`, so direct header injection via
  `entryId` is blocked. Good.
- The `?` and `#` characters **do** parse as query/fragment
  separators in the URL the client builds. Since the URL already
  has a `?` (TestRail's pattern is `index.php?/api/v2/…`), a
  _second_ `?` is just a literal char. But a `#` _does_ truncate
  the URL at the fragment boundary — `fetch` strips fragments
  before sending. So `entryId = 'real-uuid#fragment'` truncates
  silently.
- The `/` character in `entryId` is **NOT URL-encoded** —
  template-literal interpolation passes the raw byte. So
  `entryId = 'a/b'` produces `…/update_plan_entry/42/a/b` (an
  extra path segment). TestRail's router likely 404s, but the
  attacker has reshaped the URL.
- Percent-encoded path-traversal (`'%2E%2E%2F'` → `../`) is
  passed through verbatim. TestRail's URL decoder receives it
  literally; whether its API router normalises `..` is
  TestRail's behaviour, not the client's. The client should
  refuse to send these in the first place.

**Threat models:**

1. **Prompt-injected agent passes malicious entryId.** An LLM
   agent receives a plan entry ID from an attacker-controlled
   doc, then calls `client.deletePlanEntry(7, '${entryId}')`.
   With the loose validator, the agent constructs a URL that
   resolves to a _different_ TestRail operation than
   `delete_plan_entry`. Combined with finding #4
   (redirect-follow), the malformed URL could be redirected to
   an internal endpoint — finding #15-style port hopping but
   with a path-shape attacker also controls.
2. **Operator copy-paste from a malicious TestRail UI.** If
   TestRail's web UI is ever XSS'd (out of scope here), the
   attacker could plant a malicious entry ID display. An
   operator who copies-pastes that into `testrail plan
add-entry … --data '{"entry_id":"…"}'` ships the malicious
   value back through the API client.
3. **Query-string injection.** `entryId = 'real-uuid&soft=1'`
   constructs a URL ending in
   `…/update_plan_entry/42/real-uuid&soft=1`. TestRail's parser
   might split on `&`; the second part lands in the next query
   slot. If `soft=1` (or any other parameter) means something
   server-side, the call's semantics change. This is the same
   risk class as finding #4's port-axis-via-redirect, but
   reached without a redirect — just via a loose validator.
4. **Cache key shape pollution.** `request<T>` uses
   `${method}:${endpoint}` as the cache key (per finding #9 /
   #14 context). For GET endpoints constructed with a malicious
   entryId, the cache key contains the malicious bytes — every
   subsequent identical query reuses the same poisoned cache
   slot until TTL.

The validation is also **structurally inconsistent** with the
neighbouring numeric-ID gate: `validateId` is strict (positive
integer); `validateEntryId` is permissive (any non-empty string).
The "use the right validator for the right field" mental model
breaks down — `entryId` _looks_ validated, isn't really, and
flows into the URL the same way `caseId` does.

**Fix sketch (S):** tighten `validateEntryId` to match the
documented UUID shape, mirroring the strict-by-default contract
of `validateId`:

```ts
// src/client-core.ts:421–425
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

public validateEntryId(entryId: string): void {
    if (typeof entryId !== 'string') {
        throw new TestRailValidationError('entryId must be a string');
    }
    if (!UUID_REGEX.test(entryId)) {
        throw new TestRailValidationError(
            'entryId must be a UUID (32 hex chars + 4 dashes, e.g. ' +
                '01234567-89ab-cdef-0123-456789abcdef)',
        );
    }
}
```

Implementation notes:

- Regex anchored at both ends — no leading/trailing slop.
- Hex character class `[0-9a-f]` (case-insensitive) — no
  Unicode confusables, no path separators, no query/fragment
  characters.
- Length is implicitly enforced by the regex (8+4+4+4+12 = 32
  hex digits + 4 dashes = 36 chars exactly).
- If TestRail's actual format diverges from canonical UUID
  (some integrations use 32 hex no-dashes), the regex
  alternation is a one-line addition:
  `/^([0-9a-f]{32}|[0-9a-f]{8}-…)$/i`. Pick the format from
  TestRail's reference docs; verify against
  `tests/fixtures/sample-plan.json` shapes.
- Match the _error wording_ of `validateId` — start with
  "entryId" / param name, end with "got: …" so finding #16's
  terminal-sanitisation pass strips control chars from any
  reflected attacker payload.

**Adjacent gap:** `validateConfig`'s URL parsing accepts
`baseUrl` containing path components (`https://example.com/foo/`),
which then become part of every URL. A malicious baseUrl
`https://example.com/foo/../admin` would similarly route around
the expected API path. Out of scope for this finding — it's a
known WHATWG-URL-normalisation edge case — but the underlying
class (string interpolation into URL paths without URL-encoding
or shape validation) is the same.

Tests:

- `tests/client-features.test.ts` (or extend
  `tests/client-endpoints.test.ts`): every entry in the
  "passes today, should fail" table above is rejected with the
  new "UUID" error wording. Use `it.each`.
- `tests/client-features.test.ts`: a real-shape UUID
  (`'01234567-89ab-cdef-0123-456789abcdef'`) continues to
  succeed.
- `tests/client-features.test.ts`: case-insensitive UUID
  (`'01234567-89AB-CDEF-0123-456789ABCDEF'`) succeeds.
- `tests/client-endpoints.test.ts`: `updatePlanEntry`,
  `deletePlanEntry`, `addRunToPlanEntry` each call into the
  hardened validator and never reach `fetch` for a malicious
  entryId.
- `tests/client-edge-cases.test.ts`: an entryId of
  `'real-uuid&soft=1'` (query-string-injection attempt)
  exits validation with the strict error — proves the same
  malicious shape that finding #4 closes for redirects is
  closed here for path interpolation.

---

## Migrated from active BACKLOG (2026-05-18)

> **Agent Rules:** Append completed tasks here. Add Impl: (Implementation details) and Rat: (Rationale/Why).

### Completed (shipped)

- [x] 🔴 🐛 SEC #4: HTTP redirect bypass of SSRF guard (`client-core.ts`)
  - **Impl:** Shipped in 3.4.0. All four fetch sites set `redirect: 'manual'` and pipe response through `assertNotRedirect()`; 3xx surfaces as `TestRailApiError` with blocked `Location` embedded, never retries, never poisons GET cache.
  - **Rat:** SSRF guard hole — `Location` header pointing at private/metadata IP bypassed `validateBaseUrl` + DNS pinning.
- [x] 🟡 🐛 SEC #9: Schema-invalid response poisons GET cache for full TTL (`client-core.ts`)
  - **Impl:** Shipped in 3.2.0. New `requestParsed<T>` validates before caching.
  - **Rat:** Cache served bad data for full TTL until natural expiry.
- [x] 🟡 🐛 SEC #13: POST retries can duplicate writes (`client-core.ts`)
  - **Impl:** Shipped in 3.3.0. Non-GET methods retry only on 429; 5xx + network errors surface immediately.
  - **Rat:** Retry on 5xx / network for writes risked duplicate side-effects.
- [x] 🟢 🐛 SEC #25: `Retry-After` ignored on 503 / other retryable 5xx (`client-core.ts`)
  - **Impl:** Three retry sites (`request<T>` line 688, `requestText` line 819, `requestBinary` line 992) now call `parseRetryAfterMs` on every retryable status, not just 429. The retry-eligibility gate (GET-only for `request`/`requestText` 5xx, GET-by-construction for `requestBinary`) is unchanged, so write-idempotency invariants from SEC #13 still hold. JSDoc on `parseRetryAfterMs` lifted to spell out: header capped at `MAX_RETRY_DELAY_MS`; zero/past/invalid values return `null` so callers fall back to exponential backoff and a buggy server cannot induce a hot loop. Tests in `client-features.test.ts` cover seconds, HTTP-date, cap, missing, zero, unparseable, plus POST-503-with-Retry-After (must NOT retry) and parallel cases for `requestText` and `requestBinary`.
  - **Rat:** TestRail and front proxies (nginx, Cloudflare) emit `Retry-After` on 502/503/504 during overload or maintenance. Honoring it on retryable paths replaces blind exponential backoff with the server's own hint, avoiding hammering an upstream that already told the client how long to wait. RFC 7231 §7.1.3 names 503 explicitly but the header is well-defined on any retryable response, and treating all retryable 5xx symmetrically keeps the retry matrix in one place.

### 🚫 Decision Log (won't-do)

- 🟢 🚫 CLI: `result delete` — TestRail API does not support deleting individual results.
- 🟢 🚫 CLI: `run add-bulk` — TestRail API does not expose bulk run creation.
- 🟢 🚫 CLI: interactive prompts — conflicts with agent/scripting audience.
- 🟢 🚫 CLI: telemetry / usage analytics — conflicts with zero-dependency ethos.
- 🟢 🚫 SKILL: symlink install option — Windows permission issues + broken-link edge cases.
- 🟢 🚫 SKILL: `postinstall` auto-install hook — runs without consent; breaks CI.
