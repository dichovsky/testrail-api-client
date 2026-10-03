import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));

describe.skipIf(process.platform === 'win32')('CLI non-regular input rejection', () => {
    let directory: string;
    let fifo: string;

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'testrail-fifo-'));
        fifo = join(directory, 'input');
        execFileSync('mkfifo', [fifo]);
    });
    afterEach(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    it.each([
        ['attachment', 'add-to-case', '1', '--file'],
        ['case', 'add', '1', '--data-file'],
    ])('rejects %s %s input without waiting for a FIFO writer', (...args) => {
        // Keep a regression from blocking Vitest itself: a synchronous FIFO
        // open cannot be interrupted by JavaScript timers or signal handlers.
        const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...args, fifo, '--dry-run'], {
            cwd: root,
            env: {
                ...process.env,
                TESTRAIL_BASE_URL: 'https://offline.invalid',
                TESTRAIL_EMAIL: 'review@example.invalid',
                TESTRAIL_API_KEY: 'local-test-placeholder',
            },
            encoding: 'utf8',
            timeout: 3000,
            killSignal: 'SIGKILL',
        });
        expect(result.error).toBeUndefined();
        expect(result.signal).toBeNull();
        expect(result.status).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('not a regular file');
    });
});
