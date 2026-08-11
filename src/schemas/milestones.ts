import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Milestone Schema ──────────────────────────────────────────────────────────

const MilestoneBaseSchema = zObject({
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
    // SPEC #2.1.9 — `is_started` response field. TestRail 5.3+ — older servers
    // omit the key entirely.
    //
    // Was `.optional()` on the reasoning that the docs describe a plain boolean
    // and never mention null, so admitting null would be over-defence. 6.0.0
    // reverses that: the published docs are not a reliable description of the
    // wire (they document a `{step_history}` wrapper for a bare array, a
    // boolean `mfa_required` for an integer, and `is_untested` on the wrong
    // endpoint entirely). The costs are asymmetric — admitting a null that
    // never arrives costs nothing, while rejecting one that does discards the
    // entire milestone list. `.nullish()`.
    is_started: z.boolean().nullish(),
});

type MilestoneBase = z.output<z.ZodObject<typeof MilestoneBaseSchema.shape>>;
type MilestoneNode = MilestoneBase & { milestones?: MilestoneNode[] | null | undefined };

// The lazy callback is evaluated only while parsing, after MilestoneSchema has
// initialized. Its explicit recursive output keeps child milestones fully
// typed without erasing the outer object's `.shape` API.
const MilestoneNodeSchema: z.ZodType<MilestoneNode> = z.lazy(() => MilestoneSchema);

export const MilestoneSchema = zObject({
    ...MilestoneBaseSchema.shape,
    milestones: z.array(MilestoneNodeSchema).nullish(),
});

export type Milestone = KnownResponse<typeof MilestoneSchema>;

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
