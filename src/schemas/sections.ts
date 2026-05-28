import { z } from 'zod';
import { zObject } from './common.js';

// ── Section Schemas ───────────────────────────────────────────────────────────

export const SectionSchema = zObject({
    id: z.number(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    parent_id: z.number().nullish(),
    display_order: z.number(),
    depth: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

// ── Move-section payload (TestRail 6.5.2+) ────────────────────────────────────
// Both fields are optional AND nullable, encoding three semantics:
//   - `parent_id: null` / `after_id: null` — explicit move-to-root / move-to-top
//   - `parent_id: <number>` / `after_id: <number>` — move under/after that target
//   - field omitted entirely (undefined) — don't change that axis
// `.nullable().optional()` yields type `number | null | undefined`; the
// CLI body resolver and the client request serializer must preserve the
// null-vs-undefined distinction (do NOT collapse null → undefined). We
// deliberately do not impose `min(1)` here: TestRail performs its own
// validation, and 0 is a useful sentinel in some installs.
export const MoveSectionPayloadSchema = zObject({
    parent_id: z.number().nullable().optional(),
    after_id: z.number().nullable().optional(),
});

export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>;

// ── Section write payloads ────────────────────────────────────────────────────

// `suite_id` is required by TestRail when adding a section to a multi-suite-mode
// project (suite_mode 2 or 3) and forbidden in single-suite mode (suite_mode 1).
// Modelled as optional so both modes work; the server returns a 400 if the
// caller's mode/`suite_id` combination is invalid. We do NOT replicate that
// suite-mode interaction client-side — TestRail is the authoritative source on
// the project's mode at request time.
export const AddSectionPayloadSchema = zObject({
    name: z.string(),
    suite_id: z.number().optional(),
    parent_id: z.number().optional(),
    description: z.string().optional(),
});

export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>;

export const UpdateSectionPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
});

export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>;
