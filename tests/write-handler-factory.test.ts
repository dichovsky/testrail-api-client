/**
 * Direct unit tests for the CLI write-handler factories in
 * src/cli/write-handler-factory.ts. The handlers built on these factories are
 * also tested through tests/cli-write-handlers.test.ts; these tests target the
 * factory branches in isolation (every softMode/kind combination, the
 * previewExtras / formatOutput / allowEmptyBody / entryParam options, and the
 * error/gate paths) so the shared infrastructure is covered on its own terms.
 */
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { createWriteHandler, createDestructiveHandler } from '../src/cli/write-handler-factory.js';
import type { HandlerContext } from '../src/cli/handler-context.js';
import type { TestRailClient } from '../src/client.js';

const BodySchema = z.object({ name: z.string() }).passthrough();

interface CtxOverrides {
    pathParams?: string[];
    dataFlag?: string;
    dryRun?: boolean;
    confirmDestructive?: boolean;
    soft?: boolean;
}

function makeCtx(overrides: CtxOverrides = {}): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx = {
        client: {} as TestRailClient,
        args: {
            pathParams: overrides.pathParams ?? [],
            ...(overrides.soft !== undefined && { soft: overrides.soft }),
        },
        bodyInput: overrides.dataFlag !== undefined ? { dataFlag: overrides.dataFlag } : {},
        dryRun: overrides.dryRun ?? false,
        force: false,
        confirmDestructive: overrides.confirmDestructive ?? false,
        out,
    } as unknown as HandlerContext;
    return { ctx, out };
}

describe('createWriteHandler', () => {
    it('happy path: parses ids + body, calls client, emits result', async () => {
        const call = vi.fn().mockResolvedValue({ id: 7 });
        const handler = createWriteHandler({
            action: 'thing update',
            pathParams: ['thing_id'],
            bodySchema: BodySchema,
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['7'], dataFlag: '{"name":"x"}' });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [7], { name: 'x' }, '');
        expect(out).toHaveBeenCalledWith({ id: 7 });
    });

    it('no path params: idBag is empty', async () => {
        const call = vi.fn().mockResolvedValue({ ok: true });
        const handler = createWriteHandler({ action: 'thing add', bodySchema: BodySchema, call });
        const { ctx, out } = makeCtx({ dataFlag: '{"name":"x"}', dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({ dryRun: true, action: 'thing add', payload: { name: 'x' }, source: 'data' });
        expect(call).not.toHaveBeenCalled();
    });

    it('dry-run with previewExtras inserts extras before payload/source', async () => {
        const handler = createWriteHandler({
            action: 'thing add-bulk',
            pathParams: ['section_id'],
            bodySchema: z.array(z.object({ name: z.string() })),
            previewExtras: (body) => ({ count: body.length }),
            call: vi.fn(),
        });
        const { ctx, out } = makeCtx({ pathParams: ['3'], dataFlag: '[{"name":"a"},{"name":"b"}]', dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'thing add-bulk',
            sectionId: 3,
            count: 2,
            payload: [{ name: 'a' }, { name: 'b' }],
            source: 'data',
        });
    });

    it('formatOutput overrides the emitted success value', async () => {
        const call = vi.fn().mockResolvedValue(undefined);
        const handler = createWriteHandler({
            action: 'thing move',
            pathParams: ['thing_id'],
            bodySchema: BodySchema,
            call,
            formatOutput: ([thingId]) => ({ thingId, moved: true }),
        });
        const { ctx, out } = makeCtx({ pathParams: ['9'], dataFlag: '{"name":"x"}' });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({ thingId: 9, moved: true });
    });

    it('entryParam parses a UUID and threads it into call + idBag', async () => {
        const call = vi.fn().mockResolvedValue({ ok: true });
        const uuid = '12345678-1234-1234-1234-123456789abc';
        const handler = createWriteHandler({
            action: 'plan add-run-to-entry',
            pathParams: ['plan_id'],
            entryParam: 'entry_id',
            bodySchema: BodySchema,
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['5', uuid], dataFlag: '{"name":"x"}', dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'plan add-run-to-entry',
            planId: 5,
            entryId: uuid,
            payload: { name: 'x' },
            source: 'data',
        });
    });

    it('allowEmptyBody: absent body resolves to {} with source "default"', async () => {
        const call = vi.fn().mockResolvedValue({ ok: true });
        const handler = createWriteHandler({
            action: 'dataset update',
            pathParams: ['dataset_id'],
            bodySchema: BodySchema.partial(),
            allowEmptyBody: true,
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['4'], dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'dataset update',
            datasetId: 4,
            payload: {},
            source: 'default',
        });
    });

    it('allowEmptyBody: present body still flows through resolveBody', async () => {
        const call = vi.fn().mockResolvedValue({ ok: true });
        const handler = createWriteHandler({
            action: 'dataset update',
            pathParams: ['dataset_id'],
            bodySchema: BodySchema.partial(),
            allowEmptyBody: true,
            call,
        });
        const { ctx } = makeCtx({ pathParams: ['4'], dataFlag: '{"name":"y"}' });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [4], { name: 'y' }, '');
    });

    it('throws when the body fails validation', async () => {
        const handler = createWriteHandler({
            action: 'thing add',
            bodySchema: BodySchema,
            call: vi.fn(),
        });
        const { ctx } = makeCtx({ dataFlag: '{"wrong":1}' });
        await expect(handler(ctx)).rejects.toThrow(/validation failed/i);
    });

    it('throws when a required body is absent', async () => {
        const handler = createWriteHandler({ action: 'thing add', bodySchema: BodySchema, call: vi.fn() });
        const { ctx } = makeCtx({});
        await expect(handler(ctx)).rejects.toThrow(/body required/i);
    });

    it('throws when a path param is not a positive integer', async () => {
        const handler = createWriteHandler({
            action: 'thing update',
            pathParams: ['thing_id'],
            bodySchema: BodySchema,
            call: vi.fn(),
        });
        const { ctx } = makeCtx({ pathParams: ['0'], dataFlag: '{"name":"x"}' });
        await expect(handler(ctx)).rejects.toThrow(/positive integer/i);
    });
});

describe('createDestructiveHandler', () => {
    it('soft-unsupported delete (default): emits {id, deleted:true}', async () => {
        const call = vi.fn().mockResolvedValue(undefined);
        const handler = createDestructiveHandler({
            action: 'thing delete',
            pathParams: ['thing_id'],
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['8'], confirmDestructive: true });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [8], '', false);
        expect(out).toHaveBeenCalledWith({ thingId: 8, deleted: true });
    });

    it('soft-unsupported: dry-run preview omits the soft key', async () => {
        const handler = createDestructiveHandler({ action: 'thing delete', pathParams: ['thing_id'], call: vi.fn() });
        const { ctx, out } = makeCtx({ pathParams: ['8'], dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({ dryRun: true, action: 'thing delete', thingId: 8, destructive: true });
    });

    it('soft-unsupported: rejects --soft', async () => {
        const handler = createDestructiveHandler({ action: 'thing delete', pathParams: ['thing_id'], call: vi.fn() });
        const { ctx } = makeCtx({ pathParams: ['8'], soft: true, confirmDestructive: true });
        await expect(handler(ctx)).rejects.toThrow('thing delete does not support --soft.');
    });

    it('requires --yes when not in dry-run', async () => {
        const handler = createDestructiveHandler({ action: 'thing delete', pathParams: ['thing_id'], call: vi.fn() });
        const { ctx } = makeCtx({ pathParams: ['8'], confirmDestructive: false });
        await expect(handler(ctx)).rejects.toThrow(/pass --yes to confirm/i);
    });

    it('soft-optional + --soft: emits the preview, deletes nothing', async () => {
        const call = vi.fn().mockResolvedValue({ affected_cases: 3 });
        const handler = createDestructiveHandler({
            action: 'thing delete',
            pathParams: ['thing_id'],
            softMode: 'optional',
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['8'], soft: true, confirmDestructive: true });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [8], '', true);
        expect(out).toHaveBeenCalledWith({ thingId: 8, soft: true, deleted: false, preview: { affected_cases: 3 } });
    });

    it('soft-optional without --soft: deletes and emits {soft:false, deleted:true}', async () => {
        const call = vi.fn().mockResolvedValue(undefined);
        const handler = createDestructiveHandler({
            action: 'thing delete',
            pathParams: ['thing_id'],
            softMode: 'optional',
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['8'], confirmDestructive: true });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [8], '', false);
        expect(out).toHaveBeenCalledWith({ thingId: 8, soft: false, deleted: true });
    });

    it('soft-optional: dry-run preview includes soft key', async () => {
        const handler = createDestructiveHandler({
            action: 'thing delete',
            pathParams: ['thing_id'],
            softMode: 'optional',
            call: vi.fn(),
        });
        const { ctx, out } = makeCtx({ pathParams: ['8'], soft: true, dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'thing delete',
            thingId: 8,
            soft: true,
            destructive: true,
        });
    });

    it('kind close (softMode ignore): emits the returned entity, ignores --soft', async () => {
        const call = vi.fn().mockResolvedValue({ id: 8, is_completed: true });
        const handler = createDestructiveHandler({
            action: 'thing close',
            pathParams: ['thing_id'],
            softMode: 'ignore',
            kind: 'close',
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['8'], soft: true, confirmDestructive: true });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [8], '', false);
        expect(out).toHaveBeenCalledWith({ id: 8, is_completed: true });
    });

    it('entryParam: deletes with a UUID entry and emits both ids', async () => {
        const call = vi.fn().mockResolvedValue(undefined);
        const uuid = '12345678-1234-1234-1234-123456789abc';
        const handler = createDestructiveHandler({
            action: 'plan delete-entry',
            pathParams: ['plan_id'],
            entryParam: 'entry_id',
            call,
        });
        const { ctx, out } = makeCtx({ pathParams: ['5', uuid], confirmDestructive: true });
        await handler(ctx);
        expect(call).toHaveBeenCalledWith(ctx.client, [5], uuid, false);
        expect(out).toHaveBeenCalledWith({ planId: 5, entryId: uuid, deleted: true });
    });

    it('no path params: dry-run preview carries only the action + destructive flag', async () => {
        const handler = createDestructiveHandler({ action: 'thing purge', call: vi.fn() });
        const { ctx, out } = makeCtx({ dryRun: true });
        await handler(ctx);
        expect(out).toHaveBeenCalledWith({ dryRun: true, action: 'thing purge', destructive: true });
    });
});
