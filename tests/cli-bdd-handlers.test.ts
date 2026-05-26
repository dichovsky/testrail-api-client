/**
 * Unit tests for the 2 BDD handlers in src/cli/handlers/bdd.ts.
 *
 * Each handler is tested in isolation with a mocked TestRailClient (no
 * subprocess, no real HTTP). Coverage:
 *   - get: --out validated, text written to disk as UTF-8, JSON ack with
 *     byte size; dry-run skips both API call and write
 *   - add: --file resolved, client method invoked with bytes + filename;
 *     dry-run skips API call and emits a stat-only preview
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { handleBddGet, handleBddAdd } from '../src/cli/handlers/bdd.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    getBdd: ReturnType<typeof vi.fn>;
    addBdd: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return {
        getBdd: vi.fn().mockResolvedValue('Feature: Login\n  Scenario: ok\n'),
        addBdd: vi.fn().mockResolvedValue({ id: 42, title: 'BDD case' }),
    };
}

interface CtxOverrides {
    pathParams?: string[];
    file?: string;
    filename?: string;
    out?: string;
    dryRun?: boolean;
    force?: boolean;
}

function buildCtx(
    client: MockedClient,
    overrides: CtxOverrides = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn>; errRaw: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const errRaw = vi.fn();
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
        confirmDestructive: false,
        out,
        errRaw,
    };
    return { ctx, out, errRaw };
}

// ── bdd get ──────────────────────────────────────────────────────────────

describe('handleBddGet', () => {
    let tmp: string;
    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-bdd-get-'));
    });
    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('writes Gherkin text to --out and emits JSON ack with byte size', async () => {
        const client = buildClient();
        const p = join(tmp, 'login.feature');
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], out: p });
        await handleBddGet(ctx);
        expect(client.getBdd).toHaveBeenCalledWith(42);
        expect(existsSync(p)).toBe(true);
        const written = readFileSync(p, 'utf-8');
        expect(written).toBe('Feature: Login\n  Scenario: ok\n');
        expect(out).toHaveBeenCalledWith({
            caseId: 42,
            out: p,
            size: Buffer.byteLength(written, 'utf-8'),
        });
    });

    it('counts UTF-8 bytes (not characters) for multibyte content', async () => {
        const client = buildClient();
        // 4-byte emoji + ASCII; size must reflect bytes, not chars.
        client.getBdd.mockResolvedValueOnce('Feature: 🚀\n');
        const p = join(tmp, 'unicode.feature');
        const { ctx, out } = buildCtx(client, { pathParams: ['1'], out: p });
        await handleBddGet(ctx);
        const expected = Buffer.byteLength('Feature: 🚀\n', 'utf-8');
        expect(out).toHaveBeenCalledWith({ caseId: 1, out: p, size: expected });
    });

    it('writes empty string when case has no BDD content', async () => {
        const client = buildClient();
        client.getBdd.mockResolvedValueOnce('');
        const p = join(tmp, 'empty.feature');
        const { ctx, out } = buildCtx(client, { pathParams: ['1'], out: p });
        await handleBddGet(ctx);
        expect(readFileSync(p, 'utf-8')).toBe('');
        expect(out).toHaveBeenCalledWith({ caseId: 1, out: p, size: 0 });
    });

    it('rejects missing --out', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleBddGet(ctx)).rejects.toThrow('--out <path> required');
        expect(client.getBdd).not.toHaveBeenCalled();
    });

    it('refuses to overwrite without --force', async () => {
        const client = buildClient();
        const p = join(tmp, 'exists.feature');
        writeFileSync(p, 'old');
        const { ctx } = buildCtx(client, { pathParams: ['42'], out: p });
        await expect(handleBddGet(ctx)).rejects.toThrow('Refusing to overwrite');
        expect(client.getBdd).not.toHaveBeenCalled();
    });

    it('--force overwrites existing file', async () => {
        const client = buildClient();
        const p = join(tmp, 'exists.feature');
        writeFileSync(p, 'old');
        const { ctx } = buildCtx(client, { pathParams: ['42'], out: p, force: true });
        await handleBddGet(ctx);
        expect(readFileSync(p, 'utf-8')).toBe('Feature: Login\n  Scenario: ok\n');
    });

    it('dry-run skips API call and file write', async () => {
        const client = buildClient();
        const p = join(tmp, 'preview.feature');
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], out: p, dryRun: true });
        await handleBddGet(ctx);
        expect(client.getBdd).not.toHaveBeenCalled();
        expect(existsSync(p)).toBe(false);
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'bdd get',
            caseId: 42,
            out: p,
        });
    });

    it('rejects non-positive case_id before client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['0'], out: join(tmp, 'x.feature') });
        await expect(handleBddGet(ctx)).rejects.toThrow();
        expect(client.getBdd).not.toHaveBeenCalled();
    });

    describe("--out '-' (stdout)", () => {
        let stdoutSpy: ReturnType<typeof vi.spyOn>;
        let stdoutChunks: string[];

        beforeEach(() => {
            stdoutChunks = [];
            stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
                stdoutChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
                return true;
            });
        });

        afterEach(() => {
            stdoutSpy.mockRestore();
        });

        it("writes Gherkin text to stdout and routes JSON ack to errRaw (--out '-')", async () => {
            // Exercises the `resolved.target === 'stdout'` true branch and
            // the `ctx.errRaw !== undefined` true branch — JSON ack must
            // land on stderr via errRaw so the stdout binary stream stays
            // pure Gherkin.
            const client = buildClient();
            const { ctx, errRaw } = buildCtx(client, { pathParams: ['42'], out: '-' });
            await handleBddGet(ctx);
            expect(client.getBdd).toHaveBeenCalledWith(42);
            expect(stdoutChunks.join('')).toBe('Feature: Login\n  Scenario: ok\n');
            expect(errRaw).toHaveBeenCalledTimes(1);
            const ackCall = errRaw.mock.calls[0] as [string];
            const ack = JSON.parse(ackCall[0].trimEnd()) as Record<string, unknown>;
            expect(ack['caseId']).toBe(42);
            expect(ack['out']).toBe('<stdout>');
            expect(ack['size']).toBe(Buffer.byteLength('Feature: Login\n  Scenario: ok\n', 'utf-8'));
        });

        it("writes to stdout but silently skips ack when ctx.errRaw is undefined (defensive)", async () => {
            // Exercises the `if (ctx.errRaw !== undefined)` false branch.
            // Minimal-ctx callers (synthetic handlers, deferred tests) must
            // not crash when errRaw is missing — the binary stream still
            // lands on stdout, only the ack is dropped.
            const client = buildClient();
            const { ctx } = buildCtx(client, { pathParams: ['42'], out: '-' });
            // Remove errRaw to simulate a minimal ctx.
            const minimalCtx: HandlerContext = { ...ctx };
            delete (minimalCtx as { errRaw?: unknown }).errRaw;
            await handleBddGet(minimalCtx);
            expect(client.getBdd).toHaveBeenCalledWith(42);
            expect(stdoutChunks.join('')).toBe('Feature: Login\n  Scenario: ok\n');
        });
    });
});

// ── bdd add ──────────────────────────────────────────────────────────────

describe('handleBddAdd', () => {
    let tmp: string;
    let filePath: string;
    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-bdd-add-'));
        filePath = join(tmp, 'login.feature');
        writeFileSync(filePath, 'Feature: Login\n');
    });
    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('uploads bytes + filename and emits ack', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: filePath });
        await handleBddAdd(ctx);
        expect(client.addBdd).toHaveBeenCalledWith(42, expect.objectContaining({ path: filePath }), 'login.feature');
        expect(out).toHaveBeenCalledWith({ id: 42, title: 'BDD case' });
    });

    it('--filename overrides basename', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['42'],
            file: filePath,
            filename: 'renamed.feature',
        });
        await handleBddAdd(ctx);
        expect(client.addBdd).toHaveBeenCalledWith(42, expect.objectContaining({ path: filePath }), 'renamed.feature');
    });

    it('rejects missing --file', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleBddAdd(ctx)).rejects.toThrow('--file <path> required');
        expect(client.addBdd).not.toHaveBeenCalled();
    });

    it('dry-run skips API call and emits stat preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: filePath, dryRun: true });
        await handleBddAdd(ctx);
        expect(client.addBdd).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'bdd add',
            caseId: 42,
            file: filePath,
            filename: 'login.feature',
            size: Buffer.byteLength('Feature: Login\n', 'utf-8'),
        });
    });

    it('rejects non-positive case_id before client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['0'], file: filePath });
        await expect(handleBddAdd(ctx)).rejects.toThrow();
        expect(client.addBdd).not.toHaveBeenCalled();
    });

    describe("--file '-' (stdin)", () => {
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

        it("uploads drained stdin bytes when --file is '-'", async () => {
            // Exercises the `resolved.source === 'stdin' && resolved.contents !== undefined`
            // true branch — stdin bytes are passed in-memory because a pipe
            // cannot be openAsBlob'd.
            stubStdin('Feature: PipedIn\n');
            const client = buildClient();
            const { ctx } = buildCtx(client, { pathParams: ['42'], file: '-' });
            await handleBddAdd(ctx);
            const call = client.addBdd.mock.calls[0];
            expect(call).toBeDefined();
            if (call === undefined) return;
            expect(call[0]).toBe(42);
            // Second arg should be a Uint8Array (stdin contents), not a path descriptor.
            const payload = call[1] as Uint8Array;
            expect(payload).toBeInstanceOf(Uint8Array);
            expect(Buffer.from(payload).toString('utf-8')).toBe('Feature: PipedIn\n');
            expect(call[2]).toBe('stdin');
        });

        it("dry-run with --file '-' reports source='stdin' and skips upload", async () => {
            // Exercises the `resolved.source === 'stdin' && { source: 'stdin' }`
            // spread true branch in the dry-run preview.
            stubStdin('Feature: PreviewOnly\n');
            const client = buildClient();
            const { ctx, out } = buildCtx(client, { pathParams: ['42'], file: '-', dryRun: true });
            await handleBddAdd(ctx);
            expect(client.addBdd).not.toHaveBeenCalled();
            expect(out).toHaveBeenCalledWith(
                expect.objectContaining({
                    dryRun: true,
                    action: 'bdd add',
                    caseId: 42,
                    file: '<stdin>',
                    filename: 'stdin',
                    source: 'stdin',
                }),
            );
        });
    });
});
