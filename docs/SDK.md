# TypeScript SDK

Use `TestRailClient` in TypeScript or JavaScript applications that need typed responses, shared rate limiting, caching, or structured errors.
The package uses ESM and requires Node.js 26 or newer.
The project tests the published declaration files with TypeScript 7. The project does not test other compiler versions.
TypeScript is not a runtime or peer dependency of the package.

[Create a client](#create-a-client) · [Configuration](#configuration) · [Lifecycle](#lifecycle) · [Caching and retries](#caching-and-retries) · [Pagination](#pagination) · [Response validation](#response-validation) · [Error handling](#error-handling) · [Custom fields](#custom-fields)

## Create a client

```bash
npm install @dichovsky/testrail-api-client
```

Set `TESTRAIL_BASE_URL`, `TESTRAIL_EMAIL`, and `TESTRAIL_API_KEY` in your environment. Then create a client:

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const config = {
    baseUrl: process.env['TESTRAIL_BASE_URL']!, // https://your-domain.testrail.io
    email: process.env['TESTRAIL_EMAIL']!,
    apiKey: process.env['TESTRAIL_API_KEY']!,
};

const client = new TestRailClient(config);
try {
    const project = await client.projects.getProject(1);
    console.log(project.name);
    // Put additional task snippets here, before cleanup.
} finally {
    client.destroy();
}
```

The task snippets that follow go inside this `try` block and use its live `client`.
Configuration snippets extend `config` before you construct a client.
Replace example IDs with IDs from your TestRail instance.

Call methods through their resource namespace, such as `client.projects` or `client.results`.
The [API mapping](API-MAPPING.md) lists endpoints, SDK methods, and CLI commands.
The [SDK recipes](../skill/reference/typescript-api.md) give more examples.

### Write data

```typescript
const run = await client.runs.addRun(5, {
    suite_id: 12,
    name: 'CI build',
    include_all: false,
    case_ids: [42, 43, 44],
});
await client.results.addResultForCase(run.id, 42, { status_id: 1, comment: 'Passed' });
```

The SDK payload types let TypeScript validate input at compile time. SDK methods do not validate write payloads at runtime.
For dynamic input, parse the exported Zod schema before the write:

```typescript
// Add this import at module scope.
import { AddResultPayloadSchema } from '@dichovsky/testrail-api-client';

const input: unknown = JSON.parse('{"comment":"Investigating"}');
const payload = AddResultPayloadSchema.parse(input);
await client.results.addResult(1001, payload);
```

A new result needs at least one of `status_id`, `comment`, or `assignedto_id`.
Although each field is optional in TypeScript, the schema rejects an empty object during `.parse()`.
Schemas keep `custom_*` fields and do not coerce types: `"5"` stays a string.
The [CLI](CLI.md) validates write payloads automatically. Its destructive-action gates apply only to CLI commands.

### Delete previews

`cases.deleteCase()`, `cases.deleteCases()`, `runs.deleteRun()`, `sections.deleteSection()`, and `suites.deleteSuite()` accept `{ soft: true }` for server-side previews.
These previews send `soft=1`, return `SoftDeletePreview`, and do not delete data.
Without soft mode, the methods delete data and return `undefined`.

Each method reads `options.soft` one time, when you call the method.
That value controls the URL, the response schema, and whether the method returns a preview.
If you change `options.soft` while the request is pending, these choices do not change.

## Configuration

Only `baseUrl`, `email`, and `apiKey` are required.
The constructor validates configuration before any request.
Defaults come from [`src/constants.ts`](../src/constants.ts).

| Option                    | Type                | Default            | Meaning                                                                                                                                                                                            |
| ------------------------- | ------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`                 | `string`            | Required           | HTTPS TestRail URL with no query string or fragment; HTTP requires `allowInsecure`                                                                                                                 |
| `email`                   | `string`            | Required           | TestRail account email                                                                                                                                                                             |
| `apiKey`                  | `string`            | Required           | TestRail API key                                                                                                                                                                                   |
| `timeout`                 | `number`            | `30000`            | Per-attempt timeout in milliseconds, including DNS; maximum 5 minutes                                                                                                                              |
| `maxRetries`              | `number`            | `3`                | Retry attempts; integer from 0 through 10                                                                                                                                                          |
| `enableCache`             | `boolean`           | `true`             | Store GET responses in memory                                                                                                                                                                      |
| `cacheTtl`                | `number`            | `300000`           | Cache lifetime in milliseconds                                                                                                                                                                     |
| `cacheCleanupInterval`    | `number`            | `60000`            | Cleanup interval in milliseconds; integer from 0 through 2,147,483,647; 0 disables cleanup                                                                                                         |
| `maxCacheSize`            | `number`            | `1000`             | Maximum cache entries; 0 removes the limit                                                                                                                                                         |
| `rateLimiter`             | `RateLimiterConfig` | 100 / 60 seconds   | `{ maxRequests, windowMs }` sliding window                                                                                                                                                         |
| `allowInsecure`           | `boolean`           | `false`            | Allow cleartext HTTP                                                                                                                                                                               |
| `allowPrivateHosts`       | `boolean`           | `false`            | Allow private, loopback, and link-local hosts                                                                                                                                                      |
| `maxJsonResponseBytes`    | `number`            | `10485760`         | JSON, text, and error body limit: 10 MiB; maximum 1 GiB                                                                                                                                            |
| `maxBinaryResponseBytes`  | `number`            | `104857600`        | Successful binary body limit: 100 MiB; maximum 1 GiB                                                                                                                                               |
| `bodyTimeout`             | `number`            | `timeout`          | Body-read deadline in milliseconds; 0 disables it; maximum 5 minutes                                                                                                                               |
| `registerProcessHandlers` | `boolean`           | `false`            | Register cleanup handlers for `exit`, `SIGINT`, and `SIGTERM`                                                                                                                                      |
| `fetch`                   | `typeof fetch`      | `globalThis.fetch` | Custom transport. It must use the dispatcher that the client supplies, or apply equivalent checks. On a failure, `error.cause` is a copy of only `name`, `message`, `code`, `errno`, and `syscall` |
| `dnsLookup`               | `function`          | System DNS         | Custom resolver for host validation and DNS pinning                                                                                                                                                |
| `onSchemaMismatch`        | `function`          | None; silent       | Synchronous hook for a response schema mismatch                                                                                                                                                    |

`timeout` includes DNS resolution, connection, upload, and response headers for each attempt.
`bodyTimeout` independently limits the response-body read. If the body exceeds a byte or time limit, the client throws `TestRailApiError` and does not retry.

Use `client.withTimeout(milliseconds)` to change timeouts for calls through a view of the same client.
The view shares credentials, rate limits, cached responses, and cleanup with the original client.
An implicit `bodyTimeout` follows the timeout of the view. An explicitly configured `bodyTimeout` does not change.
A `destroy()` call on a view destroys the shared client and its other views.

See [networking](NETWORKING.md) for private servers, DNS resolvers, proxies, and certificate authorities.

## Lifecycle

Call `client.destroy()` in `finally` or your application's shutdown hook.
The `destroy()` call stops cache cleanup, clears cached entries and credentials, and disables all subsequent requests.
SDK callers should keep `registerProcessHandlers` set to `false`. The CLI enables this option automatically.

Use `trackOperation` when you must wait for transport cleanup before you release a concurrency slot or delete temporary files:

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

| Promise             | Completes when                                                                  |
| ------------------- | ------------------------------------------------------------------------------- |
| `operation.result`  | The callback returns, fails, or times out                                       |
| `operation.settled` | The callback and all associated client tasks finish; this promise never rejects |

Tracked tasks include DNS, HTTP requests, body reads, stream cancellation, uploads, retries, and shared requests.
A timeout can reject `result` while `settled` still waits for cleanup.
Neither `trackOperation` nor `destroy()` cancels in-flight requests. The `destroy()` call does not settle the handles of these requests.
If a custom transport or cancellation task never finishes, `settled` stays pending even after an abort request.

Return the complete workflow promise from the callback. Tracking includes nested operations but excludes application timers that the callback does not await.
A tracked call can share the result of a request that started before the first `trackOperation` call.
Tracking cannot include the subsequent cleanup of that request.
See [architecture](ARCHITECTURE.md) for resource ownership and upload cleanup mechanics.

## Upload files

Upload methods accept `Blob`, `File`, `Uint8Array`, or `{ path, type?, fd? }` inputs.
If you supply only `path`, the SDK opens the file for streaming when it prepares the request.

If you pass an open `fd`, the SDK closes it. The SDK becomes responsible for the descriptor when you call the upload method.
This rule includes invalid IDs, invalid request options, and calls after `destroy()`.
Open a separate descriptor for each upload. Do not close or reuse it after the call.
Existing callers that closed descriptors after early rejection must remove that cleanup.

On macOS and Linux, uploads read through the descriptor to keep the originally opened file.
Other platforms close the descriptor during preparation and read through `path`.
The SDK does not mutate your input object or caller-owned `Blob`.

A timeout can occur before all transport work finishes.
Use `trackOperation().settled` before you delete temporary files or release resources that unfinished work needs.
Multipart uploads never retry automatically.

## Caching and retries

| Request                   | Response cache                                            | Automatic retries                                     |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| Ordinary JSON GET         | LRU cache with TTL; concurrent requests can share work    | 429, 5xx, and network errors                          |
| `get*Page()`              | Separate cache for validated pages                        | 429, 5xx, and network errors                          |
| `getAll*()`               | No cache reads, writes, or shared requests                | 429, 5xx, and network errors, within aggregate limits |
| Text or binary GET        | No cache                                                  | 429, 5xx, and network errors                          |
| Report-generation GET     | No cache or shared requests                               | 429 only                                              |
| JSON POST, PUT, or DELETE | Clears the cache after dispatch, with or without an error | 429 only                                              |
| Multipart upload          | Clears the cache after dispatch, with or without an error | Never                                                 |

Each dispatched write attempt invalidates stored and in-flight cache entries one time:

- If the response is successful, the client invalidates the cache before it parses the response.
- If the attempt fails, the client invalidates the cache immediately. Failures include an error status, a network failure, a timeout, or a blocked redirect.

If the client rejects a write before dispatch, the cache does not change.
Schema mismatches never enter the cache.
Concurrent JSON GETs share work only when their header and body timeouts match, even when `enableCache` is `false`.
Completed entries stay shared across timeout views. Call `client.clearCache()` to clear the cache explicitly.

The cache stores raw JSON text after the initiating caller's response validation succeeds.
Cache hits and callers that share a request parse the JSON independently. Then they apply their own response schemas.
Custom `client.request()` transformations run one time per successful call, including cache hits. They keep functions and class instances.
A change to a returned object cannot change a cached entry or the result of another caller.
Copy costs increase with response size. `maxCacheSize` counts entries, not bytes.
Reduce `maxCacheSize` or `maxJsonResponseBytes` for large responses. A `maxCacheSize` of 0 removes the memory limit of the cache.

Retries use exponential backoff. The delay starts at 1 second and has a maximum of 10 seconds.
A valid `Retry-After` header overrides backoff up to that maximum, including on retryable GET 5xx responses.
Missing, zero, past, or invalid values use backoff.

The client never retries these errors:

- Other 4xx responses.
- Abort timeouts.
- Body-limit failures.
- A transport failure while the client reads a successful response body.
- Redirects.

A DNS resolver failure is a network error and follows the network-error retry policy.
All requests reject HTTP redirects with `TestRailApiError`.

The local sliding-window limiter rejects excess new calls before `fetch`. Adjust `rateLimiter` to match your TestRail quota.
Retries count against the window, but this local check does not reject them.
TestRail Cloud usually does not send `Retry-After` and `X-RateLimit-*` headers. Thus, local rate limiting stays the primary control.

`reports.runReport()` and `reports.runCrossProjectReport()` generate a new report on each call and can send email.
An HTTP 429 response means that TestRail rejected the request before execution. After a 5xx or network error, the server state can be unknown.
If the server state is unknown, examine it before you start another report or repeat a write.

## Pagination

The SDK has three methods for each of the 24 paginated endpoints:

| Need                            | SDK method   | Returns                 | Requests              |
| ------------------------------- | ------------ | ----------------------- | --------------------- |
| Items from one response         | `get*()`     | `T[]`                   | One                   |
| One response with page metadata | `get*Page()` | Discriminated `Page<T>` | One                   |
| All items within safety limits  | `getAll*()`  | Combined `T[]`          | Follows `_links.next` |

```typescript
const first = await client.runs.getRuns(5);
const page = await client.runs.getRunsPage(5, { limit: 25, offset: 50 });
const all = await client.runs.getAllRuns(5, { pageSize: 100, maxItems: 10_000 });
```

Envelope pages include `offset`, `limit`, `size`, and `_links`.
A legacy bare array produces `kind: 'legacy-array'` and ends pagination after that response.
The client extracts validated `offset` and optional `limit` values from `_links.next` and rebuilds the original endpoint locally.
It never follows the link's host or path.

Case and BDD list filters accept `refs` as a string or string array.
A string keeps the legacy scalar query. An array sends repeated `refs[]` parameters, which TestRail 10.7 and newer support.

| Aggregate option | Default                 | Hard ceiling            |
| ---------------- | ----------------------- | ----------------------- |
| `pageSize`       | `250`                   | `250`                   |
| `startOffset`    | `0`                     | Safe integer            |
| `maxPages`       | `100`                   | Safe integer            |
| `maxItems`       | `25_000`                | Safe integer            |
| `maxDurationMs`  | `300_000` (5 minutes)   | `300_000`               |
| `maxBytes`       | `104_857_600` (100 MiB) | `1_073_741_824` (1 GiB) |

Aggregate controls require positive safe integers. `startOffset` also accepts zero.
`getAll*()` never returns partial results. The byte limit measures UTF-8 serialized items.
Malformed pages, unsafe continuations, or exceeded limits throw `TestRailPaginationError` with `reason`, `pagesFetched`, and `itemsFetched`.
Reasons are `max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, and `non_progress`.
Aggregate reads bypass cached pages, so that the client does not mix older cached responses with new requests.
Pages from new requests do not guarantee a server-wide snapshot. Server data can change while the client collects pages.

Supported resources include cases, case history, project BDDs, projects, suites, sections, plans, runs, tests, milestones, and three result lists.
They also include labels, shared steps and their history, case/run/plan attachments, datasets, variables, roles, groups, and case statuses.

Shared-step history, datasets, variables, roles, groups, and case statuses use pagination controls that the server supplies.
Their aggregate methods accept safety limits but do not accept `pageSize` or `startOffset`.
Test attachments, plan-entry attachments, users, and ordinary metadata, configuration, and report lists return one response only.
TestRail 10.10 documents `get_users` as paginated, so `users.getUsers()` can return only the first 250 users on such a server.
The project has not tested this truncation on a live server. See the [compatibility audit](TESTRAIL-10.7.0-COMPATIBILITY.md#known-gaps-against-testrail-108-1010-checked-2026-11-21).
A method that accepts `limit` or `offset` does not always have a `get*Page()` or `getAll*()` method.
See the [API mapping](API-MAPPING.md) for endpoint coverage and the [CLI guide](CLI.md#pagination) for equivalent flags.
The [bounded pagination example](../examples/bounded-pagination.ts) reads one page and a bounded aggregate, then handles `TestRailPaginationError` by its `reason`.

## Response validation

Response validation is advisory. If an entity field differs from its schema, the SDK returns the raw response unchanged.
If `onSchemaMismatch` is configured, the SDK calls it. The SDK does not cache that response.
Each caller validates the response independently. Thus, each caller that joins an in-flight request causes one hook call.
Response types describe expected shapes. A field with the type `number` can hold another server value.
Types can widen in any release to match observed responses. Pin an exact package version if you need fixed types.

Structural checks still apply after a non-throwing hook:

| Response problem                                               | Error                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| Malformed outer structure from a paginated endpoint's `get*()` | `TestRailApiError`                                       |
| Malformed page or aggregate continuation                       | `TestRailPaginationError`                                |
| Malformed `cases.addCases()` or `cases.updateCases()` response | `TestRailApiError` with an indeterminate-outcome message |

The hook runs before these checks. A throwing hook stops further decoding.
A hook error does not prove that a write failed. The server can already have changed its state.
Reconcile uncertain writes before you retry them.

Direct `client.parse(schema, data, ctx)` calls keep advisory validation and mismatch-hook behavior.
Domain methods validate responses through `request()`. They do not call the public `parse()`.
Thus, subclass or instance overrides of `parse()` do not customize endpoint responses.
Use the supported `onSchemaMismatch` hook for mismatch reporting or strict validation. The examples that follow show the two uses.
Apply response transformations explicitly after you await a domain method.

The constructor requires a function for `onSchemaMismatch`. The hook must be synchronous. If the hook returns a Promise, the client throws `TestRailValidationError`.
To report mismatches, log only safe metadata. Exclude raw endpoint queries, bodies, issue messages, and field names:

```typescript
// Add this import at module scope.
import type { TestRailConfig } from '@dichovsky/testrail-api-client';

const observedConfig: TestRailConfig = {
    ...config,
    onSchemaMismatch: ({ method, error }) => {
        console.warn({
            method,
            issues: error.issues.map(({ code, path }) => ({
                code,
                path: path.length === 0 ? '$' : `$.${path.map(() => '*').join('.')}`,
            })),
        });
    },
};
```

For strict SDK validation, throw `handleZodError(error)` synchronously:

```typescript
// Add this import at module scope.
import { handleZodError } from '@dichovsky/testrail-api-client';

const strictConfig: TestRailConfig = {
    ...config,
    onSchemaMismatch: ({ error }) => {
        throw handleZodError(error);
    },
};
```

If you throw `handleZodError(error)`, callers get `TestRailValidationError`. If you throw the Zod error directly, callers get `ZodError`.
Caller input checks stay strict. The client validates configuration and IDs before requests. Dynamic write payloads need explicit schema parsing.
The [CLI response-validation guide](CLI.md#response-validation) explains warnings and strict CLI behavior.
The [schema audit](schema-audit-2026-06-22.md) records observed differences from TestRail's documentation.

## Error handling

| Error                     | Meaning                                                       | Useful properties                        |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `TestRailApiError`        | HTTP, network, or protocol failure                            | `status`, `statusText`, `response`       |
| `TestRailLicenseError`    | HTTP 403 that reports an Enterprise-license restriction       | `status`, `statusText`, `response`       |
| `TestRailPaginationError` | Invalid pagination or an exceeded aggregate limit             | `reason`, `pagesFetched`, `itemsFetched` |
| `TestRailValidationError` | Invalid configuration, ID, parameter, or strict-hook response | `message`                                |
| Standard `Error`          | Request after `client.destroy()`                              | `message`                                |

`TestRailPaginationError` extends `TestRailValidationError`. Catch it first when you need pagination details.
`TestRailLicenseError` extends `TestRailApiError`. Catch it first when you need to detect a feature that the TestRail license does not include.
Raw API bodies appear in `error.response`, never in `error.message`. You should not log raw API bodies, because they can contain sensitive data.

```typescript
// Add these imports at module scope.
import { TestRailApiError, TestRailPaginationError, TestRailValidationError } from '@dichovsky/testrail-api-client';

try {
    await client.projects.getProject(999);
} catch (error) {
    if (error instanceof TestRailPaginationError) {
        console.error(error.reason, error.pagesFetched, error.itemsFetched);
    } else if (error instanceof TestRailApiError) {
        console.error('TestRail request failed', { status: error.status });
    } else if (error instanceof TestRailValidationError) {
        console.error('TestRail validation failed');
    }
    throw error;
}
```

Numeric IDs and numeric list filters must contain positive integers.
Invalid arrays such as `createdBy`, `statusId`, or `milestoneId` throw `TestRailValidationError` before any request.
The [CLI guide](CLI.md#diagnostic-files) explains redacted diagnostic files.
The [CI results example](../examples/publish-ci-results.ts) publishes a run with one bulk write and does not retry an uncertain write.

## Custom fields

`Case`, `Test`, and `Result` support flat `custom_*` fields whose values have type `unknown`.
Narrow these values before you use them:

```typescript
const test = await client.tests.getTest(1001);
const browser = test['custom_browser'];
if (typeof browser === 'string') console.log(browser);
```

The older `custom_fields` container is deprecated. The SDK keeps it for compatibility.
Zod's runtime passthrough keeps extra data. It does not add a broad string index to each public response type.
Declared response types include test/result case titles and references, case/result field system flags, and recursive milestone children.
See the [changelog](../CHANGELOG.md) for version-specific field additions.

After you create a custom case field, keep the creation response.
Before dependent case writes, make sure that the scope and options are correct.
TestRail can temporarily omit the field from `get_case_fields`. This omission does not justify another creation request.
Use the [case-field readiness guide](CASE-FIELD-READINESS.md) for bounded polling with cancellation.
