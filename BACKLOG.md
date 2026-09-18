# BACKLOG

> **Agent Rules:** Keep descriptions brief. When a task is completed, REMOVE it from here and APPEND it to docs/archive/BACKLOG-ARCHIVE.md.

Archive file: [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md) — preserves long-form writeups and shipped-item history.

## 🔒 Security

## 📚 Spec Parity

## 🏗️ Architecture

Deepening slate from the 2026-09-18 architecture review. Ordered; **ARCH #8 must
precede ARCH #9** (#9's second-attempt hazard is prevented only by the convention
#8 replaces). All internal — no published-API change; ships as one `7.3.0`.

- [ ] 🟡 ♻️ ARCH #11: `main()` interface — `(argv, env, streams) → exit code`, injected stdin reader and client factory; exit code becomes a property of the failure
- [ ] 🟡 ♻️ ARCH #12: Diagnostic scope — `withDiagnostics(request, work)` absorbs the six-step protocol plus a process-lifetime port (depends on #11)
- [ ] 🟡 ♻️ ARCH #13: Output ownership — one module owns every byte; non-optional `HandlerContext` writers, widened `actionSpec`, lint rule on `process.stderr.write` (depends on #11)
- [ ] 🟡 ♻️ ARCH #4: Endpoint registry — one runtime declaration per endpoint read by the SDK method, `ActionSpec` and the pagination descriptor; gates D/E become type constraints. No codegen. Folds in the `ACTIONS` slice-arithmetic removal
