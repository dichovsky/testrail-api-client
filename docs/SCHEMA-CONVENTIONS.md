# Schema Conventions

Reference for authoring Zod schemas in `src/schemas.ts`. The five points below
codify the rules followed across the Results domain, which is the canonical
exemplar for both directions (response in `ResultSchema`, request in
`AddResultPayloadSchema` and the bulk-results cluster).

## 1. Naming

| Suffix                                               | Direction           | Purpose                                                        |
| ---------------------------------------------------- | ------------------- | -------------------------------------------------------------- |
| `XSchema`                                            | GET response        | Canonical entity shape (e.g., `ResultSchema`, `CaseSchema`).   |
| `AddXPayloadSchema`                                  | POST request body   | Create-payload (e.g., `AddResultPayloadSchema`).               |
| `UpdateXPayloadSchema`                               | POST request body   | Update-payload (e.g., `UpdateRunPayloadSchema`).               |
| `AddXResponseSchema`                                 | POST response       | **Only** when the POST response differs from the GET response. |
| `XEmbeddedSchema` / `XEntrySchema` / `XConfigSchema` | Response sub-schema | Nested shapes embedded inside `XSchema.field[]`.               |

The `AddXResponseSchema` suffix is reserved for genuine endpoint-level
divergence; see §5. The `AddCaseFieldResponseSchema` precedent introduced in
PR #146 is the current reference case.

## 2. Nullability

Response and request fields use different optionality markers — they are **not**
interchangeable.

- **`.nullish()`** (= `T | null | undefined`) on **response** fields where
  TestRail may return `null` or omit the key entirely. A response `.optional()`
  would fail to parse `{ field: null }` returned by the server.
- **`.optional()`** (= `T | undefined`) on **request** fields the caller may
  omit. A request `.nullish()` widens the input type with `null` for no reason
  (callers should `delete payload.field` or simply not set it).

`ResultSchema` (response) uses `.nullish()` on `comment`, `defects`,
`assignedto_id`, etc. `AddResultPayloadSchema` (request) uses `.optional()` on
the same logical fields. This asymmetry is deliberate.

## 3. No `.extend()` across directions

Inline request fields explicitly rather than extending a response schema (or
vice versa). Reason: `zObject` is defined as
`z.object(shape).passthrough()`, and the interaction between `.extend()` and
`.passthrough()` is not obvious — the inferred type and the parse-time
passthrough behavior can drift apart in confusing ways.

Existing precedent: the comment above `AddResultForCasePayloadSchema` in
`src/schemas.ts`:

> Inlined rather than `.extend(AddResultPayloadSchema)` so the passthrough()
> behavior is unambiguous and the inferred type stays a plain object literal.

The duplication across `AddResultPayloadSchema`,
`AddResultForCasePayloadSchema`, and `AddResultForTestPayloadSchema` is the
intended trade-off.

## 4. Sub-schema discipline

Response sub-schemas — `LabelEmbeddedSchema`, `PlanEntrySchema`,
`HistoryEntrySchema`, `CaseFieldConfigSchema`, and friends — are
**response-only by default**. They model what comes back from GET, including
server-populated fields and `.nullish()` optionality.

For request-side equivalents (e.g., the run shape inside an `add_plan_entry`
request body), define a **separate** sub-schema such as
`AddPlanEntryRunPayloadSchema`. Do **not** reuse a response sub-schema in a
payload, even when the field list looks similar — the optionality semantics
and the set of writeable fields almost always differ.

## 5. Endpoint-level divergence

When a POST/PUT response shape genuinely differs from the GET response —
different fields, different types — model the POST response as a separate
`AddXResponseSchema`.

Reference case (PR #146): TestRail's `add_case_field` POST returns
`configs` as a **JSON-encoded string**, while `get_case_fields` GET returns
`configs` as a **structured array**. The POST response is modeled as
`AddCaseFieldResponseSchema` (see `src/schemas.ts`) so `getCaseFields`
keeps its strict structured shape and `addCaseField` matches what the server
actually sends. Both schemas inherit `.passthrough()` via `zObject` so
forward-compatible response fields don't break the parse.

The bar for introducing an `AddXResponseSchema` is _observed_ divergence
backed by TestRail docs or response captures — not a hypothetical asymmetry.

---

This is the convention. Lint enforcement will follow in a later PR once the
existing schemas are audited for accidental conflations.

See `BACKLOG.md` → `SPEC #A.1` for the surrounding work item and the list of
follow-up phases (cross-domain audit, conflation fixes, lint test).
