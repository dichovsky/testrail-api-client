import { z } from 'zod';
import { TESTRAIL_USER_EMAIL_PATTERN } from '../constants.js';
import { zObject, type KnownResponse } from './common.js';

// ── Identity & User Schemas ───────────────────────────────────────────────────

export const UserSchema = zObject({
    id: z.number(),
    name: z.string(),
    // Response field: faithfully deserialize whatever TestRail returns. RFC 5321
    // permits non-FQDN domains (single-label, domain-literal) and IDN addresses,
    // which self-hosted / LDAP / AD / SSO instances legitimately store, so this is
    // a bare string — the shape check lives on the write payloads
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

export const RoleSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
    // Live-instance audit (get_roles): TestRail emits a per-role admin flag
    // alongside is_default. `.nullish()` — older servers omit it.
    is_project_admin: z.boolean().nullish(),
});

export const GroupSchema = zObject({
    id: z.number(),
    name: z.string(),
    user_ids: z.array(z.number()).nullish(),
});

export type Group = KnownResponse<typeof GroupSchema>;

/**
 * Group write-payload schemas (TestRail 7.5+). These schemas follow the
 * variable/shared-step/milestone payload-migration precedent. This file
 * declares each schema one time, as the source of truth for both of these
 * items:
 *
 * - the runtime validator (CLI `--data` resolver)
 * - the inferred TypeScript types that the programmatic client uses
 *
 * `.passthrough()` (through `zObject`) keeps any future `custom_*`-style
 * fields that TestRail can add to either endpoint.
 *
 * `UpdateGroupPayloadSchema` allows an empty body, as
 * `UpdateVariablePayloadSchema` / `UpdateSectionPayloadSchema` do. TestRail
 * itself accepts `{}` on update and returns the group with no change. The
 * client does NOT apply an "at least one field set" rule.
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

// One shape rule for a user's email on both write payloads, shared with the
// get_user_by_email lookup through TESTRAIL_USER_EMAIL_PATTERN.
const userEmailField = z.string().regex(TESTRAIL_USER_EMAIL_PATTERN, { message: 'Invalid email format' });

/**
 * User write-payload schemas (TestRail 7.3+). These schemas follow the
 * group/milestone payload pattern. This file declares each schema one time, as
 * the source of truth for both of these items:
 *
 * - the runtime validator (CLI `--data` resolver)
 * - the inferred TypeScript types that the programmatic client uses
 *
 * `.passthrough()` (through `zObject`) keeps any future fields that TestRail
 * can add to either endpoint.
 *
 * `UserAddPayloadSchema` requires only `name` and `email`, as in the
 * documented minimal request.
 * `UserUpdatePayloadSchema` allows a partial update (all fields optional),
 * with PATCH semantics. TestRail accepts an empty `{}` body and returns the
 * user with no change.
 *
 * Both schemas validate `email` with the same permissive shape rule as the
 * `get_user_by_email` lookup (`TESTRAIL_USER_EMAIL_PATTERN`), not with
 * `z.string().email()`. If the client can look up an address, the client must
 * also be able to create or set that address. This rule includes the
 * single-label (`ada@corp`) and domain-literal (`user@[192.168.1.1]`) forms
 * that self-hosted instances store.
 */
export const UserAddPayloadSchema = zObject({
    name: z.string().min(1),
    email: userEmailField,
    is_active: z.boolean().optional(),
    is_admin: z.boolean().optional(),
    role_id: z.number().int().positive().optional(),
    group_ids: z.array(z.number().int().positive()).optional(),
    mfa_required: z.boolean().optional(),
    email_notifications: z.boolean().optional(),
    sso_enabled: z.boolean().optional(),
    assigned_projects: z.array(z.number().int().positive()).optional(),
});

export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>;

export const UserUpdatePayloadSchema = zObject({
    name: z.string().min(1).optional(),
    email: userEmailField.optional(),
    is_active: z.boolean().optional(),
    is_admin: z.boolean().optional(),
    role_id: z.number().int().positive().optional(),
    group_ids: z.array(z.number().int().positive()).optional(),
    mfa_required: z.boolean().optional(),
    email_notifications: z.boolean().optional(),
    sso_enabled: z.boolean().optional(),
    assigned_projects: z.array(z.number().int().positive()).optional(),
});

export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>;
