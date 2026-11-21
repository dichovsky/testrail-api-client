/**
 * A stdout reader that closes early, through the real binary entrypoint
 * (`src/cli.ts`).
 *
 * `testrail case list --all | head` closes the pipe while the CLI still has
 * output to write. Node reports that as an `EPIPE` 'error' event on
 * `process.stdout`; with no listener the process died with an
 * "Unhandled 'error' event" stack trace and exit code 1.
 *
 * Only a real pipe produces `EPIPE`, so each case spawns the entrypoint and
 * closes the read end after the first chunk.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_DATA_FILE_BYTES } from '../src/constants.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));

const CHILD_TIMEOUT_MS = 15_000;
const TEST_TIMEOUT_MS = 20_000;
/**
 * Close to the `--data-file` cap, so most of the preview is still unwritten when
 * the reader leaves even where the kernel buffers a few hundred KiB per pipe.
 */
const CASE_COUNT = 9000;
const MIN_BODY_BYTES = 12 * 64 * 1024;

interface CliResult {
    readonly status: number | null;
    readonly signal: NodeJS.Signals | null;
    readonly stdoutBytes: number;
    readonly stderr: string;
}

/** Run the entrypoint and stop reading its stdout after the first chunk when `closeEarly` is set. */
function runCliProcess(args: readonly string[], closeEarly: boolean): Promise<CliResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--import', 'tsx', cli, ...args], {
            cwd: root,
            env: {
                PATH: process.env['PATH'] ?? '',
                TESTRAIL_BASE_URL: 'https://offline.invalid',
                TESTRAIL_EMAIL: 'review@example.invalid',
                TESTRAIL_API_KEY: 'local-test-placeholder',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: CHILD_TIMEOUT_MS,
            killSignal: 'SIGKILL',
        });
        let stdoutBytes = 0;
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
            stdoutBytes += chunk.length;
            if (closeEarly) child.stdout.destroy();
        });
        child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
        child.on('error', reject);
        child.on('exit', (status, signal) => resolve({ status, signal, stdoutBytes, stderr }));
    });
}

describe.skipIf(process.platform === 'win32')('CLI stdout reader that closes early (real process)', () => {
    let directory: string;
    let bodyFile: string;
    let bodyBytes: number;

    beforeAll(() => {
        directory = mkdtempSync(join(tmpdir(), 'testrail-cli-epipe-'));
        bodyFile = join(directory, 'cases.json');
        const body = JSON.stringify(
            Array.from({ length: CASE_COUNT }, (_, index) => ({ title: `case ${index} ${'x'.repeat(80)}` })),
        );
        bodyBytes = Buffer.byteLength(body);
        writeFileSync(bodyFile, body);
    });

    afterAll(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    it(
        'exits 0 without a stack trace when the reader leaves mid-output',
        async () => {
            expect(bodyBytes).toBeGreaterThan(MIN_BODY_BYTES);
            expect(bodyBytes).toBeLessThan(MAX_DATA_FILE_BYTES);

            const result = await runCliProcess(['case', 'add-bulk', '1', '--dry-run', '--data-file', bodyFile], true);

            expect(result.stderr).toBe('');
            expect(result.signal).toBeNull();
            expect(result.status).toBe(0);
            // The reader really did leave early: the preview echoes the whole body.
            expect(result.stdoutBytes).toBeLessThan(bodyBytes);
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'still delivers the whole output to a reader that stays',
        async () => {
            const result = await runCliProcess(['case', 'add-bulk', '1', '--dry-run', '--data-file', bodyFile], false);

            expect(result.stderr).toBe('');
            expect(result.status).toBe(0);
            expect(result.stdoutBytes).toBeGreaterThan(bodyBytes);
        },
        TEST_TIMEOUT_MS,
    );
});
