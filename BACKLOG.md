# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to docs/archive/BACKLOG-ARCHIVE.md.

Archive file: [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🖥️ CLI / Skill

- [ ] 🔴 📦 SKILL: localization (non-English)
- [ ] 🟡 📦 SKILL: multi-version skill management
- [ ] 🟡 📦 SKILL: Claude Code marketplace publish

## 🔒 Security

## 📚 Spec Parity

## 🏗️ Architecture

- [ ] 🟡 ♻️ ARCH #4: `Endpoint` registry — colocate method/URL/payload-schema/response-schema per endpoint; generate `modules/*.ts` methods and CLI handlers as adapters (depends on #2 + #3)
- [ ] 🟢 ♻️ ARCH #5: Revisit thin `modules/*.ts` wrappers — `variables.ts` (27 LOC), `reports.ts` (17), `datasets.ts` (32), `tests.ts` (33): every method is `validateId` + `requestParsed`/`request`, zero orchestration; collapses naturally once #4 lands; standalone value low
- [ ] 🟢 ♻️ ARCH #6: Extract pure helpers (`validateId`/`validateEntryId`/`validatePaginationParams`/`buildEndpoint` at `client-core.ts:547-596`) into standalone modules — they don't read `this`; today every caller needs a `TestRailClientCore` reference; would also let `cli/ids.ts:parseId` reuse the rule instead of duplicating it
