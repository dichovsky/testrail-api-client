import { z } from 'zod';
import { zObject } from './common.js';

// ── Project Schemas ───────────────────────────────────────────────────────────

export const ProjectSchema = zObject({
    id: z.number(),
    name: z.string(),
    announcement: z.string().nullish(),
    show_announcement: z.boolean().nullish(),
    is_completed: z.boolean().nullish(),
    completed_on: z.number().nullish(),
    suite_mode: z.number(),
    url: z.string(),
    // SPEC #2.1.1 — TestRail 7.3+ — absent on older servers; inferred type per field is
    // `T | null | undefined` (omitted vs explicit null vs typed value).
    default_role_id: z.number().nullish(),
    default_role: z.string().nullish(),
    // Per-project group assignment (TestRail 7.3+). Inner shape is the union of two
    // documented response forms — `.nullish()` per inner field plus `.passthrough()`
    // (via `zObject`) accepts both without rejecting valid TestRail responses:
    //   - `get_project` response item: `{ id, role, role_id }`
    //   - `update_project` response item: `{ id, role_id }` (no `role` name field)
    groups: z
        .array(
            zObject({
                id: z.number().nullish(),
                role: z.string().nullish(),
                role_id: z.number().nullish(),
            }),
        )
        .nullish(),
    // Per-project user assignment (TestRail Enterprise 7.3+ only — absent on
    // Professional and pre-7.3 servers). Inner shape is the union of two documented
    // response forms — same `.nullish()` per inner field + `.passthrough()` strategy
    // as `groups` above:
    //   - `get_project` response item: `{ id, global_role_id, global_role,
    //     project_role_id, project_role }`
    //   - `update_project` response item: `{ user_id, role_id }`
    users: z
        .array(
            zObject({
                id: z.number().nullish(),
                user_id: z.number().nullish(),
                global_role_id: z.number().nullish(),
                global_role: z.string().nullish(),
                project_role_id: z.number().nullish(),
                project_role: z.string().nullish(),
                role_id: z.number().nullish(),
            }),
        )
        .nullish(),
});

export type Project = z.infer<typeof ProjectSchema>;

// ── Project write payloads ────────────────────────────────────────────────────

export const AddProjectPayloadSchema = zObject({
    name: z.string(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    suite_mode: z.number().optional(),
});

export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>;

export const UpdateProjectPayloadSchema = zObject({
    name: z.string().optional(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    suite_mode: z.number().optional(),
});

export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>;
