import { z } from 'zod';
import { zObject } from './common.js';

// ── Configuration Schemas ─────────────────────────────────────────────────────

export const ConfigurationSchema = zObject({
    id: z.number(),
    name: z.string(),
    group_id: z.number(),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export const ConfigurationGroupSchema = zObject({
    id: z.number(),
    name: z.string(),
    project_id: z.number(),
    configs: z.array(ConfigurationSchema),
});

export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>;

// ── Configuration write payloads ──────────────────────────────────────────────
// TestRail's `add_config_group` / `update_config_group` / `add_config` /
// `update_config` endpoints accept only `{ name }`. Both group- and config-level
// operations share the same trivial payload shape, but they're kept as four
// separate schemas (instead of one shared `NamePayloadSchema`) so each can grow
// independently if TestRail extends one endpoint with additional optional fields.
// `.passthrough()` (via `zObject`) preserves any future `custom_*`-style fields.

export const AddConfigurationGroupPayloadSchema = zObject({
    name: z.string(),
});

export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>;

export const UpdateConfigurationGroupPayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>;

export const AddConfigurationPayloadSchema = zObject({
    name: z.string(),
});

export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>;

export const UpdateConfigurationPayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>;
