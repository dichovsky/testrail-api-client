/**
 * Piped stdin through the real binary entrypoint (`src/cli.ts`).
 *
 * The in-process suites inject a fake `stdin.read`, so they cannot observe how
 * the entrypoint treats descriptor 0. Reading `process.stdin.isTTY` there made
 * Node switch the pipe to non-blocking mode; the synchronous reader then saw
 * `EAGAIN` whenever the producer was slower than the CLI and returned the bytes
 * read so far as if the pipe had closed. A late writer produced an empty body or
 * an empty API key, and a body larger than one pipe buffer was cut mid-string.
 *
 * Each case spawns the entrypoint and controls when the bytes arrive.
 */
import { describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import type { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { MAX_STDIN_BYTES } from '../src/constants.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));

/** Several times the entrypoint's start-up time, so its read is already waiting. */
const WRITER_DELAY_MS = 1000;
const CHILD_TIMEOUT_MS = 15_000;
const TEST_TIMEOUT_MS = 20_000;

interface CliResult {
    readonly status: number | null;
    readonly stdout: string;
    readonly stderr: string;
}

function runCliProcess(
    args: readonly string[],
    feed: (stdin: Writable) => void,
    env: Readonly<Record<string, string>> = { TESTRAIL_API_KEY: 'local-test-placeholder' },
): Promise<CliResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--import', 'tsx', cli, ...args], {
            cwd: root,
            env: {
                PATH: process.env['PATH'] ?? '',
                TESTRAIL_BASE_URL: 'https://offline.invalid',
                TESTRAIL_EMAIL: 'review@example.invalid',
                ...env,
            },
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: CHILD_TIMEOUT_MS,
            killSignal: 'SIGKILL',
        });
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
        child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
        // The over-limit case exits while the parent is still writing.
        child.stdin.on('error', () => undefined);
        child.on('error', reject);
        child.on('close', (status) => resolve({ status, stdout, stderr }));
        feed(child.stdin);
    });
}

describe.skipIf(process.platform === 'win32').concurrent('CLI piped stdin (real process)', () => {
    it(
        'waits for a JSON body that arrives after the CLI has started reading',
        async () => {
            const result = await runCliProcess(['case', 'add', '1', '--dry-run'], (stdin) => {
                setTimeout(() => stdin.end('{"title":"late"}\n'), WRITER_DELAY_MS);
            });

            expect(result.stderr).toBe('');
            expect(result.status).toBe(0);
            expect(JSON.parse(result.stdout)).toMatchObject({ payload: { title: 'late' }, source: 'stdin' });
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'waits for an API key that arrives late on --api-key-stdin',
        async () => {
            const result = await runCliProcess(
                ['run', 'delete', '5', '--dry-run', '--api-key-stdin'],
                (stdin) => {
                    setTimeout(() => stdin.end('piped-placeholder-key\n'), WRITER_DELAY_MS);
                },
                {},
            );

            expect(result.stderr).toBe('');
            expect(result.status).toBe(0);
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'reads a body larger than one pipe buffer whose tail arrives late',
        async () => {
            const cases = Array.from({ length: 3000 }, (_, index) => ({ title: `case ${index} ${'x'.repeat(80)}` }));
            const body = JSON.stringify(cases);
            const split = Math.floor(body.length / 2);
            expect(Buffer.byteLength(body)).toBeGreaterThan(4 * 64 * 1024);

            const result = await runCliProcess(['case', 'add-bulk', '1', '--dry-run'], (stdin) => {
                stdin.write(body.slice(0, split));
                setTimeout(() => stdin.end(body.slice(split)), WRITER_DELAY_MS);
            });

            expect(result.stderr).toBe('');
            expect(result.status).toBe(0);
            expect(JSON.parse(result.stdout)).toMatchObject({ count: cases.length, source: 'stdin' });
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'reports the size cap, not a JSON parse error, for an over-limit body',
        async () => {
            const result = await runCliProcess(['case', 'add', '1', '--dry-run'], (stdin) => {
                stdin.end(' '.repeat(MAX_STDIN_BYTES + 64 * 1024));
            });

            expect(result.status).toBe(1);
            expect(result.stderr).toContain(`Input exceeds maximum ${MAX_STDIN_BYTES} bytes`);
            expect(result.stderr).not.toContain('Invalid JSON');
        },
        TEST_TIMEOUT_MS,
    );
});
