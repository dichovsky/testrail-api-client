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
    PlanEntry,
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
    HistoryEntry,
    CaseStatus,
    SoftDeleteOptions,
} from './types.js';
import type {
    AddCasePayload,
    UpdateCasePayload,
    UpdateCasesPayload,
    DeleteCasesPayload,
    SoftDeletePreview,
    CopyCasesToSectionPayload,
    MoveCasesToSectionPayload,
    AddCaseFieldPayload,
    MoveSectionPayload,
    AddRunPayload,
    UpdateRunPayload,
    AddResultPayload,
    AddResultsForCasesPayload,
    AddResultsPayload,
    AddPlanPayload,
    UpdatePlanPayload,
    AddPlanEntryPayload,
    UpdatePlanEntryPayload,
    AddRunToPlanEntryPayload,
    UpdateRunInPlanEntryPayload,
    AddProjectPayload,
    UpdateProjectPayload,
    AddSuitePayload,
    UpdateSuitePayload,
    AddSectionPayload,
    UpdateSectionPayload,
    AddMilestonePayload,
    UpdateMilestonePayload,
} from './schemas.js';
import type { GetHistoryForCaseOptions } from './modules/cases.js';
import type { GetSharedStepHistoryOptions } from './modules/sharedSteps.js';
import { TestRailClientCore } from './client-core.js';
import { ProjectModule } from './modules/projects.js';
import { SuiteModule } from './modules/suites.js';
import { SectionModule } from './modules/sections.js';
import { CaseModule } from './modules/cases.js';
import { PlanModule } from './modules/plans.js';
import { RunModule } from './modules/runs.js';
import { TestModule } from './modules/tests.js';
import { ResultModule } from './modules/results.js';
import { MilestoneModule } from './modules/milestones.js';
import { UsersModule } from './modules/users.js';
import { MetadataModule } from './modules/metadata.js';
import { ConfigurationModule } from './modules/configurations.js';
import { AttachmentModule } from './modules/attachments.js';
import { BddModule } from './modules/bdd.js';
import { SharedStepModule } from './modules/sharedSteps.js';
import { VariableModule } from './modules/variables.js';
import { DatasetModule } from './modules/datasets.js';
import { ReportModule } from './modules/reports.js';

export { TestRailApiError, TestRailValidationError } from './errors.js';

/**
 * TestRail API Client
 *
 * Type-safe client covering Projects, Suites, Sections, Cases, Plans, Runs,
 * Tests, Results, Milestones, Users, Statuses, and Priorities.
 * Extends {@link TestRailClientCore} for HTTP pipeline, caching, rate limiting, and retry.
 */
export class TestRailClient extends TestRailClientCore {
    // ── Domain modules ────────────────────────────────────────────────────────
    public readonly projects: ProjectModule;
    public readonly suites: SuiteModule;
    public readonly sections: SectionModule;
    public readonly cases: CaseModule;
    public readonly plans: PlanModule;
    public readonly runs: RunModule;
    public readonly tests: TestModule;
    public readonly results: ResultModule;
    public readonly milestones: MilestoneModule;
    public readonly users: UsersModule;
    public readonly metadata: MetadataModule;
    public readonly configurations: ConfigurationModule;
    public readonly attachments: AttachmentModule;
    public readonly bdd: BddModule;
    public readonly sharedSteps: SharedStepModule;
    public readonly variables: VariableModule;
    public readonly datasets: DatasetModule;
    public readonly reports: ReportModule;

    constructor(...args: ConstructorParameters<typeof TestRailClientCore>) {
        super(...args);
        this.projects = new ProjectModule(this);
        this.suites = new SuiteModule(this);
        this.sections = new SectionModule(this);
        this.cases = new CaseModule(this);
        this.plans = new PlanModule(this);
        this.runs = new RunModule(this);
        this.tests = new TestModule(this);
        this.results = new ResultModule(this);
        this.milestones = new MilestoneModule(this);
        this.users = new UsersModule(this);
        this.metadata = new MetadataModule(this);
        this.configurations = new ConfigurationModule(this);
        this.attachments = new AttachmentModule(this);
        this.bdd = new BddModule(this);
        this.sharedSteps = new SharedStepModule(this);
        this.variables = new VariableModule(this);
        this.datasets = new DatasetModule(this);
        this.reports = new ReportModule(this);
    }

    // ── Projects ──────────────────────────────────────────────────────────────

    /**
     * Get a project by ID.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getProject(projectId: number): Promise<Project> {
        return this.projects.getProject(projectId);
    }

    /**
     * Get all projects.
     * @throws {TestRailValidationError} When limit or offset is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getProjects(limit?: number, offset?: number): Promise<Project[]> {
        return this.projects.getProjects(limit, offset);
    }

    /**
     * Add a new project.
     * @throws {TestRailApiError} When the API request fails
     */
    async addProject(payload: AddProjectPayload): Promise<Project> {
        return this.projects.addProject(payload);
    }

    /**
     * Update an existing project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project> {
        return this.projects.updateProject(projectId, payload);
    }

    /**
     * Delete a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteProject(projectId: number): Promise<void> {
        return this.projects.deleteProject(projectId);
    }

    // ── Suites ────────────────────────────────────────────────────────────────

    /**
     * Get a suite by ID.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSuite(suiteId: number): Promise<Suite> {
        return this.suites.getSuite(suiteId);
    }

    /**
     * Get all suites for a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSuites(projectId: number): Promise<Suite[]> {
        return this.suites.getSuites(projectId);
    }

    /**
     * Add a suite to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSuite(projectId: number, payload: AddSuitePayload): Promise<Suite> {
        return this.suites.addSuite(projectId, payload);
    }

    /**
     * Update a suite.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSuite(suiteId: number, payload: UpdateSuitePayload): Promise<Suite> {
        return this.suites.updateSuite(suiteId, payload);
    }

    /**
     * Delete a suite and everything inside it (sections, cases, runs, plans).
     * Pass `{ soft: true }` for TestRail's server-side preview (`soft=1`).
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSuite(suiteId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteSuite(suiteId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteSuite(suiteId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteSuite(suiteId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        if (options?.soft === true) {
            return this.suites.deleteSuite(suiteId, { ...options, soft: true });
        }
        return this.suites.deleteSuite(suiteId, options as SoftDeleteOptions & { soft?: false });
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    /**
     * Get a section by ID.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSection(sectionId: number): Promise<Section> {
        return this.sections.getSection(sectionId);
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
        return this.sections.getSections(projectId, options);
    }

    /**
     * Add a new section to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSection(projectId: number, payload: AddSectionPayload): Promise<Section> {
        return this.sections.addSection(projectId, payload);
    }

    /**
     * Update an existing section.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSection(sectionId: number, payload: UpdateSectionPayload): Promise<Section> {
        return this.sections.updateSection(sectionId, payload);
    }

    /**
     * Delete a section (recursively removes all subsections and cases).
     * Pass `{ soft: true }` for TestRail's server-side preview (`soft=1`).
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSection(sectionId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteSection(sectionId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteSection(sectionId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteSection(sectionId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        if (options?.soft === true) {
            return this.sections.deleteSection(sectionId, { ...options, soft: true });
        }
        return this.sections.deleteSection(sectionId, options as SoftDeleteOptions & { soft?: false });
    }

    /**
     * Move a section to a new parent and/or position within its container
     * (TestRail 6.5.2+). `parent_id: null` moves to root; `after_id: null`
     * moves to the top of the container. Omitted fields leave that axis
     * unchanged. Returns no body.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async moveSection(sectionId: number, payload: MoveSectionPayload): Promise<void> {
        return this.sections.moveSection(sectionId, payload);
    }

    // ── Cases ─────────────────────────────────────────────────────────────────

    /**
     * Get a case by ID.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getCase(caseId: number): Promise<Case> {
        return this.cases.getCase(caseId);
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
        return this.cases.getCases(projectId, options);
    }

    /**
     * Add a new case to a section.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        return this.cases.addCase(sectionId, payload);
    }

    /**
     * Update an existing case.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
        return this.cases.updateCase(caseId, payload);
    }

    /**
     * Delete a case. Pass `{ soft: true }` for TestRail's server-side
     * preview (`soft=1`) — the API call still happens but nothing is
     * deleted; TestRail returns counts of affected entities.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteCase(caseId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteCase(caseId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteCase(caseId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteCase(caseId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        if (options?.soft === true) {
            return this.cases.deleteCase(caseId, { ...options, soft: true });
        }
        return this.cases.deleteCase(caseId, options as SoftDeleteOptions & { soft?: false });
    }

    /**
     * Bulk-update many cases with the same field values in one API call.
     * @throws {TestRailValidationError} When suiteId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateCases(suiteId: number, payload: UpdateCasesPayload): Promise<Case[]> {
        return this.cases.updateCases(suiteId, payload);
    }

    /**
     * Bulk-delete cases under a suite. `projectId` is required (query param);
     * `options.soft=true` adds `soft=1` for a server-side preview that
     * returns counts without deleting.
     * @throws {TestRailValidationError} When suiteId or projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options: SoftDeleteOptions & { soft: true },
    ): Promise<SoftDeletePreview>;
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options?: SoftDeleteOptions & { soft?: false },
    ): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options: SoftDeleteOptions,
    ): Promise<void | SoftDeletePreview>;
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options?: SoftDeleteOptions,
    ): Promise<void | SoftDeletePreview> {
        // Branch by `soft` so both module overloads resolve cleanly. The public
        // overloads above already gave callers a precise return type — this
        // delegate just routes to the matching module overload at runtime.
        if (options?.soft === true) {
            return this.cases.deleteCases(suiteId, projectId, payload, { ...options, soft: true });
        }
        return this.cases.deleteCases(suiteId, projectId, payload, options as SoftDeleteOptions & { soft?: false });
    }

    /**
     * Copy cases into a target section. Returns the newly created case copies.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async copyCasesToSection(sectionId: number, payload: CopyCasesToSectionPayload): Promise<Case[]> {
        return this.cases.copyCasesToSection(sectionId, payload);
    }

    /**
     * Move cases into a target section. `payload.suite_id` is required.
     * @throws {TestRailValidationError} When sectionId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async moveCasesToSection(sectionId: number, payload: MoveCasesToSectionPayload): Promise<void> {
        return this.cases.moveCasesToSection(sectionId, payload);
    }

    /**
     * Get the edit history for a test case (TestRail 7.5+).
     * @throws {TestRailValidationError} When caseId or pagination params are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getHistoryForCase(caseId: number, options?: GetHistoryForCaseOptions): Promise<HistoryEntry[]> {
        return this.cases.getHistoryForCase(caseId, options);
    }

    // ── Plans ─────────────────────────────────────────────────────────────────

    /**
     * Get a plan by ID.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getPlan(planId: number): Promise<Plan> {
        return this.plans.getPlan(planId);
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
        return this.plans.getPlans(projectId, options);
    }

    /**
     * Add a new plan to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
        return this.plans.addPlan(projectId, payload);
    }

    /**
     * Update a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
        return this.plans.updatePlan(planId, payload);
    }

    /**
     * Close a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async closePlan(planId: number): Promise<Plan> {
        return this.plans.closePlan(planId);
    }

    /**
     * Delete a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deletePlan(planId: number): Promise<void> {
        return this.plans.deletePlan(planId);
    }

    /**
     * Add a plan entry (run) to a plan.
     * @throws {TestRailValidationError} When planId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry> {
        return this.plans.addPlanEntry(planId, payload);
    }

    /**
     * Update an existing plan entry.
     * @throws {TestRailValidationError} When planId is invalid or entryId is not a non-empty string
     * @throws {TestRailApiError} When the API request fails
     */
    async updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry> {
        return this.plans.updatePlanEntry(planId, entryId, payload);
    }

    /**
     * Delete a plan entry.
     * @throws {TestRailValidationError} When planId is invalid or entryId is not a non-empty string
     * @throws {TestRailApiError} When the API request fails
     */
    async deletePlanEntry(planId: number, entryId: string): Promise<void> {
        return this.plans.deletePlanEntry(planId, entryId);
    }

    /**
     * Add a per-config run to an existing plan entry.
     * @throws {TestRailValidationError} When planId is invalid or entryId is not a non-empty string
     * @throws {TestRailApiError} When the API request fails
     */
    async addRunToPlanEntry(planId: number, entryId: string, payload: AddRunToPlanEntryPayload): Promise<Run> {
        return this.plans.addRunToPlanEntry(planId, entryId, payload);
    }

    /**
     * Update a single run inside a plan entry.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateRunInPlanEntry(runId: number, payload: UpdateRunInPlanEntryPayload): Promise<Run> {
        return this.plans.updateRunInPlanEntry(runId, payload);
    }

    /**
     * Delete a single run from a plan entry.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteRunFromPlanEntry(runId: number): Promise<void> {
        return this.plans.deleteRunFromPlanEntry(runId);
    }

    // ── Runs ──────────────────────────────────────────────────────────────────

    /**
     * Get a run by ID.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getRun(runId: number): Promise<Run> {
        return this.runs.getRun(runId);
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
        return this.runs.getRuns(projectId, options);
    }

    /**
     * Add a new run to a project.
     * @throws {TestRailValidationError} When projectId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        return this.runs.addRun(projectId, payload);
    }

    /**
     * Update a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        return this.runs.updateRun(runId, payload);
    }

    /**
     * Close a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async closeRun(runId: number): Promise<Run> {
        return this.runs.closeRun(runId);
    }

    /**
     * Delete a run and all associated test results. Pass `{ soft: true }`
     * for TestRail's server-side preview (`soft=1`).
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteRun(runId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteRun(runId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteRun(runId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteRun(runId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        if (options?.soft === true) {
            return this.runs.deleteRun(runId, { ...options, soft: true });
        }
        return this.runs.deleteRun(runId, options as SoftDeleteOptions & { soft?: false });
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    /**
     * Get a test by ID.
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTest(testId: number): Promise<Test> {
        return this.tests.getTest(testId);
    }

    /**
     * Get all tests for a run with optional filters.
     * @param runId - The run ID
     * @param options - Optional filter parameters (status_id, limit, offset)
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        return this.tests.getTests(runId, options);
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
        return this.results.getResults(testId, options);
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
        return this.results.getResultsForCase(runId, caseId, options);
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
        return this.results.getResultsForRun(runId, options);
    }

    /**
     * Add a result for a test.
     * @throws {TestRailValidationError} When testId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
        return this.results.addResult(testId, payload);
    }

    /**
     * Add a result for a specific case within a run.
     * @throws {TestRailValidationError} When runId or caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResultForCase(runId: number, caseId: number, payload: AddResultPayload): Promise<Result> {
        return this.results.addResultForCase(runId, caseId, payload);
    }

    /**
     * Add multiple results for cases in a run.
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResultsForCases(runId: number, payload: AddResultsForCasesPayload): Promise<Result[]> {
        return this.results.addResultsForCases(runId, payload);
    }

    /**
     * Add multiple results for tests in a run (by test_id).
     * @throws {TestRailValidationError} When runId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addResults(runId: number, payload: AddResultsPayload): Promise<Result[]> {
        return this.results.addResults(runId, payload);
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    /**
     * Get a milestone by ID.
     * @throws {TestRailValidationError} When milestoneId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getMilestone(milestoneId: number): Promise<Milestone> {
        return this.milestones.getMilestone(milestoneId);
    }

    /**
     * Get milestones.
     *
     * @param projectId - Project identifier.
     * @param options - Optional filters and pagination settings.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getMilestones(projectId: number, options?: GetMilestonesOptions): Promise<Milestone[]> {
        return this.milestones.getMilestones(projectId, options);
    }

    /**
     * Add milestone.
     *
     * @param projectId - Project identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone> {
        return this.milestones.addMilestone(projectId, payload);
    }

    /**
     * Update milestone.
     *
     * @param milestoneId - Milestone identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> {
        return this.milestones.updateMilestone(milestoneId, payload);
    }

    /**
     * Delete milestone.
     *
     * @param milestoneId - Milestone identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteMilestone(milestoneId: number): Promise<void> {
        return this.milestones.deleteMilestone(milestoneId);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    /**
     * Get user.
     *
     * @param userId - User identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUser(userId: number): Promise<User> {
        return this.users.getUser(userId);
    }

    /**
     * Get user by email.
     *
     * @param email - Email address to look up.
     * @throws {TestRailValidationError} When email format is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUserByEmail(email: string): Promise<User> {
        return this.users.getUserByEmail(email);
    }

    /**
     * Get users.
     *
     * @param limit - Optional maximum number of results to return.
     * @param offset - Optional number of results to skip before returning results.
     * @param projectId - Optional project identifier to scope results when provided.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getUsers(limit?: number, offset?: number, projectId?: number): Promise<User[]> {
        return this.users.getUsers(limit, offset, projectId);
    }

    /**
     * Get the currently authenticated user.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCurrentUser(): Promise<User> {
        return this.users.getCurrentUser();
    }

    /**
     * Add user.
     *
     * @param payload - Request payload for this operation.
     * @throws {TestRailApiError} When the API request fails
     */
    async addUser(payload: AddUserPayload): Promise<User> {
        return this.users.addUser(payload);
    }

    /**
     * Update user.
     *
     * @param userId - User identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
        return this.users.updateUser(userId, payload);
    }

    // ── Statuses ──────────────────────────────────────────────────────────────

    /**
     * Get statuses.
     * @throws {TestRailApiError} When the API request fails
     */
    async getStatuses(): Promise<Status[]> {
        return this.metadata.getStatuses();
    }

    /**
     * Get case-level lifecycle statuses (draft/approved/etc., TestRail 7.5+).
     * Distinct from `getStatuses()`, which returns result statuses.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCaseStatuses(): Promise<CaseStatus[]> {
        return this.metadata.getCaseStatuses();
    }

    // ── Priorities ────────────────────────────────────────────────────────────

    /**
     * Get priorities.
     * @throws {TestRailApiError} When the API request fails
     */
    async getPriorities(): Promise<Priority[]> {
        return this.metadata.getPriorities();
    }

    // ── Result Fields ─────────────────────────────────────────────────────────

    /**
     * Get result fields.
     * @throws {TestRailApiError} When the API request fails
     */
    async getResultFields(): Promise<ResultField[]> {
        return this.metadata.getResultFields();
    }

    // ── Case Fields & Types ───────────────────────────────────────────────────

    /**
     * Get case fields.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCaseFields(): Promise<CaseField[]> {
        return this.metadata.getCaseFields();
    }

    /**
     * Create a new custom case field (admin-only; TestRail server admin
     * permissions required). `POST add_case_field` — no path/query params;
     * the payload carries `type` + `name` + `label` + `configs[]`. Returns
     * the newly created `CaseField` (with assigned `id`, `system_name`,
     * `display_order`).
     *
     * Field-type-specific server validation (e.g. `Steps` rejects `items`,
     * `name` must be a system slug) is NOT mirrored client-side — the Zod
     * schema is `.passthrough()` so TestRail remains the source of truth on
     * quirks across versions. A 400 from the server surfaces as
     * `TestRailApiError` with the upstream message.
     *
     * @throws {TestRailApiError} When the API request fails (e.g. 403 for
     *   non-admin users, 400 for invalid payload).
     */
    async addCaseField(payload: AddCaseFieldPayload): Promise<CaseField> {
        return this.metadata.addCaseField(payload);
    }

    /**
     * Get case types.
     * @throws {TestRailApiError} When the API request fails
     */
    async getCaseTypes(): Promise<CaseType[]> {
        return this.metadata.getCaseTypes();
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    /**
     * Get templates.
     *
     * @param projectId - Project identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getTemplates(projectId: number): Promise<Template[]> {
        return this.metadata.getTemplates(projectId);
    }

    // ── Configurations ────────────────────────────────────────────────────────

    /**
     * Get configurations.
     *
     * @param projectId - Project identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getConfigurations(projectId: number): Promise<ConfigurationGroup[]> {
        return this.configurations.getConfigurations(projectId);
    }

    /**
     * Add configuration group.
     *
     * @param projectId - Project identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addConfigurationGroup(projectId: number, payload: AddConfigurationGroupPayload): Promise<ConfigurationGroup> {
        return this.configurations.addConfigurationGroup(projectId, payload);
    }

    /**
     * Update configuration group.
     *
     * @param configGroupId - Config group identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateConfigurationGroup(
        configGroupId: number,
        payload: UpdateConfigurationGroupPayload,
    ): Promise<ConfigurationGroup> {
        return this.configurations.updateConfigurationGroup(configGroupId, payload);
    }

    /**
     * Delete configuration group.
     *
     * @param configGroupId - Config group identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteConfigurationGroup(configGroupId: number): Promise<void> {
        return this.configurations.deleteConfigurationGroup(configGroupId);
    }

    /**
     * Add configuration.
     *
     * @param configGroupId - Config group identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addConfiguration(configGroupId: number, payload: AddConfigurationPayload): Promise<Configuration> {
        return this.configurations.addConfiguration(configGroupId, payload);
    }

    /**
     * Update configuration.
     *
     * @param configId - Config identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateConfiguration(configId: number, payload: UpdateConfigurationPayload): Promise<Configuration> {
        return this.configurations.updateConfiguration(configId, payload);
    }

    /**
     * Delete configuration.
     *
     * @param configId - Config identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteConfiguration(configId: number): Promise<void> {
        return this.configurations.deleteConfiguration(configId);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    /**
     * Get roles.
     * @throws {TestRailApiError} When the API request fails
     */
    async getRoles(): Promise<Role[]> {
        return this.metadata.getRoles();
    }

    // ── Groups ────────────────────────────────────────────────────────────────

    /**
     * Get group.
     *
     * @param groupId - Group identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getGroup(groupId: number): Promise<Group> {
        return this.users.getGroup(groupId);
    }

    /**
     * Get groups.
     * @throws {TestRailApiError} When the API request fails
     */
    async getGroups(): Promise<Group[]> {
        return this.users.getGroups();
    }

    /**
     * Add group.
     *
     * @param payload - Request payload for this operation.
     * @throws {TestRailApiError} When the API request fails
     */
    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.users.addGroup(payload);
    }

    /**
     * Update group.
     *
     * @param groupId - Group identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        return this.users.updateGroup(groupId, payload);
    }

    /**
     * Delete group.
     *
     * @param groupId - Group identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteGroup(groupId: number): Promise<void> {
        return this.users.deleteGroup(groupId);
    }

    // ── Attachments ───────────────────────────────────────────────────────────

    /**
     * Get attachments for case.
     *
     * @param caseId - Case identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForCase(caseId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForCase(caseId);
    }

    /**
     * Get attachments for run.
     *
     * @param runId - Run identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForRun(runId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForRun(runId);
    }

    /**
     * Get attachments for test.
     *
     * @param testId - Test identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForTest(testId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForTest(testId);
    }

    /**
     * Get attachments for plan.
     *
     * @param planId - Plan identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForPlan(planId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForPlan(planId);
    }

    /**
     * Get attachments for plan entry.
     *
     * @param planId - Plan identifier.
     * @param entryId - Plan entry identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachmentsForPlanEntry(planId: number, entryId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForPlanEntry(planId, entryId);
    }

    /**
     * Download an attachment by ID.
     *
     * @param attachmentId - Attachment identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getAttachment(attachmentId: number): Promise<ArrayBuffer> {
        return this.attachments.getAttachment(attachmentId);
    }

    /**
     * Add attachment to case.
     *
     * @param caseId - Case identifier.
     * @param file - Attachment contents to upload.
     * @param filename - Filename to send with the uploaded attachment.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToCase(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToCase(caseId, file, filename);
    }

    /**
     * Add attachment to result.
     *
     * @param resultId - Result identifier.
     * @param file - Attachment contents to upload.
     * @param filename - Filename to send with the uploaded attachment.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToResult(
        resultId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToResult(resultId, file, filename);
    }

    /**
     * Add attachment to run.
     *
     * @param runId - Run identifier.
     * @param file - Attachment contents to upload.
     * @param filename - Filename to send with the uploaded attachment.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToRun(
        runId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToRun(runId, file, filename);
    }

    /**
     * Add attachment to plan.
     *
     * @param planId - Plan identifier.
     * @param file - Attachment contents to upload.
     * @param filename - Filename to send with the uploaded attachment.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToPlan(
        planId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToPlan(planId, file, filename);
    }

    /**
     * Add attachment to plan entry.
     *
     * @param planId - Plan identifier.
     * @param entryId - Plan entry identifier.
     * @param file - Attachment contents to upload.
     * @param filename - Filename to send with the uploaded attachment.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addAttachmentToPlanEntry(
        planId: number,
        entryId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToPlanEntry(planId, entryId, file, filename);
    }

    /**
     * Delete attachment.
     *
     * @param attachmentId - Attachment identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteAttachment(attachmentId: number): Promise<void> {
        return this.attachments.deleteAttachment(attachmentId);
    }

    // ── BDDs ──────────────────────────────────────────────────────────────────

    /**
     * Get the BDD (Gherkin `.feature`) content for a case as raw text.
     *
     * Unlike most endpoints this returns text, not JSON — the response is the
     * `.feature` file body (Gherkin syntax). Returns an empty string when the
     * case has no BDD content. TestRail 7.5+.
     *
     * @param caseId - Case identifier.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getBdd(caseId: number): Promise<string> {
        return this.bdd.getBdd(caseId);
    }

    /**
     * Upload a `.feature` file to a case as its BDD content. TestRail 7.5+.
     *
     * @param caseId - Case identifier.
     * @param file - `.feature` file contents to upload (Gherkin).
     * @param filename - Filename to send with the multipart upload.
     * @throws {TestRailValidationError} When caseId is invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addBdd(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Case> {
        return this.bdd.addBdd(caseId, file, filename);
    }

    // ── Shared Steps ──────────────────────────────────────────────────────────

    /**
     * Get shared step.
     *
     * @param sharedStepId - Shared step identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        return this.sharedSteps.getSharedStep(sharedStepId);
    }

    /**
     * Get shared steps.
     *
     * @param projectId - Project identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSharedSteps(projectId: number): Promise<SharedStep[]> {
        return this.sharedSteps.getSharedSteps(projectId);
    }

    /**
     * Add shared step.
     *
     * @param projectId - Project identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        return this.sharedSteps.addSharedStep(projectId, payload);
    }

    /**
     * Update shared step.
     *
     * @param sharedStepId - Shared step identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        return this.sharedSteps.updateSharedStep(sharedStepId, payload);
    }

    /**
     * Delete shared step.
     *
     * @param sharedStepId - Shared step identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteSharedStep(sharedStepId: number): Promise<void> {
        return this.sharedSteps.deleteSharedStep(sharedStepId);
    }

    /**
     * Get history for a shared step (paginated).
     * @throws {TestRailValidationError} When sharedStepId or pagination params are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getSharedStepHistory(sharedStepId: number, options?: GetSharedStepHistoryOptions): Promise<HistoryEntry[]> {
        return this.sharedSteps.getSharedStepHistory(sharedStepId, options);
    }

    // ── Variables ─────────────────────────────────────────────────────────────

    /**
     * Get variables.
     *
     * @param projectId - Project identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getVariables(projectId: number): Promise<Variable[]> {
        return this.variables.getVariables(projectId);
    }

    /**
     * Add variable.
     *
     * @param projectId - Project identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addVariable(projectId: number, payload: AddVariablePayload): Promise<Variable> {
        return this.variables.addVariable(projectId, payload);
    }

    /**
     * Update variable.
     *
     * @param variableId - Variable identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateVariable(variableId: number, payload: UpdateVariablePayload): Promise<Variable> {
        return this.variables.updateVariable(variableId, payload);
    }

    /**
     * Delete variable.
     *
     * @param variableId - Variable identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteVariable(variableId: number): Promise<void> {
        return this.variables.deleteVariable(variableId);
    }

    // ── Datasets ──────────────────────────────────────────────────────────────

    /**
     * Get dataset.
     *
     * @param datasetId - Dataset identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getDataset(datasetId: number): Promise<Dataset> {
        return this.datasets.getDataset(datasetId);
    }

    /**
     * Get datasets.
     *
     * @param projectId - Project identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getDatasets(projectId: number): Promise<Dataset[]> {
        return this.datasets.getDatasets(projectId);
    }

    /**
     * Add dataset.
     *
     * @param projectId - Project identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async addDataset(projectId: number, payload: AddDatasetPayload): Promise<Dataset> {
        return this.datasets.addDataset(projectId, payload);
    }

    /**
     * Update dataset.
     *
     * @param datasetId - Dataset identifier.
     * @param payload - Request payload for this operation.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async updateDataset(datasetId: number, payload: UpdateDatasetPayload): Promise<Dataset> {
        return this.datasets.updateDataset(datasetId, payload);
    }

    /**
     * Delete dataset.
     *
     * @param datasetId - Dataset identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async deleteDataset(datasetId: number): Promise<void> {
        return this.datasets.deleteDataset(datasetId);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    /**
     * Get reports.
     *
     * @param projectId - Project identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async getReports(projectId: number): Promise<Report[]> {
        return this.reports.getReports(projectId);
    }

    /**
     * Run report.
     *
     * @param reportTemplateId - Report template identifier.
     * @throws {TestRailValidationError} When identifiers or request parameters are invalid
     * @throws {TestRailApiError} When the API request fails
     */
    async runReport(reportTemplateId: number): Promise<ReportResult> {
        return this.reports.runReport(reportTemplateId);
    }
}
