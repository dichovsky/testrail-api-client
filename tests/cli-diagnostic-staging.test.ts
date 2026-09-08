import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
    closeSync,
    existsSync,
    fchmodSync,
    fstatSync,
    linkSync,
    mkdirSync,
    mkdtempSync,
    openSync,
    readdirSync,
    readFileSync,
    renameSync,
    rmSync,
    rmdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDiagnosticRecord, prepareDiagnosticDestination } from '../src/cli/diagnostics.js';
import { TestRailApiError } from '../src/errors.js';

const nativePlatform = process.platform;
const auth = { email: 'private@example.invalid', apiKey: 'private-placeholder', baseUrl: 'https://offline.invalid' };

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        closeSync: vi.fn(actual.closeSync),
        fchmodSync: vi.fn(actual.fchmodSync),
        fstatSync: vi.fn(actual.fstatSync),
        linkSync: vi.fn(actual.linkSync),
        lstatSync: vi.fn(actual.lstatSync),
        mkdtempSync: vi.fn(actual.mkdtempSync),
        openSync: vi.fn(actual.openSync),
        rmdirSync: vi.fn(actual.rmdirSync),
        statSync: vi.fn(actual.statSync),
        unlinkSync: vi.fn(actual.unlinkSync),
    };
});
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    return { ...actual, execFileSync: vi.fn(actual.execFileSync) };
});

describe.skipIf(nativePlatform === 'win32')('Darwin initially private diagnostic inode', () => {
    let directory: string;
    let destination: string;
    let originalCwd: string;
    const nativeChdir = process.chdir.bind(process);

    beforeEach(() => {
        originalCwd = process.cwd();
        directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-staging-'));
        destination = join(directory, 'error.json');
        vi.stubGlobal('process', { ...process, platform: 'darwin' });
        if (nativePlatform !== 'darwin') vi.mocked(execFileSync).mockReturnValue(Buffer.alloc(0));
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        nativeChdir(originalCwd);
        vi.resetAllMocks();
        rmSync(directory, { recursive: true, force: true });
    });

    function stagePath(): string {
        const name = readdirSync(directory).find((entry) => entry.startsWith('.testrail-diagnostic-'));
        if (name === undefined) throw new Error('Missing staging fixture');
        return join(directory, name);
    }

    it('creates under a secured kernel cwd and publishes the same private inode exclusively', () => {
        const realOpen = vi.mocked(openSync).getMockImplementation();
        if (realOpen === undefined) throw new Error('Missing open implementation');
        let privateInode: number | undefined;
        vi.mocked(openSync).mockImplementation((file, flags, mode) => {
            if (file === 'record') {
                expect(statSync('.').ino).toBe(statSync(stagePath()).ino);
                expect(statSync('.').mode & 0o777).toBe(0o700);
                expect(execFileSync).toHaveBeenCalledWith('/bin/chmod', ['-N', '/dev/fd/3'], expect.any(Object));
                expect(existsSync(destination)).toBe(false);
            }
            const fd = realOpen(file, flags, mode);
            if (file === 'record') {
                privateInode = fstatSync(fd).ino;
                expect(fstatSync(fd).mode & 0o777).toBe(0o600);
            }
            return fd;
        });
        const reservation = prepareDiagnosticDestination(destination);
        expect(process.cwd()).toBe(originalCwd);
        expect(statSync(destination).ino).toBe(privateInode);
        expect(statSync(destination).nlink).toBe(1);
        expect(readdirSync(directory)).toEqual(['error.json']);
        expect(reservation.finish()).toBe(true);
        expect(readdirSync(directory)).toEqual([]);
    });

    it.runIf(nativePlatform === 'darwin')(
        'has no inherited read ACL at the first file open or after publication',
        () => {
            execFileSync('/bin/chmod', [
                '+a',
                'everyone allow read,readattr,readextattr,readsecurity,file_inherit,directory_inherit',
                directory,
            ]);
            const realOpen = vi.mocked(openSync).getMockImplementation();
            if (realOpen === undefined) throw new Error('Missing open implementation');
            let created = false;
            vi.mocked(openSync).mockImplementation((file, flags, mode) => {
                if (file === 'record') {
                    expect(execFileSync('/bin/ls', ['-lde', '.'], { encoding: 'utf8' })).not.toMatch(/^\s*\d+:/mu);
                }
                const fd = realOpen(file, flags, mode);
                if (file === 'record') {
                    created = true;
                    // Observe immediately after O_EXCL creation, before any ACL
                    // command can operate on this file or it becomes public.
                    expect(execFileSync('/bin/ls', ['-lde', 'record'], { encoding: 'utf8' })).not.toMatch(/^\s*\d+:/mu);
                    expect(existsSync(destination)).toBe(false);
                }
                return fd;
            });
            const reservation = prepareDiagnosticDestination(destination);
            expect(created).toBe(true);
            expect(execFileSync('/bin/ls', ['-lde', destination], { encoding: 'utf8' })).not.toMatch(/^\s*\d+:/mu);
            const record = createDiagnosticRecord(
                new TestRailApiError(400, 'Error', '{"error":"Missing option"}'),
                auth,
            );
            expect(reservation.write(record)).toBe(true);
            expect(reservation.finish()).toBe(true);
            expect(JSON.parse(readFileSync(destination, 'utf8'))).toEqual(record);
            expect(execFileSync('/bin/ls', ['-lde', directory], { encoding: 'utf8' })).toContain(
                'group:everyone allow list',
            );
        },
    );

    it('restores cwd and preserves existing destination contents when exclusive publication fails', () => {
        writeFileSync(destination, 'existing private file');
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(readFileSync(destination, 'utf8')).toBe('existing private file');
        expect(readdirSync(directory)).toEqual(['error.json']);
    });

    it('detects staging-directory replacement before relative creation', () => {
        vi.mocked(execFileSync).mockImplementationOnce(() => {
            const stage = stagePath();
            renameSync(stage, join(directory, 'original-stage'));
            mkdirSync(stage, 0o700);
            writeFileSync(join(stage, 'marker'), 'foreign replacement');
            return Buffer.alloc(0);
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(existsSync(destination)).toBe(false);
        expect(readFileSync(join(stagePath(), 'marker'), 'utf8')).toBe('foreign replacement');
        expect(readdirSync(join(directory, 'original-stage'))).toEqual([]);
    });

    it('refuses unexpected staging contents without deleting them', () => {
        vi.mocked(execFileSync).mockImplementationOnce(() => {
            writeFileSync(join(stagePath(), 'marker'), 'unexpected private content');
            return Buffer.alloc(0);
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(existsSync(destination)).toBe(false);
        expect(readFileSync(join(stagePath(), 'marker'), 'utf8')).toBe('unexpected private content');
    });

    it('refuses a staging directory whose owner or permissions cannot be verified', () => {
        vi.mocked(fstatSync).mockImplementationOnce(() => ({
            ...statSync(stagePath()),
            isDirectory: () => true,
            uid: -1,
        }));
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(execFileSync).not.toHaveBeenCalled();
        expect(process.cwd()).toBe(originalCwd);
        expect(existsSync(destination)).toBe(false);
        vi.mocked(execFileSync).mockImplementationOnce(() => {
            writeFileSync(join(stagePath(), 'marker'), 'stop');
            return Buffer.alloc(0);
        });
        // A separate permission failure occurs before the ACL subprocess.
        const realChmod = vi.mocked(fchmodSync).getMockImplementation();
        if (realChmod === undefined) throw new Error('Missing chmod implementation');
        vi.mocked(fchmodSync).mockImplementationOnce((fd) => realChmod(fd, 0o755));
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
    });

    it('rejects an unexpectedly accessible staged inode before publication', () => {
        const realOpen = vi.mocked(openSync).getMockImplementation();
        if (realOpen === undefined) throw new Error('Missing open implementation');
        vi.mocked(openSync).mockImplementation((file, flags, mode) => {
            const fd = realOpen(file, flags, mode);
            if (file === 'record') fchmodSync(fd, 0o644);
            return fd;
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(linkSync).not.toHaveBeenCalled();
        expect(process.cwd()).toBe(originalCwd);
        expect(readdirSync(directory)).toEqual([]);
    });

    it('does not overwrite a foreign replacement introduced immediately after publication', () => {
        const realLink = vi.mocked(linkSync).getMockImplementation();
        if (realLink === undefined) throw new Error('Missing link implementation');
        vi.mocked(linkSync).mockImplementationOnce((source, target) => {
            realLink(source, target);
            renameSync(destination, join(directory, 'original'));
            writeFileSync(destination, 'replacement');
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(readFileSync(destination, 'utf8')).toBe('replacement');
        expect(readFileSync(join(directory, 'original'), 'utf8')).toBe('');
    });

    it('fails closed when staging cleanup fails after publication', () => {
        vi.mocked(rmdirSync).mockImplementationOnce(() => {
            throw new Error('private directory cleanup failure');
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(existsSync(destination)).toBe(false);
        expect(readdirSync(stagePath())).toEqual([]);
    });

    it('restores cwd even when relative cleanup fails after a publication error', () => {
        vi.mocked(linkSync).mockImplementationOnce(() => {
            throw new Error('private publication failure');
        });
        vi.mocked(unlinkSync).mockImplementationOnce(() => {
            throw new Error('private relative cleanup failure');
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(existsSync(destination)).toBe(false);
        expect(readFileSync(join(stagePath(), 'record'), 'utf8')).toBe('');
    });

    it('keeps preflight failed when descriptor cleanup also fails', () => {
        const realClose = vi.mocked(closeSync).getMockImplementation();
        if (realClose === undefined) throw new Error('Missing close implementation');
        vi.mocked(closeSync).mockImplementation((fd) => {
            realClose(fd);
            throw new Error('private close failure');
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(readdirSync(directory)).toEqual([]);
    });

    it('removes the reserved inode and fails preflight when restoring cwd cannot be verified', () => {
        const realStat = vi.mocked(statSync).getMockImplementation();
        if (realStat === undefined) throw new Error('Missing stat implementation');
        const replacement = statSync(directory);
        let cwdReads = 0;
        vi.mocked(statSync).mockImplementation((file, options) => {
            const stat = realStat(file, options);
            if (file === '.') cwdReads += 1;
            return file === '.' && cwdReads === 3 ? { ...replacement, ino: -1 } : stat;
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(readdirSync(directory)).toEqual([]);
    });

    it('preserves cwd and creates no public inode when staging-directory allocation fails', () => {
        vi.mocked(mkdtempSync).mockImplementationOnce(() => {
            throw new Error('private staging directory allocation failure');
        });
        expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        expect(process.cwd()).toBe(originalCwd);
        expect(openSync).not.toHaveBeenCalled();
        expect(execFileSync).not.toHaveBeenCalled();
        expect(readdirSync(directory)).toEqual([]);
    });

    it('fails preflight and removes the public reservation when restoring cwd throws', () => {
        vi.spyOn(process, 'chdir').mockImplementation((target) => {
            if (target === originalCwd) throw new Error('private original directory unavailable');
            nativeChdir(target);
        });
        try {
            expect(() => prepareDiagnosticDestination(destination)).toThrow(/no API request was sent/);
        } finally {
            // A real CLI exits after this failure. Restore the test worker's
            // cwd explicitly so this adversarial case cannot affect other tests.
            nativeChdir(originalCwd);
        }
        expect(process.cwd()).toBe(originalCwd);
        expect(existsSync(destination)).toBe(false);
        expect(readdirSync(directory)).toEqual([]);
    });
});
