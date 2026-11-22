# CONTEXT

This document is the domain glossary for `@dichovsky/testrail-api-client`. Each entry defines one term from the code. Add new terms when you introduce new concepts.

Other documents describe the repository structure:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) explains the system layers.
- [`CODEMAP.md`](CODEMAP.md) contains the symbol index.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) defines setup, verification, and code conventions.
- [`CLAUDE.md`](CLAUDE.md) defines the schema-authoring rules and the endpoint and CLI procedures.

---

## Request intent

The request intent defines the purpose of a request when the request structure does not show its behavior. Set this value on `RequestSpec.intent` (`src/http-pipeline-types.ts`). Omit this field for standard requests.

The request structure usually defines the required behavior. For example, a multipart body is not idempotent, and a binary GET request is safe to repeat. However, the request structure cannot show the server-side effect of an endpoint. Use `RequestSpec.intent` for two cases:

- **Side-effecting read**: A GET request that modifies server state. For example, the TestRail `run_report` endpoint generates a report and can send an email.
- **Fresh read**: A GET request that must bypass cache reads, cache writes, and in-flight request sharing.

These two values replace the older `retry` and `bypassCache` fields.

## Side-effecting read

A side-effecting read is a GET request that changes server state. The client retries this request only on HTTP `429` responses. A `429` rejection occurs before the server executes the request. Thus, the server does not generate a report or send an email. The client never retries `5xx` or network errors because the server state is unknown. The client never reads this response from the cache because a cached response hides the new report generation.

The `runReport` and `runCrossProjectReport` methods (`src/modules/reports.ts`) use this intent.

## Fresh read

A fresh read is a GET request that requires current data without modifying server state. The client bypasses cache reads, cache writes, and in-flight request sharing.

Bounded `getAll*()` pagination (`src/pagination.ts`) uses this intent. Caching individual pages can mix data from different times and evict unrelated cache entries.

## Upload ownership

Upload ownership is the SDK's responsibility for a supplied file descriptor from an upload method call through cleanup.

Ownership starts before ID validation and client-state checks. A rejected upload still releases its descriptor. Each upload requires a separately opened descriptor. Callers must not close or reuse a descriptor after they pass it to an upload method.

The **upload lifetime** includes this ownership, body preparation, transport observation, and cleanup. Nested SDK and request calls share one lifetime. An abort request alone does not prove that transmission stopped. Cleanup uses transport evidence so that an incomplete file does not appear complete.

A caller-visible timeout can occur before transport work settles. To wait for all associated work, use `trackOperation().settled`.

## Destructive action

A destructive action is a CLI command that deletes data or closes a run or plan. Real execution requires both `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`. The CLI validates the environment gate before authentication. After each handler validates its inputs, the shared destructive execution workflow (`src/cli/destructive.ts`) does these steps in this order:

1. It validates soft-mode support.
2. For a dry run, it writes a local preview and stops.
3. It requires confirmation (`--yes`).
4. It calls the SDK and reports success only after the SDK call succeeds.

`--dry-run` gives a local preview and does not call the SDK. It also bypasses both confirmation gates.

`--soft` requests a server-side preview on supported commands. It still sends a request and requires both gates. During a dry run, the CLI ignores an unsupported `--soft`. During real execution, the CLI rejects it.
