import { closeSync, fstatSync, mkdtempSync, openSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createUploadSource } from '../src/upload-source.js';

/**
 * Descriptors opened by a test, paired with the inode they were opened on.
 *
 * The inode is the point. A passing test releases its own fd, so the sweep
 * below always probes an already-closed number — and the worker may have reused
 * that number for something else by then. Closing on "is it readable?" would be
 * closing a descriptor we do not own, which is precisely the hazard
 * `releaseDescriptor` is written to avoid.
 */
const openDescriptors: { fd: number; ino: number }[] = [];

function scratchFile(contents: string): { path: string; fd: number } {
    const path = join(mkdtempSync(join(tmpdir(), 'upload-source-')), 'evidence.txt');
    writeFileSync(path, contents);
    const fd = openSync(path, 'r');
    openDescriptors.push({ fd, ino: fstatSync(fd).ino });
    return { path, fd };
}

/** True when `fd` is still the descriptor this suite opened, not a reused number. */
function stillOurs(fd: number, ino: number): boolean {
    try {
        return fstatSync(fd).ino === ino;
    } catch {
        return false;
    }
}

/**
 * Replace what `path` names with a *new inode*, the way a symlink/rename swap
 * does. Writing in place would truncate the very inode the descriptor holds,
 * which is a different (and much louder) failure than the TOCTOU race.
 */
function swapPathContents(path: string, contents: string): void {
    const replacement = `${path}.attacker`;
    writeFileSync(replacement, contents);
    renameSync(replacement, path);
}

/** True while the descriptor is still open; the one observable we have for release. */
function isOpen(fd: number): boolean {
    try {
        readFileSync(fd, { encoding: 'utf8' });
        return true;
    } catch {
        return false;
    }
}

afterEach(() => {
    while (openDescriptors.length > 0) {
        const entry = openDescriptors.pop();
        if (entry !== undefined && stillOurs(entry.fd, entry.ino)) closeSync(entry.fd);
    }
});

describe('createUploadSource', () => {
    it('streams a descriptor-bearing upload through the descriptor, not the path', async () => {
        const { path, fd } = scratchFile('ORIGINAL');
        const built = await createUploadSource({ path, fd }, 'evidence.txt').build();

        // Swapping the path after the descriptor was opened must not change what
        // the upload reads — that is the whole point of carrying an fd.
        swapPathContents(path, 'SWAPPED-BY-ATTACKER');
        const blob = built.body.get('attachment');
        expect(blob).toBeInstanceOf(globalThis.Blob);
        expect(await (blob as globalThis.Blob).text()).toBe('ORIGINAL');

        built.cleanup();
    });

    // The regression this module exists to make unspellable. Before the descriptor
    // lifetime moved here, a second build silently fell back to `file.path`: the
    // first cleanup had closed the fd and cleared the latch, so the rebuilt body
    // read whatever now lived at that path. Demonstrated against the old builder
    // with a swap between the two builds — build #1 read ORIGINAL, build #2 read
    // the attacker's content. Nothing calls build twice today (a multipart body
    // never retries), so this pins the constraint rather than a live bug.
    it('refuses a second build instead of silently losing the descriptor', async () => {
        const { path, fd } = scratchFile('ORIGINAL');
        const source = createUploadSource({ path, fd }, 'evidence.txt');

        const first = await source.build();
        first.cleanup();
        swapPathContents(path, 'SWAPPED-BY-ATTACKER');

        await expect(source.build()).rejects.toThrow(/already consumed/);
    });

    it('releases the descriptor on cleanup, and tolerates a second cleanup', async () => {
        const { path, fd } = scratchFile('payload');
        const built = await createUploadSource({ path, fd }, 'evidence.txt').build();

        expect(isOpen(fd)).toBe(true);
        built.cleanup();
        expect(isOpen(fd)).toBe(false);

        // Double release must not close a descriptor number the process may have
        // since reused for something else.
        expect(() => {
            built.cleanup();
        }).not.toThrow();
    });

    it('propagates a build failure rather than returning a half-built body', async () => {
        // A path with no descriptor is the easy failure: `openAsBlob` hits
        // ENOENT. With a live descriptor the open goes through `/dev/fd/<N>`,
        // which resolves — even for a directory fd, where the failure is
        // deferred to read time — so ordinary path-resolution failure does not
        // reach the catch on POSIX. Resource exhaustion (EMFILE/ENFILE) and a
        // missing `/proc` on Linux still do, which is exactly why the catch
        // releases the descriptor rather than assuming it cannot run there.
        const source = createUploadSource({ path: join(tmpdir(), 'upload-source-missing', 'nope.txt') }, 'x.txt');

        await expect(source.build()).rejects.toThrow();
        // Failing counts as consuming the source: the descriptor (if any) was
        // released in the catch, so a retry would silently degrade.
        await expect(source.build()).rejects.toThrow(/already consumed/);
    });

    it.each([
        { label: 'a Blob', file: new globalThis.Blob(['in-memory']) },
        { label: 'a Uint8Array', file: new Uint8Array([105, 110, 45, 109, 101, 109]) },
    ])('carries $label input through without a descriptor', async ({ file }) => {
        const built = await createUploadSource(file, 'evidence.txt').build();
        const blob = built.body.get('attachment');

        expect(blob).toBeInstanceOf(globalThis.Blob);
        expect((await (blob as globalThis.Blob).text()).length).toBeGreaterThan(0);
        expect(() => {
            built.cleanup();
        }).not.toThrow();
    });

    // A source is created when the request spec is built, but only releases
    // from inside `build()`. The pipeline can fail before it ever builds — a
    // destroyed client, a rejected host, a spent budget — so the shape exposes
    // `release()` for exactly that. Without it a long-lived consumer uploading
    // against a flaky host accumulated one descriptor per failure until EMFILE.
    it('releases a source that is never built', () => {
        const { path, fd } = scratchFile('payload');
        const source = createUploadSource({ path, fd }, 'evidence.txt');

        expect(isOpen(fd)).toBe(true);
        source.release();
        expect(isOpen(fd)).toBe(false);

        // Idempotent, so the pipeline calling it after a successful build that
        // already cleaned up is harmless.
        expect(() => {
            source.release();
        }).not.toThrow();
    });

    it('appends under the field name the stream wrapper looks for', async () => {
        // The builder and the wrapper used to agree on this by both importing a
        // shared constant across two files; they now live in one module. If they
        // ever diverge the wrapper silently no-ops and nothing else notices.
        const built = await createUploadSource(new globalThis.Blob(['x']), 'evidence.txt').build();
        expect([...built.body.keys()]).toEqual(['attachment']);
        built.cleanup();
    });
});
