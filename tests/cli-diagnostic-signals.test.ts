import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliUrl = new URL('../src/cli.ts', import.meta.url).href;
const repository = fileURLToPath(new URL('..', import.meta.url));
const children: ChildProcess[] = [];
let directory: string;
let diagnosticPath: string;
let fixturePath: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-signals-'));
    diagnosticPath = join(directory, 'error.json');
    fixturePath = join(directory, 'signal-cli.mjs');
    // Execute the real CLI and its real process handlers. Only DNS and fetch
    // are replaced, so no TestRail account or external network is involved.
    writeFileSync(
        fixturePath,
        `import dns from 'node:dns/promises';
import { syncBuiltinESMExports } from 'node:module';
dns.lookup = async () => [{ address: '93.184.216.34', family: 4 }];
syncBuiltinESMExports();
let requests = 0;
globalThis.fetch = async (_input, init) => {
    process.send({ event: 'request', requests: ++requests, method: init.method });
    if (process.env.DIAGNOSTIC_FIXTURE_MODE === 'complete') {
        return new Response(JSON.stringify({ error: 'Required option missing.' }), { status: 400 });
    }
    return await new Promise(() => {});
};
let completed = false;
setInterval(() => {
    if (process.exitCode !== undefined && !completed) {
        completed = true;
        process.send({ event: 'complete', requests });
    }
}, 10);
await import(${JSON.stringify(cliUrl)});
`,
    );
});

afterEach(() => {
    for (const child of children.splice(0)) {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
    rmSync(directory, { recursive: true, force: true });
});

function startCli(mode: 'pending' | 'complete'): {
    child: ChildProcess;
    messages: unknown[];
    stderr: string[];
    exited: Promise<{ code: number | null; signal: ChildProcess['signalCode'] }>;
} {
    const child = spawn(
        process.execPath,
        [
            '--import',
            'tsx',
            fixturePath,
            'case',
            'add',
            '7',
            '--data',
            '{"title":"Signal cleanup probe"}',
            '--diagnostic-file',
            diagnosticPath,
        ],
        {
            cwd: repository,
            env: {
                ...process.env,
                TESTRAIL_BASE_URL: 'https://example.testrail.io',
                TESTRAIL_EMAIL: 'offline@example.invalid',
                TESTRAIL_API_KEY: 'offline-placeholder',
                TESTRAIL_TIMEOUT: '',
                TESTRAIL_STRICT_RESPONSES: '',
                DIAGNOSTIC_FIXTURE_MODE: mode,
            },
            stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        },
    );
    children.push(child);
    const messages: unknown[] = [];
    const stderr: string[] = [];
    child.on('message', (message: unknown) => messages.push(message));
    child.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()));
    const exited = new Promise<{ code: number | null; signal: ChildProcess['signalCode'] }>((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => resolve({ code, signal }));
    });
    return { child, messages, stderr, exited };
}

describe.skipIf(process.platform === 'win32')('diagnostics during actual CLI process termination', () => {
    it.each([
        ['SIGINT', 130],
        ['SIGTERM', 143],
    ] as const)('removes the pending reservation on %s and preserves exit %i', async (signal, code) => {
        const run = startCli('pending');
        await vi.waitFor(() => expect(run.messages).toContainEqual({ event: 'request', requests: 1, method: 'POST' }), {
            timeout: 5_000,
        });
        expect(statSync(diagnosticPath).size).toBe(0);
        expect(run.child.kill(signal)).toBe(true);
        expect(await run.exited).toEqual({ code, signal: null });
        expect(existsSync(diagnosticPath)).toBe(false);
        expect(run.messages).toEqual([{ event: 'request', requests: 1, method: 'POST' }]);
        expect(run.stderr.join('')).not.toContain('cleanup failed');
    });

    it('preserves a foreign replacement when terminated during the request', async () => {
        const run = startCli('pending');
        await vi.waitFor(() => expect(run.messages).toContainEqual({ event: 'request', requests: 1, method: 'POST' }), {
            timeout: 5_000,
        });
        unlinkSync(diagnosticPath);
        writeFileSync(diagnosticPath, 'foreign replacement');
        expect(run.child.kill('SIGTERM')).toBe(true);
        expect(await run.exited).toEqual({ code: 143, signal: null });
        expect(readFileSync(diagnosticPath, 'utf8')).toBe('foreign replacement');
        expect(run.stderr.join('')).toContain('Diagnostic file cleanup failed');
        expect(run.messages).toEqual([{ event: 'request', requests: 1, method: 'POST' }]);
    });

    it('does not close or remove a completed private record again on subsequent exit', async () => {
        const run = startCli('complete');
        await vi.waitFor(() => expect(run.messages).toContainEqual({ event: 'complete', requests: 1 }), {
            timeout: 5_000,
        });
        const diagnostic = readFileSync(diagnosticPath, 'utf8');
        expect(JSON.parse(diagnostic)).toMatchObject({ status: 400 });
        expect(statSync(diagnosticPath).mode & 0o777).toBe(0o600);
        expect(run.child.kill('SIGINT')).toBe(true);
        expect(await run.exited).toEqual({ code: 130, signal: null });
        expect(readFileSync(diagnosticPath, 'utf8')).toBe(diagnostic);
        expect(run.stderr.join('')).not.toContain('cleanup failed');
        expect(run.messages).toEqual([
            { event: 'request', requests: 1, method: 'POST' },
            { event: 'complete', requests: 1 },
        ]);
    });
});
