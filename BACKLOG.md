# BACKLOG

Compact agent-first backlog. Full history, shipped items, detailed security
writeups, API-gap history, and prior rationale live in
[`BACKLOG.archive.md`](BACKLOG.archive.md).

Conventions:

- **Status:** open / partial / won't-do
- **Effort:** S (<= 1/2 day) / M (1-2 days) / L (1+ week)
- **Trigger:** what makes item worth pulling into a release

## Active work

### CLI surface

| Status | Item | Effort | Trigger | Notes |
| --- | --- | --- | --- | --- |
| open | `user add` / `user update` | S | identity-provisioning workflows | TestRail 7.3+ only; password-input UX/security unresolved |
| won't-do | `result delete` | - | - | TestRail API does not support deleting individual results |
| open | `case add-bulk` | M | agents generating cases from large spec files | Needs payload validation + partial-failure semantics |
| won't-do | `run add-bulk` | - | - | TestRail API does not support bulk run creation |
| open | `--format yaml` | S | Kubernetes-adjacent workflows | Requires emitter/dependency choice |
| open | `--format csv` | S | spreadsheet-import workflows | Export-focused convenience |
| open | `testrail run watch <run_id>` | M | CI waiting on async test execution | Polling/wait UX |
| won't-do | interactive prompts | - | - | Conflicts with agent/scripting audience |
| won't-do | telemetry / usage analytics | - | - | Conflicts with zero-dependency ethos |

### Attachments / destructive ops

| Status | Item | Effort | Trigger | Notes |
| --- | --- | --- | --- | --- |
| open | binary stdin upload | S | agents piping artifacts without temp files | Require `--filename`; reverse current stdin gate |
| open | binary stdout download | S | Unix pipelines like `attachment get ... --out - \| sha256sum` | Refuse on TTY to avoid terminal corruption |
| open | pagination on `attachment list-for-*` | M | large attachment sets hit page size | Add programmatic `limit` / `offset` first |
| open | streaming upload for large files | M | memory pressure on CI runners | Current path buffers full `Uint8Array` |
| open | destructive env-var gate (`TESTRAIL_ALLOW_DESTRUCTIVE=1`) | S | CI users prefer env-var gating | Keep `--yes` as explicit per-command audit path |

### Skill / install distribution

| Status | Item | Effort | Trigger | Notes |
| --- | --- | --- | --- | --- |
| open | programmatic TypeScript API recipes in skill | M | real demand from agents importing package | v1 stayed CLI-first; `README.md` + `CODEMAP.md` already cover programmatic use |
| open | `.cursor/rules/testrail.mdc` | S | documented Cursor demand | Alternate generated format |
| open | Continue rules | S | same | Alternate generated format |
| open | generic `AGENTS.md` | S | direct user demand | Flat agent format |
| open | localization | L | non-English user base | Translation + per-language generation |
| won't-do | symlink install option | - | - | Windows permission issues + broken-link edge cases |
| won't-do | `postinstall` auto-install hook | - | - | Runs without consent; breaks CI |
| open | `testrail uninstall-skill` | S | user feedback that manual `rm` is friction | Symmetric cleanup path |
| open | multi-version skill management | M | monorepos pin different versions | Side-by-side installs |
| open | Claude Code marketplace publish | M | marketplace becomes canonical distro path | Process + metadata work |

### Verification / tooling

| Status | Item | Effort | Trigger | Notes |
| --- | --- | --- | --- | --- |
| open | snapshot test for recipe code blocks | M | recipe drifts past schema-level checks | Extract fenced `bash` blocks, run against mocked CLI |
| open | separate CI job for skill generation drift | S | contributors confused by current `pretest` failure | Fail with explicit `npm run skill` message |
| open | coverage delta enforcement (98% floor) | S | coverage regression lands | Current target is soft |
| open | CLI fuzz tests | M | real payload-shape bugs | Random JSON into write actions, assert Zod rejection |
| open | stricter decimal-only parsing in `parseId` / `optInt` | S | next v2.x validation-tightening release | Reject hex/binary/scientific numeric forms |

## Security follow-ups

| Status | ID | Severity | Area | Problem |
| --- | --- | --- | --- | --- |
| shipped | 4 | high | `client-core.ts` | HTTP redirect bypass of SSRF guard — fixed in 3.4.0; all four fetch sites set `redirect: 'manual'` and 3xx surfaces as `TestRailApiError` via `assertNotRedirect()` |
| open | 5 | medium | `cli/install-skill.ts` | TOCTOU symlink-clobber on install target |
| open | 7 | medium | `cli/file-input.ts` | TOCTOU symlink-follow on attachment upload |
| open | 8 | medium | `client-core.ts` | Library constructor hijacks host SIGINT/SIGTERM via `process.exit()` |
| shipped | 9 | medium | `client-core.ts` | Schema-invalid response can poison GET cache for full TTL — fixed in 3.2.0 via new `requestParsed<T>` that validates before caching |
| open | 12 | medium | `client-core.ts` | Unbounded response body reads can OOM client |
| shipped | 13 | medium | `client-core.ts` | POST retries can duplicate writes on retryable failure — fixed in 3.3.0; non-GET methods no longer retry on 5xx or network errors, only on 429 |
| open | 14 | low-medium | `client-core.ts` | Mutable cached references let callers poison future reads |
| open | 15 | low-medium | `client-core.ts` | IPv6 SSRF allowlist gaps (`fec0::/10`, `2002::/16`, `64:ff9b::/96`) |
| open | 17 | medium | `cli/body.ts` | `--data-file` follows symlinks with no size cap |
| open | 19 | low-medium | `cli/install-skill.ts` | `mkdirSync` omits explicit mode under permissive `umask` |
| open | 20 | low-medium | `client-core.ts` / `types.ts` | `baseUrl` accepts embedded userinfo |
| open | 21 | medium | `client-core.ts` | Slowloris-on-body DoS after timeout cleared before body read |
| open | 22 | low | `cli/dispatch.ts` | Prototype-chain property access can crash dispatch |
| open | 23 | low-medium | `client-core.ts` | Identical GETs can stampede into parallel upstream calls |
| partial | 24 | low-medium | `cli/index.ts` / `cli/body.ts` | stdin size cap shipped; wall-clock deadline still missing |
| open | 25 | low-medium | `client-core.ts` | `Retry-After` ignored on 503 / other retryable 5xx |
| open | 26 | low-medium | `client-core.ts` / `types.ts` | `allowInsecure: true` lacks runtime warning / audit trail |
| open | 27 | low | `cli/ids.ts` | `parseId` accepts hex / binary / scientific forms |
| open | 28 | low | `client-core.ts` | One throwing `destroy()` aborts cleanup of later clients |
| open | 29 | medium | `client-core.ts` / `modules/plans.ts` | `validateEntryId` accepts any non-empty string and is concatenated raw into endpoint URLs |

## Archive

- [`BACKLOG.archive.md`](BACKLOG.archive.md) preserves long-form backlog details,
  shipped items, decision log, full security writeups, and historical context.
