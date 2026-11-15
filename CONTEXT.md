# CONTEXT

This document is the domain glossary for `@dichovsky/testrail-api-client`. Each entry defines one term from the code. Add new terms when you introduce new concepts.

Other documents describe the repository structure:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) explains the system layers.
- [`CODEMAP.md`](CODEMAP.md) contains the symbol index.
- [`CLAUDE.md`](CLAUDE.md) defines the repository rules.

---

## Request intent

The request intent defines the purpose of a request when the request structure does not show its behavior. Set this value on `RequestSpec.intent` (`src/http-pipeline-types.ts`). Omit this field for standard requests.

The request structure usually defines the required behavior. For example, a multipart body is not idempotent, and a binary GET request is safe to repeat. However, the request structure cannot show the server-side effect of an endpoint. Use `RequestSpec.intent` for two cases:

- **Side-effecting read**: A GET request that modifies server state. For example, the TestRail `run_report` endpoint generates a report and can send an email.
- **Fresh read**: A GET request that must bypass the cache for both reads and writes.

These two values replace the older `retry` and `bypassCache` fields.

## Side-effecting read

A side-effecting read is a GET request that changes server state. The client retries this request only on HTTP `429` responses. The rate limiter rejects `429` requests before execution, so the server does not generate a report or send an email. The client never retries `5xx` or network errors because the server state is unknown. The client never reads this response from the cache because a cached response hides the new report generation.

The `runReport` and `runCrossProjectReport` methods (`src/modules/reports.ts`) use this intent.

## Fresh read

A fresh read is a GET request that must go directly to the TestRail server. The client does not read the response from the cache and does not write the response to the cache. Unlike a side-effecting read, a fresh read does not modify server state. It only requires current data.

Bounded `getAll*()` pagination (`src/pagination.ts`) uses this intent. Caching individual pages can mix data from different times and evict unrelated cache entries.
