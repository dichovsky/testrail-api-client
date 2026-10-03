import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('drains fragmented responses inside a bounded heap', async () => {
    const source = new URL('../src/body-reader.ts', import.meta.url).href;
    const code = `
        const {readBodyWithLimits} = await import(${JSON.stringify(source)});
        let chunks = 0;
        const stream = new ReadableStream({pull(controller) {
            if (chunks++ === 1_000_000) controller.close();
            else controller.enqueue(new Uint8Array([65]));
        }});
        const bytes = await readBodyWithLimits(new Response(stream), {maxBytes: 10 * 1024 * 1024, deadlineMs: 30_000});
        console.log(bytes.byteLength);
    `;
    const { stdout } = await promisify(execFile)(
        process.execPath,
        ['--max-old-space-size=64', '--import', 'tsx', '--input-type=module', '-e', code],
        { timeout: 15_000 },
    );
    expect(stdout.trim()).toBe('1000000');
}, 20_000);
