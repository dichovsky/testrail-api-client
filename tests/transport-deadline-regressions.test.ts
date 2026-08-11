import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { TestRailClient } from '../src/client.js';

const ItemSchema = z.object({ id: z.number() });

describe('transport deadline regressions', () => {
    const clients: TestRailClient[] = [];

    afterEach(() => {
        clients.forEach((client) => client.destroy());
        clients.length = 0;
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('does not consume a rate-limit slot when the aggregate expires before fetch admission', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            enableCache: false,
            rateLimiter: { maxRequests: 1, windowMs: 60_000 },
            fetch,
        });
        clients.push(client);

        // request() establishes deadline 10 at the first reading. Admission
        // work then observes equality with that deadline before fetch starts.
        vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(10);

        await expect(
            client.request({ method: 'GET', endpoint: 'get_expired', bypassCache: true, remainingTimeMs: 10 }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        await expect(client.request<{ id: number }>({ method: 'GET', endpoint: 'get_valid' })).resolves.toEqual({
            id: 1,
        });

        expect(fetch).toHaveBeenCalledOnce();
    });

    it('honors the supplied absolute deadline instead of rebasing the relative budget', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockReturnValue(10);

        await expect(
            client.request({
                method: 'GET',
                endpoint: 'get_expired',
                bypassCache: true,
                deadlineAt: 10,
                remainingTimeMs: 1,
            }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('preserves the collector deadline through a public adapter and its synchronous setup', async () => {
        const fetch = vi.fn();
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(1);

        await expect(client.runs.getAllRuns(1, { createdBy: [1, 2, 3], maxDurationMs: 1 })).rejects.toMatchObject({
            reason: 'max_duration',
            pagesFetched: 0,
            itemsFetched: 0,
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('accepts a clock-step-expanded relative hint when a fixed deadline is present', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockReturnValue(999);

        await expect(
            client.request<{ id: number }>({
                method: 'GET',
                endpoint: 'get_clock_step',
                bypassCache: true,
                deadlineAt: 301_000,
                remainingTimeMs: 300_001,
            }),
        ).resolves.toEqual({ id: 1 });
        expect(fetch).toHaveBeenCalledOnce();
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, 'soon' as unknown as number])(
        'rejects a malformed absolute deadline (%s)',
        async (deadlineAt) => {
            const fetch = vi.fn();
            const client = new TestRailClient({
                baseUrl: 'https://example.test',
                email: 'agent@example.test',
                apiKey: 'key',
                allowPrivateHosts: true,
                fetch,
            });
            clients.push(client);

            await expect(
                client.request({ method: 'GET', endpoint: 'get_x', bypassCache: true, deadlineAt }),
            ).rejects.toThrow('deadlineAt must be a finite number');
            expect(fetch).not.toHaveBeenCalled();
        },
    );

    it.each([0, Number.NaN, 'later' as unknown as number])(
        'rejects a malformed relative hint even when an absolute deadline is present (%s)',
        async (remainingTimeMs) => {
            const fetch = vi.fn();
            const client = new TestRailClient({
                baseUrl: 'https://example.test',
                email: 'agent@example.test',
                apiKey: 'key',
                allowPrivateHosts: true,
                fetch,
            });
            clients.push(client);

            await expect(
                client.request({
                    method: 'GET',
                    endpoint: 'get_x',
                    bypassCache: true,
                    deadlineAt: Date.now() + 100,
                    remainingTimeMs,
                }),
            ).rejects.toThrow('remainingTimeMs must be a positive finite number');
            expect(fetch).not.toHaveBeenCalled();
        },
    );

    it.each([
        { label: 'raw', validated: false },
        { label: 'schema-validated', validated: true },
    ])('applies a $label caller deadline while sharing an ordinary in-flight GET', async ({ validated }) => {
        vi.useFakeTimers();
        const fetch = vi.fn().mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    setTimeout(() => resolve(new Response('{"id":1}', { status: 200 })), 60);
                }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        const schema = validated ? { schema: ItemSchema } : {};

        const ordinary = client.request<{ id: number }>({ method: 'GET', endpoint: 'get_shared', ...schema });
        await vi.advanceTimersByTimeAsync(0);
        expect(fetch).toHaveBeenCalledOnce();

        const bounded = client.request<{ id: number }>({
            method: 'GET',
            endpoint: 'get_shared',
            remainingTimeMs: 10,
            ...schema,
        });
        const boundedAssertion = expect(bounded).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        await vi.advanceTimersByTimeAsync(10);
        await boundedAssertion;
        expect(fetch).toHaveBeenCalledOnce();

        await vi.advanceTimersByTimeAsync(50);
        await expect(ordinary).resolves.toEqual({ id: 1 });
    });

    it.each([
        { label: 'raw', validated: false },
        { label: 'schema-validated', validated: true },
    ])('does not make an ordinary $label caller inherit the initiating caller deadline', async ({ validated }) => {
        vi.useFakeTimers();
        let fetchCall = 0;
        const fetch = vi.fn().mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    fetchCall += 1;
                    const id = fetchCall;
                    setTimeout(() => resolve(new Response(`{"id":${id}}`, { status: 200 })), 60);
                }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        const schema = validated ? { schema: ItemSchema } : {};

        const bounded = client.request<{ id: number }>({
            method: 'GET',
            endpoint: 'get_shared',
            remainingTimeMs: 10,
            ...schema,
        });
        await vi.advanceTimersByTimeAsync(0);
        const ordinary = client.request<{ id: number }>({ method: 'GET', endpoint: 'get_shared', ...schema });
        await vi.advanceTimersByTimeAsync(0);
        expect(fetch).toHaveBeenCalledTimes(2);

        const boundedAssertion = expect(bounded).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        await vi.advanceTimersByTimeAsync(10);
        await boundedAssertion;

        await vi.advanceTimersByTimeAsync(50);
        await expect(ordinary).resolves.toEqual({ id: 2 });
    });

    it('invalidates cached GETs once a successful write response is known', async () => {
        let clock = 0;
        const fetch = vi
            .fn()
            .mockResolvedValueOnce(new Response('{"name":"old"}', { status: 200 }))
            .mockImplementationOnce(() =>
                Promise.resolve().then(() => {
                    clock = 10;
                    return new Response('{"name":"write-result"}', { status: 200 });
                }),
            )
            .mockResolvedValueOnce(new Response('{"name":"fresh"}', { status: 200 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockImplementation(() => clock);

        await expect(client.request<{ name: string }>({ method: 'GET', endpoint: 'get_cached' })).resolves.toEqual({
            name: 'old',
        });
        await expect(
            client.request({
                method: 'POST',
                endpoint: 'add_item',
                body: { kind: 'json', data: { name: 'write' } },
                remainingTimeMs: 10,
            }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        await expect(client.request<{ name: string }>({ method: 'GET', endpoint: 'get_cached' })).resolves.toEqual({
            name: 'fresh',
        });

        expect(fetch).toHaveBeenCalledTimes(3);
    });
});
