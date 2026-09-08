import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    chmodSync,
    closeSync,
    existsSync,
    fchmodSync,
    fstatSync,
    linkSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    renameSync,
    rmSync,
    statSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';
import { join } from 'node:path';
import { createDiagnosticRecord, prepareDiagnosticDestination } from '../src/cli/diagnostics.js';
import { TestRailApiError } from '../src/errors.js';
import {
    MAX_CLI_DIAGNOSTIC_CREDENTIAL_CHARS,
    MAX_CLI_DIAGNOSTIC_DECODE_PASSES,
    MAX_CLI_DIAGNOSTIC_INPUT_BYTES,
    MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS,
    MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES,
} from '../src/constants.js';

const auth = { email: 'private+user@example.invalid', apiKey: 'key+/= "private"', baseUrl: 'https://offline.invalid' };

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        closeSync: vi.fn(actual.closeSync),
        fchmodSync: vi.fn(actual.fchmodSync),
        fstatSync: vi.fn(actual.fstatSync),
        lstatSync: vi.fn(actual.lstatSync),
        unlinkSync: vi.fn(actual.unlinkSync),
        writeFileSync: vi.fn(actual.writeFileSync),
    };
});

function record(body: unknown) {
    return createDiagnosticRecord(new TestRailApiError(400, 'Bad Request', JSON.stringify(body)), auth);
}

describe('bounded CLI error diagnostics', () => {
    it('redacts credentials decoded exactly at the supported nesting bound', () => {
        const encoded = Array.from({ length: MAX_CLI_DIAGNOSTIC_DECODE_PASSES }).reduce<string>(
            (value) => encodeURIComponent(value),
            auth.apiKey,
        );
        const diagnostic = record({ error: encoded });
        expect(diagnostic.server.messages).toEqual(['[REDACTED]']);
        expect(JSON.stringify(diagnostic)).not.toContain(auth.apiKey);
    });

    it('extracts TestRail validation explanations without error messages or raw metadata', () => {
        expect(record({ error: 'Invalid or incomplete options. Please enter all required fields.' })).toEqual({
            version: 1,
            kind: 'api_error',
            status: 400,
            operationOutcome: 'failed_or_indeterminate',
            server: {
                state: 'available',
                messages: ['Invalid or incomplete options. Please enter all required fields.'],
                truncated: false,
            },
        });
    });

    it('redacts effective credentials and common encoded variants, including Basic auth', () => {
        const variants = [auth.apiKey, auth.email, auth.baseUrl, `${auth.email}:${auth.apiKey}`].flatMap((secret) => [
            secret,
            encodeURIComponent(secret),
            encodeURIComponent(secret).toLowerCase(),
            encodeURIComponent(encodeURIComponent(secret)),
            encodeURI(secret),
            encodeURIComponent(secret).replace(/%20/gu, '+'),
            Buffer.from(secret).toString('base64'),
            Buffer.from(secret).toString('base64url'),
        ]);
        const diagnostic = record({
            errors: variants,
            details: { message: `Basic ${Buffer.from(`${auth.email}:${auth.apiKey}`).toString('base64')}` },
        });
        const serialized = JSON.stringify(diagnostic);
        for (const secret of variants) expect(serialized).not.toContain(secret);
        expect(diagnostic.server.messages.every((message) => message.includes('[REDACTED]'))).toBe(true);
    });

    it('omits sensitive nested containers and never emits field names or unrelated response data', () => {
        const diagnostic = record({
            errors: {
                privateFieldName: {
                    message: 'Required option missing',
                    api_key: 'unknown-api-key',
                    request_body: { message: 'secret request' },
                    authorization: 'unknown-auth',
                    headers: 'unknown-headers',
                    stack: 'private stack',
                    password: 'unknown-password',
                },
            },
            payload: 'top-level body',
            other: 'ignored data',
        });
        expect(diagnostic.server.messages).toEqual(['Required option missing']);
        expect(JSON.stringify(diagnostic)).not.toMatch(
            /privateFieldName|unknown-|secret request|private stack|top-level|ignored/,
        );
    });

    it('redacts mixed-case nested URI encodings, JSON-escaped credentials, and quoted secret keys', () => {
        const nested = encodeURIComponent(encodeURIComponent(auth.apiKey).toLowerCase());
        const unicode = auth.apiKey.replace(
            /[+/= ]/gu,
            (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
        );
        const diagnostic = record({
            errors: [
                nested,
                unicode,
                '{"password":"other-json-secret","api_key":"other-json-key"}',
                'Error: failure\n    at /private/server.js:12:3',
                '&quot;password&quot;=&quot;other-html-secret&quot;',
                '%ff',
                encodeURIComponent(encodeURIComponent(encodeURIComponent(encodeURIComponent(auth.apiKey)))),
            ],
        });
        const serialized = JSON.stringify(diagnostic);
        expect(serialized).not.toMatch(/other-json-secret|other-json-key|private\/server|other-html-secret|key%|key\+/);
        expect(diagnostic.server.messages).toContain('[OMITTED]');
        expect(diagnostic.server.messages).toContain('[REDACTED]');
    });

    it('redacts auth/access-key fields, numeric entities and frame-only stack strings', () => {
        const htmlKey = Array.from(auth.apiKey)
            .map((char) => `&#${char.charCodeAt(0)};`)
            .join('');
        const hexKey = Array.from(auth.apiKey)
            .map((char) => `&#x${char.charCodeAt(0).toString(16)};`)
            .join('');
        const diagnostic = record({
            errors: {
                auth: 'unknown-auth',
                access_key: 'unknown-access',
                '%70assword': 'unknown-password',
                message: [
                    htmlKey,
                    hexKey,
                    'at /private/server.js:12:3',
                    'auth=unknown-inline-auth access_key="unknown-inline-access"',
                    '&#xFFFFFF;',
                ],
            },
        });
        expect(JSON.stringify(diagnostic)).not.toMatch(/unknown-|private\/server|key\+/);
        expect(diagnostic.server.messages).toContain('[REDACTED]');
        expect(diagnostic.server.messages).toContain('[OMITTED]');
    });

    it('omits complete sensitive-assignment messages with escaped quotes, whitespace, and embedded request bodies', () => {
        const diagnostic = record({
            errors: [
                JSON.stringify({ password: 'other"secret-tail' }),
                JSON.stringify(JSON.stringify({ password: 'other secret tail' })),
                'client_secret="other secret"; more private text',
                'request_body={"name":"private request title","values":["private request value"]}',
            ],
        });
        expect(diagnostic.server.messages).toEqual(['[REDACTED]', '[REDACTED]', '[REDACTED]', '[REDACTED]']);
        expect(record({ errors: { '%ff': 'untrusted key value' } }).server.messages).toEqual([]);
    });

    it('bounds processing time for a large adversarial hyphenated message without an assignment', () => {
        const started = performance.now();
        for (const message of ['a-'.repeat(30_000), 'prefix at no-frame '.repeat(3_000)]) {
            const diagnostic = record({ error: message });
            expect(diagnostic.server.state).toBe('available');
            expect(diagnostic.server.truncated).toBe(true);
            expect(diagnostic.server.messages[0]).toBe(message.slice(0, MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS));
        }
        const duration = performance.now() - started;
        // The old backtracking regex took seconds for this bounded input.
        // Allow ample CI headroom while keeping that regression observable.
        expect(duration).toBeLessThan(750);
    });

    it('redacts secret assignments, bearer credentials, URL userinfo, and stack-like messages', () => {
        const diagnostic = record({
            errors: [
                'password="other secret" token=other-token',
                'Bearer hidden-token',
                'https://private-user:private-pass@example.invalid',
                'Error\n at handler (/private/file.ts:12:3)',
            ],
        });
        expect(JSON.stringify(diagnostic)).not.toMatch(
            /other secret|other-token|hidden-token|private-user|private-pass|private\/file/,
        );
    });

    it.each(['<html>private proxy response</html>', '{"error":"private unfinished', 'private text'])(
        'omits non-JSON data (%s)',
        (body) => {
            const diagnostic = createDiagnosticRecord(new TestRailApiError(400, 'private status', body), auth);
            expect(diagnostic.server).toEqual({ state: 'non_json', messages: [], truncated: false });
            expect(JSON.stringify(diagnostic)).not.toContain('private');
        },
    );

    it('omits successful-response bodies, network details, non-string bodies, and CLI exception stacks', () => {
        for (const error of [
            new TestRailApiError(200, 'private', '{"error":"private entity"}'),
            new TestRailApiError(0, 'private', '{"error":"private network"}'),
            new TestRailApiError(400, 'private', { error: 'private object' }),
            new Error('private error'),
        ]) {
            expect(createDiagnosticRecord(error, auth).server.state).toBe('unavailable');
            expect(JSON.stringify(createDiagnosticRecord(error, auth))).not.toContain('private');
        }
    });

    it('omits oversized UTF-8 bodies and final records instead of slicing through secret values', () => {
        expect(record({ error: 'x'.repeat(MAX_CLI_DIAGNOSTIC_INPUT_BYTES) }).server.state).toBe('oversized');
        expect(record({ error: '🙂'.repeat(MAX_CLI_DIAGNOSTIC_INPUT_BYTES / 3) }).server.state).toBe('oversized');
        const large = record({
            errors: Array.from({ length: 16 }, () => 'x'.repeat(MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS)),
        });
        expect(large.server.state).toBe('oversized');
        expect(Buffer.byteLength(JSON.stringify(large))).toBeLessThanOrEqual(MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES);
    });

    it('bounds depth, node count and message length, redacting before truncation', () => {
        const nested = { errors: Array.from({ length: 256 }, () => ({ field: 'missing' })) };
        expect(record(nested).server.truncated).toBe(true);
        const deep = Array.from({ length: 10 }).reduce<unknown>((value) => ({ field: value }), 'private deep value');
        expect(record({ errors: deep }).server.truncated).toBe(true);
        expect(JSON.stringify(record({ errors: deep }))).not.toContain('private deep value');
        const longMessage = `${'x'.repeat(MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS - 3)}${auth.apiKey}tail`;
        const shortened = record({ error: longMessage });
        expect(shortened.server.messages[0]?.length).toBe(MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS);
        expect(shortened.server.truncated).toBe(true);
        expect(shortened.server.messages[0]).not.toContain('key');
    });

    it('omits details when credential redaction cannot remain bounded', () => {
        const diagnostic = createDiagnosticRecord(new TestRailApiError(400, 'Error', '{"error":"untrusted"}'), {
            ...auth,
            apiKey: 'x'.repeat(MAX_CLI_DIAGNOSTIC_CREDENTIAL_CHARS + 1),
        });
        expect(diagnostic.server.state).toBe('redaction_unavailable');
    });

    it('omits malformed-surrogate credentials and unusable JSON roots', () => {
        const diagnostic = createDiagnosticRecord(new TestRailApiError(400, 'Error', '{"error":"untrusted"}'), {
            ...auth,
            apiKey: '\ud800',
        });
        expect(diagnostic.server.state).toBe('redaction_unavailable');
        for (const body of [null, [], 4, 'text', { unrelated: 'private' }, { error: null }, { error: 5 }])
            expect(record(body).server.state).toBe('unavailable');
        expect(createDiagnosticRecord(new TestRailApiError(400, 'Error', ''), auth).server.state).toBe('unavailable');
        expect(createDiagnosticRecord(new TestRailApiError(NaN, 'Error'), auth).status).toBeNull();
    });
});

describe.skipIf(process.platform === 'win32')('private exclusive diagnostic destination', () => {
    let directory: string;
    let path: string;
    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'testrail-diagnostic-'));
        path = join(directory, 'error.json');
    });
    afterEach(() => {
        vi.clearAllMocks();
        rmSync(directory, { recursive: true, force: true });
    });

    it('reserves mode 0600 and retains only a complete record', () => {
        const destination = prepareDiagnosticDestination(path);
        if (process.platform !== 'win32') expect(statSync(path).mode & 0o777).toBe(0o600);
        const diagnostic = record({ error: 'Missing option' });
        expect(destination.write(diagnostic)).toBe(true);
        expect(destination.finish()).toBe(true);
        expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(diagnostic);
    });

    it('removes its empty reservation after success or a local validation failure', () => {
        const destination = prepareDiagnosticDestination(path);
        expect(existsSync(path)).toBe(true);
        expect(destination.finish()).toBe(true);
        expect(existsSync(path)).toBe(false);
    });

    it('rejects existing files, directories, dangling links, missing parents and stdio targets', () => {
        writeFileSync(path, 'existing');
        mkdirSync(join(directory, 'folder'));
        symlinkSync(join(directory, 'missing'), join(directory, 'link'));
        for (const target of [
            path,
            directory,
            join(directory, 'folder'),
            join(directory, 'link'),
            join(directory, 'missing', 'output'),
            '-',
            '',
        ]) {
            expect(() => prepareDiagnosticDestination(target)).toThrow(/no API request was sent/);
        }
        expect(readFileSync(path, 'utf8')).toBe('existing');
        expect(existsSync(join(directory, 'missing'))).toBe(false);
    });

    it('rejects sharing the requested download destination', () => {
        expect(() => prepareDiagnosticDestination(path, join(directory, '.', 'error.json'))).toThrow(
            /distinct from --out/,
        );
        expect(existsSync(path)).toBe(false);
    });

    it('rejects filesystem aliases of the download destination', ({ skip }) => {
        writeFileSync(join(directory, 'probe'), '');
        if (!existsSync(join(directory, 'PROBE'))) skip();
        expect(() => prepareDiagnosticDestination(path, join(directory, 'ERROR.JSON'))).toThrow(
            '--diagnostic-file requires',
        );
        expect(existsSync(path)).toBe(false);
    });

    it('permits distinct new or existing downloads and stdout output', () => {
        const other = join(directory, 'download');
        for (const target of [other, '-']) {
            const destination = prepareDiagnosticDestination(path, target);
            expect(destination.finish()).toBe(true);
        }
        writeFileSync(other, 'existing download');
        const destination = prepareDiagnosticDestination(path, other);
        expect(destination.finish()).toBe(true);
        expect(readFileSync(other, 'utf8')).toBe('existing download');
    });

    it('refuses a replaced destination and never clobbers or deletes its replacement', () => {
        const destination = prepareDiagnosticDestination(path);
        renameSync(path, join(directory, 'original'));
        writeFileSync(path, 'replacement');
        expect(destination.write(record({ error: 'missing' }))).toBe(false);
        expect(destination.finish()).toBe(false);
        expect(readFileSync(path, 'utf8')).toBe('replacement');
        expect(readFileSync(join(directory, 'original'), 'utf8')).toBe('');
    });

    it('refuses hard-linked reservations before writing private data', () => {
        const destination = prepareDiagnosticDestination(path);
        linkSync(path, join(directory, 'linked'));
        expect(destination.write(record({ error: 'private detail' }))).toBe(false);
        destination.finish();
        expect(readFileSync(join(directory, 'linked'), 'utf8')).toBe('');
    });

    it.skipIf(process.platform === 'win32')('refuses permissions widened during the request', () => {
        const destination = prepareDiagnosticDestination(path);
        chmodSync(path, 0o644);
        expect(destination.write(record({ error: 'private detail' }))).toBe(false);
        expect(destination.finish()).toBe(true);
        expect(existsSync(path)).toBe(false);
    });

    it('fails closed on Windows before touching disk', () => {
        vi.stubGlobal('process', { ...process, platform: 'win32' });
        try {
            expect(() => prepareDiagnosticDestination(path)).toThrow(/unavailable on Windows/);
        } finally {
            vi.unstubAllGlobals();
        }
        expect(existsSync(path)).toBe(false);
    });

    it('cleans the reservation and reports a safe preflight error if private permissions cannot be established', () => {
        vi.mocked(fchmodSync).mockImplementationOnce(() => {
            throw new Error('private filesystem path');
        });
        expect(() => prepareDiagnosticDestination(path)).toThrow('--diagnostic-file requires');
        expect(existsSync(path)).toBe(false);
    });

    it('rejects an unexpectedly non-regular file or unsuccessful chmod', () => {
        const source = join(directory, 'source');
        writeFileSync(source, '');
        const stat = statSync(source);
        vi.mocked(fstatSync).mockImplementationOnce(() => ({ ...statSync(path), isFile: () => false }));
        expect(() => prepareDiagnosticDestination(path)).toThrow('--diagnostic-file requires');
        expect(existsSync(path)).toBe(false);
        vi.mocked(fchmodSync).mockImplementationOnce(() => undefined);
        const realFstat = vi.mocked(fstatSync).getMockImplementation();
        if (realFstat === undefined) throw new Error('missing fstat implementation');
        vi.mocked(fstatSync)
            .mockImplementationOnce(realFstat)
            .mockReturnValueOnce({ ...stat, mode: 0o644 });
        expect(() => prepareDiagnosticDestination(path)).toThrow('--diagnostic-file requires');
        expect(existsSync(path)).toBe(false);
    });

    it('does not replace the safe preflight failure when descriptor close or cleanup also fails', () => {
        const realClose = vi.mocked(closeSync).getMockImplementation();
        if (realClose === undefined) throw new Error('missing close implementation');
        vi.mocked(fchmodSync).mockImplementationOnce(() => {
            throw new Error('private chmod');
        });
        vi.mocked(closeSync).mockImplementationOnce((fd) => {
            realClose(fd);
            throw new Error('private close');
        });
        vi.mocked(unlinkSync).mockImplementationOnce(() => {
            throw new Error('private unlink');
        });
        expect(() => prepareDiagnosticDestination(path)).toThrow('--diagnostic-file requires');
        expect(readFileSync(path, 'utf8')).toBe('');
    });

    it('handles partial diagnostic writes by deleting the incomplete file', () => {
        const destination = prepareDiagnosticDestination(path);
        const realWrite = vi.mocked(writeFileSync).getMockImplementation();
        if (realWrite === undefined) throw new Error('missing write implementation');
        vi.mocked(writeFileSync).mockImplementationOnce((file) => {
            realWrite(file, '{');
            throw new Error('disk full');
        });
        expect(destination.write(record({ error: 'Missing field' }))).toBe(false);
        expect(destination.finish()).toBe(true);
        expect(existsSync(path)).toBe(false);
    });

    it('never deletes a replacement even during failed preflight cleanup', () => {
        vi.mocked(fchmodSync).mockImplementationOnce(() => {
            renameSync(path, join(directory, 'reserved'));
            writeFileSync(path, 'replacement');
            throw new Error('private chmod failure');
        });
        expect(() => prepareDiagnosticDestination(path)).toThrow('--diagnostic-file requires');
        expect(readFileSync(path, 'utf8')).toBe('replacement');
        expect(readFileSync(join(directory, 'reserved'), 'utf8')).toBe('');
    });

    it('refuses oversized records passed directly to the destination writer', () => {
        const destination = prepareDiagnosticDestination(path);
        const diagnostic = record({ error: 'Missing field' });
        expect(
            destination.write({
                ...diagnostic,
                server: { ...diagnostic.server, messages: ['x'.repeat(MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES)] },
            }),
        ).toBe(false);
        expect(destination.finish()).toBe(true);
        expect(existsSync(path)).toBe(false);
    });

    it('reports descriptor-close and cleanup errors without throwing over the operation result', () => {
        const destination = prepareDiagnosticDestination(path);
        const realClose = vi.mocked(closeSync).getMockImplementation();
        if (realClose === undefined) throw new Error('missing close implementation');
        vi.mocked(closeSync).mockImplementationOnce((fd) => {
            realClose(fd);
            throw new Error('private close error');
        });
        vi.mocked(lstatSync).mockImplementationOnce(() => {
            throw new Error('private stat error');
        });
        expect(destination.finish()).toBe(false);
    });
});
