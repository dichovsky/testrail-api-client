import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        pool: 'forks',
        isolate: true,
        // `.claude/worktrees/**` excludes stray fixture files from leftover
        // agent worktrees (created by Claude Code's worktree isolation mode).
        // Those directories live outside the canonical source tree and
        // their fixture files should never be executed as tests.
        exclude: ['**/node_modules/**', '**/dist/**', 'tests/fixtures/**', '.claude/worktrees/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/**/types.ts'],
            // Per-metric floor: 99% on lines/statements/functions, 98% on
            // branches. Do NOT lower these floors without documented
            // justification.
            //
            // Unreachable-branch catalog (10.0.0 release audit, 2026-11-21).
            // The remaining uncovered arms are defensive code that tests cannot
            // reach. List any new one here, by file and construct, with the
            // reason. Run `npm run test:coverage` and read coverage-final.json
            // for current line numbers.
            //
            // - body-reader.ts: the `!timedOut` latch in the streaming
            //   deadline, and `timeoutId !== undefined` in the fallback reader
            //   (the Promise executor always assigns it).
            // - client-core.ts: the private-literal check in validatePublicHost
            //   (the constructor runs the same check first); the
            //   `process.on` guard in registerProcessHandlers (Node always has
            //   it); `requests[0] ?? now` in the rate limiter (index type);
            //   the `signal.aborted` guard in raceAttemptDeadline (its one
            //   caller passes a controller created three lines earlier, and a
            //   timer cannot fire before the next statement; the guard stays so
            //   a second caller cannot hang silently).
            // - config-validation.ts: `firstIssue?.path ?? []` (a failed parse
            //   always has an issue).
            // - pinned-dispatcher.ts: `validatedAddressKey ?? ''` x2 (always
            //   supplied); the sparse-header-list throw; the `!finished` race
            //   guard on late data; `statusCode ?? 0` and
            //   `statusMessage ?? ''` (Node always sets them).
            // - upload-source.ts: `if (finished)` in the cancel path.
            // - cli/body.ts, cli/file-input.ts (stat), cli/index.ts x2:
            //   `String(e)` fallbacks where fs, JSON.parse, parseArgs, and the
            //   ID parsers always throw Error.
            // - cli/diagnostics.ts: `?? '[OMITTED]'` (the regex admits only the
            //   five mapped entities) and the staged-fd narrowing guard.
            // - cli/output.ts: the `?? k`, `?? ''`, and `?? 0` index fallbacks in
            //   renderTable and the width scan, `codePointAt(0) ?? 0`,
            //   `firstNested ?? ''` (split always returns an element), and
            //   `cell === undefined` (projectRecord fills every column).
            thresholds: {
                lines: 99,
                statements: 99,
                functions: 99,
                branches: 98,
            },
        },
    },
});
