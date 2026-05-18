# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to BACKLOG-ARCHIVE.md.

Archive file: [`BACKLOG-ARCHIVE.md`](BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🖥️ CLI / Skill

- [ ] 🟢 📦 CLI: `user add` / `user update` (7.3+; password UX unresolved)
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

## 🔒 Security

- [ ] 🟡 🐛 SEC #5: TOCTOU symlink-clobber on install target (`cli/install-skill.ts`)
- [ ] 🟡 🐛 SEC #7: TOCTOU symlink-follow on attachment upload (`cli/file-input.ts`)
- [ ] 🟡 🐛 SEC #12: Unbounded response body reads can OOM client
- [ ] 🟢 🐛 SEC #14: Mutable cached references let callers poison future reads
- [ ] 🟢 🐛 SEC #15: IPv6 SSRF allowlist gaps (`fec0::/10`, `2002::/16`, `64:ff9b::/96`)
- [ ] 🟡 🐛 SEC #17: `--data-file` follows symlinks with no size cap
- [ ] 🟢 🐛 SEC #19: `mkdirSync` omits explicit mode under permissive umask
- [ ] 🟢 🐛 SEC #20: `baseUrl` accepts embedded userinfo
- [ ] 🟡 🐛 SEC #21: Slowloris-on-body DoS after timeout cleared
- [ ] 🟢 🐛 SEC #22: Prototype-chain property access crashes dispatch
- [ ] 🟢 🐛 SEC #23: Identical GETs stampede into parallel upstream calls
- [ ] 🟢 🐛 SEC #24: stdin wall-clock deadline still missing (size cap shipped)
- [ ] 🟢 🐛 SEC #26: `allowInsecure: true` lacks runtime warning / audit trail
- [ ] 🟢 🐛 SEC #27: `parseId` accepts hex / binary / scientific forms
- [ ] 🟢 🐛 SEC #28: throwing `destroy()` aborts cleanup of later clients
- [ ] 🟡 🐛 SEC #29: `validateEntryId` accepts any non-empty string

## 🏗️ Architecture

- [ ] 🟡 ♻️ ARCH #1: Extract `HttpPipeline` seam — collapse `request<T>`/`requestText`/`requestMultipart`/`requestBinary` (`client-core.ts`) into one pipeline + four response-parser adapters; concentrate retry-eligibility matrix
- [ ] 🟢 ♻️ ARCH #2: Write-handler factory — collapse 22 `cli/handlers/*-write.ts` files into declarative specs over a `createWriteHandler({pathParams, schema, clientMethod, destructive?})` factory
- [ ] 🟡 ♻️ ARCH #3: Promote `ACTIONS` (`cli/metadata.ts`) to single source of truth — generate `dispatch.ts` HANDLERS and `cli/index.ts` HELP text from it; eliminate triplicated action metadata
- [ ] 🟡 ♻️ ARCH #4: `Endpoint` registry — colocate method/URL/payload-schema/response-schema per endpoint; generate `modules/*.ts` methods and CLI handlers as adapters (depends on #2 + #3)
- [ ] 🟢 ♻️ ARCH #5: Revisit `modules/*.ts` thin wrappers (`validateId` + `requestParsed`) — collapses naturally once #4 lands; standalone value low
- [ ] 🟢 ♻️ ARCH #6: Extract pure helpers (`validateId`/`validateEntryId`/`validatePaginationParams`/`buildEndpoint` at `client-core.ts:444-493`) into standalone modules — they don't read `this`; today every caller needs a `TestRailClientCore` reference; would also let `cli/ids.ts:parseId` reuse the rule instead of duplicating it
- [ ] 🟡 ♻️ ARCH #7: Eliminate hand-written 1517-line facade (`client.ts`) — 160+ wrapper methods forwarding to modules; either deprecate flat surface in favor of namespaced (`client.projects.getProject`) or generate the facade from module signatures at build time; contradicts ARCHITECTURE.md §3.2 — reopen because JSDoc/types are no longer the load-bearing reason (modules carry the same)

## 🧪 QA / Verification

- [ ] 🟡 🧪 QA: snapshot test for recipe code blocks
- [ ] 🟢 🧪 QA: separate CI job for skill-generation drift
- [ ] 🟢 🧪 QA: coverage delta enforcement (98% floor)
- [ ] 🟡 🧪 QA: CLI fuzz tests
- [ ] 🟢 🐛 QA: stricter decimal-only parsing in `parseId` / `optInt`
