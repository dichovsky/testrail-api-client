#!/usr/bin/env node
import { isatty } from 'node:tty';
import { TestRailClient } from './client.js';
import { runCli } from './cli/index.js';
import { sanitizeForTerminal } from './cli/sanitize.js';
import { STDIN_FD } from './constants.js';
import { readBoundedStdin, readStdinBinary } from './cli/stdin.js';

/**
 * Binary entrypoint (`bin: testrail` → `dist/cli.js`, and the `./cli` subpath
 * export). This file contains all process-specific code: argv slicing, the
 * real streams, stdin, the exit code, and the signal handlers. Thus, `runCli`
 * stays a plain function that a test can call.
 *
 * This file is the only file in `src/` that is permitted to name
 * `process.stdout` or `process.stderr`. The oxlint rule
 * `no-restricted-properties` rejects them in all other files. Thus, all other
 * bytes that the CLI writes must go through these writers.
 *
 * This file, not `runCli`, intentionally sets `registerProcessHandlers`. The
 * option installs `exit`/`SIGINT`/`SIGTERM` listeners. Per
 * ARCHITECTURE.md §2.6, these listeners stay for the life of the process, and
 * no safe deregistration is possible. Thus, a test that calls `runCli` must not
 * install them. The CLI is a standalone process and needs these listeners for
 * `destroy()` on Ctrl-C and for the standard 130/143 exit codes.
 */

// A reader that closes early (`testrail case list --all 2>&1 | head`) reaches
// this process as an `EPIPE` 'error' event on stdout or stderr. With no
// listener Node treats it as an uncaught exception, prints a stack trace, and
// replaces the exit code. Nobody is left to read the rest, so stop quietly
// instead; `process.exit()` without an argument keeps a failure code that was
// already recorded. Any other stream error stays fatal.
const exitQuietlyOnEpipe = (error: NodeJS.ErrnoException): void => {
    if (error.code !== 'EPIPE') throw error;
    process.exit();
};
process.stdout.on('error', exitQuietlyOnEpipe);
process.stderr.on('error', exitQuietlyOnEpipe);

runCli({
    argv: process.argv.slice(2),
    env: process.env,
    stdout: (chunk) => void process.stdout.write(chunk),
    stderr: (chunk) => void process.stderr.write(chunk),
    // Read once here rather than at the point of use: `process.stdout.isTTY`
    // is `true` for a terminal and `undefined` otherwise, never `false` — the
    // same shape that broke the stdin pipe in #221/#230.
    stdoutIsTTY: process.stdout.isTTY === true,
    stdin: {
        // `isatty`, not `process.stdin.isTTY`: creating the stream switches
        // descriptor 0 to non-blocking mode, which only the read below wants.
        isTTY: isatty(STDIN_FD),
        // Create the stream only when a text read actually happens. Its
        // non-blocking descriptor makes `readBoundedStdin` poll on EAGAIN
        // under STDIN_READ_TIMEOUT_MS instead of blocking in a syscall, so a
        // producer that never closes the pipe ends in an error instead of a
        // hang that also defers SIGINT and SIGTERM indefinitely.
        read: (maxBytes) => {
            void process.stdin;
            return readBoundedStdin(maxBytes, STDIN_FD);
        },
        readBinary: (maxBytes, timeoutMs) => readStdinBinary(process.stdin, maxBytes, timeoutMs),
    },
    createClient: (config) => new TestRailClient({ ...config, registerProcessHandlers: true }),
    platform: process.platform,
    lifetime: {
        // The diagnostic reservation registers here because SIGINT/SIGTERM
        // terminate synchronously through the client's own handlers, so an
        // async `finally` alone cannot release a reserved file.
        onExit: (listener) => void process.on('exit', listener),
        offExit: (listener) => void process.removeListener('exit', listener),
    },
}).then(
    (code) => {
        // Assign rather than call `process.exit()`: an immediate exit can
        // truncate pipe-backed stdout, so let the event loop flush both
        // streams naturally.
        process.exitCode = code;
    },
    (e: unknown) => {
        // `runCli` funnels every reachable failure into an exit code; this arm
        // is a last-resort net for a synchronous throw from a collaborator
        // invoked outside its try. Sanitized so a control-char-laden message
        // cannot inject a terminal escape.
        process.stderr.write(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        process.exitCode = 1;
    },
);
