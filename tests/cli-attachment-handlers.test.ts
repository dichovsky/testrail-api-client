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
import { Readable } from 'node:stream';
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
import { captureOutput, type CapturedOutput, makeActionSpec } from './helpers.js';
import type { HandlerContext } from '../src/cli/handler-context.js';
import { parseCliPagination } from '../src/cli/pagination.js';

interface MockedClient {
    attachments: {
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
    };
}

function buildClient(): MockedClient {
    return {
        attachments: {
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
        },
    };
}

interface CtxOverrides {
    pathParams?: string[];
    file?: string;
    filename?: string;
    out?: string;
    limit?: string;
    offset?: string;
    dryRun?: boolean;
    stdoutIsTTY?: boolean;
    force?: boolean;
    confirmDestructive?: boolean;
    soft?: boolean;
}

interface BuiltCtx {
    ctx: HandlerContext;
    out: ReturnType<typeof vi.fn>;
    err: ReturnType<typeof vi.fn>;
    errRaw: ReturnType<typeof vi.fn>;
    captured: CapturedOutput;
}

function buildCtx(client: MockedClient, overrides: CtxOverrides = {}): BuiltCtx {
    const out = vi.fn();
    const err = vi.fn();
    const errRaw = vi.fn();
    // A real Output: `outPayload` writes the download bytes into `captured.stdout`
    // instead of the process stream the handler used to reach for.
    const captured = captureOutput({ stdoutIsTTY: overrides.stdoutIsTTY ?? false });
    const ctx: HandlerContext = {
        client: client as unknown as TestRailClient,
        actionSpec: makeActionSpec({ resource: 'attachment', action: 'delete' }),
        args: {
            pathParams: overrides.pathParams ?? [],
            ...(overrides.file !== undefined && { file: overrides.file }),
            ...(overrides.filename !== undefined && { filename: overrides.filename }),
            ...(overrides.out !== undefined && { out: overrides.out }),
            ...(overrides.limit !== undefined && { limit: overrides.limit }),
            ...(overrides.offset !== undefined && { offset: overrides.offset }),
            ...(overrides.soft !== undefined && { soft: overrides.soft }),
        },
        pagination: parseCliPagination(overrides),
        bodyInput: {},
        dryRun: overrides.dryRun ?? false,
        force: overrides.force ?? false,
        confirmDestructive: overrides.confirmDestructive ?? false,
        ...captured.output,
        out,
        err,
        errRaw,
    };
    return { ctx, out, err, errRaw, captured };
}

// ── list-for-* ────────────────────────────────────────────────────────────

describe('attachment list handlers', () => {
    it('list-for-case parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'] });
        await handleAttachmentListForCase(ctx);
        expect(client.attachments.getAttachmentsForCase).toHaveBeenCalledWith(42, {});
        expect(out).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('list-for-run parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'] });
        await handleAttachmentListForRun(ctx);
        expect(client.attachments.getAttachmentsForRun).toHaveBeenCalledWith(7, {});
        expect(out).toHaveBeenCalledWith([{ id: 2 }]);
    });

    it('list-for-test parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['8'] });
        await handleAttachmentListForTest(ctx);
        expect(client.attachments.getAttachmentsForTest).toHaveBeenCalledWith(8, {});
        expect(out).toHaveBeenCalledWith([{ id: 3 }]);
    });

    it('list-for-plan parses id and emits client result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['9'] });
        await handleAttachmentListForPlan(ctx);
        expect(client.attachments.getAttachmentsForPlan).toHaveBeenCalledWith(9);
        expect(out).toHaveBeenCalledWith([{ id: 4 }]);
    });

    it('list-for-plan-entry parses plan id (int) and entry id (UUID)', async () => {
        const client = buildClient();
        const entryId = '3933d74b-4282-4c1f-be62-a641ab427063';
        const { ctx, out } = buildCtx(client, { pathParams: ['9', entryId] });
        await handleAttachmentListForPlanEntry(ctx);
        expect(client.attachments.getAttachmentsForPlanEntry).toHaveBeenCalledWith(9, entryId);
        expect(out).toHaveBeenCalledWith([{ id: 5 }]);
    });

    it('list-for-plan-entry rejects a non-UUID entry id before client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['9', '10'] });
        await expect(handleAttachmentListForPlanEntry(ctx)).rejects.toThrow('entry_id must be a UUID string');
        expect(client.attachments.getAttachmentsForPlanEntry).not.toHaveBeenCalled();
    });

    it('list-for-case rejects non-positive id before client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['0'] });
        await expect(handleAttachmentListForCase(ctx)).rejects.toThrow();
        expect(client.attachments.getAttachmentsForCase).not.toHaveBeenCalled();
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
        expect(client.attachments.getAttachment).toHaveBeenCalledWith(42);
        expect(existsSync(p)).toBe(true);
        expect(Array.from(readFileSync(p))).toEqual([7, 8, 9]);
        expect(out).toHaveBeenCalledWith({ attachmentId: 42, out: p, size: 3 });
    });

    it('rejects missing --out', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleAttachmentGet(ctx)).rejects.toThrow('--out <path> required');
        expect(client.attachments.getAttachment).not.toHaveBeenCalled();
    });

    it('refuses to overwrite without --force', async () => {
        const client = buildClient();
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'old');
        const { ctx } = buildCtx(client, { pathParams: ['42'], out: p });
        await expect(handleAttachmentGet(ctx)).rejects.toThrow('Refusing to overwrite');
        expect(client.attachments.getAttachment).not.toHaveBeenCalled();
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
        expect(client.attachments.getAttachment).not.toHaveBeenCalled();
        expect(existsSync(p)).toBe(false);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment get',
            attachmentId: 42,
            out: p,
        });
    });

    it('accepts a UUID attachment_id (TestRail 7.1+)', async () => {
        const UUID_ID = '2ec27be4-812f-4806-9a5d-d39130d1691a';
        const client = buildClient();
        const p = join(tmp, 'uuid-fetched.bin');
        const { ctx, out } = buildCtx(client, { pathParams: [UUID_ID], out: p });
        await handleAttachmentGet(ctx);
        expect(client.attachments.getAttachment).toHaveBeenCalledWith(UUID_ID);
        expect(out).toHaveBeenCalledWith({ attachmentId: UUID_ID, out: p, size: 3 });
    });

    it('rejects a garbage attachment_id before API call', async () => {
        const client = buildClient();
        const p = join(tmp, 'nope.bin');
        const { ctx } = buildCtx(client, { pathParams: ['not-valid-id'], out: p });
        await expect(handleAttachmentGet(ctx)).rejects.toThrow(
            'attachment_id must be a positive integer or a UUID string',
        );
        expect(client.attachments.getAttachment).not.toHaveBeenCalled();
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
        expect(client.attachments.addAttachmentToCase).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ path: filePath }),
            'shot.png',
        );
        expect(out).toHaveBeenCalledWith({ attachment_id: 100 });
    });

    it('add-to-case rejects missing --file', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleAttachmentAddToCase(ctx)).rejects.toThrow('--file <path> required');
        expect(client.attachments.addAttachmentToCase).not.toHaveBeenCalled();
    });

    it('add-to-case dry-run skips API call and emits stat preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: filePath, dryRun: true });
        await handleAttachmentAddToCase(ctx);
        expect(client.attachments.addAttachmentToCase).not.toHaveBeenCalled();
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
        expect(client.attachments.addAttachmentToCase).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ path: filePath }),
            'renamed.png',
        );
    });

    it('add-to-result uploads correctly', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'], file: filePath });
        await handleAttachmentAddToResult(ctx);
        expect(client.attachments.addAttachmentToResult).toHaveBeenCalledWith(
            77,
            expect.objectContaining({ path: filePath }),
            'shot.png',
        );
    });

    it('add-to-result dry-run skips upload and returns (covers null-upload short-circuit)', async () => {
        // Exercises the `if (upload === null) return;` true branch in
        // handleAttachmentAddToResult. Without this, the result-specific
        // dry-run path is unverified.
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], file: filePath, dryRun: true });
        await handleAttachmentAddToResult(ctx);
        expect(client.attachments.addAttachmentToResult).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'attachment add-to-result', resultId: 77 }),
        );
    });

    it('add-to-run uploads correctly', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['88'], file: filePath });
        await handleAttachmentAddToRun(ctx);
        expect(client.attachments.addAttachmentToRun).toHaveBeenCalledWith(
            88,
            expect.objectContaining({ path: filePath }),
            'shot.png',
        );
    });

    it('add-to-run dry-run skips upload and returns (covers null-upload short-circuit)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['88'], file: filePath, dryRun: true });
        await handleAttachmentAddToRun(ctx);
        expect(client.attachments.addAttachmentToRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'attachment add-to-run', runId: 88 }),
        );
    });

    it('add-to-plan uploads correctly', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['99'], file: filePath });
        await handleAttachmentAddToPlan(ctx);
        expect(client.attachments.addAttachmentToPlan).toHaveBeenCalledWith(
            99,
            expect.objectContaining({ path: filePath }),
            'shot.png',
        );
    });

    it('add-to-plan dry-run skips upload and returns (covers null-upload short-circuit)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['99'], file: filePath, dryRun: true });
        await handleAttachmentAddToPlan(ctx);
        expect(client.attachments.addAttachmentToPlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'attachment add-to-plan', planId: 99 }),
        );
    });

    it('add-to-plan-entry uploads with plan id (int) and entry id (UUID)', async () => {
        const client = buildClient();
        const entryId = '3933d74b-4282-4c1f-be62-a641ab427063';
        const { ctx } = buildCtx(client, { pathParams: ['9', entryId], file: filePath });
        await handleAttachmentAddToPlanEntry(ctx);
        expect(client.attachments.addAttachmentToPlanEntry).toHaveBeenCalledWith(
            9,
            entryId,
            expect.objectContaining({ path: filePath }),
            'shot.png',
        );
    });

    it('add-to-plan-entry rejects a non-UUID entry id before upload', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['9', '10'], file: filePath });
        await expect(handleAttachmentAddToPlanEntry(ctx)).rejects.toThrow('entry_id must be a UUID string');
        expect(client.attachments.addAttachmentToPlanEntry).not.toHaveBeenCalled();
    });

    it('add-to-plan-entry dry-run preview includes both ids', async () => {
        const client = buildClient();
        const entryId = '3933d74b-4282-4c1f-be62-a641ab427063';
        const { ctx, out } = buildCtx(client, {
            pathParams: ['9', entryId],
            file: filePath,
            dryRun: true,
        });
        await handleAttachmentAddToPlanEntry(ctx);
        expect(client.attachments.addAttachmentToPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment add-to-plan-entry',
            planId: 9,
            entryId,
            file: filePath,
            filename: 'shot.png',
            size: 3,
        });
    });
});

// ── --file '-' (stdin upload) ──────────────────────────────────────────────

describe("attachment upload handlers with --file '-'", () => {
    const ORIG_STDIN = process.stdin;
    const ORIG_IS_TTY = process.stdin.isTTY;

    afterEach(() => {
        Object.defineProperty(process, 'stdin', {
            value: ORIG_STDIN,
            configurable: true,
            writable: false,
        });
        (process.stdin as { isTTY?: boolean }).isTTY = ORIG_IS_TTY;
    });

    function stubStdin(bytes: Uint8Array | string): void {
        const readable = Readable.from(typeof bytes === 'string' ? Buffer.from(bytes) : Buffer.from(bytes));
        (readable as { isTTY?: boolean }).isTTY = false;
        Object.defineProperty(process, 'stdin', {
            value: readable,
            configurable: true,
            writable: false,
        });
    }

    it('add-to-case reads bytes from stdin and uploads with default filename', async () => {
        stubStdin(new Uint8Array([0xff, 0xee, 0xdd]));
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'], file: '-' });
        await handleAttachmentAddToCase(ctx);
        const call = client.attachments.addAttachmentToCase.mock.calls[0];
        expect(call).toBeDefined();
        if (call === undefined) return;
        expect(call[0]).toBe(42);
        expect(Array.from(call[1] as Uint8Array)).toEqual([0xff, 0xee, 0xdd]);
        expect(call[2]).toBe('stdin');
    });

    it("add-to-case --file - --filename overrides default 'stdin'", async () => {
        stubStdin('hello');
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'], file: '-', filename: 'crash.txt' });
        await handleAttachmentAddToCase(ctx);
        expect(client.attachments.addAttachmentToCase).toHaveBeenCalledWith(42, expect.any(Uint8Array), 'crash.txt');
    });

    it('add-to-case --file - --dry-run does NOT drain stdin and reports source', async () => {
        let drainedBytes = 0;
        const readable = new Readable({
            read() {
                drainedBytes += 1;
                this.push(Buffer.from('x'));
                this.push(null);
            },
        });
        (readable as { isTTY?: boolean }).isTTY = false;
        Object.defineProperty(process, 'stdin', {
            value: readable,
            configurable: true,
            writable: false,
        });
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: '-', dryRun: true });
        await handleAttachmentAddToCase(ctx);
        expect(drainedBytes).toBe(0);
        expect(client.attachments.addAttachmentToCase).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment add-to-case',
            caseId: 42,
            file: '<stdin>',
            filename: 'stdin',
            size: 0,
            source: 'stdin',
        });
    });

    it('add-to-case --file - rejects when stdin is a TTY', async () => {
        (process.stdin as { isTTY?: boolean }).isTTY = true;
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'], file: '-' });
        await expect(handleAttachmentAddToCase(ctx)).rejects.toThrow(/stdin to be piped/);
        expect(client.attachments.addAttachmentToCase).not.toHaveBeenCalled();
    });
});

// ── --out '-' (stdout download) ────────────────────────────────────────────

describe("attachment get with --out '-'", () => {
    // No process-stream spy and no mutation of `process.stdout.isTTY`: the
    // payload, its ack, and the TTY warning all travel through the context's
    // own writers now, so the terminal state of the test runner is irrelevant.
    it('writes raw bytes to stdout and its JSON ack to stderr', async () => {
        const client = buildClient();
        const { ctx, out, captured } = buildCtx(client, { pathParams: ['42'], out: '-' });
        await handleAttachmentGet(ctx);

        expect(client.attachments.getAttachment).toHaveBeenCalledWith(42);
        // `out` renders JSON; the binary must not go through it.
        expect(out).not.toHaveBeenCalled();
        expect(Buffer.from(captured.stdout.join(''), 'binary').equals(Buffer.from([7, 8, 9]))).toBe(true);

        // The ack lands on stderr, keeping stdout a pure payload.
        const ack = captured.stderr.join('');
        expect(ack).toContain('"attachmentId": 42');
        expect(ack).toContain('"out": "<stdout>"');
        expect(ack).toContain('"size": 3');
    });

    it('warns about binary on a TTY but still writes the payload', async () => {
        const client = buildClient();
        const { ctx, captured } = buildCtx(client, { pathParams: ['42'], out: '-', stdoutIsTTY: true });
        await handleAttachmentGet(ctx);

        expect(captured.stderr.join('')).toContain('TTY');
        // A warning, not a refusal — piping to xxd from a terminal is legitimate.
        expect(Buffer.from(captured.stdout.join(''), 'binary').equals(Buffer.from([7, 8, 9]))).toBe(true);
    });

    it('dry-run with --out - emits preview to ctx.out, no fetch, no stdout writes', async () => {
        const client = buildClient();
        const { ctx, out, captured } = buildCtx(client, { pathParams: ['42'], out: '-', dryRun: true });
        await handleAttachmentGet(ctx);

        expect(client.attachments.getAttachment).not.toHaveBeenCalled();
        expect(captured.stdout).toEqual([]);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment get',
            attachmentId: 42,
            out: '<stdout>',
        });
    });
});

// ── delete (destructive) ──────────────────────────────────────────────────

describe('handleAttachmentDelete', () => {
    it('requires --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleAttachmentDelete(ctx)).rejects.toThrow('--yes to confirm');
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
    });

    it('deletes when --yes is set', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true });
        await handleAttachmentDelete(ctx);
        expect(client.attachments.deleteAttachment).toHaveBeenCalledWith(42);
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
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
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
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
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
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
    });

    it('deletes with a UUID attachment_id when --yes is set (TestRail 7.1+)', async () => {
        const UUID_ID = '2ec27be4-812f-4806-9a5d-d39130d1691a';
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: [UUID_ID], confirmDestructive: true });
        await handleAttachmentDelete(ctx);
        expect(client.attachments.deleteAttachment).toHaveBeenCalledWith(UUID_ID);
        expect(out).toHaveBeenCalledWith({ attachmentId: UUID_ID, deleted: true });
    });

    it('dry-run with UUID id skips API call and emits preview', async () => {
        const UUID_ID = '2ec27be4-812f-4806-9a5d-d39130d1691a';
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: [UUID_ID], dryRun: true });
        await handleAttachmentDelete(ctx);
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'attachment delete',
            attachmentId: UUID_ID,
            destructive: true,
        });
    });

    it('rejects a garbage attachment_id before any logic', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['not-valid-id'], confirmDestructive: true });
        await expect(handleAttachmentDelete(ctx)).rejects.toThrow(
            'attachment_id must be a positive integer or a UUID string',
        );
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
    });

    it('rejects --soft because delete_attachment has no soft-preview mode', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true, soft: true });
        await expect(handleAttachmentDelete(ctx)).rejects.toThrow('does not support --soft');
        expect(client.attachments.deleteAttachment).not.toHaveBeenCalled();
    });
});
