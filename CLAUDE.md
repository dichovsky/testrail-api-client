# CLAUDE.md

`@dichovsky/testrail-api-client` is a type-safe TypeScript client for the TestRail API. It has one runtime dependency: Zod. It uses ESM only (`type: "module"`).

Use [CONTRIBUTING.md](CONTRIBUTING.md) for setup, verification, and contributor conventions.
This file records implementation rules and endpoint procedures.
Package users can start with the [SDK](docs/SDK.md), [CLI](docs/CLI.md), and [networking](docs/NETWORKING.md) guides.

## Commands

```bash
npm run verify                                    # Run all local checks, including build
npm test                                          # Run Vitest suite only (no implicit pre-hook)
npm run test:coverage                             # Generate coverage report
npm run build                                     # Compile with native TypeScript 7 to dist/
npm run lint && npm run typecheck                 # Run ESLint and TypeScript 7 check
npm run typecheck:ts6                             # Run TypeScript 6 compatibility check
npm run codemap                                   # Regenerate CODEMAP.md
npm run mapping                                   # Regenerate docs/API-MAPPING.md
npm run skill                                     # Regenerate skill docs and payload reference
npm run agents-md                                 # Regenerate AGENTS.md
npm run package:smoke                             # Test the packed package and CLI binary
npx vitest run tests/client-endpoints.test.ts    # Run a single test file
```

## File Map

| File                                                                 | Purpose                                                                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/client-core.ts`                                                 | Request orchestration, HTTP pipeline, rate limiter, retry logic, and lifecycle management                                                                                          |
| `src/request-cache.ts`                                               | GET cache protocol: TTL/LRU storage, cloning, in-flight request sharing, cache invalidation, and cleanup                                                                           |
| `src/client.ts`                                                      | `TestRailClient` composition root: 19 `public readonly` module fields, module composition only, no flat wrapper methods                                                            |
| `src/modules/*.ts`                                                   | Domain endpoint methods (cases, runs, results, projects, suites, sections, plans, tests, milestones, and others)                                                                   |
| `src/types.ts`                                                       | Schema-derived response type aliases, custom-field types, client configuration types, and `Get*Options` DTOs                                                                       |
| `src/schemas.ts`                                                     | Zod schemas for API responses and write payloads; source of truth for public response and payload types                                                                            |
| `src/pagination.ts`                                                  | `Page<T>` decoding, continuation link parsing, and bounded multi-page collection                                                                                                   |
| `src/errors.ts`                                                      | API, validation, license, and pagination error classes, plus `handleZodError`                                                                                                      |
| `src/body-reader.ts`                                                 | Streaming response-body reader with a byte limit (SEC #12) and a time limit (SEC #21)                                                                                              |
| `src/operation-tracking.ts`                                          | `AsyncLocalStorage` operation scopes for `trackOperation`: resource tracking, scope binding, and settlement                                                                        |
| `src/upload-source.ts`                                               | Multipart upload handler: path mapping, `openAsBlob`, FormData construction, stream ownership, and file descriptor cleanup                                                         |
| `src/request-budget.ts`                                              | Wall-clock time budget for one call: deadline tracking, timeout clipping, retry delays, and HTTP 408 timeout errors                                                                |
| `src/constants.ts`                                                   | Default values, limits, pagination bounds, transport bounds, and email validation patterns                                                                                         |
| `src/config-validation.ts`                                           | `TestRailConfigSchema` validation adapter: URL and SSRF checks with consistent `TestRailValidationError` messages                                                                  |
| `src/utils.ts`                                                       | `base64Encode` and `sleep` helper functions                                                                                                                                        |
| `src/cli.ts`                                                         | CLI binary entrypoint (`bin: testrail`, `./cli` subpath): builds `CliRuntime` and sets `process.exitCode`. Only this file in `src/` can reference `process.stdout`/`stderr`/`argv` |
| `src/cli/index.ts`                                                   | `runCli(runtime)`: parses arguments, dispatches commands, resolves auth, and runs handlers                                                                                         |
| `src/cli/output.ts`                                                  | CLI output module: `createOutput({quiet, format, stdout, stderr, stdoutIsTTY})` for formatting, sanitization, `--quiet`, and `--out -`                                             |
| `src/cli/{auth,ids,dispatch,handler-context,response-validation}.ts` | CLI core helpers: environment and flag resolution, ID parsing, handler routing, and schema mismatch handling                                                                       |
| `src/cli/{file-input,file-output}.ts`                                | Binary file input resolver (`--file`) and binary download resolver (`--out`) for attachment commands                                                                               |
| `src/cli/diagnostics.ts`                                             | Redacted CLI error records and private diagnostic file creation, writing, and cleanup                                                                                              |
| `src/cli/handlers/*.ts`                                              | Async command handlers for each resource and action                                                                                                                                |
| `src/index.ts`                                                       | Public package exports                                                                                                                                                             |
| `skill/SKILL.md`                                                     | Bundled agent skill body: usage rules, authentication, safety gates, output and pagination rules, and links to reference files                                                     |
| `skill/reference/commands.md`                                        | Generated CLI command table and option reference (contains `command-table` and `option-reference` markers)                                                                         |
| `skill/reference/recipes.md`                                         | Numbered CLI recipes with `<!-- recipe-for: -->` tags for gate C2                                                                                                                  |
| `skill/reference/typescript-api.md`                                  | Programmatic TypeScript SDK reference                                                                                                                                              |
| `CODEMAP.md`                                                         | Generated `codemap.v2` symbol index in JSON-in-Markdown format                                                                                                                     |
| `codemap.config.json`                                                | Configuration for the codemap generator (`sourceDirs`, `entrypoints`, `exclude`, `maxSignatureLength`)                                                                             |
| `scripts/generate-codemap.ts`                                        | Generates `CODEMAP.md` from the TypeScript AST (`--check` verifies the committed file)                                                                                             |
| `docs/API-MAPPING.md`                                                | Generated coverage table that maps TestRail endpoints, client methods, CLI commands, and skill recipes                                                                             |
| `docs/testrail-endpoints.json`                                       | Inventory of 133 TestRail endpoints across 28 resources                                                                                                                            |
| `scripts/generate-mapping.ts`                                        | Generates `docs/API-MAPPING.md` and runs validation gates A, B, C, C2, and D                                                                                                       |
| `scripts/mapping-renderer.ts`                                        | Helper functions for the mapping generator: Zod schemas, path normalization, tag parsers, and Markdown renderers                                                                   |

## API Symbol Index

Read **[CODEMAP.md](CODEMAP.md)** to find any method, type, error class, or constant with its exact `file:line` location. This file contains a `codemap.v2` JSON block. Parse the JSON block to inspect `publicApi[]` (symbols exported from `src/index.ts` and `src/cli.ts`) or `files[]` (all declarations, including private symbols). `npm run codemap:check` fails if `CODEMAP.md` does not match the source code.

## API Coverage Matrix

Read **[docs/API-MAPPING.md](docs/API-MAPPING.md)** to see the mapping between TestRail endpoints, client methods, CLI commands, and skill recipes:

- `@testrail` JSDoc tags on module methods link methods to endpoints.
- `apiEndpoint` on each `ActionSpec` links CLI commands to endpoints.
- `<!-- recipe-for: resource:action -->` HTML comments in `skill/reference/recipes.md` link numbered recipes to CLI commands.

`npm run mapping:check` runs five validation gates:

- **Gate A**: The committed `docs/API-MAPPING.md` matches the generator output.
- **Gate B**: Every `@testrail` tag matches an endpoint in `docs/testrail-endpoints.json`.
- **Gate C**: Every `ActionSpec.apiEndpoint` matches a `@testrail` tag.
- **Gate C2**: Every `recipe-for:` tag in `skill/reference/recipes.md` matches an `ACTIONS` entry. Every entry has at least one recipe unless `skillRecipeExempt: true` is set.
- **Gate D**: Every SDK method with a `@testrail` tag links to at least one `ActionSpec.apiEndpoint`.

**Layer-coverage rule (SDK -> CLI -> skill).** Every SDK method with a `@testrail` tag must have at least one CLI command. Every CLI command must have at least one skill recipe. When you add a new endpoint method, you must also add its CLI command and skill recipe in the same change. Do not use `skillRecipeExempt`. Current coverage includes 133 methods, 133 endpoints, 134 CLI commands, and 100% recipe coverage (`run get` and `run watch` share `get_run`).

## Architecture Invariants

**Class hierarchy:** `TestRailClientCore` (`client-core.ts`) is the base class for `TestRailClient` (`client.ts`). Core contains the HTTP infrastructure. Domain modules contain the endpoint methods. `client.ts` contains module composition only (19 `public readonly` fields, no flat wrappers). Call methods through their module namespace, such as `client.projects.getProject(id)`. `tests/exports.test.ts` verifies the module count and timeout-view parity.

**Configuration validation:** `TestRailConfigSchema` in `src/schemas/common.ts` defines the runtime configuration schema and matches every key of `TestRailConfig`. `validateTestRailConfig()` checks the URL protocol, credentials, and private hosts, and throws `TestRailValidationError`. Both schema validation and constructor validation use `TESTRAIL_CONFIG_EMAIL_PATTERN`. `users.getUserByEmail()`, `UserAddPayloadSchema`, and `UserUpdatePayloadSchema` use `TESTRAIL_USER_EMAIL_PATTERN` (#236). Values of `0` for `maxCacheSize`, `cacheCleanupInterval`, `maxRetries`, and `bodyTimeout` disable those features. `cacheCleanupInterval` must be an integer from `0` to `MAX_NODE_TIMER_DELAY_MS` (`2_147_483_647`). `PaginationRequestSchema` validates strict single-request `limit` and `offset` values. The deprecated `PaginationSchema` keeps its earlier permissive behavior.

The user-email pattern requires one `@` and non-empty parts without whitespace. It accepts single-label and domain-literal addresses. The cleanup interval bound prevents Node.js from converting an overflowing timer to a 1 ms loop.

**Private-host classification:** `src/config-validation.ts` uses one shared `net.BlockList` for constructor IP checks and per-request DNS checks. It blocks private IPv4 ranges, IPv4-mapped IPv6 addresses, CGNAT (`100.64.0.0/10`), RFC 2544 benchmarking (`198.18.0.0/15`), multicast (`224.0.0.0/4`), reserved (`240.0.0.0/4`), and NAT64 prefixes (`64:ff9b::/96` and `64:ff9b:1::/48`). The constructor rejects private IP literals and `localhost`. For hostnames, the client resolves DNS before each request and validates all returned IP addresses. The Node fetch dispatcher connects directly to the validated IP addresses and preserves the original hostname for TLS SNI. Set `allowPrivateHosts: true` to disable private-host checks and DNS pinning. Custom `fetch` implementations must honor the dispatcher or enforce equivalent destination checks.
Hostnames with private-looking prefixes still require DNS classification. The client does not classify them by spelling alone.

**URL construction:** The client constructs URLs in the format `{baseUrl}/index.php?/api/v2/{endpoint}`. It appends query parameters with `&` instead of `?` (for example, `get_sections/1&suite_id=2`). Always use `buildEndpoint(base, params)`.

**Caching:** `RequestCache` manages GET caching through `resolve()`. It handles TTL, LRU eviction, cloning, in-flight request sharing, cache invalidation, and timer cleanup.

- Validated GET requests use the key `PARSED:GET:{endpoint}`.
- Raw JSON GET requests use the key `GET:{endpoint}`.
- Page requests use the key `PAGE:PARSED:GET:{endpoint}`.
- Non-GET requests, text responses, binary responses, and multipart uploads bypass the cache.
- Any successful write clears all stored and in-flight cache entries before parsing the write response.
- `getAll*()` bypasses cache reads, cache writes, and in-flight sharing so multi-page reads do not mix cached pages from different times.
- Concurrent GET requests share an in-flight request only when their header and body timeouts match.
- Completed entries remain shared across timeout views.
- Invalidation generations prevent old in-flight requests from publishing stale cache entries.
- Cache hits and shared waiters return before DNS checks. Each distinct network attempt, including retries, repeats DNS validation.

**Pagination contract:** The 24 paginated endpoints in `docs/testrail-endpoints.json` provide three methods:

1. `get*()` returns the items from one response.
2. `get*Page()` returns `Page<T>` with envelope metadata.
3. `getAll*()` follows `_links.next` continuations and returns all items within safety limits.

`src/cli/metadata/paginated-endpoints.ts` maps each paginated `apiEndpoint` to its pagination configuration. `_PaginatedEndpointsAreSurfaced` (compile-time check) and `tests/generate-mapping.test.ts` (runtime check) verify that every paginated endpoint has a CLI command. Do not delete `_ActionEndpointsAreLiterals` in `src/cli/metadata.ts`. It prevents `ActionEndpoint` from widening to `string` and making the pagination assertion ineffective.

Each domain pagination descriptor has a `prepare()` adapter. It validates IDs and filters synchronously and returns `{ operation, pathParameters, query }`.
`createPaginatedListExecutor()` rejects unknown operations, copies and freezes prepared inputs, builds paths, and prepares schemas once.
It controls list/page/all output, deadlines, cache policy, continuation, decoding, and collection limits.
Adapters read only declared filters. Aggregate helpers read only `pageSize`, `startOffset`, and safety bounds.
Response-driven endpoints accept only safety bounds. `tests/pagination-descriptor-inventory.test.ts` checks all 24 registrations against the endpoint inventory.

Shared-step history, datasets, variables, roles, groups, and case statuses use `requestControls: false`.
Test attachments, plan-entry attachments, users, and ordinary metadata, configuration, and report lists do not provide the three pagination methods.

The client extracts only the validated `offset` and optional `limit` from `_links.next`. `createPaginatedListExecutor()` rebuilds the endpoint path from validated parameters instead of following the raw URL from the server. Bare arrays stop pagination after one page. Default aggregate limits are 250 items per page, offset 0, 100 pages, 25,000 items, 300,000 ms, and 100 MiB. Maximum limits are 250 items per page, 300,000 ms, and 1 GiB. Invalid pagination data or an exceeded limit causes `TestRailPaginationError`. Its `reason` is `max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, or `non_progress`.

**CLI pagination:** The CLI validates pagination flags before authentication:

- Default mode outputs the item array from one response.
- `--page` outputs `Page<T>`.
- `--all` collects all pages within safety bounds.
- `--page` cannot be used with `--all`.
- `--all` rejects `--limit` and `--offset`.
- `--page-size`, `--start-offset`, `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes` require `--all`.
- Response-driven endpoints accept safety bounds (`--max-*`) but reject `--page-size` and `--start-offset`.

**CLI invocation contract:** `FLAG_CATALOG` defines CLI flag types. Each `ActionSpec.flags` entry defines which flags apply to an action and which flags are required. `resolveActionInvocation()` rejects unsupported or missing required flags before reading stdin, resolving auth, or creating a client. `validateSuppliedFlagTypes()` checks raw `argv` tokens so a string flag cannot consume the next flag as its value (for example, `--filename --dry-run` fails). To pass a literal value that starts with `--`, use the inline form `--flag=--value`. `softMode` is set on `ActionSpec` only for actions that support `soft=1`.

Validation examines each token occurrence, not only the final `values` record. It rejects consumed tokens that start with `--` plus another character.
Thus, `--filename --dry-run=true`, `--filter --dryrun`, and `--filter --dry-run --filter abc` also fail.
The inline `--flag=--value` form remains valid. Values `-5`, `-`, and bare `--` remain valid.
The entrypoint runs token validation once before dispatch. `resolveActionInvocation()` does not repeat that check.
Action requirements supply both CLI help and generated skill tables. Domain handlers retain typed method calls; do not replace them with string-key dispatch.
Omitted `softMode` rejects real `--soft` execution, including `run close`. `--dry-run --soft` still returns a local preview.

**CLI response validation:** By default, entity-field schema mismatches print a warning to stderr and do not fail the command. Warnings include only the HTTP method, CLI resource and action, Zod issue codes, and masked path depth (`*`). The CLI prints at most 10 unique warnings and summarizes additional counts. Pass `--strict-responses` or set `TESTRAIL_STRICT_RESPONSES=1` to fail on the first mismatch. In strict mode, read mismatches throw `handleZodError(error)`, and write mismatches throw `TestRailApiError` with an indeterminate-outcome message. `--quiet` suppresses mismatch warnings.

Warnings exclude endpoints, field names, issue messages, and response values. The reporter combines duplicate warning fingerprints.
`TESTRAIL_STRICT_RESPONSES` accepts `1`, `0`, empty, or unset. Other values fail before authentication or network access.
Boolean flag values such as `--strict-responses=true` also fail.
Strict aggregate reads emit no partial array. Previously emitted `run watch` events remain visible.

**CLI error diagnostics:** `--diagnostic-file <new-path>` reserves a private (`0600`) file before the command handler runs. If the command fails, the CLI writes a redacted `version: 1` JSON error record. The record includes the HTTP status, `operationOutcome` (`not_dispatched` or `failed_or_indeterminate`), and safe server validation messages. It excludes raw bodies, headers, stack traces, and credentials. Successful runs delete the reserved file. Windows rejects `--diagnostic-file`. `--dry-run` ignores `--diagnostic-file`. Existing paths fail before execution. `--quiet` still permits an explicitly requested diagnostic file.
Request diagnostics on the original command. Never repeat a write only to obtain diagnostics. An error after dispatch does not prove that the write failed.

**Rate limiter:** Uses a sliding window on `rateLimiter.requests[]`. Default limit is 100 requests per 60 seconds. Exceeding the limit throws `TestRailApiError`.

**Retry:** Uses exponential backoff `min(1000 * 2^n, 10000)` ms.

- **GET** retries on 5xx, 429, and network errors (except side-effecting report reads).
- **POST/PUT/DELETE** retries only on 429. It never retries 5xx or network errors to avoid duplicate writes.
- **Multipart uploads** never retry.
- `deriveRetryPolicy()` (`src/retry-policy.ts`) derives the retry policy from `body.kind`, `responseKind`, and `intent`.
- The client honors the `Retry-After` header (delta-seconds or HTTP-date, capped at `MAX_RETRY_DELAY_MS`).
  This applies to every retryable response, including GET 5xx responses and binary downloads.
  A missing, zero, past, or invalid value selects exponential backoff. This prevents a rapid retry loop.
- Other 4xx responses and `AbortError` timeouts do not retry.

**Redirects (3xx):** Every fetch sets `redirect: 'manual'` and calls `assertNotRedirect()`. Any 3xx response throws `TestRailApiError` without retrying and is never cached. The error stores the blocked `Location` in `response`.

**Response-body limits (SEC #12 + SEC #21):** `readBodyWithLimits()` (`src/body-reader.ts`) enforces byte and time limits. `maxJsonResponseBytes` defaults to 10 MiB for JSON, text, and error responses. `maxBinaryResponseBytes` defaults to 100 MiB for successful binary responses. Both byte limits have a 1 GiB maximum. The body deadline uses `bodyTimeout`, which defaults to `timeout`. An exceeded limit causes `TestRailApiError` without a retry.

The header timer stops after fetch returns. The body deadline is independent. Response-like objects without `body.getReader()` use a fallback reader. The fallback enforces the deadline during reading and checks bytes after completion. An uncancellable read can continue in the background after timeout. It cannot extend the caller-visible wait.

**Lifecycle:** Active client instances register in `activeClients`. Calling `destroy()` stops the cache timer, clears cached entries, overwrites credentials in memory, and removes the client from `activeClients`. Process signal handlers (`exit`, `SIGINT`, `SIGTERM`) are disabled by default (`registerProcessHandlers: false`, SEC #8). The CLI enables `registerProcessHandlers: true` in `src/cli.ts`.

Enabled handlers destroy every active client. `SIGINT` exits with code 130; `SIGTERM` exits with code 143.
Installed handlers persist for the process lifetime. Keep registration outside `runCli`, so in-process tests do not install permanent handlers.
Library callers should call `destroy()` from their own shutdown hook.

**Output ownership:** `src/cli/output.ts` controls all CLI output. Only `src/cli.ts` can reference `process.stdout`, `process.stderr`, or `process.argv`. All other files must use the writers on `HandlerContext` (`out`, `outRaw`, `outPayload`, `err`, `errRaw`).

ESLint enforces this restriction. `createOutput` requires explicit writers, and all five `HandlerContext` writers are required.
Only `createOutput` controls `--quiet`. Pass a writer to collaborating modules instead of another quiet flag.
`outPayload` always emits the payload for `--out -`; `--quiet` suppresses only its acknowledgement.
Binary payloads trigger the TTY warning. Text payloads, including `bdd get --out -`, do not.
`tests/cli-output-ownership.test.ts` checks these rules outside `runCli`.

**ID validation:** Validate all numeric IDs as positive integers with `validateId(id, name)` from `src/validation.ts` before making any API call. Validate UUID plan-entry IDs with `validateEntryId` from `src/validation.ts`.

## Error Model

| Class                     | Thrown when                                                                     | Properties                               |
| ------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `TestRailApiError`        | HTTP, network, or protocol error, including invalid outer structure on list GET | `status`, `statusText`, `response`       |
| `TestRailPaginationError` | Invalid pagination metadata/continuation or exceeded aggregate safety limit     | `reason`, `pagesFetched`, `itemsFetched` |
| `TestRailValidationError` | Invalid configuration, ID, or parameter                                         | —                                        |
| `Error`                   | Method called after `destroy()`                                                 | —                                        |

Catch `TestRailPaginationError` before `TestRailValidationError` when you need to inspect `error.reason`.

List and page structure checks remain strict when entity-field validation is advisory.
Default list methods reject missing or scalar collections with `TestRailApiError`.
Page/all methods reject incomplete metadata, invalid links, and unsafe or non-advancing continuations with `TestRailPaginationError`.
A throwing mismatch hook runs before these decoders.

## Schema authoring conventions (`src/schemas/*.ts`)

Follow these five rules when writing Zod schemas (`src/schemas/results.ts` is the reference example):

1. **Naming**: Use `XSchema` for GET responses. Use `AddXPayloadSchema` or `UpdateXPayloadSchema` for POST request bodies. Use `AddXResponseSchema` for POST responses that differ from GET responses. Use `XEmbeddedSchema`, `XEntrySchema`, or `XConfigSchema` for nested response sub-schemas.
2. **Nullability**: Use `.nullish()` (`T | null | undefined`) on optional response fields because TestRail can return `null` or omit the key. Use `.optional()` (`T | undefined`) on optional request fields.
3. **No `.extend()` across directions**: Do not extend a response schema to create a request schema (or vice versa). Define each schema inline with `zObject()`.
4. **Separate sub-schemas**: Do not reuse response sub-schemas inside request payload schemas. Define separate request sub-schemas.
5. **Divergent write responses**: Define a separate `AddXResponseSchema` only when the observed POST response structure differs from the GET response structure (for example, `AddCaseFieldResponseSchema`).

`tests/schema-conventions.test.ts` enforces rules 2, 3, and 4 automatically. It also rejects format and length validators on responses.

Define request and response fields separately with `zObject = z.object(shape).passthrough()`. Shared inheritance can change both inferred types and unknown-field behavior. Separate result payload schemas are intentional. Define request sub-schemas such as `AddPlanEntryRunPayloadSchema` even when response fields look similar.

Use observed response differences to justify a separate write-response schema. For example, `add_case_field` returns `configs` as a JSON string; `get_case_fields` returns an array. `AddCaseFieldResponseSchema` preserves that distinction.

Do not add a rule that rejects all required response scalars. Primary keys, foreign keys, and names can be required. That rule produced false positives and missed response-wrapper errors. Use `onSchemaMismatch` to report runtime differences.

## Response validation is advisory (6.0.0)

`TestRailClientCore.parse()` uses `safeParse`. When a response does not match its Zod schema:

- The client returns the raw response data.
- The client calls `TestRailConfig.onSchemaMismatch` if configured.
- The client does not cache the mismatched response.

To enable strict fail-closed validation in the SDK, pass `onSchemaMismatch: ({ error }) => { throw handleZodError(error) }`. The hook must be synchronous; returning a Promise throws `TestRailValidationError`.

`cases.addCases()` and `cases.updateCases()` perform a second check on successful response bodies. An invalid list or envelope causes `TestRailApiError` with an indeterminate-outcome message. These writes can already have changed server state. The client must not return `[]` and encourage a duplicate write. A throwing hook runs before this second check. Never treat a hook error as proof that the write did not execute.

**List wrappers:** Use `listOf()` and `unwrapList()` (`src/modules/list.ts`) for endpoints that document a pagination wrapper. Use `listOfNested()` and `unwrapNestedList()` for `get_history_for_case`, which wraps its envelope in an outer array. These helpers accept both the documented wrapper and a bare array.

Do not build a separate envelope-only schema for a list GET. Advisory validation can return a bare array unchanged. A manual `.<key> ?? []` expression would then report zero items. Use the list helpers for bulk list-returning writes, including `addCases` and `updateCases`.

Keep `z.array(...)` for endpoints that always return bare arrays:

- `getStatuses`, `getPriorities`, `getCaseTypes`, `getTemplates`, `getCaseFields`, and `getResultFields` in `metadata.ts`.
- `getConfigurations` in `configurations.ts`.
- `addResults` and `addResultsForCases` in `results.ts`.

These endpoints do not accept envelopes. An unexpected envelope remains raw data under advisory validation, despite the declared `T[]` type.

Check the response contract before you use a list helper on a write. `update_tests` returns `{ test_ids, labels }`. It uses `UpdateTestsResponseSchema`, because a list helper would incorrectly return `[]`.

Preserve both list-wrapper checks:

1. Keep the envelope key `.nullable()`, not `.nullish()`. A missing key must fail validation. Otherwise, unrelated objects can parse as `{}` and silently become `[]`.
2. Keep the `Array.isArray` check in `unwrapList`. A scalar collection must not pass as `T[]`.

**Hook contract:** The constructor rejects a hook that is not a function. A hook that returns a thenable causes `TestRailValidationError` when a mismatch occurs. Do not use an `async` hook. Its rejected promise cannot provide synchronous strict validation. Use `handleZodError(error)` to preserve the earlier `TestRailValidationError` class; `throw error` exposes `ZodError` instead.

The private `parseAdvisory()` helper returns `{ value, matched }`. `request()` sends `cacheable: matched` to `RequestCache`. A mismatched response must never enter the cache, including `{}` from an empty successful response.

**Input validation:** Advisory validation applies only to responses. The constructor validates client configuration. `resolveBody()` in `src/cli/body.ts` validates CLI payloads. Neither input path calls `parse()`.

**Response types:** Exported response types describe the expected structure, not a runtime guarantee. `KnownResponse` removes the broad string index from `.passthrough()` schemas. Only `Case`, `Test`, and `Result` provide `[custom_*]: unknown`. Narrow each value before use. The nested `custom_fields` container remains deprecated.

Stable fields include `Test.refs_data`, `Test.case_title`, `Result.case_title`, and `Result.case_refs`. Schemas also include case/result field system flags, writable case-field indexing, and recursive milestone children. Use observed responses as well as documentation when you change schemas.

## Constants (`src/constants.ts`)

Read all constant values directly from `src/constants.ts`. Do not duplicate constant values in documentation.

Constants are grouped by transport/retry, cache, rate limit, pagination, response bodies, stdin/file input, and CLI diagnostics.
`src/upload-source.ts` owns both multipart field insertion and stream wrapping.
`MULTIPART_FIELD_NAME` remains exported because tests build `FormData` objects for `ownUploadStreams`.

## Tests

Shared test helpers live in `tests/helpers.ts`. Use the test output for current test counts.

| File                                | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `tests/client-endpoints.test.ts`    | Endpoint methods and CRUD operations                                    |
| `tests/client-features.test.ts`     | Cache, rate limiter, retry logic, and lifecycle                         |
| `tests/client-edge-cases.test.ts`   | Edge cases, signal handlers, and error paths                            |
| `tests/client-projects.test.ts`     | Project CRUD operations                                                 |
| `tests/client-sections.test.ts`     | Section CRUD operations                                                 |
| `tests/cli.test.ts`                 | In-process CLI tests: dispatch, auth, formatting, and exit codes        |
| `scripts/package-smoke.ts`          | Packed tarball and CLI binary smoke tests                               |
| `tests/cli-helpers.test.ts`         | Unit tests for CLI helper functions                                     |
| `tests/payload-schemas.test.ts`     | Zod write-payload schema tests                                          |
| `tests/exports.test.ts`             | Public API exports and class hierarchy                                  |
| `tests/performance.test.ts`         | Concurrent request and throughput tests                                 |
| `tests/utils.test.ts`               | `base64Encode` and `sleep` tests                                        |
| `tests/body-limits.test.ts`         | Response-body byte limit and time limit tests                           |
| `tests/advisory-validation.test.ts` | Advisory response validation, `onSchemaMismatch`, and strict mode tests |

## Common Tasks

**Add API endpoint:**

1. Add the response Zod schema and inferred type to `src/schemas/{domain}.ts`.
2. Re-export them from `src/schemas.ts`.
3. For a write endpoint, add a payload schema in the same domain file.
4. Add the method to its domain module in `src/modules/`. Do not add a flat facade wrapper.
5. Validate numeric IDs with `validateId(id, 'paramName')` from `../validation.js` before any request.
6. For UUID plan-entry IDs, use `validateEntryId`.
7. Call `this.client.request<ReturnType>({ method, endpoint, schema, body, responseKind?, intent? })`.
   Omit `intent` for standard requests. Retry policy comes from the request structure.
8. Export public schemas and types from `src/index.ts`.
9. Add unit tests to the matching `tests/client-*.test.ts` file.
10. Add the CLI command and its handler.
11. Add a numbered recipe with `<!-- recipe-for: resource:action -->` in `skill/reference/recipes.md`.
12. For a paginated endpoint, register it in `src/cli/metadata/paginated-endpoints.ts`.
13. Regenerate the codemap, skill, mapping, and agent instructions with their `npm run` commands.
14. Run `npm run verify`.

**Add CLI write action:**

1. If needed, add a Zod payload schema with `zObject()` in `src/schemas/{domain}.ts`.
2. Create the handler with `createWriteHandler` or `createDestructiveHandler` from `src/cli/write-handler-factory.ts`.
3. Export the handler from `src/cli/handlers/{resource}-write.ts`.
4. Add an `ActionSpec` entry, including `handler`, to `src/cli/metadata/{resource}.ts`.
5. Set `softMode: 'optional'` only if the endpoint supports `soft=1`.
6. Add handler tests for success, dry-run, invalid body, and invalid path parameters in `tests/cli-write-handlers.test.ts`.
7. Add an in-process CLI test in `tests/cli.test.ts`.
8. Regenerate the codemap, skill, mapping, and agent instructions.
9. Run `npm run verify`.

The factories handle parameter parsing, body validation, dry-run, and destructive checks.
Dispatch and help read `ACTIONS`; they do not need separate command lists.

**Add CLI attachment action (binary file I/O):**

1. Confirm that the SDK method exists in `src/modules/attachments.ts`.
2. Add the handler to `src/cli/handlers/attachment.ts` or `src/cli/handlers/attachment-write.ts`.
3. For uploads, use `setupUpload()` for dry-run previews and file-descriptor streaming.
4. For downloads, use `resolveOut()` from `src/cli/file-output.ts`.
5. Add the `ActionSpec` entry, including its handler, in `src/cli/metadata/attachments.ts`.
6. Select `fileInput: true` for uploads, `fileOutput: true` for downloads, or `destructive: true` for deletion.
7. For deletion, check `ctx.confirmDestructive` after the dry-run branch.
8. Add tests for success, dry-run, missing flags, and invalid parameters in `tests/cli-attachment-handlers.test.ts`.
9. For deletion, test the `--yes` gate and dry-run precedence.
10. Add an in-process CLI test in `tests/cli.test.ts`.
11. Regenerate the codemap, skill, mapping, and agent instructions.
12. Run `npm run verify`.

Keep `attachment delete` as a custom handler because attachment IDs can be integers or UUIDs.

**Destructive actions:** Set `destructive: true` in the command metadata. All destructive CLI actions require both `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`.
`--dry-run` bypasses both gates and previews the action locally without calling the API.
`--soft` sends `soft=1` to the server to preview affected counts without deletion.
`--dry-run --yes --soft` returns a local preview with `soft: true` and sends no request.

**Add text-response endpoint:** Call `this.client.request<string>({ method, endpoint, responseKind: 'text' })`. Text responses return `Promise<string>` and bypass the cache. Use `resolveOut()` and the existing safe-write path for CLI file output. Follow the BDD handler pattern.

**Change caching:** Keep key selection and response cacheability in `src/client-core.ts`. Change storage, request sharing, invalidation, and cleanup through `RequestCache.resolve()` in `src/request-cache.ts`.

**Change retry or rate limits:** Edit defaults in `src/constants.ts`. Configuration overrides use `TestRailConfig.rateLimiter`, `maxRetries`, and `timeout`.

## DO NOT

- Do not add runtime dependencies other than Zod.
- Do not use `any` (use `unknown` and narrow the type).
- Do not mutate objects in place (return new objects).
- Do not hardcode numeric constants (use `src/constants.ts`).
- Do not call `request()` before validating IDs.
- Do not skip `npm run typecheck` or `npm run typecheck:ts6` before committing.
