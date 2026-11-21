# Documentation index

Start with the [package README](../README.md) for installation and quick starts.

## Guides

| Document                                            | Content                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| [SDK guide](SDK.md)                                 | Client configuration, lifecycle, pagination, validation, and errors    |
| [CLI guide](CLI.md)                                 | Authentication, payloads, destructive actions, output, and diagnostics |
| [Networking](NETWORKING.md)                         | Private servers, DNS resolvers, proxies, and certificate authorities   |
| [Case-field readiness](CASE-FIELD-READINESS.md)     | Bounded polling after the creation of a custom case field              |
| [Examples](../examples)                             | Runnable TypeScript examples for pagination, CI results, and readiness |
| [Skill recipes](../skill/reference/recipes.md)      | Numbered CLI recipes from the bundled agent skill                      |
| [SDK recipes](../skill/reference/typescript-api.md) | Programmatic TypeScript examples from the bundled agent skill          |

## Reference

| Document                                      | Content                                                    |
| --------------------------------------------- | ---------------------------------------------------------- |
| [Architecture](ARCHITECTURE.md)               | Implementation boundaries and invariants                   |
| [Endpoint inventory](testrail-endpoints.json) | TestRail endpoints that the API mapping checks use         |
| [Glossary](../CONTEXT.md)                     | Domain terms that the code uses                            |
| [Contributing](../CONTRIBUTING.md)            | Setup, verification, code conventions, and generated files |
| [CLAUDE.md](../CLAUDE.md)                     | Schema-authoring rules and the endpoint and CLI procedures |
| [Release checklist](RELEASING.md)             | Maintainer procedure for a release                         |
| [Changelog](../CHANGELOG.md)                  | Changes for each version                                   |
| [Security policy](../SECURITY.md)             | Supported versions and vulnerability reports               |
| [Backlog](../BACKLOG.md)                      | Open work items                                            |

## Generated files

Generators write these files or their marked sections. Do not edit generated content manually.
[Contributing](../CONTRIBUTING.md#generated-files) lists the generator commands.

| Document                                            | Content                                                    |
| --------------------------------------------------- | ---------------------------------------------------------- |
| [API mapping](API-MAPPING.md)                       | TestRail endpoints, SDK methods, CLI commands, and recipes |
| [Symbol index](../CODEMAP.md)                       | Public and internal symbols with file locations            |
| [Agent instructions](../AGENTS.md)                  | Summary of the repository rules for coding agents          |
| [Command reference](../skill/reference/commands.md) | CLI command table and option reference                     |

## Historical records

These documents describe the repository on the stated dates.

| Document                                                          | Date       | Content                                                                   |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| [TestRail 10.7.0 compatibility](TESTRAIL-10.7.0-COMPATIBILITY.md) | 2026-09-02 | Endpoint coverage for TestRail 10.7.0, with known gaps checked 2026-11-21 |
| [Repository review](reviews/2026-10-03-repository-review.md)      | 2026-10-03 | Nine findings against version 8.0.0 and their fixes                       |
| [Live-API schema audit](schema-audit-2026-06-22.md)               | 2026-06-22 | Differences between live responses and the schemas                        |
| [Backlog archive](archive/BACKLOG-ARCHIVE.md)                     | Ongoing    | Completed, rejected, and superseded backlog items                         |
