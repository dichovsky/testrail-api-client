/**
 * Direct unit tests for the runDestructive helper in src/cli/run-destructive.ts.
 *
 * Covers all 7 branches:
 *   1. dryRun === true  → emits preview + returns (no execute, no throw)
 *   2. opts === undefined → skips soft check, falls through to yes-gate
 *   3. opts.softUnsupported === false → skips soft check, falls through to yes-gate
 *   4. opts.softUnsupported === true + ctx.args.soft === false → no throw, falls through to yes-gate
 *   5. opts.softUnsupported === true + ctx.args.soft === true → throws "--soft" error
 *   6. soft not triggered + confirmDestructive === false → throws "--yes" error
 *   7. full happy path: dryRun=false, soft not triggered, confirmDestructive=true → calls execute
 */
import { describe, it, expect, vi } from 'vitest';
import { runDestructive } from '../src/cli/run-destructive.js';
import type { HandlerContext } from '../src/cli/handler-context.js';
import type { TestRailClient } from '../src/client.js';

function buildCtx(overrides: {
    dryRun?: boolean;
    soft?: boolean;
    confirmDestructive?: boolean;
}): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: {} as unknown as TestRailClient,
        args: {
            pathParams: [],
            ...(overrides.soft !== undefined && { soft: overrides.soft }),
        },
        bodyInput: {},
        dryRun: overrides.dryRun ?? false,
        force: false,
        confirmDestructive: overrides.confirmDestructive ?? false,
        out,
    };
    return { ctx, out };
}

describe('runDestructive', () => {
    // Branch 1: dryRun === true
    it('emits preview with dryRun+destructive flags and returns without calling execute', async () => {
        const { ctx, out } = buildCtx({ dryRun: true });
        const execute = vi.fn().mockResolvedValue(undefined);
        const preview = { action: 'case delete-bulk', count: 3 };

        await runDestructive(ctx, preview, execute);

        expect(execute).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledOnce();
        expect(out).toHaveBeenCalledWith({ dryRun: true, destructive: true, action: 'case delete-bulk', count: 3 });
    });

    it('dryRun spreads all preview fields into the emitted object', async () => {
        const { ctx, out } = buildCtx({ dryRun: true });
        const preview = { action: 'run delete', runId: 42, extra: 'info' };

        await runDestructive(ctx, preview, vi.fn());

        expect(out).toHaveBeenCalledWith({ dryRun: true, destructive: true, action: 'run delete', runId: 42, extra: 'info' });
    });

    // Branch 2: opts === undefined → skips soft check, goes to yes-gate
    it('opts=undefined skips soft check and throws yes-gate error when confirmDestructive=false', async () => {
        const { ctx } = buildCtx({ dryRun: false, soft: true, confirmDestructive: false });
        const execute = vi.fn();

        await expect(runDestructive(ctx, { action: 'test' }, execute, undefined)).rejects.toThrow(
            'Destructive action; pass --yes to confirm.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    // Branch 3: opts.softUnsupported === false → skips soft check, goes to yes-gate
    it('opts.softUnsupported=false skips soft check even when soft=true', async () => {
        const { ctx } = buildCtx({ dryRun: false, soft: true, confirmDestructive: false });
        const execute = vi.fn();

        await expect(runDestructive(ctx, {}, execute, { softUnsupported: false })).rejects.toThrow(
            'Destructive action; pass --yes to confirm.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    // Branch 4: opts.softUnsupported === true + ctx.args.soft === false → no throw, falls through to yes-gate
    it('opts.softUnsupported=true + soft=false does not throw soft error', async () => {
        const { ctx } = buildCtx({ dryRun: false, soft: false, confirmDestructive: false });
        const execute = vi.fn();

        await expect(runDestructive(ctx, { action: 'plan delete' }, execute, { softUnsupported: true })).rejects.toThrow(
            'Destructive action; pass --yes to confirm.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    // Branch 5: opts.softUnsupported === true + ctx.args.soft === true → throws soft error
    it('throws soft-unsupported error when opts.softUnsupported=true and soft=true', async () => {
        const { ctx } = buildCtx({ dryRun: false, soft: true, confirmDestructive: true });
        const execute = vi.fn();
        const preview = { action: 'run delete' };

        await expect(runDestructive(ctx, preview, execute, { softUnsupported: true })).rejects.toThrow(
            'run delete does not support --soft.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    it('soft-unsupported error falls back to "this action" when preview has no action field', async () => {
        const { ctx } = buildCtx({ dryRun: false, soft: true, confirmDestructive: true });
        const execute = vi.fn();

        await expect(runDestructive(ctx, {}, execute, { softUnsupported: true })).rejects.toThrow(
            'this action does not support --soft.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    it('soft-unsupported error falls back to "this action" when preview action field is not a string', async () => {
        const { ctx } = buildCtx({ dryRun: false, soft: true, confirmDestructive: true });
        const execute = vi.fn();

        await expect(runDestructive(ctx, { action: 42 }, execute, { softUnsupported: true })).rejects.toThrow(
            'this action does not support --soft.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    // Branch 6: soft not triggered + confirmDestructive === false → throws yes-gate error
    it('throws yes-gate error when confirmDestructive=false', async () => {
        const { ctx } = buildCtx({ dryRun: false, confirmDestructive: false });
        const execute = vi.fn();

        await expect(runDestructive(ctx, { action: 'project delete' }, execute)).rejects.toThrow(
            'Destructive action; pass --yes to confirm.',
        );
        expect(execute).not.toHaveBeenCalled();
    });

    // Branch 7: full happy path
    it('calls execute when dryRun=false, soft not triggered, confirmDestructive=true', async () => {
        const { ctx, out } = buildCtx({ dryRun: false, confirmDestructive: true });
        const execute = vi.fn().mockResolvedValue(undefined);

        await runDestructive(ctx, { action: 'suite delete' }, execute);

        expect(execute).toHaveBeenCalledOnce();
        expect(out).not.toHaveBeenCalled();
    });

    it('happy path: resolves the promise returned by execute', async () => {
        const { ctx } = buildCtx({ dryRun: false, confirmDestructive: true });
        const execute = vi.fn().mockResolvedValue(undefined);

        await expect(runDestructive(ctx, {}, execute)).resolves.toBeUndefined();
        expect(execute).toHaveBeenCalledOnce();
    });
});
