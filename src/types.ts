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

export interface TestRailResponse<T = unknown> {
    data?: T;
    error?: string;
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

export interface CacheEntry<T> {
    data: T;
    expiry: number; // Unix timestamp in ms
}

export interface RateLimiterConfig {
    maxRequests: number;
    windowMs: number;
}
