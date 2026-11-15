# BACKLOG

> **Agent Rules:** Write short descriptions. When you complete a task, remove it from this file and append it to `docs/archive/BACKLOG-ARCHIVE.md`.

Archive file: [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md). This file stores detailed notes and completed items.

## 🔒 Security

## 📚 Spec Parity

## 🏗️ Architecture

The tasks from the 2026-09-18 architecture review are complete. All changes are internal and do not modify the public API. Version `8.0.0` includes these changes. This version is a major release because PR #285 increased the minimum runtime to Node 24.

Task ARCH #4 has a reduced scope. See the archive entry for details. The repository cannot use one runtime declaration per endpoint while `docs/testrail-endpoints.json` uses manual maintenance. For this reason, gate D remains a script check instead of a TypeScript type constraint.
