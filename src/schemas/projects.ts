import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

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

export type Project = KnownResponse<typeof ProjectSchema>;

// ── Project write payloads ────────────────────────────────────────────────────

export const AddProjectPayloadSchema = zObject({
    name: z.string(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    suite_mode: z.number().optional(),
});

export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>;

// TestRail 7.4 added project-level access updates. Role ID 0 means "Global
// Role" and null clears a project-specific role assignment, so this is
// intentionally non-negative and nullable rather than a positive-ID schema.
const ProjectAccessRoleIdPayloadSchema = z.number().int().nonnegative().nullable();

export const UpdateProjectGroupAssignmentPayloadSchema = zObject({
    id: z.number().int().positive(),
    role_id: ProjectAccessRoleIdPayloadSchema,
});

export type UpdateProjectGroupAssignmentPayload = z.infer<typeof UpdateProjectGroupAssignmentPayloadSchema>;

// TestRail's update_project example emits `user_id`, while the adjacent USERS
// field table calls the same identifier `id`. Accept both official forms, but
// model them as an exclusive union so both runtime parsing and the inferred
// public type require exactly one identifier.
export const UpdateProjectUserAssignmentPayloadSchema = z.union([
    zObject({
        id: z.number().int().positive(),
        user_id: z.never().optional(),
        role_id: ProjectAccessRoleIdPayloadSchema,
    }),
    zObject({
        id: z.never().optional(),
        user_id: z.number().int().positive(),
        role_id: ProjectAccessRoleIdPayloadSchema,
    }),
]);

export type UpdateProjectUserAssignmentPayload = z.infer<typeof UpdateProjectUserAssignmentPayloadSchema>;

export const UpdateProjectPayloadSchema = zObject({
    name: z.string().optional(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    suite_mode: z.number().optional(),
    default_role_id: z.number().int().nonnegative().optional(),
    groups: z.array(UpdateProjectGroupAssignmentPayloadSchema).optional(),
    users: z.array(UpdateProjectUserAssignmentPayloadSchema).optional(),
});

export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>;
