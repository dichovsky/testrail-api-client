# CONTEXT

Domain glossary for `@dichovsky/testrail-api-client`. One entry per term that
names a concept in the code. Terms are added as they are introduced — this file
is grown deliberately, not filled in up front.

Structural documentation lives elsewhere and is not repeated here:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the layers fit together,
[`CODEMAP.md`](CODEMAP.md) for the symbol index, [`CLAUDE.md`](CLAUDE.md) for
working conventions.

---

## Request intent

The declared purpose of a request, for the two endpoint classes whose handling
cannot be derived from the request's shape. Lives on `RequestSpec.intent`
(`src/http-pipeline-types.ts`); omitted for every ordinary request.

It exists because a request's shape answers most questions on its own — a
multipart body is non-idempotent, a binary GET is safe to repeat — but it cannot
express what an _endpoint_ does. Two things only it can say:

- **Side-effecting read** — a GET that mutates server state. TestRail's
  `run_report` builds a report and the template may email it.
- **Fresh read** — a GET that must execute rather than be served from or
  published to the cache.

Both replace the former `retry` + `bypassCache` field pair, whose legal
combinations were documented rather than enforced.

## Side-effecting read

A GET that changes something. Retries `429` only — the rate limiter rejects
before execution, so nothing was generated and no mail was sent — and never
retries `5xx` or a network error, because those leave an ambiguous outcome. Never
served from the cache: a cached response would hide a generation the caller
explicitly asked for.

Used by `runReport` and `runCrossProjectReport` (`src/modules/reports.ts`).

## Fresh read

A GET that must reach TestRail rather than be answered from the cache, and whose
response must not be published to it either. Distinct from a _side-effecting
read_: a fresh read changes nothing on the server, it just must not be stale.

Used by bounded `getAll*()` aggregation (`src/pagination.ts`), where combining
differently aged cached pages would produce a snapshot that never existed, and
where publishing every page would evict unrelated entries.
