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
  CacheEntry,
} from './types.js';

/**
 * Custom error class for TestRail API errors
 */
export class TestRailApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly response?: string
  ) {
    super(message);
    this.name = 'TestRailApiError';
  }
}

/**
 * Custom error class for configuration validation errors
 */
export class TestRailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestRailConfigError';
  }
}

/**
 * TestRail API Client
 * 
 * A TypeScript client for the TestRail API.
 * Supports all major API endpoints for managing projects, suites, cases, runs, plans, and results.
 */
export class TestRailClient {
  private readonly baseUrl: string;
  private readonly auth: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly enableCache: boolean;
  private readonly cacheTtl: number;
  private readonly cacheCleanupInterval: number;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private cacheCleanupTimer: ReturnType<typeof setInterval> | undefined;
  private readonly rateLimiter: { maxRequests: number; windowMs: number; requests: number[]; };

  /**
   * Creates a new TestRail API client
   * 
   * @param config - Configuration options for the client
   * @throws {TestRailConfigError} When configuration is invalid
   */
  constructor(config: TestRailConfig) {
    this.validateConfig(config);
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.auth = Buffer.from(`${config.email}:${config.apiKey}`).toString('base64');
    this.timeout = config.timeout ?? 30000; // 30 seconds default
    this.maxRetries = config.maxRetries ?? 3;
    this.enableCache = config.enableCache ?? true;
    this.cacheTtl = config.cacheTtl ?? 300000; // 5 minutes default
    this.cacheCleanupInterval = config.cacheCleanupInterval ?? 60000; // 1 minute default
    this.rateLimiter = {
      maxRequests: config.rateLimiter?.maxRequests ?? 100,
      windowMs: config.rateLimiter?.windowMs ?? 60000, // 1 minute
      requests: [],
    };
    
    // Start periodic cache cleanup if enabled
    if (this.enableCache && this.cacheCleanupInterval > 0) {
      this.startCacheCleanup();
    }
  }

  /**
   * Validates the TestRail configuration
   * 
   * @param config - Configuration to validate
   * @throws {TestRailConfigError} When configuration is invalid
   */
  private validateConfig(config: TestRailConfig): void {
    if (!config.baseUrl || typeof config.baseUrl !== 'string') {
      throw new TestRailConfigError('baseUrl is required and must be a string');
    }

    if (!config.email || typeof config.email !== 'string') {
      throw new TestRailConfigError('email is required and must be a string');
    }

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new TestRailConfigError('apiKey is required and must be a string');
    }

    // Validate URL format
    try {
      const url = new URL(config.baseUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new TestRailConfigError('baseUrl must use http or https protocol');
      }
    } catch {
      throw new TestRailConfigError('baseUrl must be a valid URL');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.email)) {
      throw new TestRailConfigError('email must be a valid email address');
    }

    // Validate timeout if provided
    if (config.timeout !== undefined) {
      const MAX_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
      if (
        typeof config.timeout !== 'number' ||
        config.timeout <= 0 ||
        config.timeout > MAX_TIMEOUT_MS
      ) {
        throw new TestRailConfigError('timeout must be a positive number not exceeding 5 minutes');
      }
    }

    // Validate maxRetries if provided
    if (config.maxRetries !== undefined) {
      if (typeof config.maxRetries !== 'number' || config.maxRetries < 0 || config.maxRetries > 10) {
        throw new TestRailConfigError('maxRetries must be a number between 0 and 10');
      }
    }
  }

  /**
   * Checks and applies rate limiting
   * 
   * @throws {TestRailApiError} When rate limit is exceeded
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const windowStart = now - this.rateLimiter.windowMs;
    
    // Clean old requests outside the window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(time => time > windowStart);
    
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = oldestRequest + this.rateLimiter.windowMs - now;
      throw new TestRailApiError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`
      );
    }
    
    this.rateLimiter.requests.push(now);
  }

  /**
   * Gets cached data if available and not expired
   * 
   * @param cacheKey - Cache key
   * @returns Cached data or undefined
   */
  private getCachedData<T>(cacheKey: string): T | undefined {
    if (!this.enableCache) {
      return undefined;
    }
    
    const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (entry !== undefined && entry.expiry > Date.now()) {
      return entry.data;
    }
    
    // Clean expired entry
    if (entry !== undefined) {
      this.cache.delete(cacheKey);
    }
    
    return undefined;
  }

  /**
   * Sets cached data with expiration
   * 
   * @param cacheKey - Cache key
   * @param data - Data to cache
   */
  private setCachedData<T>(cacheKey: string, data: T): void {
    if (!this.enableCache) {
      return;
    }
    
    this.cache.set(cacheKey, {
      data,
      expiry: Date.now() + this.cacheTtl,
    });
  }

  /**
   * Clears the entire cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Starts periodic cache cleanup to remove expired entries
   */
  private startCacheCleanup(): void {
    this.cacheCleanupTimer = setInterval(() => {
      this.cleanupExpiredCache();
    }, this.cacheCleanupInterval);
    
    // Ensure timer doesn't prevent process exit in Node.js environments
    // The unref check provides compatibility with non-Node.js environments
    if (typeof this.cacheCleanupTimer.unref === 'function') {
      this.cacheCleanupTimer.unref();
    }
  }

  /**
   * Stops periodic cache cleanup
   */
  private stopCacheCleanup(): void {
    if (this.cacheCleanupTimer !== undefined) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = undefined;
    }
  }

  /**
   * Removes expired entries from cache
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    // Delete expired entries in a single pass
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cleanup resources when client is no longer needed
   */
  public destroy(): void {
    this.stopCacheCleanup();
    this.clearCache();
  }

  /**
   * Makes an HTTP request to the TestRail API with retry logic
   * 
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Optional request body data
   * @param retryCount - Current retry attempt (internal use)
   * @param skipCache - Skip cache lookup and storage
   * @returns Promise with the response data
   * @throws {TestRailApiError} When the API request fails
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    retryCount = 0,
    skipCache = false
  ): Promise<T> {
    // Check cache for GET requests
    if (method === 'GET' && !skipCache) {
      const cacheKey = `${method}:${endpoint}`;
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData !== undefined) {
        return cachedData;
      }
    }
    
    // Apply rate limiting
    this.checkRateLimit();

    const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TestRail API Client TypeScript/1.0.0',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const options: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }

    try {
      const response: Response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        // Retry on server errors (5xx) or rate limiting (429)
        if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
        }
        
        throw new TestRailApiError(
          `TestRail API error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          response.statusText,
          errorText
        );
      }

      const responseText = await response.text();
      if (!responseText) {
        return {} as T;
      }

      try {
        const result = JSON.parse(responseText) as T;
        
        // Cache successful GET responses
        if (method === 'GET' && !skipCache) {
          const cacheKey = `${method}:${endpoint}`;
          this.setCachedData(cacheKey, result);
        }
        
        return result;
      } catch {
        throw new TestRailApiError('Invalid JSON response from TestRail API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof TestRailApiError) {
        throw error;
      }
      
      const isAbortError = (error as Error).name === 'AbortError';
      
      // Retry on network errors up to the maximum number of retries
      if (retryCount < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(method, endpoint, data, retryCount + 1);
      }
      
      if (isAbortError) {
        throw new TestRailApiError(`Request timeout after ${this.timeout}ms`);
      }
      
      throw new TestRailApiError(
        `Network error: ${(error as Error).message}`,
        undefined,
        undefined,
        (error as Error).message
      );
    }
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
    return response.projects ?? [];
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
   * @param suiteId - Optional ID of the suite to filter by
   * @returns Array of sections
   */
  async getSections(projectId: number, suiteId?: number): Promise<Section[]> {
    let endpoint = `get_sections/${projectId}`;
    if (typeof suiteId === 'number') {
      endpoint += `&suite_id=${suiteId}`;
    }
    const response = await this.request<{ sections: Section[] }>('GET', endpoint);
    return response.sections ?? [];
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
   * @param suiteId - Optional ID of the suite to filter by
   * @param sectionId - Optional section ID to filter by
   * @returns Array of cases
   */
  async getCases(projectId: number, suiteId?: number, sectionId?: number): Promise<Case[]> {
    let endpoint = `get_cases/${projectId}`;
    const params: string[] = [];
    
    if (typeof suiteId === 'number') {
      params.push(`suite_id=${suiteId}`);
    }
    
    if (typeof sectionId === 'number') {
      params.push(`section_id=${sectionId}`);
    }
    
    if (params.length > 0) {
      endpoint += `&${params.join('&')}`;
    }
    
    const response = await this.request<{ cases: Case[] }>('GET', endpoint);
    return response.cases ?? [];
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
    return response.plans ?? [];
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
    return response.runs ?? [];
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
    return response.tests ?? [];
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
    return response.results ?? [];
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
    return response.results ?? [];
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
    return response.results ?? [];
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
    return response.milestones ?? [];
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
   * @throws {TestRailConfigError} When email format is invalid
   */
  async getUserByEmail(email: string): Promise<User> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new TestRailConfigError('Invalid email format');
    }
    
    return this.request<User>('GET', `get_user_by_email&email=${encodeURIComponent(email)}`);
  }

  /**
   * Get all users
   * 
   * @returns Array of users
   */
  async getUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[] }>('GET', 'get_users');
    return response.users ?? [];
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