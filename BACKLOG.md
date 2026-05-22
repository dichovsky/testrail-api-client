# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to BACKLOG-ARCHIVE.md.

Archive file: [`BACKLOG-ARCHIVE.md`](BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🖥️ CLI / Skill

- [ ] 🔴 📦 SKILL: localization (non-English)
- [ ] 🟡 📦 SKILL: multi-version skill management
- [ ] 🟡 📦 SKILL: Claude Code marketplace publish

## 🔒 Security

- [ ] 🟡 🐛 SEC #5: TOCTOU symlink-clobber on install target — atomic temp-then-rename narrows the window in practice (`install-skill.ts:103` uses `O_NOFOLLOW` + post-write `lstatSync` + `renameSync`) but the pre-rename `unlinkSync` (line 120) still allows a symlink swap between the `targetExists` check and the unlink; harden by collapsing to `mkdirSync` + immediate atomic temp-then-rename without the separate unlink (`cli/install-skill.ts`)
- [ ] 🟢 🐛 SEC #14: Mutable cached references let callers poison future reads
- [ ] 🟢 🐛 SEC #15: IPv6 SSRF allowlist gaps (`fec0::/10`, `2002::/16`, `64:ff9b::/96`)
- [ ] 🟡 🐛 SEC #17: `--data-file` follows symlinks with no size cap
- [ ] 🟢 🐛 SEC #19: `mkdirSync` omits explicit mode under permissive umask
- [ ] 🟢 🐛 SEC #20: `baseUrl` accepts embedded userinfo
- [ ] 🟢 🐛 SEC #23: Identical GETs stampede into parallel upstream calls
- [ ] 🟢 🐛 SEC #26: `allowInsecure: true` — single-shot stderr warning emitted (`client-core.ts:311`); structured audit-trail / per-request logging still pending
- [ ] 🟢 🐛 SEC #28: throwing `destroy()` corrupts later cleanup — try/finally added but `activeClients.delete(this)` runs after the throw path, so a thrown destroy still leaves a stale set entry that the signal-handler iteration later trips on; wrap each per-client destroy in its own try/finally so one bad client cannot poison the sweep (`client-core.ts:690-734`)
- [ ] 🟡 🐛 SEC #29: `validateEntryId` accepts any non-empty string
- [ ] 🟢 🐛 SEC #30: Fortify `requestMultipart` streaming upload against mid-stream file descriptor invalidation and resource leaks
- [ ] 🟢 ♻️ SEC #31: Custom DNS Server / Host Mappings in Config — Support local hostname resolutions or custom DNS servers in `TestRailConfig` to allow running DNS SSRF verification in restrictive DNS environments
- [ ] 🟡 🛡️ SEC #32: Safe-by-default root `.npmrc` configuration — Add a root `.npmrc` file that sets `ignore-scripts=true` to block execution of arbitrary lifecycle scripts from sub-dependencies during development/CI, blocks Git-based URLs with `allow-git=none`, and scopes registry access to `https://registry.npmjs.org/` to defend against dependency confusion and supply chain attacks
- [ ] 🟢 🛡️ SEC #33: Integrate `lockfile-lint` verification — Install `lockfile-lint` as a devDependency and configure a check running in `pretest` / CI to audit `package-lock.json` for unauthorized registries, invalid URL schemes, and integrity checksum metadata anomalies to block lockfile injection vectors
- [ ] 🟡 🛡️ SEC #34: Automated Trusted Publishing (OIDC) & Provenance Attestations — Create a secure release workflow (`.github/workflows/publish.yml`) that relies on GitHub OIDC permissions (`id-token: write`) to establish Trusted Publishing on npm and publish with `--provenance` to generate cryptographic build attestations linked to the GitHub runner, eliminating persistent secret tokens

## 📚 Spec Parity

- [ ] 🟡 🐛 SPEC #2.1.6: Add missing `PlanSchema`/`PlanEntrySchema` fields (`start_on`, `due_on`, `refs`)
- [ ] 🟢 🐛 SPEC #2.1.7: Add missing `TestSchema.labels[]`
- [ ] 🟡 🐛 SPEC #2.1.3: Add missing `CaseSchema.labels[]`
- [ ] 🟡 🐛 SPEC #2.1.13: Add missing `HistoryChangeSchema` fields (`old_value`, `new_value`, `label`, `options`)
- [ ] 🟢 🐛 SPEC #2.1.9: Add missing `MilestoneSchema.is_started` (response side — `UpdateMilestonePayloadSchema` already carries it at `src/schemas.ts:1051`; only the response `MilestoneSchema` is missing it)
- [ ] 🟢 🧪 SPEC #2.1.14: Verify attachment spec parity — `id` vs `attachment_id` resolved (current API uses `attachment_id`, matches `AttachmentSchema` at `src/schemas.ts:529-537`); full field-completeness audit still pending
- [ ] 🟡 🐛 SPEC #2.1.12: Model `add_case_field` response divergence (`configs` string vs array on `get_case_fields`)
- [ ] 🔴 ♻️ SPEC #A.1: Split request/response schemas (start with results) to remove shape conflation
- [ ] 🟢 ♻️ SPEC #1.5: Document or revert module list-wrapper `.nullish()` flips where spec backing is absent
- [ ] 🟡 ♻️ SPEC #2.2: Close endpoint-coverage gaps (BDD support; promote Groups/Roles from schema-only if needed)
- [ ] 🟡 🧪 SPEC #2.1.15: Verify Shared Steps schema nullability against current official spec docs
- [ ] 🟡 🧪 SPEC #2.1.16: Verify Variables/Datasets/Reports schema nullability against current official spec docs

## 🏗️ Architecture

- [ ] 🟡 ♻️ ARCH #1: Extract `HttpPipeline` seam — collapse `request<T>`/`requestText`/`requestMultipart`/`requestBinary` (`client-core.ts`) into one pipeline + four response-parser adapters; concentrate retry-eligibility matrix
- [ ] 🟢 ♻️ ARCH #2: Write-handler factory — collapse 10 `cli/handlers/*-write.ts` files (36 handlers, 732 LOC) into declarative specs over a `createWriteHandler(...)` factory — *Audited/detailed in May 2026 report*
- [ ] 🟡 ♻️ ARCH #3: Promote `ACTIONS` (`cli/metadata.ts`, 607 LOC) to single source of truth — generate `dispatch.ts` HANDLERS (175 LOC) and `cli/index.ts` HELP text from it; new actions today require 3+ edit sites (handler + dispatch + metadata + HELP), drift caught only by tests not types
- [ ] 🟡 ♻️ ARCH #4: `Endpoint` registry — colocate method/URL/payload-schema/response-schema per endpoint; generate `modules/*.ts` methods and CLI handlers as adapters (depends on #2 + #3)
- [ ] 🟢 ♻️ ARCH #5: Revisit thin `modules/*.ts` wrappers — `variables.ts` (27 LOC), `reports.ts` (17), `datasets.ts` (32), `tests.ts` (33): every method is `validateId` + `requestParsed`/`request`, zero orchestration; collapses naturally once #4 lands; standalone value low
- [ ] 🟢 ♻️ ARCH #6: Extract pure helpers (`validateId`/`validateEntryId`/`validatePaginationParams`/`buildEndpoint` at `client-core.ts:444-493`) into standalone modules — they don't read `this`; today every caller needs a `TestRailClientCore` reference; would also let `cli/ids.ts:parseId` reuse the rule instead of duplicating it
- [ ] 🟡 ♻️ ARCH #7: Eliminate hand-written 1517-line facade (`client.ts`) — 131 `async` wrapper methods forwarding to 18 modules; either deprecate flat surface in favor of namespaced (`client.projects.getProject`) or generate the facade from module signatures at build time; contradicts ARCHITECTURE.md §3.2 — reopen because JSDoc/types are no longer the load-bearing reason (modules carry the same)
- [ ] 🟢 ♻️ ARCH #8: Fix `scripts/generate-mapping.js` Phase 1 parser — detect `buildEndpoint(base, params)` call sites and replace CLI name-heuristic; today `docs/API-MAPPING.md` shows `—` for implemented endpoints (e.g. `get_cases`, `get_runs`, `result:list`, `shared-step:history`); add `@testrail` JSDoc tags + `apiEndpoint` field on `ActionSpec` per the doc's caveat; turn on CI drift gate
- [ ] 🟢 ♻️ ARCH #9: Harmonize `--soft`/`--dry-run` check order across destructive handlers — currently mixed: `milestone delete`/`project delete`/`configuration delete`/`configuration-group delete` keep canonical `parseId → --soft reject → --dry-run → --yes`; `plan delete*`/`variable delete`/`shared-step delete` use newer `parseId → --dry-run → --soft reject → --yes`. Functionally equivalent (no API call either way), stylistic only — pick one ordering and apply uniformly so future destructive handlers don't have to choose.
- [ ] 🟢 ♻️ ARCH #10: Extract `runDestructive` helper — the dry-run → `--yes` guard sequence (`if dryRun { emit preview; return } → if !confirmDestructive { throw } → execute`) is repeated verbatim in 8+ destructive handlers (`case-write`, `run-write`, `section-write`, `configuration-write`, `attachment-write`, `project-write`, `suite-write`, `shared-step-write`); orthogonal to domain logic but tangled into every handler; extract as `runDestructive(ctx, preview, execute)` with the protocol owned in one place; naturally absorbed by ARCH #2 factory but worth doing standalone if ARCH #2 is deferred.
- [ ] 🟢 ♻️ ARCH #11: Unify file-output writes across download handlers — `handlers/attachment.ts` and `handlers/bdd.ts` both call `resolveOut()` then raw `writeFileSync` with different encodings (`Buffer` vs `string`); neither reuses the other; extend `file-output.ts` or `safe-write.ts` with a `writeOutput(path, content, force)` overload that handles both; new download-style handlers would then inherit TOCTOU + symlink protection from `safe-write.ts` for free instead of requiring callers to know which handler to copy from.
- [ ] 🟢 ♻️ ARCH #12: Type `HandlerArgs` path-param contracts — the flat 15-field optional bag means positional extraction (`pathParams[0]`, `[1]`) carries no compile-time contract; `ActionSpec.pathParams` already names each param for docs but the dispatcher never validates count before dispatch; either add a count check in dispatch (cheap, catches most bugs) or generate typed arg structs per action from `ACTIONS` once ARCH #3 lands; today mismatch is caught only at runtime via `parseId()` throwing with a generic error.
- [ ] 🟢 ♻️ ARCH #13: Specialized Error Subclasses — Introduce `TestRailRateLimitError`, `TestRailAuthError`, `TestRailNotFoundError`, and `TestRailTimeoutError` extending `TestRailApiError` to enable idiomatic `instanceof` checks rather than status code parsing
- [ ] 🟡 ♻️ ARCH #14: Injectable Fetch Adapter — Allow providing a custom `fetch` implementation in `TestRailConfig` to native-mock the network boundary for downstream automation frameworks (e.g. Playwright or Appium)

## 🧪 QA / Verification

- [ ] 🟢 🧪 QA: separate CI job for skill-generation drift
- [ ] 🟢 🧪 QA: coverage delta enforcement (98% floor)
- [ ] 🟡 🧪 QA: CLI fuzz tests
- [ ] 🟢 🧪 QA: Gate C2 should be bidirectional (every ActionSpec must have at least one recipe-for binding); current one-way check allowed PR #114 to silently drop recipe #34 and PR #118 to drop C3+C5 recipes during rebase — both regressions only caught by ad-hoc audit
- [ ] 🟢 🧪 QA: Add unit tests in `streaming-upload.test.ts` for mid-stream file descriptor errors (e.g., simulated `EBADF`) to verify upload cleanup
