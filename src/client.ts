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
    GetRunsOptions,
    GetCasesOptions,
    ResultField,
    CaseField,
    CaseType,
    Template,
    ConfigurationGroup,
    Configuration,
    AddConfigurationGroupPayload,
    UpdateConfigurationGroupPayload,
    AddConfigurationPayload,
    UpdateConfigurationPayload,
    AddUserPayload,
    UpdateUserPayload,
    Role,
    Group,
    AddGroupPayload,
    UpdateGroupPayload,
    Attachment,
    SharedStep,
    AddSharedStepPayload,
    UpdateSharedStepPayload,
    Variable,
    AddVariablePayload,
    UpdateVariablePayload,
    Dataset,
    AddDatasetPayload,
    UpdateDatasetPayload,
    Report,
    ReportResult,
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
     * Get all cases for a project with optional filters.
     * @param options.suiteId - Return only cases in this suite
     * @param options.sectionId - Return only cases in this section
     * @param options.typeId - Return only cases of this type
     * @param options.priorityId - Return only cases with this priority
     * @param options.templateId - Return only cases using this template
     * @param options.milestoneId - Return only cases linked to this milestone
     * @param options.createdAfter - Return only cases created after this Unix timestamp
     * @param options.createdBefore - Return only cases created before this Unix timestamp
     * @param options.updatedAfter - Return only cases updated after this Unix timestamp
     * @param options.updatedBefore - Return only cases updated before this Unix timestamp
     * @param options.limit - Maximum number of cases to return
     * @param options.offset - Pagination offset
     * @throws {TestRailValidationError} When any provided ID is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getCases(projectId: number, options?: GetCasesOptions): Promise<Case[]> {
        this.validateId(projectId, 'projectId');
        const {
            suiteId,
            sectionId,
            typeId,
            priorityId,
            templateId,
            milestoneId,
            createdAfter,
            createdBefore,
            updatedAfter,
            updatedBefore,
            limit,
            offset,
        } = options ?? {};
        if (suiteId !== undefined) this.validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) this.validateId(sectionId, 'sectionId');
        if (typeId !== undefined) this.validateId(typeId, 'typeId');
        if (priorityId !== undefined) this.validateId(priorityId, 'priorityId');
        if (templateId !== undefined) this.validateId(templateId, 'templateId');
        if (milestoneId !== undefined) this.validateId(milestoneId, 'milestoneId');
        this.validatePaginationParams(limit, offset);
        const endpoint = this.buildEndpoint(`get_cases/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
            type_id: typeId,
            priority_id: priorityId,
            template_id: templateId,
            milestone_id: milestoneId,
            created_after: createdAfter,
            created_before: createdBefore,
            updated_after: updatedAfter,
            updated_before: updatedBefore,
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
            created_by: this.serializeIdList(options?.created_by),
            is_completed: options?.is_completed,
            milestone_id: this.serializeIdList(options?.milestone_id),
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
     * Get all runs for a project, with optional filters.
     * @param projectId - The project ID
     * @param options - Optional filters: createdAfter, createdBefore, createdBy, isCompleted,
     *   milestoneId, refsFilter, suiteId, limit, offset
     * @throws {TestRailValidationError} When projectId or pagination params are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getRuns(projectId: number, options?: GetRunsOptions): Promise<Run[]> {
        this.validateId(projectId, 'projectId');
        const { createdAfter, createdBefore, createdBy, isCompleted, milestoneId, refsFilter, suiteId, limit, offset } =
            options ?? {};
        this.validatePaginationParams(limit, offset);
        if (milestoneId !== undefined) {
            this.validateId(milestoneId, 'milestoneId');
        }
        if (suiteId !== undefined) {
            this.validateId(suiteId, 'suiteId');
        }
        if (createdBy !== undefined) {
            createdBy.forEach((userId) => this.validateId(userId, 'createdBy'));
        }
        const createdByFilter = createdBy && createdBy.length > 0 ? createdBy.join(',') : undefined;
        const endpoint = this.buildEndpoint(`get_runs/${projectId}`, {
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: createdByFilter,
            is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
            milestone_id: milestoneId,
            refs_filter: refsFilter,
            suite_id: suiteId,
            limit,
            offset,
        });
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
            status_id: this.serializeIdList(options?.status_id),
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
            created_by: this.serializeIdList(options?.created_by),
            status_id: this.serializeIdList(options?.status_id),
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
            created_by: this.serializeIdList(options?.created_by),
            status_id: this.serializeIdList(options?.status_id),
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
            created_by: this.serializeIdList(options?.created_by),
            status_id: this.serializeIdList(options?.status_id),
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
     * Get all users, optionally scoped to a project.
     * @param limit - Maximum number of users to return
     * @param offset - Number of users to skip
     * @param projectId - When provided, returns only users with access to the specified project
     * @throws {TestRailValidationError} When pagination or projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUsers(limit?: number, offset?: number, projectId?: number): Promise<User[]> {
        this.validatePaginationParams(limit, offset);
        if (projectId !== undefined) {
            this.validateId(projectId, 'projectId');
        }
        const endpoint = this.buildEndpoint(projectId !== undefined ? `get_users/${projectId}` : 'get_users', {
            limit,
            offset,
        });
        const response = await this.request<{ users: User[] }>('GET', endpoint);
        return response.users ?? [];
    }

    /**
     * Get the currently authenticated user.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCurrentUser(): Promise<User> {
        return this.request<User>('GET', 'get_current_user');
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

    // ── Case Fields & Types ───────────────────────────────────────────────────

    /**
     * Get all available custom case fields.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCaseFields(): Promise<CaseField[]> {
        return this.request<CaseField[]>('GET', 'get_case_fields');
    }

    /**
     * Get all available case types.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCaseTypes(): Promise<CaseType[]> {
        return this.request<CaseType[]>('GET', 'get_case_types');
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    /**
     * Get all available case templates for a project (requires TestRail 5.2+).
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTemplates(projectId: number): Promise<Template[]> {
        this.validateId(projectId, 'projectId');
        return this.request<Template[]>('GET', `get_templates/${projectId}`);
    }

    // ── Configurations ────────────────────────────────────────────────────────

    /**
     * Get all configuration groups and their configurations for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getConfigurations(projectId: number): Promise<ConfigurationGroup[]> {
        this.validateId(projectId, 'projectId');
        return this.request<ConfigurationGroup[]>('GET', `get_configs/${projectId}`);
    }

    /**
     * Add a new configuration group to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addConfigurationGroup(projectId: number, payload: AddConfigurationGroupPayload): Promise<ConfigurationGroup> {
        this.validateId(projectId, 'projectId');
        return this.request<ConfigurationGroup>('POST', `add_config_group/${projectId}`, payload);
    }

    /**
     * Update an existing configuration group.
     * @throws {TestRailValidationError} When configGroupId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateConfigurationGroup(
        configGroupId: number,
        payload: UpdateConfigurationGroupPayload,
    ): Promise<ConfigurationGroup> {
        this.validateId(configGroupId, 'configGroupId');
        return this.request<ConfigurationGroup>('POST', `update_config_group/${configGroupId}`, payload);
    }

    /**
     * Delete an existing configuration group and all its configurations.
     * @throws {TestRailValidationError} When configGroupId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteConfigurationGroup(configGroupId: number): Promise<void> {
        this.validateId(configGroupId, 'configGroupId');
        await this.request<void>('POST', `delete_config_group/${configGroupId}`);
    }

    /**
     * Add a new configuration to a configuration group.
     * @throws {TestRailValidationError} When configGroupId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addConfiguration(configGroupId: number, payload: AddConfigurationPayload): Promise<Configuration> {
        this.validateId(configGroupId, 'configGroupId');
        return this.request<Configuration>('POST', `add_config/${configGroupId}`, payload);
    }

    /**
     * Update an existing configuration.
     * @throws {TestRailValidationError} When configId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateConfiguration(configId: number, payload: UpdateConfigurationPayload): Promise<Configuration> {
        this.validateId(configId, 'configId');
        return this.request<Configuration>('POST', `update_config/${configId}`, payload);
    }

    /**
     * Delete an existing configuration.
     * @throws {TestRailValidationError} When configId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteConfiguration(configId: number): Promise<void> {
        this.validateId(configId, 'configId');
        await this.request<void>('POST', `delete_config/${configId}`);
    }

    // ── User Management (TASK-024, requires TestRail 7.3+) ────────────────────

    /**
     * Create a new TestRail user (requires TestRail 7.3+).
     * @throws {TestRailApiError} When the API request fails
     */
    async addUser(payload: AddUserPayload): Promise<User> {
        return this.request<User>('POST', 'add_user', payload);
    }

    /**
     * Update an existing TestRail user (requires TestRail 7.3+).
     * @throws {TestRailValidationError} When userId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
        this.validateId(userId, 'userId');
        return this.request<User>('POST', `update_user/${userId}`, payload);
    }

    // ── Roles (TASK-025, requires TestRail 7.3+) ──────────────────────────────

    /**
     * Get all available user roles (requires TestRail 7.3+).
     * @throws {TestRailApiError} When the API request fails
     */
    async getRoles(): Promise<Role[]> {
        return this.request<Role[]>('GET', 'get_roles');
    }

    // ── Groups (TASK-026, requires TestRail 7.5+) ─────────────────────────────

    /**
     * Get a single group by ID (requires TestRail 7.5+).
     * @throws {TestRailValidationError} When groupId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getGroup(groupId: number): Promise<Group> {
        this.validateId(groupId, 'groupId');
        return this.request<Group>('GET', `get_group/${groupId}`);
    }

    /**
     * Get all groups (requires TestRail 7.5+).
     * @throws {TestRailApiError} When the API request fails
     */
    async getGroups(): Promise<Group[]> {
        return this.request<Group[]>('GET', 'get_groups');
    }

    /**
     * Create a new group (requires TestRail 7.5+).
     * @throws {TestRailApiError} When the API request fails
     */
    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.request<Group>('POST', 'add_group', payload);
    }

    /**
     * Update an existing group (requires TestRail 7.5+).
     * @throws {TestRailValidationError} When groupId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        this.validateId(groupId, 'groupId');
        return this.request<Group>('POST', `update_group/${groupId}`, payload);
    }

    /**
     * Delete a group (requires TestRail 7.5+).
     * @throws {TestRailValidationError} When groupId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteGroup(groupId: number): Promise<void> {
        this.validateId(groupId, 'groupId');
        await this.request<void>('POST', `delete_group/${groupId}`);
    }

    // ── Attachments (TASK-027) ────────────────────────────────────────────────

    /**
     * Get all attachments for a test case.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForCase(caseId: number): Promise<Attachment[]> {
        this.validateId(caseId, 'caseId');
        const response = await this.request<{ attachments: Attachment[] }>('GET', `get_attachments_for_case/${caseId}`);
        return response.attachments ?? [];
    }

    /**
     * Get all attachments for a test run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForRun(runId: number): Promise<Attachment[]> {
        this.validateId(runId, 'runId');
        const response = await this.request<{ attachments: Attachment[] }>('GET', `get_attachments_for_run/${runId}`);
        return response.attachments ?? [];
    }

    /**
     * Get all attachments for a test.
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForTest(testId: number): Promise<Attachment[]> {
        this.validateId(testId, 'testId');
        const response = await this.request<{ attachments: Attachment[] }>('GET', `get_attachments_for_test/${testId}`);
        return response.attachments ?? [];
    }

    /**
     * Get all attachments for a test plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForPlan(planId: number): Promise<Attachment[]> {
        this.validateId(planId, 'planId');
        const response = await this.request<{ attachments: Attachment[] }>('GET', `get_attachments_for_plan/${planId}`);
        return response.attachments ?? [];
    }

    /**
     * Get all attachments for a specific plan entry.
     * @throws {TestRailValidationError} When planId or entryId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForPlanEntry(planId: number, entryId: number): Promise<Attachment[]> {
        this.validateId(planId, 'planId');
        this.validateId(entryId, 'entryId');
        const response = await this.request<{ attachments: Attachment[] }>(
            'GET',
            `get_attachments_for_plan_entry/${planId}/${entryId}`,
        );
        return response.attachments ?? [];
    }

    /**
     * Download the raw binary content of an attachment.
     * @param attachmentId - The attachment ID (numeric)
     * @throws {TestRailValidationError} When attachmentId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachment(attachmentId: number): Promise<ArrayBuffer> {
        this.validateId(attachmentId, 'attachmentId');
        return this.requestBinary(`get_attachment/${attachmentId}`);
    }

    /**
     * Upload a file attachment to a test case.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToCase(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.validateId(caseId, 'caseId');
        return this.requestMultipart<Attachment>(`add_attachment_to_case/${caseId}`, file, filename);
    }

    /**
     * Upload a file attachment to a test result.
     * @throws {TestRailValidationError} When resultId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToResult(
        resultId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.validateId(resultId, 'resultId');
        return this.requestMultipart<Attachment>(`add_attachment_to_result/${resultId}`, file, filename);
    }

    /**
     * Upload a file attachment to a test run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToRun(
        runId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.validateId(runId, 'runId');
        return this.requestMultipart<Attachment>(`add_attachment_to_run/${runId}`, file, filename);
    }

    /**
     * Upload a file attachment to a test plan (requires TestRail 6.5.2+).
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToPlan(
        planId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.validateId(planId, 'planId');
        return this.requestMultipart<Attachment>(`add_attachment_to_plan/${planId}`, file, filename);
    }

    /**
     * Upload a file attachment to a specific plan entry (requires TestRail 6.5.2+).
     * @throws {TestRailValidationError} When planId or entryId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToPlanEntry(
        planId: number,
        entryId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.validateId(planId, 'planId');
        this.validateId(entryId, 'entryId');
        return this.requestMultipart<Attachment>(`add_attachment_to_plan_entry/${planId}/${entryId}`, file, filename);
    }

    /**
     * Delete an attachment by ID.
     * @throws {TestRailValidationError} When attachmentId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteAttachment(attachmentId: number): Promise<void> {
        this.validateId(attachmentId, 'attachmentId');
        await this.request<void>('POST', `delete_attachment/${attachmentId}`);
    }

    // ── Shared Steps (TASK-028, requires TestRail 7.0+) ───────────────────────

    /**
     * Get a single shared step by ID (requires TestRail 7.0+).
     * @throws {TestRailValidationError} When sharedStepId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        this.validateId(sharedStepId, 'sharedStepId');
        return this.request<SharedStep>('GET', `get_shared_step/${sharedStepId}`);
    }

    /**
     * Get all shared steps for a project (requires TestRail 7.0+).
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSharedSteps(projectId: number): Promise<SharedStep[]> {
        this.validateId(projectId, 'projectId');
        return this.request<SharedStep[]>('GET', `get_shared_steps/${projectId}`);
    }

    /**
     * Create a new shared step in a project (requires TestRail 7.0+).
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        this.validateId(projectId, 'projectId');
        return this.request<SharedStep>('POST', `add_shared_step/${projectId}`, payload);
    }

    /**
     * Update an existing shared step (requires TestRail 7.0+).
     * @throws {TestRailValidationError} When sharedStepId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        this.validateId(sharedStepId, 'sharedStepId');
        return this.request<SharedStep>('POST', `update_shared_step/${sharedStepId}`, payload);
    }

    /**
     * Delete a shared step (requires TestRail 7.0+).
     * @throws {TestRailValidationError} When sharedStepId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSharedStep(sharedStepId: number): Promise<void> {
        this.validateId(sharedStepId, 'sharedStepId');
        await this.request<void>('POST', `delete_shared_step/${sharedStepId}`);
    }

    // ── Variables (TASK-029) ──────────────────────────────────────────────────

    /**
     * Get all variables for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getVariables(projectId: number): Promise<Variable[]> {
        this.validateId(projectId, 'projectId');
        return this.request<Variable[]>('GET', `get_variables/${projectId}`);
    }

    /**
     * Create a new variable in a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addVariable(projectId: number, payload: AddVariablePayload): Promise<Variable> {
        this.validateId(projectId, 'projectId');
        return this.request<Variable>('POST', `add_variable/${projectId}`, payload);
    }

    /**
     * Update an existing variable.
     * @throws {TestRailValidationError} When variableId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateVariable(variableId: number, payload: UpdateVariablePayload): Promise<Variable> {
        this.validateId(variableId, 'variableId');
        return this.request<Variable>('POST', `update_variable/${variableId}`, payload);
    }

    /**
     * Delete a variable.
     * @throws {TestRailValidationError} When variableId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteVariable(variableId: number): Promise<void> {
        this.validateId(variableId, 'variableId');
        await this.request<void>('POST', `delete_variable/${variableId}`);
    }

    // ── Datasets (TASK-030) ───────────────────────────────────────────────────

    /**
     * Get a single dataset by ID.
     * @throws {TestRailValidationError} When datasetId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getDataset(datasetId: number): Promise<Dataset> {
        this.validateId(datasetId, 'datasetId');
        return this.request<Dataset>('GET', `get_dataset/${datasetId}`);
    }

    /**
     * Get all datasets for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getDatasets(projectId: number): Promise<Dataset[]> {
        this.validateId(projectId, 'projectId');
        return this.request<Dataset[]>('GET', `get_datasets/${projectId}`);
    }

    /**
     * Create a new dataset in a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addDataset(projectId: number, payload: AddDatasetPayload): Promise<Dataset> {
        this.validateId(projectId, 'projectId');
        return this.request<Dataset>('POST', `add_dataset/${projectId}`, payload);
    }

    /**
     * Update an existing dataset.
     * @throws {TestRailValidationError} When datasetId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateDataset(datasetId: number, payload: UpdateDatasetPayload): Promise<Dataset> {
        this.validateId(datasetId, 'datasetId');
        return this.request<Dataset>('POST', `update_dataset/${datasetId}`, payload);
    }

    /**
     * Delete a dataset.
     * @throws {TestRailValidationError} When datasetId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteDataset(datasetId: number): Promise<void> {
        this.validateId(datasetId, 'datasetId');
        await this.request<void>('POST', `delete_dataset/${datasetId}`);
    }

    // ── Reports (TASK-031) ────────────────────────────────────────────────────

    /**
     * Get all available report templates for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getReports(projectId: number): Promise<Report[]> {
        this.validateId(projectId, 'projectId');
        return this.request<Report[]>('GET', `get_reports/${projectId}`);
    }

    /**
     * Execute a report template and return URLs to the generated output.
     * @throws {TestRailValidationError} When reportTemplateId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async runReport(reportTemplateId: number): Promise<ReportResult> {
        this.validateId(reportTemplateId, 'reportTemplateId');
        return this.request<ReportResult>('GET', `run_report/${reportTemplateId}`);
    }

    private serializeIdList(ids?: number[]): string | undefined {
        return ids !== undefined && ids.length > 0 ? ids.join(',') : undefined;
    }
}
