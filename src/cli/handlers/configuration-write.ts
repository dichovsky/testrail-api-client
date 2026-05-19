import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import {
    AddConfigurationGroupPayloadSchema,
    UpdateConfigurationGroupPayloadSchema,
    AddConfigurationPayloadSchema,
    UpdateConfigurationPayloadSchema,
} from '../../schemas.js';

// ── Config group CRUD ────────────────────────────────────────────────────────
// `configuration-group` is a separate CLI resource from `configuration` because
// the parent/child shape on the server is asymmetric: groups live at the
// project level and own a `configs[]` array, while configs are addressed by
// their own `config_id` and never appear standalone. Splitting the resource
// namespace keeps the path-param contract unambiguous (`<project_id>` for
// groups vs `<config_group_id>` / `<config_id>` for configs).

export async function handleConfigurationGroupAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddConfigurationGroupPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'configuration-group add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addConfigurationGroup(projectId, body.payload));
}

export async function handleConfigurationGroupUpdate(ctx: HandlerContext): Promise<void> {
    const configGroupId = parseId(ctx.args.pathParams[0], 'config_group_id');
    const body = resolveBody(ctx.bodyInput, UpdateConfigurationGroupPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'configuration-group update',
            configGroupId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateConfigurationGroup(configGroupId, body.payload));
}

/**
 * Destructive: deletes a configuration group along with every config inside
 * it. Gated by `--yes`; `--dry-run` wins for preview-without-API. TestRail's
 * `delete_config_group` does NOT support `soft=1`, so `--soft` is rejected
 * here rather than silently dropped — keeping destructive intent unambiguous
 * (mirrors `milestone delete` / `project delete`).
 *
 * Cascade caveat: deleting a group invalidates every plan entry that
 * references one of its configs. Prefer deleting individual configs first
 * (`configuration delete`) if you only need to retire a subset.
 */
export async function handleConfigurationGroupDelete(ctx: HandlerContext): Promise<void> {
    const configGroupId = parseId(ctx.args.pathParams[0], 'config_group_id');

    if (ctx.args.soft === true) {
        throw new Error('configuration-group delete does not support --soft.');
    }

    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'configuration-group delete', configGroupId, destructive: true });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.deleteConfigurationGroup(configGroupId);
    ctx.out({ configGroupId, deleted: true });
}

// ── Config (leaf) CRUD ───────────────────────────────────────────────────────

export async function handleConfigurationAdd(ctx: HandlerContext): Promise<void> {
    const configGroupId = parseId(ctx.args.pathParams[0], 'config_group_id');
    const body = resolveBody(ctx.bodyInput, AddConfigurationPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'configuration add',
            configGroupId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addConfiguration(configGroupId, body.payload));
}

export async function handleConfigurationUpdate(ctx: HandlerContext): Promise<void> {
    const configId = parseId(ctx.args.pathParams[0], 'config_id');
    const body = resolveBody(ctx.bodyInput, UpdateConfigurationPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'configuration update',
            configId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateConfiguration(configId, body.payload));
}

/**
 * Destructive: deletes a single configuration (leaf). Gated by `--yes`;
 * `--dry-run` wins for preview-without-API. TestRail's `delete_config` does
 * NOT support `soft=1`; `--soft` is rejected. Deleting a config removes it
 * from any plan entries that referenced it (no cascade across runs/results,
 * but plan entry config selections lose this option).
 */
export async function handleConfigurationDelete(ctx: HandlerContext): Promise<void> {
    const configId = parseId(ctx.args.pathParams[0], 'config_id');

    if (ctx.args.soft === true) {
        throw new Error('configuration delete does not support --soft.');
    }

    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'configuration delete', configId, destructive: true });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.deleteConfiguration(configId);
    ctx.out({ configId, deleted: true });
}
