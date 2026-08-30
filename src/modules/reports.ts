import { TestRailClientCore } from '../client-core.js';
import type { CrossProjectReport, Report, ReportResult } from '../types.js';
import { CrossProjectReportSchema, ReportSchema, ReportResultSchema } from '../schemas.js';
import { validateId } from '../validation.js';

export class ReportModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_reports/{project_id} */
    async getReports(projectId: number): Promise<Report[]> {
        validateId(projectId, 'projectId');
        return this.client.request<Report[]>({
            method: 'GET',
            endpoint: `get_reports/${projectId}`,
            schema: ReportSchema.array(),
        });
    }

    /** @testrail GET run_report/{report_template_id} */
    async runReport(reportTemplateId: number): Promise<ReportResult> {
        validateId(reportTemplateId, 'reportTemplateId');
        return this.client.request<ReportResult>({
            method: 'GET',
            endpoint: `run_report/${reportTemplateId}`,
            schema: ReportResultSchema,
        });
    }

    /**
     * Return every API-enabled Enterprise cross-project report template the
     * authenticated user can access.
     * @testrail GET get_cross_project_reports
     */
    async getCrossProjectReports(): Promise<CrossProjectReport[]> {
        return this.client.request<CrossProjectReport[]>({
            method: 'GET',
            endpoint: 'get_cross_project_reports',
            schema: CrossProjectReportSchema.array(),
        });
    }

    /**
     * Execute an Enterprise cross-project report template.
     * @testrail GET run_cross_project_report/{report_template_id}
     */
    async runCrossProjectReport(reportTemplateId: number): Promise<ReportResult> {
        validateId(reportTemplateId, 'reportTemplateId');
        return this.client.request<ReportResult>({
            method: 'GET',
            endpoint: `run_cross_project_report/${reportTemplateId}`,
            schema: ReportResultSchema,
        });
    }
}
