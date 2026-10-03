import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

// Node 24's bundled Undici 7 defaults to HTTP/1. Native Undici 8 (Node 26)
// negotiates HTTP/2 by default; test that real public surface without changing
// the process-wide dispatcher or importing an additional dependency.
const nativeHttp2 = Number(process.versions['undici']?.split('.')[0] ?? 0) >= 8;

describe('native HTTP/2 upload lifecycle', () => {
    it.skipIf(!nativeHttp2)(
        'does not adopt another concurrent upload with the same endpoint and method',
        async () => {
            const certPath = fileURLToPath(new URL('./fixtures/pinned-test-cert.pem', import.meta.url));
            const keyPath = fileURLToPath(new URL('./fixtures/pinned-test-key.pem', import.meta.url));
            const clientUrl = new URL('../src/client.ts', import.meta.url).href;
            const code = `
                import assert from 'node:assert/strict';
                import dns from 'node:dns';
                import { syncBuiltinESMExports } from 'node:module';
                import { createSecureServer } from 'node:http2';
                import { readFileSync } from 'node:fs';
                import { once } from 'node:events';
                dns.lookup = (_host, options, callback) => options.all
                    ? callback(null, [{ address: '127.0.0.1', family: 4 }])
                    : callback(null, '127.0.0.1', 4);
                syncBuiltinESMExports();
                const { TestRailClient } = await import(${JSON.stringify(clientUrl)});
                const sessions = new Set();
                let firstStream;
                let secondStream;
                let markFirstStarted;
                let markSecondReady;
                const firstStarted = new Promise(resolve => { markFirstStarted = resolve; });
                const secondReady = new Promise(resolve => { markSecondReady = resolve; });
                let requestCount = 0;
                let secondContents = '';
                const server = createSecureServer({
                    cert: readFileSync(${JSON.stringify(certPath)}),
                    key: readFileSync(${JSON.stringify(keyPath)}),
                });
                server.on('session', session => sessions.add(session));
                server.on('stream', (stream, headers) => {
                    if (headers[':path'] === '/warmup') {
                        stream.respond({ ':status': 200 });
                        stream.end('ready');
                        return;
                    }
                    assert.equal(headers[':method'], 'POST');
                    assert.equal(headers[':path'], '/index.php?/api/v2/add_attachment_to_case/1');
                    stream.on('error', () => {});
                    requestCount += 1;
                    if (requestCount === 1) {
                        firstStream = stream;
                        stream.on('data', () => markFirstStarted());
                    } else {
                        secondStream = stream;
                        stream.on('data', chunk => { secondContents += chunk.toString(); });
                        stream.on('end', () => markSecondReady());
                    }
                });
                server.listen(0, '127.0.0.1');
                await once(server, 'listening');
                const origin = 'https://pinned.invalid:' + server.address().port;
                const nativeStream = Blob.prototype.stream;
                let releaseCancellation;
                let markCancelled;
                const cancellation = new Promise(resolve => { releaseCancellation = resolve; });
                const cancelled = new Promise(resolve => { markCancelled = resolve; });
                Blob.prototype.stream = function () {
                    if (this.size !== 16 * 1024 * 1024) return nativeStream.call(this);
                    let first = true;
                    return new ReadableStream({
                        pull(controller) {
                            if (first) { first = false; controller.enqueue(new Uint8Array(64 * 1024)); }
                        },
                        cancel() { markCancelled(); return cancellation; },
                    });
                };
                const client = new TestRailClient({ baseUrl: origin, email: 'test@example.com', apiKey: 'test', allowPrivateHosts: true });
                try {
                    assert.equal(await (await fetch(origin + '/warmup')).text(), 'ready');
                    const first = client.trackOperation(() => client.attachments.addAttachmentToCase(1, new Blob([new Uint8Array(16 * 1024 * 1024)]), 'first.txt'));
                    const firstResult = first.result.then(value => ({ value }), error => ({ error }));
                    await firstStarted;
                    const second = client.trackOperation(() => client.attachments.addAttachmentToCase(1, new Blob(['second intact contents']), 'second.txt'));
                    const secondResult = second.result.then(value => ({ value }), error => ({ error }));
                    // Both POSTs share an endpoint and connection, but their
                    // native streams must retain separate cleanup owners.
                    firstStream.respond({ ':status': 413 });
                    firstStream.end('{}');
                    assert.equal((await firstResult).error?.status, 413);
                    await cancelled;
                    releaseCancellation();
                    await first.settled;
                    await secondReady;
                    assert.equal(secondStream.destroyed, false);
                    assert.equal(secondStream.session.destroyed, false);
                    assert.equal(sessions.size, 1);
                    assert.ok(secondContents.includes('second intact contents'));
                    secondStream.respond({ ':status': 200 });
                    secondStream.end('{"id":2}');
                    assert.deepEqual(await secondResult, { value: { id: 2 } });
                    await second.settled;
                    console.log('concurrent upload retained its owner');
                } finally {
                    releaseCancellation();
                    client.destroy();
                    for (const session of sessions) session.destroy();
                    server.close();
                }
            `;
            const { stdout } = await promisify(execFile)(
                process.execPath,
                ['--import', 'tsx', '--input-type=module', '-e', code],
                { env: { ...process.env, NODE_EXTRA_CA_CERTS: certPath }, timeout: 10_000 },
            );
            expect(stdout.trim()).toBe('concurrent upload retained its owner');
        },
        15_000,
    );

    it.skipIf(!nativeHttp2).each(['complete', 'early-response'] as const)(
        'settles a %s upload without interrupting a stream on the same connection',
        async (scenario) => {
            const certPath = fileURLToPath(new URL('./fixtures/pinned-test-cert.pem', import.meta.url));
            const keyPath = fileURLToPath(new URL('./fixtures/pinned-test-key.pem', import.meta.url));
            const clientUrl = new URL('../src/client.ts', import.meta.url).href;
            const code = `
                import assert from 'node:assert/strict';
                import dns from 'node:dns';
                import { syncBuiltinESMExports } from 'node:module';
                import { createSecureServer } from 'node:http2';
                import { readFileSync } from 'node:fs';
                import { once } from 'node:events';

                const scenario = ${JSON.stringify(scenario)};
                dns.lookup = (_host, options, callback) => {
                    if (options.all) callback(null, [{ address: '127.0.0.1', family: 4 }]);
                    else callback(null, '127.0.0.1', 4);
                };
                syncBuiltinESMExports();
                const { TestRailClient } = await import(${JSON.stringify(clientUrl)});
                const sessions = new Set();
                let siblingStream;
                let siblingSession;
                let uploadSession;
                let receivedUpload = '';
                let uploadContentType;
                const server = createSecureServer({
                    cert: readFileSync(${JSON.stringify(certPath)}),
                    key: readFileSync(${JSON.stringify(keyPath)}),
                });
                server.on('session', session => sessions.add(session));
                server.on('stream', (stream, headers) => {
                    stream.on('error', () => {});
                    if (headers[':path'] === '/warmup') {
                        stream.respond({ ':status': 200 });
                        stream.end('ready');
                    } else if (headers[':path'] === '/sibling') {
                        siblingStream = stream;
                        siblingSession = stream.session;
                        stream.respond({ ':status': 200 });
                        stream.write('first');
                    } else {
                        uploadSession = stream.session;
                        uploadContentType = headers['content-type'];
                        let responded = false;
                        stream.on('data', chunk => {
                            receivedUpload += chunk.toString();
                            if (scenario === 'early-response' && !responded) {
                                responded = true;
                                stream.respond({ ':status': 413 });
                                stream.end('{}');
                            }
                        });
                        stream.on('end', () => {
                            if (scenario === 'complete') {
                                stream.respond({ ':status': 200 });
                                stream.end('{"id":1}');
                            }
                        });
                    }
                });
                server.listen(0, '127.0.0.1');
                await once(server, 'listening');
                const origin = 'https://pinned.invalid:' + server.address().port;
                let releaseCancellation;
                let cancellationStarted;
                const cancellation = new Promise(resolve => { releaseCancellation = resolve; });
                const cancelled = new Promise(resolve => { cancellationStarted = resolve; });
                const client = new TestRailClient({
                    baseUrl: origin,
                    email: 'test@example.com',
                    apiKey: 'test',
                    allowPrivateHosts: true,
                });
                try {
                    assert.equal(await (await fetch(origin + '/warmup')).text(), 'ready');
                    const sibling = await fetch(origin + '/sibling');
                    const siblingBody = sibling.text().then(
                        value => ({ value }),
                        error => ({ error }),
                    );
                    const contents = 'complete file contents';
                    if (scenario === 'early-response') {
                        Blob.prototype.stream = function () {
                            let first = true;
                            return new ReadableStream({
                                pull(controller) {
                                    if (first) {
                                        first = false;
                                        controller.enqueue(new Uint8Array(64 * 1024));
                                    }
                                },
                                cancel() {
                                    cancellationStarted();
                                    return cancellation;
                                },
                            });
                        };
                    }
                    const file = new Blob([scenario === 'complete' ? contents : new Uint8Array(16 * 1024 * 1024)]);
                    const operation = client.trackOperation(() => client.attachments.addAttachmentToCase(1, file, 'test.txt'));
                    let settled = false;
                    void operation.settled.then(() => { settled = true; });
                    if (scenario === 'early-response') {
                        await assert.rejects(operation.result, { status: 413 });
                        await cancelled;
                        assert.equal(settled, false, 'settlement must await source cancellation');
                        releaseCancellation();
                    } else {
                        assert.deepEqual(await operation.result, { id: 1 });
                        assert.ok(receivedUpload.includes(contents));
                        const boundary = uploadContentType.split('boundary=')[1];
                        assert.ok(receivedUpload.endsWith('--' + boundary + '--\\r\\n'));
                    }
                    await operation.settled;
                    assert.equal(settled, true);
                    assert.equal(uploadSession, siblingSession, 'fixture must multiplex both requests on one session');
                    assert.equal(sessions.size, 1);
                    assert.equal(siblingSession.destroyed, false, 'upload cleanup must preserve the HTTP/2 session');
                    siblingStream.end('last');
                    assert.deepEqual(await siblingBody, { value: 'firstlast' });
                    console.log('upload and sibling completed');
                } finally {
                    releaseCancellation();
                    client.destroy();
                    for (const session of sessions) session.destroy();
                    server.close();
                }
            `;
            const { stdout } = await promisify(execFile)(
                process.execPath,
                ['--import', 'tsx', '--input-type=module', '-e', code],
                { env: { ...process.env, NODE_EXTRA_CA_CERTS: certPath }, timeout: 10_000 },
            );
            expect(stdout.trim()).toBe('upload and sibling completed');
        },
        15_000,
    );
});
