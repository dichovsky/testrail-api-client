# Security Policy

## Supported versions

Only the latest published major version receives security fixes. This project does not maintain long-term support branches.

| Version | Supported |
| ------- | --------- |
| 9.x     | Yes       |
| < 9.0   | No        |

## Reporting a vulnerability

**Do not open a public issue to report a security vulnerability.**

Use GitHub private vulnerability reporting:
[Report a vulnerability](https://github.com/dichovsky/testrail-api-client/security/advisories/new).

Include the following information in your report:

- The affected package version.
- The configuration required to trigger the issue.
- The impact of the vulnerability.
- A runnable reproduction script, if possible.

You can use the `TestRailConfig.fetch` and `TestRailConfig.dnsLookup` hooks to reproduce transport behavior offline without a live TestRail server.

The maintainer will acknowledge your report within 7 days. Please allow reasonable time to fix the issue before public disclosure.

## Scope

This package is a client library and CLI. It stores credentials, connects to a user-configured host, and writes files. The security scope includes these areas:

- **SSRF protection.** Every request sends an `Authorization` header. If an attacker controls `baseUrl`, the client could send credentials to internal services. `src/config-validation.ts` classifies IP addresses with one shared `net.BlockList`. The client resolves hostnames before every upstream network request instead of caching DNS results at construction. This behavior prevents DNS rebinding attacks. The client sets `redirect: 'manual'` and rejects all HTTP redirects so a `Location` header cannot redirect requests to private or metadata IP addresses.
- **Credential protection.** The CLI reads the API key from an environment variable or `--api-key-stdin`. The CLI does not accept the API key on `argv` because operating systems expose command-line arguments to other local processes. Error messages, logs, and CLI diagnostic files must never contain credentials.
- **CLI diagnostic files (`--diagnostic-file`).** The CLI limits the file size, redacts sensitive data, and sets file permissions to `0600`. Windows rejects this flag because the client cannot establish equivalent private file permissions.
- **Resource limits.** `src/body-reader.ts` enforces a maximum byte limit and a time limit on every response body. Aggregate pagination enforces maximum limits on pages, items, duration, and bytes.
- **File path validation.** The CLI validates paths for `--file`, `--out`, and `--data-file`.
- **Supply chain security.** `.npmrc` sets `ignore-scripts=true` and pins the npm registry URL. `lockfile-lint` rejects dependencies from other registries. The release workflow publishes packages through OIDC Trusted Publishing with provenance attestations and verifies the published tarball against the tested build.

## Out of scope

The following items are out of scope:

- Vulnerabilities in the TestRail server software. Report those issues to Gurock or Idera.
- Issues that require `allowPrivateHosts: true` or `allowInsecure: true`. These options intentionally disable default security checks for local development or private networks.
- Advisories in `devDependencies` that do not affect the published package. The published package has only one runtime dependency (Zod). CI still audits both dependency trees.
- Denial-of-service conditions that require the caller to supply unsafe configuration values (for example, `maxCacheSize: 0`).

## Advisory response validation

Starting in version 6.0.0, response validation is advisory.
If a response does not match its Zod schema, the client returns the raw response and calls `TestRailConfig.onSchemaMismatch`, if configured. The client does not throw an error by default. TestRail responses often differ from the official TestRail documentation. Strict response validation caused runtime failures on valid server responses.

**This behavior is not a validation bypass.** The constructor validates `TestRailConfig`, and `resolveBody()` validates all CLI write payloads.
SDK methods validate IDs and parameters but use payload schemas only for compile-time types.
For dynamic SDK payloads, call `.parse(input)` on the exported schema before the write.

Reports about advisory response validation are not valid security vulnerabilities. Reports about bypassing input validation are valid security vulnerabilities.
