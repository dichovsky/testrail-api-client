import { z } from 'zod';
import { zObject } from './common.js';

// ── Identity & User Schemas ───────────────────────────────────────────────────

export const UserSchema = zObject({
    id: z.number(),
    name: z.string(),
    // Response field: faithfully deserialize whatever TestRail returns. RFC 5321
    // permits non-FQDN domains (single-label, domain-literal) and IDN addresses,
    // which self-hosted / LDAP / AD / SSO instances legitimately store, so this is
    // a bare string — format enforcement lives on the write payloads
    // (UserAddPayloadSchema / UserUpdatePayloadSchema) and client config, not here (#236).
    email: z.string(),
    is_active: z.boolean(),
    role_id: z.number().nullish(),
    role: z.string().nullish(),
    // Absent in three distinct scenarios — `.nullish()` defends across all of them so the
    // inferred type for each field is `T | null | undefined` (key omitted vs explicit null
    // vs typed value):
    //   1. Version-gated: older TestRail servers (≤7.2) omit these keys entirely.
    //   2. Endpoint-shape: `get_current_user` returns a reduced shape even on 7.3+.
    //   3. Wire-null: TestRail may emit `null` for a key whose value is unset/unknown.
    email_notifications: z.boolean().nullish(),
    is_admin: z.boolean().nullish(),
    group_ids: z.array(z.number()).nullish(),
    // Live-instance audit: TestRail Cloud wire-encodes this flag as an INTEGER
    // (`0`/`1`), never a JSON boolean — observed on get_current_user / get_user /
    // get_users. A bare `z.boolean()` rejected the real response, so accept both
    // the integer and boolean forms (the sibling is_admin/email_notifications came
    // back as real booleans and are left as-is).
    mfa_required: z.union([z.boolean(), z.number()]).nullish(),
    // Enterprise-only (TestRail Enterprise 7.3+). Professional and pre-7.3 servers never
    // emit these keys, so `undefined` (omitted) is the dominant case in non-Enterprise
    // traffic; explicit `null` and typed values appear on Enterprise instances.
    sso_enabled: z.boolean().nullish(),
    assigned_projects: z.array(z.number()).nullish(),
});

export type User = z.infer<typeof UserSchema>;

export const RoleSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
    // Live-instance audit (get_roles): TestRail emits a per-role admin flag
    // alongside is_default. `.nullish()` — older servers omit it.
    is_project_admin: z.boolean().nullish(),
});

export type Role = z.infer<typeof RoleSchema>;

export const GroupSchema = zObject({
    id: z.number(),
    name: z.string(),
    user_ids: z.array(z.number()).nullish(),
});

export type Group = z.infer<typeof GroupSchema>;

/**
 * Group write-payload schemas (TestRail 7.5+). Mirror the
 * variable/shared-step/milestone payload-migration precedent: each schema is
 * declared once here as the source of truth for both the runtime validator
 * (CLI `--data` resolver) and the inferred TypeScript types consumed by the
 * programmatic client. `.passthrough()` (via `zObject`) preserves any future
 * `custom_*`-style fields TestRail may add to either endpoint.
 *
 * `UpdateGroupPayloadSchema` allows an empty body — mirrors
 * `UpdateVariablePayloadSchema` / `UpdateSectionPayloadSchema`. TestRail
 * itself accepts `{}` on update and returns the unchanged group; we do NOT
 * enforce "at least one field set" client-side.
 */
export const AddGroupPayloadSchema = zObject({
    name: z.string(),
    user_ids: z.array(z.number()).optional(),
});

export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>;

export const UpdateGroupPayloadSchema = zObject({
    name: z.string().optional(),
    user_ids: z.array(z.number()).optional(),
});

export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>;

/**
 * User write-payload schemas (TestRail 7.3+). Mirror the group/milestone
 * payload pattern: declared once here as the source of truth for both the
 * runtime validator (CLI `--data` resolver) and the inferred TypeScript types
 * consumed by the programmatic client. `.passthrough()` (via `zObject`)
 * preserves any future fields TestRail may add to either endpoint.
 *
 * `UserAddPayloadSchema` enforces `name`, `email`, and `password` as required
 * (all three are mandatory per the TestRail 7.3 API docs).
 * `UserUpdatePayloadSchema` allows partial update (all fields optional) —
 * PATCH semantics; an empty `{}` body is accepted by TestRail and returns
 * the unchanged user.
 *
 * Security note: `password` is accepted via `--data-file <path>` (file on
 * disk) or stdin pipe to avoid leaking credentials through shell history.
 * The CLI layer does not enforce this; callers must use a safe input mechanism.
 */
export const UserAddPayloadSchema = zObject({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
    is_active: z.boolean().optional(),
    role_id: z.number().int().positive().optional(),
    group_ids: z.array(z.number().int().positive()).optional(),
    mfa_required: z.boolean().optional(),
    language: z.string().optional(),
    email_notifications: z.boolean().optional(),
});

export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>;

export const UserUpdatePayloadSchema = zObject({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    role_id: z.number().int().positive().optional(),
    group_ids: z.array(z.number().int().positive()).optional(),
    mfa_required: z.boolean().optional(),
    language: z.string().optional(),
    email_notifications: z.boolean().optional(),
});

export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>;
