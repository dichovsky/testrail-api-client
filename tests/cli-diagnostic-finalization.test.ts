import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    chmodSync,
    closeSync,
    existsSync,
    fstatSync,
    linkSync,
    lstatSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    renameSync,
    rmSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDiagnosticRecord, prepareDiagnosticDestination } from '../src/cli/diagnostics.js';
import { TestRailApiError } from '../src/errors.js';

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        closeSync: vi.fn(actual.closeSync),
        fstatSync: vi.fn(actual.fstatSync),
        lstatSync: vi.fn(actual.lstatSync),
        realpathSync: Object.assign(vi.fn(actual.realpathSync), { native: vi.fn(actual.realpathSync.native) }),
        writeFileSync: vi.fn(actual.writeFileSync),
    };
});

describe.skipIf(process.platform === 'win32')('diagnostic publication finalization', () => {
    let directory: string;
    let path: string;
    const record = createDiagnosticRecord(new TestRailApiError(400, 'Error', '{"error":"Missing option"}'), {
        email: 'private@example.invalid',
        apiKey: 'private-placeholder',
        baseUrl: 'https://offline.invalid',
    });
    beforeEach(() => {
        vi.stubGlobal('process', { ...process, platform: 'linux' });
        directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-finish-'));
        path = join(directory, 'error.json');
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetAllMocks();
        rmSync(directory, { recursive: true, force: true });
    });

    it('validates a complete written record before closing its descriptor', () => {
        const destination = prepareDiagnosticDestination(path);
        expect(destination.write(record)).toBe(true);
        vi.mocked(fstatSync).mockClear();
        vi.mocked(lstatSync).mockClear();
        expect(destination.finish()).toBe(true);
        expect(fstatSync).toHaveBeenCalledTimes(1);
        expect(lstatSync).toHaveBeenCalledWith(join(realpathSync(directory), 'error.json'));
        expect(vi.mocked(fstatSync).mock.invocationCallOrder[0]).toBeLessThan(
            vi.mocked(closeSync).mock.invocationCallOrder[0] ?? Infinity,
        );
        expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(record);
    });

    it('reports loss of publication when the path changes between the final write check and descriptor write', () => {
        const destination = prepareDiagnosticDestination(path);
        const actualWrite = vi.mocked(writeFileSync).getMockImplementation();
        if (actualWrite === undefined) throw new Error('Missing write implementation');
        vi.mocked(writeFileSync).mockImplementationOnce((file, data, options) => {
            renameSync(path, join(directory, 'moved'));
            actualWrite(path, 'foreign replacement');
            actualWrite(file, data, options);
        });
        expect(destination.write(record)).toBe(true);
        expect(destination.finish()).toBe(false);
        expect(readFileSync(path, 'utf8')).toBe('foreign replacement');
        expect(JSON.parse(readFileSync(join(directory, 'moved'), 'utf8'))).toEqual(record);
    });

    it.each(['missing', 'linked', 'permissions'])(
        'reports a written reservation that becomes %s before finalization',
        (change) => {
            const destination = prepareDiagnosticDestination(path);
            expect(destination.write(record)).toBe(true);
            if (change === 'missing') unlinkSync(path);
            else if (change === 'linked') linkSync(path, join(directory, 'linked'));
            else chmodSync(path, 0o644);
            expect(destination.finish()).toBe(false);
            expect(closeSync).toHaveBeenCalledTimes(1);
            if (change !== 'missing') expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(record);
        },
    );

    it('still closes the held descriptor if written-file validation fails', () => {
        const destination = prepareDiagnosticDestination(path);
        expect(destination.write(record)).toBe(true);
        vi.mocked(fstatSync).mockImplementationOnce(() => {
            throw new Error('private stat failure');
        });
        expect(destination.finish()).toBe(false);
        expect(closeSync).toHaveBeenCalledTimes(1);
        expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(record);
    });

    it('permits an unrelated download whose parent directory does not exist yet', () => {
        const otherOutput = join(directory, 'future', 'download.bin');
        const destination = prepareDiagnosticDestination(path, otherOutput);
        expect(existsSync(path)).toBe(true);
        expect(existsSync(join(directory, 'future'))).toBe(false);
        expect(destination.finish()).toBe(true);
        expect(existsSync(path)).toBe(false);
    });

    it('keeps an existing unrelated download separate from diagnostic writes and cleanup', () => {
        const otherOutput = join(directory, 'download.bin');
        writeFileSync(otherOutput, 'existing download');
        const destination = prepareDiagnosticDestination(path, otherOutput);
        expect(destination.write(record)).toBe(true);
        expect(destination.finish()).toBe(true);
        expect(readFileSync(otherOutput, 'utf8')).toBe('existing download');
        expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(record);
    });

    it('propagates optional-output lookup failures other than missing paths before reserving a diagnostic', () => {
        const realRealpath = vi.mocked(realpathSync.native).getMockImplementation();
        if (realRealpath === undefined) throw new Error('Missing realpath implementation');
        vi.mocked(realpathSync.native)
            .mockImplementationOnce(realRealpath)
            .mockImplementationOnce(() => {
                throw Object.assign(new Error('private lookup failure'), { code: 'EACCES' });
            });
        expect(() => prepareDiagnosticDestination(path, join(directory, 'restricted', 'download.bin'))).toThrow(
            /no API request was sent/,
        );
        expect(existsSync(path)).toBe(false);
    });

    it('still refuses direct and filesystem-inode output aliases', () => {
        expect(() => prepareDiagnosticDestination(path, path)).toThrow(/distinct from --out/);
        const realStat = vi.mocked(lstatSync).getMockImplementation();
        if (realStat === undefined) throw new Error('Missing lstat implementation');
        vi.mocked(lstatSync).mockImplementationOnce(() => realStat(path));
        expect(() => prepareDiagnosticDestination(path, join(directory, 'alias.json'))).toThrow(/distinct from --out/);
        expect(existsSync(path)).toBe(false);
    });
});
