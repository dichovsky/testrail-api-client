# Changelog

This document records all notable changes to `@dichovsky/testrail-api-client`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Published to npm:** `1.0.0`, `2.1.0`, `4.0.0`, `4.1.0`, `5.0.0`, `5.0.1`, `5.0.2`, `5.1.0`, `5.2.0`, `5.2.1`, `5.3.0`, `6.0.0`, `7.0.0`, `7.1.0`, `7.2.0`, `8.0.0`, `9.0.0`, `10.0.0`.
> Other version headers in this file (`2.0.0`/`2.2.0` and the `3.x` line) were internal or unreleased and never reached the npm registry.
> The `5.0.0` entry combines unreleased work from `5.0.0` through `7.1.0` into one major version bump from `4.1.0`.
> That update did not revert any source code. It only aligned the version number and this log with the published npm versions.

## [Unreleased]

## [10.0.0] — 2026-11-21 — Node 26, upload ownership, and response validation

This major release requires Node.js 26 and changes upload cleanup and custom response validation.
It includes #310–#317, plus release preparation, removal of the obsolete dependency audit exception, and the fixes from a pre-release audit of the SDK, CLI, and skill.
See the [upgrade checklist](README.md#upgrading-to-1000) before updating existing applications.

### Changed — BREAKING

- **Node.js 26 is now the minimum supported runtime.** Upgrade application, CLI, and CI runtimes before installing this release. Users on Node 24 must remain on 9.0.0 or upgrade Node.js. The package declares `engines.node: >=26`, and `.nvmrc` selects Node 26.
- **SDK upload methods own supplied file descriptors from the call onward.** This includes calls rejected by ID validation, request validation, or a destroyed client. Remove caller cleanup after early rejection, and do not close or reuse a descriptor after passing it to an upload method. See [SDK upload ownership](docs/SDK.md#upload-files).
- **Internal response checks no longer call public `parse()`.** This affects previews from `cases.deleteCase()`, `cases.deleteCases()`, `runs.deleteRun()`, `sections.deleteSection()`, and `suites.deleteSuite()`. It also affects `bdd.addBdd()` and `bdd.updateBdd()`. Subclass or instance overrides of `parse()` no longer run for these replies. Direct `client.parse()` calls retain their behavior. Move mismatch reporting or strict validation to `onSchemaMismatch`. Apply response transformations after awaiting the method. See [SDK response validation](docs/SDK.md#response-validation).
- **A DNS resolver failure is now a network `TestRailApiError`, not a `TestRailValidationError`.** A lookup that rejects or returns no addresses throws `TestRailApiError` with `status: 0` and `statusText: 'Network error: DNS lookup failed for "<host>": <reason>'`. The resolver error is the `cause`. Retryable reads retry it like other network errors; writes do not. The message no longer suggests `allowPrivateHosts: true`, because the resolver failed, not the host check. The client sends no request, and each retry validates the host again. Private-address verdicts and invalid resolver answers remain `TestRailValidationError`. Code that catches `TestRailValidationError` for DNS outages must catch `TestRailApiError` with `status === 0`.
- **A `baseUrl` with a query string or fragment is rejected at construction.** The client appends `/index.php?/api/v2/...` to `baseUrl`. A fragment sent the authenticated request to the site root, and a query string absorbed the API path. Pass the instance origin, with an optional path prefix.
- **`Result.quality_rating` can be an object.** The `Result` type and `ResultSchema` now use `number | Record<string, unknown> | null | undefined`. TestRail 10.3 and later document one score per rating dimension, for example `{ factual_accuracy: 4, relevance: 5 }`. Check `typeof result.quality_rating === 'number'` before numeric use. No live response with this field was captured.
- **Bulk case and test writes validate their ID lists before sending.** `cases.updateCases()`, `cases.deleteCases()`, `cases.copyCasesToSection()`, `cases.moveCasesToSection()`, and `tests.updateTests()` throw `TestRailValidationError` for a missing, empty, sparse, or non-array list. The four case methods also reject an ID that is not a positive integer; `tests.updateTests()` already did. `cases.addCases()` rejects an empty array. The matching payload schemas (`case_ids`, `test_ids`) require a non-empty array of positive integers, so CLI `--data` input fails the same way. The client previously sent these values to TestRail, or threw a raw `TypeError` for a missing list. The `updateTests()` message for an invalid ID changed from `testId must be a positive integer` to `testIds[<index>] must be a positive integer`.
- **Published declarations omit members marked `@internal`.** `RequestSpec` no longer declares `cacheVariant`, `deadlineAt`, `timeout`, or `bodyTimeout`, so passing them to `client.request()` no longer compiles. Use `client.withTimeout(ms)` for a per-request timeout.
- **CLI: `--limit` and `--offset` are strict in every mode.** A malformed or out-of-range value (`abc`, `-5`, `1e2`, `010`, an empty value, `--limit 0`, `--limit` above 250, or a value above 2^53-1) exits 1 before authentication. Previously, the default mode dropped the value, sent the request without it, and exited 0.
- **CLI: an empty `--timeout` is rejected.** `--timeout ''` and `--timeout=` fail with `--timeout must be a positive integer`. Previously they selected `TESTRAIL_TIMEOUT` or the default. An empty `TESTRAIL_TIMEOUT` still counts as unset.
- **CLI: `install-skill` and `uninstall-skill` reject positional arguments.** Previously, `install-skill ./elsewhere --force` ignored the path and overwrote the skill in the current directory, and `uninstall-skill junk` uninstalled the skill.

### Changed

- **Delete modes are fixed when called.** The five soft-delete methods listed above now read `options.soft` once. Previously, changing it while a request was pending could change response validation and whether the method returned a preview. The initial mode now determines the URL, response schema, and return value.
- CLI text and binary stdin now use explicit runtime readers. Binary limits, timeouts, and dry-run behavior remain unchanged.
- Multipart uploads now share transport observation and cleanup. Released upload sources cannot reopen their original paths.
- Attachment and BDD downloads now share output handling. Destination checks, payload output, acknowledgements, and quiet behavior remain unchanged.
- Destructive CLI commands now share preview, confirmation, execution, and output handling. Existing input checks, destructive gates, soft previews, and output formats remain unchanged.
- **Oxlint replaces ESLint for repository linting.** `npm run lint` runs type-aware rules through `oxlint-tsgolint`. Configuration now lives in `.oxlintrc.json`.
- **Repository builds and package checks now use TypeScript 7.** The `typescript` development dependency is `~7.0.2`. The TypeScript 6 alias, the `@typescript/native` alias, and `npm run typecheck:ts6` are removed. Published declarations are tested with TypeScript 7 only; other compiler versions are not tested. TypeScript is not a runtime or peer dependency of the published package.
- Code generators now parse source through `scripts/ts-source.ts`, using the unstable TypeScript 7 API (`typescript/unstable/*`). The lockfile pins that API, and generated-file checks detect output changes.
- CI tests Node 26 on Linux, Windows, and macOS. Both publish jobs pin Node 26.13.1. CI uses `macos-latest` after retirement of the `macos-14` runner image.
- Updated Zod to `^4.6.7`. Zod remains the only runtime dependency.
- Updated `@types/node` to `^26.6.6`.
- Updated Vitest and its V8 coverage provider to `^5.1.1`, `fast-check` to `^4.10.3`, `oxlint-tsgolint` to `^7.0.2008`, and `lockfile-lint` to `^5.1.0`.
- Updated Prettier to `~3.10.1` and refreshed transitive dependencies.
- Simplified repository documentation and split user guidance into SDK, CLI, and networking guides. Historical runtime requirements, commands, issue references, and evidence remain preserved.
- ID-list filter options accept `number | readonly number[]` in `GetPlansOptions`, `GetTestsOptions`, `GetResultsOptions`, `GetResultsForRunOptions`, and `GetRunsOptions.createdBy`, including their deprecated `snake_case` aliases. A single ID and a `readonly` array now compile.
- The package root exports the types that a consumer with `declaration: true` must name: the 19 module classes (types only), `KnownResponse`, `RequestSpec`, `RequestBody`, and `RequestIntent`. Unannotated wrappers such as `export const projects = client.projects` no longer fail with TS2883 or TS2742. `TestWithDataResponseSchema` is also exported.
- `TestRailApiError` accepts an optional `ErrorOptions` fourth constructor argument. The client uses it to attach the original failure as `cause`.
- `projects.getProjectsPage()` now declares `GetProjectsOptions` instead of the identical deprecated alias `GetProjectsPageOptions`.
- `--format yaml` now double-quotes the string `<<`, binary, signed hexadecimal, and signed octal literals such as `0b11`, `+0x1F`, and `+0o17`, strings that start with a date such as `2026-01-01`, sexagesimal numbers such as `1:30`, underscore digit groups such as `1_000`, and `=`. It escapes U+2028 and U+2029. YAML 1.1 parsers read the bare forms as a merge key, a value key, a number, or a timestamp. Parsed values do not change under YAML 1.2.
- `package.json` declares `"sideEffects": ["./dist/cli.js"]`, exports `./package.json`, and lists the `cli`, `zod`, `test-management`, and `esm` keywords.
- The TestRail 10.7.0 compatibility audit has a new section, "Known gaps against TestRail 10.8-10.10". It lists nine missing operations, the 500-item page size, cursor pagination, new list filters, and new response fields. On TestRail 10.10, `users.getUsers()` can return only the first 250 users. This behavior is not verified on a live server.
- The SDK guide and the agent instructions now list `TestRailLicenseError`. The README links the runnable examples and a new documentation index (`docs/README.md`).

### Fixed

- A connection failure while the client reads a successful response body now throws `TestRailApiError` with `status: 0`, `statusText: 'Network error: <reason>'`, and the original error as `cause` (a copy for a custom `fetch`, as described below). Previously, a reset after the response headers escaped as a raw `TypeError: terminated`. The client does not retry this failure. An error response whose body cannot be read keeps its HTTP status and retry policy.
- Every write attempt sent to TestRail now clears the GET cache, whatever its outcome. Previously, a write that failed with a 5xx status, a network error, a timeout, or a blocked redirect left the cache intact. A server-state check after an uncertain write could then read cached pre-write data. Writes rejected before dispatch (local rate limit, DNS failure) leave the cache intact.
- An aggregate deadline that expires during a page-body read now always throws `TestRailPaginationError` with `reason: 'max_duration'`. Previously, it sometimes surfaced as `TestRailApiError(0, 'Body read timeout')`.
- Callers that join an in-flight GET each receive their own copy of the result. Previously, they shared one object with the first caller.
- Network errors keep their reason. Node reports most connection and TLS failures as `fetch failed`; the original error is now the `cause` of the thrown `TestRailApiError`. For a custom `fetch`, `cause` (for a failed request or a failed response body) is a copy of only `name`, `message`, `code`, `errno`, and `syscall`, with nested causes and `AggregateError` members copied the same way, because adapter errors can carry the request headers, including `Authorization`.
- `labels.addLabel()` and `labels.updateLabel()` return the flat label when TestRail wraps the response as `{ label: {...} }` and a label field does not match the schema. Previously, they returned the wrapper, and `label.id` was `undefined` after a successful write.
- `plans.getPlans()`, `tests.getTests()`, `results.getResults()`, and `results.getResultsForRun()` accept one ID for `createdBy`, `milestoneId`, `statusId`, and `labelId`. A scalar previously threw a raw `TypeError`. An ID filter that is not a number or an array now throws `TestRailValidationError` on every list method.
- IDs above `Number.MAX_SAFE_INTEGER` are rejected. The SDK throws `TestRailValidationError` for numeric IDs, numeric attachment IDs, and the pagination `offset`. The CLI rejects them in path parameters, ID-list filters, numeric filters, and attachment IDs. Previously, `1e21` reached the URL as `delete_run/1e+21`, and `run delete 9007199254740993 --yes` addressed run 9007199254740992.
- Timestamp filters (`createdAfter`, `createdBefore`, `updatedAfter`, `updatedBefore`, and their deprecated aliases) must be non-negative integers. `NaN`, `Infinity`, negative, and fractional values throw `TestRailValidationError`. A `null` timestamp or ID-list filter from an untyped caller is treated as not supplied. 9.0.0 sent it as the text `null`.
- `results.editResult()` and `EditResultPayloadSchema` reject a payload whose fields are all `undefined`. The client previously sent an empty body.
- CLI: piped stdin is no longer truncated. A JSON body or `--api-key-stdin` key that arrived late, or a body larger than one pipe buffer, was cut short and reported as `Invalid JSON` or an empty key. The CLI now reads until the producer closes the pipe, for at most 30 seconds, then fails with `stdin read timed out`. If stdin might stay open (some CI runners, `docker run -i`), pass `--data` or `--data-file`, or redirect `</dev/null`. Ctrl-C and `SIGTERM` take effect when the wait ends. An oversized body now reports the 1 MiB limit.
- CLI: `run watch --once` exits 1 with the API error when its poll fails with a network error, 429, or 5xx. Previously, it retried and never exited. `run watch` status lines on stderr now end with a newline.
- CLI: `dataset update` without a body no longer fails on empty piped stdin. Empty piped stdin (for example `</dev/null`) now sends the empty update, as a terminal already did.
- CLI: a reader that closes stdout or stderr early (`testrail case list --all 2>&1 | head`) no longer causes an unhandled `EPIPE` stack trace, and a recorded exit code is kept.
- CLI: `--format table` no longer fails with `Maximum call stack size exceeded` above approximately 124,000 rows. `--format table` and `--format csv` now render a response field named `__proto__`; table output previously failed with a `TypeError` after the request completed.
- CLI `--help` and the skill now state that `--quiet` also suppresses error messages.
- Skill Recipe 47: the CI delete guard reads `preview.affected_tests` and stops when the count is missing or above the limit. The earlier sample read a key that the CLI does not emit and continued to the delete.
- Skill Recipe 44: the bulk-update pattern selects cases by `priority_id`. The earlier filter used `assigned_to_id`, which cases do not have, and selected every case in the suite.
- Skill Recipes 35, 48, 50, and 53: removed `attachment add-to-test`, which is not a CLI action; `section move` uses `after_id`; shared-step examples use the real field names; `result add-bulk-by-test` sends `{"results": [...]}`.
- Skill sample outputs, the skill SDK reference snippets, and the skill error list now match the schemas and the real CLI output.
- README links to sections that moved to the guides, including the 9.0.0 proxy and DNS resolver migration links, now reach the current guide. The networking guide no longer describes resolver input for IP-literal hosts; a custom `dnsLookup` receives hostnames only.

### Security

- Removed the temporary picomatch audit exception. GitHub [withdrew GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) on 2026-11-18 because it was not a security issue.
- Production and full dependency audits reported zero vulnerabilities during release preparation on 2026-11-21.
- `--format json` (the default) now writes DEL and C1 control characters (U+007F–U+009F) from server strings as `\uXXXX` escapes. Previously, they reached the terminal raw. The output remains valid JSON and parses to the same value.
- `--format yaml`, `--diagnostic-file` redaction, and the credential email check no longer use regular expressions with quadratic time. One long server string, or a long `email` value, could block the process for many seconds. Accepted inputs and rendered output do not change.
- `uninstall-skill` refuses to remove files when the `testrail-cli` skill directory is a symlink or not a directory, as `install-skill` already does. Previously, it deleted files inside the link target and exited 0.
- `install-skill` and `uninstall-skill` remove terminal control characters from the path in success messages. `install-skill --print-path` still prints the path unchanged.
- `util.inspect()` and `console.log()` of a client, a module, or a `withTimeout` view no longer print the Basic credential. `destroy()` still overwrites it.
- `lockfile-lint` now also checks that each lockfile entry resolves to its own package and has an integrity hash.

### Internal

- Tests no longer use the real DNS resolver. New tests cover the SSRF check of every DNS answer, retries after `destroy()`, the retry backoff schedule, cache copy-on-read, and diagnostic redaction. Branch coverage is 98.94%.
- Removed unreachable code: the `btoa` fallback in `base64Encode`, unused configuration-message arms, `serializeIdList`, the lenient `optInt` parser, 28 duplicate response type aliases, and unreachable output guards.
- Removed codemap exclude patterns and tool options that had no effect.
- Corrected contributor documentation: `maxCacheSize: 0` semantics, the endpoint procedure, the CLAUDE.md file map, document ownership, the `./cli` subpath description, and backlog statuses. `SECURITY.md` lists 10.x as the supported line, and the release runbook names that step.

## [9.0.0] — 2026-10-04 — pinned connections, comment-only results, and a split skill

This major release changes default transport and DNS behavior, forced download targets, and exported add-result payload types and schemas. Default connections now pin to validated DNS answers and connect directly. Deployments that use a global proxy or custom agent must follow the migration steps below. Other changes include comment-only results, resource-scoped help, bounded DNS resolution, and a split skill with on-demand reference files.

This release includes #295–#307 and #309, plus the documentation and help fixes in the release PR (#308).

### Changed — BREAKING

- **Default connections no longer inherit global proxy or agent settings.**
  The per-request DNS-pinned dispatcher connects directly. It bypasses Undici `setGlobalDispatcher()` settings (including `ProxyAgent`, `EnvHttpProxyAgent`, and custom CA settings), `NODE_USE_ENV_PROXY=1`, and Node HTTP/HTTPS global-agent settings. Set `NODE_EXTRA_CA_CERTS` before process startup to add certificate authorities for direct connections. Required proxies need an explicitly injected transport and proxy-side destination checks. Replacing the dispatcher removes the client's connection pinning. See the [proxy migration](README.md#proxies-and-custom-certificate-authorities). Do not disable the private-host guard as a proxy migration. (#309)
- **Custom DNS answers require a matching numeric family.** The client now rejects `dnsLookup` answers that have a missing `family`, `family: 0`, a non-IP address, or a family that does not match the IP literal. Return `{ address, family: 4 }` for IPv4 and `{ address, family: 6 }` for IPv6. Calling `dns.lookup(hostname, { all: true })` already returns the valid shape. A valid public address no longer makes an incomplete answer valid. See [resolver migration](README.md#custom-dns-resolvers). (#309)
- **Forced download destinations must be regular files.** Attachment and BDD `--out <path> --force` commands now reject device files (such as `/dev/null`), symlinks, and FIFOs before truncation. To discard a payload, run `testrail attachment get <id> --out - > /dev/null`. The CLI still writes the acknowledgement to stderr. The same stdout pattern applies to `bdd get`. (#309)
- **A result no longer needs a `status_id`, and instead requires at least one of `status_id`, `comment`, or `assignedto_id`.** TestRail's [Results](https://support.testrail.com/hc/en-us/articles/7077819312404-Results) reference resolves the 6.0.0 known gap. In TestRail, `add_result` adds a test result, comment, or test assignment. Both `add_results` and `add_results_for_cases` require at least one of the status, comment, or assignee fields for each result. The `add_result_for_case` endpoint takes the same fields as `add_result`. `AddResultPayloadSchema`, `AddResultForCasePayloadSchema`, and `AddResultForTestPayloadSchema` (and the `results` items of `AddResultsForCasesPayloadSchema` and `AddResultsPayloadSchema`) now make `status_id` optional. They reject a result that omits all three fields with the error `At least one of status_id, comment or assignedto_id is required` (bulk issues include the entry's `results.<index>` path). Consequently, `testrail result add`, `add-by-test`, `add-bulk`, and `add-bulk-by-test` accept comment-only and assignee-only bodies. All previously accepted inputs remain valid. This change is breaking for typed and schema-deriving callers:
    - `AddResultPayload`, `AddResultForCasePayload`, and `AddResultForTestPayload` make `status_id` optional (`number | undefined`). This change does not affect code that builds payloads. Code that reads `payload.status_id` as a `number` must now handle `undefined`.
    - The three schemas now include a refinement. Under Zod 4, `.pick()`, `.omit()`, `.partial()`, and `.merge()` throw an error on a refined object schema (as they already did for `EditResultPayloadSchema`). `.extend()` preserves the rule when it adds new keys, but throws an error when it redeclares an existing key such as `status_id` or `comment`. `.safeExtend()` preserves the rule in both cases. `z.toJSONSchema()` omits the refinement.
    - As before, the SDK methods forward payloads unchanged. Only the CLI `--data` parser enforces this schema rule at runtime, so a typed `{}` now compiles and reaches TestRail through the SDK.

### Added

- **`testrail <resource> --help` prints only that resource's actions.** Previously, `--help` printed all 134 commands regardless of the resource name. Passing a known resource before `--help` (`testrail case --help` or `testrail case get --help`) now limits the output to that resource. Passing an unknown resource name falls back to the full listing, which now includes a resource index. The `attachment` and `bdd` help outputs retain their file-I/O actions. (#299)

### Changed

- **The bundled skill has a short main file and on-demand reference files.** Previously, `skill/SKILL.md` contained every command, option, and recipe (4,179 lines and 162 KB) and loaded completely on every activation. The main file now has fewer than 500 lines. It covers skill use, authentication, body input, destructive gates, output, pagination, errors, limits, and SDK fallback. It indexes reference files under `skill/reference/` for on-demand reading: `commands.md` (command table and option reference), `recipes.md` (numbered recipes), `typescript-api.md` (SDK fallback), and `payload-schemas.yaml`. The installed references are self-contained, and repository development rules remain in the repository. A skill installed by an earlier version keeps its old single-file content until you reinstall it. Run `npx testrail install-skill --force` (add `--global` if installed globally, because the existing `SKILL.md` blocks a default install). Tools that read `skill/SKILL.md` directly from the package must follow its `./reference/*` links for the command table and recipes. (#304)

### Fixed

- The pinned transport now supports both legacy Node 24 and modern Node 26 native fetch handler contracts, including response backpressure and cancellation. Reordered or duplicate DNS answers reuse the same approved socket pool. Connection lookup preserves resolver order and honors the requested IP family. (#309)
- Concurrent timeout views no longer inherit another caller's header or body deadline during in-flight request coalescing. Completed cached responses remain shared. (#309)
- The client now drains fragmented response bodies iteratively without keeping one pending promise chain per chunk. (#309)
- Enriched test reads now normalize nullish result and attachment collections even when unrelated entity fields trigger advisory schema warnings. (#309)
- Early-rejected multipart uploads now require transport confirmation before closing owned streams normally. The pinned dispatcher and native request diagnostics detect when transmission stops. This prevents unhandled encoder errors and hung promises while waiting for source cancellation. On HTTP/2, cleanup stops only the upload stream and preserves the shared session. Unknown custom transports keep error-based cleanup so an ignored abort cannot turn an incomplete upload into a valid truncated file. (#309)
- Multipart transport observation now enters an async context even without `trackOperation`. Processes that neither track operations nor upload files still avoid process-wide context-propagation overhead. (#309)
- Skill installation now protects all bundled files from unforced overwrites, stages the complete directory tree, and restores the previous installation on failure. (#309)
- Skill guidance now clearly distinguishes CLI runtime payload validation from SDK compile-time types and shows how to validate dynamic input explicitly. (#309)
- **Aggregate pagination deadlines retain `max_duration` when a timer fires before the wall clock reaches its deadline.** The transport records whether the aggregate owns an attempt's timeout, including when deadlines are equal. This ensures that DNS and fetch aborts throw `TestRailPaginationError` instead of a plain 408 error. A shorter request timeout keeps its existing error, and the client tracks late DNS work until it settles. (#307)
- **`user add` and `user update` accept every address that `user get-by-email` can look up.** Previously, `UserAddPayloadSchema` and `UserUpdatePayloadSchema` validated `email` with `z.string().email()`. That check rejected single-label and domain-literal addresses (`ada@corp`, `user@localhost`, `user@[192.168.1.1]`) that self-hosted, LDAP, AD, and SSO instances store and that `getUserByEmail()` has accepted since #236. All three paths now share `TESTRAIL_USER_EMAIL_PATTERN` in `src/constants.ts`, which requires one `@` with non-empty, whitespace-free local and domain parts. Every address that `z.string().email()` accepted remains valid, and the inferred types do not change. A rejected write address now reports `Invalid email format` instead of Zod's `Invalid email address`, and schema introspection sees a `regex` check instead of the `email` format.
- **`timeout` now bounds DNS resolution.** Previously, the per-attempt timer started only after `dns.lookup` resolved in the host guard. Because `getaddrinfo` has no built-in deadline, a resolver that dropped packets kept a request pending indefinitely and occupied one of libuv's four default threadpool slots. Now the timer starts first and races against the DNS lookup. **Compatibility:** a short `timeout` against a slow resolver can now fail with `TestRailApiError(408)` before the client sends any request. Node cannot cancel the lookup itself, so a `trackOperation()` handle's `settled` promise still waits for the lookup to finish. The `TestRailConfig.timeout` JSDoc in `dist/types.d.ts` and the `--timeout` help text now state that the timeout includes DNS resolution. (#296, #302, #303)
- **A custom `fetch` that rejects with a non-`Error` reason now throws `TestRailApiError`.** Because `TestRailConfig.fetch` is public, a custom implementation can reject with any value. Previously, a `null` or `undefined` reason caused the error handler to throw `TypeError` when it read `.name`. A string reason produced `Network error: undefined`. Neither path produced the expected `TestRailApiError`. The pipeline now normalizes rejection reasons once. (#296)
- **The `User-Agent` header is now a single product token: `testrail-api-client/<version>`.** Previously, the client built this header from the package description (`Type-safe ESM TestRail API client and CLI for Node.js/8.0.0`). Strict proxies and WAFs can alter or reject values with spaces, and `@` and `/` are not valid token characters under RFC 7230 §3.2.6. Update any server rules or log queries that matched the old `User-Agent` string. (#296)
- **The published `dist/` directory no longer references missing source maps.** Previously, the production build emitted source maps and a later step deleted them. This left a `//# sourceMappingURL=` comment in 332 `.js` and `.d.ts` files, causing editors and debuggers to look for missing files. Now the production build does not emit source maps, we removed the `clean:maps` script, and the package smoke test fails on any dangling source-map comment. (#297)
- **`testrail install-skill` now installs the skill's reference files alongside `SKILL.md`.** Previously, `SKILL.md` referenced `./reference/payload-schemas.yaml`, but the installer copied only `SKILL.md`. Now the installer copies the bundled `reference/` directory beside `SKILL.md` in a staged operation that rolls back on failure. The installer also refuses to write through a symlink at `reference/`. The `uninstall-skill` command removes only the bundled reference files, keeps any files you added, and refuses to follow a symlink at `reference/`. (#301, #309)

### Security

- Default fetch connections now use the exact DNS answers accepted by the private-host guard. They preserve the original hostname for `Host`, SNI, and TLS certificate checks. Malformed DNS answers fail closed. The default transport connects directly. Custom `fetch` or proxy implementations must honor the supplied dispatcher or enforce equivalent destination checks. (#309)
- Forced CLI downloads now validate the opened file descriptor before truncation so a replaced symlink cannot redirect writes. File input readers reject FIFOs without blocking when opening them. (#309)
- **The host guard blocks three additional non-routable IPv4 ranges:** `198.18.0.0/15` (RFC 2544 benchmarking), `224.0.0.0/4` (multicast), and `240.0.0.0/4` (reserved, including `255.255.255.255`). The guard blocks these ranges in IP-literal base URLs at construction and in every DNS answer before a fetch, including IPv4-mapped IPv6 forms. A TestRail host that resolves to one of these ranges now requires `allowPrivateHosts: true`. (#296)

### Internal

- Updated `brace-expansion` from 5.0.9 to 5.0.12 in the lockfile to fix three DoS advisories (GHSA-6j4f-fj2g-mc7p, GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7) that failed the `security-audit` check. Only the development toolchain (`eslint` → `minimatch`) uses this dependency, so the published package and its runtime dependency do not change. The lockfile's root `engines` field now also records `>=24`. (#306)
- CI now declares least-privilege `permissions` (`contents: read`). It cancels superseded runs per ref, except on `main`, and avoids duplicate jobs for pushed pull-request branches. Checkout uses `persist-credentials: false`. Package smoke tests use one OS matrix behind the `package-smoke` gate. (#298)
- Added `SECURITY.md` (private vulnerability reporting and scope) and `CONTRIBUTING.md` (required checks, generated files, layer-coverage rules, and response-schema policy). `CLAUDE.md` no longer duplicates values from `src/constants.ts` by hand. (#300)
- Added two type-checked examples. `examples/publish-ci-results.ts` performs one bulk `add_results_for_cases` write and closes the run after recording results. It avoids blind retries on indeterminate writes. `examples/bounded-pagination.ts` compares `get*()`, `get*Page()`, and `getAll*()`. It branches on `TestRailPaginationError.reason`. The README now notes that a cache hit deep-copies its entry and that `maxCacheSize` bounds the entry count rather than memory usage. (#304)
- Updated `docs/RELEASING.md` to document the `npm-publish` deployment approval step again. Because the environment requires a reviewer, the 8.0.0 Internal note stating that publishing runs unattended was incorrect. We kept the 8.0.0 entry as published, except that the `RequestSpec` bullet now also appears under its BREAKING section. The release guide also notes that the single reviewer may approve their own deployment as an intentional pause. (#295)
- `npm run verify` now explicitly builds the package and runs static checks, generated-document checks, coverage, and packed-package smoke tests without relying on lifecycle hooks. The build script uses the same portable Node entry point locally and in CI, with bounded removal retries for temporary Windows file locks. (#309)
- The installed skill uses portable metadata, self-contained references, and a body under 500 lines. CI tests Node 24 and 26 on Linux, Windows, and macOS. (#309)
- Updated the development toolchain: `vitest` and `@vitest/coverage-v8` `5.0.3`, `eslint` `10.12.0`, `@typescript-eslint/*` `8.71.0`, `@types/node` `26.6.4`, `fast-check` `4.10.2`, `prettier` `3.9.9`, and `tsx` `4.23.15`. The lockfile keeps `brace-expansion` `5.0.12`, and the runtime dependency remains Zod `4.6.5`. (#307)

## [8.0.0] — 2026-09-19 — Node 24, deep modules, and three user-visible fixes

This release is a major version bump because it raises the minimum supported Node.js version. Most of the release refactors internal modules, while users see the new runtime requirement and the three fixes below.

### Changed — BREAKING

- **Node 24 is now the minimum supported runtime.** `engines.node` changes from `^20.19.0 || ^22.13.0 || >=24` to `>=24`, and the packed-package smoke test matrix runs Node 24 on Linux, Windows, and macOS. Users on Node 20 or 22 must remain on 7.2.0 or upgrade Node.js. The shipped code does not branch on the Node version. This change updates the support contract, the CI matrix, and the `AsyncLocalStorage` overhead note. Node 24 uses `AsyncContextFrame` with approximately 1% overhead instead of the older `async_hooks` promise hook.
- **`RequestSpec` no longer includes `retry`, `bypassCache`, or `remainingTimeMs`.** We list this change here as well as under Internal for visibility during major-version upgrades. The package does not export `RequestSpec` by name, and `dist/index.d.ts` is byte-identical to 7.2.0. However, `TestRailClientCore.request<T>(spec)` is `public` and inherited by `TestRailClient`, so callers can reach the parameter type structurally. No documented API uses `RequestSpec` directly. See _Seven deep-module refactors_ under Internal for details.

### Fixed

- **Attachment uploads that supply a file descriptor no longer fail.** Previously, an upload built from `{ path, fd }` closed the caller's file descriptor immediately after `openAsBlob()`. Because a file-backed `Blob` reads lazily and re-opens `/dev/fd/<N>` on the first stream read, the descriptor was already closed and the upload failed with `DOMException: The blob could not be read`. Because the CLI always opens the file and passes its descriptor, every `testrail attachment add-to-*` command with `--file <path>` failed. The client now keeps the descriptor open until the transport consumes the request body and closes it during request cleanup, preserving `/dev/fd` TOCTOU protection.
- **`testrail run watch` now polls the server on every interval.** Previously, the CLI created its client with the GET cache enabled at the 5-minute default TTL, which is longer than most `--interval` values (5–600s). After the first poll, the client served every poll from the cached `get_run/{run_id}` entry, fixing the effective poll period at 300s. CLI action metadata now marks polling actions with `polls` and builds a non-caching client for them, while one-shot actions keep the cache.
- **A bounded `getAll*()` call now reports `max_duration` when its deadline expires.** `collectAllPages` passes a single absolute `deadlineAt` to each page request, and the request budget schedules `setTimeout` against that timestamp. Node timers can fire up to a millisecond before `Date.now()` reaches the target timestamp. The request budget then threw a raw `TestRailApiError(408)` although the aggregate wall-clock check still saw time remaining. Consequently, the raw 408 error escaped instead of `TestRailPaginationError` with `reason: 'max_duration'`. The aggregate now detects its own budget expiration directly instead of rechecking the wall clock.

### Internal

- Updated the sole runtime dependency to `zod` `^4.6.5`. Updated development dependencies to `vitest` and `@vitest/coverage-v8` `5.0.1`, `eslint` `10.10.0`, and `@typescript-eslint/*` `8.70.0`. Also updated `@types/node` to `26.6.1`, `fast-check` to `4.10.1`, and `prettier` to `3.9.8`. Vitest 5 requires Node >= 22.12, which the Node 24 requirement satisfies.
- Added `npm run published:check` to check the "Published to npm" list at the top of this file. It runs in `pretest`, CI, and the release workflow. The check verifies that the `package.json` version appears in the list and that every entry is valid semver, unique, and in ascending order.
- Removed the `prepublishOnly` script. Because the publish workflow runs `npm publish --ignore-scripts` and `.npmrc` sets `ignore-scripts=true`, that script never ran during a release. `docs/RELEASING.md` and `.github/workflows/publish.yml` enforce all release checks.
- Updated `docs/RELEASING.md` to remove the `npm-publish` environment approval step description when no required reviewers are configured, and documented how to check the environment status.
- **Seven deep-module refactors.** These refactors do not change the documented SDK or CLI surface. `dist/index.d.ts` is byte-identical to 7.2.0. Compile-time and structural checks replace manual conventions.

    One structural note applies: `TestRailClientCore.request<T>(spec)` is `public` and inherited by `TestRailClient`, so callers can reach its unexported `RequestSpec` parameter structurally. `RequestSpec` removed `retry`, `bypassCache`, and `remainingTimeMs` and added `intent`. Passing `retry` directly to `request()` in an object literal now causes an excess-property type error. The client ignores the property when a caller passes it through a variable.
    - _Derived retry policy._ `deriveRetryPolicy()` derives retry behavior from `body.kind`, `responseKind`, and `intent`. Multipart bodies never retry by design, and `intent` replaces `RequestSpec.retry` and `bypassCache`.
    - _Centralized multipart upload handling (`src/upload-source.ts`)._ One module now manages platform path mapping, `openAsBlob`, `FormData` construction, stream ownership, single descriptor cleanup, and single-use `build()`.
    - _Centralized request deadline budget (`src/request-budget.ts`)._ One module now manages per-call wall-clock deadlines, replacing 36 inline `deadlineAt` calculations and six separate 408 error constructions.
    - _Callable `runCli(runtime)` interface._ Process-level concerns now live only in `src/cli.ts`. The CLI test suite no longer re-imports modules or polls `process.exitCode`, reducing full test suite execution time from ~25s to ~8s.
    - _Unified diagnostic wrapper._ `withDiagnostics(request, deps, work)` now encapsulates the six-step CLI diagnostic lifecycle and removes three mutable flags.
    - _Centralized CLI output (`src/cli/output.ts`)._ `createOutput` requires explicit writers, `HandlerContext` makes all five writers required, and ESLint forbids `process.stdout`, `process.stderr`, and `process.argv` outside `src/cli.ts`. This check also fixed a bug where `run watch` read `--quiet` from `process.argv` instead of the `argv` passed to `runCli`.
    - _Explicit action arrays and derived pagination._ Named read/write arrays replace 29 `.slice(a, b)` calls on `ACTIONS`. One contract table keyed by `apiEndpoint` replaces `ActionSpec.pagination` and removes mapping gate E. A snapshot test verified that all 134 action entries remained identical.

- **Fixed three silent-drop paths in the mapping generator's parser.** Previously, the parser for gates C, C2-reverse, and D could return an incomplete or empty list without an error. The set-membership checks then passed incorrectly. All three paths now throw an error on unexpected AST structures.
- Recorded ARCH #4 ("one runtime declaration per endpoint; gates D/E become type constraints") as unreachable in `docs/archive/BACKLOG-ARCHIVE.md` because the endpoint inventory requires manual curation.

## [7.2.0] — 2026-09-17 — operation settlement and independent report execution

### Added

- Added `client.trackOperation(callback)`, which returns independent `result` and `settled` promises. The `settled` promise tracks started and shared DNS lookups, fetch calls, response reads and cancellations, upload streams, and retries. Tracking continues after a timeout rejects the `result` promise.
- Exported the `OperationHandle<T>` type (`{ result: Promise<T>; settled: Promise<void> }`), which is the return type of `trackOperation`.
- Settlement tracking is opt-in and has zero overhead until its first call. Entering an `AsyncLocalStorage` enables context propagation across the process. On Node 20 and 22, this adds approximately 170% overhead to unrelated promises. Request paths enter `AsyncLocalStorage` only after the caller invokes `trackOperation`.

### Changed

- **Report execution methods no longer cache, coalesce, or retry transport failures.** `reports.runReport()` and `reports.runCrossProjectReport()` still use GET requests. They now bypass the cache and concurrent request sharing, so every call executes on the server. They also no longer retry 5xx or network errors, because the server may have already generated and emailed the report. They still retry 429 responses (honoring `Retry-After`) because the rate limiter rejects requests before execution. Callers that relied on deduplication will now send more requests to TestRail, and 5xx or network errors now surface immediately. Caching and retry behavior for all other methods is unchanged.

### Fixed

- Late fetch responses and unread error or redirect bodies now cancel cleanly. Multipart cleanup now tracks stream reads and cancellations while preserving native `FormData` encoding. When an in-flight upload aborts, the client errors the upload stream. This prevents the server from accepting a truncated file as complete.

### Internal

- Publication verification now waits up to five minutes for an accepted npm package upload to appear in registry metadata. It uses bounded online lookups without republishing. This prevents false release failures when npm takes longer than 27 seconds to index a new package. Identity checks and immediate content-mismatch failures are unchanged.
- The package smoke test matrix now runs on Node 22.13.0 and Node 24 across Linux, Windows, and macOS.

## [7.1.0] — 2026-09-10 — CLI diagnostics and safer workflows

### Added

- Added the opt-in CLI `--diagnostic-file <path>` flag. It writes bounded, redacted error details to a new private file. Request retries, default output, and exit codes remain unchanged. On Windows, the CLI rejects this flag before dispatch because Windows private ACLs are not supported yet.
- Added a tested case-field readiness example that polls uncached inventories with bounded attempts, deadlines, cancellation, and explicit field verification before dependent writes.

### Security

- **SSRF guard: IPv4-mapped IPv6 literals no longer bypass private-host blocking.** Previously, a `baseUrl` such as `https://[::ffff:127.0.0.1]` or `https://[::ffff:169.254.169.254]` passed both the construction-time literal check and the per-request address check. The WHATWG URL parser rewrites the host into hexadecimal form (`[::ffff:7f00:1]`). The dotted-decimal check did not match this form. Node `fetch` connected directly to the underlying IPv4 address. Both checks now classify addresses using a shared `net.BlockList` that applies IPv4 rules to all IPv4-mapped IPv6 formats. Public mapped addresses (such as `::ffff:8.8.8.8`) remain allowed.
- The host guard now treats the carrier-grade NAT range `100.64.0.0/10` (RFC 6598) as private alongside the RFC 1918 ranges.
- The host guard now blocks the RFC 8215 local-use NAT64 prefix `64:ff9b:1::/48` alongside the well-known `64:ff9b::/96` prefix for both literal URLs and DNS answers.

### Fixed

- The CLI now cleans up diagnostic file reservations on normal process exit (including `SIGINT` and `SIGTERM`), and `--dry-run` ignores diagnostic file destinations. Empty validation strings no longer count as diagnostic details, and failures before handler execution report `not_dispatched`.
- Diagnostic paths now resolve symlinks and `..` segments, and the CLI rejects conflicting download paths before dispatch so cleanup cannot delete a downloaded file.
- Case-field skill recipes now use valid creation payloads, nested configuration scopes, returned `system_name` properties, and valid Dropdown and Multiselect value formats. The recipes also document TestRail's comma-label limitation.
- **CLI: a string flag no longer consumes the following flag as its value.** Standard `parseArgs` treats any token after a string flag as that flag's value, even if the token is another flag. Previously, running `testrail attachment add-to-case 1 --file r.bin --filename --dry-run` set `filename` to `'--dry-run'` and ignored `--dry-run`, causing the upload to execute instead of previewing. The same behavior could silently disable `--strict-responses`, reduce `--all` to a single page, or drop `--force`. Now the CLI exits with code 1 and prints `--filename requires a value, but the next argument was the flag --dry-run.`. The parser checks consumed values in raw `argv` tokens. It rejects values that start with `--` and contain at least one more character. It catches `--filename --dry-run=true`, typos such as `--filter --dryrun`, and repeated flags such as `--filter --dry-run --filter abc`. This change does not affect non-flag values such as `-5`, the `-` stdio sentinel, a bare `--`, file paths, or JSON bodies. **Compatibility:** the CLI now rejects any space-separated value starting with `--` for a string flag. Pass such values inline instead (`--filter=<value>`). In addition, `testrail --base-url --help` now exits with code 1 instead of printing help because `--base-url` consumes `--help`.

### Changed

- Construction-time private-host rejection now checks only IP literals and `localhost`. Previously, a prefix regular expression synchronously rejected valid public hostnames that started with numeric segments (such as `127.0.0.1.nip.io` or `10.example.test`). The client now allows these hostnames at construction and checks their resolved IP addresses via DNS before every request.

### Internal

- The publish workflow now retries package-content verification with a fresh cache while a newly published npm tarball propagates. If a downloaded tarball's contents do not match, verification still fails immediately.
- Updated the bundled skill, generated API documentation, architecture documentation, and release guide.

## [7.0.0] — 2026-09-02 — TestRail 10.7 API compatibility and stricter validation

### Added — TestRail 10.7.0 API compatibility

- Added TestRail API endpoints and parameters introduced through TestRail 10.7.0. These include `edit_result`, dynamic-filter discovery and payloads, and run/plan reference filters (10.4). They also include project BDD listing and lightweight case-title lookup (10.5), `get_version` (10.6), and repeated `refs[]` query parameters for case and BDD lists (10.7).
- Added typed SDK methods and CLI actions for `case titles`, `bdd list`, `bdd update`, `result edit`, `version get`, and `dynamic-filter-field list`. Scalar `refs` values remain supported, and the client serializes arrays as repeated `refs[]` parameters where TestRail 10.7 requires them.
- Added full TestRail 10.5 label management (`add`, `update`, `delete`, and `delete-bulk`). Case add, update, and bulk-update payloads now type and validate mixed label IDs and titles directly.
- Added Enterprise cross-project report discovery and execution (`report list-cross-project` and `report run-cross-project`).
- Expanded case, run, and plan list filters with array-valued ID filters, labels, references, and `include_plan_runs` where supported. Test lists now also support the `label_id` filter.
- Added the `with_data=0|1` parameter for `get_test` in the SDK and CLI. The client normalizes the enriched response to one test object with `results` and `attachments` arrays.
- Unified CLI help generation and the bundled skill around one typed option registry so option drift fails type-checking or generation checks.
- Updated run, plan, and plan-entry write schemas with `start_on`, `due_on`, and `refs`. Result edits now validate flat `custom_*` fields and reject empty updates. Dynamic-filter payloads now require `mode` and `filters`.

### Changed — BREAKING

- The CLI now rejects known flags that do not apply to the selected action before authentication instead of ignoring them. This includes rejecting `run close --soft` (without `--dry-run`) because TestRail cannot preview closing a run.
- `TestRailConfigSchema` now validates every `TestRailConfig` field, matching the constructor's numeric bounds and function checks. The `TestRailClient` constructor now immediately rejects invalid cache, boolean, DNS-lookup, and process-handler settings. Documented zero-valued sentinels remain valid. Use `PaginationRequestSchema` for strict pagination validation. `PaginationSchema` remains permissive.
- `UpdateLabelPayload` and `label update` now require `project_id` to match TestRail's `update_label` endpoint. Update `{ "title": "New" }` payloads to `{ "project_id": 123, "title": "New" }`.
- `UpdatePlanEntryPayload` removes `suite_id`, `config_ids`, and `runs` because TestRail's `update_plan_entry` endpoint does not support them. Remove these keys from callers instead of relying on passthrough behavior.
- `UsersModule.getUsers()` now accepts an optional `projectId` (`getUsers(projectId?)`) and removes unsupported pagination parameters. The CLI uses `user list --project-id` and `--user-email`, and `user list --limit` or `--offset` now exits with an error.
- `UpdatePlanPayload` removes the undocumented `assignedto_id` field, and `AddPlanEntryPayload.suite_id` is now optional because TestRail requires it only for multi-suite and baseline projects.
- The `bdd add --dry-run` output now reports `sectionId` instead of `caseId`. Update any scripts that read that JSON field.

### Fixed

- Preserved the deprecated `GetRunsOptions.refsFilter` option by emitting both `refs` and `refs_filter` (an explicit `refs` value takes precedence).
- Renamed the `addBdd` parameter and CLI documentation from `caseId` to `sectionId` to match TestRail's `add_bdd/{section_id}` endpoint.
- Aligned result-list filters with each endpoint: all three result list endpoints support status and defect filters, while only `get_results_for_run` accepts creator and creation-date filters.
- Added missing shared-step filters and the `keep_in_cases` option on `delete_shared_step`. Added project completion and milestone-started filters, dataset variable maps, project access assignments, and conditional case-field configuration schemas.
- Removed the unused `--case-id` CLI flag, undocumented user password and language fields, and the inaccurate TestRail 7.5 version note on `add_cases`.

### Internal

- Migrated the build and primary type-check to native TypeScript 7.0.2 while keeping TypeScript 6 for Compiler API generators and typed ESLint rules. Package smoke tests verify the published type declarations against both TypeScript 6 and 7.
- Updated direct dependencies: Zod 4.5.4, `@types/node` 26.4.1, `typescript-eslint` 8.69.0, ESLint 10.9.1, Vitest and `@vitest/coverage-v8` 4.1.11, `lockfile-lint` 5.0.1, and `tsx` 4.23.13. Removed the obsolete `js-yaml` audit exception.

## [6.0.0] — 2026-08-11 — advisory validation, safe pagination, and response coverage

Entity-field response validation is now advisory by default. When response entity fields do not match their Zod schema, the client returns the raw data. It passes mismatch details to the optional `onSchemaMismatch` callback without throwing an error. Even with a non-throwing hook, structural list and page checks still fail closed. Default list methods throw `TestRailApiError`, explicit page and all-page methods throw `TestRailPaginationError`, and the non-idempotent `addCases` and `updateCases` bulk writes throw an indeterminate-outcome `TestRailApiError`. These checks prevent an unrecognized response from appearing as zero rows or zero updated cases. If a custom `onSchemaMismatch` hook throws an error, that error propagates before the structural decoders run.

We made this change because previous schema updates consistently widened schemas to accept valid TestRail responses rather than rejecting invalid ones. Strict response validation turned minor API response differences into client failures. One unexpected field in one row could cause an entire list page to fail.

### Changed — BREAKING

- **`parse()` no longer throws on an entity-field response mismatch.** Code that caught `TestRailValidationError` on read calls will no longer catch it by default. To restore the strict 5.x behavior, pass `onSchemaMismatch: ({ error }) => { throw handleZodError(error) }`. The exported `handleZodError` helper constructs the exact `TestRailValidationError` that 5.x threw, whereas throwing `error` directly throws a `ZodError`.
- **`TestRailClientCore.parse()` now requires a third argument** with `{ method, endpoint }`. This affects only callers that invoke `parse()` directly.
- **`onSchemaMismatch` must be synchronous.** If the callback returns a promise, the client consumes its rejection and immediately throws `TestRailValidationError` without returning or caching the response. Use a synchronous `throw handleZodError(error)` callback for strict mode.
- **The client no longer caches schema-invalid GET responses.** The client returns the raw response without caching it. The next request fetches new data and calls `onSchemaMismatch` again if the mismatch remains.
- **The CLI reports entity-field drift safely and supports strict mode.** By default, the CLI prints up to 10 unique warnings and a summary of suppressed warnings. Warnings include only the HTTP method, CLI resource and action, normalized Zod issue codes, and masked path shapes. Warnings never include endpoint URLs, field names, issue messages, or raw response data. Passing `--strict-responses` or setting `TESTRAIL_STRICT_RESPONSES=1` exits with code 1 on the first mismatch. Writes throw `TestRailApiError` with an indeterminate outcome, so CI does not blindly retry. `TESTRAIL_STRICT_RESPONSES` accepts only `1`, `0`, an empty string, or unset. Passing `--quiet` suppresses advisory warnings.
- **Malformed outer responses on default list reads now throw `TestRailApiError` in advisory mode.** An unrecognized outer response shape is a protocol error. Default list reads therefore throw `TestRailApiError`, with the raw body on `.response`, instead of `TestRailValidationError`. Explicit page and all-page methods still throw `TestRailPaginationError`.
- **`tests.updateTests()` now returns `UpdateTestsResponse` instead of `Test[]`.** TestRail's `update_tests` endpoint returns `{ test_ids: [1, 2, 3], labels: [{ id, title }] }` rather than an array of tests. Previously, the schema looked for a `tests` key and resolved every call to `[]`. The package now exports `UpdateTestsResponse` and `UpdateTestsResponseSchema`, and `testrail test update-labels-bulk` outputs this acknowledgement object.
- **Widened response types** to match real TestRail responses:
    - `Result.status_id`: `number` → `number | null`. TestRail returns `null` for comment-only, defect-only, or assignment-only results.
    - `CaseStatus.abbreviation`: `string` → `string | null | undefined`, and `CaseStatus.is_untested`: `boolean` → `boolean | null | undefined`. Built-in Approved and Draft statuses can have `abbreviation: null`, and `get_case_statuses` omits `is_untested`.
    - `Label.created_by` and `LabelEmbedded.created_by`: `number` → `number | string | null | undefined`.
    - `Milestone.is_started`: `boolean | undefined` → `boolean | null | undefined`.
    - `CaseFieldConfig.context.project_ids` and `ResultFieldConfig.context.project_ids`: `number[]` → `number[] | string | null | undefined`. Removed the `.transform()` that converted `null` or `""` to `[]` so raw advisory responses match the static TypeScript type. Narrow this field before indexing.
    - All `SoftDeletePreview` counters: `number | undefined` → `number | null | undefined`. Narrow these fields before arithmetic.
    - `HistoryChange.options`: `unknown[] | null | undefined` → `Record<string, unknown> | unknown[] | null | undefined`. Check `Array.isArray()` before calling array methods.
    - `CaseFieldConfig.options.items` and `ResultFieldConfig.options.items`: `string | null | undefined` → `string | unknown[] | null | undefined`. Narrow this field before calling string or array methods.
- **Public response types now derive directly from declared schema keys.** Runtime schemas still use `.passthrough()`, but the inferred TypeScript types no longer include `[key: string]: unknown`.
- **Flat custom-field types are now restricted to `Case`, `Test`, and `Result`.** Only those three types include a `[key: `custom_${string}`]: unknown` index signature. We marked their nested `custom_fields` property as `@deprecated`.

### Added

- **Added `TestRailConfig.onSchemaMismatch` and exported `SchemaMismatch`.** The client calls this hook with `{ method, endpoint, error, data }` when a response fails schema validation.
- **Added bounded pagination methods on 23 list endpoints.** Existing `get*()` methods still return `Entity[]` from a single response. Each paginated endpoint now also provides `get*Page(): Promise<Page<Entity>>` (preserving `offset`, `limit`, `size`, and `_links`) and `getAll*(): Promise<Entity[]>` (fetching all pages within safety bounds). Coverage includes cases, case history, projects, suites, sections, plans, runs, tests, and milestones. It also includes all three result lists, labels, shared steps, shared-step history, and case/run/plan attachments. Datasets, variables, roles, groups, and case statuses complete the set.
- **Added safe continuation handling.** The client uses `_links.next` only to detect whether another page exists. It never follows the URL's host or path. Instead, it parses the `offset` and optional `limit` parameters and rebuilds the request against the known endpoint with the original filters. `getAll*()` bypasses the GET cache and request coalescing, and returns no partial results on error. `get*Page()` validates the pagination envelope strictly and uses a separate cache namespace.
- **Added pagination bounds and `TestRailPaginationError`.** Default `getAll*()` limits are page size 250, offset 0, 100 pages, 25,000 items, 5 minutes, and 100 MiB. Hard ceilings are 250 items per page, 5 minutes, and 1 GiB. `TestRailPaginationError` extends `TestRailValidationError` and exposes `reason` (`max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, or `non_progress`), `pagesFetched`, and `itemsFetched`.
- **Added CLI pagination flags.** List commands return one page of items by default. `--page` outputs the page envelope, and `--all` fetches all pages using `--page-size`, `--start-offset`, `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes`.
- **Added response fields and recursive milestones.** Added `Test.refs_data`, `Test.case_title`, `Result.case_title`, `Result.case_refs`, `Plan.is_archived`, `Plan.archived_on`, `CaseField.is_indexed`, `AddCaseFieldPayload.is_indexed`, and `boolean | 0 | 1 | null | undefined` support for `CaseField.is_system` and `ResultField.is_system`. `Milestone.milestones` now uses a recursive schema instead of `unknown[]`.
- **Added bare-array support to all wrapper-documented list reads.** All 25 wrapper-documented list reads now use `listOf()` and `unwrapList()` from `src/modules/list.ts`. They accept paginated envelope objects and bare JSON arrays. `getSuites`, `addCases`, and `updateCases` also accept both forms.
- **Prevented list reads and bulk case writes from silently returning empty arrays on malformed responses.** `unwrapList()` verifies that the expected wrapper key exists and holds an array (or `null` for an empty page). `addCases()` and `updateCases()` throw an indeterminate-outcome `TestRailApiError` if the response matches neither the wrapper object nor a bare array.

### Fixed

- **`SoftDeletePreview` counters now accept `null`.** All seven counter fields now use `.nullish()` instead of `.optional()`. This schema was added after the optional-to-nullish audit in #130, which therefore did not cover it.
- **`HistoryChangeSchema.options` now accepts an object as well as an array.** TestRail returns an `{ is_required, default_value, items }` object for changes to dropdown custom fields.
- **`FieldConfigOptionsSchema.items` now accepts an array as well as a string.** TestRail returns an array of `{ name, machine_name }` objects for the built-in `quality_rating` field (type 16).
- **Enterprise-license 403 responses consistently throw `TestRailLicenseError`.** The error check now matches both `"Not an Enterprise license/subscription."` and `"(Requires Enterprise license...)"` while still ignoring unrelated 403 messages.
- **`getHistoryForCase()` now accepts TestRail's outer-array wrapper `[{ offset, limit, size, _links, history: [...] }]`** in addition to the standard pagination object and bare array.
- **The CLI no longer truncates piped output on Node 20 and 22.** The CLI now sets `process.exitCode` and allows stdout and stderr to drain instead of calling `process.exit()` immediately.

### Internal

- Added two schema convention tests in `tests/schema-conventions.test.ts`: response schemas cannot use `.optional()`, and response schemas cannot use format or length validators.
- Updated development dependencies while keeping TypeScript at `~6.0.3` for Compiler API compatibility.
- **Hardened the release workflow.** Publishing now requires a `release/<version>` tag on `main` matching the workflow commit SHA, `package.json`, and lockfiles. Verification runs tests, drift checks, security audits, and package smoke tests before passing a digest-verified artifact to the npm Trusted Publishing job.
- Expanded CI package smoke tests to Node 20.19, 22.13, and 24 on Linux, and Node 24 on Windows. Added formatting, lockfile, `AGENTS.md`, and pinned `audit-ci` checks.

### Known gaps

- `AddResultPayloadSchema.status_id` remains required in 6.0.0, so the client can read comment-only results but cannot create them through the CLI schema yet (resolved in 9.0.0).
- Other low-risk strict response fields remain unchanged until wire evidence requires widening them. Under advisory validation, mismatches log a warning instead of throwing an error.

## [5.3.0] — 2026-07-16 — configurable request timeout (per-request + CLI)

Previously, callers could set the request timeout only once when constructing `TestRailClient` (`config.timeout`). This release adds per-request and CLI timeout overrides while keeping the 30-second default and full backward compatibility.

### Added

- **Added `client.withTimeout(ms)` in the SDK.** This method returns a lightweight client view. All calls through the view use `ms` as their request timeout, for example, `client.withTimeout(120_000).cases.getCases(1)`. The view shares the root client's cache, rate limiter, credentials, and cleanup timer by reference. When `bodyTimeout` uses its default value, the body-read deadline (SEC #21) also scales to `ms`. You can chain views (the outermost view takes precedence), and `withTimeout(ms)` validates `ms` using the same rule as `config.timeout` (positive integer up to 5 minutes). Calling `destroy()` or `clearCache()` on a view acts on the shared root client.
- **Added `--timeout <ms>` and `TESTRAIL_TIMEOUT` in the CLI.** These options override the request timeout in milliseconds (`--timeout` takes precedence over `TESTRAIL_TIMEOUT`, which takes precedence over the 30s default). Invalid values exit with code 1 and identify the source in the error message.

### Internal

- Extracted timeout validation into `validateTimeout()` in `src/validation.ts` so `config.timeout`, `withTimeout()`, and `request()` validate timeout values identically.

## [5.2.1] — 2026-07-14 — live-API schema fixes + skill-packaging hardening

This patch release ships two sets of improvements:

1. **Live-API schema fixes (#248)** repair six client methods that failed validation on real TestRail Cloud responses in `5.2.0`.
2. **Skill-packaging and coverage-gate checks (#249)** synchronize the bundled skill version with `package.json`. They test installation with the real `skill/SKILL.md` file. New Gate D verifies that every SDK method has a CLI action.

All changes are backward-compatible.

### Fixed

We audited the client against a live TestRail Cloud instance and added regression fixtures in `tests/live-audit-regression.test.ts` (see `docs/schema-audit-2026-06-22.md`). This release fixes six endpoints that failed on live data in `5.2.0`:

- **`get_users`, `get_user`, and `get_current_user` — `mfa_required`.** TestRail returns `0` or `1` instead of a boolean. The schema now accepts `boolean | number`.
- **`get_attachments_for_case` — `data_id`.** TestRail returns a number (such as `1000006328`) instead of a string. The schema now accepts `number | string` and adds `cassandra_file_id` and `id`.
- **All five `getAttachmentsFor*` list methods — bare-array response.** TestRail can return a bare JSON array instead of `{ attachments: [...] }`. All five methods now accept both formats.
- **`get_case_fields` and `get_result_fields` — `default_value`.** TestRail omits `default_value` on some field configurations (such as step-results and BDD-scenario fields). `FieldConfigOptionsSchema` now marks `default_value` as `.nullish()`.
- **`get_shared_step_history` — `id`, `user_id`, and wrapper.** TestRail Cloud returns numbers for `id` and `user_id` and can return a bare array instead of `{ step_history: [...] }`. The schema now accepts `number | string` for both IDs and accepts both response shapes.
- **`update_group` — `group_id`.** TestRail requires `group_id` in the request body as well as the URL path. `updateGroup` now includes `group_id` in the request body.

We added optional `i18n_custom_id` types on `Status`, `CaseField`, `ResultField`, `CaseType`, and `Template`. We also typed `RoleSchema.is_project_admin`, `PlanEntrySchema.dynamic_filters`, and step-field options `has_expected`, `has_actual`, `has_additional`, and `has_reference`.

### Added

- **Automated skill version synchronization (`replaceFrontmatterVersion`).** `scripts/generate-skill.ts` now updates the `version:` field in `skill/SKILL.md` to match `package.json` whenever `npm run skill` runs.
- **Added an installation test for the bundled skill.** `tests/install-skill.test.ts` now installs the repository skill into a temporary directory. It verifies that `name`, `description`, `version`, `license`, and `homepage` exist, and that `version` matches `package.json`.
- **Added Gate D (SDK-to-CLI coverage gate).** `scripts/generate-mapping.ts` and `scripts/mapping-renderer.ts` now verify that every `@testrail`-tagged SDK method maps to at least one `ActionSpec.apiEndpoint` without exemptions.

### Documentation

- **Documented the CLI-to-SDK fallback rule in `skill/SKILL.md`.** The new "Falling back to the programmatic SDK" section states the fallback rule. Switch to the SDK only when the CLI rejects an operation locally before a network request. Do not switch after HTTP errors, authentication failures, or rate limits.

## [5.2.0] — 2026-06-21 — #242 bulk-case wire-shape fixes

Live testing against a TestRail instance showed that all three bulk-case endpoints failed due to request or response wrapper mismatches. This release fixes those wrappers and updates the return type of `copyCasesToSection`.

### Fixed

- **`cases.addCases` — request and response wrappers.** The client now sends the request body as `{ cases: [...] }`. TestRail rejected the previous bare array with HTTP 400 `"Field :cases is a required field."`. The client now unwraps responses from `{ cases: [...] }` instead of `{ added_cases: [...] }`. Callers still pass a plain array of case payloads.
- **`cases.updateCases` — response wrapper.** The client now unwraps the response from `{ updated_cases: [...] }` instead of expecting a bare array.

### Changed (breaking for `copyCasesToSection` return type)

- **`cases.copyCasesToSection` now returns `Promise<void>` instead of `Promise<Case[]>`.** TestRail returns HTTP 200 with an empty body for `copy_cases_to_section`, so the previous array schema always failed validation.

## [5.1.0] — 2026-06-21 — Live-audit corrections

This release incorporates findings from a read-only audit against a live TestRail Cloud instance. All changes are backward-compatible except for the client-side pagination `limit` check below.

### Added

- **Added `TestRailLicenseError` (subclass of `TestRailApiError`).** When a non-Enterprise TestRail instance returns HTTP 403 with `{"error":"Not an Enterprise license/subscription."}` (for example, on `get_datasets` or `get_variables`), the client now throws `TestRailLicenseError`. Because `TestRailLicenseError` extends `TestRailApiError`, existing `catch` blocks continue to work, while callers can use `instanceof TestRailLicenseError` to detect license restrictions.
- **Typed additional server response fields.** Added `.nullish()` schema fields for properties observed in live responses. `Run` adds `is_archived`, `archived_on`, and `dynamic_filters`; `Plan` adds `is_archived` and `archived_on`. `Case` adds `refs_data` and `ai_automated_test`; history entries add `comments`. `Result` adds `case_id`, `quality_rating`, `defects_data`, and `attachment_ids`. `Test` adds `sections_display_order`, `cases_display_order`, `refs_data`, `case_comments`, and `ai_automated_test`.

### Changed

- **Bounded pagination `limit` at 250 on the client.** TestRail rejects `limit` values outside `[1, 250]` with HTTP 400. `validatePaginationParams` already rejected `limit <= 0` and now also throws `TestRailValidationError` when `limit > 250` before sending a network request.

### Documentation

- Documented in `README.md` that TestRail Cloud does not send rate-limit headers under normal load, so the client's sliding-window rate limiter provides the primary throttling.

## [5.0.2] — 2026-06-07 — Piped stdin for write commands

This release is a backward-compatible bug fix with no changes to the public API, types, or CLI surface.

### Fixed

- **Write commands now accept piped stdin as a request body (#226).** Previously, the stdin check required `isTTY === false`, but Node.js sets `process.stdin.isTTY` to `undefined` for pipes. Consequently, `echo '{...}' | testrail run add ...` failed with `"Body required"`. The check now runs when `isTTY !== true` and the caller passes neither `--data` nor `--data-file`, matching the `--api-key-stdin` check from #221.

### Maintenance

- Changed `bin.testrail` in `package.json` from `"./dist/cli.js"` to `"dist/cli.js"` to prevent npm's publish-time path normalization warning.

## [5.0.1] — 2026-06-04 — Accumulated CLI + cache fixes

This release is the first patch on the `5.0.0` line. All changes are backward-compatible bug fixes.

### Fixed

- **Prevented stale GET cache repopulation after writes (#217).** Previously, an in-flight GET request that started before a write could finish after the write's `clearCache()` call and write stale data into the cache. Cache invalidation now prevents in-flight pre-write GET requests from populating either raw or parsed cache entries.
- **`case list` now forwards `--limit` and `--offset` (#219).** Previously, `handleCaseList` parsed only `--project-id` and `--suite-id` and ignored pagination flags. It now parses `--limit` and `--offset` and forwards them to `getCases()`.
- **`--api-key-stdin` now accepts piped stdin (#221).** Previously, the terminal check rejected stdin whenever `isTTY !== false`, which rejected pipes because Node.js leaves `isTTY` as `undefined` on pipes. The check now rejects only interactive terminals (`isTTY === true`).
- **YAML output now quotes strings that start with a single quote (#218).** Previously, `--format yaml` emitted strings starting with `'` as unquoted scalars, which YAML parsers reject. The YAML formatter now wraps those strings in double quotes.
- **`uninstall-skill` no longer fails on a broken symlink (#222).** Previously, `uninstall-skill` checked `existsSync`, which follows symlinks and returns `false` for broken links. It now uses `lstat` and catches `ENOENT` so broken symlinks hit the symlink refusal check while missing files remain a no-op.

### Maintenance

- Updated funding metadata and development dependencies (#220) with no changes to the published runtime package.

## [5.0.0] — 2026-06-02 — Namespaced client + everything accumulated since 4.1.0

This is the first npm release since `4.1.0` (2026-05-21). It combines all unreleased changes on `main` (previously numbered `5.0.0` through `7.1.0`) into a single major version bump from `4.1.0`. This release did not revert any code. It only aligned the version number and changelog with the npm registry.

### Changed (BREAKING)

- **Removed the flat `TestRailClient` method facade (ARCH #7).** This release removes the ~131 flat pass-through methods on `TestRailClient`. Call methods through the 18 domain modules instead (`client.projects.*`, `client.runs.*`, `client.results.*`, and so on). Method names, parameters, and return types are unchanged.

    **Migration:** Insert the domain module name between `client` and the method name (for example, change `client.getProject(1)` to `client.projects.getProject(1)`). Metadata methods (`getStatuses`, `getCaseFields`, `getPriorities`, and others) live on `client.metadata.*`, and group methods (`getGroups`, `addGroup`, and others) live on `client.users.*`.

- **Plan-entry attachment `entryId` is now a UUID string instead of a number.** `attachments.getAttachmentsForPlanEntry`, `attachments.addAttachmentToPlanEntry`, and the CLI `attachment list-for-plan-entry` and `add-to-plan-entry` commands now require a UUID string, matching the `id` returned by `get_plan`.
- **Removed validation and URL helper methods from `TestRailClient` (ARCH #6).** Import validation and URL helpers directly from their standalone modules instead of calling them on a client instance.
- **Removed deprecated public type aliases.** This release removes unused re-exported type aliases from the package root.

### Added

- **Added camelCase list-filter options** for `getPlans`, `getResults`, `getTests`, and `getMilestones` (`createdAfter`, `createdBy`, `statusId`, `milestoneId`, `isCompleted`, and others) to match `getCases` and `getRuns`. The legacy `snake_case` keys remain available as `@deprecated` aliases.
- **Added UUID attachment ID support** to `attachments.getAttachment`, `attachments.deleteAttachment`, and the CLI `attachment get` and `attachment delete` commands (supporting TestRail 7.1+ RFC 4122 UUIDs alongside integer IDs).
- Added response-schema fields for TestRail 7.3+ and Enterprise, plus injectable `fetch` and `dnsLookup` options in `TestRailConfig`.

### Fixed

- **`users.getGroups()` now parses the paginated wrapper.** Because `get_groups` returns `{ offset, limit, size, _links, groups: [...] }` instead of a bare array, the schema now unwraps `groups ?? []`.
- **The client now validates list-filter ID arrays before sending a request.** `getPlans`, `getTests`, and `getResults*` previously serialized `createdBy`, `statusId`, and `milestoneId` arrays directly into the URL without validating each ID. They now validate every array item with `validateId()` and throw `TestRailValidationError` on invalid IDs.
- **`metadata.getRoles()` now parses the paginated wrapper.** TestRail's `get_roles` endpoint returns `{ offset, limit, size, _links, roles: [...] }` rather than a bare array. `getRoles()` now parses the wrapper and returns `roles ?? []`.
- **`suites.getSuites()` now accepts both a bare array and a paginated wrapper.** TestRail returns a bare array through version 9.3.0 and `{ offset, limit, size, _links, suites: [...] }` in 9.3.1 and later. `getSuites()` now supports both formats.
- **`variables.getVariables()` and `datasets.getDatasets()` now parse the paginated wrapper.** Both bulk endpoints return `{ offset, limit, size, _links, variables: [...] }` and `{ ..., datasets: [...] }` rather than bare arrays. Both methods now unwrap the paginated object and return the item array.
- **Fixed LRU cache eviction on key updates and rate-limiter retry counting.** Updating an existing key when the cache is full no longer evicts another entry. The rate limiter no longer rejects retried requests with a local 429 error.
- **`--format table` now includes columns from all rows.** Previously, the table formatter collected column names only from `rows[0]`, dropping any field that the first row omitted but later rows included. It now collects the union of keys across all rows in first-seen order, matching `--format csv`.

### Security

- Unified the HTTP pipeline with manual redirect blocking, response-body byte limits, and wall-clock deadlines. Expanded IPv6 SSRF blocks, hardened multipart uploads, and made process signal handlers optional. Added supply-chain checks through `.npmrc`, `lockfile-lint`, and OIDC trusted publishing with provenance.

## [4.1.0] — 2026-05-21

We published this version directly to npm without a GitHub release or git tag, and recorded it here to match the npm registry history.

### Fixed

- **Accepted nullable TestRail response fields.** Response schemas now use `.nullish()` for fields where TestRail can return `null` or omit the property.

## [4.0.0] — 2026-05-20 — CLI hardening release

This is the first npm release since `2.1.0` (2026-05-13). It includes all security fixes from the unpublished `3.x` series and adds a second confirmation gate for destructive CLI commands.

**Why this release jumps from `2.1.0` to `4.0.0`:** Seven commits introduce breaking changes to the `testrail` CLI binary and library lifecycle:

- **Wave 1 (from the unpublished `3.x` series):** Replaced `--api-key` with `--api-key-stdin` and rejected unknown CLI flags. Required `--yes` on `run close` and single-entity delete commands. Limited stdin JSON bodies to 1 MiB and removed terminal control characters from output. Blocked 3xx redirects and stopped retrying non-idempotent writes on 5xx and network errors. Added response-body byte and time limits. Made process signal handlers opt-in (`registerProcessHandlers: true`, default `false`).
- **Wave 2 (new in `4.0.0`):** All destructive CLI actions now require `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`. A missing environment variable causes exit code `2`.

Because we never published `3.x` to npm, users upgrade directly from `2.1.0` to `4.0.0`. The `[3.0.0]`–`[3.5.0]` sections below remain in this file to preserve the detailed change history and migration notes.

### Added

- **Added CLI binary stdio (`-` sentinel) for attachments and BDD.** Passing `--file -` streams a binary upload from `process.stdin`. Passing `--out -` streams a download to `process.stdout` and writes the JSON acknowledgement to `stderr`. This supports shell pipelines without temporary files (for example, `curl ... | testrail attachment add-to-case 42 --file -` or `testrail attachment get 17 --out - | xxd`).
- **Added `MAX_STDIN_UPLOAD_BYTES` (100 MiB) and `STDIN_READ_TIMEOUT_MS` (30 s) limits** for binary stdin uploads to prevent memory exhaustion and hanging reads (`SEC #24`).
- **Added `HandlerContext.err` and `HandlerContext.errRaw`** so handlers can write the `--out -` JSON acknowledgement to `stderr` while respecting `--quiet`.

### Security

- **Added mutual-exclusion checks for `--file -`.** The CLI rejects `--file -` on non-upload actions, when combined with `--data`, `--data-file`, or `--api-key-stdin`, or when `stdin` is a TTY.
- **`--out -` now rejects `--format table`** because the CLI cannot format binary output as a table.
- **Added a stderr warning for `--out -` when `stdout` is a terminal** without blocking intentional pipelines.

### Added (continued)

- **Added `--format yaml` and `--format csv` CLI output formats.** Every read, list, and write action now accepts `--format <json|table|yaml|csv>` (default: `json`).
    - `yaml` outputs YAML 1.2 with 2-space indentation using a built-in serializer with no extra runtime dependencies. The serializer double-quotes ambiguous strings and reserved YAML characters with C-style escapes, and formats `NaN` and `Infinity` as `.nan`, `.inf`, and `-.inf`.
    - `csv` outputs RFC 4180 CSV with CRLF line endings. Column headers contain the sorted union of top-level keys across all rows. The formatter serializes each nested object or array as a JSON string in one cell.
    - Passing an unknown `--format` value now exits with code 1 and lists the valid formats.
- **Added programmatic TypeScript API examples** in `skill/SKILL.md` covering all major resources, error narrowing with `instanceof`, and client configuration.
- **Added a generated Cursor rule** at `.cursor/rules/testrail.mdc` (`npm run cursor-rules` and `npm run cursor-rules:check`). Its `description`, `globs`, and `alwaysApply` frontmatter follows the [Cursor rules specification](https://docs.cursor.com/context/rules-for-ai).
- **Added a generated Continue rule** at `.continue/rules/testrail.md` (`npm run continue-rules` and `npm run continue-rules:check`). The plain Markdown format follows the [Continue rules specification](https://docs.continue.dev/customization/rules).
- **Added a generated `AGENTS.md` file** at the repository root following the [agents.md](https://agents.md/) convention (`npm run agents-md` and `npm run agents-md:check`).
- **Added `testrail uninstall-skill`** to remove an installed skill from `./.claude/skills/testrail-cli/` (default) or `~/.claude/skills/testrail-cli/` (`--global`) and remove the `testrail-cli/` directory if empty. It does not modify `.cursor/rules/testrail.mdc`, `.continue/rules/testrail.md`, or `AGENTS.md`.
- **Added `scripts/rules-content.mjs`** as the single source of truth for the generated rule files.

### Safety

The `uninstall-skill` command uses `lstat` to prevent symlink traversal:

- It calls `lstat` instead of `stat` so it detects symlinks without following them.
- It refuses to delete symlinks or non-regular files (such as directories).
- After deleting `SKILL.md`, it removes the parent `testrail-cli/` directory only if it is empty, and never modifies `.claude/skills/` or parent directories.

Note: We track SEC #5 (TOCTOU symlink check on `install-skill`) separately.

### Tooling / CI

- Added npm scripts and `:check` verification scripts for `cursor-rules`, `continue-rules`, and `agents-md`.
- Added `cursor-rules:check`, `continue-rules:check`, and `agents-md:check` to `pretest`.
- Made all generated files deterministic and verified byte-for-byte equality in `tests/generate-rules.test.ts`.

### Tests

- Added `tests/uninstall-skill.test.ts` (12 tests covering local and global paths, missing files, `--quiet`, round-trip install/uninstall, symlink and directory refusal, and sibling file preservation).
- Added `tests/generate-rules.test.ts` (13 tests covering determinism, frontmatter, self-references, and drift checks).
- Added a CLI smoke test in `tests/cli.test.ts` verifying that `uninstall-skill` appears in `--help`.

### Added (CLI bulk case creation, run watcher, attachment pagination)

- **Added the `case add-bulk` CLI action and `addCases()` SDK method** to create multiple cases under a section in a single `POST add_cases/{section_id}` call (TestRail 7.5+). The client validates that the payload is a non-empty array of `AddCasePayload` items before sending the request. If an older TestRail server returns 400 or 404 with `"Invalid uri"`, the client throws `TestRailApiError` with the message `'TestRail server >= 7.5 required for add_cases bulk endpoint'`. `--dry-run` previews the parsed array and item count.
- **Added the `run watch <run_id>` CLI action** to poll `GET get_run/{run_id}`. The default interval is 30 seconds; `--interval N` accepts 5 to 600 seconds. `--once` performs one poll. Each poll emits one JSON line when status counts or `is_completed` change. The command exits with code 0 when `is_completed` becomes `true`, or code 130 on `SIGINT`. It schedules polls with recursive `setTimeout` calls so slow polls cannot overlap.
- **Added pagination options (`GetAttachmentsOptions { limit?, offset? }`)** to `getAttachmentsForCase`, `getAttachmentsForRun`, `getAttachmentsForTest`, and the CLI `attachment list-for-{case,run,test}` commands. Plan-level attachment lists (`list-for-plan` and `list-for-plan-entry`) remain unpaginated because TestRail returns the full list.

### Changed

- Exported `AddCasesBulkPayload`, `AddCasesBulkPayloadSchema`, and `GetAttachmentsOptions` from the package root.
- Added `--interval <seconds>` and `--once` for `run watch`, and enabled `--limit` and `--offset` on attachment list actions.
- **`requestMultipart` now streams file uploads from disk** using `node:fs.openAsBlob` instead of reading the entire file into memory. A 100 MB file upload benchmark measured heap growth of +0.00 MB, down from +2.30 MB. RSS growth dropped from +175.61 MB to +0.02 MB.
- `addAttachmentToCase`, `addAttachmentToResult`, `addAttachmentToRun`, `addAttachmentToPlan`, `addAttachmentToPlanEntry`, and `addBdd` remain backward-compatible and now accept `{ path: string; type?: string }` in addition to `Blob | Uint8Array | File`.
- `resolveFile()` in the CLI no longer buffers file `contents` in memory. `ResolveFileOptions.read` remains as a no-op for backward compatibility.
- Preserved all upload safety rules: no retries on 5xx, 429, or network errors, `AbortSignal` support during upload, pre-fetch DNS/SSRF validation, and 3xx redirect blocking.

### Changed (BREAKING) — Destructive-ops env-var gate

Closes [BACKLOG CLI: destructive env-var gate](docs/archive/BACKLOG-ARCHIVE.md). Destructive CLI actions (`*:delete`, `run close`, and `plan close`) now require the environment variable `TESTRAIL_ALLOW_DESTRUCTIVE=1` **in addition to** the `--yes` flag. The CLI dispatcher (`src/cli/dispatch.ts`) enforces this check before invoking any handler.

- **BREAKING: Destructive CLI actions require `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`.** The environment variable must equal the exact string `'1'`.
- **Added exit code `2`** when a missing `TESTRAIL_ALLOW_DESTRUCTIVE=1` blocks a destructive action. Argument, authentication, validation, and HTTP errors continue to use exit code `1`.
- `--dry-run` continues to bypass both gates so you can preview commands safely without network calls.

### Migration (env-var gate)

> See the `[3.0.0]`–`[3.5.0]` sections for Wave 1 migration notes. These cover `--api-key` removal, `--yes` on `run close`, unknown flags, the stdin body limit, and opt-in `registerProcessHandlers`.

**For CI workflows running destructive `testrail` commands:**

Set `TESTRAIL_ALLOW_DESTRUCTIVE=1` in your CI step before running destructive commands:

```bash
# Before (3.5.x):
testrail run delete 5 --yes

# After (4.0.0+):
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail run delete 5 --yes
```

Or set it inline for a single command:

```bash
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5 --yes
```

**Affected actions:** `case delete`, `case delete-bulk`, `run delete`, `run close`, `section delete`, `suite delete`, `milestone delete`, `project delete`, `plan close`, `plan delete`, `plan delete-entry`, `plan delete-run-from-entry`, `variable delete`, `group delete`, `dataset delete`, `shared-step delete`, `configuration delete`, `configuration-group delete`, and `attachment delete`.

**For agents and scripts using `--dry-run`:** You do not need to make any changes. `--dry-run` bypasses both gates.

**For programmatic SDK users:** You do not need to make any changes. This gate applies only to the CLI.

### Why two gates?

The `TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable provides a process-wide setting visible in CI logs and environment dumps, while `--yes` confirms intent for each command invocation:

- A script running in an environment with `TESTRAIL_ALLOW_DESTRUCTIVE=1` still requires `--yes` on each destructive command.
- A command that includes `--yes` by mistake still requires `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
- The dispatcher enforces both checks centrally before any command handler runs.

Requiring the exact value `'1'` keeps CI logs unambiguous.

### Unchanged (env-var gate)

- Missing `--yes` still exits with code 1.
- `--dry-run` still takes precedence over `--yes` and makes no API call.
- `--soft` still performs a server-side preview on delete endpoints that support it.
- Programmatic SDK methods do not require the environment variable.

## [3.5.0] — 2026-05-18 — Stop hijacking host signal handling (opt-in process handlers)

Closes [BACKLOG SEC #8](docs/archive/BACKLOG-ARCHIVE.md). Previously, every `TestRailClient` constructor registered global `exit`, `SIGINT`, and `SIGTERM` listeners. The `SIGINT` and `SIGTERM` listeners called `process.exit(130)` and `process.exit(143)`. For applications that manage their own graceful shutdown (such as web servers, daemons, and test runners), this caused three problems:

- The client's signal handlers could call `process.exit()` before the host application finished closing sockets, flushing logs, or rolling back transactions.
- Callers could not disable the listeners because the constructor registered them unconditionally.
- Instantiating a client in tests left listeners attached to the worker process.

### Fixed

- **Added `registerProcessHandlers?: boolean` to `TestRailConfig` (default: `false`).** The client no longer registers process signal listeners unless you pass `registerProcessHandlers: true`.
- **The `testrail` CLI binary passes `registerProcessHandlers: true`**, preserving its existing shutdown behavior and 130/143 exit codes.
- **When you set `registerProcessHandlers: true`, behavior is unchanged** from 3.4.0.

### Migration

- **CLI users:** You do not need to make any changes.
- **SDK users who relied on automatic signal handlers:** Pass `registerProcessHandlers: true` in `TestRailConfig`, or call `client.destroy()` from your application's shutdown handler (recommended).
- **SDK users in servers or daemons:** You do not need to make any changes. The client no longer overrides your signal handlers.

### Unchanged

- `destroy()`, the `activeClients` registry, the cache cleanup timer, and credential zeroing behave identically to 3.4.0.

## [3.4.0] — 2026-05-18 — Block HTTP redirects to close SSRF guard bypass

Closes [BACKLOG #4](BACKLOG.md). Previously, the SSRF guard (`validateBaseUrl` and DNS pinning) validated only the initial request host. `fetch` follows HTTP redirects by default. A server or reverse proxy could return `301`, `302`, `303`, `307`, or `308` with a private address in `Location`. The client then followed that address, including `127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`, or link-local ranges.

### Fixed

- **All four fetch methods (`request<T>`, `requestText`, `requestMultipart`, and `requestBinary`) now set `redirect: 'manual'`** so `fetch` never follows `Location` headers automatically.
- **The client now rejects 3xx responses with `TestRailApiError`** via `assertNotRedirect()`. The error preserves `status` and `statusText` and includes the `Location` header value in `error.response` to aid debugging.
- **The client never retries 3xx responses** across all four fetch methods.
- **3xx responses never write to the GET cache.**

### Unchanged

- `GET` retry behavior for `5xx`, `429`, and network errors is unchanged.
- `allowPrivateHosts` and DNS-pinning behavior are unchanged.
- Standard TestRail API endpoints (`/index.php?/api/v2/...`) do not return 3xx redirects.

### Migration

Standard TestRail deployments do not require any code changes. If a reverse proxy in front of TestRail redirects from an old hostname to a new hostname, update `baseUrl` to the final URL.

## [3.3.0] — 2026-05-18 — Stop retrying non-idempotent writes on 5xx and network errors

Closes [BACKLOG #13](BACKLOG.md). Previously, the client retried every `5xx`, `429`, and network error up to `maxRetries` regardless of the HTTP method. A POST could reach the server before returning `502`, `503`, or a connection reset. Retrying that write could create duplicate runs, cases, or results.

### Fixed

- **`request<T>()` and `requestText()` no longer retry non-`GET` requests on `5xx` responses or network errors.** Any `5xx` or network error during a write request now throws `TestRailApiError` immediately so the client cannot create duplicate records.

### Unchanged

- **All methods still retry on `429` (rate limit),** honoring `Retry-After`, because TestRail's rate limiter rejects requests before execution.
- `GET` requests still retry on `5xx`, `429`, and network errors up to `maxRetries`.
- `requestUpload()` (attachment POST) already disabled retries.

### Migration

You do not need to make any code changes. Callers that relied on automatic `5xx` write retries now receive `TestRailApiError` directly. Check whether the server created the resource before retrying.

## [3.2.0] — 2026-05-18 — Fix schema-invalid responses poisoning the GET cache

Closes [BACKLOG #9](docs/archive/BACKLOG-ARCHIVE.md). Previously, the GET cache stored the parsed JSON response before the domain module validated it against its Zod schema. If TestRail returned a malformed response, that invalid entry remained in the cache for the full `cacheTtl` (5 minutes by default). Subsequent identical GET calls then failed with `TestRailValidationError` until the caller cleared the cache or the entry expired.

### Fixed

- **The GET cache no longer stores schema-invalid responses.** The client now validates responses before caching them. A malformed response fails once, and the next call fetches a fresh server response.

### Added

- **Added `TestRailClientCore.requestParsed<T>(method, endpoint, schema, data?)`.** This public method executes the request and validates the response with the supplied Zod schema. Valid GET responses use the separate `PARSED:GET:${endpoint}` cache namespace.

### Changed

- All 17 domain modules now call `requestParsed` for typed responses. `request()` and `parse()` remain public and backward-compatible for direct callers.

### Migration

Standard SDK callers do not need to make any changes. Callers that invoke `request()` and `parse()` directly on `TestRailClientCore` can switch to `requestParsed()` to avoid caching invalid responses.

## [3.1.0] — 2026-05-18 — Destructive single-entity delete CLI surface

This release adds the remaining single-entity delete commands to the CLI and adds optional `{ soft?: boolean }` preview overloads to four SDK delete methods. All changes are backward-compatible.

### Added

#### Six new destructive CLI actions

```sh
testrail case      delete <case_id>      [--soft] --yes
testrail run       delete <run_id>       [--soft] --yes
testrail suite     delete <suite_id>     [--soft] --yes
testrail section   delete <section_id>   [--soft] --yes
testrail milestone delete <milestone_id>         --yes   # --soft NOT supported
testrail project   delete <project_id>           --yes   # --soft NOT supported; highest blast radius
```

Each action follows the destructive-command rules: `--yes` is required to execute, and `--dry-run` previews locally without calling the API.

Passing `--soft` sends `?soft=1` to TestRail for a server-side preview. TestRail deletes nothing and returns counts of affected entities (`affected_tests`, `affected_cases`, `affected_sections`, `affected_runs`, `affected_plans`, and others). `milestone delete` and `project delete` reject `--soft` because TestRail does not support soft deletes on those endpoints.

#### Programmatic API

`deleteCase`, `deleteRun`, `deleteSection`, and `deleteSuite` now accept an optional `{ soft?: boolean }` parameter, matching `deleteCases`. When you pass `{ soft: true }`, they return `SoftDeletePreview`.

```ts
// Hard delete (unchanged)
await client.deleteCase(42);

// Soft preview (new)
const preview = await client.deleteCase(42, { soft: true });
// preview: { affected_tests?, affected_cases?, ... } — all optional, passthrough preserves unknown counters
```

#### New public exports

- `SoftDeletePreview` — response type re-exported from the package root
- `SoftDeletePreviewSchema` — Zod schema re-exported from the package root
- `SoftDeleteOptions` — `{ soft?: boolean }` options interface in `types.js`

### Changed

Marked `DeleteCasesOptions` and `DeleteCasesPreview` in `src/modules/cases.ts` as `@deprecated` aliases for `SoftDeleteOptions` and `SoftDeletePreview`. Existing imports continue to work.

### Fixed

- Increased the `CODEMAP.md` size limit in `tests/generate-codemap.test.ts` from 200 KB to 256 KB to accommodate the expanded public API.

## [3.0.0] — 2026-05-18 — CLI safety cluster

This release hardens the `testrail` CLI against security audit findings. The programmatic SDK API (`new TestRailClient({ apiKey, ... })`) is unchanged. These breaking changes affect only the CLI.

### BREAKING CHANGES

#### `--api-key <key>` argv flag removed (CTF #11)

Command-line arguments are visible to other processes via `/proc/<pid>/cmdline`, shell history, CI logs, container audit logs, and crash dumps (CWE-214).

**Migration:** Pass the API key via the `TESTRAIL_API_KEY` environment variable (recommended) or pipe it to `stdin` with `--api-key-stdin`.

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

Note: Because `--api-key-stdin` reads from `stdin` (`fd 0`), pass JSON request bodies for write commands via `--data` or `--data-file` when using `--api-key-stdin`.

#### `run close` now requires `--yes` (CTF #6)

TestRail cannot reopen a closed test run. `run close` now requires `--yes` (or `--dry-run` for a local preview), matching `attachment delete` and `case delete-bulk`.

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

The CLI now validates parsed flags against `KNOWN_FLAGS` and exits with code 1 on any unrecognized flag. Previously, the parser ignored a typo such as `--dryrun` (missing hyphen), which allowed a destructive command intended as a dry-run preview to execute for real.

**Migration:** Remove or fix unrecognized flags. The CLI reports `Error: unknown flag '--dryrun'. Run --help for the full list.`

#### Stdin body reads capped at 1 MiB (CTF #24)

`readBoundedStdin` now limits `stdin` JSON payloads to 1 MiB to prevent out-of-memory crashes from large pipes.

**Migration:** Split large payloads across multiple requests, or write the payload to a file and pass `--data-file <path>`.

### Fixed (non-breaking)

- **CTF #16:** Stripped terminal control characters (C0, C1, and DEL) from `stderr` error messages to prevent ANSI and OSC escape sequence injection.
- **CTF #18:** Applied `sanitizeForTerminal` to all cell values and column headers in `--format table` output.

### Internal

- Added `src/cli/flags.ts` (`KNOWN_FLAGS` and `parseArgs` options), `src/cli/sanitize.ts` (terminal control-character sanitizer), and `src/cli/stdin.ts` (`readBoundedStdin`).
- Marked security findings #6, #10, #11, #16, #18, and #24 as `[SHIPPED]` in `docs/archive/BACKLOG-ARCHIVE.md`.
- Test coverage: 97.23% overall and 100% on the new modules.

### Known limitations

- `readBoundedStdin` prevents memory exhaustion, but does not enforce a wall-clock timeout if a producer keeps the pipe open while sending fewer than 1 MiB. We track a wall-clock timeout for `stdin` reads in `BACKLOG.md` under CTF #24.

## [2.2.0] — earlier

See the Decision Log section in [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md).
