import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient } from '../src/client.js';
import type {
  Project,
  Suite,
  Section,
  Case,
  Plan,
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
  AddRunPayload,
  AddResultPayload,
  AddResultsForCasesPayload,
} from '../src/types.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TestRailClient', () => {
  let client: TestRailClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TestRailClient({
      baseUrl: 'https://example.testrail.io',
      email: 'test@example.com',
      apiKey: 'test-api-key',
    });
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockProject),
      } as never);

      const result = await client.getProject(1);
      expect(result).toEqual(mockProject);
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Project not found',
      } as never);

      await expect(client.getProject(999)).rejects.toThrow('TestRail API error: 404 Not Found - Project not found');
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockCase),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockProject),
      } as never);

      const result = await client.getProject(1);
      expect(result).toEqual(mockProject);
    });

    it('should get all projects', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Project 1', suite_mode: 1, url: 'url1' },
        { id: 2, name: 'Project 2', suite_mode: 2, url: 'url2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ projects: mockProjects }),
      } as never);

      const result = await client.getProjects();
      expect(result).toEqual(mockProjects);
    });

    it('should handle empty projects list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockSuite),
      } as never);

      const result = await client.getSuite(1);
      expect(result).toEqual(mockSuite);
    });

    it('should get all suites for a project', async () => {
      const mockSuites: Suite[] = [
        { id: 1, name: 'Suite 1', project_id: 1, url: 'url1' },
        { id: 2, name: 'Suite 2', project_id: 1, url: 'url2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockSuites),
      } as never);

      const result = await client.getSuites(1);
      expect(result).toEqual(mockSuites);
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockSection),
      } as never);

      const result = await client.getSection(1);
      expect(result).toEqual(mockSection);
    });

    it('should get all sections for a project', async () => {
      const mockSections: Section[] = [
        { id: 1, suite_id: 1, name: 'Section 1', display_order: 1, depth: 0 },
        { id: 2, suite_id: 1, name: 'Section 2', display_order: 2, depth: 0 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ sections: mockSections }),
      } as never);

      const result = await client.getSections(1);
      expect(result).toEqual(mockSections);
    });

    it('should get sections for a project and suite', async () => {
      const mockSections: Section[] = [
        { id: 1, suite_id: 1, name: 'Section 1', display_order: 1, depth: 0 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ sections: mockSections }),
      } as never);

      const result = await client.getSections(1, 1);
      expect(result).toEqual(mockSections);
    });

    it('should handle empty sections list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockCase),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ cases: mockCases }),
      } as never);

      const result = await client.getCases(1);
      expect(result).toEqual(mockCases);
    });

    it('should get cases with suite filter', async () => {
      const mockCases: Case[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ cases: mockCases }),
      } as never);

      const result = await client.getCases(1, 1);
      expect(result).toEqual(mockCases);
    });

    it('should get cases with suite and section filters', async () => {
      const mockCases: Case[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ cases: mockCases }),
      } as never);

      const result = await client.getCases(1, 1, 1);
      expect(result).toEqual(mockCases);
    });

    it('should get cases with only section filter', async () => {
      const mockCases: Case[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ cases: mockCases }),
      } as never);

      const result = await client.getCases(1, undefined, 1);
      expect(result).toEqual(mockCases);
    });

    it('should handle empty cases list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockCase),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockCase),
      } as never);

      const result = await client.updateCase(1, payload);
      expect(result).toEqual(mockCase);
    });

    it('should delete a case', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockPlan),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ plans: mockPlans }),
      } as never);

      const result = await client.getPlans(1);
      expect(result).toEqual(mockPlans);
    });

    it('should handle empty plans list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

      const result = await client.getPlans(1);
      expect(result).toEqual([]);
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockPlan),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockPlan),
      } as never);

      const result = await client.closePlan(1);
      expect(result).toEqual(mockPlan);
    });

    it('should delete a plan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as never);

      await client.deletePlan(1);
      expect(mockFetch).toHaveBeenCalled();
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockRun),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ runs: mockRuns }),
      } as never);

      const result = await client.getRuns(1);
      expect(result).toEqual(mockRuns);
    });

    it('should handle empty runs list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

      const result = await client.getRuns(1);
      expect(result).toEqual([]);
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockRun),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockRun),
      } as never);

      const result = await client.closeRun(1);
      expect(result).toEqual(mockRun);
    });

    it('should delete a run', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as never);

      await client.deleteRun(1);
      expect(mockFetch).toHaveBeenCalled();
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockTest),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ tests: mockTests }),
      } as never);

      const result = await client.getTests(1);
      expect(result).toEqual(mockTests);
    });

    it('should handle empty tests list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ results: mockResults }),
      } as never);

      const result = await client.getResults(1);
      expect(result).toEqual(mockResults);
    });

    it('should handle empty results list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ results: mockResults }),
      } as never);

      const result = await client.getResultsForCase(1, 1);
      expect(result).toEqual(mockResults);
    });

    it('should handle empty results for case', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ results: mockResults }),
      } as never);

      const result = await client.getResultsForRun(1);
      expect(result).toEqual(mockResults);
    });

    it('should handle empty results for run', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockResult),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockResult),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockResults),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockMilestone),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ milestones: mockMilestones }),
      } as never);

      const result = await client.getMilestones(1);
      expect(result).toEqual(mockMilestones);
    });

    it('should handle empty milestones list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

      const result = await client.getMilestones(1);
      expect(result).toEqual([]);
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockUser),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockUser),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ users: mockUsers }),
      } as never);

      const result = await client.getUsers();
      expect(result).toEqual(mockUsers);
    });

    it('should handle empty users list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({}),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockStatuses),
      } as never);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockPriorities),
      } as never);

      const result = await client.getPriorities();
      expect(result).toEqual(mockPriorities);
    });
  });
});
