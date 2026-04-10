import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailValidationError } from '../src/client.js';
import type {
    Project,
    Suite,
    Section,
    Case,
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
    AddSuitePayload,
    UpdateSuitePayload,
    AddPlanPayload,
    UpdatePlanPayload,
    AddPlanEntryPayload,
    UpdatePlanEntryPayload,
    AddRunPayload,
    UpdateRunPayload,
    AddResultPayload,
    AddResultsForCasesPayload,
    AddMilestonePayload,
    UpdateMilestonePayload,
    GetRunsOptions,
} from '../src/types.js';
import { createClient, mockOk, mockErr, mockEmpty } from './helpers.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TestRailClient', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = createClient();
    });

    describe('constructor', () => {
        it('should create client with correct config', () => {
            expect(client).toBeInstanceOf(TestRailClient);
        });

        it('should remove trailing slash from baseUrl', () => {
            const clientWithSlash = new TestRailClient({
                baseUrl: 'https://example.testrail.io/',
                email: 'test@example.com',
                apiKey: 'test-api-key',
            });
            expect(clientWithSlash).toBeInstanceOf(TestRailClient);
        });
    });

    describe('request handling', () => {
        it('should handle successful GET request', async () => {
            const mockProject: Project = {
                id: 1,
                name: 'Test Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.getProject(1);
            expect(result).toEqual(mockProject);
        });

        it('should handle API error', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', 'Project not found'));

            await expect(client.getProject(999)).rejects.toThrow('TestRail API error: 404 Not Found');
        });

        it('should handle empty response', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            const result = await client.deleteCase(1);
            expect(result).toBeUndefined();
        });

        it('should handle POST request with data', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'Test Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            const payload: AddCasePayload = {
                title: 'Test Case',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.addCase(1, payload);
            expect(result).toEqual(mockCase);
        });
    });

    describe('Projects', () => {
        it('should get project by ID', async () => {
            const mockProject: Project = {
                id: 1,
                name: 'Test Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.getProject(1);
            expect(result).toEqual(mockProject);
        });

        it('should get all projects', async () => {
            const mockProjects: Project[] = [
                { id: 1, name: 'Project 1', suite_mode: 1, url: 'url1' },
                { id: 2, name: 'Project 2', suite_mode: 2, url: 'url2' },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ projects: mockProjects }));

            const result = await client.getProjects();
            expect(result).toEqual(mockProjects);
        });

        it('should handle empty projects list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getProjects();
            expect(result).toEqual([]);
        });
    });

    describe('Suites', () => {
        it('should get suite by ID', async () => {
            const mockSuite: Suite = {
                id: 1,
                name: 'Test Suite',
                project_id: 1,
                url: 'https://example.testrail.io/suites/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSuite));

            const result = await client.getSuite(1);
            expect(result).toEqual(mockSuite);
        });

        it('should get all suites for a project', async () => {
            const mockSuites: Suite[] = [
                { id: 1, name: 'Suite 1', project_id: 1, url: 'url1' },
                { id: 2, name: 'Suite 2', project_id: 1, url: 'url2' },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockSuites));

            const result = await client.getSuites(1);
            expect(result).toEqual(mockSuites);
        });

        it('should add a suite', async () => {
            const mockSuite: Suite = {
                id: 3,
                name: 'Suite 3',
                description: 'Suite description',
                project_id: 1,
                url: 'url3',
            };
            const payload: AddSuitePayload = {
                name: 'Suite 3',
                description: 'Suite description',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSuite));

            const result = await client.addSuite(1, payload);
            expect(result).toEqual(mockSuite);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_suite/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid projectId in addSuite', async () => {
            await expect(client.addSuite(0, { name: 'Suite 1' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should propagate API error from addSuite', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.addSuite(1, { name: 'Suite 1' })).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should update a suite', async () => {
            const mockSuite: Suite = {
                id: 1,
                name: 'Updated Suite',
                description: 'Updated description',
                project_id: 1,
                url: 'url1',
            };
            const payload: UpdateSuitePayload = {
                name: 'Updated Suite',
                description: 'Updated description',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSuite));

            const result = await client.updateSuite(1, payload);
            expect(result).toEqual(mockSuite);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_suite/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid suiteId in updateSuite', async () => {
            await expect(client.updateSuite(0, { name: 'Updated Suite' })).rejects.toThrow(
                'suiteId must be a positive integer',
            );
        });

        it('should propagate API error from updateSuite', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.updateSuite(1, { name: 'Updated Suite' })).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should delete a suite', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            const result = await client.deleteSuite(1);
            expect(result).toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_suite/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid suiteId in deleteSuite', async () => {
            await expect(client.deleteSuite(-1)).rejects.toThrow('suiteId must be a positive integer');
        });

        it('should propagate API error from deleteSuite', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.deleteSuite(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Sections', () => {
        it('should get section by ID', async () => {
            const mockSection: Section = {
                id: 1,
                suite_id: 1,
                name: 'Test Section',
                display_order: 1,
                depth: 0,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSection));

            const result = await client.getSection(1);
            expect(result).toEqual(mockSection);
        });

        it('should get all sections for a project', async () => {
            const mockSections: Section[] = [
                { id: 1, suite_id: 1, name: 'Section 1', display_order: 1, depth: 0 },
                { id: 2, suite_id: 1, name: 'Section 2', display_order: 2, depth: 0 },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ sections: mockSections }));

            const result = await client.getSections(1);
            expect(result).toEqual(mockSections);
        });

        it('should get sections for a project and suite', async () => {
            const mockSections: Section[] = [{ id: 1, suite_id: 1, name: 'Section 1', display_order: 1, depth: 0 }];

            mockFetch.mockResolvedValueOnce(mockOk({ sections: mockSections }));

            const result = await client.getSections(1, { suiteId: 1 });
            expect(result).toEqual(mockSections);
        });

        it('should handle empty sections list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getSections(1);
            expect(result).toEqual([]);
        });
    });

    describe('Cases', () => {
        it('should get case by ID', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'Test Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.getCase(1);
            expect(result).toEqual(mockCase);
        });

        it('should get all cases for a project', async () => {
            const mockCases: Case[] = [
                {
                    id: 1,
                    title: 'Case 1',
                    section_id: 1,
                    created_by: 1,
                    created_on: 1234567890,
                    updated_by: 1,
                    updated_on: 1234567890,
                    suite_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.getCases(1);
            expect(result).toEqual(mockCases);
        });

        it('should get cases with suite filter', async () => {
            const mockCases: Case[] = [];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.getCases(1, { suiteId: 1 });
            expect(result).toEqual(mockCases);
        });

        it('should get cases with suite and section filters', async () => {
            const mockCases: Case[] = [];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.getCases(1, { suiteId: 1, sectionId: 1 });
            expect(result).toEqual(mockCases);
        });

        it('should get cases with only section filter', async () => {
            const mockCases: Case[] = [];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.getCases(1, { sectionId: 1 });
            expect(result).toEqual(mockCases);
        });

        it('should handle empty cases list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getCases(1);
            expect(result).toEqual([]);
        });

        it('should add a new case', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'New Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            const payload: AddCasePayload = {
                title: 'New Case',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.addCase(1, payload);
            expect(result).toEqual(mockCase);
        });

        it('should update a case', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'Updated Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            const payload: UpdateCasePayload = {
                title: 'Updated Case',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.updateCase(1, payload);
            expect(result).toEqual(mockCase);
        });

        it('should delete a case', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.deleteCase(1);
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe('Plans', () => {
        it('should get plan by ID', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'Test Plan',
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

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.getPlan(1);
            expect(result).toEqual(mockPlan);
        });

        it('should get all plans for a project', async () => {
            const mockPlans: Plan[] = [
                {
                    id: 1,
                    name: 'Plan 1',
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
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ plans: mockPlans }));

            const result = await client.getPlans(1);
            expect(result).toEqual(mockPlans);
        });

        it('should handle empty plans list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getPlans(1);
            expect(result).toEqual([]);
        });

        it('should get plans with limit and offset', async () => {
            const mockPlans: Plan[] = [
                {
                    id: 2,
                    name: 'Plan 2',
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
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ plans: mockPlans }));

            const result = await client.getPlans(1, 10, 5);
            expect(result).toEqual(mockPlans);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should get plans with only limit', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, 20);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_plans/1&limit=20'), expect.any(Object));
        });

        it('should not include undefined limit/offset in URL', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('limit');
            expect(url).not.toContain('offset');
        });

        it('should add a new plan', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'New Plan',
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

            const payload: AddPlanPayload = {
                name: 'New Plan',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.addPlan(1, payload);
            expect(result).toEqual(mockPlan);
        });

        it('should close a plan', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'Plan',
                is_completed: true,
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

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.closePlan(1);
            expect(result).toEqual(mockPlan);
        });

        it('should delete a plan', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.deletePlan(1);
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should update a plan', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'Updated Plan',
                description: 'Updated description',
                milestone_id: 2,
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

            const payload: UpdatePlanPayload = {
                name: 'Updated Plan',
                description: 'Updated description',
                milestone_id: 2,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.updatePlan(1, payload);
            expect(result).toEqual(mockPlan);
        });

        it('should throw validation error for invalid planId in updatePlan', async () => {
            await expect(client.updatePlan(-1, { name: 'x' })).rejects.toThrow('planId must be a positive integer');
        });

        it('should propagate API error from updatePlan', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.updatePlan(1, { name: 'x' })).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Plan Entries', () => {
        const mockEntry: PlanEntry = {
            id: 'entry-guid-1',
            suite_id: 2,
            name: 'Entry',
            include_all: true,
            runs: [],
        };

        it('should add a plan entry', async () => {
            const payload: AddPlanEntryPayload = { suite_id: 2 };
            mockFetch.mockResolvedValueOnce(mockOk(mockEntry));

            const result = await client.addPlanEntry(1, payload);
            expect(result).toEqual(mockEntry);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_plan_entry/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid planId in addPlanEntry', async () => {
            await expect(client.addPlanEntry(-1, { suite_id: 2 })).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from addPlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.addPlanEntry(1, { suite_id: 2 })).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should update a plan entry', async () => {
            const payload: UpdatePlanEntryPayload = { name: 'Updated Entry' };
            mockFetch.mockResolvedValueOnce(mockOk(mockEntry));

            const result = await client.updatePlanEntry(1, 'entry-guid-1', payload);
            expect(result).toEqual(mockEntry);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_plan_entry/1/entry-guid-1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid planId in updatePlanEntry', async () => {
            await expect(client.updatePlanEntry(0, 'entry-guid-1', {})).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for empty entryId in updatePlanEntry', async () => {
            await expect(client.updatePlanEntry(1, '', {})).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for whitespace-only entryId in updatePlanEntry', async () => {
            await expect(client.updatePlanEntry(1, '   ', {})).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from updatePlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.updatePlanEntry(1, 'entry-guid-1', {})).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should delete a plan entry', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.deletePlanEntry(1, 'entry-guid-1');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_plan_entry/1/entry-guid-1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid planId in deletePlanEntry', async () => {
            await expect(client.deletePlanEntry(0, 'entry-guid-1')).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for empty entryId in deletePlanEntry', async () => {
            await expect(client.deletePlanEntry(1, '')).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for whitespace-only entryId in deletePlanEntry', async () => {
            await expect(client.deletePlanEntry(1, '   ')).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from deletePlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.deletePlanEntry(1, 'entry-guid-1')).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });
    });

    describe('Runs', () => {
        it('should get run by ID', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Test Run',
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

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.getRun(1);
            expect(result).toEqual(mockRun);
        });

        it('should get all runs for a project', async () => {
            const mockRuns: Run[] = [
                {
                    id: 1,
                    suite_id: 1,
                    name: 'Run 1',
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
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ runs: mockRuns }));

            const result = await client.getRuns(1);
            expect(result).toEqual(mockRuns);
        });

        it('should handle empty runs list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getRuns(1);
            expect(result).toEqual([]);
        });

        it('should pass isCompleted=true filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            const options: GetRunsOptions = { isCompleted: true };
            await client.getRuns(1, options);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('is_completed=1'), expect.anything());
        });

        it('should pass isCompleted=false filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { isCompleted: false });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('is_completed=0'), expect.anything());
        });

        it('should pass milestoneId filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { milestoneId: 5 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('milestone_id=5'), expect.anything());
        });

        it('should pass suiteId filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { suiteId: 3 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('suite_id=3'), expect.anything());
        });

        it('should pass createdAfter and createdBefore filters', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { createdAfter: 1700000000, createdBefore: 1700086400 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(
                    /created_after=1700000000.*created_before=1700086400|created_before=1700086400.*created_after=1700000000/,
                ),
                expect.anything(),
            );
        });

        it('should pass createdBy filter as comma-separated list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { createdBy: [1, 2, 3] });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('created_by=1%2C2%2C3'), expect.anything());
        });

        it('should pass refsFilter filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { refsFilter: 'TR-42' });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('refs_filter=TR-42'), expect.anything());
        });

        it('should pass limit and offset via options', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { limit: 10, offset: 20 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(/limit=10.*offset=20|offset=20.*limit=10/),
                expect.anything(),
            );
        });

        it('should omit undefined filter params from URL', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { suiteId: 2 });
            const calledUrl = mockFetch.mock.calls[0][0] as string;
            expect(calledUrl).not.toContain('is_completed');
            expect(calledUrl).not.toContain('milestone_id');
            expect(calledUrl).not.toContain('created_after');
        });

        it('should throw validation error for invalid projectId in getRuns', async () => {
            await expect(client.getRuns(0)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should throw validation error for invalid limit in getRuns', async () => {
            await expect(client.getRuns(1, { limit: -1 })).rejects.toThrow('limit must be a positive integer');
        });

        it('should add a new run', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'New Run',
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

            const payload: AddRunPayload = {
                name: 'New Run',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.addRun(1, payload);
            expect(result).toEqual(mockRun);
        });

        it('should close a run', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Run',
                include_all: true,
                is_completed: true,
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

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.closeRun(1);
            expect(result).toEqual(mockRun);
        });

        it('should delete a run', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.deleteRun(1);
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should update a run', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Updated Run',
                description: 'Updated description',
                include_all: false,
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

            const payload: UpdateRunPayload = {
                name: 'Updated Run',
                description: 'Updated description',
                include_all: false,
                case_ids: [1, 2, 3],
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.updateRun(1, payload);
            expect(result).toEqual(mockRun);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_run/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw on invalid runId for updateRun', async () => {
            await expect(client.updateRun(0, {})).rejects.toThrow('runId must be a positive integer');
            await expect(client.updateRun(-1, {})).rejects.toThrow('runId must be a positive integer');
            await expect(client.updateRun(1.5, {})).rejects.toThrow('runId must be a positive integer');
        });

        it('should propagate API error from updateRun', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403));

            await expect(client.updateRun(1, { name: 'Run' })).rejects.toThrow();
        });
    });

    describe('Tests', () => {
        it('should get test by ID', async () => {
            const mockTest: Test = {
                id: 1,
                case_id: 1,
                status_id: 1,
                run_id: 1,
                title: 'Test',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockTest));

            const result = await client.getTest(1);
            expect(result).toEqual(mockTest);
        });

        it('should get all tests for a run', async () => {
            const mockTests: Test[] = [
                {
                    id: 1,
                    case_id: 1,
                    status_id: 1,
                    run_id: 1,
                    title: 'Test 1',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ tests: mockTests }));

            const result = await client.getTests(1);
            expect(result).toEqual(mockTests);
        });

        it('should handle empty tests list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getTests(1);
            expect(result).toEqual([]);
        });
    });

    describe('Results', () => {
        it('should get results for a test', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ results: mockResults }));

            const result = await client.getResults(1);
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getResults(1);
            expect(result).toEqual([]);
        });

        it('should get results for a case', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ results: mockResults }));

            const result = await client.getResultsForCase(1, 1);
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results for case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getResultsForCase(1, 1);
            expect(result).toEqual([]);
        });

        it('should get results for a run', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ results: mockResults }));

            const result = await client.getResultsForRun(1);
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results for run', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getResultsForRun(1);
            expect(result).toEqual([]);
        });

        it('should add a result for a test', async () => {
            const mockResult: Result = {
                id: 1,
                test_id: 1,
                status_id: 1,
                comment: 'Test passed',
            };

            const payload: AddResultPayload = {
                status_id: 1,
                comment: 'Test passed',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResult));

            const result = await client.addResult(1, payload);
            expect(result).toEqual(mockResult);
        });

        it('should add a result for a case', async () => {
            const mockResult: Result = {
                id: 1,
                test_id: 1,
                status_id: 1,
            };

            const payload: AddResultPayload = {
                status_id: 1,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResult));

            const result = await client.addResultForCase(1, 1, payload);
            expect(result).toEqual(mockResult);
        });

        it('should add multiple results for cases', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            const payload: AddResultsForCasesPayload = {
                results: [
                    {
                        case_id: 1,
                        status_id: 1,
                    },
                ],
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResults));

            const result = await client.addResultsForCases(1, payload);
            expect(result).toEqual(mockResults);
        });
    });

    describe('Milestones', () => {
        it('should get milestone by ID', async () => {
            const mockMilestone: Milestone = {
                id: 1,
                name: 'Milestone',
                is_completed: false,
                project_id: 1,
                url: 'url',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.getMilestone(1);
            expect(result).toEqual(mockMilestone);
        });

        it('should get all milestones for a project', async () => {
            const mockMilestones: Milestone[] = [
                {
                    id: 1,
                    name: 'Milestone 1',
                    is_completed: false,
                    project_id: 1,
                    url: 'url',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ milestones: mockMilestones }));

            const result = await client.getMilestones(1);
            expect(result).toEqual(mockMilestones);
        });

        it('should handle empty milestones list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getMilestones(1);
            expect(result).toEqual([]);
        });

        it('should add a milestone', async () => {
            const mockMilestone: Milestone = {
                id: 5,
                name: 'v1.0 Release',
                description: 'First stable release',
                is_completed: false,
                project_id: 1,
                url: 'url5',
            };
            const payload: AddMilestonePayload = {
                name: 'v1.0 Release',
                description: 'First stable release',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.addMilestone(1, payload);
            expect(result).toEqual(mockMilestone);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_milestone/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should add a milestone with all optional fields', async () => {
            const mockMilestone: Milestone = {
                id: 6,
                name: 'v2.0 Release',
                description: 'Second release',
                due_on: 1700000000,
                start_on: 1699000000,
                parent_id: 2,
                refs: 'TR-42',
                is_completed: false,
                project_id: 1,
                url: 'url6',
            };
            const payload: AddMilestonePayload = {
                name: 'v2.0 Release',
                description: 'Second release',
                due_on: 1700000000,
                start_on: 1699000000,
                parent_id: 2,
                refs: 'TR-42',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.addMilestone(1, payload);
            expect(result).toEqual(mockMilestone);
        });

        it('should throw validation error for invalid projectId in addMilestone', async () => {
            await expect(client.addMilestone(0, { name: 'v1.0' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should propagate API error from addMilestone', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.addMilestone(1, { name: 'v1.0' })).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should update a milestone', async () => {
            const mockMilestone: Milestone = {
                id: 1,
                name: 'Updated Milestone',
                description: 'Updated description',
                is_completed: true,
                project_id: 1,
                url: 'url1',
            };
            const payload: UpdateMilestonePayload = {
                name: 'Updated Milestone',
                description: 'Updated description',
                is_completed: true,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.updateMilestone(1, payload);
            expect(result).toEqual(mockMilestone);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_milestone/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid milestoneId in updateMilestone', async () => {
            await expect(client.updateMilestone(-1, { name: 'x' })).rejects.toThrow(
                'milestoneId must be a positive integer',
            );
        });

        it('should propagate API error from updateMilestone', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', 'Milestone not found'));

            await expect(client.updateMilestone(1, { name: 'x' })).rejects.toThrow('TestRail API error: 404 Not Found');
        });

        it('should delete a milestone', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await expect(client.deleteMilestone(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_milestone/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid milestoneId in deleteMilestone', async () => {
            await expect(client.deleteMilestone(0)).rejects.toThrow('milestoneId must be a positive integer');
        });

        it('should propagate API error from deleteMilestone', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.deleteMilestone(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Users', () => {
        it('should get user by ID', async () => {
            const mockUser: User = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                is_active: true,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockUser));

            const result = await client.getUser(1);
            expect(result).toEqual(mockUser);
        });

        it('should get user by email', async () => {
            const mockUser: User = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                is_active: true,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockUser));

            const result = await client.getUserByEmail('test@example.com');
            expect(result).toEqual(mockUser);
        });

        it('should get all users', async () => {
            const mockUsers: User[] = [
                {
                    id: 1,
                    name: 'User 1',
                    email: 'user1@example.com',
                    is_active: true,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));

            const result = await client.getUsers();
            expect(result).toEqual(mockUsers);
        });

        it('should handle empty users list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.getUsers();
            expect(result).toEqual([]);
        });
    });

    describe('Statuses', () => {
        it('should get all statuses', async () => {
            const mockStatuses: Status[] = [
                {
                    id: 1,
                    name: 'passed',
                    label: 'Passed',
                    color_dark: 12709313,
                    color_medium: 14250867,
                    color_bright: 15790320,
                    is_system: true,
                    is_untested: false,
                    is_final: true,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockStatuses));

            const result = await client.getStatuses();
            expect(result).toEqual(mockStatuses);
        });
    });

    describe('Priorities', () => {
        it('should get all priorities', async () => {
            const mockPriorities: Priority[] = [
                {
                    id: 1,
                    name: 'Low',
                    short_name: 'low',
                    is_default: false,
                    priority: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockPriorities));

            const result = await client.getPriorities();
            expect(result).toEqual(mockPriorities);
        });
    });
    describe('Security & Validation', () => {
        it('should throw when using HTTP protocol without allowInsecure', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'http://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'key',
                    }),
            ).toThrow('baseUrl must use HTTPS');
        });

        it('should allow HTTP when allowInsecure is true', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'http://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'key',
                        allowInsecure: true,
                        allowPrivateHosts: true,
                    }),
            ).not.toThrow();
        });

        it('should throw error for invalid IDs (negative)', async () => {
            await expect(client.getProject(-1)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should throw error for invalid IDs (zero)', async () => {
            await expect(client.getCase(0)).rejects.toThrow('caseId must be a positive integer');
        });

        it('should throw error for invalid IDs (float)', async () => {
            await expect(client.getRun(1.5)).rejects.toThrow('runId must be a positive integer');
        });

        it('should throw error for invalid IDs (non-number disguised as any)', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
            await expect(client.getSection('1' as any)).rejects.toThrow('sectionId must be a positive integer');
        });
    });

    describe('Pagination', () => {
        it('should pass limit and offset to getProjects', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ projects: [] }));
            await client.getProjects(10, 20);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_projects&limit=10&offset=20'),
                expect.anything(),
            );
        });

        it('should pass limit and offset to getCases', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { limit: 5, offset: 10 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_cases/1&limit=5&offset=10'),
                expect.anything(),
            );
        });

        it('should pass suiteId, limit, and offset to getCases', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { suiteId: 2, limit: 5, offset: 0 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('suite_id=2&limit=5&offset=0'),
                expect.anything(),
            );
        });

        it('should pass limit and offset to getSections', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ sections: [] }));
            await client.getSections(1, { limit: 25, offset: 50 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_sections/1&limit=25&offset=50'),
                expect.anything(),
            );
        });

        it('should throw for invalid limit (negative)', async () => {
            await expect(client.getProjects(-1)).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw for invalid limit (zero)', async () => {
            await expect(client.getProjects(0)).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw for invalid limit (float)', async () => {
            await expect(client.getProjects(1.5)).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw for invalid offset (negative)', async () => {
            await expect(client.getProjects(10, -1)).rejects.toThrow('offset must be a non-negative integer');
        });

        it('should throw for invalid offset (float)', async () => {
            await expect(client.getProjects(10, 0.5)).rejects.toThrow('offset must be a non-negative integer');
        });

        it('should allow offset of zero', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ projects: [] }));
            await expect(client.getProjects(10, 0)).resolves.toEqual([]);
        });
    });
});
