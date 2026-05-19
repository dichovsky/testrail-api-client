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
 *   - rejection: an unrecoverable getRun() failure propagates so main()
 *     exits 1
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRunWatch } from '../src/cli/handlers/run-watch.js';
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
});
