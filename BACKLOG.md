# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to BACKLOG-ARCHIVE.md.

Archive file: [`BACKLOG-ARCHIVE.md`](BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🖥️ CLI / Skill

- [ ] 🔴 📦 SKILL: localization (non-English)
- [ ] 🟡 📦 SKILL: multi-version skill management
- [ ] 🟡 📦 SKILL: Claude Code marketplace publish

## 🔒 Security

- [ ] 🟢 ♻️ SEC #31: Custom DNS Server / Host Mappings in Config — Support local hostname resolutions or custom DNS servers in `TestRailConfig` to allow running DNS SSRF verification in restrictive DNS environments (PR #172 open)
- [ ] 🟡 🛡️ SEC #34: Automated Trusted Publishing (OIDC) & Provenance Attestations — Create a secure release workflow (`.github/workflows/publish.yml`) that relies on GitHub OIDC permissions (`id-token: write`) to establish Trusted Publishing on npm and publish with `--provenance` to generate cryptographic build attestations linked to the GitHub runner, eliminating persistent secret tokens (PR #174 open)

## 📚 Spec Parity

## 🏗️ Architecture

- [ ] 🟡 ♻️ ARCH #1: Extract `HttpPipeline` seam — collapse `request<T>`/`requestText`/`requestMultipart`/`requestBinary` (`client-core.ts`) into one pipeline + four response-parser adapters; concentrate retry-eligibility matrix
- [ ] 🟢 ♻️ ARCH #2: Write-handler factory — collapse 16 `cli/handlers/*-write.ts` files (66 handlers, 1519 LOC) into declarative specs over a `createWriteHandler(...)` factory — *Audited/detailed in May 2026 report*
- [ ] 🟡 ♻️ ARCH #3: Promote `ACTIONS` (`cli/metadata.ts`, 1210 LOC) to single source of truth — generate `dispatch.ts` HANDLERS (345 LOC) and `cli/index.ts` HELP text from it; new actions today require 3+ edit sites (handler + dispatch + metadata + HELP), drift caught only by tests not types
- [ ] 🟡 ♻️ ARCH #4: `Endpoint` registry — colocate method/URL/payload-schema/response-schema per endpoint; generate `modules/*.ts` methods and CLI handlers as adapters (depends on #2 + #3)
- [ ] 🟢 ♻️ ARCH #5: Revisit thin `modules/*.ts` wrappers — `variables.ts` (27 LOC), `reports.ts` (17), `datasets.ts` (32), `tests.ts` (33): every method is `validateId` + `requestParsed`/`request`, zero orchestration; collapses naturally once #4 lands; standalone value low
- [ ] 🟢 ♻️ ARCH #6: Extract pure helpers (`validateId`/`validateEntryId`/`validatePaginationParams`/`buildEndpoint` at `client-core.ts:547-596`) into standalone modules — they don't read `this`; today every caller needs a `TestRailClientCore` reference; would also let `cli/ids.ts:parseId` reuse the rule instead of duplicating it
- [ ] 🟡 ♻️ ARCH #7: Eliminate hand-written 1517-line facade (`client.ts`) — 131 `async` wrapper methods forwarding to 18 modules; either deprecate flat surface in favor of namespaced (`client.projects.getProject`) or generate the facade from module signatures at build time; contradicts ARCHITECTURE.md §3.2 — reopen because JSDoc/types are no longer the load-bearing reason (modules carry the same)

## From User (should be reordered by priority)
- [ ] 🟡 📦 USER: continue.dev option should be fully removed from repo
- [ ] 🟡 📦 USER: all scripts from `./scripts/` folder should be written in Typescript
- [ ] 🟡 📦 USER: merge tsconfig.eslint.json into tsconfig.json and remove tsconfig.eslint.json. all dev script should use tsconfig.json
