/**
 * Unit tests for the binary-file input resolver (src/cli/file-input.ts).
 *
 * resolveFile mirrors resolveBody's resolution-tuple shape; tests assert the
 * shape contract end-to-end (missing flag → typed error, missing file → typed
 * error, stat-only mode skips contents, read mode populates Uint8Array,
 * --filename override wins over basename).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveFile } from '../src/cli/file-input.js';

describe('resolveFile', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-file-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('rejects missing --file flag', () => {
        const r = resolveFile({}, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('--file <path> required');
    });

    it('rejects empty --file flag', () => {
        const r = resolveFile({ fileFlag: '' }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('--file <path> required');
    });

    it('rejects nonexistent path', () => {
        const r = resolveFile({ fileFlag: join(tmp, 'missing.bin') }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('Cannot stat --file');
    });

    it('rejects a directory', () => {
        const sub = join(tmp, 'sub');
        mkdirSync(sub);
        const r = resolveFile({ fileFlag: sub }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('not a regular file');
    });

    it('stat-only mode returns path/filename/size without contents', () => {
        const p = join(tmp, 'foo.png');
        writeFileSync(p, Buffer.from([1, 2, 3, 4, 5]));
        const r = resolveFile({ fileFlag: p }, { read: false });
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.path).toBe(p);
            expect(r.filename).toBe('foo.png');
            expect(r.size).toBe(5);
            expect(r.contents).toBeUndefined();
        }
    });

    it('read mode populates Uint8Array contents matching disk', () => {
        const p = join(tmp, 'bar.bin');
        const bytes = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
        writeFileSync(p, bytes);
        const r = resolveFile({ fileFlag: p }, { read: true });
        expect(r.ok).toBe(true);
        if (r.ok && r.contents !== undefined) {
            expect(r.contents).toBeInstanceOf(Uint8Array);
            expect(Array.from(r.contents)).toEqual([0xde, 0xad, 0xbe, 0xef]);
            expect(r.size).toBe(4);
        } else {
            expect.fail('expected ok=true with contents populated');
        }
    });

    it('--filename overrides basename', () => {
        const p = join(tmp, 'out.bin');
        writeFileSync(p, Buffer.from('x'));
        const r = resolveFile({ fileFlag: p, filenameFlag: 'crash-report.bin' }, { read: false });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.filename).toBe('crash-report.bin');
    });

    it('empty --filename falls back to basename', () => {
        const p = join(tmp, 'kept.png');
        writeFileSync(p, Buffer.from('x'));
        const r = resolveFile({ fileFlag: p, filenameFlag: '' }, { read: false });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.filename).toBe('kept.png');
    });
});
