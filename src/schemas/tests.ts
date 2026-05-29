import { z } from 'zod';
import { zObject } from './common.js';
import { LabelEmbeddedSchema } from './metadata.js';

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
    // SPEC #2.1.7 — `labels` array uses the shared `LabelEmbeddedSchema` so the
    // same Label shape is enforced across `get_test` and `get_case` responses
    // and so a Label object can be carried between endpoints without re-casting.
    // See `LabelEmbeddedSchema` for inner field choices.
    labels: z.array(LabelEmbeddedSchema).nullish(),
});

export type Test = z.infer<typeof TestSchema>;
