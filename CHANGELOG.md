# Changelog

All notable changes to `@dichovsky/testrail-api-client` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] — 2026-05-18 — CLI safety cluster

Hardens the `testrail` CLI surface against several CTF-audit findings.
The programmatic library API (`new TestRailClient({ apiKey, … })`) is
**unchanged** — these breaking changes affect CLI invocations only.

### BREAKING CHANGES

#### `--api-key <key>` argv flag removed (CTF #11)

Argv is visible via `/proc/<pid>/cmdline`, shell history, CI step logs
(retained 30+ days on most providers, project-readable), container
audit trails (`kubectl get pod -o yaml`, auditd, cloud audit), and
crash/sysdig dumps. CWE-214 — the same class that drove
`docker login --password-stdin`.

**Migration:** use the env var (recommended) or pipe the key on stdin.

```sh
# Before (v2.x):
testrail project list --api-key sk-xxx --email me@example.com --base-url …

# After (v3.0) — option A, env var (recommended):
export TESTRAIL_API_KEY=sk-xxx
testrail project list --email me@example.com --base-url …

# After (v3.0) — option B, stdin:
echo "$TESTRAIL_API_KEY" | testrail project list --api-key-stdin \
    --email me@example.com --base-url …
```

Note: `--api-key-stdin` consumes `fd 0`, so JSON write bodies for the
same invocation must come from `--data` or `--data-file`, **not** piped
stdin. Pick one channel for stdin per command.

#### `run close` now requires `--yes` (CTF #6)

Closing a run is irreversible (TestRail offers no `open_run` endpoint
and the web UI has no reopen action). Joins the destructive-ops
convention introduced in v2.2 (`--yes` gates anything the API can't
undo; `--dry-run` wins for preview) that previously covered only
`attachment delete` and `case delete-bulk`.

**Migration:**

```sh
# Before (v2.x):
testrail run close 42

# After (v3.0):
testrail run close 42 --yes
# Or preview without API call:
testrail run close 42 --yes --dry-run
```

#### Unknown / typo'd flags now exit 1 (CTF #10)

`parseArgs` is invoked with `strict: false` for defensive future-Node
tolerance, but a post-parse strict gate now rejects any flag not in
the canonical `KNOWN_FLAGS` set. Previously a typo like `--dryrun`
(missing hyphen) was silently accepted as a free-form key while
`values['dry-run']` stayed undefined — so a user-intended preview
executed for real on a destructive command.

**Migration:** fix the typo. Errors are now of the form
`Error: unknown flag '--dryrun'. Run --help for the full list.`

#### Stdin body reads capped at 1 MiB (CTF #24)

`readFileSync(0, 'utf-8')` was unbounded; pipes larger than container
memory (typical CI runner: 512 MB–1 GB) OOM-killed the process.
1 MiB covers the largest realistic JSON body (bulk case payloads with
thousands of cases) while making OOM impossible.

**Migration:** split oversized payloads across multiple requests, or
write to a file and pass `--data-file <path>` (which is read with the
host's normal file-read semantics, unaffected by this cap).

### Fixed (non-breaking)

- **CTF #16** — strip terminal control chars (C0/C1/DEL) from stderr
  error messages. Defends against ANSI/OSC injection where a
  TestRail-controlled string (server error body, validation echo) or
  argv-controlled string (typo'd flag name) embeds escape sequences
  the user's terminal would then execute — colour overrides, cursor
  moves, window-title spoofing, OSC 7/9 / iTerm2 dynamic-action codes
  that can chain into command injection on terminals that honour them.
- **CTF #18** — same sanitization on the `--format table` success
  path. Every cell value and column key routes through
  `sanitizeForTerminal` before concatenation.

### Internal

- New modules: `src/cli/flags.ts` (single source of truth for the
  `parseArgs` options table + derived `KNOWN_FLAGS`), `src/cli/sanitize.ts`
  (control-char stripper), `src/cli/stdin.ts` (`readBoundedStdin` helper).
- `BACKLOG.md` security findings #6, #10, #11, #16, #18, #24 marked
  `[SHIPPED]`.
- Coverage: 97.23% global / 100% on new modules.

### Known limitations

- The stdin cap (`readBoundedStdin`) addresses **memory-exhaustion DoS**
  only. A producer that keeps the pipe open without ever sending more
  than 1 MiB (e.g. `tail -f`, a FIFO writer that never closes) still
  causes the CLI to block indefinitely on the read. Wall-clock deadline
  for stdin reads is tracked separately in `BACKLOG.md` as a follow-up
  on CTF #24.

## [2.2.0] — earlier

See `BACKLOG.md` Decision Log section.
