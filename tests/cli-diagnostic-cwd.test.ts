import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

const originalCwd = process.cwd();
const originalArgv = process.argv.slice();
const originalExitCode = process.exitCode;
const payload = {
    type: 'String',
    name: 'example_reference',
    label: 'Example Reference',
    include_all: true,
    configs: [{ context: { is_global: true, project_ids: [] }, options: { is_required: false } }],
};
const fetch = vi.fn<typeof globalThis.fetch>();
let directory: string;
let invocationCwd: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-cwd-'));
    mkdirSync(join(directory, 'reports'));
    writeFileSync(join(directory, 'field.json'), JSON.stringify(payload));
    process.chdir(directory);
    invocationCwd = process.cwd();
    vi.resetModules();
    vi.stubEnv('TESTRAIL_BASE_URL', 'https://example.testrail.io');
    vi.stubEnv('TESTRAIL_EMAIL', 'offline@example.invalid');
    vi.stubEnv('TESTRAIL_API_KEY', 'offline-placeholder');
    vi.stubEnv('TESTRAIL_STRICT_RESPONSES', undefined);
    vi.stubEnv('TESTRAIL_TIMEOUT', undefined);
    fetch.mockReset().mockRejectedValue(new Error('Unexpected HTTP request'));
    vi.stubGlobal('fetch', fetch);
});

afterEach(() => {
    process.chdir(originalCwd);
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
});

async function runCli(extra: readonly string[] = []): Promise<{ stdout: string; stderr: string; code: unknown }> {
    process.argv = [
        'node',
        'testrail',
        'case-field',
        'add',
        '--data-file',
        'field.json',
        '--diagnostic-file',
        'reports/error.json',
        ...extra,
    ];
    process.exitCode = undefined;
    const stdout: string[] = [];
    const stderr: string[] = [];
    const out = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
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

describe.skipIf(process.platform === 'win32')('diagnostic staging preserves CLI working-directory semantics', () => {
    it('resolves relative preview payloads without a diagnostic artifact', async () => {
        const result = await runCli(['--dry-run']);
        expect(result.code).toBe(0);
        expect(result.stderr).toBe('');
        expect(JSON.parse(result.stdout)).toMatchObject({ dryRun: true, payload });
        expect(process.cwd()).toBe(invocationCwd);
        expect(readdirSync(join(directory, 'reports'))).toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('restores cwd before the sole write request and saves the failure at the requested relative path', async () => {
        fetch.mockImplementation(async (_input, init) => {
            expect(process.cwd()).toBe(invocationCwd);
            expect(init?.method).toBe('POST');
            expect(init?.body).toBe(JSON.stringify(payload));
            return new Response(JSON.stringify({ error: 'Invalid field options.' }), {
                status: 400,
                statusText: 'Bad Request',
            });
        });
        const result = await runCli();
        expect(result.code).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('400 Bad Request');
        expect(process.cwd()).toBe(invocationCwd);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(readdirSync(join(directory, 'reports'))).toEqual(['error.json']);
        expect(JSON.parse(readFileSync(join(directory, 'reports', 'error.json'), 'utf8'))).toMatchObject({
            status: 400,
            server: { messages: ['Invalid field options.'] },
        });
    });

    it('restores cwd when reservation fails and preserves the existing destination', async () => {
        writeFileSync(join(directory, 'reports', 'error.json'), 'existing');
        const result = await runCli();
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('no API request was sent');
        expect(process.cwd()).toBe(invocationCwd);
        expect(readdirSync(join(directory, 'reports'))).toEqual(['error.json']);
        expect(readFileSync(join(directory, 'reports', 'error.json'), 'utf8')).toBe('existing');
        expect(fetch).not.toHaveBeenCalled();
    });
});
