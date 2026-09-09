import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import { TestRailApiError, TestRailValidationError } from '../src/errors.js';
import { createClient, mockOk } from './helpers.js';

const mockFetch = vi.fn<typeof fetch>();

const FIRST_REPORT = {
    report_url: 'https://example.testrail.io/reports/view/101',
    report_html: 'https://example.testrail.io/reports/get_html/101',
    report_pdf: 'https://example.testrail.io/reports/get_pdf/101',
};
const SECOND_REPORT = {
    report_url: 'https://example.testrail.io/reports/view/102',
    report_html: 'https://example.testrail.io/reports/get_html/102',
    report_pdf: 'https://example.testrail.io/reports/get_pdf/102',
};

describe.each([
    ['runReport', 'run_report'],
    ['runCrossProjectReport', 'run_cross_project_report'],
] as const)('%s execution policy', (method, endpoint) => {
    let client: TestRailClient;

    beforeEach(() => {
        mockFetch.mockReset();
        vi.stubGlobal('fetch', mockFetch);
        client = createClient({ maxRetries: 3 });
    });

    afterEach(() => {
        client.destroy();
        vi.unstubAllGlobals();
    });

    describe.each([true, false])('enableCache: %s', (enableCache) => {
        beforeEach(() => {
            client.destroy();
            client = createClient({ enableCache, maxRetries: 3 });
        });

        it('fetches and returns a distinct execution for sequential calls', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(FIRST_REPORT)).mockResolvedValueOnce(mockOk(SECOND_REPORT));

            await expect(client.reports[method](7)).resolves.toEqual(FIRST_REPORT);
            await expect(client.reports[method](7)).resolves.toEqual(SECOND_REPORT);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            for (const call of [1, 2]) {
                expect(mockFetch).toHaveBeenNthCalledWith(
                    call,
                    `https://example.testrail.io/index.php?/api/v2/${endpoint}/7`,
                    expect.objectContaining({ method: 'GET' }),
                );
            }
        });

        it('fetches concurrent calls separately while the first response is pending', async () => {
            let release: (() => void) | undefined;
            const gate = new Promise<void>((resolve) => {
                release = resolve;
            });
            mockFetch
                .mockImplementationOnce(async () => {
                    await gate;
                    return mockOk(FIRST_REPORT);
                })
                .mockResolvedValueOnce(mockOk(SECOND_REPORT));

            const first = client.reports[method](7);
            const second = client.reports[method](7);
            try {
                await vi.waitFor(() => {
                    expect(mockFetch).toHaveBeenCalledTimes(2);
                });
            } finally {
                release?.();
            }

            await expect(Promise.all([first, second])).resolves.toEqual([FIRST_REPORT, SECOND_REPORT]);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    it('surfaces a network failure without retrying despite maxRetries', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('connection reset')).mockResolvedValueOnce(mockOk(SECOND_REPORT));

        await expect(client.reports[method](7)).rejects.toMatchObject({
            name: TestRailApiError.name,
            status: 0,
            statusText: 'Network error: connection reset',
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it.each([429, 500, 503])('surfaces HTTP %s without retrying despite maxRetries', async (status) => {
        mockFetch
            .mockResolvedValueOnce(
                new Response('Report execution failed', {
                    status,
                    headers: { 'Retry-After': '0' },
                }),
            )
            .mockResolvedValueOnce(mockOk(SECOND_REPORT));

        await expect(client.reports[method](7)).rejects.toMatchObject({
            name: TestRailApiError.name,
            status,
            response: 'Report execution failed',
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('preserves advisory ReportResultSchema mismatch reporting and the raw response', async () => {
        const onSchemaMismatch = vi.fn();
        client.destroy();
        client = createClient({ onSchemaMismatch });
        const response = { report_url: 123, report_html: null, server_extension: 'retained' };
        mockFetch.mockResolvedValueOnce(mockOk(response));

        await expect(client.reports[method](7)).resolves.toEqual(response);

        expect(onSchemaMismatch).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                method: 'GET',
                endpoint: `${endpoint}/7`,
                data: response,
                error: expect.objectContaining({
                    issues: expect.arrayContaining([
                        expect.objectContaining({ code: 'invalid_type', path: ['report_url'] }),
                    ]),
                }),
            }),
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        'rejects invalid report template ID %s before fetching',
        async (id) => {
            await expect(client.reports[method](id)).rejects.toBeInstanceOf(TestRailValidationError);
            expect(mockFetch).not.toHaveBeenCalled();
        },
    );
});
