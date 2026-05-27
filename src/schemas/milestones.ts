import { z } from 'zod';
import { zObject } from './common.js';

// ── Milestone Schema ──────────────────────────────────────────────────────────

export const MilestoneSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    start_on: z.number().nullish(),
    started_on: z.number().nullish(),
    is_completed: z.boolean(),
    completed_on: z.number().nullish(),
    due_on: z.number().nullish(),
    project_id: z.number(),
    parent_id: z.number().nullish(),
    refs: z.string().nullish(),
    url: z.string(),
    // Sub-milestones are typed as unknown[] to avoid a recursive schema definition.
    milestones: z.array(z.unknown()).nullish(),
    // SPEC #2.1.9 — `is_started` response field. TestRail 5.3+ — older servers
    // omit the key entirely. Modelled as `.optional()` (not `.nullish()`) to
    // match the sibling `is_completed: z.boolean()` on this same schema: both
    // are documented as plain booleans, neither doc mentions a null value, so
    // accepting null on `is_started` would be an asymmetric over-defence
    // unsupported by the spec. `UpdateMilestonePayloadSchema` already accepts
    // `is_started` on the request side; this closes the response-side gap.
    is_started: z.boolean().optional(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

// ── Milestone write payloads ──────────────────────────────────────────────────

export const AddMilestonePayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
    due_on: z.number().optional(),
    start_on: z.number().optional(),
    parent_id: z.number().optional(),
    refs: z.string().optional(),
});

export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>;

export const UpdateMilestonePayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    due_on: z.number().optional(),
    start_on: z.number().optional(),
    parent_id: z.number().optional(),
    refs: z.string().optional(),
    is_completed: z.boolean().optional(),
    is_started: z.boolean().optional(),
});

export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>;
