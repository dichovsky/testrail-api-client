import { describe, it, expect } from 'vitest';
import type {
    TestRailConfig,
    TestRailResponse,
    Case,
    Suite,
    Section,
    Project,
    Plan,
    PlanEntry,
    Run,
    Test,
    Result,
    Milestone,
    User,
    Status,
    Priority,
    AddCasePayload,
    UpdateCasePayload,
    AddPlanPayload,
    AddPlanEntryPayload,
    AddRunPayload,
    AddResultPayload,
    AddResultsForCasesPayload,
    AddResultForCasePayload,
} from '../src/types.js';

describe('Types', () => {
    it('should have TestRailConfig type', () => {
        const config: TestRailConfig = {
            baseUrl: 'https://example.testrail.io',
            email: 'test@example.com',
            apiKey: 'test-key',
        };
        expect(config).toBeDefined();
    });

    it('should have TestRailResponse type', () => {
        const response: TestRailResponse = {
            data: {},
        };
        expect(response).toBeDefined();
    });

    it('should have Case type', () => {
        const testCase: Case = {
            id: 1,
            title: 'Test',
            section_id: 1,
            created_by: 1,
            created_on: 1234567890,
            updated_by: 1,
            updated_on: 1234567890,
            suite_id: 1,
        };
        expect(testCase).toBeDefined();
    });

    it('should have Suite type', () => {
        const suite: Suite = {
            id: 1,
            name: 'Suite',
            project_id: 1,
            url: 'url',
        };
        expect(suite).toBeDefined();
    });

    it('should have Section type', () => {
        const section: Section = {
            id: 1,
            suite_id: 1,
            name: 'Section',
            display_order: 1,
            depth: 0,
        };
        expect(section).toBeDefined();
    });

    it('should have Project type', () => {
        const project: Project = {
            id: 1,
            name: 'Project',
            suite_mode: 1,
            url: 'url',
        };
        expect(project).toBeDefined();
    });

    it('should have Plan type', () => {
        const plan: Plan = {
            id: 1,
            name: 'Plan',
            is_completed: false,
            passed_count: 0,
            blocked_count: 0,
            untested_count: 0,
            retest_count: 0,
            failed_count: 0,
            project_id: 1,
            created_on: 1234567890,
            created_by: 1,
            url: 'url',
        };
        expect(plan).toBeDefined();
    });

    it('should have PlanEntry type', () => {
        const entry: PlanEntry = {
            id: '1',
            suite_id: 1,
            name: 'Entry',
            include_all: true,
            runs: [],
        };
        expect(entry).toBeDefined();
    });

    it('should have Run type', () => {
        const run: Run = {
            id: 1,
            suite_id: 1,
            name: 'Run',
            include_all: true,
            is_completed: false,
            passed_count: 0,
            blocked_count: 0,
            untested_count: 0,
            retest_count: 0,
            failed_count: 0,
            project_id: 1,
            created_on: 1234567890,
            created_by: 1,
            url: 'url',
        };
        expect(run).toBeDefined();
    });

    it('should have Test type', () => {
        const test: Test = {
            id: 1,
            case_id: 1,
            status_id: 1,
            run_id: 1,
            title: 'Test',
        };
        expect(test).toBeDefined();
    });

    it('should have Result type', () => {
        const result: Result = {
            status_id: 1,
        };
        expect(result).toBeDefined();
    });

    it('should have Milestone type', () => {
        const milestone: Milestone = {
            id: 1,
            name: 'Milestone',
            is_completed: false,
            project_id: 1,
            url: 'url',
        };
        expect(milestone).toBeDefined();
    });

    it('should have User type', () => {
        const user: User = {
            id: 1,
            name: 'User',
            email: 'user@example.com',
            is_active: true,
        };
        expect(user).toBeDefined();
    });

    it('should have Status type', () => {
        const status: Status = {
            id: 1,
            name: 'passed',
            label: 'Passed',
            color_dark: 12709313,
            color_medium: 14250867,
            color_bright: 15790320,
            is_system: true,
            is_untested: false,
            is_final: true,
        };
        expect(status).toBeDefined();
    });

    it('should have Priority type', () => {
        const priority: Priority = {
            id: 1,
            name: 'Low',
            short_name: 'low',
            is_default: false,
            priority: 1,
        };
        expect(priority).toBeDefined();
    });

    it('should have AddCasePayload type', () => {
        const payload: AddCasePayload = {
            title: 'New Case',
        };
        expect(payload).toBeDefined();
    });

    it('should have UpdateCasePayload type', () => {
        const payload: UpdateCasePayload = {
            title: 'Updated Case',
        };
        expect(payload).toBeDefined();
    });

    it('should have AddPlanPayload type', () => {
        const payload: AddPlanPayload = {
            name: 'New Plan',
        };
        expect(payload).toBeDefined();
    });

    it('should have AddPlanEntryPayload type', () => {
        const payload: AddPlanEntryPayload = {
            suite_id: 1,
        };
        expect(payload).toBeDefined();
    });

    it('should have AddRunPayload type', () => {
        const payload: AddRunPayload = {
            name: 'New Run',
        };
        expect(payload).toBeDefined();
    });

    it('should have AddResultPayload type', () => {
        const payload: AddResultPayload = {
            status_id: 1,
        };
        expect(payload).toBeDefined();
    });

    it('should have AddResultsForCasesPayload type', () => {
        const payload: AddResultsForCasesPayload = {
            results: [],
        };
        expect(payload).toBeDefined();
    });

    it('should have AddResultForCasePayload type', () => {
        const payload: AddResultForCasePayload = {
            case_id: 1,
            status_id: 1,
        };
        expect(payload).toBeDefined();
    });
});
