# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@dichovsky/testrail-api-client` is a type-safe TypeScript client and `testrail` CLI for the [TestRail REST API](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference). It has one runtime dependency: Zod. It uses ESM only.

This package supports [TestRail 10.7.0 (Default 1021)](https://support.testrail.com/hc/en-us/articles/52231138481684-TestRail-10-7-0-Default-1021) and API additions from versions 10.4 through 10.7.
Case and BDD lists accept repeated `refs[]` filters and older scalar `refs` queries.
The client supports BDD, case-title, and version discovery, result editing, dynamic filters, and label management.
It also supports current run, plan, and test filters and scheduling fields.

Read the [TestRail 10.7.0 compatibility audit](https://github.com/dichovsky/testrail-api-client/blob/main/docs/TESTRAIL-10.7.0-COMPATIBILITY.md) for source documentation, endpoint counts, resolved schema mismatches, and upstream documentation notes.

## Install

```bash
npm install @dichovsky/testrail-api-client
```

This package requires Node.js 26 or newer. CI tests Node 26 on Linux, Windows, and macOS. The `.nvmrc` file selects Node 26 for development. Other major versions satisfy the engine range but are outside the CI matrix.

The package smoke test verifies published declaration files with both TypeScript 6 and TypeScript 7. The build and primary type check use native TypeScript 7. Code generators and typed lint rules use the TypeScript 6 compiler API.

## Repository verification

Run `npm ci` to install dependencies.
Run `npm run verify` to execute the full local verification suite:

1. Build `dist/`.
2. Run TypeScript 7 and TypeScript 6 type checks.
3. Run ESLint, Prettier, and generated-file drift checks.
4. Run the test suite with coverage thresholds.
5. Smoke-test the packed npm tarball and CLI executable.

`npm test` runs only the Vitest suite. Because `.npmrc` disables implicit lifecycle scripts, always run `npm run verify` explicitly. See [the release guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/RELEASING.md) for the release fuzz and security audit checks.

## Quick start (SDK)

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!, // https://your-domain.testrail.io
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
});

try {
    const project = await client.projects.getProject(1);
    console.log(project.name);
} finally {
    client.destroy(); // Stop timers, clear cache, and zero credentials
}
```

See [`docs/API-MAPPING.md`](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) for the endpoint-to-method table and [`CODEMAP.md`](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md) for every symbol signature and `file:line` location.

### Write example

The SDK types write payloads from the exported Zod schemas at compile time. The SDK does not validate write payloads at runtime. The CLI validates all write payloads at runtime with Zod.
For dynamic SDK input, call `.parse(input)` on the exported payload schema before the write.

This example creates a run and adds a result:

```typescript
const run = await client.runs.addRun(5, {
    suite_id: 12,
    name: 'CI build',
    include_all: false,
    case_ids: [42, 43, 44],
});

await client.results.addResultForCase(run.id, 42, { status_id: 1, comment: 'Passed' });
```

On a new result, `status_id` is optional. A new result requires at least one of `status_id`, `comment`, or `assignedto_id`. The CLI enforces this requirement at runtime before sending the request.

## CLI quick tour

This package provides the `testrail` CLI binary. Set environment variables for authentication. Then run read, write, or destructive commands:

```bash
export TESTRAIL_BASE_URL="https://your-domain.testrail.io"
export TESTRAIL_EMAIL="you@example.com"
export TESTRAIL_API_KEY="…"                       # Never pass the API key on argv

npx testrail project list                              # Read (outputs JSON to stdout)
npx testrail run add 5 --data '{"name":"CI build","include_all":true}'   # Write (validated by Zod)

# Destructive commands require BOTH --yes and TESTRAIL_ALLOW_DESTRUCTIVE=1
TESTRAIL_ALLOW_DESTRUCTIVE=1 npx testrail run close 100 --yes
```

Use `TESTRAIL_API_KEY` when possible. If you cannot use an environment variable, pipe the key through standard input: `echo "$KEY" | npx testrail ... --api-key-stdin`. Because `--api-key-stdin` reads standard input, pass write payloads with `--data` or `--data-file`.

- Pass `--dry-run` to preview any write or delete command locally without calling the API.
- Pass `--format <json|table|yaml|csv>` to select the output format.
- Run `npx testrail <resource> --help` (for example, `npx testrail case --help`) to list commands for one resource.
- Run `npx testrail --help` to list all commands.
- Read [`skill/SKILL.md`](skill/SKILL.md), [`skill/reference/commands.md`](skill/reference/commands.md), and [`skill/reference/recipes.md`](skill/reference/recipes.md) for the complete command reference and usage recipes.

String flags require an explicit value. The CLI rejects `--filename --dry-run` before execution because `--filename` consumes `--dry-run` as its value. To pass a value that begins with `--`, use the inline syntax `--filter=--all`. Boolean flags do not accept values: pass `--dry-run`, not `--dry-run=true`.

Attachment and BDD download commands write only to regular files when you pass `--out <path>`. Pass `--force` to overwrite an existing regular file. The CLI rejects symlinks, FIFOs, and device files such as `/dev/null`. To discard downloaded content, write to standard output with `--out -` and redirect standard output to `/dev/null`:

```bash
testrail attachment get 42 --out - > /dev/null
```

The CLI writes the JSON acknowledgement to `stderr`. Use the same `--out -` pattern with `testrail bdd get <case-id>`.

## Features

| Capability         | Description                                                                                                          | Reference                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Response caching   | In-process LRU cache with TTL for GET requests; any write clears the cache                                           | [docs/ARCHITECTURE.md §2.3](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#23-request-cache)                         |
| Bounded pagination | Return one page with metadata or collect all pages within explicit safety limits                                     | [Pagination](#pagination)                                                                                                                             |
| Rate limiting      | Sliding-window limiter (default: 100 requests per 60 seconds); rejects excess calls before fetch                     | [docs/ARCHITECTURE.md §2.2](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#22-http-pipeline-requestt)                |
| Retry with backoff | Exponential backoff with `Retry-After`; GET retries 5xx/429/network, JSON writes retry 429 only, uploads never retry | [docs/ARCHITECTURE.md §2.4](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#24-retry-policy-the-get--write-asymmetry) |
| SSRF guard         | Pins validated DNS addresses per connection, blocks private hosts, and rejects HTTP redirects                        | [docs/ARCHITECTURE.md §2.5](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#25-ssrf-guard--two-layers)                |
| Response-body caps | Enforces a byte limit and a wall-clock time limit on every response body                                             | [docs/ARCHITECTURE.md §2.2](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#22-http-pipeline-requestt)                |
| Streaming uploads  | Streams attachment uploads from disk without buffering whole files in memory                                         | [docs/ARCHITECTURE.md §2.4](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#24-retry-policy-the-get--write-asymmetry) |
| CLI                | `testrail` executable for read, write, and destructive actions with four output formats                              | [skill/SKILL.md](skill/SKILL.md)                                                                                                                      |
| AI-agent skill     | Bundled Claude Code skill; run `npx testrail install-skill` to install                                               | [skill/SKILL.md](skill/SKILL.md)                                                                                                                      |

Run `npx testrail install-skill` to install the skill into `.claude/skills/testrail-cli/`. Add `--global` to install it into `~/.claude/skills/testrail-cli/`. After you upgrade the package, run `npx testrail install-skill --force` to update the installed skill files.

> **Note on rate-limit headers:** TestRail Cloud does not send `Retry-After` or `X-RateLimit-*` headers under normal load. The client's `Retry-After` parser activates only when the server sends that header (for example, during heavy rate limiting). The client's local sliding-window `rateLimiter` (default: 100 requests per 60 seconds) is the primary rate control. Adjust `rateLimiter` to match your TestRail quota.

## Configuration

Only `baseUrl`, `email`, and `apiKey` are required:

```typescript
const client = new TestRailClient({
    baseUrl: 'https://your-domain.testrail.io',
    email: 'you@example.com',
    apiKey: 'your-api-key',

    timeout: 30000, // Request timeout in milliseconds
    maxRetries: 3, // Retry attempts for retryable failures
    enableCache: true, // Cache GET responses
    cacheTtl: 300000, // Cache TTL in milliseconds
    rateLimiter: { maxRequests: 100, windowMs: 60000 },
});
```

| Option                    | Type                | Default            | Description                                             |
| ------------------------- | ------------------- | ------------------ | ------------------------------------------------------- |
| `baseUrl`                 | `string`            | **required**       | HTTPS TestRail URL (HTTP requires `allowInsecure`)      |
| `email`                   | `string`            | **required**       | TestRail account email                                  |
| `apiKey`                  | `string`            | **required**       | TestRail API key                                        |
| `timeout`                 | `number`            | `30000`            | Per-attempt timeout in ms (max 5 min); includes DNS     |
| `maxRetries`              | `number`            | `3`                | Max retry attempts (integer 0–10)                       |
| `enableCache`             | `boolean`           | `true`             | Enable in-memory caching for GET requests               |
| `cacheTtl`                | `number`            | `300000`           | Cache time-to-live in milliseconds                      |
| `cacheCleanupInterval`    | `number`            | `60000`            | Cleanup interval in ms (0–2,147,483,647; 0 disables)    |
| `maxCacheSize`            | `number`            | `1000`             | Maximum number of entries in the cache                  |
| `rateLimiter`             | `RateLimiterConfig` | 100 / 60s          | `{ maxRequests, windowMs }` sliding window              |
| `allowInsecure`           | `boolean`           | `false`            | Allow cleartext HTTP connections                        |
| `allowPrivateHosts`       | `boolean`           | `false`            | Allow private, loopback, and link-local hosts           |
| `maxJsonResponseBytes`    | `number`            | `10485760`         | Max JSON or text response body size (10 MiB; max 1 GiB) |
| `maxBinaryResponseBytes`  | `number`            | `104857600`        | Max binary response body size (100 MiB; max 1 GiB)      |
| `bodyTimeout`             | `number`            | `= timeout`        | Max time to read the response body (0 disables)         |
| `registerProcessHandlers` | `boolean`           | `false`            | Register `exit`/`SIGINT`/`SIGTERM` cleanup handlers     |
| `fetch`                   | `typeof fetch`      | `globalThis.fetch` | Custom fetch implementation; must honor the dispatcher  |
| `dnsLookup`               | `function`          | system DNS         | Custom DNS resolver for SSRF checks and IP pinning      |
| `onSchemaMismatch`        | `function`          | none (silent)      | Callback invoked when a response fails schema parsing   |

Library callers should leave `registerProcessHandlers` set to `false` and call `client.destroy()` during application shutdown. The `testrail` CLI enables `registerProcessHandlers` automatically.

### Operation settlement tracking

Use `trackOperation` to wait for network requests, streams, and cleanup tasks to finish.
Wait for settlement before you release a concurrency slot or delete temporary files:

```typescript
const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 1000 }));
try {
    const projects = await operation.result;
    console.log(projects.length);
} finally {
    await operation.settled;
    // Release the concurrency slot or temporary files here.
}
```

- `operation.result` resolves or rejects with the callback's normal return value, error, or timeout.
- `operation.settled` always resolves after the callback and all associated client tasks finish.
  These tasks include DNS resolution, HTTP requests, response body reads, stream cancellation, upload streams, retries, and shared requests.
- A timeout can reject `operation.result` while `operation.settled` is still waiting for transport cleanup to complete.
- `trackOperation` does not cancel operations. `client.destroy()` does not abort in-flight requests or settle their handles.
- `AsyncLocalStorage` tracking starts with the first call to `trackOperation` and stays active for the lifetime of the process.
- An abort request does not release ownership. If a custom transport or cancellation task never finishes, `operation.settled` stays pending.
- Tracking includes nested operations. Return the Promise for the complete callback workflow. Tracking excludes application timers that the callback does not await.
- A request started before the first `trackOperation` call can share its result. Tracking cannot include its cleanup after that result.

Multipart uploads also use a separate asynchronous context to identify native transport requests, even without `trackOperation`.
Processes that do not track operations or upload files avoid the cost of this context.

When a multipart upload aborts, the client waits for transport completion evidence before it closes the file stream normally.
The pinned dispatcher or native request diagnostics can provide this evidence.
A custom or globally replaced `fetch` function might provide neither. In that case, the client destroys the upload stream with an error.
This prevents an ignored abort from sending a truncated file with a valid closing multipart boundary.
Pending source reads and cancellation tasks delay `operation.settled` on every path.

### Cache isolation and memory

`RequestCache` copies cached values with `structuredClone` on both cache writes and cache reads. Changes to a returned object never modify the cached entry.
Copy cost increases with payload size. For example, a cache hit on a 250-case `getCases()` page copies the complete payload.
`maxCacheSize` limits the number of entries, not their byte size.
If your workload caches large responses, reduce `maxCacheSize` or `maxJsonResponseBytes` (default: 10 MiB).

### Report execution

`reports.runReport()` and `reports.runCrossProjectReport()` generate a new report on every call.
These endpoints use HTTP GET but bypass cache reads, cache writes, and in-flight request sharing.
The client retries HTTP `429` responses and follows `Retry-After`. The server rate limiter rejects these requests before execution.
The client never retries `5xx` responses or network errors. The report might already exist, and the template might already have sent email.
Inspect an uncertain outcome before you start another report request.

### SSRF protection and private hosts

By default, the client blocks these address ranges:

- Private, loopback, link-local, multicast, and reserved IPv4 addresses.
- CGNAT (`100.64.0.0/10`) and benchmarking (`198.18.0.0/15`) addresses.
- IPv4-mapped IPv6 addresses from these ranges.
- IPv6 transition ranges, including 6to4 and NAT64 prefixes `64:ff9b::/96` and `64:ff9b:1::/48`.

The client applies the same blocklist to URL literals and DNS answers.
The default transport connects directly to validated IP addresses without a second DNS lookup.
It keeps the original hostname for TLS certificate verification and SNI.
Custom `fetch` functions must follow the supplied Node dispatcher or enforce equivalent destination checks, abort signals, and manual redirects.
For trusted on-premise servers on private networks, set `allowPrivateHosts: true`.
This option disables DNS host validation and connection pinning.
See [docs/ARCHITECTURE.md §2.5](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#25-ssrf-guard--two-layers) for the complete address list.

Concurrent GET requests share an in-flight request only when their effective header and body timeouts match. Completed cache entries remain shared across timeout views.

### Custom DNS resolvers

Every answer from `dnsLookup` must include a valid IP address string and a matching numeric `family` (`4` for IPv4 or `6` for IPv6). Missing families, `family: 0`, or mismatched families fail with `TestRailValidationError` before the client sends the request:

```typescript
import { lookup } from 'node:dns/promises';

const client = new TestRailClient({
    ...config,
    dnsLookup: (hostname) => lookup(hostname, { all: true }),
});
// Static IPv4 example:
// dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }]
// Static IPv6 answers must use family: 6.
```

### Proxies and custom certificate authorities

When `allowPrivateHosts` is `false` (the default), the client passes a dedicated per-request dispatcher to `fetch`. This dispatcher bypasses global Undici dispatchers (`setGlobalDispatcher()`), `NODE_USE_ENV_PROXY=1`, `--use-env-proxy`, `http.globalAgent`, and `https.globalAgent`.
This breaks applications that depend on global `ProxyAgent`, `EnvHttpProxyAgent`, or custom TLS settings.
Node documents the [per-request dispatcher](https://nodejs.org/api/globals.html#custom-dispatcher) and [global proxy configuration](https://nodejs.org/api/http.html#built-in-proxy-support).

To trust a custom certificate authority (CA) on direct connections, set [`NODE_EXTRA_CA_CERTS`](https://nodejs.org/api/cli.html#node_extra_ca_certsfile) to your PEM bundle path before starting Node.js. This environment variable preserves TLS certificate verification, hostname checks, and DNS pinning.
The client does not copy the `ca` setting from a custom global agent.

To route requests through an HTTP proxy:

1. Configure the proxy to allow only your TestRail origin and to block private and link-local destination IP addresses.
2. Pass a custom `fetch` function that selects your proxy dispatcher. Keep `init.signal` and `redirect: 'manual'` unchanged:

```typescript
import { ProxyAgent } from 'undici'; // Installed by your application

const approvedOrigin = 'https://your-domain.testrail.io';
const proxy = new ProxyAgent('https://approved-proxy.example:8443');
const proxyFetch: typeof globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.origin !== approvedOrigin) throw new Error('Unexpected TestRail origin');
    return globalThis.fetch(input, { ...init, dispatcher: proxy });
};
const client = new TestRailClient({
    ...config,
    baseUrl: approvedOrigin,
    allowPrivateHosts: false,
    fetch: proxyFetch,
});
try {
    console.log(await client.projects.getProjects());
} finally {
    client.destroy();
    await proxy.close();
}
```

The proxy performs the final DNS resolution and must enforce destination IP checks.
The local DNS check cannot validate a second lookup at the proxy. An origin allowlist alone does not prevent DNS rebinding.
If the proxy cannot enforce this policy, the package has no safe automatic proxy fallback.
Use `allowPrivateHosts: true` only for trusted private destinations with separate network controls.

## Pagination

The 24 paginated endpoints provide three methods per resource:

- `get*()` sends one request and returns the item array from that response.
- `get*Page()` sends one request and returns a discriminated `Page<T>` object. Envelope responses include `offset`, `limit`, `size`, and `_links`.
- `getAll*()` follows `_links.next` across pages and returns a single combined array:

```typescript
const firstResponse = await client.runs.getRuns(5); // Run[] from one response
const page = await client.runs.getRunsPage(5, { limit: 25, offset: 50 }); // Page<Run>
const all = await client.runs.getAllRuns(5, { pageSize: 100, maxItems: 10_000 }); // Run[] across pages
```

How bounded pagination works:

- The client reads only the validated `offset` and optional `limit` from `_links.next` and rebuilds the endpoint path locally. It never follows the host or path inside `_links.next`.
- Legacy bare-array responses return as a single terminal page.
- `getAll*()` bypasses cache reads, cache writes, and request coalescing so it never mixes pages from different snapshots.
- `get*Page()` caches responses in a separate strict-schema namespace (`PAGE:PARSED:GET:{endpoint}`).
- `getAll*()` never returns partial results. Default limits are `pageSize: 250`, `startOffset: 0`, `maxPages: 100`, `maxItems: 25_000`, `maxDurationMs: 300_000` (5 minutes), and `maxBytes: 104_857_600` (100 MiB). Maximum ceilings are `pageSize: 250`, `maxDurationMs: 300_000`, and `maxBytes: 1_073_741_824` (1 GiB).
- If a page is malformed or exceeds a limit, the client throws `TestRailPaginationError`.
  The error includes `reason`, `pagesFetched`, and `itemsFetched`.
  Reasons are `max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, or `non_progress`.

Each endpoint descriptor declares allowed operation names. The shared executor rejects undeclared operations.
Aggregate reads use only declared filters and public aggregate controls.
They ignore injected `limit` and `offset`, internal collector fields, and unrelated properties.
The separate page cache prevents a permissive one-response wrapper from affecting strict `Page<T>` validation.
The byte limit measures UTF-8 serialized items.

Paginated endpoints include these resources:

- Cases, case history, and project BDDs.
- Projects, suites, sections, plans, runs, tests, and milestones.
- The three result lists and labels.
- Shared steps and shared-step history.
- Case, run, and plan attachments.
- Datasets, variables, roles, groups, and case statuses.

Six endpoints use response-driven pagination: shared-step history, datasets, variables, roles, groups, and case statuses.
These endpoints do not accept caller-supplied `pageSize` or `startOffset`.
Test attachments, plan-entry attachments, users, and ordinary metadata, configuration, and report lists return one response only.
Some one-response methods accept `limit` and `offset`. This does not mean that they support `get*Page()` or `getAll*()`.

In the CLI:

- Default mode outputs the item array from one response.
- `--page` outputs the `Page<T>` object.
- `--all` collects all pages and accepts `--page-size`, `--start-offset`, `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes`.
- Do not combine `--all` with `--page`, `--limit`, or `--offset`.
- Aggregate controls require `--all`. Response-driven endpoints reject `--page-size` and `--start-offset`.

## Advisory response validation

Starting in version 6.0.0, **Zod response validation is advisory**.
If an entity field does not match its schema, the client normally returns the raw response unchanged.
It also calls `onSchemaMismatch` if configured. A throwing hook runs before the list and page decoders.

With a non-throwing hook, structural errors still throw these errors:

- `TestRailApiError` for malformed default lists.
- `TestRailPaginationError` for malformed pages or aggregate reads.
- `TestRailApiError` for malformed responses from `cases.addCases()` or `cases.updateCases()`. The message says the write outcome is indeterminate.

These writes might have changed server state. Never interpret a hook error as proof that a write did not execute.

In the CLI:

- By default, the CLI writes up to 10 unique schema-mismatch warnings to `stderr`, then reports the suppressed count.
- Warnings contain the HTTP method, CLI resource and action, Zod issue codes, and paths with every segment masked as `*`.
- Warnings exclude endpoints, field names, record keys, issue messages, and raw responses.
- Pass `--strict-responses` or set `TESTRAIL_STRICT_RESPONSES=1` to exit with code `1` on the first schema mismatch.
- Pass `--quiet` to suppress advisory warnings and normal output.

In strict mode, read mismatches throw `TestRailValidationError`.
Write mismatches throw `TestRailApiError` with an indeterminate-outcome message and no raw response. Do not retry these writes automatically.
One-shot commands return no mismatched value. Aggregate reads return no partial array.
`run watch` can emit successful earlier polls before a later mismatch; the CLI cannot retract these events.
`TESTRAIL_STRICT_RESPONSES` accepts only `1`, `0`, an empty value, or no value. Other values fail before authentication or network requests.
The flag accepts no value: `--strict-responses=true` is invalid.

Key rules for response types and hooks:

- **Response types describe expected shapes, not runtime guarantees.** A field typed `number` can contain a different server value.
  Response types can widen in any release to match observed responses. Pin an exact version if you need fixed types.
- Narrow `unknown` custom fields (such as `test['custom_browser']` on `Case`, `Test`, and `Result`) before use.
- **Caller inputs still fail closed.** Constructor config validation and CLI write payload validation reject invalid input before any network call.
- **`onSchemaMismatch` must be synchronous.** Returning a Promise throws `TestRailValidationError`. Do not log raw `endpoint` query strings or raw `data` bodies if they can contain personal data:

```typescript
// Log schema drift safely without exposing sensitive values:
const client = new TestRailClient({
    ...config,
    onSchemaMismatch: ({ method, endpoint, error }) =>
        log.warn({
            method,
            operation: endpoint.replace(/[\/&].*$/, ''),
            issues: error.issues.map(({ code, path }) => ({
                code,
                path: path.length === 0 ? '$' : `$.${path.map(() => '*').join('.')}`,
            })),
        }),
});

// Or enforce strict fail-closed validation (for example, in CI):
import { handleZodError } from '@dichovsky/testrail-api-client';

const strict = new TestRailClient({
    ...config,
    onSchemaMismatch: ({ error }) => {
        throw handleZodError(error);
    },
});
```

Public response types come from declared Zod shapes. Runtime `.passthrough()` does not add `[key: string]: unknown` to every entity.
`Case`, `Test`, and `Result` support flat custom fields. Their older `custom_fields` container remains deprecated for compatibility.
Version 6.0 added `Test.refs_data`, `Test.case_title`, `Result.case_title`, `Result.case_refs`, `CaseField.is_indexed`, `CaseField.is_system`, and `ResultField.is_system`.
Milestone children use recursive types.

TestRail responses can differ from its documentation. Examples include a bare array instead of `{step_history}` and integer `0` for `mfa_required`.
The documentation also placed `is_untested` on a different endpoint. Strict page validation could reject 250 valid rows because of one unmodelled field.

## Error handling

The client exports three main error classes:

```typescript
import { TestRailApiError, TestRailPaginationError, TestRailValidationError } from '@dichovsky/testrail-api-client';

try {
    await client.projects.getProject(999);
} catch (error) {
    if (error instanceof TestRailApiError) {
        // HTTP, network, or protocol error
        console.error(error.status, error.statusText, error.response);
    } else if (error instanceof TestRailPaginationError) {
        // Pagination limit exceeded or malformed page/continuation
        console.error(error.reason, error.pagesFetched, error.itemsFetched);
    } else if (error instanceof TestRailValidationError) {
        // Invalid configuration, ID, or parameter
        console.error(error.message);
    }
}
```

- `TestRailApiError` provides `status`, `statusText`, and `response`. Raw bodies appear only in `response`, never in `message`.
- `TestRailPaginationError` extends `TestRailValidationError` and adds `reason`, `pagesFetched`, and `itemsFetched`. Catch `TestRailPaginationError` before `TestRailValidationError`.
- `TestRailValidationError` indicates invalid caller input (configuration, IDs, or filter parameters).
- Calling any method after `client.destroy()` throws a standard `Error`.

Numeric list filters also validate IDs before requests.
Arrays such as `createdBy`, `statusId`, and `milestoneId` must contain positive integers. Invalid values throw `TestRailValidationError` locally.

### CLI diagnostic files

To capture structured error details from a CLI command, pass `--diagnostic-file <new-path>` on the original command invocation:

```bash
testrail case-field add --data-file field.json --diagnostic-file ./field-error.json
```

How `--diagnostic-file` works:

- Before the command handler runs, the CLI reserves a new regular file with `0600` permissions. Its directory must already exist.
- The CLI rejects existing paths, symlinks, and destinations shared with `--out`.
- Windows rejects the flag before stdin or authentication work because the client cannot establish an equivalent private ACL.
- `--dry-run` ignores the destination on every platform. It does not create a diagnostic file or validate or modify an existing destination.
- Normal completion removes an unused reservation. Process exit also attempts cleanup, including `SIGINT` and `SIGTERM`.
- Permission or I/O failures can leave an empty reservation. File existence alone does not establish an API failure.
- Early argument and authentication failures produce no diagnostic file.

On macOS, the client clears inherited ACLs on a private staging directory before file creation.
It then reserves the requested destination with an exclusive link to that file.
Bounded `chmod` calls secure the staging directory and remove ACLs added to the file before diagnostic output.
The destination directory keeps its ACL. If these checks fail, the client rejects the destination or omits the diagnostic record.

Failures after reservation produce a `version: 1` JSON record with these fields:

| Field              | Meaning                                                      |
| ------------------ | ------------------------------------------------------------ |
| `kind`             | Error category                                               |
| `status`           | HTTP status, when available                                  |
| `operationOutcome` | `"not_dispatched"` or `"failed_or_indeterminate"`            |
| `server`           | Validation details with `state`, `messages`, and `truncated` |

`"not_dispatched"` indicates a known failure before the command handler starts, such as invalid client configuration.
After the handler starts, the outcome is `"failed_or_indeterminate"`. The error class alone cannot prove whether an API write executed.

Only recognized structured validation details enter the record.
The CLI redacts known credentials and common encoded variants, and omits sensitive nested keys.
The record excludes raw bodies, headers, request payloads, and stack traces.
`messages` contains nonblank redacted strings in encounter order, without object keys or field-to-message mappings.
Safe validation text keeps the server's original escaping.

Input processing has a 64 KiB limit, and the record has a 16 KiB limit.
Malformed, non-JSON, or oversized bodies produce a safe omission state.
If extracted messages exceed the record limit, the CLI keeps the first complete redacted messages and sets `truncated: true`.
Diagnostic or cleanup failures preserve the command's exit status and produce a warning. `--quiet` suppresses these warnings.
Diagnostics do not change default output, requests, or retries.
Never repeat a failed write only to generate a diagnostic file.

After you create a custom case field, TestRail can take time to show the field in `get_case_fields`.
Read the [case-field readiness guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CASE-FIELD-READINESS.md) for bounded polling with cancellation.
Keep the creation result and verify scope and options before dependent case writes.

## Links

- [CHANGELOG.md](https://github.com/dichovsky/testrail-api-client/blob/main/CHANGELOG.md) — Release history and migration notes
- [docs/RELEASING.md](https://github.com/dichovsky/testrail-api-client/blob/main/docs/RELEASING.md) — Release checklist for maintainers
- [docs/API-MAPPING.md](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) — Endpoint, client method, CLI command, and skill recipe coverage table
- [CODEMAP.md](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md) — Symbol index with `file:line` links
- [docs/ARCHITECTURE.md](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md) — System architecture and design invariants
- [AGENTS.md](https://github.com/dichovsky/testrail-api-client/blob/main/AGENTS.md) — Instructions for AI coding agents

## License

MIT — see [LICENSE](LICENSE). If this package saves you time, you can [buy me a coffee](https://buymeacoffee.com/dichovsky).
