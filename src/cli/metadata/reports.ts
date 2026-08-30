import {
    handleCrossProjectReportList,
    handleCrossProjectReportRun,
    handleReportList,
    handleReportRun,
} from '../handlers/report.js';
import type { ActionSpec } from './types.js';

/**
 * `report` actions in their original relative order:
 *   [0] list — read
 *   [1] run  — read (executes a report template)
 */
export const reportActions: readonly ActionSpec[] = [
    {
        resource: 'report',
        action: 'list',
        summary: 'List report templates configured for a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_reports/{project_id}',
        isWrite: false,
        handler: handleReportList,
    },
    {
        resource: 'report',
        action: 'run',
        summary: 'Execute a report template and return the generated report URLs',
        pathParams: [{ name: 'report_template_id', description: 'TestRail report template ID' }],
        apiEndpoint: 'GET run_report/{report_template_id}',
        isWrite: false,
        handler: handleReportRun,
    },
    {
        resource: 'report',
        action: 'list-cross-project',
        summary: 'List API-enabled cross-project report templates (Enterprise)',
        pathParams: [],
        apiEndpoint: 'GET get_cross_project_reports',
        isWrite: false,
        handler: handleCrossProjectReportList,
    },
    {
        resource: 'report',
        action: 'run-cross-project',
        summary: 'Execute a cross-project report template (Enterprise)',
        pathParams: [{ name: 'report_template_id', description: 'TestRail cross-project report template ID' }],
        apiEndpoint: 'GET run_cross_project_report/{report_template_id}',
        isWrite: false,
        handler: handleCrossProjectReportRun,
    },
];
