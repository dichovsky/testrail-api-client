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
  id: number;
  title: string;
  section_id: number;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  milestone_id?: number;
  refs?: string;
  created_by: number;
  created_on: number;
  updated_by: number;
  updated_on: number;
  estimate?: string;
  estimate_forecast?: string;
  suite_id: number;
  display_order?: number;
  is_deleted?: number;
  custom_fields?: Record<string, unknown>;
}

/**
 * TestRail Suite
 */
export interface Suite {
  id: number;
  name: string;
  description?: string;
  project_id: number;
  is_master?: boolean;
  is_baseline?: boolean;
  is_completed?: boolean;
  completed_on?: number;
  url: string;
}

/**
 * TestRail Section
 */
export interface Section {
  id: number;
  suite_id: number;
  name: string;
  description?: string;
  parent_id?: number;
  display_order: number;
  depth: number;
}

/**
 * TestRail Project
 */
export interface Project {
  id: number;
  name: string;
  announcement?: string;
  show_announcement?: boolean;
  is_completed?: boolean;
  completed_on?: number;
  suite_mode: number;
  url: string;
}

/**
 * TestRail Plan
 */
export interface Plan {
  id: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  is_completed: boolean;
  completed_on?: number;
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
  created_on: number;
  created_by: number;
  url: string;
  entries?: PlanEntry[];
}

/**
 * TestRail Plan Entry
 */
export interface PlanEntry {
  id: string;
  suite_id: number;
  name: string;
  description?: string;
  assignedto_id?: number;
  include_all: boolean;
  case_ids?: number[];
  config_ids?: number[];
  runs: Run[];
}

/**
 * TestRail Run
 */
export interface Run {
  id: number;
  suite_id: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  include_all: boolean;
  is_completed: boolean;
  completed_on?: number;
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
  created_on: number;
  created_by: number;
  refs?: string;
  url: string;
}

/**
 * TestRail Test
 */
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

/**
 * TestRail Result
 */
export interface Result {
  id?: number;
  test_id?: number;
  status_id: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  assignedto_id?: number;
  created_by?: number;
  created_on?: number;
  custom_fields?: Record<string, unknown>;
}

/**
 * TestRail Milestone
 */
export interface Milestone {
  id: number;
  name: string;
  description?: string;
  start_on?: number;
  started_on?: number;
  is_completed: boolean;
  completed_on?: number;
  due_on?: number;
  project_id: number;
  parent_id?: number;
  refs?: string;
  url: string;
  milestones?: Milestone[];
}

/**
 * TestRail User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  role_id?: number;
  role?: string;
}

/**
 * TestRail Status
 */
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

/**
 * TestRail Priority
 */
export interface Priority {
  id: number;
  name: string;
  short_name: string;
  is_default: boolean;
  priority: number;
}

/**
 * Add Case payload
 */
export interface AddCasePayload {
  title: string;
  section_id?: number;
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
  status_id: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  assignedto_id?: number;
  custom_fields?: Record<string, unknown>;
}

/**
 * Add Results for Cases payload
 */
export interface AddResultsForCasesPayload {
  results: AddResultForCasePayload[];
}

/**
 * Add Result for Case payload
 */
export interface AddResultForCasePayload extends AddResultPayload {
  case_id: number;
}

/**
 * Cache entry with expiration
 */
export interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}
