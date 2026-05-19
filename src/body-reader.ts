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
    // enforce the byte cap post-read — the slowloris-on-body protection is
    // lost in this path but the OOM ceiling is still respected.
    const body = response.body as
        | (globalThis.ReadableStream<Uint8Array> & {
              getReader: () => globalThis.ReadableStreamDefaultReader<Uint8Array>;
          })
        | null
        | undefined;
    if (body === null || body === undefined || typeof body.getReader !== 'function') {
        return readBodyViaFallback(response, maxBytes);
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

    if (deadlineMs > 0) {
        timeoutId = setTimeout(() => {
            timedOut = true;
            // reader.cancel() returns a promise; swallow rejection — the read
            // loop observes `timedOut` and throws the user-visible error.
            reader.cancel(new Error(`body read exceeded ${deadlineMs}ms`)).catch(() => undefined);
        }, deadlineMs);
        // Allow the deadline timer to not keep an event loop alive on its own
        // (Node only — browsers don't expose unref). The reader.read() promise
        // already keeps the loop alive while in flight.
        timeoutId.unref?.();
    }

    try {
        while (true) {
            // eslint-disable-next-line no-await-in-loop -- streaming read is sequential by design
            const { done, value } = await reader.read();
            if (timedOut) {
                throw new TestRailApiError(
                    0,
                    'Body read timeout',
                    `body read exceeded ${deadlineMs}ms before the response body finished streaming`,
                );
            }
            if (done) {
                break;
            }
            if (value === undefined) {
                continue;
            }
            const newTotal = total + value.byteLength;
            if (newTotal > maxBytes) {
                // Best-effort cancel; reader.cancel() resolves once the
                // underlying source releases its resources. Swallow rejection.
                // eslint-disable-next-line no-await-in-loop -- single cancel before throwing out of the loop
                await reader.cancel(new Error(`response body exceeded ${maxBytes} bytes`)).catch(() => undefined);
                throw new TestRailApiError(
                    0,
                    'Response body too large',
                    `response body exceeded ${maxBytes} bytes before the stream closed`,
                );
            }
            // Grow the buffer if the incoming chunk does not fit.  Double the
            // capacity each time (capped at maxBytes) to amortise allocations.
            // After the copy the previous buffer is GC-eligible.
            if (newTotal > buf.byteLength) {
                let newCap = buf.byteLength;
                while (newCap < newTotal) {
                    newCap = Math.min(newCap * 2, maxBytes);
                }
                const grown = new Uint8Array(newCap);
                grown.set(buf.subarray(0, total));
                buf = grown;
            }
            buf.set(value, total);
            total = newTotal;
        }
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
 * enforces the byte cap — mid-stream abort is impossible here so the SEC #21
 * slowloris protection is forfeited on this path, but SEC #12 OOM cap
 * still trips on oversized payloads.
 */
async function readBodyViaFallback(response: Response, maxBytes: number): Promise<Uint8Array> {
    const arrayBufferFn = (response as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
    if (typeof arrayBufferFn === 'function') {
        const ab = await arrayBufferFn.call(response);
        const bytes = new Uint8Array(ab);
        if (bytes.byteLength > maxBytes) {
            throw new TestRailApiError(0, 'Response body too large', `response body exceeded ${maxBytes} bytes`);
        }
        return bytes;
    }

    const textFn = (response as { text?: () => Promise<string> }).text;
    if (typeof textFn === 'function') {
        const text = await textFn.call(response);
        const bytes = new globalThis.TextEncoder().encode(text);
        if (bytes.byteLength > maxBytes) {
            throw new TestRailApiError(0, 'Response body too large', `response body exceeded ${maxBytes} bytes`);
        }
        return bytes;
    }

    return new Uint8Array(0);
}
