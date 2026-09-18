import { describe, expect, it, vi } from 'vitest';
import { createRequestBudget } from '../src/request-budget.js';
import { TestRailApiError } from '../src/errors.js';

/**
 * A budget takes its clock, so every rule below is asserted directly rather
 * than inferred from `fetch` call counts through a whole client. Before this
 * module the only seam was the fetch boundary, so "does a retry share the
 * deadline?" could only be probed by counting calls and advancing fake timers.
 */
function clockAt(...readings: number[]): () => number {
    const queue = [...readings];
    let last = readings[readings.length - 1] ?? 0;
    return () => {
        const next = queue.shift();
        if (next !== undefined) last = next;
        return last;
    };
}

describe('unbounded budget', () => {
    const budget = createRequestBudget();

    it('reports itself unbounded and never expired', () => {
        expect(budget.bounded).toBe(false);
        expect(budget.expired).toBe(false);
        expect(budget.expiredBy(Number.MAX_SAFE_INTEGER)).toBe(false);
    });

    it('hands back the configured allowance untouched', () => {
        expect(budget.allowanceFor(30_000)).toBe(30_000);
        // 0 means "no configured limit" and stays that way with no deadline to
        // borrow from — the body reader treats it as "byte cap only".
        expect(budget.allowanceFor(0)).toBe(0);
    });

    it('passes a promise straight through', async () => {
        await expect(budget.bound(Promise.resolve('ok'))).resolves.toBe('ok');
    });
});

describe('bounded budget', () => {
    it('clips a configured allowance to what remains, never lengthening it', () => {
        const budget = createRequestBudget({ deadlineAt: 1_000, now: () => 900 });
        expect(budget.bounded).toBe(true);
        expect(budget.allowanceFor(30_000)).toBe(100); // deadline is stricter
        expect(budget.allowanceFor(50)).toBe(50); // caller is stricter
    });

    it('treats a 0 configured allowance as "use whatever is left"', () => {
        const budget = createRequestBudget({ deadlineAt: 1_000, now: () => 700 });
        expect(budget.allowanceFor(0)).toBe(300);
    });

    it('counts a sub-millisecond remainder as time left', () => {
        const budget = createRequestBudget({ deadlineAt: 1_000.4, now: () => 1_000 });
        expect(budget.expired).toBe(false);
        expect(budget.allowanceFor(0)).toBe(1);
    });

    it('raises one 408 once the allowance is gone', () => {
        const budget = createRequestBudget({ deadlineAt: 1_000, now: () => 1_000 });
        expect(budget.expired).toBe(true);
        expect(() => budget.allowanceFor(30_000)).toThrow(TestRailApiError);
        expect(() => budget.allowanceFor(30_000)).toThrow('Aggregate request deadline exceeded');
    });

    it('judges expiry against a caller-supplied instant', () => {
        const budget = createRequestBudget({ deadlineAt: 1_000, now: () => 0 });
        expect(budget.expiredBy(999)).toBe(false);
        expect(budget.expiredBy(1_000)).toBe(true); // the instant IS the deadline
        expect(budget.expiredBy(1_001)).toBe(true);
    });

    // Retries share one budget, so time spent on the first attempt is not
    // refunded to the second. A per-attempt deadline would let N retries take
    // N times the caller's stated limit.
    it('does not refund time to a later phase', () => {
        const now = clockAt(0, 400, 900);
        const budget = createRequestBudget({ deadlineAt: 1_000, now });
        expect(budget.allowanceFor(0)).toBe(1_000);
        expect(budget.allowanceFor(0)).toBe(600);
        expect(budget.allowanceFor(0)).toBe(100);
    });
});

describe('bounding a promise', () => {
    it('resolves when the work wins', async () => {
        const budget = createRequestBudget({ deadlineAt: Date.now() + 10_000 });
        await expect(budget.bound(Promise.resolve('ok'))).resolves.toBe('ok');
    });

    it('rejects with 408 and signals expiry when the budget is already gone', async () => {
        const onExpiry = vi.fn();
        const budget = createRequestBudget({ deadlineAt: 1_000, now: () => 1_000 });

        await expect(budget.bound(new Promise(() => undefined), onExpiry)).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        expect(onExpiry).toHaveBeenCalledOnce();
    });

    // A promise that is already rejecting when the budget is spent must not
    // surface as an unhandled rejection: the budget attaches a handler before
    // it signals expiry.
    it('does not leak an unhandled rejection from the losing work', async () => {
        const unhandled = vi.fn();
        process.on('unhandledRejection', unhandled);
        try {
            const budget = createRequestBudget({ deadlineAt: 1_000, now: () => 1_000 });
            await expect(budget.bound(Promise.reject(new Error('aborted')))).rejects.toMatchObject({ status: 408 });
            await new Promise((resolve) => {
                setTimeout(resolve, 0);
            });
            expect(unhandled).not.toHaveBeenCalled();
        } finally {
            process.off('unhandledRejection', unhandled);
        }
    });

    it('rejects with 408 when the budget runs out mid-flight, and clears its timer', async () => {
        vi.useFakeTimers();
        try {
            const onExpiry = vi.fn();
            const budget = createRequestBudget({ deadlineAt: Date.now() + 50 });
            const pending = budget.bound(new Promise(() => undefined), onExpiry);
            const assertion = expect(pending).rejects.toMatchObject({ status: 408 });

            await vi.advanceTimersByTimeAsync(51);
            await assertion;
            expect(onExpiry).toHaveBeenCalledOnce();
            // The losing timer is cleared, so nothing keeps the loop alive.
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it('clears its timer when the work wins the race', async () => {
        vi.useFakeTimers();
        try {
            const budget = createRequestBudget({ deadlineAt: Date.now() + 10_000 });
            await expect(budget.bound(Promise.resolve('ok'))).resolves.toBe('ok');
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('retry delay', () => {
    it('waits the full delay when the budget allows it', async () => {
        vi.useFakeTimers();
        try {
            const budget = createRequestBudget({ deadlineAt: Date.now() + 10_000 });
            const waited = budget.delay(100);
            await vi.advanceTimersByTimeAsync(100);
            await expect(waited).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    // Backoff must not outlive the caller's deadline: a 10s delay under a 50ms
    // budget should surface the deadline, not sleep through it.
    it('gives up when the budget expires before the delay elapses', async () => {
        vi.useFakeTimers();
        try {
            const budget = createRequestBudget({ deadlineAt: Date.now() + 50 });
            const waited = budget.delay(10_000);
            const assertion = expect(waited).rejects.toMatchObject({ status: 408 });
            await vi.advanceTimersByTimeAsync(51);
            await assertion;
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});
