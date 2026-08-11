import { TestRailApiError } from './errors.js';

/**
 * Caps applied to a streaming response-body read.
 */
export interface BodyLimits {
    /**
     * Maximum bytes the response body may contribute before the read is
     * aborted. Must be a positive integer.
     */
    maxBytes: number;
    /**
     * Wall-clock deadline in milliseconds for the body read. `0` disables the
     * deadline (cap is byte-count only); positive values arm a `setTimeout`
     * that cancels the reader on expiry. Should never be negative.
     */
    deadlineMs: number;
}

function cancelReaderBestEffort(reader: globalThis.ReadableStreamDefaultReader<Uint8Array>, reason: Error): void {
    try {
        void reader.cancel(reason).catch(() => undefined);
    } catch {
        // A non-conforming stream may throw synchronously. Cancellation is a
        // cleanup attempt and must never replace or delay the caller-visible
        // size/deadline error.
        return;
    }
}

function bodyTimeoutError(deadlineMs: number): TestRailApiError {
    return new TestRailApiError(
        0,
        'Body read timeout',
        `body read exceeded ${deadlineMs}ms before the response body finished streaming`,
    );
}

/**
 * Streams the response body chunk-by-chunk, enforcing both a byte cap and a
 * wall-clock deadline.
 *
 * Closes SEC #12 (`response.json()` / `response.text()` / `response.arrayBuffer()`
 * read until the upstream closes the socket — unbounded heap allocation) and
 * SEC #21 (the request `timeout` was cleared once headers arrived, so a
 * slowloris-on-body server could keep the read pending forever).
 *
 * The function never retries and never inspects status; callers are
 * responsible for status handling. It also does not consume `response` more
 * than once: callers that need both error text and a JSON parse should call
 * this only on the chosen branch.
 *
 * @throws {TestRailApiError} status 0 with `Response body too large` when
 *         `maxBytes` is exceeded, or `Body read timeout` when `deadlineMs`
 *         elapses before the stream closes.
 */
export async function readBodyWithLimits(response: Response, limits: BodyLimits): Promise<Uint8Array> {
    const { maxBytes, deadlineMs } = limits;
    // Some Response-like objects (mocks, polyfills, older runtimes) do not
    // expose a ReadableStream. Fall back to `arrayBuffer()` / `text()` and
    // enforce the byte cap post-read. The fallback promise is still raced
    // against the deadline, although a non-cancellable polyfill may continue
    // reading after the caller receives the timeout.
    const body = response.body as
        | (globalThis.ReadableStream<Uint8Array> & {
              getReader: () => globalThis.ReadableStreamDefaultReader<Uint8Array>;
          })
        | null
        | undefined;
    if (body === null || body === undefined || typeof body.getReader !== 'function') {
        return readBodyViaFallback(response, maxBytes, deadlineMs);
    }

    const reader = body.getReader();
    // Single growable buffer: chunks are written directly into it, so there is
    // never a separate chunk array in memory alongside the assembled output.
    // The buffer doubles in capacity on demand, capped at maxBytes so it never
    // allocates more than the caller-configured ceiling.  Peak memory stays at
    // ≤ maxBytes (one buffer), compared to ≤ 2×maxBytes with the previous
    // chunk-array + final-copy approach.
    let buf = new Uint8Array(Math.min(4096, maxBytes));
    let total = 0;
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let deadline: Promise<never> | undefined;
    const deadlineAt = deadlineMs > 0 ? Date.now() + deadlineMs : undefined;

    const failIfDeadlineReached = (): void => {
        if (!timedOut && (deadlineAt === undefined || Date.now() < deadlineAt)) return;
        if (!timedOut) {
            timedOut = true;
            cancelReaderBestEffort(reader, new Error(`body read exceeded ${deadlineMs}ms`));
        }
        throw bodyTimeoutError(deadlineMs);
    };

    if (deadlineMs > 0) {
        deadline = new Promise<never>((_resolve, reject) => {
            timeoutId = setTimeout(() => {
                if (!timedOut) {
                    timedOut = true;
                    // Cancellation is resource cleanup only. Reject
                    // independently so a non-conforming reader whose read()
                    // and cancel() both remain pending cannot defeat the
                    // wall-clock bound.
                    cancelReaderBestEffort(reader, new Error(`body read exceeded ${deadlineMs}ms`));
                }
                reject(bodyTimeoutError(deadlineMs));
            }, deadlineMs);
            // Deliberately keep this timer referenced. It is the only handle
            // capable of settling the caller-visible Promise when both read()
            // and cancel() never settle; unref() would let a standalone Node
            // process exit before an awaited timeout can reject.
        });
    }

    // Sequential async recursion instead of a `while (await reader.read())`
    // loop. The streaming read is inherently sequential (each chunk depends on
    // the prior `read()` settling) so it cannot be parallelised; expressing it
    // as a self-tail-calling async function keeps that intent explicit and
    // avoids an `await` inside a loop body. Each `await` yields to the
    // microtask queue rather than nesting a synchronous frame, so the recursion
    // is stack-safe for an unbounded chunk count. The manual `reader.read()` +
    // `reader.cancel()` pair is load-bearing for SEC #21: `reader.cancel()`
    // settles the in-flight `read()` with `{ done: true }`, which a `for await`
    // over the stream cannot do (cancelling the stream does not interrupt the
    // iterator's pending `next()`), so a slowloris-on-body server would hang
    // the read forever under `for await`.
    const drain = async (): Promise<void> => {
        const { done, value } = await reader.read();
        // A chain of already-resolved read() promises can monopolise the
        // microtask queue long enough to starve the timeout callback. Compare
        // the absolute deadline after every read so such a stream cannot
        // finish successfully after the wall-clock bound. Equality is expiry.
        failIfDeadlineReached();
        if (done) {
            return;
        }
        if (value === undefined) {
            return drain();
        }
        const newTotal = total + value.byteLength;
        if (newTotal > maxBytes) {
            // Cancellation may reject, throw, or never settle on a custom
            // stream. Start cleanup without awaiting it so the size bound is
            // still prompt and independent of upstream cancellation quality.
            cancelReaderBestEffort(reader, new Error(`response body exceeded ${maxBytes} bytes`));
            throw new TestRailApiError(
                0,
                'Response body too large',
                `response body exceeded ${maxBytes} bytes before the stream closed`,
            );
        }
        // Grow the buffer if the incoming chunk does not fit.  Double the
        // capacity each time (capped at maxBytes) to amortise allocations.
        // After the copy the previous buffer is GC-eligible.
        failIfDeadlineReached();
        if (newTotal > buf.byteLength) {
            let newCap = buf.byteLength;
            while (newCap < newTotal) {
                newCap = Math.min(newCap * 2, maxBytes);
            }
            const grown = new Uint8Array(newCap);
            grown.set(buf.subarray(0, total));
            buf = grown;
        }
        failIfDeadlineReached();
        buf.set(value, total);
        total = newTotal;
        return drain();
    };

    try {
        const draining = drain();
        await (deadline === undefined ? draining : Promise.race([draining, deadline]));
        // Recheck immediately before accepting terminal success. This also
        // covers time spent assembling the final chunk after its read settled.
        failIfDeadlineReached();
    } finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        // Release the reader lock so the underlying stream is not held open
        // longer than necessary after the read completes or is aborted.
        try {
            reader.releaseLock();
        } catch {
            // Stream may already be in a terminal state (e.g. cancel() in
            // flight); ignore — we cannot recover here.
        }
    }

    // A custom releaseLock() is synchronous and may itself consume time. Do
    // not let that edge case turn an expired read into caller-visible success.
    failIfDeadlineReached();

    // Return a view of exactly the filled bytes.  When the buffer was grown to
    // its exact final size no extra allocation is needed; otherwise a subarray
    // view avoids copying while still exposing only the valid content.
    return buf.subarray(0, total);
}

/**
 * Convenience wrapper that decodes the streamed body as UTF-8 text.
 */
export async function readBodyAsText(response: Response, limits: BodyLimits): Promise<string> {
    const bytes = await readBodyWithLimits(response, limits);
    return new globalThis.TextDecoder().decode(bytes);
}

/**
 * Non-streaming fallback for Response-like objects that don't expose
 * `body.getReader`. Used in tests where fetch is mocked with a plain
 * `{ text, arrayBuffer }` literal. Reads the full body up front, then
 * enforces the byte cap. The deadline bounds what the caller waits for, while
 * an underlying non-cancellable polyfill may continue reading in the
 * background. SEC #12 still trips on an oversized completed payload.
 */
function failIfFallbackDeadlineReached(deadlineAt: number | undefined, deadlineMs: number): void {
    if (deadlineAt !== undefined && Date.now() >= deadlineAt) {
        throw bodyTimeoutError(deadlineMs);
    }
}

async function awaitFallbackBody<T>(
    promise: Promise<T>,
    deadlineAt: number | undefined,
    deadlineMs: number,
): Promise<T> {
    if (deadlineAt === undefined) return promise;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(bodyTimeoutError(deadlineMs)), Math.max(0, deadlineAt - Date.now()));
        // As above, this is an operation deadline rather than a detached
        // cleanup timer. It must remain referenced so an awaited fallback read
        // is guaranteed an opportunity to reject before Node exits.
    });
    try {
        const result = await Promise.race([promise, timeout]);
        // Promise callbacks run before timers. A fallback that resolves via a
        // long microtask chain can therefore cross the deadline before the
        // timeout callback runs; the absolute inclusive check closes that gap.
        failIfFallbackDeadlineReached(deadlineAt, deadlineMs);
        return result;
    } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
}

async function readBodyViaFallback(response: Response, maxBytes: number, deadlineMs: number): Promise<Uint8Array> {
    // One absolute deadline covers the upstream fallback read and all local
    // conversion/accounting work. Starting it before calling the fallback
    // method also covers a non-conforming implementation that does expensive
    // synchronous work before returning its Promise.
    const deadlineAt = deadlineMs > 0 ? Date.now() + deadlineMs : undefined;
    const arrayBufferFn = (response as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
    if (typeof arrayBufferFn === 'function') {
        const ab = await awaitFallbackBody(arrayBufferFn.call(response), deadlineAt, deadlineMs);
        const bytes = new Uint8Array(ab);
        failIfFallbackDeadlineReached(deadlineAt, deadlineMs);
        if (bytes.byteLength > maxBytes) {
            throw new TestRailApiError(0, 'Response body too large', `response body exceeded ${maxBytes} bytes`);
        }
        failIfFallbackDeadlineReached(deadlineAt, deadlineMs);
        return bytes;
    }

    const textFn = (response as { text?: () => Promise<string> }).text;
    if (typeof textFn === 'function') {
        const text = await awaitFallbackBody(textFn.call(response), deadlineAt, deadlineMs);
        const bytes = new globalThis.TextEncoder().encode(text);
        failIfFallbackDeadlineReached(deadlineAt, deadlineMs);
        if (bytes.byteLength > maxBytes) {
            throw new TestRailApiError(0, 'Response body too large', `response body exceeded ${maxBytes} bytes`);
        }
        failIfFallbackDeadlineReached(deadlineAt, deadlineMs);
        return bytes;
    }

    failIfFallbackDeadlineReached(deadlineAt, deadlineMs);
    return new Uint8Array(0);
}
