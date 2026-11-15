import type { RequestBody } from './http-pipeline-types.js';
import type { createPinnedDispatcher } from './pinned-dispatcher.js';
import { createUploadSource } from './upload-source.js';
import { observeUploadTransport } from './upload-transport.js';

type MultipartBody = Extract<RequestBody, { kind: 'multipart' }>;
type PinnedDispatcher = ReturnType<typeof createPinnedDispatcher>;

/** Request facts available after DNS validation, before rate-limit admission. */
export interface MultipartRequest {
    readonly url: string;
    readonly options: RequestInit & { readonly method: string };
    readonly controller: AbortController;
    readonly pinnedDispatcher: PinnedDispatcher | undefined;
    readonly fetch: typeof globalThis.fetch;
}

const OWNER = Symbol('multipart.owner');
type OwnedMultipartBody = MultipartBody & { readonly [OWNER]: UploadLifetime };

/** Owns the source, native transport observations, and every terminal path. */
class UploadLifetime {
    private readonly source: ReturnType<typeof createUploadSource>;
    private closed = false;
    private prepared = false;
    private sent = false;
    private transmission:
        { readonly request: MultipartRequest; readonly cleanup: (transportStopped?: boolean) => void } | undefined;
    private transport: ReturnType<typeof observeUploadTransport> | undefined;

    constructor(body: MultipartBody) {
        this.source = createUploadSource(body.file, body.filename);
    }

    assertOpen(): void {
        if (this.closed) throw new Error('Multipart upload already consumed');
    }

    async prepare(request: MultipartRequest): Promise<() => Promise<Response>> {
        this.assertOpen();
        if (this.prepared) throw new Error('Multipart upload already prepared');
        this.prepared = true;
        const built = await this.source.build();
        this.transmission = { request, cleanup: built.cleanup };
        const options: RequestInit = { ...request.options, body: built.body };

        // Preparation does not admit or send a request. Core checks its deadline
        // and rate limiter immediately before invoking this one-shot capability.
        return (): Promise<Response> => {
            this.assertOpen();
            if (this.sent) throw new Error('Multipart upload already sent');
            this.sent = true;
            this.transport = observeUploadTransport(request.url, request.options.method);
            const fetch = request.fetch;
            return this.transport.run(() => fetch(request.url, options));
        };
    }

    finish(): void {
        if (this.closed) return;
        this.closed = true;
        try {
            if (this.transmission !== undefined) {
                const { request, cleanup } = this.transmission;
                // Abort is only a request. A clean end of a multipart part needs
                // proof that its actual transport stopped, including custom fetch.
                request.controller.abort();
                const stopped =
                    request.pinnedDispatcher?.hasStoppedUploading() === true || this.transport?.stop() === true;
                cleanup(stopped);
            }
        } finally {
            try {
                this.transport?.dispose();
            } finally {
                // Also covers validation, DNS, deadlines, and failed preparation.
                this.source.release();
            }
        }
    }
}

function ownerOf(body: MultipartBody): UploadLifetime | undefined {
    return OWNER in body && body[OWNER] instanceof UploadLifetime ? body[OWNER] : undefined;
}

/**
 * Accept a multipart input before validation and own it through the callback.
 * Nested SDK/request scopes share the marked body and never acquire a second
 * descriptor owner. Only the new body is marked; caller input is untouched.
 */
export async function withMultipartUpload<T>(
    body: MultipartBody,
    callback: (ownedBody: MultipartBody) => Promise<T>,
): Promise<T> {
    const existing = ownerOf(body);
    if (existing !== undefined) {
        existing.assertOpen();
        try {
            return await callback(body);
        } finally {
            existing.finish();
        }
    }

    const owner = new UploadLifetime(body);
    try {
        const ownedBody: OwnedMultipartBody = { ...body, [OWNER]: owner };
        return await callback(ownedBody);
    } finally {
        owner.finish();
    }
}

/** Build once inside the owning scope; return a send capability without I/O yet. */
export function prepareMultipartUpload(
    body: MultipartBody,
    request: MultipartRequest,
): Promise<() => Promise<Response>> {
    const owner = ownerOf(body);
    if (owner === undefined) throw new Error('Multipart upload requires an owning scope');
    return owner.prepare(request);
}
