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
    AddSuitePayload,
    UpdateSuitePayload,
    AddPlanPayload,
    UpdatePlanPayload,
    AddPlanEntryPayload,
    UpdatePlanEntryPayload,
    PlanEntry,
    AddRunPayload,
    UpdateRunPayload,
    AddResultPayload,
    AddResultsForCasesPayload,
    AddSectionPayload,
    UpdateSectionPayload,
    AddMilestonePayload,
    UpdateMilestonePayload,
    AddProjectPayload,
    UpdateProjectPayload,
    GetPlansOptions,
    GetTestsOptions,
    GetResultsOptions,
    GetMilestonesOptions,
    ResultField,
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
     * @throws {TestRailValidationError} When limit or offset is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getProjects(limit?: number, offset?: number): Promise<Project[]> {
        this.validatePaginationParams(limit, offset);
        const endpoint = this.buildEndpoint('get_projects', { limit, offset });
        const response = await this.request<{ projects: Project[] }>('GET', endpoint);
        return response.projects ?? [];
    }

    /**
     * Add a new project.
     * @throws {TestRailApiError} When the API request fails
     */
    async addProject(payload: AddProjectPayload): Promise<Project> {
        return this.request<Project>('POST', 'add_project', payload);
    }

    /**
     * Update an existing project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project> {
        this.validateId(projectId, 'projectId');
        return this.request<Project>('POST', `update_project/${projectId}`, payload);
    }

    /**
     * Delete a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteProject(projectId: number): Promise<void> {
        this.validateId(projectId, 'projectId');
        await this.request<void>('POST', `delete_project/${projectId}`);
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

    /**
     * Add a suite to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSuite(projectId: number, payload: AddSuitePayload): Promise<Suite> {
        this.validateId(projectId, 'projectId');
        return this.request<Suite>('POST', `add_suite/${projectId}`, payload);
    }

    /**
     * Update a suite.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSuite(suiteId: number, payload: UpdateSuitePayload): Promise<Suite> {
        this.validateId(suiteId, 'suiteId');
        return this.request<Suite>('POST', `update_suite/${suiteId}`, payload);
    }

    /**
     * Delete a suite.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSuite(suiteId: number): Promise<void> {
        this.validateId(suiteId, 'suiteId');
        await this.request<void>('POST', `delete_suite/${suiteId}`);
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
     * @param options.suiteId - Optional suite filter
     * @param options.limit - Optional maximum number of results to return
     * @param options.offset - Optional number of results to skip
     * @throws {TestRailValidationError} When projectId or suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSections(
        projectId: number,
        options?: { suiteId?: number; limit?: number; offset?: number },
    ): Promise<Section[]> {
        this.validateId(projectId, 'projectId');
        const { suiteId, limit, offset } = options ?? {};
        if (suiteId !== undefined) {
            this.validateId(suiteId, 'suiteId');
        }
        this.validatePaginationParams(limit, offset);
        const endpoint = this.buildEndpoint(`get_sections/${projectId}`, { suite_id: suiteId, limit, offset });
        const response = await this.request<{ sections: Section[] }>('GET', endpoint);
        return response.sections ?? [];
    }

    /**
     * Add a new section to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSection(projectId: number, payload: AddSectionPayload): Promise<Section> {
        this.validateId(projectId, 'projectId');
        return this.request<Section>('POST', `add_section/${projectId}`, payload);
    }

    /**
     * Update an existing section.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSection(sectionId: number, payload: UpdateSectionPayload): Promise<Section> {
        this.validateId(sectionId, 'sectionId');
        return this.request<Section>('POST', `update_section/${sectionId}`, payload);
    }

    /**
     * Delete a section.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSection(sectionId: number): Promise<void> {
        this.validateId(sectionId, 'sectionId');
        await this.request<void>('POST', `delete_section/${sectionId}`);
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
     * @param options.suiteId - Optional suite filter
     * @param options.sectionId - Optional section filter
     * @param options.limit - Optional maximum number of results to return
     * @param options.offset - Optional number of results to skip
     * @throws {TestRailValidationError} When any provided ID is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getCases(
        projectId: number,
        options?: { suiteId?: number; sectionId?: number; limit?: number; offset?: number },
    ): Promise<Case[]> {
        this.validateId(projectId, 'projectId');
        const { suiteId, sectionId, limit, offset } = options ?? {};
        if (suiteId !== undefined) {
            this.validateId(suiteId, 'suiteId');
        }
        if (sectionId !== undefined) {
            this.validateId(sectionId, 'sectionId');
        }
        this.validatePaginationParams(limit, offset);
        const endpoint = this.buildEndpoint(`get_cases/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
            limit,
            offset,
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
     * Get all plans for a project with optional filters.
     * @param projectId - The project ID
     * @param options - Optional filter parameters (created_after, created_before, created_by,
     *   is_completed, milestone_id, limit, offset)
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getPlans(projectId: number, options?: GetPlansOptions): Promise<Plan[]> {
        this.validateId(projectId, 'projectId');
        this.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.buildEndpoint(`get_plans/${projectId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: options?.created_by?.length ? options.created_by.join(',') : undefined,
            is_completed: options?.is_completed,
            milestone_id: options?.milestone_id?.length ? options.milestone_id.join(',') : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
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
     * Update a plan.
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

    /**
     * Add a plan entry (run) to a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry> {
        this.validateId(planId, 'planId');
        return this.request<PlanEntry>('POST', `add_plan_entry/${planId}`, payload);
    }

    /**
     * Update an existing plan entry.
     * @throws {TestRailValidationError} When planId is invalid or entryId is not a non-empty string
     * @throws {TestRailApiError} When the API request fails
     */
    async updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry> {
        this.validateId(planId, 'planId');
        this.validateEntryId(entryId);
        return this.request<PlanEntry>('POST', `update_plan_entry/${planId}/${entryId}`, payload);
    }

    /**
     * Delete a plan entry.
     * @throws {TestRailValidationError} When planId is invalid or entryId is not a non-empty string
     * @throws {TestRailApiError} When the API request fails
     */
    async deletePlanEntry(planId: number, entryId: string): Promise<void> {
        this.validateId(planId, 'planId');
        this.validateEntryId(entryId);
        await this.request<void>('POST', `delete_plan_entry/${planId}/${entryId}`);
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
    async getRuns(projectId: number, limit?: number, offset?: number): Promise<Run[]> {
        this.validateId(projectId, 'projectId');
        this.validatePaginationParams(limit, offset);
        const endpoint = this.buildEndpoint(`get_runs/${projectId}`, { limit, offset });
        const response = await this.request<{ runs: Run[] }>('GET', endpoint);
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
     * Update a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        this.validateId(runId, 'runId');
        return this.request<Run>('POST', `update_run/${runId}`, payload);
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
     * Get all tests for a run with optional filters.
     * @param runId - The run ID
     * @param options - Optional filter parameters (status_id, limit, offset)
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        this.validateId(runId, 'runId');
        this.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.buildEndpoint(`get_tests/${runId}`, {
            status_id: options?.status_id?.length ? options.status_id.join(',') : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const response = await this.request<{ tests: Test[] }>('GET', endpoint);
        return response.tests ?? [];
    }

    // ── Results ───────────────────────────────────────────────────────────────

    /**
     * Get results for a test with optional filters.
     * @param testId - The test ID
     * @param options - Optional filter parameters (created_after, created_before, created_by,
     *   status_id, limit, offset)
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.validateId(testId, 'testId');
        this.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.buildEndpoint(`get_results/${testId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: options?.created_by?.length ? options.created_by.join(',') : undefined,
            status_id: options?.status_id?.length ? options.status_id.join(',') : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const response = await this.request<{ results: Result[] }>('GET', endpoint);
        return response.results ?? [];
    }

    /**
     * Get results for a specific case within a run with optional filters.
     * @param runId - The run ID
     * @param caseId - The case ID
     * @param options - Optional filter parameters (created_after, created_before, created_by,
     *   status_id, limit, offset)
     * @throws {TestRailValidationError} When runId or caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.validateId(runId, 'runId');
        this.validateId(caseId, 'caseId');
        this.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.buildEndpoint(`get_results_for_case/${runId}/${caseId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: options?.created_by?.length ? options.created_by.join(',') : undefined,
            status_id: options?.status_id?.length ? options.status_id.join(',') : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const response = await this.request<{ results: Result[] }>('GET', endpoint);
        return response.results ?? [];
    }

    /**
     * Get all results for a run with optional filters.
     * @param runId - The run ID
     * @param options - Optional filter parameters (created_after, created_before, created_by,
     *   status_id, limit, offset)
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getResultsForRun(runId: number, options?: GetResultsOptions): Promise<Result[]> {
        this.validateId(runId, 'runId');
        this.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.buildEndpoint(`get_results_for_run/${runId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: options?.created_by?.length ? options.created_by.join(',') : undefined,
            status_id: options?.status_id?.length ? options.status_id.join(',') : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const response = await this.request<{ results: Result[] }>('GET', endpoint);
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
     * Get all milestones for a project with optional filters.
     * @param projectId - The project ID
     * @param options - Optional filter parameters (is_completed, limit, offset)
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getMilestones(projectId: number, options?: GetMilestonesOptions): Promise<Milestone[]> {
        this.validateId(projectId, 'projectId');
        this.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.buildEndpoint(`get_milestones/${projectId}`, {
            is_completed: options?.is_completed,
            limit: options?.limit,
            offset: options?.offset,
        });
        const response = await this.request<{ milestones: Milestone[] }>('GET', endpoint);
        return response.milestones ?? [];
    }

    /**
     * Add a new milestone to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone> {
        this.validateId(projectId, 'projectId');
        return this.request<Milestone>('POST', `add_milestone/${projectId}`, payload);
    }

    /**
     * Update an existing milestone.
     * @throws {TestRailValidationError} When milestoneId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> {
        this.validateId(milestoneId, 'milestoneId');
        return this.request<Milestone>('POST', `update_milestone/${milestoneId}`, payload);
    }

    /**
     * Delete a milestone.
     * @throws {TestRailValidationError} When milestoneId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteMilestone(milestoneId: number): Promise<void> {
        this.validateId(milestoneId, 'milestoneId');
        await this.request<void>('POST', `delete_milestone/${milestoneId}`);
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

        // buildEndpoint now encodes all values via encodeURIComponent internally.
        return this.request<User>('GET', this.buildEndpoint('get_user_by_email', { email }));
    }

    /**
     * Get all users.
     * @throws {TestRailValidationError} When limit or offset is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUsers(limit?: number, offset?: number): Promise<User[]> {
        this.validatePaginationParams(limit, offset);
        const endpoint = this.buildEndpoint('get_users', { limit, offset });
        const response = await this.request<{ users: User[] }>('GET', endpoint);
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

    // ── Result Fields ─────────────────────────────────────────────────────────

    /**
     * Get all available custom result fields.
     * @throws {TestRailApiError} When the API request fails
     */
    async getResultFields(): Promise<ResultField[]> {
        return this.request<ResultField[]>('GET', 'get_result_fields');
    }
}
