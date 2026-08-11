# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe TypeScript client and `testrail` CLI for the [TestRail REST API](https://support.testrail.com/hc/en-us/articles/7077819069460-Using-the-API), with a single runtime dependency: Zod. ESM only.

## Install

```bash
npm install @dichovsky/testrail-api-client
```

Requires Node.js 20.19+ (or 22.13+ / 24+).

## 30-second example

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
    client.destroy(); // release timers, clear cache, zero the credential
}
```

The client surfaces the supported TestRail REST API endpoints. See [`docs/API-MAPPING.md`](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) for the endpoint-to-method matrix and [`CODEMAP.md`](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md) for exact signatures and `file:line` locations of every symbol.

### Write example

With a live `client` instance, write payloads are Zod-validated before the request:

```typescript
const run = await client.runs.addRun(5, {
    suite_id: 12,
    name: 'CI build',
    include_all: false,
    case_ids: [42, 43, 44],
});

await client.results.addResultForCase(run.id, 42, { status_id: 1, comment: 'Passed' });
```

## CLI quick tour

The package ships a `testrail` binary. Authenticate with environment variables, then read, write, or delete:

```bash
export TESTRAIL_BASE_URL="https://your-domain.testrail.io"
export TESTRAIL_EMAIL="you@example.com"
export TESTRAIL_API_KEY="…"                       # never pass the key on argv

npx testrail project list                              # read (JSON to stdout)
npx testrail run add 5 --data '{"name":"CI build","include_all":true}'   # write (Zod-validated)

# Destructive: needs BOTH the per-invocation --yes flag AND the process-wide env unlock
TESTRAIL_ALLOW_DESTRUCTIVE=1 npx testrail run close 100 --yes
```

Prefer `TESTRAIL_API_KEY`. If an environment variable is not an option, pipe the key with `echo "$KEY" | npx testrail ... --api-key-stdin`. That flag consumes stdin, so write bodies must come from `--data` or `--data-file`.

`--dry-run` previews any write or delete client-side with no API call. Output format is selectable with `--format <json|table|yaml|csv>`. See [`skill/SKILL.md`](skill/SKILL.md) for the complete command surface and recipes.

## Features

| Capability         | What it does                                                                         | Documented in                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Response caching   | GET-only in-process LRU cache with TTL; any write invalidates it                     | [docs/ARCHITECTURE.md §2.3](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#23-lru-cache)                             |
| Bounded pagination | Preserve page metadata or collect every page with explicit safety limits             | [Pagination](#pagination)                                                                                                                             |
| Rate limiting      | Sliding-window limiter (default 100 req/60s); rejects over-limit before fetch        | [docs/ARCHITECTURE.md §2.2](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#22-http-pipeline-requestt)                |
| Retry with backoff | Exponential backoff with `Retry-After`; GET retries 5xx/429/network, writes only 429 | [docs/ARCHITECTURE.md §2.4](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#24-retry-policy-the-get--write-asymmetry) |
| SSRF guard         | Per-request DNS pin, private-host blocking, manual-redirect rejection                | [docs/ARCHITECTURE.md §2.5](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#25-ssrf-guard--two-layers)                |
| Response-body caps | Byte ceiling + wall-clock deadline on every body read                                | [docs/ARCHITECTURE.md §2.2](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#22-http-pipeline-requestt)                |
| Streaming uploads  | Attachment uploads stream from disk, so large files don't buffer in heap             | [docs/ARCHITECTURE.md §2.4](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md#24-retry-policy-the-get--write-asymmetry) |
| CLI                | `testrail` binary: read / write / destructive actions, four output formats           | [skill/SKILL.md](skill/SKILL.md)                                                                                                                      |
| AI-agent skill     | Bundled Claude Code skill; install it with `npx testrail install-skill`              | [skill/SKILL.md](skill/SKILL.md)                                                                                                                      |

For a project-scoped Claude Code installation, run `npx testrail install-skill`. Add `--global` to install it under `~/.claude/skills/`.

> **Note on rate-limit headers.** A live-instance check found that TestRail Cloud does **not** emit
> rate-limit headers (`Retry-After`, `X-RateLimit-*`) under normal serial load — a burst of requests
> all returned `200` with no such headers. The client's `Retry-After` handling is therefore dormant in
> practice and only engages if the server starts sending the header (e.g. under heavy throttling or on
> a future TestRail version); it is fully covered by synthetic tests. The **effective** throttle is the
> client's own sliding-window limiter (`rateLimiter`, default 100 req/60s), which rejects over-limit
> requests before they leave the process — tune it to your instance's quota.

## Configuration

All options except `baseUrl` / `email` / `apiKey` are optional:

```typescript
const client = new TestRailClient({
    baseUrl: 'https://your-domain.testrail.io',
    email: 'you@example.com',
    apiKey: 'your-api-key',

    timeout: 30000, // request timeout (ms)
    maxRetries: 3, // retry attempts for retryable failures
    enableCache: true, // cache GET responses
    cacheTtl: 300000, // cache TTL (ms)
    rateLimiter: { maxRequests: 100, windowMs: 60000 },
});
```

| Option                    | Type                | Default            | Description                                          |
| ------------------------- | ------------------- | ------------------ | ---------------------------------------------------- |
| `baseUrl`                 | `string`            | **required**       | HTTPS TestRail URL; HTTP requires `allowInsecure`    |
| `email`                   | `string`            | **required**       | TestRail user email (validated format)               |
| `apiKey`                  | `string`            | **required**       | TestRail API key                                     |
| `timeout`                 | `number`            | `30000`            | Request timeout in milliseconds (max 5 minutes)      |
| `maxRetries`              | `number`            | `3`                | Max retry attempts for failed requests; integer 0-10 |
| `enableCache`             | `boolean`           | `true`             | Enable caching for GET requests                      |
| `cacheTtl`                | `number`            | `300000`           | Cache time-to-live in milliseconds                   |
| `cacheCleanupInterval`    | `number`            | `60000`            | Cache cleanup interval (0 to disable)                |
| `maxCacheSize`            | `number`            | `1000`             | Maximum number of entries in cache                   |
| `rateLimiter`             | `RateLimiterConfig` | 100 / 60s          | `{ maxRequests, windowMs }` sliding window           |
| `allowInsecure`           | `boolean`           | `false`            | Permit cleartext HTTP (credentials sent in Base64)   |
| `allowPrivateHosts`       | `boolean`           | `false`            | Permit private/loopback/link-local hosts             |
| `maxJsonResponseBytes`    | `number`            | `10485760`         | JSON/text response body cap (10 MiB; ceiling 1 GiB)  |
| `maxBinaryResponseBytes`  | `number`            | `104857600`        | Binary response body cap (100 MiB; ceiling 1 GiB)    |
| `bodyTimeout`             | `number`            | `= timeout`        | Wall-clock deadline for the body read (0 disables)   |
| `registerProcessHandlers` | `boolean`           | `false`            | Install `exit`/`SIGINT`/`SIGTERM` handlers (opt-in)  |
| `fetch`                   | `typeof fetch`      | `globalThis.fetch` | Custom `fetch` implementation                        |
| `dnsLookup`               | `function`          | system DNS         | Custom resolver for SSRF host validation             |
| `onSchemaMismatch`        | `function`          | none (silent)      | Notified when a response does not match its schema   |

Library consumers should leave `registerProcessHandlers` off and call `client.destroy()` from their own shutdown hook. The `testrail` CLI opts in on your behalf.

## Pagination

The 23 endpoints in the pagination registry expose three projections. Existing
methods keep their backward-compatible behavior: `get*()` performs one request
and returns that response's item array. `get*Page()` performs one request and
returns a discriminated `Page<T>` with the server's `offset`, `limit`, `size`,
and `_links` when an envelope was returned. `getAll*()` follows every response
continuation and returns one concatenated array:

```typescript
const firstResponse = await client.runs.getRuns(5); // Run[]; one response
const page = await client.runs.getRunsPage(5, { limit: 25, offset: 50 }); // Page<Run>
const all = await client.runs.getAllRuns(5, { pageSize: 100, maxItems: 10_000 }); // Run[]
```

An envelope's `_links.next` decides whether another request is required. The
client extracts only a validated `offset` and optional `limit`, then rebuilds
the known TestRail endpoint with the original filters; it never follows the
link's host or path. A legacy bare-array response is necessarily one terminal
page. All-page reads bypass GET cache reads, writes, and request coalescing so
one aggregate cannot combine pages captured at different times. A page read
uses normal GET caching in a separate validated namespace, so a permissive
legacy one-response wrapper cannot poison the stricter `Page<T>` projection.

Aggregation is fail-closed and never returns partial results. Defaults are a
page size of 250, start offset 0, 100 pages, 25,000 items, five minutes, and
100 MiB of UTF-8 serialized items. Page size is capped at 250, duration at five
minutes, and the byte bound at 1 GiB. A safety, continuation, or page-structure
failure throws `TestRailPaginationError` with `reason`, `pagesFetched`, and
`itemsFetched`. Reasons are `max_pages`, `max_items`, `max_duration`,
`max_bytes`, `invalid_page`, `invalid_continuation`, and `non_progress`.

Registry scope is deliberately finite: cases and case history; projects,
suites, sections, plans, runs, tests, and milestones; the three result lists;
labels; shared-step lists and history; case/run/plan attachment lists; datasets,
variables, roles, groups, and case statuses. Shared-step history, datasets,
variables, roles, groups, and case statuses expose response-driven pagination
but no caller-controlled page size or start offset. Test attachments,
plan-entry attachments, users, and ordinary metadata/configuration/report
lists remain one-response-only; some legacy methods may still accept
`limit`/`offset`, but that is not a `get*Page()`/`getAll*()` guarantee.

The CLI mirrors the projections. Its default output remains an item array;
`--page` emits the normalized page object, and `--all` emits the complete
array. `--all` uses `--page-size`, `--start-offset`, `--max-pages`,
`--max-items`, `--max-duration-ms`, and `--max-bytes`. It cannot be combined
with `--page`, `--limit`, or `--offset`; aggregate controls require `--all`.
Response-driven endpoints reject caller-controlled size/offset flags.

## Response types are a description, not a guarantee

Since 6.0.0, **Zod response validation is advisory**. When entity fields do not match their schema, the client normally returns the raw body unchanged and notifies `onSchemaMismatch`; the Zod mismatch alone does not throw. With the default or another non-throwing hook, domain methods still enforce list/page outer structure so a malformed collection cannot masquerade as a successful empty result. A caller-supplied hook that throws takes precedence over downstream structural decoding.

In non-throwing advisory mode, the hard protocol exceptions are structural
rather than entity-field drift. A malformed default list response throws
`TestRailApiError`; explicit page/all reads throw `TestRailPaginationError`. An
unrecognized successful response from `cases.addCases()` or
`cases.updateCases()` also throws `TestRailApiError` with an explicit “write
outcome is indeterminate” message. Those non-idempotent writes may already have
changed server state, so reporting an empty result could prompt a duplicate
retry.

The CLI makes advisory mismatches visible without copying the response into
logs. By default it writes at most 10 unique, deduplicated warnings to stderr,
then a safe suppressed-count summary. Warnings contain only the request method,
CLI resource/action, Zod issue codes, and shape-only paths whose segments are
all masked as `*`; they never include the endpoint, field/record keys, issue
messages, or raw response. Pass
`--strict-responses` or set `TESTRAIL_STRICT_RESPONSES=1` to stop at the first
mismatch with exit code 1. Read mismatches use `TestRailValidationError`; a
successful mutating request with a mismatched response uses a privacy-safe
`TestRailApiError` that says the write outcome is indeterminate, and must not be
retried blindly. One-shot commands emit no value for the mismatched response,
and bounded aggregates emit no partial array. A streaming `run watch` may
already have emitted completed earlier polls before a later mismatch; those
events cannot be retracted. The environment variable accepts only `1`, `0`, an
empty value, or unset; any other value is rejected before authentication or a
network request. The flag is boolean-only, so forms such as
`--strict-responses=true` are rejected instead of guessed. `--quiet` suppresses
advisory warnings as well as normal output.

This is deliberate. TestRail's published API documentation is not a reliable description of what the API actually sends: it documents a `{step_history}` wrapper for an endpoint that returns a bare array, a boolean `mfa_required` that arrives as integer `0`, and an `is_untested` field on the wrong endpoint entirely. Because list endpoints validate a whole page at once, a single unmodelled row used to discard up to 250 valid ones — so strict validation reliably converted a working response into an outage, and never once caught a server-side regression.

Two consequences worth knowing:

- **Exported response types state the expected shape, not a runtime guarantee.** A field typed `number` can hold whatever TestRail sent. Fields are widened to match reality as wire evidence arrives, in any release — pin an exact version if you need frozen types.
- **Caller-supplied input still fails closed.** Client configuration and CLI write payloads are validated on a separate path and reject invalid input as before.
- **The hook must be synchronous, and what it logs can contain personal data.** An `async` hook cannot restore fail-closed validation and is rejected with `TestRailValidationError`; see the comment in the example below before logging `endpoint` or `data`.

Public response types are derived from the declared Zod response shapes, so a
runtime `.passthrough()` no longer leaks a broad `[key: string]: unknown` into
every entity. Flat response custom fields are modeled only where TestRail emits
them: `Case`, `Test`, and `Result` support bracket access such as
`test['custom_browser']`, typed `unknown`; narrow before use. Their older
`custom_fields` container remains deprecated for compatibility. Stable fields
added in 6.0 include `Test.refs_data`/`case_title`,
`Result.case_title`/`case_refs`,
`CaseField.is_indexed`/`is_system`, and `ResultField.is_system`; milestone
children are now recursively typed.

```typescript
// Observe drift without changing behavior.
// Never log `endpoint`, `error`, or `data` wholesale. Endpoint path/query values
// and the raw body can contain personal data, while Zod paths can contain
// response-controlled record/catchall keys. Keep only the operation token,
// issue code, and path depth; mask every path segment.
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

// Or restore strict, fail-closed validation — useful in CI.
// `handleZodError` reproduces the exact TestRailValidationError older versions
// threw, so existing `instanceof` handlers keep matching; throw `error` as-is
// if you would rather have the raw Zod issue tree.
import { handleZodError } from '@dichovsky/testrail-api-client';

const strict = new TestRailClient({
    ...config,
    onSchemaMismatch: ({ error }) => {
        throw handleZodError(error);
    },
});
```

## Error handling

The client exposes three primary error classes:

```typescript
import { TestRailApiError, TestRailPaginationError, TestRailValidationError } from '@dichovsky/testrail-api-client';

try {
    await client.projects.getProject(999);
} catch (error) {
    if (error instanceof TestRailApiError) {
        // HTTP/network/protocol failure, including a malformed successful default-list response
        console.error(error.status, error.statusText, error.response);
    } else if (error instanceof TestRailPaginationError) {
        // Bounded aggregation or structural page/continuation failure
        console.error(error.reason, error.pagesFetched, error.itemsFetched);
    } else if (error instanceof TestRailValidationError) {
        // Bad config, invalid ID, or invalid params
        console.error(error.message);
    }
}
```

`TestRailApiError` carries `status`, `statusText`, and `response` (the raw body
lives only in `response`, never in `message`). In non-throwing advisory mode, it
also represents an unrecognized successful outer structure from a default list
read or non-idempotent bulk case write. CLI strict mode uses the same class for
any successful mutating request whose response mismatches, with an indeterminate
outcome message and no raw response attached. `TestRailPaginationError`
extends `TestRailValidationError`; catch it first when its structured reason
matters. Ordinary entity-field schema mismatches remain advisory. Explicit
page/all projections require complete envelope metadata, valid links, and a
safe continuation. A throwing SDK mismatch hook takes precedence over these
downstream decoders; never treat its error as proof that a write did not happen.
Other `TestRailValidationError`s signal caller mistakes — bad config, an invalid
ID, or an invalid parameter. Calling any method after `destroy()` throws a plain
`Error`.

For list filters that carry numeric IDs, validation also happens before any request is sent. Arrays such as `createdBy`, `statusId`, and `milestoneId` must contain positive integers; invalid values fail locally with `TestRailValidationError` instead of reaching the API.

## Links

- [CHANGELOG.md](https://github.com/dichovsky/testrail-api-client/blob/main/CHANGELOG.md) — release notes and migration guidance
- [docs/API-MAPPING.md](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) — endpoint ↔ client method ↔ CLI command ↔ skill recipe matrix
- [CODEMAP.md](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md) — every symbol with exact `file:line` links
- [docs/ARCHITECTURE.md](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md) — how the layers are organized and why
- [AGENTS.md](https://github.com/dichovsky/testrail-api-client/blob/main/AGENTS.md) — vendor-neutral guidance for AI coding agents

## License

MIT — see [LICENSE](LICENSE). If this saved you time, you can [buy me a coffee](https://buymeacoffee.com/dichovsky).
