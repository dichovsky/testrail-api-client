/**
 * TestRail API client configuration options
 */
export interface TestRailConfig {
  /**
   * TestRail instance URL (e.g., https://example.testrail.io)
   */
  baseUrl: string;

  /**
   * TestRail user email for authentication
   */
  email: string;

  /**
   * TestRail API key or password
   */
  apiKey: string;

  /**
   * Request timeout in milliseconds (default: 30000ms)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts for failed requests (default: 3)
   */
  maxRetries?: number;

  /**
   * Enable caching for static resources (default: true)
   */
  enableCache?: boolean;

  /**
   * Cache TTL in milliseconds (default: 300000ms = 5 minutes)
   */
  cacheTtl?: number;

  /**
   * Cache cleanup interval in milliseconds (default: 60000ms = 1 minute)
   * Set to 0 to disable periodic cleanup
   */
  cacheCleanupInterval?: number;

  /**
   * Maximum number of entries in the cache (default: 1000)
   * Set to 0 for unlimited (not recommended)
   */
  maxCacheSize?: number;

  /**
   * Rate limiting configuration (default: 100 requests per minute)
   */
  rateLimiter?: RateLimiterConfig;
}

/**
 * Base response type for all TestRail API responses
 */
export interface TestRailResponse<T = unknown> {
  data?: T;
  error?: string;
}

/**
 * TestRail Case
 */
export interface Case {
  /** The ID of the test case */
  id: number;
  /** The title of the test case */
  title: string;
  /** The ID of the section the case belongs to */
  section_id: number;
  /** The ID of the template used for the case */
  template_id?: number;
  /** The ID of the case type */
  type_id?: number;
  /** The ID of the priority */
  priority_id?: number;
  /** The ID of the milestone associated with the case */
  milestone_id?: number;
  /** Reference IDs linked to the case */
  refs?: string;
  /** The ID of the user who created the case */
  created_by: number;
  /** The date/time when the case was created (Unix timestamp) */
  created_on: number;
  /** The ID of the user who last updated the case */
  updated_by: number;
  /** The date/time when the case was last updated (Unix timestamp) */
  updated_on: number;
  /** The estimate for the case (e.g., "5m") */
  estimate?: string;
  /** The forecast for the case estimate */
  estimate_forecast?: string;
  /** The ID of the suite the case belongs to */
  suite_id: number;
  /** The display order of the case */
  display_order?: number;
  /** Whether the case is deleted */
  is_deleted?: number;
  /** Custom fields of the case */
  custom_fields?: Record<string, unknown>;
}

/**
 * TestRail Suite
 */
export interface Suite {
  /** The ID of the suite */
  id: number;
  /** The name of the suite */
  name: string;
  /** The description of the suite */
  description?: string;
  /** The ID of the project the suite belongs to */
  project_id: number;
  /** Whether the suite is a master suite */
  is_master?: boolean;
  /** Whether the suite is a baseline suite */
  is_baseline?: boolean;
  /** Whether the suite is completed */
  is_completed?: boolean;
  /** The date/time when the suite was completed (Unix timestamp) */
  completed_on?: number;
  /** The URL to view the suite in TestRail */
  url: string;
}

/**
 * TestRail Section
 */
export interface Section {
  /** The ID of the section */
  id: number;
  /** The ID of the suite the section belongs to */
  suite_id: number;
  /** The name of the section */
  name: string;
  /** The description of the section */
  description?: string;
  /** The ID of the parent section */
  parent_id?: number;
  /** The display order of the section */
  display_order: number;
  /** The depth level of the section in the hierarchy */
  depth: number;
}

/**
 * TestRail Project
 */
export interface Project {
  /** The ID of the project */
  id: number;
  /** The name of the project */
  name: string;
  /** The announcement text */
  announcement?: string;
  /** Whether to show the announcement */
  show_announcement?: boolean;
  /** Whether the project is completed */
  is_completed?: boolean;
  /** The date/time when the project was completed (Unix timestamp) */
  completed_on?: number;
  /** The suite mode (1: single suite, 2: single suite + baselines, 3: multiple suites) */
  suite_mode: number;
  /** The URL to view the project in TestRail */
  url: string;
}

/**
 * TestRail Plan
 */
export interface Plan {
  /** The ID of the test plan */
  id: number;
  /** The name of the test plan */
  name: string;
  /** The description of the test plan */
  description?: string;
  /** The ID of the milestone the plan belongs to */
  milestone_id?: number;
  /** The ID of the user the plan is assigned to */
  assignedto_id?: number;
  /** Whether the test plan is completed */
  is_completed: boolean;
  /** The date/time when the plan was completed (Unix timestamp) */
  completed_on?: number;
  /** The number of tests with the "Passed" status */
  passed_count: number;
  /** The number of tests with the "Blocked" status */
  blocked_count: number;
  /** The number of tests with the "Untested" status */
  untested_count: number;
  /** The number of tests with the "Retest" status */
  retest_count: number;
  /** The number of tests with the "Failed" status */
  failed_count: number;
  /** The number of tests with custom status 1 */
  custom_status1_count?: number;
  /** The number of tests with custom status 2 */
  custom_status2_count?: number;
  /** The number of tests with custom status 3 */
  custom_status3_count?: number;
  /** The number of tests with custom status 4 */
  custom_status4_count?: number;
  /** The number of tests with custom status 5 */
  custom_status5_count?: number;
  /** The number of tests with custom status 6 */
  custom_status6_count?: number;
  /** The number of tests with custom status 7 */
  custom_status7_count?: number;
  /** The ID of the project the plan belongs to */
  project_id: number;
  /** The date/time when the plan was created (Unix timestamp) */
  created_on: number;
  /** The ID of the user who created the plan */
  created_by: number;
  /** The URL to view the plan in TestRail */
  url: string;
  /** The entries (runs) within the plan */
  entries?: PlanEntry[];
}

/**
 * TestRail Plan Entry
 */
export interface PlanEntry {
  /** The unique ID of the plan entry (GUID string) */
  id: string;
  /** The ID of the suite the entry belongs to */
  suite_id: number;
  /** The name of the plan entry */
  name: string;
  /** The description of the plan entry */
  description?: string;
  /** The ID of the user assigned to the entry */
  assignedto_id?: number;
  /** Whether all cases should be included */
  include_all: boolean;
  /** Array of case IDs to include (if include_all is false) */
  case_ids?: number[];
  /** Array of configuration IDs used for the runs */
  config_ids?: number[];
  /** Array of runs contained in this entry */
  runs: Run[];
}

/**
 * TestRail Run
 */
export interface Run {
  /** The ID of the test run */
  id: number;
  /** The ID of the suite the run belongs to */
  suite_id: number;
  /** The name of the test run */
  name: string;
  /** The description of the test run */
  description?: string;
  /** The ID of the milestone associated with the run */
  milestone_id?: number;
  /** The ID of the user the run is assigned to */
  assignedto_id?: number;
  /** Whether all cases are included in the run */
  include_all: boolean;
  /** Whether the test run is completed */
  is_completed: boolean;
  /** The date/time when the run was completed (Unix timestamp) */
  completed_on?: number;
  /** The configuration name for the run */
  config?: string;
  /** Array of configuration IDs linked to the run */
  config_ids?: number[];
  /** The number of tests with the "Passed" status */
  passed_count: number;
  /** The number of tests with the "Blocked" status */
  blocked_count: number;
  /** The number of tests with the "Untested" status */
  untested_count: number;
  /** The number of tests with the "Retest" status */
  retest_count: number;
  /** The number of tests with the "Failed" status */
  failed_count: number;
  /** The number of tests with custom status 1 */
  custom_status1_count?: number;
  /** The number of tests with custom status 2 */
  custom_status2_count?: number;
  /** The number of tests with custom status 3 */
  custom_status3_count?: number;
  /** The number of tests with custom status 4 */
  custom_status4_count?: number;
  /** The number of tests with custom status 5 */
  custom_status5_count?: number;
  /** The number of tests with custom status 6 */
  custom_status6_count?: number;
  /** The number of tests with custom status 7 */
  custom_status7_count?: number;
  /** The ID of the project the run belongs to */
  project_id: number;
  /** The ID of the plan the run belongs to (if any) */
  plan_id?: number;
  /** The date/time when the run was created (Unix timestamp) */
  created_on: number;
  /** The ID of the user who created the run */
  created_by: number;
  /** Reference IDs linked to the run */
  refs?: string;
  /** The URL to view the run in TestRail */
  url: string;
}

/**
 * TestRail Test
 */
export interface Test {
  /** The ID of the test */
  id: number;
  /** The ID of the case the test is based on */
  case_id: number;
  /** The ID of the current status of the test */
  status_id: number;
  /** The ID of the user the test is assigned to */
  assignedto_id?: number;
  /** The ID of the test run the test belongs to */
  run_id: number;
  /** The title of the test */
  title: string;
  /** The ID of the template used for the test */
  template_id?: number;
  /** The ID of the test type */
  type_id?: number;
  /** The ID of the priority */
  priority_id?: number;
  /** The estimate for the test */
  estimate?: string;
  /** The forecast for the test estimate */
  estimate_forecast?: string;
  /** Reference IDs linked to the test */
  refs?: string;
  /** The ID of the milestone the test belongs to */
  milestone_id?: number;
  /** Custom fields of the test */
  custom_fields?: Record<string, unknown>;
}

/**
 * TestRail Result
 */
export interface Result {
  /** The ID of the test result */
  id?: number;
  /** The ID of the test the result belongs to */
  test_id?: number;
  /** The ID of the status (e.g., 1 for Passed) */
  status_id: number;
  /** A comment for the test result */
  comment?: string;
  /** The version of the application under test */
  version?: string;
  /** The time elapsed during the test (e.g., "5m 30s") */
  elapsed?: string;
  /** A list of defects linked to the result */
  defects?: string;
  /** The ID of the user the test was assigned to at the time of the result */
  assignedto_id?: number;
  /** The ID of the user who added the result */
  created_by?: number;
  /** The date/time when the result was created (Unix timestamp) */
  created_on?: number;
  /** Custom fields of the test result */
  custom_fields?: Record<string, unknown>;
}

/**
 * TestRail Milestone
 */
export interface Milestone {
  /** The ID of the milestone */
  id: number;
  /** The name of the milestone */
  name: string;
  /** The description of the milestone */
  description?: string;
  /** The scheduled start date/time (Unix timestamp) */
  start_on?: number;
  /** The actual start date/time (Unix timestamp) */
  started_on?: number;
  /** Whether the milestone is completed */
  is_completed: boolean;
  /** The date/time when the milestone was completed (Unix timestamp) */
  completed_on?: number;
  /** The due date/time of the milestone (Unix timestamp) */
  due_on?: number;
  /** The ID of the project the milestone belongs to */
  project_id: number;
  /** The ID of the parent milestone (for sub-milestones) */
  parent_id?: number;
  /** Reference IDs linked to the milestone */
  refs?: string;
  /** The URL to view the milestone in TestRail */
  url: string;
  /** Array of sub-milestones */
  milestones?: Milestone[];
}

/**
 * TestRail User
 */
export interface User {
  /** The ID of the user */
  id: number;
  /** The full name of the user */
  name: string;
  /** The email address of the user */
  email: string;
  /** Whether the user is active */
  is_active: boolean;
  /** The ID of the user's role */
  role_id?: number;
  /** The name of the user's role */
  role?: string;
}

/**
 * TestRail Status
 */
export interface Status {
  /** The ID of the status */
  id: number;
  /** The internal name of the status */
  name: string;
  /** The display label of the status */
  label: string;
  /** The dark color value for the status */
  color_dark: number;
  /** The medium color value for the status */
  color_medium: number;
  /** The bright color value for the status */
  color_bright: number;
  /** Whether the status is a system status */
  is_system: boolean;
  /** Whether the status represents an untested test */
  is_untested: boolean;
  /** Whether the status represents a final test result */
  is_final: boolean;
}

/**
 * TestRail Priority
 */
export interface Priority {
  /** The ID of the priority */
  id: number;
  /** The name of the priority */
  name: string;
  /** The short name of the priority */
  short_name: string;
  /** Whether the priority is the default priority */
  is_default: boolean;
  /** The priority level (weight) */
  priority: number;
}

/**
 * Add Case payload
 */
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

/**
 * Update Case payload
 */
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
 * Add Plan payload
 */
export interface AddPlanPayload {
  name: string;
  description?: string;
  milestone_id?: number;
  entries?: AddPlanEntryPayload[];
}

/**
 * Add Plan Entry payload
 */
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

/**
 * Add Run payload
 */
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

/**
 * Add Result payload
 */
export interface AddResultPayload {
  /** The ID of the status for the result */
  status_id: number;
  /** A comment for the test result */
  comment?: string;
  /** The version of the application */
  version?: string;
  /** The time elapsed during the test */
  elapsed?: string;
  /** A list of defects linked to the result */
  defects?: string;
  /** The ID of the user the test is assigned to */
  assignedto_id?: number;
  /** Custom fields of the test result */
  custom_fields?: Record<string, unknown>;
}

/**
 * Add Results for Cases payload
 */
export interface AddResultsForCasesPayload {
  /** Array of results for cases */
  results: AddResultForCasePayload[];
}

/**
 * Add Result for Case payload
 */
export interface AddResultForCasePayload extends AddResultPayload {
  /** The ID of the case the result belongs to */
  case_id: number;
}

/**
 * Cache entry with expiration
 */
export interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** The expiration timestamp (Unix timestamp in ms) */
  expiry: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** The time window in milliseconds */
  windowMs: number;
}
