import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createDiagnosticRecord, prepareDiagnosticDestination } from '../src/cli/diagnostics.js';
import { safeWriteText } from '../src/cli/safe-write.js';

describe.skipIf(process.platform === 'win32')('diagnostic paths with symlink traversal', () => {
    let directory: string;

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-paths-'));
        mkdirSync(join(directory, 'real', 'nested'), { recursive: true });
        symlinkSync(join(directory, 'real', 'nested'), join(directory, 'link'));
    });

    afterEach(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    function alias(relativePath: boolean): string {
        const parent = relativePath ? relative(process.cwd(), directory) : directory;
        // Keep `..` intact: joining the complete path would remove the exact
        // symlink traversal the filesystem must perform before reaching it.
        return `${parent}/link/../error.json`;
    }

    it.each([false, true])('rejects an output alias before reservation (relative: %s)', (relativePath) => {
        const destination = join(directory, 'real', 'error.json');
        expect(() => prepareDiagnosticDestination(destination, alias(relativePath))).toThrow(/distinct from --out/);
        expect(existsSync(destination)).toBe(false);
        expect(existsSync(join(directory, 'error.json'))).toBe(false);
    });

    it.each([false, true])('publishes at the requested filesystem location (relative: %s)', (relativePath) => {
        const destination = prepareDiagnosticDestination(alias(relativePath));
        const record = createDiagnosticRecord(new Error('local failure'), {
            email: 'offline@example.invalid',
            apiKey: 'offline-placeholder',
            baseUrl: 'https://example.testrail.io',
        });
        try {
            expect(destination.write(record)).toBe(true);
        } finally {
            expect(destination.finish()).toBe(true);
        }
        expect(JSON.parse(readFileSync(alias(relativePath), 'utf8'))).toEqual(record);
        expect(existsSync(join(directory, 'error.json'))).toBe(false);
    });

    it('preserves an unrelated download that only looks identical after lexical normalization', () => {
        const diagnosticPath = join(directory, 'error.json');
        const outputPath = alias(false);
        const destination = prepareDiagnosticDestination(diagnosticPath, outputPath);
        try {
            safeWriteText(outputPath, 'Feature: downloaded content', true);
        } finally {
            expect(destination.finish()).toBe(true);
        }
        expect(readFileSync(outputPath, 'utf8')).toBe('Feature: downloaded content');
        expect(existsSync(diagnosticPath)).toBe(false);
    });
});
