import type {
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
    UpdatePlanPayload,
    AddRunPayload,
    AddResultPayload,
    AddResultsForCasesPayload,
} from './types.js';
import { TestRailClientCore } from './client-core.js';
import { TestRailValidationError } from './errors.js';

export { TestRailApiError, TestRailValidationError } from './errors.js';

/**
 * TestRail API Client
 *
 * Type-safe client covering Projects, Suites, Sections, Cases, Plans, Runs,
 * Tests, Results, Milestones, Users, Statuses, and Priorities.
 * Extends {@link TestRailClientCore} for HTTP pipeline, caching, rate limiting, and retry.
 */
export class TestRailClient extends TestRailClientCore {
    // ── Projects ──────────────────────────────────────────────────────────────

    /**
     * Get a project by ID.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getProject(projectId: number): Promise<Project> {
        this.validateId(projectId, 'projectId');
        return this.request<Project>('GET', `get_project/${projectId}`);
    }

    /**
     * Get all projects.
     * @throws {TestRailApiError} When the API request fails
     */
    async getProjects(): Promise<Project[]> {
        const response = await this.request<{ projects: Project[] }>('GET', 'get_projects');
        return response.projects ?? [];
    }

    // ── Suites ────────────────────────────────────────────────────────────────

    /**
     * Get a suite by ID.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSuite(suiteId: number): Promise<Suite> {
        this.validateId(suiteId, 'suiteId');
        return this.request<Suite>('GET', `get_suite/${suiteId}`);
    }

    /**
     * Get all suites for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSuites(projectId: number): Promise<Suite[]> {
        this.validateId(projectId, 'projectId');
        return this.request<Suite[]>('GET', `get_suites/${projectId}`);
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    /**
     * Get a section by ID.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSection(sectionId: number): Promise<Section> {
        this.validateId(sectionId, 'sectionId');
        return this.request<Section>('GET', `get_section/${sectionId}`);
    }

    /**
     * Get all sections for a project, optionally filtered by suite.
     * @param suiteId - Optional suite filter
     * @throws {TestRailValidationError} When projectId or suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSections(projectId: number, suiteId?: number): Promise<Section[]> {
        this.validateId(projectId, 'projectId');
        if (suiteId !== undefined) {
            this.validateId(suiteId, 'suiteId');
        }
        const endpoint = this.buildEndpoint(`get_sections/${projectId}`, { suite_id: suiteId });
        const response = await this.request<{ sections: Section[] }>('GET', endpoint);
        return response.sections ?? [];
    }

    // ── Cases ─────────────────────────────────────────────────────────────────

    /**
     * Get a case by ID.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getCase(caseId: number): Promise<Case> {
        this.validateId(caseId, 'caseId');
        return this.request<Case>('GET', `get_case/${caseId}`);
    }

    /**
     * Get all cases for a project, optionally filtered by suite and/or section.
     * @param suiteId - Optional suite filter
     * @param sectionId - Optional section filter
     * @throws {TestRailValidationError} When any provided ID is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getCases(projectId: number, suiteId?: number, sectionId?: number): Promise<Case[]> {
        this.validateId(projectId, 'projectId');
        if (suiteId !== undefined) {
            this.validateId(suiteId, 'suiteId');
        }
        if (sectionId !== undefined) {
            this.validateId(sectionId, 'sectionId');
        }
        const endpoint = this.buildEndpoint(`get_cases/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
        });
        const response = await this.request<{ cases: Case[] }>('GET', endpoint);
        return response.cases ?? [];
    }

    /**
     * Add a new case to a section.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        this.validateId(sectionId, 'sectionId');
        return this.request<Case>('POST', `add_case/${sectionId}`, payload);
    }

    /**
     * Update an existing case.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
        this.validateId(caseId, 'caseId');
        return this.request<Case>('POST', `update_case/${caseId}`, payload);
    }

    /**
     * Delete a case.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteCase(caseId: number): Promise<void> {
        this.validateId(caseId, 'caseId');
        await this.request<void>('POST', `delete_case/${caseId}`);
    }

    // ── Plans ─────────────────────────────────────────────────────────────────

    /**
     * Get a plan by ID.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getPlan(planId: number): Promise<Plan> {
        this.validateId(planId, 'planId');
        return this.request<Plan>('GET', `get_plan/${planId}`);
    }

    /**
     * Get all plans for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getPlans(projectId: number, limit?: number, offset?: number): Promise<Plan[]> {
        this.validateId(projectId, 'projectId');
        const endpoint = this.buildEndpoint(`get_plans/${projectId}`, { limit, offset });
        const response = await this.request<{ plans: Plan[] }>('GET', endpoint);
        return response.plans ?? [];
    }

    /**
     * Add a new plan to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
        this.validateId(projectId, 'projectId');
        return this.request<Plan>('POST', `add_plan/${projectId}`, payload);
    }

    /**
     * Update an existing plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
        this.validateId(planId, 'planId');
        return this.request<Plan>('POST', `update_plan/${planId}`, payload);
    }

    /**
     * Close a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async closePlan(planId: number): Promise<Plan> {
        this.validateId(planId, 'planId');
        return this.request<Plan>('POST', `close_plan/${planId}`);
    }

    /**
     * Delete a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deletePlan(planId: number): Promise<void> {
        this.validateId(planId, 'planId');
        await this.request<void>('POST', `delete_plan/${planId}`);
    }

    // ── Runs ──────────────────────────────────────────────────────────────────

    /**
     * Get a run by ID.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getRun(runId: number): Promise<Run> {
        this.validateId(runId, 'runId');
        return this.request<Run>('GET', `get_run/${runId}`);
    }

    /**
     * Get all runs for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getRuns(projectId: number): Promise<Run[]> {
        this.validateId(projectId, 'projectId');
        const response = await this.request<{ runs: Run[] }>('GET', `get_runs/${projectId}`);
        return response.runs ?? [];
    }

    /**
     * Add a new run to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        this.validateId(projectId, 'projectId');
        return this.request<Run>('POST', `add_run/${projectId}`, payload);
    }

    /**
     * Close a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async closeRun(runId: number): Promise<Run> {
        this.validateId(runId, 'runId');
        return this.request<Run>('POST', `close_run/${runId}`);
    }

    /**
     * Delete a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteRun(runId: number): Promise<void> {
        this.validateId(runId, 'runId');
        await this.request<void>('POST', `delete_run/${runId}`);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    /**
     * Get a test by ID.
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTest(testId: number): Promise<Test> {
        this.validateId(testId, 'testId');
        return this.request<Test>('GET', `get_test/${testId}`);
    }

    /**
     * Get all tests for a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTests(runId: number): Promise<Test[]> {
        this.validateId(runId, 'runId');
        const response = await this.request<{ tests: Test[] }>('GET', `get_tests/${runId}`);
        return response.tests ?? [];
    }

    // ── Results ───────────────────────────────────────────────────────────────

    /**
     * Get results for a test.
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getResults(testId: number): Promise<Result[]> {
        this.validateId(testId, 'testId');
        const response = await this.request<{ results: Result[] }>('GET', `get_results/${testId}`);
        return response.results ?? [];
    }

    /**
     * Get results for a specific case within a run.
     * @throws {TestRailValidationError} When runId or caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getResultsForCase(runId: number, caseId: number): Promise<Result[]> {
        this.validateId(runId, 'runId');
        this.validateId(caseId, 'caseId');
        const response = await this.request<{ results: Result[] }>('GET', `get_results_for_case/${runId}/${caseId}`);
        return response.results ?? [];
    }

    /**
     * Get all results for a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getResultsForRun(runId: number): Promise<Result[]> {
        this.validateId(runId, 'runId');
        const response = await this.request<{ results: Result[] }>('GET', `get_results_for_run/${runId}`);
        return response.results ?? [];
    }

    /**
     * Add a result for a test.
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
        this.validateId(testId, 'testId');
        return this.request<Result>('POST', `add_result/${testId}`, payload);
    }

    /**
     * Add a result for a specific case within a run.
     * @throws {TestRailValidationError} When runId or caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResultForCase(runId: number, caseId: number, payload: AddResultPayload): Promise<Result> {
        this.validateId(runId, 'runId');
        this.validateId(caseId, 'caseId');
        return this.request<Result>('POST', `add_result_for_case/${runId}/${caseId}`, payload);
    }

    /**
     * Add multiple results for cases in a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResultsForCases(runId: number, payload: AddResultsForCasesPayload): Promise<Result[]> {
        this.validateId(runId, 'runId');
        return this.request<Result[]>('POST', `add_results_for_cases/${runId}`, payload);
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    /**
     * Get a milestone by ID.
     * @throws {TestRailValidationError} When milestoneId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getMilestone(milestoneId: number): Promise<Milestone> {
        this.validateId(milestoneId, 'milestoneId');
        return this.request<Milestone>('GET', `get_milestone/${milestoneId}`);
    }

    /**
     * Get all milestones for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getMilestones(projectId: number): Promise<Milestone[]> {
        this.validateId(projectId, 'projectId');
        const response = await this.request<{ milestones: Milestone[] }>('GET', `get_milestones/${projectId}`);
        return response.milestones ?? [];
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    /**
     * Get a user by ID.
     * @throws {TestRailValidationError} When userId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUser(userId: number): Promise<User> {
        this.validateId(userId, 'userId');
        return this.request<User>('GET', `get_user/${userId}`);
    }

    /**
     * Get a user by email address.
     * @throws {TestRailValidationError} When email format is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUserByEmail(email: string): Promise<User> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        return this.request<User>('GET', this.buildEndpoint('get_user_by_email', { email: encodeURIComponent(email) }));
    }

    /**
     * Get all users.
     * @throws {TestRailApiError} When the API request fails
     */
    async getUsers(): Promise<User[]> {
        const response = await this.request<{ users: User[] }>('GET', 'get_users');
        return response.users ?? [];
    }

    // ── Statuses ──────────────────────────────────────────────────────────────

    /**
     * Get all test statuses.
     * @throws {TestRailApiError} When the API request fails
     */
    async getStatuses(): Promise<Status[]> {
        return this.request<Status[]>('GET', 'get_statuses');
    }

    // ── Priorities ────────────────────────────────────────────────────────────

    /**
     * Get all case priorities.
     * @throws {TestRailApiError} When the API request fails
     */
    async getPriorities(): Promise<Priority[]> {
        return this.request<Priority[]>('GET', 'get_priorities');
    }
}
