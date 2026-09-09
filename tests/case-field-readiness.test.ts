import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForCaseField, type ReadinessOptions } from '../examples/case-field-readiness.js';
import { TestRailClient } from '../src/client.js';
import { CaseFieldSchema, type AddCaseFieldResponse } from '../src/schemas.js';
import { BASE_CONFIG, mockOk } from './helpers.js';

const field = CaseFieldSchema.parse({
    id: 123,
    system_name: 'custom_case_environment_tier',
    name: 'environment_tier',
    label: 'Environment Tier',
    type_id: 6,
    display_order: 1,
    is_active: true,
    include_all: false,
    template_ids: [1],
    configs: [
        { context: { is_global: false, project_ids: [5] }, options: { is_required: false, items: '1, dev\n2, prod' } },
    ],
});
const created: AddCaseFieldResponse = {
    ...field,
    is_active: 1,
    is_system: 0,
    include_all: 0,
    configs: JSON.stringify(field.configs),
};
const options: ReadinessOptions = {
    timeoutMs: 1000,
    initialDelayMs: 10,
    maxDelayMs: 20,
    maxAttempts: 5,
    verify: (candidate) =>
        candidate.type_id === field.type_id &&
        candidate.name === field.name &&
        candidate.include_all === field.include_all &&
        JSON.stringify(candidate.template_ids) === JSON.stringify(field.template_ids) &&
        JSON.stringify(candidate.configs) === JSON.stringify(field.configs),
};

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('GET-only case-field readiness example', () => {
    it('retains one successful POST while polling fresh inventories and defers dependent writes', async () => {
        vi.useFakeTimers();
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(mockOk(created))
            .mockResolvedValueOnce(mockOk([]))
            .mockResolvedValueOnce(mockOk([]))
            .mockResolvedValueOnce(mockOk([field]));
        const config = { ...BASE_CONFIG, fetch };
        const client = new TestRailClient(config);
        try {
            const posted = await client.metadata.addCaseField({
                type: 'Dropdown',
                name: field.name,
                label: field.label,
                include_all: false,
                template_ids: [1],
                configs: [
                    {
                        context: { is_global: false, project_ids: [5] },
                        options: { is_required: false, items: '1, dev\n2, prod' },
                    },
                ],
            });
            const dependentWrite = vi.fn();
            const result = waitForCaseField(config, posted, options).then((readiness) => {
                if (readiness.state === 'ready') dependentWrite(readiness.field.system_name);
                return readiness;
            });
            await vi.advanceTimersByTimeAsync(29);
            expect(dependentWrite).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);
            expect(await result).toMatchObject({ state: 'ready', created: posted, attempts: 3 });
            expect(dependentWrite).toHaveBeenCalledWith(field.system_name);
            expect(fetch.mock.calls.map(([, init]) => init?.method)).toEqual(['POST', 'GET', 'GET', 'GET']);
            expect(
                fetch.mock.calls.slice(1).every(([url]) => typeof url === 'string' && url.endsWith('/get_case_fields')),
            ).toBe(true);
        } finally {
            client.destroy();
        }
    });

    it('returns immediate readiness and preserves the full creation object', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(mockOk([field]));
        const result = await waitForCaseField({ ...BASE_CONFIG, fetch }, created, options);
        expect(result.state).toBe('ready');
        expect(result.created).toBe(created);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it.each([
        { system_name: 'custom_case_different' },
        { id: 456 },
        { type_id: 1 },
        { include_all: true },
        { template_ids: [2] },
        { configs: [{ ...field.configs[0], context: { is_global: true, project_ids: [] } }] },
        { configs: [{ ...field.configs[0], options: { is_required: false, items: '9, prod' } }] },
    ])('reports conflicting identity or configuration: %j', async (change) => {
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(mockOk([{ ...field, ...change }]));
        const result = await waitForCaseField({ ...BASE_CONFIG, fetch }, created, options);
        expect(result).toMatchObject({ state: 'conflict', created, attempts: 1 });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('rejects duplicate matches instead of adopting the first', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(mockOk([field, field]));
        expect(await waitForCaseField({ ...BASE_CONFIG, fetch }, created, options)).toMatchObject({
            state: 'conflict',
        });
    });

    it('keeps creation pending on persistent absence at the attempt limit', async () => {
        vi.useFakeTimers();
        const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => mockOk([]));
        const result = waitForCaseField({ ...BASE_CONFIG, fetch }, created, options);
        await vi.runAllTimersAsync();
        expect(await result).toMatchObject({ state: 'pending', reason: 'attempt_limit', created, attempts: 5 });
        expect(fetch).toHaveBeenCalledTimes(5);
    });

    it('bounds persistent absence by deadline without another POST', async () => {
        vi.useFakeTimers();
        const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => mockOk([]));
        const result = waitForCaseField({ ...BASE_CONFIG, fetch }, created, { ...options, timeoutMs: 15 });
        await vi.advanceTimersByTimeAsync(15);
        expect(await result).toMatchObject({ state: 'pending', reason: 'deadline', created, attempts: 2 });
        await vi.advanceTimersByTimeAsync(1000);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('cancels backoff and prevents further GETs', async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => mockOk([]));
        const result = waitForCaseField({ ...BASE_CONFIG, fetch }, created, { ...options, signal: controller.signal });
        await vi.advanceTimersByTimeAsync(1);
        controller.abort();
        expect(await result).toMatchObject({ state: 'pending', reason: 'cancelled', created });
        await vi.runAllTimersAsync();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('aborts an in-flight fetch at the deadline even if the injected transport ignores it', async () => {
        vi.useFakeTimers();
        let finish: ((response: Response) => void) | undefined;
        const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                }),
        );
        const result = waitForCaseField({ ...BASE_CONFIG, fetch }, created, options);
        await vi.advanceTimersByTimeAsync(options.timeoutMs);
        expect(await result).toMatchObject({ state: 'pending', reason: 'deadline', created });
        expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        finish?.(mockOk([field]));
        await vi.runAllTimersAsync();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('does not dispatch after a cancelled slow DNS lookup eventually completes', async () => {
        vi.useFakeTimers();
        let finish: ((addresses: { address: string; family: number }[]) => void) | undefined;
        const fetch = vi.fn<typeof globalThis.fetch>();
        const result = waitForCaseField(
            {
                ...BASE_CONFIG,
                allowPrivateHosts: false,
                fetch,
                dnsLookup: () =>
                    new Promise((resolve) => {
                        finish = resolve;
                    }),
            },
            created,
            options,
        );
        await vi.advanceTimersByTimeAsync(options.timeoutMs);
        expect(await result).toMatchObject({ state: 'pending', reason: 'deadline' });
        finish?.([{ address: '203.0.113.1', family: 4 }]);
        await vi.runAllTimersAsync();
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([{}, { case_fields: [] }, [{ ...field, configs: null }]])(
        'does not treat malformed inventories as absence: %j',
        async (inventory) => {
            const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(mockOk(inventory));
            expect(await waitForCaseField({ ...BASE_CONFIG, fetch }, created, options)).toMatchObject({
                state: 'pending',
                reason: 'invalid_inventory',
                created,
            });
        },
    );

    it('stops on read errors without retrying', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('offline'));
        expect(await waitForCaseField({ ...BASE_CONFIG, fetch }, created, options)).toMatchObject({
            state: 'pending',
            reason: 'read_failed',
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it.each([{ baseUrl: 'not-a-url' }, { email: 'not-an-email' }, { timeout: 0 }])(
        'identifies invalid reader configuration without losing the successful creation: %j',
        async (invalidConfig) => {
            vi.useFakeTimers();
            const fetch = vi.fn<typeof globalThis.fetch>();
            const result = await waitForCaseField({ ...BASE_CONFIG, ...invalidConfig, fetch }, created, options);
            expect(result).toEqual({ state: 'pending', reason: 'invalid_config', created, attempts: 0 });
            expect(result.created).toBe(created);
            expect(fetch).not.toHaveBeenCalled();
            expect(vi.getTimerCount()).toBe(0);
        },
    );

    it('retains creation when caller verification throws', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(mockOk([field]));
        expect(
            await waitForCaseField({ ...BASE_CONFIG, fetch }, created, {
                ...options,
                verify: () => {
                    throw new Error('verification failed');
                },
            }),
        ).toMatchObject({ state: 'pending', reason: 'verification_failed', created });
    });

    it('does not accept readiness when synchronous verification runs past the deadline', async () => {
        const now = vi.spyOn(globalThis.performance, 'now').mockReturnValue(0);
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(mockOk([field]));
        const result = await waitForCaseField({ ...BASE_CONFIG, fetch }, created, {
            ...options,
            verify: () => {
                // A busy synchronous verifier delays the timer callback, but
                // elapsed monotonic time must still prevent a ready result.
                now.mockReturnValue(options.timeoutMs + 1);
                return true;
            },
        });
        expect(result).toMatchObject({ state: 'pending', reason: 'deadline', created });
    });

    it.each([null, { ...created, system_name: 123 }])(
        'preserves malformed advisory creation responses: %j',
        async (raw) => {
            const fetch = vi.fn<typeof globalThis.fetch>();
            const result = await waitForCaseField(
                { ...BASE_CONFIG, fetch },
                raw as unknown as AddCaseFieldResponse,
                options,
            );
            expect(result).toMatchObject({ state: 'pending', reason: 'invalid_identity' });
            expect(result.created).toBe(raw);
            expect(fetch).not.toHaveBeenCalled();
        },
    );

    it('handles pre-cancellation and an invalid returned identity without dispatch', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>();
        expect(
            await waitForCaseField({ ...BASE_CONFIG, fetch }, created, { ...options, signal: AbortSignal.abort() }),
        ).toMatchObject({ reason: 'cancelled' });
        expect(await waitForCaseField({ ...BASE_CONFIG, fetch }, { ...created, id: 0 }, options)).toMatchObject({
            reason: 'invalid_identity',
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([{ timeoutMs: 0 }, { maxAttempts: 1.5 }, { initialDelayMs: 30 }])(
        'rejects invalid polling bounds: %j',
        async (bounds) => {
            await expect(waitForCaseField(BASE_CONFIG, created, { ...options, ...bounds })).rejects.toThrow(RangeError);
        },
    );
});
