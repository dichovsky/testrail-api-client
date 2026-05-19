import { TestRailClientCore } from '../client-core.js';
import type { Report, ReportResult } from '../types.js';
import { ReportSchema, ReportResultSchema } from '../schemas.js';

export class ReportModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_reports/{project_id} */
    async getReports(projectId: number): Promise<Report[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Report[]>('GET', `get_reports/${projectId}`, ReportSchema.array());
    }

    /** @testrail GET run_report/{report_template_id} */
    async runReport(reportTemplateId: number): Promise<ReportResult> {
        this.client.validateId(reportTemplateId, 'reportTemplateId');
        return this.client.requestParsed<ReportResult>('GET', `run_report/${reportTemplateId}`, ReportResultSchema);
    }
}
