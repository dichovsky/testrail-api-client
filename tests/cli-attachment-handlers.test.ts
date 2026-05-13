/**
 * Unit tests for the 12 attachment handlers in
 * src/cli/handlers/{attachment,attachment-write}.ts.
 *
 * Each handler is tested in isolation with a mocked TestRailClient (no
 * subprocess, no real HTTP). Coverage per category:
 *   - list-for-*: ID parsed, client method invoked, list emitted
 *   - get: --out validated, binary written to disk, JSON ack emitted; dry-run
 *     skips both API call and write
 *   - add-to-*: --file resolved, client method invoked with bytes+filename;
 *     dry-run skips API call and emits a preview with stat-only size
 *   - delete: --yes required, --dry-run wins over --yes
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    handleAttachmentListForCase,
    handleAttachmentListForRun,
    handleAttachmentListForTest,
    handleAttachmentListForPlan,
    handleAttachmentListForPlanEntry,
    handleAttachmentGet,
} from '../src/cli/handlers/attachment.js';
import {
    handleAttachmentAddToCase,
    handleAttachmentAddToResult,
    handleAttachmentAddToRun,
    handleAttachmentAddToPlan,
    handleAttachmentAddToPlanEntry,
    handleAttachmentDelete,
} from '../src/cli/handlers/attachment-write.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    getAttachmentsForCase: ReturnType<typeof vi.fn>;
    getAttachmentsForRun: ReturnType<typeof vi.fn>;
    getAttachmentsForTest: ReturnType<typeof vi.fn>;
    getAttachmentsForPlan: ReturnType<typeof vi.fn>;
    getAttachmentsForPlanEntry: ReturnType<typeof vi.fn>;
    getAttachment: ReturnType<typeof vi.fn>;
    addAttachmentToCase: ReturnType<typeof vi.fn>;
    addAttachmentToResult: ReturnType<typeof vi.fn>;
    addAttachmentToRun: ReturnType<typeof vi.fn>;
    addAttachmentToPlan: ReturnType<typeof vi.fn>;
    addAttachmentToPlanEntry: ReturnType<typeof vi.fn>;
    deleteAttachment: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return {
        getAttachmentsForCase: vi.fn().mockResolvedValue([{ id: 1 }]),
        getAttachmentsForRun: vi.fn().mockResolvedValue([{ id: 2 }]),
        getAttachmentsForTest: vi.fn().mockResolvedValue([{ id: 3 }]),
        getAttachmentsForPlan: vi.fn().mockResolvedValue([{ id: 4 }]),
        getAttachmentsForPlanEntry: vi.fn().mockResolvedValue([{ id: 5 }]),
        getAttachment: vi.fn().mockResolvedValue(new Uint8Array([7, 8, 9]).buffer),
        addAttachmentToCase: vi.fn().mockResolvedValue({ attachment_id: 100 }),
        addAttachmentToResult: vi.fn().mockResolvedValue({ attachment_id: 101 }),
        addAttachmentToRun: vi.fn().mockResolvedValue({ attachment_id: 102 }),
        addAttachmentToPlan: vi.fn().mockResolvedValue({ attachment_id: 103 }),
        addAttachmentToPlanEntry: vi.fn().mockResolvedValue({ attachment_id: 104 }),
        deleteAttachment: vi.fn().mockResolvedValue(undefined),
    };
}

interface CtxOverrides {
    pathParams?: string[];
    file?: string;
    filename?: string;
    out?: string;
    dryRun?: boolean;
    force?: boolean;
    confirmDestructive?: boolean;
}

function buildCtx(
    client: MockedClient,
    overrides: CtxOverrides = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: client as unknown as TestRailClient,
        args: {
            pathParams: overrides.pathParams ?? [],
            ...(overrides.file !== undefined && { file: overrides.file }),
            ...(overrides.filename !== undefined && { filename: overrides.filename }),
            ...(overrides.out !== undefined && { out: overrides.out }),
        },
        bodyInput: {},
        dryRun: overrides.dryRun ?? false,
        force: overrides.force ?? false,
        confirmDestructive: overrides.confirmDestructive ?? false,
        out,
    };
    return { ctx, out };
}

// ── list-for-* ────────────────────────────────────────────────────────────

describe('attachment list handlers', () => {
    it('list-for-case parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'] });
        await handleAttachmentListForCase(ctx);
        expect(client.getAttachmentsForCase).toHaveBeenCalledWith(42);
        expect(out).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('list-for-run parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'] });
        await handleAttachmentListForRun(ctx);
        expect(client.getAttachmentsForRun).toHaveBeenCalledWith(7);
        expect(out).toHaveBeenCalledWith([{ id: 2 }]);
    });

    it('list-for-test parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['8'] });
        await handleAttachmentListForTest(ctx);
        expect(client.getAttachmentsForTest).toHaveBeenCalledWith(8);
        expect(out).toHaveBeenCalledWith([{ id: 3 }]);
    });

    it('list-for-plan parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['9'] });
        await handleAttachmentListForPlan(ctx);
        expect(client.getAttachmentsForPlan).toHaveBeenCalledWith(9);
        expect(out).toHaveBeenCalledWith([{ id: 4 }]);
    });

    it('list-for-plan-entry parses both ids', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['9', '10'] });
        await handleAttachmentListForPlanEntry(ctx);
        expect(client.getAttachmentsForPlanEntry).toHaveBeenCalledWith(9, 10);
        expect(out).toHaveBeenCalledWith([{ id: 5 }]);
    });

    it('list-for-case rejects non-positive id before client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['0'] });
        await expect(handleAttachmentListForCase(ctx)).rejects.toThrow();
        expect(client.getAttachmentsForCase).not.toHaveBeenCalled();
    });
});

// ── get (download) ────────────────────────────────────────────────────────

describe('handleAttachmentGet', () => {
    let tmp: string;
    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-get-'));
    });
    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('writes binary to --out and emits JSON ack', async () => {
        const client = buildClient();
        const p = join(tmp, 'fetched.bin');
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], out: p });
        await handleAttachmentGet(ctx);
        expect(client.getAttachment).toHaveBeenCalledWith(42);
        expect(existsSync(p)).toBe(true);
        expect(Array.from(readFileSync(p))).toEqual([7, 8, 9]);
        expect(out).toHaveBeenCalledWith({ attachmentId: 42, out: p, size: 3 });
    });

    it('rejects missing --out', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleAttachmentGet(ctx)).rejects.toThrow('--out <path> required');
        expect(client.getAttachment).not.toHaveBeenCalled();
    });

    it('refuses to overwrite without --force', async () => {
        const client = buildClient();
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'old');
        const { ctx } = buildCtx(client, { pathParams: ['42'], out: p });
        await expect(handleAttachmentGet(ctx)).rejects.toThrow('Refusing to overwrite');
        expect(client.getAttachment).not.toHaveBeenCalled();
    });

    it('--force overwrites', async () => {
        const client = buildClient();
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'old');
        const { ctx } = buildCtx(client, { pathParams: ['42'], out: p, force: true });
        await handleAttachmentGet(ctx);
        expect(Array.from(readFileSync(p))).toEqual([7, 8, 9]);
    });

    it('dry-run skips API call and file write', async () => {
        const client = buildClient();
        const p = join(tmp, 'preview.bin');
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], out: p, dryRun: true });
        await handleAttachmentGet(ctx);
        expect(client.getAttachment).not.toHaveBeenCalled();
        expect(existsSync(p)).toBe(false);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment get',
            attachmentId: 42,
            out: p,
        });
    });
});

// ── add-to-* ──────────────────────────────────────────────────────────────

describe('attachment upload handlers', () => {
    let tmp: string;
    let filePath: string;
    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-up-'));
        filePath = join(tmp, 'shot.png');
        writeFileSync(filePath, Buffer.from([1, 2, 3]));
    });
    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('add-to-case uploads bytes + filename and emits ack', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: filePath });
        await handleAttachmentAddToCase(ctx);
        expect(client.addAttachmentToCase).toHaveBeenCalledWith(42, expect.any(Uint8Array), 'shot.png');
        expect(out).toHaveBeenCalledWith({ attachment_id: 100 });
    });

    it('add-to-case rejects missing --file', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleAttachmentAddToCase(ctx)).rejects.toThrow('--file <path> required');
        expect(client.addAttachmentToCase).not.toHaveBeenCalled();
    });

    it('add-to-case dry-run skips API call and emits stat preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: filePath, dryRun: true });
        await handleAttachmentAddToCase(ctx);
        expect(client.addAttachmentToCase).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment add-to-case',
            caseId: 42,
            file: filePath,
            filename: 'shot.png',
            size: 3,
        });
    });

    it('add-to-case --filename overrides basename', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['42'],
            file: filePath,
            filename: 'renamed.png',
        });
        await handleAttachmentAddToCase(ctx);
        expect(client.addAttachmentToCase).toHaveBeenCalledWith(42, expect.any(Uint8Array), 'renamed.png');
    });

    it('add-to-result uploads correctly', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'], file: filePath });
        await handleAttachmentAddToResult(ctx);
        expect(client.addAttachmentToResult).toHaveBeenCalledWith(77, expect.any(Uint8Array), 'shot.png');
    });

    it('add-to-run uploads correctly', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['88'], file: filePath });
        await handleAttachmentAddToRun(ctx);
        expect(client.addAttachmentToRun).toHaveBeenCalledWith(88, expect.any(Uint8Array), 'shot.png');
    });

    it('add-to-plan uploads correctly', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['99'], file: filePath });
        await handleAttachmentAddToPlan(ctx);
        expect(client.addAttachmentToPlan).toHaveBeenCalledWith(99, expect.any(Uint8Array), 'shot.png');
    });

    it('add-to-plan-entry uploads with both ids', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['9', '10'], file: filePath });
        await handleAttachmentAddToPlanEntry(ctx);
        expect(client.addAttachmentToPlanEntry).toHaveBeenCalledWith(9, 10, expect.any(Uint8Array), 'shot.png');
    });

    it('add-to-plan-entry dry-run preview includes both ids', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['9', '10'],
            file: filePath,
            dryRun: true,
        });
        await handleAttachmentAddToPlanEntry(ctx);
        expect(client.addAttachmentToPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment add-to-plan-entry',
            planId: 9,
            entryId: 10,
            file: filePath,
            filename: 'shot.png',
            size: 3,
        });
    });
});

// ── delete (destructive) ──────────────────────────────────────────────────

describe('handleAttachmentDelete', () => {
    it('requires --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleAttachmentDelete(ctx)).rejects.toThrow('--yes to confirm');
        expect(client.deleteAttachment).not.toHaveBeenCalled();
    });

    it('deletes when --yes is set', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true });
        await handleAttachmentDelete(ctx);
        expect(client.deleteAttachment).toHaveBeenCalledWith(42);
        expect(out).toHaveBeenCalledWith({ attachmentId: 42, deleted: true });
    });

    it('dry-run skips API call even with --yes (dry-run wins)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['42'],
            dryRun: true,
            confirmDestructive: true,
        });
        await handleAttachmentDelete(ctx);
        expect(client.deleteAttachment).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment delete',
            attachmentId: 42,
            destructive: true,
        });
    });

    it('dry-run preview emitted even without --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], dryRun: true });
        await handleAttachmentDelete(ctx);
        expect(client.deleteAttachment).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment delete',
            attachmentId: 42,
            destructive: true,
        });
    });

    it('rejects non-positive id', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['0'], confirmDestructive: true });
        await expect(handleAttachmentDelete(ctx)).rejects.toThrow();
        expect(client.deleteAttachment).not.toHaveBeenCalled();
    });
});
