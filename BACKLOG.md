# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to BACKLOG-ARCHIVE.md.

Archive file: [`BACKLOG-ARCHIVE.md`](BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🖥️ CLI / Skill

- [ ] 🟢 📦 CLI: `user add` / `user update` (7.3+; password UX unresolved — superseded by endpoint items below)
- [ ] 🟡 ♻️ CLI: streaming upload for large files
- [ ] 🟡 📦 SKILL: programmatic TS API recipes
- [ ] 🟢 📦 SKILL: `.cursor/rules/testrail.mdc`
- [ ] 🟢 📦 SKILL: Continue rules
- [ ] 🟢 📦 SKILL: generic `AGENTS.md`
- [ ] 🔴 📦 SKILL: localization (non-English)
- [ ] 🟢 📦 SKILL: `testrail uninstall-skill`
- [ ] 🟡 📦 SKILL: multi-version skill management
- [ ] 🟡 📦 SKILL: Claude Code marketplace publish

## 🔒 Security

- [ ] 🟡 🐛 SEC #5: TOCTOU symlink-clobber on install target (`cli/install-skill.ts`) — *Audited/detailed in May 2026 report*
- [ ] 🟡 🐛 SEC #7: TOCTOU symlink-follow on attachment upload (`cli/file-input.ts`) — *Audited/detailed in May 2026 report*
- [ ] 🟢 🐛 SEC #14: Mutable cached references let callers poison future reads
- [ ] 🟢 🐛 SEC #15: IPv6 SSRF allowlist gaps (`fec0::/10`, `2002::/16`, `64:ff9b::/96`) — *Audited/detailed in May 2026 report*
- [ ] 🟡 🐛 SEC #17: `--data-file` follows symlinks with no size cap
- [ ] 🟢 🐛 SEC #19: `mkdirSync` omits explicit mode under permissive umask
- [ ] 🟢 🐛 SEC #20: `baseUrl` accepts embedded userinfo
- [ ] 🟢 🐛 SEC #22: Prototype-chain property access crashes dispatch
- [ ] 🟢 🐛 SEC #23: Identical GETs stampede into parallel upstream calls — *Audited/detailed in May 2026 report (in-flight coalescing)*
- [ ] 🟢 🐛 SEC #24: stdin wall-clock deadline still missing (size cap shipped)
- [ ] 🟢 🐛 SEC #26: `allowInsecure: true` lacks runtime warning / audit trail
- [ ] 🟢 🐛 SEC #28: throwing `destroy()` aborts cleanup of later clients
- [ ] 🟡 🐛 SEC #29: `validateEntryId` accepts any non-empty string

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

## 🧪 QA / Verification

- [ ] 🟡 🧪 QA: snapshot test for recipe code blocks
- [ ] 🟢 🧪 QA: separate CI job for skill-generation drift
- [ ] 🟢 🧪 QA: coverage delta enforcement (98% floor)
- [ ] 🟡 🧪 QA: CLI fuzz tests
