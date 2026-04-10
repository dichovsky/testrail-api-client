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
    ResultField,
    CaseField,
    CaseType,
    Template,
    ConfigurationGroup,
    Configuration,
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

        it('should filter by typeId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { typeId: 3 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('type_id=3'),
                expect.anything(),
            );
        });

        it('should filter by priorityId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { priorityId: 2 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('priority_id=2'),
                expect.anything(),
            );
        });

        it('should filter by templateId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { templateId: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('template_id=1'),
                expect.anything(),
            );
        });

        it('should filter by milestoneId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { milestoneId: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('milestone_id=5'),
                expect.anything(),
            );
        });

        it('should filter by createdAfter and createdBefore timestamps', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { createdAfter: 1700000000, createdBefore: 1710000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('created_after=1700000000'),
                expect.anything(),
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('created_before=1710000000'),
                expect.anything(),
            );
        });

        it('should filter by updatedAfter and updatedBefore timestamps', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.getCases(1, { updatedAfter: 1700000000, updatedBefore: 1710000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('updated_after=1700000000'),
                expect.anything(),
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('updated_before=1710000000'),
                expect.anything(),
            );
        });

        it('should reject invalid typeId', async () => {
            await expect(client.getCases(1, { typeId: -1 })).rejects.toThrow('typeId must be a positive integer');
        });

        it('should reject invalid priorityId', async () => {
            await expect(client.getCases(1, { priorityId: 0 })).rejects.toThrow('priorityId must be a positive integer');
        });

        it('should reject invalid templateId', async () => {
            await expect(client.getCases(1, { templateId: 1.5 })).rejects.toThrow('templateId must be a positive integer');
        });

        it('should reject invalid milestoneId', async () => {
            await expect(client.getCases(1, { milestoneId: -5 })).rejects.toThrow('milestoneId must be a positive integer');
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

            const result = await client.getPlans(1, { limit: 10, offset: 5 });
            expect(result).toEqual(mockPlans);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should get plans with only limit', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, { limit: 20 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_plans/1&limit=20'), expect.any(Object));
        });

        it('should not include undefined limit/offset in URL', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('limit');
            expect(url).not.toContain('offset');
        });

        it('should get plans filtered by created_after and created_before', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, { created_after: 1000000, created_before: 2000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&created_after=1000000&created_before=2000000'),
                expect.any(Object),
            );
        });

        it('should get plans filtered by created_by', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, { created_by: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&created_by=1%2C2'),
                expect.any(Object),
            );
        });

        it('should get plans filtered by is_completed', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, { is_completed: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should get plans filtered by milestone_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, { milestone_id: [10, 20] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&milestone_id=10%2C20'),
                expect.any(Object),
            );
        });

        it('should omit empty array filters for getPlans', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.getPlans(1, { created_by: [], milestone_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('milestone_id=');
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

        it('should omit createdBy when empty array is provided', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.getRuns(1, { createdBy: [] });
            const calledUrl = mockFetch.mock.calls[0][0] as string;
            expect(calledUrl).not.toContain('created_by=');
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

        it('should throw validation error for invalid suiteId in getRuns', async () => {
            await expect(client.getRuns(1, { suiteId: 0 })).rejects.toThrow('suiteId must be a positive integer');
        });

        it('should throw validation error for invalid milestoneId in getRuns', async () => {
            await expect(client.getRuns(1, { milestoneId: 0 })).rejects.toThrow(
                'milestoneId must be a positive integer',
            );
        });

        it('should throw validation error for invalid createdBy item in getRuns', async () => {
            await expect(client.getRuns(1, { createdBy: [1, 0] })).rejects.toThrow(
                'createdBy must be a positive integer',
            );
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
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));

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

        it('should get tests filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.getTests(1, { status_id: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_tests/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should get tests with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.getTests(1, { limit: 10, offset: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_tests/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should not include undefined filters in URL for getTests', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.getTests(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id');
            expect(url).not.toContain('limit');
        });

        it('should omit empty status_id filter for getTests', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.getTests(1, { status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id=');
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

        it('should get results filtered by created_after and created_before', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResults(1, { created_after: 1000000, created_before: 2000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&created_after=1000000&created_before=2000000'),
                expect.any(Object),
            );
        });

        it('should get results filtered by created_by', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResults(1, { created_by: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&created_by=1%2C2'),
                expect.any(Object),
            );
        });

        it('should get results filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResults(1, { status_id: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should get results with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResults(1, { limit: 10, offset: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should get results for case filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResultsForCase(1, 2, { status_id: [1] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_case/1/2&status_id=1'),
                expect.any(Object),
            );
        });

        it('should get results for case with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResultsForCase(1, 2, { limit: 5, offset: 10 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_case/1/2&limit=5&offset=10'),
                expect.any(Object),
            );
        });

        it('should get results for run filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResultsForRun(1, { status_id: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_run/1&status_id=1%2C2'),
                expect.any(Object),
            );
        });

        it('should get results for run with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResultsForRun(1, { limit: 20, offset: 0 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_run/1&limit=20&offset=0'),
                expect.any(Object),
            );
        });

        it('should not include undefined filters in URL for getResults', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResults(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id');
            expect(url).not.toContain('created_after');
            expect(url).not.toContain('limit');
        });

        it('should omit empty array filters for getResults', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResults(1, { created_by: [], status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
        });

        it('should omit empty array filters for getResultsForCase', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResultsForCase(1, 2, { created_by: [], status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
        });

        it('should omit empty array filters for getResultsForRun', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.getResultsForRun(1, { created_by: [], status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
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

        it('should get milestones filtered by is_completed', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.getMilestones(1, { is_completed: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_milestones/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should get milestones with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.getMilestones(1, { limit: 10, offset: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_milestones/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should not include undefined filters in URL for getMilestones', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.getMilestones(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('is_completed');
            expect(url).not.toContain('limit');
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
        const mockUser: User = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            is_active: true,
        };

        it('should get user by ID', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockUser));
            const result = await client.getUser(1);
            expect(result).toEqual(mockUser);
        });

        it('should get user by email', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockUser));
            const result = await client.getUserByEmail('test@example.com');
            expect(result).toEqual(mockUser);
        });

        it('should get all users (global endpoint)', async () => {
            const mockUsers: User[] = [mockUser];
            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));
            const result = await client.getUsers();
            expect(result).toEqual(mockUsers);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_users'), expect.anything());
        });

        it('should handle empty users list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const result = await client.getUsers();
            expect(result).toEqual([]);
        });

        it('should get users with pagination params', async () => {
            const mockUsers: User[] = [mockUser];
            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));
            const result = await client.getUsers(10, 20);
            expect(result).toEqual(mockUsers);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_users&limit=10&offset=20'),
                expect.anything(),
            );
        });

        it('should get users scoped to a project', async () => {
            const mockUsers: User[] = [mockUser];
            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));
            const result = await client.getUsers(undefined, undefined, 5);
            expect(result).toEqual(mockUsers);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_users/5'), expect.anything());
        });

        it('should throw for invalid projectId in getUsers', async () => {
            await expect(client.getUsers(undefined, undefined, -1)).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should throw validation error for invalid pagination in getUsers', async () => {
            await expect(client.getUsers(0)).rejects.toThrow('limit must be a positive integer');
        });

        it('should get current user', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockUser));
            const result = await client.getCurrentUser();
            expect(result).toEqual(mockUser);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_current_user'), expect.anything());
        });

        it('should propagate API error from getCurrentUser', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.getCurrentUser()).rejects.toThrow('TestRail API error: 403 Forbidden');
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

    describe('Result Fields', () => {
        const mockResultField: ResultField = {
            id: 1,
            system_name: 'custom_defects',
            label: 'Defects',
            name: 'defects',
            type_id: 1,
            display_order: 1,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
            is_active: true,
            include_all: true,
            template_ids: [],
        };

        it('should get all result fields', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockResultField]));

            const result = await client.getResultFields();
            expect(result).toEqual([mockResultField]);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_result_fields'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('should return an empty array when no result fields exist', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));

            const result = await client.getResultFields();
            expect(result).toEqual([]);
        });

        it('should propagate API error from getResultFields', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.getResultFields()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should include optional description when present', async () => {
            const fieldWithDescription: ResultField = {
                ...mockResultField,
                id: 2,
                description: 'Custom field for tracking defect IDs',
            };

            mockFetch.mockResolvedValueOnce(mockOk([fieldWithDescription]));

            const result = await client.getResultFields();
            expect(result[0]).toHaveProperty('description', 'Custom field for tracking defect IDs');
        });
    });

    describe('Case Fields & Types', () => {
        const mockCaseField: CaseField = {
            id: 1,
            system_name: 'custom_steps',
            label: 'Steps',
            name: 'steps',
            type_id: 7,
            display_order: 1,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
            is_active: true,
            include_all: true,
            template_ids: [],
        };

        it('should get all case fields', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockCaseField]));
            const result = await client.getCaseFields();
            expect(result).toEqual([mockCaseField]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_case_fields'), expect.anything());
        });

        it('should return empty array for case fields', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));
            const result = await client.getCaseFields();
            expect(result).toEqual([]);
        });

        it('should propagate API error from getCaseFields', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.getCaseFields()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should include optional description when present', async () => {
            const fieldWithDescription: CaseField = { ...mockCaseField, description: 'Step-by-step instructions' };
            mockFetch.mockResolvedValueOnce(mockOk([fieldWithDescription]));
            const result = await client.getCaseFields();
            expect(result[0]).toHaveProperty('description', 'Step-by-step instructions');
        });

        const mockCaseType: CaseType = { id: 1, name: 'Functional', is_default: true };

        it('should get all case types', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockCaseType]));
            const result = await client.getCaseTypes();
            expect(result).toEqual([mockCaseType]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_case_types'), expect.anything());
        });

        it('should return empty array for case types', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));
            const result = await client.getCaseTypes();
            expect(result).toEqual([]);
        });

        it('should propagate API error from getCaseTypes', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.getCaseTypes()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Templates', () => {
        const mockTemplate: Template = { id: 1, name: 'Test Case (Steps)', is_default: true };

        it('should get templates for a project', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockTemplate]));
            const result = await client.getTemplates(1);
            expect(result).toEqual([mockTemplate]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_templates/1'), expect.anything());
        });

        it('should return empty array when no templates', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));
            const result = await client.getTemplates(1);
            expect(result).toEqual([]);
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.getTemplates(-1)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should propagate API error from getTemplates', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.getTemplates(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Configurations', () => {
        const mockConfig: Configuration = { id: 10, name: 'Windows 10', group_id: 1 };
        const mockConfigGroup: ConfigurationGroup = {
            id: 1,
            name: 'Operating Systems',
            project_id: 1,
            configs: [mockConfig],
        };

        it('should get configurations for a project', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockConfigGroup]));
            const result = await client.getConfigurations(1);
            expect(result).toEqual([mockConfigGroup]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_configs/1'), expect.anything());
        });

        it('should throw for invalid projectId in getConfigurations', async () => {
            await expect(client.getConfigurations(0)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should propagate API error from getConfigurations', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.getConfigurations(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should add a configuration group', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockConfigGroup));
            const result = await client.addConfigurationGroup(1, { name: 'Operating Systems' });
            expect(result).toEqual(mockConfigGroup);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('add_config_group/1'), expect.anything());
        });

        it('should throw for invalid projectId in addConfigurationGroup', async () => {
            await expect(client.addConfigurationGroup(-1, { name: 'OS' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should update a configuration group', async () => {
            const updated: ConfigurationGroup = { ...mockConfigGroup, name: 'OS Versions' };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.updateConfigurationGroup(1, { name: 'OS Versions' });
            expect(result.name).toBe('OS Versions');
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('update_config_group/1'), expect.anything());
        });

        it('should throw for invalid configGroupId in updateConfigurationGroup', async () => {
            await expect(client.updateConfigurationGroup(0, { name: 'OS' })).rejects.toThrow(
                'configGroupId must be a positive integer',
            );
        });

        it('should delete a configuration group', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteConfigurationGroup(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('delete_config_group/1'), expect.anything());
        });

        it('should throw for invalid configGroupId in deleteConfigurationGroup', async () => {
            await expect(client.deleteConfigurationGroup(-1)).rejects.toThrow(
                'configGroupId must be a positive integer',
            );
        });

        it('should add a configuration', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockConfig));
            const result = await client.addConfiguration(1, { name: 'Windows 10' });
            expect(result).toEqual(mockConfig);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('add_config/1'), expect.anything());
        });

        it('should throw for invalid configGroupId in addConfiguration', async () => {
            await expect(client.addConfiguration(-1, { name: 'Win' })).rejects.toThrow(
                'configGroupId must be a positive integer',
            );
        });

        it('should update a configuration', async () => {
            const updated: Configuration = { ...mockConfig, name: 'Windows 11' };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.updateConfiguration(10, { name: 'Windows 11' });
            expect(result.name).toBe('Windows 11');
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('update_config/10'), expect.anything());
        });

        it('should throw for invalid configId in updateConfiguration', async () => {
            await expect(client.updateConfiguration(0, { name: 'Win' })).rejects.toThrow(
                'configId must be a positive integer',
            );
        });

        it('should delete a configuration', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteConfiguration(10)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('delete_config/10'), expect.anything());
        });

        it('should throw for invalid configId in deleteConfiguration', async () => {
            await expect(client.deleteConfiguration(-5)).rejects.toThrow('configId must be a positive integer');
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

    // ── TASK-024: User Management ─────────────────────────────────────────────

    describe('addUser', () => {
        it('should add a new user', async () => {
            const newUser = { id: 5, email: 'new@example.com', name: 'New User', is_active: true };
            mockFetch.mockResolvedValueOnce(mockOk(newUser));
            const result = await client.addUser({ email: 'new@example.com', name: 'New User' });
            expect(result).toEqual(newUser);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_user'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should add a user with optional fields', async () => {
            const newUser = { id: 6, email: 'role@example.com', name: 'Role User', is_active: true, role_id: 2 };
            mockFetch.mockResolvedValueOnce(mockOk(newUser));
            const result = await client.addUser({
                email: 'role@example.com',
                name: 'Role User',
                is_active: true,
                role_id: 2,
            });
            expect(result).toEqual(newUser);
        });
    });

    describe('updateUser', () => {
        it('should update an existing user', async () => {
            const updated = { id: 1, name: 'Updated Name', email: 'user@example.com', is_active: true };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.updateUser(1, { name: 'Updated Name' });
            expect(result).toEqual(updated);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_user/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid userId', async () => {
            await expect(client.updateUser(0, {})).rejects.toThrow('userId must be a positive integer');
            await expect(client.updateUser(-1, {})).rejects.toThrow('userId must be a positive integer');
        });
    });

    // ── TASK-025: Roles ───────────────────────────────────────────────────────

    describe('getRoles', () => {
        it('should return all roles', async () => {
            const roles = [
                { id: 1, name: 'Admin', is_default: false },
                { id: 2, name: 'Tester', is_default: true },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(roles));
            const result = await client.getRoles();
            expect(result).toEqual(roles);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_roles'), expect.anything());
        });
    });

    // ── TASK-026: Groups ──────────────────────────────────────────────────────

    describe('getGroup', () => {
        it('should return a group by ID', async () => {
            const group = { id: 1, name: 'QA Team', user_ids: [1, 2] };
            mockFetch.mockResolvedValueOnce(mockOk(group));
            const result = await client.getGroup(1);
            expect(result).toEqual(group);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_group/1'), expect.anything());
        });

        it('should throw for invalid groupId', async () => {
            await expect(client.getGroup(0)).rejects.toThrow('groupId must be a positive integer');
        });
    });

    describe('getGroups', () => {
        it('should return all groups', async () => {
            const groups = [
                { id: 1, name: 'QA Team' },
                { id: 2, name: 'Dev Team' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(groups));
            const result = await client.getGroups();
            expect(result).toEqual(groups);
        });
    });

    describe('addGroup', () => {
        it('should create a new group', async () => {
            const group = { id: 3, name: 'New Group', user_ids: [1] };
            mockFetch.mockResolvedValueOnce(mockOk(group));
            const result = await client.addGroup({ name: 'New Group', user_ids: [1] });
            expect(result).toEqual(group);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_group'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    describe('updateGroup', () => {
        it('should update a group', async () => {
            const group = { id: 1, name: 'Renamed Group' };
            mockFetch.mockResolvedValueOnce(mockOk(group));
            const result = await client.updateGroup(1, { name: 'Renamed Group' });
            expect(result).toEqual(group);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_group/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid groupId', async () => {
            await expect(client.updateGroup(0, {})).rejects.toThrow('groupId must be a positive integer');
        });
    });

    describe('deleteGroup', () => {
        it('should delete a group', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteGroup(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_group/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid groupId', async () => {
            await expect(client.deleteGroup(-1)).rejects.toThrow('groupId must be a positive integer');
        });
    });

    // ── TASK-027: Attachments ─────────────────────────────────────────────────

    describe('getAttachmentsForCase', () => {
        it('should return attachments for a case', async () => {
            const attachments = [{ attachment_id: 1, name: 'screenshot.png' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.getAttachmentsForCase(1);
            expect(result).toEqual(attachments);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_attachments_for_case/1'),
                expect.anything(),
            );
        });

        it('should return empty array when no attachments', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: [] }));
            expect(await client.getAttachmentsForCase(1)).toEqual([]);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.getAttachmentsForCase(1)).toEqual([]);
        });

        it('should throw for invalid caseId', async () => {
            await expect(client.getAttachmentsForCase(0)).rejects.toThrow('caseId must be a positive integer');
        });
    });

    describe('getAttachmentsForRun', () => {
        it('should return attachments for a run', async () => {
            const attachments = [{ attachment_id: 2, name: 'log.txt' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.getAttachmentsForRun(1);
            expect(result).toEqual(attachments);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.getAttachmentsForRun(1)).toEqual([]);
        });

        it('should throw for invalid runId', async () => {
            await expect(client.getAttachmentsForRun(0)).rejects.toThrow('runId must be a positive integer');
        });
    });

    describe('getAttachmentsForTest', () => {
        it('should return attachments for a test', async () => {
            const attachments = [{ attachment_id: 3, name: 'evidence.png' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.getAttachmentsForTest(5);
            expect(result).toEqual(attachments);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.getAttachmentsForTest(5)).toEqual([]);
        });

        it('should throw for invalid testId', async () => {
            await expect(client.getAttachmentsForTest(-1)).rejects.toThrow('testId must be a positive integer');
        });
    });

    describe('getAttachmentsForPlan', () => {
        it('should return attachments for a plan', async () => {
            const attachments = [{ attachment_id: 4, name: 'plan-doc.pdf' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.getAttachmentsForPlan(1);
            expect(result).toEqual(attachments);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.getAttachmentsForPlan(1)).toEqual([]);
        });

        it('should throw for invalid planId', async () => {
            await expect(client.getAttachmentsForPlan(0)).rejects.toThrow('planId must be a positive integer');
        });
    });

    describe('getAttachmentsForPlanEntry', () => {
        it('should return attachments for a plan entry', async () => {
            const attachments = [{ attachment_id: 5, name: 'entry.png' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.getAttachmentsForPlanEntry(1, 2);
            expect(result).toEqual(attachments);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_attachments_for_plan_entry/1/2'),
                expect.anything(),
            );
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.getAttachmentsForPlanEntry(1, 2)).toEqual([]);
        });

        it('should throw for invalid planId', async () => {
            await expect(client.getAttachmentsForPlanEntry(0, 1)).rejects.toThrow('planId must be a positive integer');
        });

        it('should throw for invalid entryId', async () => {
            await expect(client.getAttachmentsForPlanEntry(1, 0)).rejects.toThrow('entryId must be a positive integer');
        });
    });

    describe('getAttachment', () => {
        it('should return binary content of an attachment', async () => {
            const buffer = new ArrayBuffer(8);
            const response = new Response(buffer, {
                status: 200,
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            mockFetch.mockResolvedValueOnce(response);
            const result = await client.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
        });

        it('should throw for invalid attachmentId', async () => {
            await expect(client.getAttachment(0)).rejects.toThrow('attachmentId must be a positive integer');
        });
    });

    describe('addAttachmentToCase', () => {
        it('should upload a file to a case', async () => {
            const attachment = { attachment_id: 10, name: 'test.png' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['test content'], { type: 'image/png' });
            const result = await client.addAttachmentToCase(1, blob, 'test.png');
            expect(result).toEqual(attachment);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_attachment_to_case/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid caseId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToCase(0, blob, 'f.txt')).rejects.toThrow(
                'caseId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToResult', () => {
        it('should upload a file to a result', async () => {
            const attachment = { attachment_id: 11, name: 'result.png' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['result data']);
            const result = await client.addAttachmentToResult(1, blob, 'result.png');
            expect(result).toEqual(attachment);
        });

        it('should throw for invalid resultId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToResult(-1, blob, 'f.txt')).rejects.toThrow(
                'resultId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToRun', () => {
        it('should upload a file to a run', async () => {
            const attachment = { attachment_id: 12, name: 'run.log' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['log data']);
            const result = await client.addAttachmentToRun(1, blob, 'run.log');
            expect(result).toEqual(attachment);
        });

        it('should throw for invalid runId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToRun(0, blob, 'f.txt')).rejects.toThrow(
                'runId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToPlan', () => {
        it('should upload a file to a plan', async () => {
            const attachment = { attachment_id: 13, name: 'plan.pdf' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['pdf data']);
            const result = await client.addAttachmentToPlan(1, blob, 'plan.pdf');
            expect(result).toEqual(attachment);
        });

        it('should throw for invalid planId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToPlan(0, blob, 'f.txt')).rejects.toThrow(
                'planId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToPlanEntry', () => {
        it('should upload a file to a plan entry', async () => {
            const attachment = { attachment_id: 14, name: 'entry.png' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['image']);
            const result = await client.addAttachmentToPlanEntry(1, 2, blob, 'entry.png');
            expect(result).toEqual(attachment);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_attachment_to_plan_entry/1/2'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid planId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToPlanEntry(0, 1, blob, 'f.txt')).rejects.toThrow(
                'planId must be a positive integer',
            );
        });

        it('should throw for invalid entryId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.addAttachmentToPlanEntry(1, 0, blob, 'f.txt')).rejects.toThrow(
                'entryId must be a positive integer',
            );
        });
    });

    describe('deleteAttachment', () => {
        it('should delete an attachment', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteAttachment(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_attachment/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid attachmentId', async () => {
            await expect(client.deleteAttachment(0)).rejects.toThrow('attachmentId must be a positive integer');
        });
    });

    // ── TASK-028: Shared Steps ────────────────────────────────────────────────

    describe('getSharedStep', () => {
        it('should return a shared step by ID', async () => {
            const sharedStep = { id: 1, title: 'Login Steps', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(sharedStep));
            const result = await client.getSharedStep(1);
            expect(result).toEqual(sharedStep);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_shared_step/1'), expect.anything());
        });

        it('should throw for invalid sharedStepId', async () => {
            await expect(client.getSharedStep(0)).rejects.toThrow('sharedStepId must be a positive integer');
        });
    });

    describe('getSharedSteps', () => {
        it('should return all shared steps for a project', async () => {
            const sharedSteps = [
                { id: 1, title: 'Login' },
                { id: 2, title: 'Logout' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(sharedSteps));
            const result = await client.getSharedSteps(1);
            expect(result).toEqual(sharedSteps);
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.getSharedSteps(0)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('addSharedStep', () => {
        it('should create a shared step', async () => {
            const sharedStep = { id: 3, title: 'New Shared Step', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(sharedStep));
            const result = await client.addSharedStep(1, { title: 'New Shared Step' });
            expect(result).toEqual(sharedStep);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_shared_step/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.addSharedStep(-1, { title: 'x' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });
    });

    describe('updateSharedStep', () => {
        it('should update a shared step', async () => {
            const updated = { id: 1, title: 'Updated Steps' };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.updateSharedStep(1, { title: 'Updated Steps' });
            expect(result).toEqual(updated);
        });

        it('should throw for invalid sharedStepId', async () => {
            await expect(client.updateSharedStep(0, {})).rejects.toThrow('sharedStepId must be a positive integer');
        });
    });

    describe('deleteSharedStep', () => {
        it('should delete a shared step', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteSharedStep(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_shared_step/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid sharedStepId', async () => {
            await expect(client.deleteSharedStep(-1)).rejects.toThrow('sharedStepId must be a positive integer');
        });
    });

    // ── TASK-029: Variables ───────────────────────────────────────────────────

    describe('getVariables', () => {
        it('should return variables for a project', async () => {
            const variables = [
                { id: 1, name: 'env' },
                { id: 2, name: 'region' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(variables));
            const result = await client.getVariables(1);
            expect(result).toEqual(variables);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_variables/1'), expect.anything());
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.getVariables(0)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('addVariable', () => {
        it('should create a variable', async () => {
            const variable = { id: 3, name: 'platform' };
            mockFetch.mockResolvedValueOnce(mockOk(variable));
            const result = await client.addVariable(1, { name: 'platform' });
            expect(result).toEqual(variable);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_variable/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.addVariable(-1, { name: 'x' })).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('updateVariable', () => {
        it('should update a variable', async () => {
            const variable = { id: 1, name: 'environment' };
            mockFetch.mockResolvedValueOnce(mockOk(variable));
            const result = await client.updateVariable(1, { name: 'environment' });
            expect(result).toEqual(variable);
        });

        it('should throw for invalid variableId', async () => {
            await expect(client.updateVariable(0, {})).rejects.toThrow('variableId must be a positive integer');
        });
    });

    describe('deleteVariable', () => {
        it('should delete a variable', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteVariable(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_variable/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid variableId', async () => {
            await expect(client.deleteVariable(-1)).rejects.toThrow('variableId must be a positive integer');
        });
    });

    // ── TASK-030: Datasets ────────────────────────────────────────────────────

    describe('getDataset', () => {
        it('should return a dataset by ID', async () => {
            const dataset = { id: 1, name: 'Smoke Dataset', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.getDataset(1);
            expect(result).toEqual(dataset);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_dataset/1'), expect.anything());
        });

        it('should throw for invalid datasetId', async () => {
            await expect(client.getDataset(0)).rejects.toThrow('datasetId must be a positive integer');
        });
    });

    describe('getDatasets', () => {
        it('should return all datasets for a project', async () => {
            const datasets = [
                { id: 1, name: 'Smoke' },
                { id: 2, name: 'Regression' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(datasets));
            const result = await client.getDatasets(1);
            expect(result).toEqual(datasets);
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.getDatasets(-1)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('addDataset', () => {
        it('should create a dataset', async () => {
            const dataset = { id: 3, name: 'Performance', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.addDataset(1, { name: 'Performance' });
            expect(result).toEqual(dataset);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_dataset/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.addDataset(0, { name: 'x' })).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('updateDataset', () => {
        it('should update a dataset', async () => {
            const dataset = { id: 1, name: 'Updated Dataset' };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.updateDataset(1, { name: 'Updated Dataset' });
            expect(result).toEqual(dataset);
        });

        it('should throw for invalid datasetId', async () => {
            await expect(client.updateDataset(-1, {})).rejects.toThrow('datasetId must be a positive integer');
        });
    });

    describe('deleteDataset', () => {
        it('should delete a dataset', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.deleteDataset(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_dataset/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid datasetId', async () => {
            await expect(client.deleteDataset(0)).rejects.toThrow('datasetId must be a positive integer');
        });
    });

    // ── TASK-031: Reports ─────────────────────────────────────────────────────

    describe('getReports', () => {
        it('should return reports for a project', async () => {
            const reports = [
                { id: 1, name: 'Test Run Summary', description: 'Summary report' },
                { id: 2, name: 'Milestone Report', is_shared: true },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(reports));
            const result = await client.getReports(1);
            expect(result).toEqual(reports);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_reports/1'), expect.anything());
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.getReports(0)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('runReport', () => {
        it('should run a report and return URLs', async () => {
            const reportResult = {
                report_url: 'https://example.testrail.io/reports/1/html',
                user_report_url: 'https://example.testrail.io/reports/1',
            };
            mockFetch.mockResolvedValueOnce(mockOk(reportResult));
            const result = await client.runReport(1);
            expect(result).toEqual(reportResult);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('run_report/1'), expect.anything());
        });

        it('should throw for invalid reportTemplateId', async () => {
            await expect(client.runReport(-1)).rejects.toThrow('reportTemplateId must be a positive integer');
        });
    });
});
