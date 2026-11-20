# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-7_tested-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@dichovsky/testrail-api-client` provides a TypeScript SDK and the `testrail` CLI for the [TestRail REST API](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference).
Use the CLI for shell scripts and CI. Use the SDK for typed application code, shared caching, and request controls.
The package uses ESM and has one runtime dependency: Zod.

## Install

Requires **Node.js 26 or newer**. CI tests Node 26 on Linux, macOS, and Windows.

```bash
npm install @dichovsky/testrail-api-client
```

Set credentials for either quick start:

```bash
export TESTRAIL_BASE_URL="https://your-domain.testrail.io"
export TESTRAIL_EMAIL="you@example.com"
export TESTRAIL_API_KEY="…"
```

Keep the API key out of command arguments and logs. The CLI also accepts it through [standard input](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md#authentication).

## Upgrading to 10.0.0

- Upgrade application, CLI, and CI runtimes to Node.js 26 or newer.
- Remove caller cleanup for file descriptors passed to SDK upload methods, including calls that fail before sending a request.
  The SDK now owns those descriptors from the call onward. See [upload ownership](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#upload-files).
- Replace `parse()` overrides used for endpoint responses with `onSchemaMismatch` for reporting or strict validation.
  Apply response transformations after awaiting the endpoint method. See [response validation](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#response-validation) for affected behavior and examples.

Published declaration files are tested with TypeScript 7. Other compiler versions are not tested.
TypeScript is not a runtime or peer dependency of the package.
See the [changelog](https://github.com/dichovsky/testrail-api-client/blob/main/CHANGELOG.md) for the full release scope and affected methods.

## Quick start (SDK)

Read a project, then release the client's timers and cache:

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

The SDK types write payloads at compile time. For dynamic input, call the exported payload schema's `.parse(input)` before writing.
See the [SDK guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md) for writes, configuration, pagination, and error handling.

<a name="cli-quick-tour"></a>

## Quick start (CLI)

With the package installed locally, run commands through `npx testrail`:

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

| Topic       | Default behavior                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Lists       | Return one response. Use `getAll*()` or CLI `--all` for bounded pagination.                                                            |
| Responses   | Entity-field mismatches are advisory. CLI `--strict-responses` makes them errors; paginated lists still enforce their outer structure. |
| Caching     | Cache eligible GET responses for five minutes. Successful writes clear the cache; aggregate reads bypass it.                           |
| Retries     | Ordinary GETs retry transient failures. JSON writes and report execution retry only on `429`; uploads never retry.                     |
| Connections | Block private hosts and redirects. See the networking guide for trusted private servers, proxies, and custom certificates.             |

A response-validation error can occur after a write executes. Check the server state before retrying an uncertain write.
The guides below explain limits, exceptions, and configuration.

<!-- Preserve existing README fragment links at the guide index. -->

<a name="repository-verification"></a>
<a name="configuration"></a>
<a name="operation-settlement-tracking"></a>
<a name="cache-isolation-and-memory"></a>
<a name="report-execution"></a>
<a name="ssrf-protection-and-private-hosts"></a>
<a name="custom-dns-resolvers"></a>
<a name="proxies-and-custom-certificate-authorities"></a>
<a name="pagination"></a>
<a name="advisory-response-validation"></a>
<a name="error-handling"></a>
<a name="cli-diagnostic-files"></a>
<a name="links"></a>

## Documentation

| I want to…                                        | Read                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configure the SDK, write data, or handle errors   | [SDK guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md)                                                                                                                                                                                                                                                                            |
| Use CLI flags, pagination, or diagnostic files    | [CLI guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md)                                                                                                                                                                                                                                                                            |
| Connect through private networks, DNS, or proxies | [Networking](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md) · [DNS](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#custom-dns-resolvers) · [Proxies and certificates](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md#proxies-and-custom-certificate-authorities) |
| Find a command or a worked example                | [Command reference](https://github.com/dichovsky/testrail-api-client/blob/main/skill/reference/commands.md) · [Recipes](https://github.com/dichovsky/testrail-api-client/blob/main/skill/reference/recipes.md)                                                                                                                                                 |
| Find an endpoint or public symbol                 | [API mapping](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) · [Symbol index](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md)                                                                                                                                                                          |
| Wait for a new custom case field                  | [Case-field readiness](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CASE-FIELD-READINESS.md)                                                                                                                                                                                                                                                |
| Install the bundled agent skill                   | [Skill installation](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md#agent-skill)                                                                                                                                                                                                                                                       |
| Understand or contribute to the implementation    | [Architecture](https://github.com/dichovsky/testrail-api-client/blob/main/docs/ARCHITECTURE.md) · [Contributing](https://github.com/dichovsky/testrail-api-client/blob/main/CONTRIBUTING.md) · [Agent instructions](https://github.com/dichovsky/testrail-api-client/blob/main/AGENTS.md)                                                                      |
| Upgrade or publish a release                      | [Changelog](https://github.com/dichovsky/testrail-api-client/blob/main/CHANGELOG.md) · [Release guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/RELEASING.md)                                                                                                                                                                           |
| Report a vulnerability                            | [Security policy](https://github.com/dichovsky/testrail-api-client/blob/main/SECURITY.md)                                                                                                                                                                                                                                                                      |

The client supports TestRail 10.7.0 (Default 1021), including API additions from versions 10.4 through 10.7.
The [compatibility audit](https://github.com/dichovsky/testrail-api-client/blob/main/docs/TESTRAIL-10.7.0-COMPATIBILITY.md) records endpoint coverage and upstream documentation discrepancies.

## License

[MIT](LICENSE). If this package saves you time, you can [buy me a coffee](https://buymeacoffee.com/dichovsky).
