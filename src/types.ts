/**
 * TestRail API client configuration options
 */
export interface TestRailConfig {
    /** TestRail instance URL (e.g., https://example.testrail.io) */
    baseUrl: string;
    /** TestRail user email for authentication */
    email: string;
    /** TestRail API key or password */
    apiKey: string;
    /** Request timeout in milliseconds (default: 30000ms) */
    timeout?: number;
    /** Maximum number of retry attempts for failed requests (default: 3) */
    maxRetries?: number;
    /** Enable caching for static resources (default: true) */
    enableCache?: boolean;
    /** Cache TTL in milliseconds (default: 300000ms = 5 minutes) */
    cacheTtl?: number;
    /**
     * Cache cleanup interval in milliseconds (default: 60000ms = 1 minute).
     * Set to 0 to disable periodic cleanup.
     */
    cacheCleanupInterval?: number;
    /**
     * Maximum number of entries in the cache (default: 1000).
     * Set to 0 for unlimited (not recommended).
     */
    maxCacheSize?: number;
    /** Rate limiting configuration (default: 100 requests per minute) */
    rateLimiter?: RateLimiterConfig;
    /**
     * Allow HTTP (non-TLS) connections. Credentials are sent in cleartext over HTTP.
     * Only enable in isolated development environments. Default: false.
     */
    allowInsecure?: boolean;
    /**
     * Allow requests to private/loopback/link-local hosts (e.g. localhost, 192.168.x.x).
     * Only enable when TestRail is hosted on a private network. Default: false.
     */
    allowPrivateHosts?: boolean;
}

export interface PaginatedResponse<T = unknown> {
    /** Offset of the returned page */
    offset: number;
    /** Limit of the returned page */
    limit: number;
    /** Number of items in this page */
    size: number;
    /** Optional links/pagination metadata returned by TestRail */
    _links?: Record<string, unknown>;
    /** Page items when the API returns items under a consistent key */
    items?: T[];
}

export interface Case {
    id: number;
    title: string;
    section_id: number;
    template_id?: number;
    type_id?: number;
    priority_id?: number;
    milestone_id?: number;
    refs?: string;
    created_by: number;
    created_on: number; // Unix timestamp
    updated_by: number;
    updated_on: number; // Unix timestamp
    estimate?: string; // e.g. "5m"
    estimate_forecast?: string;
    suite_id: number;
    display_order?: number;
    is_deleted?: number;
    custom_fields?: Record<string, unknown>;
}

export interface Suite {
    id: number;
    name: string;
    description?: string;
    project_id: number;
    is_master?: boolean;
    is_baseline?: boolean;
    is_completed?: boolean;
    completed_on?: number; // Unix timestamp
    url: string;
}

export interface AddSuitePayload {
    name: string;
    description?: string;
}

export interface UpdateSuitePayload {
    name?: string;
    description?: string;
}

export interface Section {
    id: number;
    suite_id: number;
    name: string;
    description?: string;
    parent_id?: number;
    display_order: number;
    depth: number;
}

export interface Project {
    id: number;
    name: string;
    announcement?: string;
    show_announcement?: boolean;
    is_completed?: boolean;
    completed_on?: number; // Unix timestamp
    /** 1=single suite, 2=single suite+baselines, 3=multiple suites */
    suite_mode: number;
    url: string;
}

export interface Plan {
    id: number;
    name: string;
    description?: string;
    milestone_id?: number;
    assignedto_id?: number;
    is_completed: boolean;
    completed_on?: number; // Unix timestamp
    passed_count: number;
    blocked_count: number;
    untested_count: number;
    retest_count: number;
    failed_count: number;
    custom_status1_count?: number;
    custom_status2_count?: number;
    custom_status3_count?: number;
    custom_status4_count?: number;
    custom_status5_count?: number;
    custom_status6_count?: number;
    custom_status7_count?: number;
    project_id: number;
    created_on: number; // Unix timestamp
    created_by: number;
    url: string;
    entries?: PlanEntry[];
}

export interface PlanEntry {
    id: string; // GUID
    suite_id: number;
    name: string;
    description?: string;
    assignedto_id?: number;
    include_all: boolean;
    case_ids?: number[];
    config_ids?: number[];
    runs: Run[];
}

export interface Run {
    id: number;
    suite_id: number;
    name: string;
    description?: string;
    milestone_id?: number;
    assignedto_id?: number;
    include_all: boolean;
    is_completed: boolean;
    completed_on?: number; // Unix timestamp
    config?: string;
    config_ids?: number[];
    passed_count: number;
    blocked_count: number;
    untested_count: number;
    retest_count: number;
    failed_count: number;
    custom_status1_count?: number;
    custom_status2_count?: number;
    custom_status3_count?: number;
    custom_status4_count?: number;
    custom_status5_count?: number;
    custom_status6_count?: number;
    custom_status7_count?: number;
    project_id: number;
    plan_id?: number;
    created_on: number; // Unix timestamp
    created_by: number;
    refs?: string;
    url: string;
}

export interface Test {
    id: number;
    case_id: number;
    status_id: number;
    assignedto_id?: number;
    run_id: number;
    title: string;
    template_id?: number;
    type_id?: number;
    priority_id?: number;
    estimate?: string;
    estimate_forecast?: string;
    refs?: string;
    milestone_id?: number;
    custom_fields?: Record<string, unknown>;
}

export interface Result {
    id?: number;
    test_id?: number;
    /** e.g., 1=Passed */
    status_id: number;
    comment?: string;
    version?: string;
    elapsed?: string; // e.g. "5m 30s"
    defects?: string;
    assignedto_id?: number;
    created_by?: number;
    created_on?: number; // Unix timestamp
    custom_fields?: Record<string, unknown>;
}

export interface Milestone {
    id: number;
    name: string;
    description?: string;
    start_on?: number; // Unix timestamp
    started_on?: number; // Unix timestamp
    is_completed: boolean;
    completed_on?: number; // Unix timestamp
    due_on?: number; // Unix timestamp
    project_id: number;
    parent_id?: number;
    refs?: string;
    url: string;
    milestones?: Milestone[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role_id?: number;
    role?: string;
}

export interface Status {
    id: number;
    name: string;
    label: string;
    color_dark: number;
    color_medium: number;
    color_bright: number;
    is_system: boolean;
    is_untested: boolean;
    is_final: boolean;
}

export interface Priority {
    id: number;
    name: string;
    short_name: string;
    is_default: boolean;
    priority: number; // weight/level
}

export interface AddCasePayload {
    title: string;
    template_id?: number;
    type_id?: number;
    priority_id?: number;
    estimate?: string;
    milestone_id?: number;
    refs?: string;
    custom_fields?: Record<string, unknown>;
}

export interface UpdateCasePayload {
    title?: string;
    template_id?: number;
    type_id?: number;
    priority_id?: number;
    estimate?: string;
    milestone_id?: number;
    refs?: string;
    custom_fields?: Record<string, unknown>;
}

/**
 * Filter options for `getCases()`.
 * All date filters accept Unix timestamps (seconds since epoch).
 */
export interface GetCasesOptions {
    /** Return only cases belonging to this suite */
    suiteId?: number;
    /** Return only cases in this section */
    sectionId?: number;
    /** Return only cases of this type (from `getCaseTypes()`) */
    typeId?: number;
    /** Return only cases with this priority (from `getPriorities()`) */
    priorityId?: number;
    /** Return only cases using this template (from `getTemplates()`) */
    templateId?: number;
    /** Return only cases linked to this milestone */
    milestoneId?: number;
    /** Return only cases created after this Unix timestamp */
    createdAfter?: number;
    /** Return only cases created before this Unix timestamp */
    createdBefore?: number;
    /** Return only cases updated after this Unix timestamp */
    updatedAfter?: number;
    /** Return only cases updated before this Unix timestamp */
    updatedBefore?: number;
    /** Maximum number of cases to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface AddPlanPayload {
    name: string;
    description?: string;
    milestone_id?: number;
    entries?: AddPlanEntryPayload[];
}

export interface UpdatePlanPayload {
    name?: string;
    description?: string;
    milestone_id?: number;
    assignedto_id?: number;
}

export interface AddPlanEntryPayload {
    suite_id: number;
    name?: string;
    description?: string;
    assignedto_id?: number;
    include_all?: boolean;
    case_ids?: number[];
    config_ids?: number[];
    runs?: AddRunPayload[];
}

export interface UpdatePlanEntryPayload {
    suite_id?: number;
    name?: string;
    description?: string;
    assignedto_id?: number;
    include_all?: boolean;
    case_ids?: number[];
    config_ids?: number[];
    runs?: AddRunPayload[];
}

export interface AddRunPayload {
    suite_id?: number;
    name: string;
    description?: string;
    milestone_id?: number;
    assignedto_id?: number;
    include_all?: boolean;
    case_ids?: number[];
    refs?: string;
}

export interface UpdateRunPayload {
    name?: string;
    description?: string;
    milestone_id?: number;
    assignedto_id?: number;
    include_all?: boolean;
    case_ids?: number[];
    refs?: string;
}

export interface AddResultPayload {
    /** e.g., 1=Passed */
    status_id: number;
    comment?: string;
    version?: string;
    elapsed?: string; // e.g. "5m 30s"
    defects?: string;
    assignedto_id?: number;
    custom_fields?: Record<string, unknown>;
}

export interface AddResultsForCasesPayload {
    results: AddResultForCasePayload[];
}

export interface AddResultForCasePayload extends AddResultPayload {
    case_id: number;
}

export interface AddSectionPayload {
    name: string;
    suite_id?: number;
    parent_id?: number;
    description?: string;
}

export interface UpdateSectionPayload {
    name?: string;
    description?: string;
}

export interface AddMilestonePayload {
    name: string;
    description?: string;
    /** Unix timestamp */
    due_on?: number;
    /** Unix timestamp */
    start_on?: number;
    parent_id?: number;
    refs?: string;
}

export interface UpdateMilestonePayload {
    name?: string;
    description?: string;
    /** Unix timestamp */
    due_on?: number;
    /** Unix timestamp */
    start_on?: number;
    parent_id?: number;
    refs?: string;
    is_completed?: boolean;
    is_started?: boolean;
}

export interface GetRunsOptions {
    /** Return only runs created after this Unix timestamp */
    createdAfter?: number;
    /** Return only runs created before this Unix timestamp */
    createdBefore?: number;
    /** Return only runs created by these user IDs (comma-separated list accepted by the API) */
    createdBy?: number[];
    /** `true` to return only completed runs, `false` for active runs */
    isCompleted?: boolean;
    /** Return only runs linked to this milestone ID */
    milestoneId?: number;
    /** Return only runs whose refs field contains this string */
    refsFilter?: string;
    /** Return only runs for this suite ID */
    suiteId?: number;
    /** Maximum number of runs to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface ResultFieldConfig {
    context: {
        is_global: boolean;
        project_ids: number[];
    };
    options: {
        is_required: boolean;
        default_value: string;
        items?: string;
        format?: string;
        rows?: string;
    };
}

export interface ResultField {
    id: number;
    /** System-level name, e.g. "custom_defects" */
    system_name: string;
    /** Human-readable label */
    label: string;
    /** Short name used as the key in result payloads */
    name: string;
    /** Field type identifier (1=String, 2=Integer, 3=Text, 5=Checkbox, 6=Dropdown, …) */
    type_id: number;
    display_order: number;
    /** One or more context/options configurations */
    configs: ResultFieldConfig[];
    is_active: boolean;
    include_all: boolean;
    template_ids: number[];
    description?: string;
}

// ── Case Fields & Types ───────────────────────────────────────────────────────

/** Context/options configuration block shared by CaseField entries */
export interface CaseFieldConfig {
    context: {
        is_global: boolean;
        project_ids: number[];
    };
    options: {
        is_required: boolean;
        default_value: string;
        items?: string;
        format?: string;
        rows?: string;
    };
}

/** Custom case field definition returned by get_case_fields */
export interface CaseField {
    id: number;
    /** System-level name, e.g. "custom_steps" */
    system_name: string;
    /** Human-readable label */
    label: string;
    /** Short name used as the key in case payloads */
    name: string;
    /** Field type identifier (1=String, 2=Integer, 3=Text, 5=Checkbox, 6=Dropdown, …) */
    type_id: number;
    display_order: number;
    /** One or more context/options configurations */
    configs: CaseFieldConfig[];
    is_active: boolean;
    include_all: boolean;
    template_ids: number[];
    description?: string;
}

/** Case type definition returned by get_case_types */
export interface CaseType {
    id: number;
    name: string;
    is_default: boolean;
}

// ── Templates ─────────────────────────────────────────────────────────────────

/** Case template returned by get_templates (requires TestRail 5.2+) */
export interface Template {
    id: number;
    name: string;
    is_default: boolean;
}

// ── Configurations ────────────────────────────────────────────────────────────

/** An individual configuration (e.g. "Windows 10", "Chrome") within a group */
export interface Configuration {
    id: number;
    name: string;
    group_id: number;
}

/** A configuration group (e.g. "Operating Systems", "Browsers") */
export interface ConfigurationGroup {
    id: number;
    name: string;
    project_id: number;
    configs: Configuration[];
}

export interface AddConfigurationGroupPayload {
    /** Name of the new configuration group */
    name: string;
}

export interface UpdateConfigurationGroupPayload {
    /** New name for the configuration group */
    name?: string;
}

export interface AddConfigurationPayload {
    /** Name of the new configuration */
    name: string;
}

export interface UpdateConfigurationPayload {
    /** New name for the configuration */
    name?: string;
}

export interface CacheEntry<T> {
    data: T;
    expiry: number; // Unix timestamp in ms
}

export interface RateLimiterConfig {
    maxRequests: number;
    windowMs: number;
}

export interface AddProjectPayload {
    name: string;
    announcement?: string;
    show_announcement?: boolean;
    suite_mode?: number;
}

export interface UpdateProjectPayload {
    name?: string;
    announcement?: string;
    show_announcement?: boolean;
    suite_mode?: number;
}

/**
 * Filter options for `getPlans()`.
 * All date filters accept Unix timestamps (seconds).
 */
export interface GetPlansOptions {
    /** Only return plans created after this Unix timestamp */
    created_after?: number;
    /** Only return plans created before this Unix timestamp */
    created_before?: number;
    /** Only return plans created by these user IDs */
    created_by?: number[];
    /** Filter by completion status: 1 = completed, 0 = active */
    is_completed?: 0 | 1;
    /** Only return plans with these milestone IDs */
    milestone_id?: number[];
    /** Maximum number of plans to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Filter options for `getTests()`.
 */
export interface GetTestsOptions {
    /** Only return tests with these status IDs */
    status_id?: number[];
    /** Maximum number of tests to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`.
 * All date filters accept Unix timestamps (seconds).
 */
export interface GetResultsOptions {
    /** Only return results created after this Unix timestamp */
    created_after?: number;
    /** Only return results created before this Unix timestamp */
    created_before?: number;
    /** Only return results created by these user IDs */
    created_by?: number[];
    /** Only return results with these status IDs */
    status_id?: number[];
    /** Maximum number of results to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Filter options for `getMilestones()`.
 */
export interface GetMilestonesOptions {
    /** Filter by completion status: 1 = completed, 0 = active */
    is_completed?: 0 | 1;
    /** Maximum number of milestones to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

// ── User Management (TASK-024, requires TestRail 7.3+) ────────────────────────

/** Payload for creating a new user via POST /add_user (TestRail 7.3+) */
export interface AddUserPayload {
    /** User's email address */
    email: string;
    /** User's full name */
    name: string;
    /** Whether the user account is active (default: true) */
    is_active?: boolean;
    /** Role ID to assign to the user */
    role_id?: number;
    /** Password for the new user */
    password?: string;
}

/** Payload for updating an existing user via POST /update_user/{user_id} (TestRail 7.3+) */
export interface UpdateUserPayload {
    /** User's email address */
    email?: string;
    /** User's full name */
    name?: string;
    /** Whether the user account is active */
    is_active?: boolean;
    /** Role ID to assign to the user */
    role_id?: number;
    /** New password for the user */
    password?: string;
}

// ── Roles (TASK-025, requires TestRail 7.3+) ──────────────────────────────────

/** A user role returned by GET /get_roles (TestRail 7.3+) */
export interface Role {
    /** Unique role ID */
    id: number;
    /** Display name of the role */
    name: string;
    /** Whether this is the default role assigned to new users */
    is_default: boolean;
}

// ── Groups (TASK-026, requires TestRail 7.5+) ─────────────────────────────────

/** A user group returned by GET /get_group and GET /get_groups (TestRail 7.5+) */
export interface Group {
    /** Unique group ID */
    id: number;
    /** Display name of the group */
    name: string;
    /** IDs of users belonging to this group */
    user_ids?: number[];
}

/** Payload for creating a new group via POST /add_group (TestRail 7.5+) */
export interface AddGroupPayload {
    /** Name of the new group */
    name: string;
    /** IDs of users to add to the group */
    user_ids?: number[];
}

/** Payload for updating an existing group via POST /update_group/{group_id} (TestRail 7.5+) */
export interface UpdateGroupPayload {
    /** New name for the group */
    name?: string;
    /** IDs of users to set as the group members (replaces existing membership) */
    user_ids?: number[];
}

// ── Attachments (TASK-027) ────────────────────────────────────────────────────

/** An attachment metadata record returned by attachment list and upload endpoints */
export interface Attachment {
    /** Unique attachment ID */
    attachment_id: number;
    /** Original filename */
    name: string;
    /** Filename returned by the API (when available) */
    filename?: string;
    /** File size in bytes */
    size?: number;
    /** Unix timestamp when the attachment was created */
    created_on?: number;
    /** ID of the user who created the attachment */
    created_by?: number;
    /** Numeric ID of the entity this attachment belongs to */
    entity_id?: number;
}

// ── Shared Steps (TASK-028, requires TestRail 7.0+) ───────────────────────────

/** A shared step set returned by GET /get_shared_step (TestRail 7.0+) */
export interface SharedStep {
    /** Unique shared step ID */
    id: number;
    /** Display title of the shared step */
    title: string;
    /** ID of the project this shared step belongs to */
    project_id?: number;
    /** Number of cases that reference this shared step */
    case_ids?: number[];
    /** Unix timestamp when created */
    created_on?: number;
    /** ID of the user who created it */
    created_by?: number;
    /** Unix timestamp when last updated */
    updated_on?: number;
    /** ID of the user who last updated it */
    updated_by?: number;
    /** Custom step definitions (varies by template) */
    custom_steps_separated?: Record<string, unknown>[];
}

/** Payload for creating a shared step via POST /add_shared_step/{project_id} (TestRail 7.0+) */
export interface AddSharedStepPayload {
    /** Title of the shared step */
    title: string;
    /** Step definitions (varies by template configuration) */
    custom_steps_separated?: Record<string, unknown>[];
}

/** Payload for updating a shared step via POST /update_shared_step/{shared_step_id} (TestRail 7.0+) */
export interface UpdateSharedStepPayload {
    /** New title */
    title?: string;
    /** Updated step definitions */
    custom_steps_separated?: Record<string, unknown>[];
}

// ── Variables (TASK-029) ──────────────────────────────────────────────────────

/** A variable used in data-driven testing */
export interface Variable {
    /** Unique variable ID */
    id: number;
    /** Variable name */
    name: string;
}

/** Payload for creating a variable via POST /add_variable/{project_id} */
export interface AddVariablePayload {
    /** Variable name */
    name: string;
}

/** Payload for updating a variable via POST /update_variable/{variable_id} */
export interface UpdateVariablePayload {
    /** New variable name */
    name?: string;
}

// ── Datasets (TASK-030) ───────────────────────────────────────────────────────

/** A dataset for data-driven testing */
export interface Dataset {
    /** Unique dataset ID */
    id: number;
    /** Dataset name */
    name: string;
    /** ID of the project this dataset belongs to */
    project_id?: number;
    /** Unix timestamp when created */
    created_on?: number;
    /** ID of the user who created it */
    created_by?: number;
}

/** Payload for creating a dataset via POST /add_dataset/{project_id} */
export interface AddDatasetPayload {
    /** Dataset name */
    name: string;
}

/** Payload for updating a dataset via POST /update_dataset/{dataset_id} */
export interface UpdateDatasetPayload {
    /** New dataset name */
    name?: string;
}

// ── Reports (TASK-031) ────────────────────────────────────────────────────────

/** A report template returned by GET /get_reports/{project_id} */
export interface Report {
    /** Unique report template ID */
    id: number;
    /** Display name of the report */
    name: string;
    /** Description of the report */
    description?: string;
    /** Whether the report is shared with other users */
    is_shared?: boolean;
}

/** Result returned by GET /run_report/{report_template_id} */
export interface ReportResult {
    /** URL to the generated HTML report */
    report_url: string;
    /** URL to the generated report user interface */
    user_report_url?: string;
}
