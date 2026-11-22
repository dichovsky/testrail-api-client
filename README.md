# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-7_tested-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@dichovsky/testrail-api-client` supplies a TypeScript SDK and the `testrail` CLI for the [TestRail REST API](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference).
Use the CLI for shell scripts and CI. Use the SDK for typed application code, shared caching, and request controls.
The package uses ESM and has one runtime dependency: Zod.

## Install

The package requires **Node.js 26 or newer**. CI tests Node 26 on Linux, macOS, and Windows.

```bash
npm install @dichovsky/testrail-api-client
```

Set credentials for either quick start:

```bash
export TESTRAIL_BASE_URL="https://your-domain.testrail.io"
export TESTRAIL_EMAIL="you@example.com"
export TESTRAIL_API_KEY="…"
```

Do not put the API key in command arguments or logs. The CLI also accepts the API key through [standard input](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md#authentication).

## Upgrading to 10.0.0

- Upgrade application, CLI, and CI runtimes to Node.js 26 or newer.
- Remove caller cleanup for file descriptors that you pass to SDK upload methods. Remove this cleanup also for calls that fail before the client sends a request.
  The SDK now owns those descriptors from the start of the call. See [upload ownership](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#upload-files).
- Replace `parse()` overrides for endpoint responses with `onSchemaMismatch` for mismatch reports or strict validation.
  Apply response transformations after you await the endpoint method. See [response validation](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#response-validation) for affected behavior and examples.
- Catch `TestRailApiError` with `status === 0` for DNS resolver failures. The client does not throw `TestRailValidationError` for these failures now.
- Pass a `baseUrl` without a query string or fragment.
- Remove `timeout`, `bodyTimeout`, `deadlineAt`, and `cacheVariant` from objects that you pass to `client.request()`. The argument type of `client.request()` does not declare these fields now. Use `client.withTimeout(ms)` for a per-request timeout.
- Make sure that `typeof result.quality_rating === 'number'` is true before you use the field as a number. The field can now be an object of scores.
- Expect `TestRailValidationError` before any request for an empty or invalid `case_ids` or `test_ids` list in bulk writes. Expect the same error for an empty `addCases()` array.
- Correct CLI scripts that pass one of these arguments, because the command now exits 1:
    - A malformed `--limit` or `--offset`.
    - An empty `--timeout`.
    - A positional argument to `install-skill` or `uninstall-skill`.

The project tests the published declaration files with TypeScript 7. The project does not test other compiler versions.
TypeScript is not a runtime or peer dependency of the package.
See the [changelog](https://github.com/dichovsky/testrail-api-client/blob/main/CHANGELOG.md) for the full release scope and affected methods.

## Quick start (SDK)

The example reads a project and then releases the timers and cache of the client:

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: process.env['TESTRAIL_BASE_URL']!,
    email: process.env['TESTRAIL_EMAIL']!,
    apiKey: process.env['TESTRAIL_API_KEY']!,
});

try {
    const project = await client.projects.getProject(1);
    console.log(project.name);
} finally {
    client.destroy();
}
```

<a name="write-example"></a>

The SDK supplies compile-time types for write payloads. For dynamic input, call the exported payload schema's `.parse(input)` before the write.
See the [SDK guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md) for writes, configuration, pagination, and error handling.

<a name="cli-quick-tour"></a>

## Quick start (CLI)

If the package is installed locally, run commands through `npx testrail`:

```bash
npx testrail project list
npx testrail case get 42

# Validate and preview a write without calling TestRail.
npx testrail run add 5 --data '{"name":"CI build","include_all":true}' --dry-run

npx testrail run --help
```

The CLI validates write payloads with Zod and prints JSON by default. Remove `--dry-run` to send the write.
Destructive actions require both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
See the [CLI guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md) for authentication, payload files, output formats, and destructive commands.

<a name="features"></a>

## Behavior to know

| Topic       | Default behavior                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lists       | A list method returns the items from one response. Use `getAll*()` or CLI `--all` for bounded pagination.                                                 |
| Responses   | Entity-field mismatches are advisory. CLI `--strict-responses` makes them errors. Paginated lists still validate their outer structure.                   |
| Caching     | The client caches eligible GET responses for five minutes. Dispatched writes clear the cache, with or without an error. Aggregate reads bypass the cache. |
| Retries     | Ordinary GET requests retry transient failures. JSON writes and report execution retry only on `429`. Uploads never retry.                                |
| Connections | The client blocks private hosts and redirects. See the networking guide for trusted private servers, proxies, and custom certificates.                    |

Examine the server state before you retry an uncertain write. A response-validation error can occur after the write executes.
The guides below explain limits, exceptions, and configuration.

## Documentation

| I want to…                                        | Read                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configure the SDK, write data, or handle errors   | [SDK guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md)                                                                                                                                                                                                                                                                            |
| Use CLI flags, pagination, or diagnostic files    | [CLI guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md)                                                                                                                                                                                                                                                                            |
| Connect through private networks, DNS, or proxies | [Networking](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md) · [DNS](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#custom-dns-resolvers) · [Proxies and certificates](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#proxies-and-custom-certificate-authorities) |
| Find a command or a worked example                | [Command reference](https://github.com/dichovsky/testrail-api-client/blob/main/skill/reference/commands.md) · [Recipes](https://github.com/dichovsky/testrail-api-client/blob/main/skill/reference/recipes.md)                                                                                                                                                 |
| Find an endpoint or public symbol                 | [API mapping](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) · [Symbol index](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md)                                                                                                                                                                          |
| Copy a runnable SDK example                       | [Bounded pagination](https://github.com/dichovsky/testrail-api-client/blob/main/examples/bounded-pagination.ts) · [Publish CI results](https://github.com/dichovsky/testrail-api-client/blob/main/examples/publish-ci-results.ts) · [Case-field readiness](https://github.com/dichovsky/testrail-api-client/blob/main/examples/case-field-readiness.ts)        |
| Wait for a new custom case field                  | [Case-field readiness](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CASE-FIELD-READINESS.md)                                                                                                                                                                                                                                                |
| Install the bundled agent skill                   | [Skill installation](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md#agent-skill)                                                                                                                                                                                                                                                       |
| Understand or contribute to the implementation    | [Architecture](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md) · [Contributing](https://github.com/dichovsky/testrail-api-client/blob/main/CONTRIBUTING.md) · [Agent instructions](https://github.com/dichovsky/testrail-api-client/blob/main/AGENTS.md)                                                                      |
| Upgrade or publish a release                      | [Changelog](https://github.com/dichovsky/testrail-api-client/blob/main/CHANGELOG.md) · [Release guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/RELEASING.md)                                                                                                                                                                           |
| Report a vulnerability                            | [Security policy](https://github.com/dichovsky/testrail-api-client/blob/main/SECURITY.md)                                                                                                                                                                                                                                                                      |
| Browse every document                             | [Documentation index](https://github.com/dichovsky/testrail-api-client/blob/main/docs/README.md)                                                                                                                                                                                                                                                               |

The client supports TestRail 10.7.0 (Default 1021), including API additions from versions 10.4 through 10.7.
The [compatibility audit](https://github.com/dichovsky/testrail-api-client/blob/main/docs/TESTRAIL-10.7.0-COMPATIBILITY.md) records endpoint coverage, upstream documentation discrepancies, and known gaps against TestRail 10.8 through 10.10.

### Sections that moved

Earlier releases documented these topics in this file. Links to the earlier README sections open this table.

| Earlier README section                                                                              | Current location                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a name="repository-verification"></a>Repository verification                                       | [Verification checks](https://github.com/dichovsky/testrail-api-client/blob/main/CONTRIBUTING.md#verification-checks)                                                                                     |
| <a name="configuration"></a>Configuration                                                           | [SDK configuration](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#configuration)                                                                                                 |
| <a name="operation-settlement-tracking"></a>Operation settlement tracking                           | [SDK lifecycle](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#lifecycle)                                                                                                         |
| <a name="cache-isolation-and-memory"></a>Cache isolation and memory                                 | [Caching and retries](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#caching-and-retries)                                                                                         |
| <a name="report-execution"></a>Report execution                                                     | [Caching and retries](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#caching-and-retries)                                                                                         |
| <a name="ssrf-protection-and-private-hosts"></a>SSRF protection and private hosts                   | [Private servers](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#private-servers)                                                                                          |
| <a name="custom-dns-resolvers"></a>Custom DNS resolvers                                             | [Custom DNS resolvers](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#custom-dns-resolvers)                                                                                |
| <a name="proxies-and-custom-certificate-authorities"></a>Proxies and custom certificate authorities | [Proxies and custom certificate authorities](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#proxies-and-custom-certificate-authorities)                                    |
| <a name="pagination"></a>Pagination                                                                 | [SDK pagination](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#pagination) · [CLI pagination](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md#pagination) |
| <a name="advisory-response-validation"></a>Advisory response validation                             | [Response validation](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#response-validation)                                                                                         |
| <a name="error-handling"></a>Error handling                                                         | [Error handling](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#error-handling)                                                                                                   |
| <a name="cli-diagnostic-files"></a>CLI diagnostic files                                             | [Diagnostic files](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md#diagnostic-files)                                                                                               |
| <a name="links"></a>Links                                                                           | [Documentation](#documentation)                                                                                                                                                                           |

## License

[MIT](LICENSE). If this package saves you time, you can [buy me a coffee](https://buymeacoffee.com/dichovsky).
