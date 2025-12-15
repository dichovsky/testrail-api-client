import fetch from 'node-fetch';
import type { Response, RequestInit } from 'node-fetch';
import type {
  TestRailConfig,
  Case,
  Suite,
  Section,
  Project,
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
} from './types.js';

/**
 * TestRail API Client
 * 
 * A TypeScript client for the TestRail API.
 * Supports all major API endpoints for managing projects, suites, cases, runs, plans, and results.
 */
export class TestRailClient {
  private readonly baseUrl: string;
  private readonly auth: string;

  /**
   * Creates a new TestRail API client
   * 
   * @param config - Configuration options for the client
   */
  constructor(config: TestRailConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.auth = Buffer.from(`${config.email}:${config.apiKey}`).toString('base64');
  }

  /**
   * Makes an HTTP request to the TestRail API
   * 
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Optional request body data
   * @returns Promise with the response data
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response: Response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TestRail API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      return {} as T;
    }

    return JSON.parse(responseText) as T;
  }

  // Projects

  /**
   * Get a project by ID
   * 
   * @param projectId - The ID of the project
   * @returns The project
   */
  async getProject(projectId: number): Promise<Project> {
    return this.request<Project>('GET', `get_project/${projectId}`);
  }

  /**
   * Get all projects
   * 
   * @returns Array of projects
   */
  async getProjects(): Promise<Project[]> {
    const response = await this.request<{ projects: Project[] }>('GET', 'get_projects');
    return response.projects || [];
  }

  // Suites

  /**
   * Get a suite by ID
   * 
   * @param suiteId - The ID of the suite
   * @returns The suite
   */
  async getSuite(suiteId: number): Promise<Suite> {
    return this.request<Suite>('GET', `get_suite/${suiteId}`);
  }

  /**
   * Get all suites for a project
   * 
   * @param projectId - The ID of the project
   * @returns Array of suites
   */
  async getSuites(projectId: number): Promise<Suite[]> {
    return this.request<Suite[]>('GET', `get_suites/${projectId}`);
  }

  // Sections

  /**
   * Get a section by ID
   * 
   * @param sectionId - The ID of the section
   * @returns The section
   */
  async getSection(sectionId: number): Promise<Section> {
    return this.request<Section>('GET', `get_section/${sectionId}`);
  }

  /**
   * Get all sections for a project and suite
   * 
   * @param projectId - The ID of the project
   * @param suiteId - The ID of the suite
   * @returns Array of sections
   */
  async getSections(projectId: number, suiteId?: number): Promise<Section[]> {
    const endpoint = suiteId 
      ? `get_sections/${projectId}&suite_id=${suiteId}`
      : `get_sections/${projectId}`;
    const response = await this.request<{ sections: Section[] }>('GET', endpoint);
    return response.sections || [];
  }

  // Cases

  /**
   * Get a case by ID
   * 
   * @param caseId - The ID of the case
   * @returns The case
   */
  async getCase(caseId: number): Promise<Case> {
    return this.request<Case>('GET', `get_case/${caseId}`);
  }

  /**
   * Get all cases for a project and suite
   * 
   * @param projectId - The ID of the project
   * @param suiteId - The ID of the suite
   * @param sectionId - Optional section ID to filter by
   * @returns Array of cases
   */
  async getCases(projectId: number, suiteId?: number, sectionId?: number): Promise<Case[]> {
    let endpoint = `get_cases/${projectId}`;
    const params: string[] = [];
    
    if (suiteId) {
      params.push(`suite_id=${suiteId}`);
    }
    
    if (sectionId) {
      params.push(`section_id=${sectionId}`);
    }
    
    if (params.length > 0) {
      endpoint += `&${params.join('&')}`;
    }
    
    const response = await this.request<{ cases: Case[] }>('GET', endpoint);
    return response.cases || [];
  }

  /**
   * Add a new case
   * 
   * @param sectionId - The ID of the section
   * @param payload - The case data
   * @returns The created case
   */
  async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
    return this.request<Case>('POST', `add_case/${sectionId}`, payload);
  }

  /**
   * Update an existing case
   * 
   * @param caseId - The ID of the case
   * @param payload - The case data to update
   * @returns The updated case
   */
  async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
    return this.request<Case>('POST', `update_case/${caseId}`, payload);
  }

  /**
   * Delete a case
   * 
   * @param caseId - The ID of the case
   */
  async deleteCase(caseId: number): Promise<void> {
    await this.request<void>('POST', `delete_case/${caseId}`);
  }

  // Plans

  /**
   * Get a plan by ID
   * 
   * @param planId - The ID of the plan
   * @returns The plan
   */
  async getPlan(planId: number): Promise<Plan> {
    return this.request<Plan>('GET', `get_plan/${planId}`);
  }

  /**
   * Get all plans for a project
   * 
   * @param projectId - The ID of the project
   * @returns Array of plans
   */
  async getPlans(projectId: number): Promise<Plan[]> {
    const response = await this.request<{ plans: Plan[] }>('GET', `get_plans/${projectId}`);
    return response.plans || [];
  }

  /**
   * Add a new plan
   * 
   * @param projectId - The ID of the project
   * @param payload - The plan data
   * @returns The created plan
   */
  async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
    return this.request<Plan>('POST', `add_plan/${projectId}`, payload);
  }

  /**
   * Close a plan
   * 
   * @param planId - The ID of the plan
   * @returns The closed plan
   */
  async closePlan(planId: number): Promise<Plan> {
    return this.request<Plan>('POST', `close_plan/${planId}`);
  }

  /**
   * Delete a plan
   * 
   * @param planId - The ID of the plan
   */
  async deletePlan(planId: number): Promise<void> {
    await this.request<void>('POST', `delete_plan/${planId}`);
  }

  // Runs

  /**
   * Get a run by ID
   * 
   * @param runId - The ID of the run
   * @returns The run
   */
  async getRun(runId: number): Promise<Run> {
    return this.request<Run>('GET', `get_run/${runId}`);
  }

  /**
   * Get all runs for a project
   * 
   * @param projectId - The ID of the project
   * @returns Array of runs
   */
  async getRuns(projectId: number): Promise<Run[]> {
    const response = await this.request<{ runs: Run[] }>('GET', `get_runs/${projectId}`);
    return response.runs || [];
  }

  /**
   * Add a new run
   * 
   * @param projectId - The ID of the project
   * @param payload - The run data
   * @returns The created run
   */
  async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
    return this.request<Run>('POST', `add_run/${projectId}`, payload);
  }

  /**
   * Close a run
   * 
   * @param runId - The ID of the run
   * @returns The closed run
   */
  async closeRun(runId: number): Promise<Run> {
    return this.request<Run>('POST', `close_run/${runId}`);
  }

  /**
   * Delete a run
   * 
   * @param runId - The ID of the run
   */
  async deleteRun(runId: number): Promise<void> {
    await this.request<void>('POST', `delete_run/${runId}`);
  }

  // Tests

  /**
   * Get a test by ID
   * 
   * @param testId - The ID of the test
   * @returns The test
   */
  async getTest(testId: number): Promise<Test> {
    return this.request<Test>('GET', `get_test/${testId}`);
  }

  /**
   * Get all tests for a run
   * 
   * @param runId - The ID of the run
   * @returns Array of tests
   */
  async getTests(runId: number): Promise<Test[]> {
    const response = await this.request<{ tests: Test[] }>('GET', `get_tests/${runId}`);
    return response.tests || [];
  }

  // Results

  /**
   * Get results for a test
   * 
   * @param testId - The ID of the test
   * @returns Array of results
   */
  async getResults(testId: number): Promise<Result[]> {
    const response = await this.request<{ results: Result[] }>('GET', `get_results/${testId}`);
    return response.results || [];
  }

  /**
   * Get results for a run and case
   * 
   * @param runId - The ID of the run
   * @param caseId - The ID of the case
   * @returns Array of results
   */
  async getResultsForCase(runId: number, caseId: number): Promise<Result[]> {
    const response = await this.request<{ results: Result[] }>(
      'GET',
      `get_results_for_case/${runId}/${caseId}`
    );
    return response.results || [];
  }

  /**
   * Get results for a run
   * 
   * @param runId - The ID of the run
   * @returns Array of results
   */
  async getResultsForRun(runId: number): Promise<Result[]> {
    const response = await this.request<{ results: Result[] }>(
      'GET',
      `get_results_for_run/${runId}`
    );
    return response.results || [];
  }

  /**
   * Add a result for a test
   * 
   * @param testId - The ID of the test
   * @param payload - The result data
   * @returns The created result
   */
  async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
    return this.request<Result>('POST', `add_result/${testId}`, payload);
  }

  /**
   * Add a result for a case in a run
   * 
   * @param runId - The ID of the run
   * @param caseId - The ID of the case
   * @param payload - The result data
   * @returns The created result
   */
  async addResultForCase(
    runId: number,
    caseId: number,
    payload: AddResultPayload
  ): Promise<Result> {
    return this.request<Result>('POST', `add_result_for_case/${runId}/${caseId}`, payload);
  }

  /**
   * Add multiple results for cases in a run
   * 
   * @param runId - The ID of the run
   * @param payload - The results data
   * @returns Array of created results
   */
  async addResultsForCases(
    runId: number,
    payload: AddResultsForCasesPayload
  ): Promise<Result[]> {
    return this.request<Result[]>('POST', `add_results_for_cases/${runId}`, payload);
  }

  // Milestones

  /**
   * Get a milestone by ID
   * 
   * @param milestoneId - The ID of the milestone
   * @returns The milestone
   */
  async getMilestone(milestoneId: number): Promise<Milestone> {
    return this.request<Milestone>('GET', `get_milestone/${milestoneId}`);
  }

  /**
   * Get all milestones for a project
   * 
   * @param projectId - The ID of the project
   * @returns Array of milestones
   */
  async getMilestones(projectId: number): Promise<Milestone[]> {
    const response = await this.request<{ milestones: Milestone[] }>(
      'GET',
      `get_milestones/${projectId}`
    );
    return response.milestones || [];
  }

  // Users

  /**
   * Get a user by ID
   * 
   * @param userId - The ID of the user
   * @returns The user
   */
  async getUser(userId: number): Promise<User> {
    return this.request<User>('GET', `get_user/${userId}`);
  }

  /**
   * Get a user by email
   * 
   * @param email - The email of the user
   * @returns The user
   */
  async getUserByEmail(email: string): Promise<User> {
    return this.request<User>('GET', `get_user_by_email?email=${encodeURIComponent(email)}`);
  }

  /**
   * Get all users
   * 
   * @returns Array of users
   */
  async getUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[] }>('GET', 'get_users');
    return response.users || [];
  }

  // Statuses

  /**
   * Get all statuses
   * 
   * @returns Array of statuses
   */
  async getStatuses(): Promise<Status[]> {
    return this.request<Status[]>('GET', 'get_statuses');
  }

  // Priorities

  /**
   * Get all priorities
   * 
   * @returns Array of priorities
   */
  async getPriorities(): Promise<Priority[]> {
    return this.request<Priority[]>('GET', 'get_priorities');
  }
}
