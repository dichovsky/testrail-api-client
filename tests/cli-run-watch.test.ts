/**
 * Unit tests for the `run watch` handler (`src/cli/handlers/run-watch.ts`).
 *
 * The handler is a long-running polling loop, so the tests mock setTimeout
 * (via vitest's fake timers) to drive the recursive setTimeout chain
 * synchronously. Without fake timers a single test would block for the
 * default 30s interval.
 *
 * Coverage:
 *   - happy path: poll → emit snapshot → poll → emit completion → resolve
 *   - state diff: subsequent polls that change a watched field emit a
 *     `change` event; polls with no diff emit nothing
 *   - --once: single poll then resolve regardless of is_completed
 *   - interval validation: out-of-range / malformed --interval rejected
 *     fail-fast (no API call)
 *   - SIGINT: pending timeout cleared, stderr summary written, loop resolved
 *   - dry-run: client not called; preview emitted
 *   - transient error: 5xx / network-error polls log to stderr and continue;
 *     watcher resolves when a subsequent poll returns is_completed=true
 *   - rejection: an unrecoverable getRun() failure (4xx, plain Error)
 *     propagates so main() exits 1
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { handleRunWatch } from '../src/cli/handlers/run-watch.js';
import { TestRailApiError } from '../src/errors.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';
import type { Run } from '../src/types.js';

interface MockedClient {
    getRun: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return { getRun: vi.fn() };
}

function mockRun(overrides: Partial<Run> = {}): Run {
    return {
        id: 42,
        suite_id: 1,
        name: 'CI Run',
        include_all: true,
        is_completed: false,
        passed_count: 0,
        blocked_count: 0,
        untested_count: 10,
        retest_count: 0,
        failed_count: 0,
        project_id: 1,
        created_on: 0,
        created_by: 1,
        url: 'https://example.testrail.io/runs/view/42',
        ...overrides,
    };
}

interface CtxOverrides {
    pathParams?: string[];
    interval?: string;
    once?: boolean;
    dryRun?: boolean;
}

function buildCtx(
    client: MockedClient,
    overrides: CtxOverrides = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: client as unknown as TestRailClient,
        args: {
            pathParams: overrides.pathParams ?? ['42'],
            ...(overrides.interval !== undefined && { interval: overrides.interval }),
            ...(overrides.once === true && { once: true }),
        },
        bodyInput: {},
        dryRun: overrides.dryRun ?? false,
        force: false,
        confirmDestructive: false,
        out,
    };
    return { ctx, out };
}

describe('handleRunWatch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('emits an initial snapshot then a completed event on first completed poll, returning code 0', async () => {
        const client = buildClient();
        client.getRun.mockResolvedValueOnce(mockRun({ is_completed: true, passed_count: 10, untested_count: 0 }));
        const { ctx, out } = buildCtx(client);

        await handleRunWatch(ctx);

        expect(client.getRun).toHaveBeenCalledTimes(1);
        // First poll: snapshot event because lastSnapshot was undefined.
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ event: 'snapshot', runId: 42 }));
        // Same poll: completed event because is_completed flipped on the very
        // first poll. The handler emits both events in that order.
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ event: 'completed', runId: 42 }));
    });

    it('emits a change event when a watched field diffs between polls', async () => {
        const client = buildClient();
        client.getRun
            .mockResolvedValueOnce(mockRun({ passed_count: 0, untested_count: 10 }))
            .mockResolvedValueOnce(mockRun({ passed_count: 3, untested_count: 7 }))
            .mockResolvedValueOnce(mockRun({ is_completed: true, passed_count: 10, untested_count: 0 }));

        const { ctx, out } = buildCtx(client);

        // Kick off the watcher. Each poll resolves; we then advance timers
        // to fire the next recursive setTimeout.
        const promise = handleRunWatch(ctx);
        // After the first poll resolves, the handler has scheduled a 30s timer.
        await vi.advanceTimersByTimeAsync(30_000);
        await vi.advanceTimersByTimeAsync(30_000);
        await promise;

        expect(client.getRun).toHaveBeenCalledTimes(3);
        // Snapshot first, then change, then change+completed on the final poll.
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events).toContain('snapshot');
        expect(events.filter((e) => e === 'change').length).toBeGreaterThanOrEqual(1);
        expect(events).toContain('completed');
    });

    it('does NOT emit a change event when no watched field diffs between polls', async () => {
        const client = buildClient();
        const stable = mockRun({ passed_count: 5, untested_count: 5 });
        client.getRun
            .mockResolvedValueOnce(stable)
            .mockResolvedValueOnce(stable)
            .mockResolvedValueOnce(mockRun({ is_completed: true, passed_count: 5, untested_count: 0 }));

        const { ctx, out } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        await vi.advanceTimersByTimeAsync(30_000);
        await vi.advanceTimersByTimeAsync(30_000);
        await promise;

        // First poll emits snapshot. Second poll is identical → no change event.
        // Third poll diffs (is_completed → true) → change + completed.
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events.filter((e) => e === 'snapshot').length).toBe(1);
        // Second poll should NOT emit a change event — verify by counting:
        // change events should only fire on the final transition.
        const changeCount = events.filter((e) => e === 'change').length;
        expect(changeCount).toBeLessThanOrEqual(1);
    });

    it('--once polls a single time and resolves even when is_completed is false', async () => {
        const client = buildClient();
        client.getRun.mockResolvedValueOnce(mockRun({ is_completed: false }));
        const { ctx, out } = buildCtx(client, { once: true });

        await handleRunWatch(ctx);

        expect(client.getRun).toHaveBeenCalledTimes(1);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ event: 'snapshot' }));
        // No `completed` event since is_completed was false; that's by design
        // for --once.
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events).not.toContain('completed');
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { interval: '60', dryRun: true });
        await handleRunWatch(ctx);
        expect(client.getRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'run watch', runId: 42, intervalSeconds: 60 }),
        );
    });

    it('rejects --interval below the 5-second floor', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { interval: '1' });
        await expect(handleRunWatch(ctx)).rejects.toThrow(/--interval must be between 5 and 600/);
        expect(client.getRun).not.toHaveBeenCalled();
    });

    it('rejects --interval above the 600-second ceiling', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { interval: '3600' });
        await expect(handleRunWatch(ctx)).rejects.toThrow(/--interval must be between 5 and 600/);
        expect(client.getRun).not.toHaveBeenCalled();
    });

    it('rejects malformed --interval (non-positive-integer)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { interval: 'abc' });
        await expect(handleRunWatch(ctx)).rejects.toThrow(/--interval must be a positive integer/);
        expect(client.getRun).not.toHaveBeenCalled();
    });

    it('rejects --interval with leading zero (silent-coercion guard)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { interval: '030' });
        await expect(handleRunWatch(ctx)).rejects.toThrow(/--interval must be a positive integer/);
    });

    it('rejects non-positive run_id before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['0'] });
        await expect(handleRunWatch(ctx)).rejects.toThrow(/run_id/);
        expect(client.getRun).not.toHaveBeenCalled();
    });

    it('propagates an unrecoverable getRun rejection so main() exits 1', async () => {
        const client = buildClient();
        client.getRun.mockRejectedValueOnce(new Error('Auth lost mid-watch'));
        const { ctx } = buildCtx(client);
        await expect(handleRunWatch(ctx)).rejects.toThrow(/Auth lost mid-watch/);
    });

    it('propagates a 401 unrecoverable API error so main() exits 1', async () => {
        const client = buildClient();
        client.getRun.mockRejectedValueOnce(new TestRailApiError(401, 'Unauthorized'));
        const { ctx } = buildCtx(client);
        await expect(handleRunWatch(ctx)).rejects.toThrow(/401/);
    });

    it('logs a 5xx transient error to stderr and continues polling until completion', async () => {
        const client = buildClient();
        // First poll: 503 (transient). Second poll: completed.
        client.getRun
            .mockRejectedValueOnce(new TestRailApiError(503, 'Service Unavailable'))
            .mockResolvedValueOnce(mockRun({ is_completed: true, passed_count: 5, untested_count: 0 }));

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx, out } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        // Advance past the retry timer (30s default interval).
        await vi.advanceTimersByTimeAsync(30_000);
        await promise;

        expect(client.getRun).toHaveBeenCalledTimes(2);
        // Transient error written to stderr.
        expect(stderrWrites.join('')).toMatch(/transient error for runId=42/);
        // Watcher continued and completed on the second poll.
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events).toContain('snapshot');
        expect(events).toContain('completed');

        spyErr.mockRestore();
    });

    it('logs a network error (status 0) transiently and continues polling', async () => {
        const client = buildClient();
        client.getRun
            .mockRejectedValueOnce(new TestRailApiError(0, 'Network error'))
            .mockResolvedValueOnce(mockRun({ is_completed: false }))
            .mockResolvedValueOnce(mockRun({ is_completed: true, passed_count: 3, untested_count: 0 }));

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx, out } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        await vi.advanceTimersByTimeAsync(30_000); // retry after transient
        await vi.advanceTimersByTimeAsync(30_000); // second successful poll
        await promise;

        expect(client.getRun).toHaveBeenCalledTimes(3);
        expect(stderrWrites.join('')).toMatch(/transient error/);
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events).toContain('completed');

        spyErr.mockRestore();
    });

    it('SIGINT during transient-retry wait cancels the watcher cleanly', async () => {
        const client = buildClient();
        // First poll: transient 500. SIGINT fires during the retry wait.
        client.getRun.mockRejectedValueOnce(new TestRailApiError(500, 'Internal Server Error'));

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        // Let the transient poll settle.
        await Promise.resolve();
        await Promise.resolve();
        // Fire SIGINT while we're waiting for the retry timer.
        process.emit('SIGINT');
        await vi.advanceTimersByTimeAsync(0);
        await promise;

        // Should resolve cleanly (not reject) — cancelled flag is checked.
        expect(stderrWrites.join('')).toMatch(/transient error|interrupted/);

        spyErr.mockRestore();
    });

    it('SIGINT prepends a listener that cancels the pending poll and writes a status summary', async () => {
        const client = buildClient();
        // First poll succeeds, then we emit SIGINT before the second poll fires.
        client.getRun.mockResolvedValueOnce(mockRun({ passed_count: 1 }));

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        // Let the first poll settle (microtask flush).
        await Promise.resolve();
        await Promise.resolve();
        // Emit SIGINT — our handler prepended a listener that flips the
        // cancelled flag and clears the pending timer. Because of `prepend`
        // ordering, it runs before any other registered SIGINT listeners.
        process.emit('SIGINT');
        // Drain microtasks so the deferred Promise resolves.
        await vi.advanceTimersByTimeAsync(0);
        await promise;

        expect(stderrWrites.join('')).toMatch(/run watch: interrupted at runId=42/);
        spyErr.mockRestore();
    });

    it('SIGINT before any successful poll writes "(no successful poll)" summary', async () => {
        // Exercises the `lastSnapshot !== undefined ? ... : '(no successful poll)'`
        // false branch on signal handling. SIGINT fires while the first
        // getRun() is still pending.
        const client = buildClient();
        // First poll: never resolves until we cancel.
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        client.getRun.mockImplementationOnce(() => new Promise(() => undefined));

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        // Emit SIGINT immediately — no poll has settled yet.
        await Promise.resolve();
        process.emit('SIGINT');
        await vi.advanceTimersByTimeAsync(0);
        await promise;

        expect(stderrWrites.join('')).toMatch(/\(no successful poll\)/);
        spyErr.mockRestore();
    });

    it('SIGINT delivered twice is idempotent (covers the `if (cancelled) return` re-entry guard)', async () => {
        // Exercises the `if (cancelled) return;` true branch in onSignal.
        // Two consecutive signals must not double-write the status summary.
        const client = buildClient();
        client.getRun.mockResolvedValueOnce(mockRun({ passed_count: 1 }));

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        await Promise.resolve();
        await Promise.resolve();
        process.emit('SIGINT');
        process.emit('SIGINT'); // second signal: should be a no-op
        await vi.advanceTimersByTimeAsync(0);
        await promise;

        // Only one "interrupted at" line should appear despite two signals.
        const interruptedCount = stderrWrites.join('').match(/interrupted at runId=42/g) ?? [];
        expect(interruptedCount.length).toBe(1);
        spyErr.mockRestore();
    });

    it('--quiet suppresses transient-error stderr writes (covers the !argv.includes("--quiet") false branch)', async () => {
        // Exercises the `!process.argv.includes('--quiet')` false branch
        // in the transient-error stderr path.
        const argvBackup = process.argv.slice();
        process.argv.push('--quiet');
        try {
            const client = buildClient();
            client.getRun
                .mockRejectedValueOnce(new TestRailApiError(503, 'Service Unavailable'))
                .mockResolvedValueOnce(mockRun({ is_completed: true, passed_count: 5, untested_count: 0 }));

            const stderrWrites: string[] = [];
            const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
                stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
                return true;
            });

            const { ctx } = buildCtx(client);
            const promise = handleRunWatch(ctx);
            await vi.advanceTimersByTimeAsync(30_000);
            await promise;

            // --quiet suppresses the transient line; no `transient error`
            // string should reach stderr even though the 503 was retried.
            expect(stderrWrites.join('')).not.toMatch(/transient error/);
            spyErr.mockRestore();
        } finally {
            process.argv.length = 0;
            process.argv.push(...argvBackup);
        }
    });

    it('--quiet suppresses the SIGINT status summary too', async () => {
        // Mirror suppression on the signal-summary write at line 179.
        const argvBackup = process.argv.slice();
        process.argv.push('--quiet');
        try {
            const client = buildClient();
            client.getRun.mockResolvedValueOnce(mockRun({ passed_count: 1 }));

            const stderrWrites: string[] = [];
            const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
                stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
                return true;
            });

            const { ctx } = buildCtx(client);
            const promise = handleRunWatch(ctx);
            await Promise.resolve();
            await Promise.resolve();
            process.emit('SIGINT');
            await vi.advanceTimersByTimeAsync(0);
            await promise;

            expect(stderrWrites.join('')).not.toMatch(/interrupted at runId/);
            spyErr.mockRestore();
        } finally {
            process.argv.length = 0;
            process.argv.push(...argvBackup);
        }
    });

    it('wraps a non-Error rejection from getRun as Error (covers the rejection-shape coercion)', async () => {
        // Exercises the `e instanceof Error ? e : new Error(String(e))` false
        // branch — a thunk that rejects with a plain string must still
        // surface as an Error to main().
        const client = buildClient();
        client.getRun.mockImplementationOnce(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/prefer-promise-reject-errors
            (): Promise<never> => Promise.reject('plain-string-failure'),
        );
        const { ctx } = buildCtx(client);
        await expect(handleRunWatch(ctx)).rejects.toThrow(/plain-string-failure/);
    });

    it('SIGINT during the getRun await cancels gracefully (covers post-getRun cancelled branch)', async () => {
        // Exercises the `if (cancelled) { resolve(); return; }` branch at
        // line 210 (after the getRun promise settles but before snapshot
        // emission). We pause the getRun promise, fire SIGINT, then resolve
        // — the post-await cancelled check should short-circuit so no
        // snapshot event is emitted.
        const client = buildClient();
        let release: ((run: Run) => void) | undefined;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        client.getRun.mockImplementationOnce(() => {
            return new Promise<Run>((resolve) => {
                release = resolve;
            });
        });

        const { ctx, out } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        // Let the poll start and reach the pending getRun.
        await Promise.resolve();
        // Fire SIGINT while getRun is pending. The watcher sets cancelled=true.
        process.emit('SIGINT');
        // Now release the pending getRun. The .then handler should see
        // cancelled=true and short-circuit BEFORE emitting a snapshot.
        release?.(mockRun({ passed_count: 5 }));
        await vi.advanceTimersByTimeAsync(0);
        await promise;

        // No snapshot event should have been emitted because cancelled was
        // already true when the promise settled.
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events).not.toContain('snapshot');
    });

    it('SIGINT fired before the first poll runs short-circuits cleanly (covers poll-entry cancelled branch)', async () => {
        // Exercises the `if (cancelled) { resolve(); return; }` at line 203
        // (top of poll()). We arm the signal listeners by entering handleRunWatch,
        // then emit SIGINT BEFORE the first poll() invocation has a chance to
        // call getRun. The poll function then sees cancelled=true at entry
        // and short-circuits without calling getRun.
        const client = buildClient();
        // Pre-register the SIGINT signal to fire as soon as handleRunWatch
        // installs its prependListener — we hook into the prepended listener
        // by intercepting prependListener.
        const origPrepend = process.prependListener.bind(process);
        const prependSpy = vi.spyOn(process, 'prependListener').mockImplementation((event, listener) => {
            const ret = origPrepend(event, listener);
            // As soon as the SIGINT listener is installed, fire it
            // synchronously so cancelled=true BEFORE the initial poll() call.
            if (event === 'SIGINT') {
                (listener as () => void)();
            }
            return ret;
        });

        const { ctx } = buildCtx(client);
        try {
            await handleRunWatch(ctx);
        } finally {
            prependSpy.mockRestore();
        }
        // getRun must not have been called because cancelled was true at poll entry.
        expect(client.getRun).not.toHaveBeenCalled();
    });

    it('SIGINT during a failing getRun retry-window cancels gracefully (covers catch-block cancelled branch)', async () => {
        // Exercises the `if (cancelled) { resolve(); return; }` at line 239
        // (inside the catch block). SIGINT fires while a getRun() rejection
        // is propagating — the cancelled flag must take precedence over the
        // transient-retry decision.
        const client = buildClient();
        let reject: ((e: unknown) => void) | undefined;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        client.getRun.mockImplementationOnce(() => {
            return new Promise<Run>((_resolve, rej) => {
                reject = rej;
            });
        });

        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });

        const { ctx } = buildCtx(client);
        const promise = handleRunWatch(ctx);
        await Promise.resolve();
        // Fire SIGINT then reject — catch should see cancelled=true and
        // short-circuit before logging or retrying.
        process.emit('SIGINT');
        reject?.(new TestRailApiError(503, 'Service Unavailable'));
        await vi.advanceTimersByTimeAsync(0);
        await promise;

        // No "transient error" line should have been written — cancelled
        // short-circuited before the retry-log branch.
        expect(stderrWrites.join('')).not.toMatch(/transient error/);
        spyErr.mockRestore();
    });
});

/**
 * Isolated describe block that re-imports the handler with a mocked
 * `errors.ts` where `TestRailApiError` does NOT extend `Error`. This is the
 * only way to exercise the `String(e)` arm of the ternary at line 247:
 *
 *   const msg = e instanceof Error ? e.message : String(e);
 *
 * In the normal module, `isTransientError` requires `e instanceof
 * TestRailApiError`, and `TestRailApiError extends Error`, so the `String(e)`
 * arm is unreachable without this seam.
 */
describe('handleRunWatch – String(e) branch via non-Error transient mock', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handleRunWatchIsolated: (ctx: any) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let MockApiError: new (status: number, statusText: string) => any;

    beforeAll(async () => {
        // Replace the errors module with a version where TestRailApiError is a
        // plain class that does NOT extend Error, so `e instanceof Error` is
        // false at the transient-error log site.
        vi.doMock('../src/errors.js', () => {
            class TestRailApiError {
                public status: number;
                public statusText: string;
                public message: string;
                constructor(status: number, statusText: string) {
                    this.status = status;
                    this.statusText = statusText;
                    this.message = `TestRail API error: ${status} ${statusText}`;
                }
            }
            return { TestRailApiError };
        });
        // Reset so subsequent imports pick up the mock.
        vi.resetModules();
        const errMod = await import('../src/errors.js');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MockApiError = (errMod as any).TestRailApiError as typeof MockApiError;
        const mod = await import('../src/cli/handlers/run-watch.js');
        handleRunWatchIsolated = mod.handleRunWatch;
    });

    afterAll(() => {
        vi.doUnmock('../src/errors.js');
        vi.resetModules();
    });

    it('logs String(e) when transient error is not an Error instance (covers line 247 false branch)', async () => {
        // The MockApiError class does NOT extend Error, so `e instanceof Error`
        // at line 247 evaluates to false → the String(e) arm is reached.
        const getRun = vi.fn();
        getRun.mockRejectedValueOnce(new MockApiError(503, 'Service Unavailable')).mockResolvedValueOnce({
            id: 42,
            suite_id: 1,
            name: 'CI Run',
            include_all: true,
            is_completed: true,
            passed_count: 5,
            blocked_count: 0,
            untested_count: 0,
            retest_count: 0,
            failed_count: 0,
            project_id: 1,
            created_on: 0,
            created_by: 1,
            url: 'https://example.testrail.io/runs/view/42',
        });

        const out = vi.fn();
        const ctx = {
            client: { getRun } as unknown as TestRailClient,
            args: { pathParams: ['42'] },
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out,
        };

        vi.useFakeTimers();
        const stderrWrites: string[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrWrites.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });
        try {
            const promise = handleRunWatchIsolated(ctx);
            await vi.advanceTimersByTimeAsync(30_000);
            await promise;
        } finally {
            spyErr.mockRestore();
            vi.useRealTimers();
        }

        // String(e) for a plain-class instance gives "[object Object]" unless
        // Symbol.toPrimitive / toString is defined. The important thing is
        // that the transient-error line was written to stderr.
        expect(stderrWrites.join('')).toMatch(/transient error for runId=42/);
        // The watcher continued and completed after the transient error.
        const events = out.mock.calls.map((c) => (c[0] as { event: string }).event);
        expect(events).toContain('completed');
    });
});
