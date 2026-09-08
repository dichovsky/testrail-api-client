import {
    closeSync,
    constants as fsConstants,
    fchmodSync,
    fstatSync,
    lstatSync,
    linkSync,
    mkdtempSync,
    openSync,
    readdirSync,
    realpathSync,
    rmdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
    type Stats,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
    CLI_DIAGNOSTIC_ACL_TIMEOUT_MS,
    CLI_DIAGNOSTIC_DIRECTORY_MODE,
    CLI_DIAGNOSTIC_FILE_MODE,
    CLI_DIAGNOSTIC_PERMISSION_MASK,
    MAX_CLI_DIAGNOSTIC_CREDENTIAL_CHARS,
    MAX_CLI_DIAGNOSTIC_DEPTH,
    MAX_CLI_DIAGNOSTIC_DECODE_PASSES,
    MAX_CLI_DIAGNOSTIC_INPUT_BYTES,
    MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS,
    MAX_CLI_DIAGNOSTIC_NODES,
    MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES,
} from '../constants.js';
import { TestRailApiError } from '../errors.js';
import type { TestRailConfig } from '../types.js';

const REDACTED = '[REDACTED]';
const VALIDATION_KEYS: ReadonlySet<string> = new Set([
    'error',
    'errors',
    'message',
    'messages',
    'detail',
    'details',
    'validationerrors',
]);
const SENSITIVE_KEY =
    /password|passwd|pwd|secret|token|auth|cookie|credential|apikey|accesskey|privatekey|session|request|header|stack|trace|body|payload/iu;

type DiagnosticServerState = 'available' | 'unavailable' | 'non_json' | 'oversized' | 'redaction_unavailable';

interface DiagnosticServerDetail {
    readonly state: DiagnosticServerState;
    readonly messages: readonly string[];
    readonly truncated: boolean;
}

/** Stable v1 record. No request metadata, raw body, exception message, or stack is serialized. */
export interface CliDiagnosticRecord {
    readonly version: 1;
    readonly kind: 'api_error' | 'cli_error';
    readonly status: number | null;
    readonly operationOutcome: 'failed_or_indeterminate';
    readonly server: DiagnosticServerDetail;
}

function omittedDetail(state: DiagnosticServerState): DiagnosticServerDetail {
    return { state, messages: [], truncated: state === 'oversized' };
}

function normalizedKey(key: string): string {
    const decoded = decodeMessage(key);
    return decoded.includes('[OMITTED]') ? 'credential' : decoded.replace(/[^a-z]/giu, '').toLowerCase();
}

/** Generate finite common wire encodings, longest first so partial matches cannot expose a suffix. */
function credentialVariants(auth: Pick<TestRailConfig, 'email' | 'apiKey' | 'baseUrl'>): readonly string[] | undefined {
    const secrets = [auth.email, auth.apiKey, auth.baseUrl, `${auth.email}:${auth.apiKey}`];
    if (secrets.some((secret) => secret.length > MAX_CLI_DIAGNOSTIC_CREDENTIAL_CHARS)) return undefined;
    try {
        const variants = secrets.flatMap((secret) => {
            const encoded = encodeURIComponent(secret);
            const basic = Buffer.from(secret).toString('base64');
            return [
                secret,
                encoded,
                encoded.replace(/%[A-F\d]{2}/gu, (part) => part.toLowerCase()),
                encodeURI(secret),
                encoded.replace(/%20/gu, '+'),
                encodeURIComponent(encoded),
                basic,
                basic.replace(/=+$/u, ''),
                Buffer.from(secret).toString('base64url'),
                JSON.stringify(secret).slice(1, -1),
            ];
        });
        return [...new Set(variants)].filter((value) => value !== '').sort((left, right) => right.length - left.length);
    } catch {
        // Malformed surrogate credentials cannot be URI-encoded safely; omit
        // details instead of letting diagnostic work change the API outcome.
        return undefined;
    }
}

/** Decode bounded common escaping layers before matching credentials or sensitive assignments. */
function decodeMessage(message: string): string {
    let decoded = message;
    for (let pass = 0; pass < MAX_CLI_DIAGNOSTIC_DECODE_PASSES; pass += 1) {
        const next = decoded
            .replace(/(?:%[a-f\d]{2})+/giu, (part) => {
                try {
                    return decodeURIComponent(part);
                } catch {
                    return '[OMITTED]';
                }
            })
            .replace(/\\u([a-f\d]{4})/giu, (_match: string, hex: string) =>
                String.fromCharCode(Number.parseInt(hex, 16)),
            )
            .replace(/&#(?:x[a-f\d]{1,6}|\d{1,7});/giu, (entity) => {
                const codePoint = Number(entity.replace(/^&#x/iu, '0x').replace(/^&#/u, '').slice(0, -1));
                try {
                    return String.fromCodePoint(codePoint);
                } catch {
                    return '[OMITTED]';
                }
            })
            .replace(
                /&(?:quot|apos|amp|lt|gt);/gu,
                (entity) =>
                    ({ '&quot;': '"', '&apos;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>' })[entity] ?? '[OMITTED]',
            );
        if (next === decoded) return decoded;
        decoded = next;
    }
    // Deeper encoding is deliberately not copied: its contents cannot be
    // checked within the bounded decoder, and could conceal a known secret.
    return /%[a-f\d]{2}|\\u[a-f\d]{4}|&(?:quot|apos|amp|lt|gt|#x?[a-f\d]+);/iu.test(decoded) ? '[OMITTED]' : decoded;
}

function redactMessage(message: string, secrets: readonly string[]): string {
    let redacted = decodeMessage(message);
    // Stack-looking values are not validation explanations, even when placed
    // under a normally useful `error` or `message` field. Restrict indentation
    // to horizontal whitespace so each multiline anchor scans only its line.
    if (/^[ \t]*at[ \t]+|\bat\s+[^\s(]+\s*\(|traceback|stack trace/imu.test(redacted)) return '[OMITTED]';
    // Omit the whole message when it contains a sensitive assignment. Parsing
    // a quoted value with a regex can stop at an escaped quote and leak its
    // suffix; request bodies embedded as strings have the same ambiguity.
    // Match maximal tokens without a trailing constraint. Combining a word
    // boundary, a hyphen-capable key and the suffix in one regex repeatedly
    // rescans long hyphenated strings when no assignment delimiter exists.
    const assignmentSuffix = /(?:\\*["'])?\s*[:=]/uy;
    for (const token of redacted.matchAll(/[\w-]+/gu)) {
        if (!SENSITIVE_KEY.test(normalizedKey(token[0]))) continue;
        assignmentSuffix.lastIndex = token.index + token[0].length;
        if (assignmentSuffix.test(redacted)) return REDACTED;
    }
    for (const secret of secrets) {
        const decodedSecret = decodeMessage(secret);
        redacted = redacted.split(decodedSecret).join(REDACTED);
    }
    return redacted
        .replace(/\b(?:Basic|Bearer)\s+[^\s"'<>]+/giu, REDACTED)
        .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/giu, `$1${REDACTED}@`);
}

function extractDetail(response: unknown, secrets: readonly string[] | undefined): DiagnosticServerDetail {
    if (secrets === undefined) return omittedDetail('redaction_unavailable');
    // The HTTP pipeline retains error bodies as text. Do not serialize an
    // arbitrary object here: it may have getters, cycles, or an unbounded size.
    if (typeof response !== 'string' || response === '') return omittedDetail('unavailable');
    if (
        response.length > MAX_CLI_DIAGNOSTIC_INPUT_BYTES ||
        Buffer.byteLength(response) > MAX_CLI_DIAGNOSTIC_INPUT_BYTES
    ) {
        return omittedDetail('oversized');
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(response) as unknown;
    } catch {
        // HTML, malformed JSON and free text often contain proxy credentials
        // or internal traces. Keep the status, but never copy their raw text.
        return omittedDetail('non_json');
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return omittedDetail('unavailable');

    const messages: string[] = [];
    let nodes = 0;
    let truncated = false;
    const visit = (value: unknown, depth: number): void => {
        nodes += 1;
        if (nodes > MAX_CLI_DIAGNOSTIC_NODES || depth > MAX_CLI_DIAGNOSTIC_DEPTH) {
            truncated = true;
            return;
        }
        if (typeof value === 'string') {
            // Redact the complete bounded value before shortening it, so a
            // credential that crosses the truncation boundary cannot leak.
            const safe = redactMessage(value, secrets);
            truncated ||= safe.length > MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS;
            messages.push(safe.slice(0, MAX_CLI_DIAGNOSTIC_MESSAGE_CHARS));
        } else if (Array.isArray(value)) {
            for (const child of value) {
                visit(child, depth + 1);
                if (nodes > MAX_CLI_DIAGNOSTIC_NODES) break;
            }
        } else if (value !== null && typeof value === 'object') {
            for (const [key, child] of Object.entries(value)) {
                if (!SENSITIVE_KEY.test(normalizedKey(key))) visit(child, depth + 1);
                if (nodes > MAX_CLI_DIAGNOSTIC_NODES) break;
            }
        }
    };
    // Only known validation containers qualify. Nested field names are never
    // emitted; sensitive containers are omitted with all their descendants.
    for (const [key, value] of Object.entries(parsed)) {
        if (VALIDATION_KEYS.has(normalizedKey(key))) visit(value, 0);
        if (nodes > MAX_CLI_DIAGNOSTIC_NODES) break;
    }
    return { state: messages.length > 0 ? 'available' : 'unavailable', messages, truncated };
}

export function createDiagnosticRecord(
    error: unknown,
    auth: Pick<TestRailConfig, 'email' | 'apiKey' | 'baseUrl'>,
): CliDiagnosticRecord {
    const apiError = error instanceof TestRailApiError;
    const record: CliDiagnosticRecord = {
        version: 1,
        kind: apiError ? 'api_error' : 'cli_error',
        status: apiError && Number.isSafeInteger(error.status) ? error.status : null,
        operationOutcome: 'failed_or_indeterminate',
        // Successful-response mismatch and transport errors must not copy
        // successful entity data or the underlying network exception message.
        server:
            apiError && error.status >= 300
                ? extractDetail(error.response, credentialVariants(auth))
                : omittedDetail('unavailable'),
    };
    return Buffer.byteLength(JSON.stringify(record)) <= MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES
        ? record
        : { ...record, server: omittedDetail('oversized') };
}

export interface CliDiagnosticDestination {
    /** Return false on I/O failure; never replace or throw over the original operation error. */
    readonly write: (record: CliDiagnosticRecord) => boolean;
    /** Remove an unused/partial reservation, retaining only a completely written record. */
    readonly finish: () => boolean;
}

function sameFile(left: Stats, right: Stats): boolean {
    return left.dev === right.dev && left.ino === right.ino;
}

function canonicalDestination(path: string): string {
    const absolute = resolve(path);
    return join(realpathSync(dirname(absolute)), basename(absolute));
}

/** Darwin allow ACLs can grant read access despite mode 0600; clear only the held reservation's ACL. */
function clearDiagnosticAcl(fd: number): void {
    if (process.platform !== 'darwin') return;
    // Map the already-open inode to the child's fixed fd3. Passing the user's
    // path would let a replacement redirect chmod to another file. Native
    // chmod -N succeeds only after removing the ACL; any failure is fatal to
    // preflight (or to the diagnostic write after the API operation).
    execFileSync('/bin/chmod', ['-N', '/dev/fd/3'], {
        stdio: ['ignore', 'ignore', 'ignore', fd],
        env: {},
        timeout: CLI_DIAGNOSTIC_ACL_TIMEOUT_MS,
        killSignal: 'SIGKILL',
    });
}

/** Create the Darwin inode only after its parent is private, then publish it by an exclusive hard link. */
function createDarwinDiagnosticFile(destination: string): number {
    const originalCwd = process.cwd();
    const originalIdentity = statSync('.');
    const innerName = 'record';
    let stage: string | undefined;
    let directoryFd: number | undefined;
    let directoryIdentity: Stats | undefined;
    let fd: number | undefined;
    let identity: Stats | undefined;
    let entered = false;
    let anchored = false;
    let complete = false;
    let cleanupFailed = false;
    try {
        stage = mkdtempSync(join(dirname(destination), '.testrail-diagnostic-'));
        directoryFd = openSync(stage, fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW);
        directoryIdentity = fstatSync(directoryFd);
        if (!directoryIdentity.isDirectory() || directoryIdentity.uid !== process.getuid?.())
            throw new Error('Unsafe staging directory');
        fchmodSync(directoryFd, CLI_DIAGNOSTIC_DIRECTORY_MODE);
        clearDiagnosticAcl(directoryFd);
        if ((fstatSync(directoryFd).mode & CLI_DIAGNOSTIC_PERMISSION_MASK) !== CLI_DIAGNOSTIC_DIRECTORY_MODE)
            throw new Error('Unsafe staging permissions');
        // Darwin's /dev/fd directory entries do not support relative lookup.
        // Anchor the synchronous creation to the kernel cwd instead, checking
        // that chdir entered the secured held inode before creating any file.
        process.chdir(stage);
        entered = true;
        if (!sameFile(statSync('.'), directoryIdentity)) throw new Error('Replaced staging directory');
        anchored = true;
        if (readdirSync('.').length !== 0) throw new Error('Nonempty staging directory');
        fd = openSync(
            innerName,
            fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW,
            CLI_DIAGNOSTIC_FILE_MODE,
        );
        identity = fstatSync(fd);
        if (
            !identity.isFile() ||
            identity.nlink !== 1 ||
            (identity.mode & CLI_DIAGNOSTIC_PERMISSION_MASK) !== CLI_DIAGNOSTIC_FILE_MODE
        )
            throw new Error('Unsafe staged file');
        // A hard link preserves this initially-private inode and cannot
        // overwrite an existing destination or follow its symbolic link.
        linkSync(innerName, destination);
        if (!sameFile(lstatSync(destination), identity)) throw new Error('Replaced diagnostic destination');
        unlinkSync(innerName);
        complete = true;
    } finally {
        if (anchored && identity !== undefined) {
            try {
                if (sameFile(lstatSync(innerName), identity)) unlinkSync(innerName);
            } catch (error) {
                if ((error as { readonly code?: string }).code !== 'ENOENT') cleanupFailed = true;
            }
        }
        // Restore and verify before any return, throw, or API dispatch. A
        // restoration failure fails preflight; it can never run a handler in
        // the staging directory or silently change relative input resolution.
        if (entered) {
            try {
                process.chdir(originalCwd);
                if (!sameFile(statSync('.'), originalIdentity)) cleanupFailed = true;
            } catch {
                cleanupFailed = true;
            }
        }
        if (stage !== undefined && directoryIdentity !== undefined) {
            try {
                if (sameFile(lstatSync(stage), directoryIdentity)) rmdirSync(stage);
                else cleanupFailed = true;
            } catch {
                cleanupFailed = true;
            }
        }
        if (directoryFd !== undefined) {
            try {
                closeSync(directoryFd);
            } catch {
                cleanupFailed = true;
            }
        }
        if (!complete || cleanupFailed) {
            if (identity !== undefined) {
                try {
                    if (sameFile(lstatSync(destination), identity)) unlinkSync(destination);
                } catch {
                    /* Preserve foreign replacements and the original preflight error. */
                }
            }
            if (fd !== undefined) {
                try {
                    closeSync(fd);
                } catch {
                    /* No diagnostic data was written. */
                }
            }
        }
    }
    if (cleanupFailed) throw new Error('Cannot safely clean diagnostic staging');
    if (fd === undefined) throw new Error('Missing staged diagnostic file');
    return fd;
}

/** Reserve a new private regular file before dispatch; retain its descriptor throughout the request. */
export function prepareDiagnosticDestination(path: string, otherOutput?: string): CliDiagnosticDestination {
    // Node's file mode cannot establish a private Windows ACL. Fail before
    // dispatch rather than silently inheriting a potentially shared ACL.
    if (process.platform === 'win32') {
        throw new Error(
            '--diagnostic-file is unavailable on Windows because private file permissions cannot be guaranteed; no API request was sent.',
        );
    }
    let fd: number | undefined;
    let destination: string | undefined;
    let identity: Stats | undefined;
    try {
        if (path === '' || path === '-' || path.includes('\0')) throw new Error('Invalid path');
        destination = canonicalDestination(path);
        if (otherOutput !== undefined && otherOutput !== '-' && canonicalDestination(otherOutput) === destination) {
            throw new Error('Conflicting output');
        }
        // O_EXCL also refuses dangling symlinks and special files. Resolve the
        // parent once and use the held fd, never reopening after the request.
        fd =
            process.platform === 'darwin'
                ? createDarwinDiagnosticFile(destination)
                : openSync(
                      destination,
                      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW,
                      CLI_DIAGNOSTIC_FILE_MODE,
                  );
        identity = fstatSync(fd);
        if (!identity.isFile() || identity.nlink !== 1) throw new Error('Unsafe file');
        if (otherOutput !== undefined && otherOutput !== '-') {
            try {
                // Case-insensitive and Unicode-normalizing filesystems can
                // alias different spellings. Check the reserved inode, too,
                // before a --force download could overwrite our reservation.
                if (sameFile(lstatSync(canonicalDestination(otherOutput)), identity))
                    throw new Error('Conflicting output');
            } catch (error) {
                if ((error as { readonly code?: string }).code !== 'ENOENT') throw error;
            }
        }
        fchmodSync(fd, CLI_DIAGNOSTIC_FILE_MODE);
        clearDiagnosticAcl(fd);
        const secured = fstatSync(fd);
        if ((secured.mode & CLI_DIAGNOSTIC_PERMISSION_MASK) !== CLI_DIAGNOSTIC_FILE_MODE || secured.nlink !== 1)
            throw new Error('Unsafe permissions');
        if (!sameFile(lstatSync(destination), identity)) throw new Error('Replaced destination');
    } catch {
        if (fd !== undefined) {
            try {
                closeSync(fd);
            } catch {
                /* Preserve the privacy-safe preflight error. */
            }
        }
        if (destination !== undefined && identity !== undefined) {
            try {
                if (sameFile(lstatSync(destination), identity)) unlinkSync(destination);
            } catch {
                /* Do not expose filesystem exception paths. */
            }
        }
        throw new Error(
            '--diagnostic-file requires a new private regular file in an existing directory, distinct from --out; no API request was sent.',
        );
    }
    const reservedFd = fd;
    const reservedPath = destination;
    const reservedIdentity = identity;
    let written = false;
    return {
        write: (record) => {
            try {
                const current = fstatSync(reservedFd);
                if (!sameFile(lstatSync(reservedPath), reservedIdentity) || !current.isFile() || current.nlink !== 1)
                    return false;
                if ((current.mode & CLI_DIAGNOSTIC_PERMISSION_MASK) !== CLI_DIAGNOSTIC_FILE_MODE) return false;
                clearDiagnosticAcl(reservedFd);
                // Recheck after the native ACL command, including links and
                // modes changed while that child process was running.
                const secured = fstatSync(reservedFd);
                if (
                    !sameFile(lstatSync(reservedPath), reservedIdentity) ||
                    secured.nlink !== 1 ||
                    (secured.mode & CLI_DIAGNOSTIC_PERMISSION_MASK) !== CLI_DIAGNOSTIC_FILE_MODE
                )
                    return false;
                const serialized = JSON.stringify(record);
                if (Buffer.byteLength(serialized) > MAX_CLI_DIAGNOSTIC_OUTPUT_BYTES) return false;
                writeFileSync(reservedFd, serialized, 'utf8');
                written = true;
                return true;
            } catch {
                return false;
            }
        },
        finish: () => {
            let complete = true;
            try {
                closeSync(reservedFd);
            } catch {
                complete = false;
            }
            if (!written) {
                try {
                    // Do not unlink a replacement planted during the request.
                    if (sameFile(lstatSync(reservedPath), reservedIdentity)) unlinkSync(reservedPath);
                    else complete = false;
                } catch {
                    complete = false;
                }
            }
            return complete;
        },
    };
}
