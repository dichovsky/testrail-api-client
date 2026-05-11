import { TestRailClientCore } from '../client-core.js';
import type { Report, ReportResult } from '../types.js';
import { ReportSchema, ReportResultSchema } from '../schemas.js';

export class ReportModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getReports(projectId: number): Promise<Report[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Report[]>(
            ReportSchema.array(),
            await this.client.request<unknown>('GET', `get_reports/${projectId}`),
        );
    }

    async runReport(reportTemplateId: number): Promise<ReportResult> {
        this.client.validateId(reportTemplateId, 'reportTemplateId');
        return this.client.parse<ReportResult>(
            ReportResultSchema,
            await this.client.request<unknown>('GET', `run_report/${reportTemplateId}`),
        );
    }
}
