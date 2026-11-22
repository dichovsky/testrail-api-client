# Security Policy

## Supported versions

Only the latest published major version receives security fixes. This project does not maintain long-term support branches.

| Version | Supported |
| ------- | --------- |
| 10.x    | Yes       |
| < 10.0  | No        |

## Reporting a vulnerability

**Do not open a public issue to report a security vulnerability.**

Use GitHub private vulnerability reporting:
[Report a vulnerability](https://github.com/dichovsky/testrail-api-client/security/advisories/new).

Include the following information in your report:

- The affected package version.
- The configuration required to cause the issue.
- The impact of the vulnerability.
- A runnable reproduction script, if possible.

You can use the `TestRailConfig.fetch` and `TestRailConfig.dnsLookup` hooks to reproduce transport behavior offline without a live TestRail server.

The maintainer will acknowledge your report within 7 days. Please allow reasonable time to fix the issue before public disclosure.

## Scope

This package is an SDK and a CLI. It stores credentials, connects to a user-configured host, and writes files. The security scope includes these areas:

- **SSRF protection.** The client sends an `Authorization` header with each request. If an attacker controls `baseUrl`, the client can send credentials to internal services, including services on private or metadata IP addresses. `src/config-validation.ts` classifies IP addresses with one shared `net.BlockList`. The client resolves hostnames before each upstream network request. The client does not resolve hostnames one time at construction and cache the results. This behavior prevents DNS rebinding attacks. The client sets `redirect: 'manual'` and rejects all HTTP redirects so a `Location` header cannot redirect requests to private or metadata IP addresses.
- **Credential protection.** The CLI reads the API key from an environment variable or `--api-key-stdin`. The CLI does not accept the API key on `argv` because operating systems expose command-line arguments to other local processes. Error messages, logs, and CLI diagnostic files must never contain credentials.
- **CLI diagnostic files (`--diagnostic-file`).** The CLI limits the file size, redacts sensitive data, and sets file permissions to `0600`. On Windows, the CLI rejects this flag because the CLI cannot set equivalent private file permissions.
- **Resource limits.** `src/body-reader.ts` applies a maximum byte limit and a time limit to each response body. Aggregate pagination applies maximum limits on pages, items, duration, and bytes.
- **File path validation.** The CLI validates paths for `--file`, `--out`, and `--data-file`.
- **Supply chain security.** `.npmrc` sets `ignore-scripts=true` and pins the npm registry URL. `lockfile-lint` rejects dependencies from other registries. The release workflow publishes packages through OIDC Trusted Publishing with provenance attestations and verifies the published tarball against the tested build.

## Out of scope

The following items are out of scope:

- Vulnerabilities in the TestRail server software. Report those issues to Gurock or Idera.
- Issues that require `allowPrivateHosts: true` or `allowInsecure: true`. These options intentionally disable default security checks for local development or private networks.
- Advisories in `devDependencies` that do not affect the published package. The published package has only one runtime dependency (Zod). CI still audits both dependency trees.
- Denial-of-service conditions that require the caller to supply unsafe configuration values (for example, `maxCacheSize: 0`).

## Advisory response validation

Since version 6.0.0, response validation is advisory.
If a response does not match its Zod schema, the client returns the raw response. If you configured `TestRailConfig.onSchemaMismatch`, the client also calls this hook. The client does not throw an error by default. TestRail responses often differ from the official TestRail documentation. Strict response validation caused runtime failures on valid server responses.

**This behavior is not a validation bypass.** The constructor validates `TestRailConfig`, and `resolveBody()` validates all CLI write payloads.
SDK methods validate IDs and parameters but use payload schemas only for compile-time types.
For dynamic SDK payloads, call `.parse(input)` on the exported schema before the write.

Reports about advisory response validation are not valid security vulnerabilities. Reports about a bypass of input validation are valid security vulnerabilities.
