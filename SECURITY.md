# Security Policy

## Supported versions

Security fixes land on the latest published major only. There are no
long-term support branches.

| Version | Supported |
| ------- | --------- |
| 8.x     | Yes       |
| < 8.0   | No        |

## Reporting a vulnerability

**Do not open a public issue for a security report.**

Use GitHub's private vulnerability reporting:
[Report a vulnerability](https://github.com/dichovsky/testrail-api-client/security/advisories/new).

A useful report names the affected version, the configuration required to reach
the code, and what an attacker gains. A runnable reproduction is worth more than
a description — this package ships injectable `fetch` and `dnsLookup` hooks
(`TestRailConfig.fetch`, `TestRailConfig.dnsLookup`) precisely so transport
behavior can be reproduced offline, without a TestRail instance.

Expect an acknowledgement within a week. Because this is a single-maintainer
project, please allow reasonable time for a fix before public disclosure.

## What is in scope

This is a client library and CLI. It holds credentials, talks to a
caller-supplied host, and writes files. The surfaces worth probing:

- **SSRF.** Every request carries an `Authorization` header, which makes the
  client a credentialed probe for internal services when `baseUrl` is
  attacker-influenced. Address classification lives in
  `src/config-validation.ts` (one shared `net.BlockList`); hostnames are
  re-resolved before **every** distinct upstream fetch, not cached from
  construction, so a DNS-rebinding authority cannot pin a public answer and
  then flip. Redirects are never followed (`redirect: 'manual'`), because a
  `Location` pointing at a link-local or metadata address would otherwise
  bypass the guard entirely.
- **Credential disclosure.** The API key is accepted from the environment or
  `--api-key-stdin` and deliberately **not** from argv, which is world-readable
  on Linux. Error messages, logs, and CLI diagnostic files must not carry it.
- **CLI diagnostic files** (`--diagnostic-file`). Bounded, redacted, `0600`,
  and refused outright on Windows where this implementation cannot establish
  private-file permissions.
- **Resource exhaustion.** Response bodies are capped by byte ceiling _and_
  wall-clock deadline (`src/body-reader.ts`); aggregate pagination is bounded
  on pages, items, duration, and bytes.
- **Path handling** in `--file` / `--out` / `--data-file` resolution.
- **Supply chain.** `.npmrc` sets `ignore-scripts=true` and pins the registry;
  `lockfile-lint` rejects any dependency not resolving through
  `registry.npmjs.org`; releases publish via OIDC Trusted Publishing with
  provenance attestation, and the workflow verifies the published tarball
  against the tested one.

## What is out of scope

- Vulnerabilities in TestRail itself. Report those to Gurock/Idera.
- Anything requiring `allowPrivateHosts: true` or `allowInsecure: true`. Both
  are explicit, documented opt-outs that exist for on-premise and development
  use; enabling them is a deliberate choice to disable a guard.
- Advisories in `devDependencies` that cannot reach a consumer. The published
  package has exactly one runtime dependency (Zod). CI audits both trees
  regardless.
- Denial of service achievable only by the operator against their own process
  (for example configuring `maxCacheSize: 0`, which warns at construction).

## Response validation is advisory by design

Since 6.0.0 a response failing its Zod schema is returned raw and reported to
`TestRailConfig.onSchemaMismatch` rather than throwing. This is deliberate and
documented: TestRail's published contract disagrees with its wire behavior often
enough that failing closed converted working responses into outages. **It is not
a validation bypass**, because caller-supplied _input_ still fails closed —
client configuration in the constructor, CLI write payloads in `resolveBody()`.

A report that response validation is advisory is not a vulnerability. A report
that _input_ validation can be bypassed is.
