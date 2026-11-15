# TestRail API client repository review

Reviewed on 2026-10-03 at commit `b8a1581`, package version `8.0.0`.

The baseline review identified **nine actionable findings: one P1 and eight P2**.
It found these issues despite strict compiler settings, extensive tests,
generated coverage checks, and an isolated publishing workflow. The accompanying
change resolved all nine findings. The findings and reproductions below refer to
commit `b8a1581` and describe the baseline before the fixes.

A P1 finding is a high-priority security boundary defect under the stated threat
conditions. A P2 finding is a correctness, availability, or maintenance defect
for the normal development cycle. These labels are review priorities, not CVSS
scores. Each finding comes from source inspection and controlled local
reproductions. The sections below state the scope and reproduction limits. The
review performed no live TestRail writes.

## Remediation

| Finding | Implemented correction                                                                                                                                              | Regression evidence                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Native `fetch` connects through a stdlib dispatcher with the validated DNS snapshot, original Host/SNI/certificate identity, and address-specific connection pools. | Real HTTP and HTTPS fixtures cover DNS substitution, hostname verification, redirects, uploads, decompression, cancellation, and backpressure. |
| 2       | Forced output opens without truncation, checks the held descriptor against the path, and then truncates and writes that descriptor.                                 | Tests cover symlink substitution, dangling links, inode replacement, descriptor failures, and missing `O_NOFOLLOW`.                            |
| 3       | File inputs open in nonblocking mode before checking that the descriptor is a regular file.                                                                         | Bounded subprocess tests reject FIFOs in both upload and JSON dry runs.                                                                        |
| 4       | In-flight request sharing requires matching header and body timeouts, while completed responses remain shared.                                                      | Tests cover both request orders and independent body deadlines.                                                                                |
| 5       | Response bodies drain in an iterative loop while keeping byte limits, deadlines, and cancellation.                                                                  | A subprocess test drains one million one-byte chunks under a 64 MiB heap limit.                                                                |
| 6       | Enriched test wrappers normalize nullish collections separately from advisory entity validation and reject malformed wrappers.                                      | Tests cover null and omitted collections, malformed wrappers, cache behavior, and strict-hook precedence.                                      |
| 7       | Skill installation checks all owned files first, stages the full tree, and restores the previous tree if publication fails.                                         | Tests cover partial installs, existing references, publication failure, rollback failure, and unrelated files.                                 |
| 8       | The skill and generated docs distinguish CLI runtime validation from typed SDK payloads and show explicit schema parsing for dynamic data.                          | Generator and skill tests verify the documented surface and version metadata.                                                                  |
| 9       | `npm run verify` runs the build, static checks, drift checks, coverage, and packed-package smoke tests.                                                             | The table below records the final verification results; install-script hardening remains enabled.                                              |

The change also applied the maintenance recommendations. The skill body now has fewer than 500 lines and self-contained references. Portable frontmatter uses `metadata`, and the build uses Node filesystem APIs. The docs distinguish the tested Node 24 baseline from the declared `>=24` range. All generated artifacts
were regenerated from their sources.

The transport review also found two upload cleanup bugs: a hang on early server
responses and an unhandled encoder rejection when a file source stalled. The
first fix aborted the transport before closing the stream wrappers. Pull request
review then showed that an abort signal alone is not sufficient for custom
`fetch` functions. The follow-up below requires positive transport-stop evidence.
Regression tests for JSON, multipart, and stalled sources verify server errors
and settlement waiting for cancellation.

The default pinned transport connects directly to the server. A custom `fetch`
function is trusted code and must honor the dispatcher or enforce equivalent
destination checks. Proxy wrappers that ignore the dispatcher do not inherit DNS
pinning. Skill installation renames two directories, which creates a brief window
where the target path is absent. If a rollback fails, the installer keeps a
recoverable backup directory. The documentation states these limits explicitly.

## Initial remediation verification — 2026-10-04

At commit `ed1a5a3`, `npm run verify` passed all checks. These included production build, TypeScript 7, TypeScript 6, ESLint, formatting, and generated-artifact checks. Published-version checks, lockfile policy, coverage, and packed-package smoke tests also passed.

| Check                    | Result                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Full suite               | 4,668 passed across 97 files; 23 opt-in fuzz tests skipped in this run                                                               |
| Explicit fuzz run        | All 23 passed                                                                                                                        |
| Coverage                 | Statements 99.39%; branches 98.05%; functions 99.68%; lines 99.68%                                                                   |
| Coverage thresholds      | Unchanged: 99% statements/functions/lines, 98% branches                                                                              |
| Dependency audit         | Zero reported vulnerabilities                                                                                                        |
| ESLint                   | No errors; 12 pre-existing warnings                                                                                                  |
| Fresh independent review | No remaining actionable findings; the final cleanup review passed 61 focused tests and the stalled native-upload probe independently |

The native transport suite included 27 tests, which covered Latin1 headers and
connection-pool separation by validated address set. CI ran this suite and the
settlement checks on Linux, Windows, and macOS with Node 24. Local verification
ran on macOS. Cross-platform CI and live TestRail instances provide separate
verification coverage.

## PR #309 review follow-up — 2026-10-04

Eight inline review comments identified additional compatibility, lifecycle, and
documentation updates:

- Support both Node 24 legacy dispatch handlers and Node 26 Undici 8 controller
  handlers. Run transport and packed-consumer CI jobs on both Node versions
  across all platforms.
- Canonicalize each connection pool's address set, keep resolver order for
  connection attempts, and honor explicit IPv4 or IPv6 lookup requests.
- Require positive transport-stop evidence before closing an incomplete
  multipart source cleanly. Keep erroring cleanup for custom `fetch` functions
  that ignore abort signals.
- Document the direct transport's global proxy and CA bypass, strict DNS answer
  families, and regular-file-only forced output as breaking changes with
  migration examples.
- Restore bounded build cleanup retries for transient Windows file locks.

Multipart shutdown now checks the supplied dispatcher state or scoped native
transport diagnostics. HTTP/1 cleanup leaves reassigned sockets untouched.
HTTP/2 cleanup destroys only the stream for the owned request and preserves the
shared session. When transport evidence is missing, cleanup errors the stream
wrappers. Native `FormData` encoding, filenames, and content length remain
unchanged.

The final follow-up verification passed:

| Check                            | Result                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run verify` on Node 24.21.0 | Passed all build, compiler, lint, formatting, generation, policy, coverage, and packed-package gates               |
| Full suite                       | 4,717 passed; 23 opt-in fuzz tests and three Node 26 native HTTP/2 tests skipped                                   |
| Explicit fuzz run                | All 23 passed                                                                                                      |
| Node 26.10.0 / Undici 8.10.2     | All 145 transport/settlement tests passed, including the three real HTTP/2 cases; packed consumer/CLI smoke passed |
| Coverage                         | Statements 99.43%; branches 98.12%; functions 99.79%; lines 99.69%; thresholds unchanged                           |
| ESLint                           | No errors; 12 pre-existing warnings                                                                                |

The HTTP/2 regression tests cover complete framing, early rejection with
deferred source cancellation, and concurrent uploads to the same endpoint. They
verify that cleanup preserves other requests on the same HTTP/2 session.
Synthetic lifecycle tests also cover pooled callbacks with inherited async
context, stale event pairing, missing evidence, malformed events, and listener
removal. A second review found no remaining actionable issues. It passed 85 tests on Node 24 and 88 tests on Node 26. It verified that expired or terminated HTTP/2 event pairs cannot close an unrelated stream. Local runs executed on
macOS, and CI verifies both Node versions on Linux, Windows, and macOS.

## High priority security finding

### 1 Bind the connection to the validated DNS answers

**P1 · Security · High confidence**

Location: [src/client-core.ts:894](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L894). Related validation: [src/client-core.ts:83](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L83) and [src/client-core.ts:843](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L843).

The preflight lookup validates the returned IP addresses and then discards them.
Next, the transport calls the default `fetch` with the original hostname, which
triggers a second DNS lookup. If the DNS answers change between validation and
connection, `fetch` can connect to a private IP address even when
`allowPrivateHosts` is `false`. The comment at
[src/client-core.ts:1044](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L1044)
incorrectly claims that preflight validation eliminates this race window.

**Impact:** An application that relies on the private-host guard can connect to
a prohibited private IP address. If `allowInsecure: true` enables HTTP, the
request also sends Basic authentication credentials to that destination.

**Evidence:** A test with a local HTTP server and the default `fetch` controlled
the system resolver responses. The validation lookup returned `93.184.216.34`,
and the connection lookup returned `127.0.0.1`. With `allowPrivateHosts` omitted,
the local server received the API request and Basic authorization header, and the
SDK call succeeded.

**Scope:** This reproduction set `allowInsecure: true` to use a local HTTP
server. Default HTTPS still requires a valid TLS certificate before sending HTTP
headers. This finding does not bypass TLS verification or leak credentials over
HTTPS without a valid certificate. Exploitation requires control over the
hostname's DNS records or different resolvers for validation and connection.

**Correction:** Validate DNS answers in the connection path and connect directly
to those validated IP addresses. Keep the original hostname for the `Host`
header, TLS SNI, and certificate verification. Maintain the single-runtime-dependency
constraint when building the transport. Add tests for changing DNS answers and
verified connection destinations. See the OWASP
[SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html#domain-name)
on DNS rebinding between validation and connection.

## Normal priority findings

### 2 Forced downloads can follow a replaced symlink

**P2 · Security and CLI · High confidence**

Location: [src/cli/safe-write.ts:30](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/safe-write.ts#L30) through line 40.

The forced-write path checks the target with `lstatSync` and then reopens the
path with `writeFileSync(..., { flag: 'w' })`. Another process with write access
to the directory can replace the file with a symlink between those two calls.
The `writeFileSync` call then follows the symlink and truncates its target. Both
attachment downloads and BDD downloads use this helper.

**Evidence:** A test returned the regular-file `lstatSync` result and replaced
the path with a symlink before `writeFileSync`. Calling `safeWriteText(..., true)`
overwrote a separate target file. This test demonstrates the time-of-check to
time-of-use (TOCTOU) race, though it does not measure race probability in
production.

**Correction:** Open the file with `O_NOFOLLOW` where supported, verify the open
file descriptor, and truncate and write through that descriptor. Keep the atomic
`wx` flag when `--force` is not set. Define consistent behavior across supported
platforms instead of relying on a short race window.
[Node.js documents `O_NOFOLLOW`](https://nodejs.org/api/fs.html#file-open-constants)
for rejecting symbolic links at open time.

### 3 FIFO file inputs block before their type can be rejected

**P2 · Availability and CLI · High confidence**

Locations: [src/cli/file-input.ts:97](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/file-input.ts#L97) and [src/cli/body.ts:75](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/body.ts#L75).

Both functions call blocking `openSync(O_RDONLY | O_NOFOLLOW)` before `fstatSync`
checks whether the descriptor is a regular file. Opening a FIFO (named pipe)
with no writer blocks inside `openSync`, so execution never reaches `fstatSync`.
Because `openSync` blocks the main thread, JavaScript timers and signal handlers
cannot abort the call.

**Evidence:** Using a temporary FIFO and dummy credentials, both commands below
hung with no output until the test harness killed them after 2.5 seconds:

```text
testrail attachment add-to-case 1 --file FIFO --dry-run --timeout 100
testrail case add 1 --data-file FIFO --dry-run --timeout 100
```

The `--timeout` flag applies only to network requests and cannot interrupt a
synchronous file open.

**Correction:** Open the path with `O_NONBLOCK` where supported, check the file
descriptor with `fstatSync`, and reject non-regular files before reading. Add
bounded subprocess tests for both upload and `--data-file` paths, including
`--dry-run`. [Node.js documents `O_NONBLOCK`](https://nodejs.org/api/fs.html#file-open-constants)
for nonblocking file opens.

### 4 Concurrent requests inherit the initiating caller timeout

**P2 · Runtime correctness · High confidence**

Locations: [src/client-core.ts:635](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L635) and [src/request-cache.ts:65](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/request-cache.ts#L65).

Requests from `withTimeout()` views share the same pending-request key. The
cache checks aggregate deadlines, but it ignores per-attempt header and body
timeouts. Therefore, the first caller's timeout governs all joined callers, and
each caller's effective timeout depends on call order.

**Evidence:** A test delayed a mocked response by 150 ms and disabled retries:

| First caller        | Second caller       | Observed result                                              |
| ------------------- | ------------------- | ------------------------------------------------------------ |
| `withTimeout(1000)` | `withTimeout(20)`   | Both succeeded after approximately 181 ms                    |
| `withTimeout(20)`   | `withTimeout(1000)` | Both failed after approximately 23 ms with the 20 ms timeout |

This reproduction also disabled response caching, which confirmed that in-flight
coalescing caused the shared timeout.

**Correction:** Include effective header and body timeouts in the in-flight
coalescing key while keeping a shared cache for completed responses.
Alternatively, apply independent timeouts to each waiting caller. Test both call
orders and separate body deadlines.

### 5 Recursive body draining retains one promise chain per chunk

**P2 · Performance and availability · High confidence**

Location: [src/body-reader.ts:178](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/body-reader.ts#L178) and line 148.

The recursive `return drain()` call keeps each async frame pending until the
next recursive call resolves. The entire promise chain stays in memory until the
stream finishes. Therefore, the byte limit caps the buffer size, but heap memory
still grows linearly with the chunk count.

**Evidence:** A test read a native `ReadableStream` of one million one-byte
chunks within the default 10 MiB and 30-second limits. After garbage collection
at the final chunk, retained heap memory grew by **98 MB for a 1 MB body**
(98,056,648 bytes on a repeat run). Replacing the recursion with a `while` loop
reduced retained heap memory to 2.1 MB in a side-by-side test.

This benchmark used a synthetic stream and did not measure network packet
fragmentation in production. However, it directly confirmed the recursive
promise retention.

**Correction:** Replace the recursive `drain()` function with an iterative
`while` loop. Keep stream cancellation, deadline checks, and operation tracking.
Add a targeted ESLint disable comment for the loop:
[ESLint permits `await` in a loop](https://eslint.org/docs/latest/rules/no-await-in-loop#when-not-to-use-it)
when iterations are sequential.

### 6 Advisory response drift can crash enriched test reads

**P2 · TypeScript runtime boundary · High confidence**

Location: [src/modules/tests.ts:68](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/modules/tests.ts#L68). Related schema: [src/schemas/tests.ts:50](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/schemas/tests.ts#L50).

`getTest(id, { withData: '1' })` spreads `response.results` and
`response.attachments` directly because it assumes the Zod schema already
transformed `null` or `undefined` into empty arrays. However, when any field on
the test object fails advisory validation, `request()` returns the unparsed raw
response. In that case, `results` or `attachments` can still be `null` or
`undefined`.

**Evidence:** A mocked response returned `title: null`, `results: null`, and
`attachments: null`. The client emitted the advisory `invalid_type` warning for
`title` and then threw `TypeError: response.results is not iterable`. When
`title` was a valid string, the client normalized `results: null` and
`attachments: null` to `[]`.

**Correction:** Separate outer wrapper normalization from advisory entity
validation. Normalize `null` or omitted `results` and `attachments` arrays even
when an entity field drifts, and throw `TestRailApiError` when the outer wrapper
itself is invalid. Add tests for entity drift with `null` and omitted
collections, and keep strict-hook error precedence.

### 7 Skill installation does not protect the entire installed file set

**P2 · CLI and agent skill maintenance · High confidence**

Locations: [src/cli/install-skill.ts:92](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/install-skill.ts#L92) and [src/cli/install-skill.ts:110](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/install-skill.ts#L110).

The overwrite check inspects only `SKILL.md` and then overwrites all files in
`reference/` unconditionally. In addition, the installer writes `SKILL.md`
before it validates the `reference/` directory. If writing `reference/` fails,
the target directory is left in a partially updated state.

**Evidence:** Tests in temporary directories confirmed both issues:

- When `SKILL.md` was absent but `reference/recipes.md` existed, running
  `install-skill` without `--force` succeeded and overwrote `reference/recipes.md`.
- When `SKILL.md` existed and `reference` was an invalid path, `install-skill --force`
  overwrote `SKILL.md` before failing on `reference`.

**Correction:** Check all target paths before writing any files, and apply the
same overwrite rule to every bundled file. Stage the new files in a temporary
directory, swap the staged tree into place, and restore the previous files if
the update fails. Add tests for partial installations and mid-update failures.

### 8 Agent instructions promise SDK validation that does not occur

**P2 · Documentation and agent safety contract · High confidence**

Locations: [skill/SKILL.md:463](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/skill/SKILL.md#L463), [skill/reference/typescript-api.md:77](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/skill/reference/typescript-api.md#L77), and [scripts/rules-content.ts:123](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/scripts/rules-content.ts#L123).

The skill documentation incorrectly states that both the CLI and SDK validate write payloads at runtime with Zod. Its SDK example also claims that `addProject` runs Zod validation. In reality, SDK methods pass payloads directly to `request()`
without runtime schema parsing. [README.md:58](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/README.md#L58)
accurately states that the SDK provides compile-time types while the CLI runs
Zod validation at runtime.

**Evidence:** `AddResultPayloadSchema.safeParse({})` failed, whereas
`client.results.addResult(1, {})` sent an HTTP POST with body `{}`. Because all
fields on `AddResultPayload` are optional in TypeScript, `{}` also passes type
checking. Callers who rely on the skill documentation may assume the SDK blocks
invalid payloads before sending a request.

**Correction:** Update the skill and generated rules to match `README.md`. Show
how to call `.parse()` explicitly when passing dynamic JSON to the SDK. Edit the
generator source in `scripts/rules-content.ts` and regenerate `AGENTS.md`
instead of editing generated files directly. Keep the SDK's existing validation
behavior.

### 9 Normal npm test skips the advertised local validation gates

**P2 · Tooling and maintenance · High confidence**

Locations: [.npmrc:18](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/.npmrc#L18) and [package.json:64](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/package.json#L64).

The `.npmrc` file sets `ignore-scripts=true`, while `package.json` places
typechecking, linting, formatting, and generated-artifact checks in `pretest`.
Because `ignore-scripts=true` disables `pretest` hooks, running `npm test`
executes only Vitest. Documentation stating that `npm test` runs the full
validation suite is therefore inaccurate.

**Evidence:** Running `npm test -- --help` executed only `vitest run --help`.
Running `npm run pretest` directly executed the checks, but on a clean checkout
it failed at `agents-md:check` because `dist/cli/metadata.js` was not built yet.
After `npm run build`, `npm run pretest` passed.

**Correction:** Add a dedicated `npm run verify` script that builds the project
before running static, drift, coverage, and smoke checks. Update the repository
documentation to recommend `npm run verify`. Keep `ignore-scripts=true` in
`.npmrc`. Note that CI and release workflows already run each check explicitly,
so this issue does not bypass CI or release gates.
[The npm documentation](https://docs.npmjs.com/cli/v11/using-npm/config/#ignore-scripts)
notes that `ignore-scripts` skips `pre` and `post` hooks even when you run a
script directly.

## Baseline maintenance recommendations

These items are maintenance improvements rather than runtime bugs:

- **Keep the installed skill self-contained.** The 527-line skill body links to
  repository-only files such as `CODEMAP.md`, `src/schemas.ts`, and
  `BACKLOG.md`. Replace local repository paths with bundled reference files or
  public URLs. Also fix [skill/SKILL.md:451](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/skill/SKILL.md#L451),
  which states that JSON file reads are unbounded; the CLI enforces a 1 MiB cap.
  Text stdin remains unbounded in time, whereas binary stdin uploads have a
  30-second deadline.
- **Keep the skill concise and portable.** Move historical notes and repeated
  rules out of `skill/SKILL.md`, and place custom frontmatter fields under
  `metadata`. The [Agent Skills specification](https://agentskills.io/specification)
  recommends keeping `SKILL.md` under 500 lines, loading reference files on
  demand, and grouping custom frontmatter under `metadata`.
- **Use a portable build cleanup step.** The `build` script runs `rm -rf`, while
  Windows CI uses a separate cleanup step. Use a Node.js filesystem call so
  `npm run build` works identically across platforms without extra dependencies.
- **Clarify tested Node.js versions.** `engines.node` specifies `>=24`, while
  baseline CI tested only Node 24. Document the tested runtime versions or add
  newer Node majors to the CI matrix.
- **Add targeted regression tests for edge cases.** Add tests for the race
  conditions, timeout sharing, and cross-layer interactions described above. Line
  and branch coverage metrics alone did not catch these defects.

## Baseline verification and areas reviewed

Local environment: Node `24.21.0`, npm `12.2.0`, macOS. Dependencies were
installed with `npm ci --ignore-scripts`.

| Verification                                 | Result                                                             |
| -------------------------------------------- | ------------------------------------------------------------------ |
| TypeScript 7 check                           | Passed                                                             |
| TypeScript 6 compatibility check             | Passed                                                             |
| ESLint                                       | Passed with 12 existing warnings and no errors                     |
| Existing-file formatting check               | Passed                                                             |
| Full test suite with coverage                | 4,590 passed; 23 fuzz tests initially skipped                      |
| Explicit fuzz suite with `RUN_FUZZ=1`        | All 23 passed                                                      |
| Coverage                                     | Statements 99.41%; branches 98.16%; functions 99.78%; lines 99.70% |
| Build                                        | Passed                                                             |
| Packed-package consumer and executable smoke | Passed                                                             |
| CODEMAP and API mapping drift checks         | Passed                                                             |
| AGENTS and skill drift checks after build    | Passed                                                             |
| Published-version consistency check          | Passed; latest listed version 8.0.0                                |
| Lockfile trust-policy check                  | Passed                                                             |
| Full dependency audit                        | Passed; registry reported zero vulnerabilities                     |

The first `npm test` run failed before dependencies were installed. Finding 9
records the `pretest` failure on a clean checkout before `npm run build`. Every
individual check passed after building the project.

The TypeScript review checked compiler and ESLint rules, emitted `.d.ts` files,
public response and payload types, runtime narrowing, module adapters, and
consumer smoke tests. The runtime review checked request orchestration, cache
generations and coalescing, pagination, deadlines, retry policy, body streaming,
and operation tracking. The CLI and security review checked credential handling,
DNS and private-host guards, redirects, file I/O, destructive command gates,
diagnostics, and terminal sanitization. The documentation review checked
generated mappings, skill recipes, bundled references, and skill installation.

The publishing workflow is well-structured. It enforces package file allowlists, declaration checks, pinned GitHub Actions, and read-only default permissions. It also checks isolated OIDC permissions, tags, commits, artifact digests, and the npm registry. This setup follows the short-lived
credential model in [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
The review found no actionable defects in the publishing workflow.

This review did not inspect remote GitHub environment protection, branch protection, live npm trusted-publisher configuration, or live release runs. It did not inspect live TestRail servers, Windows hosts, or non-Claude agent hosts. An
`npm audit` result with zero advisories reflects the registry database at review
time and does not guarantee the absence of vulnerabilities. The security skill lacked Node.js library and CLI references. The review used its general rules, official Node.js and OWASP documentation, and local reproduction tests.
