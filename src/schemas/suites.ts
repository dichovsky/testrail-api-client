import { z } from 'zod';
import { zObject } from './common.js';

// ── Suite Schemas ─────────────────────────────────────────────────────────────

export const SuiteSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    project_id: z.number(),
    is_master: z.boolean().nullish(),
    is_baseline: z.boolean().nullish(),
    is_completed: z.boolean().nullish(),
    completed_on: z.number().nullish(),
    url: z.string(),
});

export type Suite = z.infer<typeof SuiteSchema>;

// ── Suite write payloads ──────────────────────────────────────────────────────

export const AddSuitePayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
});

export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>;

export const UpdateSuitePayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
});

export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>;
