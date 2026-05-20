import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { sanitizeForTerminal } from '../sanitize.js';
import { TestRailApiError } from '../../errors.js';
import type { Run } from '../../types.js';

/**
 * Default polling interval in seconds for `run watch` when `--interval` is
 * omitted. 30s mirrors the TestRail UI's auto-refresh cadence and leaves
 * plenty of headroom under the default 100 req/60s rate limit even when
 * multiple watchers run in parallel.
 */
export const DEFAULT_WATCH_INTERVAL_S = 30;

/**
 * Floor on `--interval` (seconds). Five seconds at one poll/run still leaves
 * 99% of the default rate budget for other client traffic. Below this we'd
 * start crowding out the same client's own ad-hoc CLI calls under high-volume
 * fleet usage; reject at the CLI boundary instead of relying on the rate
 * limiter to throw mid-watch.
 */
export const MIN_WATCH_INTERVAL_S = 5;

/**
 * Ceiling on `--interval` (seconds). Ten minutes between polls is already
 * outside the "watching CI" use case; beyond this users should script a
 * cron job rather than tie up a process. Rejecting protects against typos
 * (`--interval 36000` meaning "every 10 hours" is almost certainly a
 * `--interval 3600` typo for "every hour" — fail-fast at the boundary).
 */
export const MAX_WATCH_INTERVAL_S = 600;

/**
 * Fields the watcher tracks for diff detection. Deliberately a closed set so
 * mutable server-side timestamps (`completed_on`) and noisy passthrough fields
 * never trigger a "state changed" line. Adding a new field here is an
 * intentional design decision, not an accident.
 */
const WATCHED_FIELDS = [
    'is_completed',
    'untested_count',
    'passed_count',
    'failed_count',
    'retest_count',
    'blocked_count',
] as const;

type WatchedField = (typeof WATCHED_FIELDS)[number];
type Snapshot = Readonly<Pick<Run, WatchedField>>;

function snapshot(run: Run): Snapshot {
    return {
        is_completed: run.is_completed,
        untested_count: run.untested_count,
        passed_count: run.passed_count,
        failed_count: run.failed_count,
        retest_count: run.retest_count,
        blocked_count: run.blocked_count,
    };
}

interface Diff {
    field: WatchedField;
    from: Run[WatchedField];
    to: Run[WatchedField];
}

function diff(prev: Snapshot, next: Snapshot): readonly Diff[] {
    const changes: Diff[] = [];
    for (const field of WATCHED_FIELDS) {
        if (prev[field] !== next[field]) {
            changes.push({ field, from: prev[field], to: next[field] });
        }
    }
    return changes;
}

/**
 * Returns `true` for errors that are safe to log-and-continue (network blip,
 * 5xx, 429 rate-limit). Returns `false` for errors that should abort the
 * watcher (4xx auth/not-found, validation errors, or any non-API error).
 */
function isTransientError(e: unknown): boolean {
    if (!(e instanceof TestRailApiError)) return false;
    const s = e.status;
    // 0 = network error (no HTTP response at all).
    // 429 = rate-limited: back off and retry next interval.
    // 5xx = server error: transient upstream issue.
    return s === 0 || s === 429 || s >= 500;
}

/**
 * Parse and validate `--interval <seconds>`. Returns the validated integer or
 * throws an Error so `main()` exits 1 with a clear message. Same regex-strict
 * semantics as `parseId` — silently coerced inputs like `'1e2'` or `'  30  '`
 * are rejected.
 */
function parseInterval(raw: string | undefined): number {
    if (raw === undefined) return DEFAULT_WATCH_INTERVAL_S;
    if (!/^[1-9]\d*$/.test(raw)) {
        throw new Error(`--interval must be a positive integer (got: ${raw})`);
    }
    const n = Number(raw);
    if (n < MIN_WATCH_INTERVAL_S || n > MAX_WATCH_INTERVAL_S) {
        throw new Error(
            `--interval must be between ${MIN_WATCH_INTERVAL_S} and ${MAX_WATCH_INTERVAL_S} seconds (got: ${n})`,
        );
    }
    return n;
}

/**
 * `run watch <run_id>` — long-running CLI command that polls `get_run/{run_id}`
 * on a fixed interval (default 30s; configurable via `--interval`) and emits
 * change events whenever one of the {@link WATCHED_FIELDS} differs between
 * polls. Exits cleanly with code 0 when `is_completed` flips
 * to `true` (TestRail emits this on `closeRun` and on the natural "all tests
 * have a final status" transition).
 *
 * Polling uses recursive `setTimeout` (not `setInterval`) so a slow poll
 * cannot stack a queue of pending timers — each next-tick is scheduled only
 * after the previous `getRun()` promise settles. The handler also stays
 * resilient to transient failures: a thrown poll surfaces to stderr but does
 * not abort the watcher; subsequent polls continue on schedule. Only an
 * unrecoverable rejection (e.g. auth lost mid-watch) propagates out and
 * causes `main()` to exit 1.
 *
 * SIGINT cooperates with the client's signal handler: the watcher prepends a
 * listener that writes a one-line status summary to stderr and clears the
 * pending timeout, then the client's own SIGINT handler runs and calls
 * `process.exit(130)`. The prepend ordering is intentional — without it the
 * client's handler would `process.exit()` first and the status line would
 * never reach stderr.
 *
 * `--once` short-circuits the recursion after the first poll, useful for CI
 * scripts that want the diff/render but not a long-running process.
 *
 * Output is routed through the normal CLI formatter: `--format json` emits
 * structured JSON events, while `--format table` renders the same event
 * objects as table rows.
 */
export async function handleRunWatch(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const intervalSeconds = parseInterval(ctx.args.interval);
    const once = ctx.args.once === true;

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'run watch',
            runId,
            intervalSeconds,
            once,
        });
        return;
    }

    let cancelled = false;
    let pendingTimer: ReturnType<typeof setTimeout> | undefined;
    let lastSnapshot: Snapshot | undefined;
    // Captured by the SIGINT handler so it can resolve the deferred promise
    // when the timer is cleared before its next fire. Without this, cancelling
    // mid-wait would leave the awaited promise pending forever (handler never
    // returns → main() never reaches its finally block → client.destroy()
    // never runs → process hangs even after the client's exit handler runs).
    let resolveLoop: (() => void) | undefined;

    const onSignal = (): void => {
        if (cancelled) return;
        cancelled = true;
        if (pendingTimer !== undefined) {
            clearTimeout(pendingTimer);
            pendingTimer = undefined;
        }
        // Sanitize the final summary like every other stderr write — the
        // watcher's own status text is constant, but defense-in-depth keeps
        // the path uniform with `createOutput().err`.
        const lastStr = lastSnapshot !== undefined ? JSON.stringify(lastSnapshot) : '(no successful poll)';
        if (!process.argv.includes('--quiet')) {
            process.stderr.write(
                sanitizeForTerminal(`run watch: interrupted at runId=${runId}; lastSnapshot=${lastStr}\n`),
            );
        }
        // Settle the loop so the handler's `await` returns. The client's
        // SIGINT handler still runs after this (we use prependListener so
        // ours runs first) and calls process.exit(130); without that the
        // process would simply continue running.
        resolveLoop?.();
    };
    // Prepend so we run BEFORE the client's SIGINT handler (which calls
    // process.exit(130) and would otherwise short-circuit our stderr write).
    process.prependListener('SIGINT', onSignal);
    process.prependListener('SIGTERM', onSignal);

    try {
        // Use the watcher's own deferred-promise loop instead of returning
        // from this function before the recursive setTimeout chain settles —
        // otherwise `client.destroy()` runs in the `finally` block of
        // `main()` and tears down the auth credential mid-watch.
        await new Promise<void>((resolve, reject) => {
            resolveLoop = resolve;
            const poll = (): void => {
                if (cancelled) {
                    resolve();
                    return;
                }
                ctx.client
                    .getRun(runId)
                    .then((run) => {
                        if (cancelled) {
                            resolve();
                            return;
                        }
                        const next = snapshot(run);
                        if (lastSnapshot === undefined) {
                            // First poll: emit the initial state so callers
                            // see a baseline before any diffs.
                            ctx.out({ event: 'snapshot', runId, ...next });
                        } else {
                            const changes = diff(lastSnapshot, next);
                            if (changes.length > 0) {
                                ctx.out({ event: 'change', runId, changes, ...next });
                            }
                        }
                        lastSnapshot = next;

                        if (next.is_completed) {
                            ctx.out({ event: 'completed', runId, ...next });
                            resolve();
                            return;
                        }
                        if (once) {
                            resolve();
                            return;
                        }
                        pendingTimer = setTimeout(poll, intervalSeconds * 1000);
                    })
                    .catch((e: unknown) => {
                        if (cancelled) {
                            resolve();
                            return;
                        }
                        if (isTransientError(e)) {
                            // Transient failure (network blip, 5xx, 429): log to
                            // stderr and continue polling on the next interval.
                            if (!process.argv.includes('--quiet')) {
                                const msg = e instanceof Error ? e.message : String(e);
                                process.stderr.write(
                                    sanitizeForTerminal(
                                        `run watch: transient error for runId=${runId}; retrying in ${intervalSeconds}s: ${msg}\n`,
                                    ),
                                );
                            }
                            pendingTimer = setTimeout(poll, intervalSeconds * 1000);
                        } else {
                            // Unrecoverable rejection (auth lost, 404, etc.)
                            // propagates so main() exits 1.
                            reject(e instanceof Error ? e : new Error(String(e)));
                        }
                    });
            };
            poll();
        });
    } finally {
        process.removeListener('SIGINT', onSignal);
        process.removeListener('SIGTERM', onSignal);
    }
}
