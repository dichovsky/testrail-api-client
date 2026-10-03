# TestRail API client repository review

Reviewed on 2026-10-03 at commit `b8a1581`, package version `8.0.0`.

The baseline review confirmed **nine actionable findings: one P1 and eight P2** despite strong compiler settings, extensive tests, generated coverage checks, and a carefully separated publishing workflow. All nine have been addressed in the accompanying change. The historical findings and reproductions below refer to commit `b8a1581`; they describe the baseline rather than the repaired implementation.

P1 means a high-priority security boundary defect under the stated threat conditions. P2 means a substantive correctness, availability, or maintenance defect to address in the normal development cycle. These are review priorities, not CVSS scores. Findings are based on source inspection and controlled reproductions; applicability and reproduction limits are stated below. No live TestRail writes were made.

## Remediation

| Finding | Implemented correction                                                                                                                                                 | Regression evidence                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Native fetch connects through a stdlib dispatcher using the validated DNS snapshot, with original Host/SNI/certificate identity and address-specific connection pools. | Real HTTP and HTTPS fixtures cover DNS substitution, hostname verification, redirects, uploads, decompression, cancellation, and backpressure. |
| 2       | Forced output opens without truncation, checks the held descriptor against the path, then truncates and writes that descriptor.                                        | Symlink substitution, dangling links, inode replacement, descriptor failures, and absent `O_NOFOLLOW` are covered.                             |
| 3       | File inputs use nonblocking opens before checking that the descriptor is a regular file.                                                                               | Bounded subprocess regressions reject FIFOs in both upload and JSON dry runs.                                                                  |
| 4       | In-flight sharing requires matching effective header/body timeouts; completed responses remain shared.                                                                 | Both request orders and independent body deadlines are covered.                                                                                |
| 5       | Response bodies drain iteratively, preserving byte/deadline limits and cancellation.                                                                                   | A subprocess drains one million one-byte chunks under a 64 MiB heap ceiling.                                                                   |
| 6       | Enriched test wrappers normalize nullish collections independently of advisory entity validation and reject malformed structures explicitly.                           | Null/omitted collection combinations, malformed wrappers, cache behavior, and strict-hook precedence are covered.                              |
| 7       | Skill installation preflights all owned files, stages the complete tree, and restores the previous tree on publication failure.                                        | Partial installs, existing references, publication failure, rollback failure, and preservation of unrelated files are covered.                 |
| 8       | The skill and generated guidance distinguish CLI runtime validation from typed SDK payloads and show explicit schema parsing for dynamic input.                        | Generator/skill tests verify the documented surface and version metadata.                                                                      |
| 9       | `npm run verify` explicitly builds and runs static checks, drift checks, coverage, and packed-package smoke tests.                                                     | Final verification is recorded below; install-script hardening remains enabled.                                                                |

The maintenance recommendations were also applied: the skill body is below 500 lines, references are self-contained, portable frontmatter uses `metadata`, the build uses Node filesystem primitives, and documentation distinguishes the tested Node 24 baseline from the declared Node 24+ support range. All generated artifacts were regenerated from their sources.

Transport review additionally caught an early-response upload cleanup hang during implementation, plus a pre-existing unhandled encoder rejection when a source stalled. The initial fix aborted the transport before closing owned stream wrappers. PR review then identified that requesting abort alone was insufficient for injected transports; the follow-up below tightens that condition. Retained JSON, multipart, and stalled-source regressions cover server errors and settlement waiting for underlying cancellation.

The pinned default transport makes direct connections. A custom fetch is trusted code and must honor the dispatcher or enforce equivalent destination checks; proxy wrappers that ignore it do not inherit pinning. Skill publication uses two directory renames with a brief absent-path interval, and a failed rollback preserves a recoverable backup. These limits are documented rather than presented as stronger guarantees.

## Initial remediation verification — 2026-10-04

At commit `ed1a5a3`, `npm run verify` passed end to end after remediation: production build, TypeScript 7 and TypeScript 6, lint, formatting, all generated-artifact checks, published-version consistency, lockfile policy, coverage, and packed-package consumer/CLI smoke tests.

| Check                    | Result                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Full suite               | 4,668 passed across 97 files; the 23 opt-in fuzz tests skipped in this run                                                       |
| Explicit fuzz run        | All 23 passed                                                                                                                    |
| Coverage                 | Statements 99.39%; branches 98.05%; functions 99.68%; lines 99.68%                                                               |
| Coverage thresholds      | Unchanged: 99% statements/functions/lines, 98% branches                                                                          |
| Dependency audit         | Zero reported vulnerabilities                                                                                                    |
| ESLint                   | No errors; 12 pre-existing warnings                                                                                              |
| Fresh independent review | No remaining actionable findings; final cleanup review independently passed 61 focused tests and the stalled native-upload probe |

That native transport suite contained 27 tests, including Latin1 header preservation and connection-pool separation by validated address set. CI ran it alongside the existing settlement checks on Linux, Windows, and macOS with Node 24. Local execution was on macOS; cross-platform CI and live TestRail behavior are separate verification surfaces.

## PR #309 review follow-up — 2026-10-04

The eight inline review comments identified further compatibility, lifecycle,
and documentation changes:

- Support both Node 24's legacy dispatch handlers and Node 26's Undici 8
  controller handlers; include both runtimes in every platform's transport
  and packed-consumer CI lane.
- Canonicalize each pool's address set, retaining resolver order for connection
  attempts, and respect explicit IPv4/IPv6 lookup requests.
- Require positive transport-stop evidence before cleanly closing an incomplete
  multipart source; injected fetch implementations that ignore abort retain
  erroring cleanup.
- Document the direct transport's global proxy/CA bypass, strict DNS answer
  families, and regular-file-only forced output as breaking changes with
  migration examples.
- Restore bounded build cleanup retries for transient Windows file locks.

Multipart shutdown now checks the exact supplied dispatcher's state or scoped
native transport evidence. HTTP/1 cleanup preserves reassigned sockets; HTTP/2
cleanup destroys only the stream correlated to the owned request, preserving
the shared session. Missing evidence retains erroring cleanup. Native FormData
encoding, filenames, and content length are unchanged.

The final follow-up verification passed:

| Check                            | Result                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run verify` on Node 24.21.0 | Passed all build, compiler, lint, formatting, generation, policy, coverage, and packed-package gates               |
| Full suite                       | 4,717 passed; 23 opt-in fuzz tests and three Node 26 native HTTP/2 tests skipped                                   |
| Explicit fuzz run                | All 23 passed                                                                                                      |
| Node 26.10.0 / Undici 8.10.2     | All 145 transport/settlement tests passed, including the three real HTTP/2 cases; packed consumer/CLI smoke passed |
| Coverage                         | Statements 99.43%; branches 98.12%; functions 99.79%; lines 99.69%; thresholds unchanged                           |
| ESLint                           | No errors; 12 pre-existing warnings                                                                                |

The HTTP/2 regressions cover complete framing, an early rejection with deferred
source cancellation, and a concurrent upload to the same endpoint. They assert
that cleanup preserves another request on the same session. Synthetic lifecycle
tests also exercise pooled callbacks with inherited async context, stale event
pairing, missing evidence, malformed events, and deterministic listener removal.
The fresh reviewer found no remaining actionable issues, independently passed
85 tests on Node 24 and 88 on Node 26, and checked that expired or terminated
HTTP/2 event pairs cannot capture an unrelated stream.
Local runs were on macOS; CI verifies both runtime lines on all three platforms.

## High priority security finding

### 1 Bind the connection to the validated DNS answers

**P1 · Security · High confidence**

Location: [src/client-core.ts:894](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L894). Related validation: [src/client-core.ts:83](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L83) and [src/client-core.ts:843](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L843).

The preliminary lookup validates its returned IP addresses, then discards them. The transport calls the default `fetch` with the original hostname, so its connection performs a separate lookup. A hostname whose answers change between validation and connection can therefore reach a private address with `allowPrivateHosts` still false. The claim at [src/client-core.ts:1044](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L1044) that immediately preceding validation eliminates this window is incorrect.

**Impact:** An application relying on this guard can connect to a private destination that the guard would reject; when HTTP is explicitly enabled, the request can also carry Basic credentials to that destination.

**Evidence:** A local sentinel and the real default `fetch` were used with controlled system resolver answers: the validation lookup returned `93.184.216.34`, and the connection lookup returned `127.0.0.1`. With `allowPrivateHosts` omitted, the sentinel received the API request and dummy authorization, and the SDK resolved successfully.

**Scope:** This reproduction used `allowInsecure: true` for a local HTTP fixture. Default HTTPS still requires successful certificate validation before sending HTTP credentials. This is not evidence of a TLS bypass or an unconditional credential leak. Exploitation requires influence over the configured hostname's resolution, or divergent validation and connection resolvers.

**Correction:** Validate in the connection's resolver and connect using the validated answers, while preserving the original hostname for Host/SNI and certificate checks. Keep the one-runtime-dependency constraint when choosing a transport implementation. Cover changed DNS answers and actual connection destinations in tests. OWASP identifies the risk of a later DNS resolution undermining earlier validation in its [SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html#domain-name).

## Normal priority findings

### 2 Forced downloads can follow a replaced symlink

**P2 · Security and CLI · High confidence**

Location: [src/cli/safe-write.ts:30](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/safe-write.ts#L30) through the write at line 40.

The forced-write path checks with `lstatSync`, then reopens the pathname using `writeFileSync(..., { flag: 'w' })`. A process able to modify the output directory can replace the inspected entry with a symlink between those calls. The subsequent open follows the link and truncates its target. Both attachment and BDD downloads use this helper.

**Evidence:** A controlled interleaving returned the genuine regular-file stat and substituted a symlink before the write. `safeWriteText(..., true)` overwrote a separate sentinel file. This demonstrates the race mechanism; it does not measure the probability of winning an unsynchronized race.

**Correction:** Open with `O_NOFOLLOW` where supported, inspect the held descriptor, and truncate/write through that descriptor after validating it. Preserve the atomic `wx` behavior for non-forced creation. Define equivalent behavior for supported platforms instead of treating a shorter check/open window as protection. [Node documents `O_NOFOLLOW` as rejecting a symbolic-link path at open time.](https://nodejs.org/api/fs.html#file-open-constants)

### 3 FIFO file inputs block before their type can be rejected

**P2 · Availability and CLI · High confidence**

Locations: [src/cli/file-input.ts:97](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/file-input.ts#L97) and [src/cli/body.ts:75](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/body.ts#L75).

Both paths call blocking `openSync(O_RDONLY | O_NOFOLLOW)` before `fstatSync` verifies that the input is a regular file. A FIFO without a writer blocks during the open, so the rejection is never reached. Because the main thread is blocked, JavaScript timers and installed signal handlers cannot resolve the operation.

**Evidence:** With a temporary FIFO and dummy credentials, both commands below produced no output and had to be killed by a subprocess harness after 2.5 seconds:

```text
testrail attachment add-to-case 1 --file FIFO --dry-run --timeout 100
testrail case add 1 --data-file FIFO --dry-run --timeout 100
```

The request timeout is a network setting; it cannot rescue this pre-network synchronous open.

**Correction:** Use a nonblocking open where supported, inspect the held descriptor, and reject nonregular inputs before reading. Add bounded subprocess tests for both paths, including dry runs. [Node provides `O_NONBLOCK` for nonblocking opens where supported.](https://nodejs.org/api/fs.html#file-open-constants)

### 4 Concurrent requests inherit the initiating caller timeout

**P2 · Runtime correctness · High confidence**

Locations: [src/client-core.ts:635](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/client-core.ts#L635) and [src/request-cache.ts:65](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/request-cache.ts#L65).

Requests from `withTimeout()` views use the same pending-request key. Sharing is gated by an aggregate deadline, but different per-attempt header/body timeout configurations are not considered. The initiating request therefore controls all joined callers, making an individual call's timeout depend on call order.

**Evidence:** With a mocked response delayed 150 ms and retries disabled:

| First caller        | Second caller       | Observed result                                              |
| ------------------- | ------------------- | ------------------------------------------------------------ |
| `withTimeout(1000)` | `withTimeout(20)`   | Both succeeded after approximately 181 ms                    |
| `withTimeout(20)`   | `withTimeout(1000)` | Both failed after approximately 23 ms with the 20 ms timeout |

The reproduction also disabled completed-response storage; in-flight sharing still occurred.

**Correction:** Separate in-flight keys by compatible effective timeout settings while retaining a shared completed-response cache, or provide independent waiter deadlines with a clearly defined sharing policy. Test both call orders and independently configured body deadlines.

### 5 Recursive body draining retains one promise chain per chunk

**P2 · Performance and availability · High confidence**

Location: [src/body-reader.ts:178](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/body-reader.ts#L178), also the recursion at line 148.

`return drain()` keeps the current async invocation pending until the next invocation settles. The complete chain remains pending until the stream ends. Consequently, the byte cap bounds the byte buffer but not the retained promises: heap use grows with the number of chunks.

**Evidence:** A native `ReadableStream` emitting one million one-byte chunks completed under the default 10 MiB and 30-second limits. After forced garbage collection at the final chunk, additional retained heap was approximately **98 MB for a 1 MB body**. An independent repeat measured 98,056,648 extra bytes. A temporary copy replacing only the recursion with a sequential loop retained approximately 2.1 MB in the comparison run. No repository source was modified for that comparison.

This is a synthetic stream benchmark; actual HTTP fragmentation rates and production throughput were not measured. The promise retention itself is directly reproduced.

**Correction:** Drain through an iterative `while` loop while preserving reader cancellation, absolute deadline checks, and operation observation. A local lint exception is appropriate: [ESLint explicitly permits awaiting inherently sequential work and operations whose concurrency would exhaust resources](https://eslint.org/docs/latest/rules/no-await-in-loop#when-not-to-use-it).

### 6 Advisory response drift can crash enriched test reads

**P2 · TypeScript runtime boundary · High confidence**

Location: [src/modules/tests.ts:68](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/modules/tests.ts#L68). Related schema: [src/schemas/tests.ts:50](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/schemas/tests.ts#L50).

`getTest(id, { withData: '1' })` assumes the response schema's collection transforms ran and unconditionally spreads `response.results` and `response.attachments`. When an unrelated entity field fails advisory validation, the transport returns the raw response instead; valid nullish or omitted collections have not been transformed into arrays.

**Evidence:** A response containing a test with `title: null`, plus `results: null` and `attachments: null`, emitted the expected advisory `invalid_type` warning and then threw `TypeError: response.results is not iterable`. The same collection shapes are accepted and normalized when the entity schema matches.

**Correction:** Separate structural wrapper/collection normalization from advisory entity validation. Normalize allowed nullish collections regardless of unrelated entity drift, and report genuinely malformed outer structures with the documented API error type. Test advisory drift combined with null and omitted collections; preserve strict-hook propagation.

### 7 Skill installation does not protect the entire installed file set

**P2 · CLI and agent skill maintenance · High confidence**

Locations: [src/cli/install-skill.ts:92](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/install-skill.ts#L92) and [src/cli/install-skill.ts:110](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/src/cli/install-skill.ts#L110).

The overwrite guard checks only `SKILL.md`. Reference files are then replaced unconditionally. The body is also published before the reference destination is validated, so a failed update can leave an incomplete or inconsistent installation.

**Evidence:** Isolated temporary-directory reproductions confirmed both cases:

- With no destination `SKILL.md` but an existing `reference/recipes.md`, installation without `--force` returned success and overwrote the existing recipe.
- With an existing body and an invalid `reference` destination, a forced update returned failure after already replacing the old body.

**Correction:** Preflight every destination and enforce the same overwrite policy across the installed set. Stage the new files and preserve the previous set on failure; publish the new body only after its referenced resources are ready. Test partial installations and failures during an update.

### 8 Agent instructions promise SDK validation that does not occur

**P2 · Documentation and agent safety contract · High confidence**

Locations: [skill/SKILL.md:463](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/skill/SKILL.md#L463), [skill/reference/typescript-api.md:77](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/skill/reference/typescript-api.md#L77), and the generated-rules source [scripts/rules-content.ts:123](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/scripts/rules-content.ts#L123).

The skill states that both interfaces validate write payloads with the same schemas, and its SDK example describes `addProject` as Zod-validated. However, SDK methods ordinarily send the payload directly. [README.md:58](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/README.md#L58) correctly describes this as compile-time-only SDK typing with runtime validation in the CLI.

**Evidence:** `AddResultPayloadSchema.safeParse({})` failed, while `client.results.addResult(1, {})` reached a mocked fetch with POST body `{}`. This call also fits the current inferred all-optional payload type. An agent or JavaScript consumer following the skill can therefore rely on a preflight validation boundary that is absent.

**Correction:** Align the skill and generated instructions with the intentional README contract. Show explicit schema parsing when SDK input originates from dynamic JSON. Edit the generator source and regenerate AGENTS rather than hand-editing generated output. Treat this as documentation drift, not a separate demand to change the SDK's intentional validation policy.

### 9 Normal npm test skips the advertised local validation gates

**P2 · Tooling and maintenance · High confidence**

Locations: [.npmrc:18](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/.npmrc#L18) and [package.json:64](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/package.json#L64).

The repository enables `ignore-scripts=true`, while placing type checks, lint, formatting, generated-document checks, and other local gates in `pretest`. Explicit `npm test` runs Vitest but does not run its pre-hook. Repository guidance claiming those checks run through normal tests is therefore inaccurate.

**Evidence:** `npm test -- --help` invoked only `vitest run --help`. Explicitly invoking `npm run pretest` did run the checks, but on the fresh checkout it stopped at `agents-md:check` because `dist/cli/metadata.js` did not exist. After a build, the remaining checks passed.

**Correction:** Add or document an explicit complete verification command with build-before-generated-check ordering, and have the recommended development workflow invoke it directly. Retain install-script hardening. CI and publishing already invoke their gates explicitly, so this is **not a demonstrated CI or release bypass**. [npm documents that `ignore-scripts` permits explicitly requested scripts but suppresses their pre/post hooks.](https://docs.npmjs.com/cli/v11/using-npm/config/#ignore-scripts)

## Baseline maintenance recommendations

These are lower-priority improvements, not additional confirmed runtime vulnerabilities.

- **Keep the installed skill self-contained.** The 527-line body still references repository-only files such as `CODEMAP.md`, `src/schemas.ts`, and `BACKLOG.md`. Replace unavailable local references with shipped resources or explicit upstream links. Its stdin/file discussion at [skill/SKILL.md:451](https://github.com/dichovsky/testrail-api-client/blob/b8a1581/skill/SKILL.md#L451) also incorrectly describes JSON file reads as unbounded; they have an enforced 1 MiB cap. Text stdin still lacks a deadline, as documented; the implemented 30-second stdin deadline applies to binary uploads.
- **Complete progressive disclosure and portability.** Move historical safety notes and repeated policy out of the body, and use `metadata` for custom frontmatter if supporting the portable format. The [Agent Skills specification](https://agentskills.io/specification) recommends a body below 500 lines, on-demand resources, and a metadata map for custom properties. This is not evidence that the current Claude-specific skill fails to load.
- **Use the same portable build entry point everywhere.** The package build uses `rm -rf`, while Windows verification uses a different cleanup path. A Node filesystem cleanup would make the documented command portable without adding a dependency.
- **Clarify runtime support.** `engines.node >=24` permits later majors, while CI exercises Node 24. Document tested versus supported versions or add a deliberate version matrix.
- **Test semantic contracts in addition to coverage.** Add regressions for the interleavings and cross-layer combinations above. The existing coverage percentages did not detect these failures.

## Baseline verification and areas reviewed

Local environment: Node `24.21.0`, npm `12.2.0`, macOS. Locked dependencies were installed with lifecycle scripts disabled.

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

The first attempted `npm test` could not run before dependencies were installed. The explicit `pretest` failure on missing build output is recorded in finding 9; it was not counted as a successful all-in-one verification run. All listed individual checks subsequently completed.

TypeScript review covered strict compiler/lint settings, emitted declarations, public response/payload contracts, runtime narrowing, module adapters, and consumer smoke tests. Runtime review covered request orchestration, cache generations/coalescing, pagination, deadlines, retry policy, body reading, and lifecycle tracking. CLI/security review covered credentials, DNS/private-host checks, redirects, filesystem I/O, destructive gates, diagnostics, and output. Documentation/skill review covered generated mappings, recipe coverage, installed references, and installer behavior.

Publishing controls are a relative strength: restrictive package/export allowlists, consumer declaration checks, pinned workflow actions, default read-only permissions, separate OIDC publishing permissions, immutable release identity checks, tested-artifact digest validation, and registry/version checks. Their design follows the short-lived identity approach described by [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). No separate actionable publishing defect was established in this review.

Remote GitHub environment approval rules, branch protections, the configured npm trusted-publisher identity, actual release execution, live TestRail behavior, Windows execution, and non-Claude agent-host compatibility were not verified. A zero-advisory registry audit is a point-in-time dependency check, not proof of absence of vulnerabilities. The security skill contained no Node library/CLI-specific reference, so that portion used its general guidance, primary Node/OWASP documentation, and controlled local probes.
