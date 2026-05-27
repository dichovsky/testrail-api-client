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
- [ ] 🟢 🐛 SEC #26: `allowInsecure: true` opts out of HTTPS enforcement silently (`client-core.ts:307-316`) — no stderr warning, no structured audit log, no per-request indication. Add at least a single-shot stderr warning at client construction; ideally a structured audit-trail event on each request made over an insecure baseUrl.
- [ ] 🟢 🐛 SEC #28: thrown `destroy()` leaves stale `activeClients` entries — `destroy()` (`client-core.ts:690-703`) has no try/finally and `activeClients.delete(this)` is the last line, so an earlier throw skips it; `cleanupAllClients` (`client-core.ts:176-180`) also iterates without per-client try/finally, so one bad client poisons the sweep. Wrap both sites: per-client try/finally inside `destroy()` so `activeClients.delete(this)` runs unconditionally, plus a try/catch around `client.destroy()` in `cleanupAllClients` so a thrown client cannot abort the iteration.
- [ ] 🟢 ♻️ SEC #31: Custom DNS Server / Host Mappings in Config — Support local hostname resolutions or custom DNS servers in `TestRailConfig` to allow running DNS SSRF verification in restrictive DNS environments
- [ ] 🟡 🛡️ SEC #32: Safe-by-default root `.npmrc` configuration — Add a root `.npmrc` file that sets `ignore-scripts=true` to block execution of arbitrary lifecycle scripts from sub-dependencies during development/CI, blocks Git-based URLs with `allow-git=none`, and scopes registry access to `https://registry.npmjs.org/` to defend against dependency confusion and supply chain attacks
- [ ] 🟢 🛡️ SEC #33: Integrate `lockfile-lint` verification — Install `lockfile-lint` as a devDependency and configure a check running in `pretest` / CI to audit `package-lock.json` for unauthorized registries, invalid URL schemes, and integrity checksum metadata anomalies to block lockfile injection vectors
- [ ] 🟡 🛡️ SEC #34: Automated Trusted Publishing (OIDC) & Provenance Attestations — Create a secure release workflow (`.github/workflows/publish.yml`) that relies on GitHub OIDC permissions (`id-token: write`) to establish Trusted Publishing on npm and publish with `--provenance` to generate cryptographic build attestations linked to the GitHub runner, eliminating persistent secret tokens

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
