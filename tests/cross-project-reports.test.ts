import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';
import { handleCrossProjectReportList, handleCrossProjectReportRun } from '../src/cli/handlers/report.js';
import { reportActions } from '../src/cli/metadata/reports.js';
import { IdParseError } from '../src/cli/ids.js';
import { CrossProjectReportSchema } from '../src/schemas/reports.js';
import { createClient, mockOk } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const PROJECTS_SUMMARY_REPORT = {
    id: 1,
    name: 'Test Execution Projects Summary %date%',
    description: null,
    project_ids: [],
    include_open_milestones: true,
    include_completed_milestones: true,
    include_open_runs_and_plans: true,
    include_completed_runs_and_plans: true,
    report_timeframe: '90 days',
    included_statuses: 'Passed, Blocked, Untested',
    content_hide_links: false,
    notify_user: true,
    notify_link: false,
    notify_link_recipients: null,
    notify_attachment: false,
    notify_attachment_recipients: 'person1@example.com\r\nperson2@example.com',
    notify_attachment_html_format: false,
    notify_attachment_pdf_format: false,
} as const;

const USER_WORKLOAD_REPORT = {
    id: 2,
    name: 'Test Execution User Workload %date%',
    description: null,
    user_ids: [],
    project_ids: [],
    report_timeframe: '90 days',
    include_open_runs_and_plans: true,
    include_completed_runs_and_plans: true,
    include_elapsed_test_time: true,
    include_estimated_test_time: true,
    sort_by: 'alphabetical',
    content_hide_links: false,
    notify_user: true,
    notify_link: false,
    notify_link_recipients: null,
    notify_attachment: false,
    notify_attachment_recipients: 'person1@example.com\r\nperson2@example.com',
    notify_attachment_html_format: false,
    notify_attachment_pdf_format: false,
} as const;

function buildContext(
    client: TestRailClient,
    pathParams: readonly string[] = [],
): {
    ctx: HandlerContext;
    out: ReturnType<typeof vi.fn>;
} {
    const out = vi.fn();
    return {
        ctx: {
            client,
            actionSpec: { resource: 'report', action: 'get' },
            args: { pathParams },
            pagination: { mode: 'items' },
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out,
        },
        out,
    };
}

describe('TestRail cross-project reports', () => {
    let client: TestRailClient;

    beforeEach(() => {
        mockFetch.mockReset();
        client = createClient();
    });

    afterEach(() => {
        client.destroy();
    });

    it('accepts both documented cross-project report families', () => {
        expect(CrossProjectReportSchema.parse(PROJECTS_SUMMARY_REPORT)).toEqual(PROJECTS_SUMMARY_REPORT);
        expect(CrossProjectReportSchema.parse(USER_WORKLOAD_REPORT)).toEqual(USER_WORKLOAD_REPORT);
    });

    it('accepts the documented list form of included_statuses', () => {
        expect(
            CrossProjectReportSchema.parse({
                ...PROJECTS_SUMMARY_REPORT,
                included_statuses: ['Passed', 'Blocked', 'Untested'],
            }).included_statuses,
        ).toEqual(['Passed', 'Blocked', 'Untested']);
    });

    it('requires the common response fields present in both documented families', () => {
        const withoutProjectIds = Object.fromEntries(
            Object.entries(PROJECTS_SUMMARY_REPORT).filter(([key]) => key !== 'project_ids'),
        );

        expect(() => CrossProjectReportSchema.parse(withoutProjectIds)).toThrow();
    });

    it('lists accessible cross-project templates with no input parameters', async () => {
        mockFetch.mockResolvedValueOnce(mockOk([PROJECTS_SUMMARY_REPORT, USER_WORKLOAD_REPORT]));

        await expect(client.reports.getCrossProjectReports()).resolves.toEqual([
            PROJECTS_SUMMARY_REPORT,
            USER_WORKLOAD_REPORT,
        ]);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/get_cross_project_reports'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('runs a cross-project report and returns all documented URLs', async () => {
        const response = {
            report_url: 'https://example.testrail.io/cross_project_reports/view/383',
            report_html: 'https://example.testrail.io/cross_project_reports/get_html/383',
            report_pdf: 'https://example.testrail.io/cross_project_reports/get_pdf/383',
        };
        mockFetch.mockResolvedValueOnce(mockOk(response));

        await expect(client.reports.runCrossProjectReport(383)).resolves.toEqual(response);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/run_cross_project_report/383'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('validates the report template ID before making a request', async () => {
        await expect(client.reports.runCrossProjectReport(0)).rejects.toThrow(
            'reportTemplateId must be a positive integer',
        );
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('wires the list handler to the cross-project SDK method', async () => {
        mockFetch.mockResolvedValueOnce(mockOk([PROJECTS_SUMMARY_REPORT]));
        const { ctx, out } = buildContext(client);

        await handleCrossProjectReportList(ctx);

        expect(out).toHaveBeenCalledWith([PROJECTS_SUMMARY_REPORT]);
    });

    it('parses the run handler ID and rejects malformed IDs before fetching', async () => {
        const response = {
            report_url: 'https://example.testrail.io/cross_project_reports/view/7',
            report_html: 'https://example.testrail.io/cross_project_reports/get_html/7',
            report_pdf: 'https://example.testrail.io/cross_project_reports/get_pdf/7',
        };
        mockFetch.mockResolvedValueOnce(mockOk(response));
        const valid = buildContext(client, ['7']);

        await handleCrossProjectReportRun(valid.ctx);
        expect(valid.out).toHaveBeenCalledWith(response);

        mockFetch.mockReset();
        const invalid = buildContext(client, ['not-an-id']);
        await expect(handleCrossProjectReportRun(invalid.ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('publishes CLI metadata matching the official endpoints', () => {
        expect(reportActions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    resource: 'report',
                    action: 'list-cross-project',
                    pathParams: [],
                    apiEndpoint: 'GET get_cross_project_reports',
                    isWrite: false,
                }),
                expect.objectContaining({
                    resource: 'report',
                    action: 'run-cross-project',
                    pathParams: [
                        {
                            name: 'report_template_id',
                            description: 'TestRail cross-project report template ID',
                        },
                    ],
                    apiEndpoint: 'GET run_cross_project_report/{report_template_id}',
                    isWrite: false,
                }),
            ]),
        );
    });
});
