import { z } from 'zod';
import { zObject } from './common.js';

// ── Test Schema ───────────────────────────────────────────────────────────────

export const TestSchema = zObject({
    id: z.number(),
    case_id: z.number(),
    status_id: z.number(),
    assignedto_id: z.number().nullish(),
    run_id: z.number(),
    title: z.string(),
    template_id: z.number().nullish(),
    type_id: z.number().nullish(),
    priority_id: z.number().nullish(),
    estimate: z.string().nullish(),
    estimate_forecast: z.string().nullish(),
    refs: z.string().nullish(),
    milestone_id: z.number().nullish(),
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // SPEC #2.1.7 — Labels on a test response.
    //
    // Inner field choices, per the documented `get_test` response example
    // (`{ id, title }`) plus cross-endpoint compatibility with the stand-alone
    // `get_label` endpoint and the richer Case-embedded form (SPEC #2.1.3):
    //   - `id`: required `z.number()`. Every documented response example carries
    //     a concrete integer ID; making it nullish would silently mask a
    //     malformed-response regression where TestRail stops sending it.
    //   - `title`: `.nullish()` — `get_test` and `get_case` examples use `title`,
    //     but the stand-alone `get_label` uses `name`. Accepting either lets a
    //     consumer carry a Label object between endpoints without re-casting.
    //   - `name`: `.nullish()` for the same cross-endpoint reason. Wire responses
    //     from `get_test` populate `title`, not `name`.
    //   - `created_by` / `created_on`: `.nullish()` because `get_test`'s
    //     documented example omits them entirely (only `get_case` emits them).
    // `.passthrough()` (via `zObject`) preserves any future inner keys.
    //
    // TODO: once SPEC #2.1.3 lands on main (PR #138 introduces
    // `LabelEmbeddedSchema` as the shared label-on-resource shape), swap this
    // inline `zObject({ ... })` for `z.array(LabelEmbeddedSchema).nullish()` so
    // both `CaseSchema.labels` and `TestSchema.labels` reference the same
    // single source of truth. Tracked as a follow-up so this PR remains
    // independently mergeable.
    labels: z
        .array(
            zObject({
                id: z.number(),
                title: z.string().nullish(),
                name: z.string().nullish(),
                created_by: z.number().nullish(),
                created_on: z.number().nullish(),
            }),
        )
        .nullish(),
});

export type Test = z.infer<typeof TestSchema>;
