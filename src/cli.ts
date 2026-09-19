#!/usr/bin/env node
import { TestRailClient } from './client.js';
import { runCli } from './cli/index.js';
import { sanitizeForTerminal } from './cli/sanitize.js';
import { readBoundedStdin } from './cli/stdin.js';

/**
 * Binary entrypoint (`bin: testrail` → `dist/cli.js`, and the `./cli` subpath
 * export). Everything process-shaped lives here so `runCli` stays a plain
 * function a test can call: argv slicing, the real streams, stdin, the exit
 * code, and the signal handlers.
 *
 * This is the only file in `src/` permitted to name `process.stdout` or
 * `process.stderr`; ESLint's `no-restricted-properties` rejects them
 * everywhere else, so every other byte the CLI emits has to travel through
 * these writers.
 *
 * `registerProcessHandlers` is set here rather than inside `runCli` on purpose.
 * It installs `exit`/`SIGINT`/`SIGTERM` listeners that, per ARCHITECTURE.md
 * §2.6, persist for the life of the process with no safe deregistration — so a
 * test calling `runCli` must not trigger it. The CLI is a standalone process
 * and does want it, for `destroy()` on Ctrl-C and the conventional 130/143
 * exit codes.
 */
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
        // Node sets `isTTY` to `true` for a terminal and leaves it `undefined`
        // for a pipe or redirect — it is never `false`. Testing `!== false`
        // here is what broke the documented `echo $KEY | testrail …` pipe
        // (#221/#230), so compare against `true` and nothing else.
        isTTY: process.stdin.isTTY === true,
        read: (maxBytes) => readBoundedStdin(maxBytes),
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
