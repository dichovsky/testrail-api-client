# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to docs/archive/BACKLOG-ARCHIVE.md.

Archive file: [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🔒 Security

## 📚 Spec Parity

## 🏗️ Architecture

Deepening slate from the 2026-09-18 architecture review — complete. All internal;
no published-API change. Shipped in `8.0.0` — a major because the Node 24
floor (#285) landed unpublished in the same window, not because of this slate.

ARCH #4 shipped reduced, deliberately: see the archive entry for why "one runtime
declaration per endpoint" is unreachable while `docs/testrail-endpoints.json`
stays hand-curated, and why gate D should not become a type constraint.

