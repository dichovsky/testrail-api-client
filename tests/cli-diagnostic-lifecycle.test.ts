import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveAuth } from '../src/cli/auth.js';
import { readBoundedStdin } from '../src/cli/stdin.js';

vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));
vi.mock('node:child_process', async (importOriginal) => {
    const real = await importOriginal<typeof import('node:child_process')>();
    return { ...real, execFileSync: vi.fn(real.execFileSync) };
});
vi.mock('../src/cli/auth.js', async (importOriginal) => {
    const real = await importOriginal<typeof import('../src/cli/auth.js')>();
    return { ...real, resolveAuth: vi.fn(real.resolveAuth) };
});
vi.mock('../src/cli/stdin.js', () => ({ readBoundedStdin: vi.fn().mockReturnValue('offline-placeholder') }));

const nativePlatform = process.platform;
const originalArgv = process.argv.slice();
const originalExitCode = process.exitCode;
const originalListeners = new Map(
    (['exit', 'SIGINT', 'SIGTERM'] as const).map((event) => [event, process.listeners(event)]),
);
const fetch = vi.fn<typeof globalThis.fetch>();
let directory: string;
let diagnosticPath: string;
let throwOnOutput: boolean;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-lifecycle-'));
    diagnosticPath = join(directory, 'error.json');
    throwOnOutput = false;
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('TESTRAIL_BASE_URL', 'https://example.testrail.io');
    vi.stubEnv('TESTRAIL_EMAIL', 'offline@example.invalid');
    vi.stubEnv('TESTRAIL_API_KEY', 'offline-placeholder');
    vi.stubEnv('TESTRAIL_STRICT_RESPONSES', undefined);
    vi.stubEnv('TESTRAIL_TIMEOUT', undefined);
    fetch.mockReset().mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
});

afterEach(() => {
    Object.defineProperty(process, 'platform', { value: nativePlatform });
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    for (const [event, listeners] of originalListeners) {
        for (const listener of process.listeners(event)) {
            if (!listeners.includes(listener)) process.removeListener(event, listener);
        }
    }
    rmSync(directory, { recursive: true, force: true });
});

async function runCli(args: readonly string[]): Promise<{ stdout: string; stderr: string; code: unknown }> {
    process.argv = ['node', 'testrail', ...args, '--diagnostic-file', diagnosticPath];
    process.exitCode = undefined;
    const stdout: string[] = [];
    const stderr: string[] = [];
    const out = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        if (throwOnOutput) throw new Error('Output consumer failed after the request');
        stdout.push(String(chunk));
        return true;
    });
    const err = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
        stderr.push(String(chunk));
        return true;
    });
    try {
        await import('../src/cli.js');
        await vi.waitFor(() => expect(process.exitCode).not.toBeUndefined(), { interval: 1, timeout: 5_000 });
        return { stdout: stdout.join(''), stderr: stderr.join(''), code: process.exitCode };
    } finally {
        out.mockRestore();
        err.mockRestore();
    }
}

describe('diagnostic CLI invocation boundaries', () => {
    it.each([...new Set([nativePlatform, 'win32' as const])])(
        'ignores diagnostic destinations during successful and failing previews on %s',
        async (platform) => {
            Object.defineProperty(process, 'platform', { value: platform });
            writeFileSync(diagnosticPath, 'existing diagnostic');
            const successful = await runCli(['case', 'add', '7', '--data', '{"title":"Preview"}', '--dry-run']);
            expect(successful.code).toBe(0);
            expect(JSON.parse(successful.stdout)).toMatchObject({ dryRun: true, payload: { title: 'Preview' } });
            expect(successful.stderr).toBe('');

            vi.resetModules();
            const invalid = await runCli(['case', 'add', '7', '--data', '{}', '--dry-run']);
            expect(invalid.code).toBe(1);
            expect(invalid.stderr).toContain('title');
            expect(readFileSync(diagnosticPath, 'utf8')).toBe('existing diagnostic');
            expect(readdirSync(directory)).toEqual(['error.json']);
            expect(execFileSync).not.toHaveBeenCalled();
            expect(fetch).not.toHaveBeenCalled();
        },
    );

    it('rejects unsupported Windows diagnostics before consuming stdin or resolving credentials', async () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        vi.stubEnv('TESTRAIL_BASE_URL', undefined);
        vi.stubEnv('TESTRAIL_EMAIL', undefined);
        vi.stubEnv('TESTRAIL_API_KEY', undefined);
        const result = await runCli(['case', 'add', '7', '--api-key-stdin', '--data', '{"title":"Example"}']);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('--diagnostic-file is unavailable on Windows');
        expect(readBoundedStdin).not.toHaveBeenCalled();
        expect(resolveAuth).not.toHaveBeenCalled();
        expect(execFileSync).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
        expect(readdirSync(directory)).toEqual([]);
    });

    it.skipIf(nativePlatform === 'win32')('marks constructor failures as not dispatched', async () => {
        vi.stubEnv('TESTRAIL_BASE_URL', 'ftp://example.testrail.io');
        const result = await runCli(['case-field', 'list']);
        expect(result.code).toBe(1);
        expect(fetch).not.toHaveBeenCalled();
        expect(JSON.parse(readFileSync(diagnosticPath, 'utf8'))).toMatchObject({
            kind: 'cli_error',
            status: null,
            operationOutcome: 'not_dispatched',
        });
    });

    it.skipIf(nativePlatform === 'win32')('keeps post-request non-API errors indeterminate', async () => {
        throwOnOutput = true;
        const result = await runCli(['case-field', 'list']);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('Output consumer failed');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(JSON.parse(readFileSync(diagnosticPath, 'utf8'))).toMatchObject({
            kind: 'cli_error',
            status: null,
            operationOutcome: 'failed_or_indeterminate',
        });
    });

    it.skipIf(nativePlatform === 'win32')('removes its exit listener on normal completion', async () => {
        const registrations = vi.spyOn(process, 'on');
        const result = await runCli(['case-field', 'list']);
        expect(result.code).toBe(0);
        const cleanup = registrations.mock.calls.find(
            ([event, listener]) => event === 'exit' && listener.name === 'finishDiagnostic',
        )?.[1];
        expect(cleanup).toBeTypeOf('function');
        expect(process.listeners('exit')).not.toContain(cleanup);
        expect(readdirSync(directory)).toEqual([]);
    });
});
