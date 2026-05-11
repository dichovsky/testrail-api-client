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
        this.sharedSteps = new SharedStepModule(this);
        this.variables = new VariableModule(this);
        this.datasets = new DatasetModule(this);
        this.reports = new ReportModule(this);
    }

    // ── Projects ──────────────────────────────────────────────────────────────

    async getProject(projectId: number): Promise<Project> {
        return this.projects.getProject(projectId);
    }

    async getProjects(limit?: number, offset?: number): Promise<Project[]> {
        return this.projects.getProjects(limit, offset);
    }

    async addProject(payload: AddProjectPayload): Promise<Project> {
        return this.projects.addProject(payload);
    }

    async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project> {
        return this.projects.updateProject(projectId, payload);
    }

    async deleteProject(projectId: number): Promise<void> {
        return this.projects.deleteProject(projectId);
    }

    // ── Suites ────────────────────────────────────────────────────────────────

    async getSuite(suiteId: number): Promise<Suite> {
        return this.suites.getSuite(suiteId);
    }

    async getSuites(projectId: number): Promise<Suite[]> {
        return this.suites.getSuites(projectId);
    }

    async addSuite(projectId: number, payload: AddSuitePayload): Promise<Suite> {
        return this.suites.addSuite(projectId, payload);
    }

    async updateSuite(suiteId: number, payload: UpdateSuitePayload): Promise<Suite> {
        return this.suites.updateSuite(suiteId, payload);
    }

    async deleteSuite(suiteId: number): Promise<void> {
        return this.suites.deleteSuite(suiteId);
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    async getSection(sectionId: number): Promise<Section> {
        return this.sections.getSection(sectionId);
    }

    async getSections(
        projectId: number,
        options?: { suiteId?: number; limit?: number; offset?: number },
    ): Promise<Section[]> {
        return this.sections.getSections(projectId, options);
    }

    async addSection(projectId: number, payload: AddSectionPayload): Promise<Section> {
        return this.sections.addSection(projectId, payload);
    }

    async updateSection(sectionId: number, payload: UpdateSectionPayload): Promise<Section> {
        return this.sections.updateSection(sectionId, payload);
    }

    async deleteSection(sectionId: number): Promise<void> {
        return this.sections.deleteSection(sectionId);
    }

    // ── Cases ─────────────────────────────────────────────────────────────────

    async getCase(caseId: number): Promise<Case> {
        return this.cases.getCase(caseId);
    }

    async getCases(projectId: number, options?: GetCasesOptions): Promise<Case[]> {
        return this.cases.getCases(projectId, options);
    }

    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        return this.cases.addCase(sectionId, payload);
    }

    async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
        return this.cases.updateCase(caseId, payload);
    }

    async deleteCase(caseId: number): Promise<void> {
        return this.cases.deleteCase(caseId);
    }

    // ── Plans ─────────────────────────────────────────────────────────────────

    async getPlan(planId: number): Promise<Plan> {
        return this.plans.getPlan(planId);
    }

    async getPlans(projectId: number, options?: GetPlansOptions): Promise<Plan[]> {
        return this.plans.getPlans(projectId, options);
    }

    async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
        return this.plans.addPlan(projectId, payload);
    }

    async updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
        return this.plans.updatePlan(planId, payload);
    }

    async closePlan(planId: number): Promise<Plan> {
        return this.plans.closePlan(planId);
    }

    async deletePlan(planId: number): Promise<void> {
        return this.plans.deletePlan(planId);
    }

    async addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry> {
        return this.plans.addPlanEntry(planId, payload);
    }

    async updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry> {
        return this.plans.updatePlanEntry(planId, entryId, payload);
    }

    async deletePlanEntry(planId: number, entryId: string): Promise<void> {
        return this.plans.deletePlanEntry(planId, entryId);
    }

    // ── Runs ──────────────────────────────────────────────────────────────────

    async getRun(runId: number): Promise<Run> {
        return this.runs.getRun(runId);
    }

    async getRuns(projectId: number, options?: GetRunsOptions): Promise<Run[]> {
        return this.runs.getRuns(projectId, options);
    }

    async addRun(projectId: number, payload: AddRunPayload): Promise<Run> {
        return this.runs.addRun(projectId, payload);
    }

    async updateRun(runId: number, payload: UpdateRunPayload): Promise<Run> {
        return this.runs.updateRun(runId, payload);
    }

    async closeRun(runId: number): Promise<Run> {
        return this.runs.closeRun(runId);
    }

    async deleteRun(runId: number): Promise<void> {
        return this.runs.deleteRun(runId);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    async getTest(testId: number): Promise<Test> {
        return this.tests.getTest(testId);
    }

    async getTests(runId: number, options?: GetTestsOptions): Promise<Test[]> {
        return this.tests.getTests(runId, options);
    }

    // ── Results ───────────────────────────────────────────────────────────────

    async getResults(testId: number, options?: GetResultsOptions): Promise<Result[]> {
        return this.results.getResults(testId, options);
    }

    async getResultsForCase(runId: number, caseId: number, options?: GetResultsOptions): Promise<Result[]> {
        return this.results.getResultsForCase(runId, caseId, options);
    }

    async getResultsForRun(runId: number, options?: GetResultsOptions): Promise<Result[]> {
        return this.results.getResultsForRun(runId, options);
    }

    async addResult(testId: number, payload: AddResultPayload): Promise<Result> {
        return this.results.addResult(testId, payload);
    }

    async addResultForCase(runId: number, caseId: number, payload: AddResultPayload): Promise<Result> {
        return this.results.addResultForCase(runId, caseId, payload);
    }

    async addResultsForCases(runId: number, payload: AddResultsForCasesPayload): Promise<Result[]> {
        return this.results.addResultsForCases(runId, payload);
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    async getMilestone(milestoneId: number): Promise<Milestone> {
        return this.milestones.getMilestone(milestoneId);
    }

    async getMilestones(projectId: number, options?: GetMilestonesOptions): Promise<Milestone[]> {
        return this.milestones.getMilestones(projectId, options);
    }

    async addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone> {
        return this.milestones.addMilestone(projectId, payload);
    }

    async updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> {
        return this.milestones.updateMilestone(milestoneId, payload);
    }

    async deleteMilestone(milestoneId: number): Promise<void> {
        return this.milestones.deleteMilestone(milestoneId);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    async getUser(userId: number): Promise<User> {
        return this.users.getUser(userId);
    }

    async getUserByEmail(email: string): Promise<User> {
        return this.users.getUserByEmail(email);
    }

    async getUsers(limit?: number, offset?: number, projectId?: number): Promise<User[]> {
        return this.users.getUsers(limit, offset, projectId);
    }

    async getCurrentUser(): Promise<User> {
        return this.users.getCurrentUser();
    }

    async addUser(payload: AddUserPayload): Promise<User> {
        return this.users.addUser(payload);
    }

    async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
        return this.users.updateUser(userId, payload);
    }

    // ── Statuses ──────────────────────────────────────────────────────────────

    async getStatuses(): Promise<Status[]> {
        return this.metadata.getStatuses();
    }

    // ── Priorities ────────────────────────────────────────────────────────────

    async getPriorities(): Promise<Priority[]> {
        return this.metadata.getPriorities();
    }

    // ── Result Fields ─────────────────────────────────────────────────────────

    async getResultFields(): Promise<ResultField[]> {
        return this.metadata.getResultFields();
    }

    // ── Case Fields & Types ───────────────────────────────────────────────────

    async getCaseFields(): Promise<CaseField[]> {
        return this.metadata.getCaseFields();
    }

    async getCaseTypes(): Promise<CaseType[]> {
        return this.metadata.getCaseTypes();
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    async getTemplates(projectId: number): Promise<Template[]> {
        return this.metadata.getTemplates(projectId);
    }

    // ── Configurations ────────────────────────────────────────────────────────

    async getConfigurations(projectId: number): Promise<ConfigurationGroup[]> {
        return this.configurations.getConfigurations(projectId);
    }

    async addConfigurationGroup(projectId: number, payload: AddConfigurationGroupPayload): Promise<ConfigurationGroup> {
        return this.configurations.addConfigurationGroup(projectId, payload);
    }

    async updateConfigurationGroup(
        configGroupId: number,
        payload: UpdateConfigurationGroupPayload,
    ): Promise<ConfigurationGroup> {
        return this.configurations.updateConfigurationGroup(configGroupId, payload);
    }

    async deleteConfigurationGroup(configGroupId: number): Promise<void> {
        return this.configurations.deleteConfigurationGroup(configGroupId);
    }

    async addConfiguration(configGroupId: number, payload: AddConfigurationPayload): Promise<Configuration> {
        return this.configurations.addConfiguration(configGroupId, payload);
    }

    async updateConfiguration(configId: number, payload: UpdateConfigurationPayload): Promise<Configuration> {
        return this.configurations.updateConfiguration(configId, payload);
    }

    async deleteConfiguration(configId: number): Promise<void> {
        return this.configurations.deleteConfiguration(configId);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    async getRoles(): Promise<Role[]> {
        return this.metadata.getRoles();
    }

    // ── Groups ────────────────────────────────────────────────────────────────

    async getGroup(groupId: number): Promise<Group> {
        return this.users.getGroup(groupId);
    }

    async getGroups(): Promise<Group[]> {
        return this.users.getGroups();
    }

    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.users.addGroup(payload);
    }

    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        return this.users.updateGroup(groupId, payload);
    }

    async deleteGroup(groupId: number): Promise<void> {
        return this.users.deleteGroup(groupId);
    }

    // ── Attachments ───────────────────────────────────────────────────────────

    async getAttachmentsForCase(caseId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForCase(caseId);
    }

    async getAttachmentsForRun(runId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForRun(runId);
    }

    async getAttachmentsForTest(testId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForTest(testId);
    }

    async getAttachmentsForPlan(planId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForPlan(planId);
    }

    async getAttachmentsForPlanEntry(planId: number, entryId: number): Promise<Attachment[]> {
        return this.attachments.getAttachmentsForPlanEntry(planId, entryId);
    }

    async getAttachment(attachmentId: number): Promise<ArrayBuffer> {
        return this.attachments.getAttachment(attachmentId);
    }

    async addAttachmentToCase(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToCase(caseId, file, filename);
    }

    async addAttachmentToResult(
        resultId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToResult(resultId, file, filename);
    }

    async addAttachmentToRun(
        runId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToRun(runId, file, filename);
    }

    async addAttachmentToPlan(
        planId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToPlan(planId, file, filename);
    }

    async addAttachmentToPlanEntry(
        planId: number,
        entryId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        return this.attachments.addAttachmentToPlanEntry(planId, entryId, file, filename);
    }

    async deleteAttachment(attachmentId: number): Promise<void> {
        return this.attachments.deleteAttachment(attachmentId);
    }

    // ── Shared Steps ──────────────────────────────────────────────────────────

    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        return this.sharedSteps.getSharedStep(sharedStepId);
    }

    async getSharedSteps(projectId: number): Promise<SharedStep[]> {
        return this.sharedSteps.getSharedSteps(projectId);
    }

    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        return this.sharedSteps.addSharedStep(projectId, payload);
    }

    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        return this.sharedSteps.updateSharedStep(sharedStepId, payload);
    }

    async deleteSharedStep(sharedStepId: number): Promise<void> {
        return this.sharedSteps.deleteSharedStep(sharedStepId);
    }

    // ── Variables ─────────────────────────────────────────────────────────────

    async getVariables(projectId: number): Promise<Variable[]> {
        return this.variables.getVariables(projectId);
    }

    async addVariable(projectId: number, payload: AddVariablePayload): Promise<Variable> {
        return this.variables.addVariable(projectId, payload);
    }

    async updateVariable(variableId: number, payload: UpdateVariablePayload): Promise<Variable> {
        return this.variables.updateVariable(variableId, payload);
    }

    async deleteVariable(variableId: number): Promise<void> {
        return this.variables.deleteVariable(variableId);
    }

    // ── Datasets ──────────────────────────────────────────────────────────────

    async getDataset(datasetId: number): Promise<Dataset> {
        return this.datasets.getDataset(datasetId);
    }

    async getDatasets(projectId: number): Promise<Dataset[]> {
        return this.datasets.getDatasets(projectId);
    }

    async addDataset(projectId: number, payload: AddDatasetPayload): Promise<Dataset> {
        return this.datasets.addDataset(projectId, payload);
    }

    async updateDataset(datasetId: number, payload: UpdateDatasetPayload): Promise<Dataset> {
        return this.datasets.updateDataset(datasetId, payload);
    }

    async deleteDataset(datasetId: number): Promise<void> {
        return this.datasets.deleteDataset(datasetId);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    async getReports(projectId: number): Promise<Report[]> {
        return this.reports.getReports(projectId);
    }

    async runReport(reportTemplateId: number): Promise<ReportResult> {
        return this.reports.runReport(reportTemplateId);
    }
}
