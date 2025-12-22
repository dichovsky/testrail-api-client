import { describe, it, expect } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/index.js';
import type {
  TestRailConfig,
  TestRailResponse,
  Case,
  Suite,
  Section,
  Project,
  Plan,
  PlanEntry,
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
  AddPlanEntryPayload,
  AddRunPayload,
  AddResultPayload,
  AddResultsForCasesPayload,
  AddResultForCasePayload,
} from '../src/index.js';

describe('Index exports', () => {
  it('should export TestRailClient', () => {
    expect(TestRailClient).toBeDefined();
  });

  it('should export all types', () => {
    const config: TestRailConfig = {
      baseUrl: 'https://example.testrail.io',
      email: 'test@example.com',
      apiKey: 'test-key',
    };
    const response: TestRailResponse = { data: {} };
    const testCase: Case = {
      id: 1,
      title: 'Test',
      section_id: 1,
      created_by: 1,
      created_on: 1234567890,
      updated_by: 1,
      updated_on: 1234567890,
      suite_id: 1,
    };
    const suite: Suite = { id: 1, name: 'Suite', project_id: 1, url: 'url' };
    const section: Section = { id: 1, suite_id: 1, name: 'Section', display_order: 1, depth: 0 };
    const project: Project = { id: 1, name: 'Project', suite_mode: 1, url: 'url' };
    const plan: Plan = {
      id: 1,
      name: 'Plan',
      is_completed: false,
      passed_count: 0,
      blocked_count: 0,
      untested_count: 0,
      retest_count: 0,
      failed_count: 0,
      project_id: 1,
      created_on: 1234567890,
      created_by: 1,
      url: 'url',
    };
    const entry: PlanEntry = { id: '1', suite_id: 1, name: 'Entry', include_all: true, runs: [] };
    const run: Run = {
      id: 1,
      suite_id: 1,
      name: 'Run',
      include_all: true,
      is_completed: false,
      passed_count: 0,
      blocked_count: 0,
      untested_count: 0,
      retest_count: 0,
      failed_count: 0,
      project_id: 1,
      created_on: 1234567890,
      created_by: 1,
      url: 'url',
    };
    const test: Test = { id: 1, case_id: 1, status_id: 1, run_id: 1, title: 'Test' };
    const result: Result = { status_id: 1 };
    const milestone: Milestone = { id: 1, name: 'Milestone', is_completed: false, project_id: 1, url: 'url' };
    const user: User = { id: 1, name: 'User', email: 'user@example.com', is_active: true };
    const status: Status = {
      id: 1,
      name: 'passed',
      label: 'Passed',
      color_dark: 12709313,
      color_medium: 14250867,
      color_bright: 15790320,
      is_system: true,
      is_untested: false,
      is_final: true,
    };
    const priority: Priority = { id: 1, name: 'Low', short_name: 'low', is_default: false, priority: 1 };
    const addCasePayload: AddCasePayload = { title: 'New Case' };
    const updateCasePayload: UpdateCasePayload = { title: 'Updated Case' };
    const addPlanPayload: AddPlanPayload = { name: 'New Plan' };
    const addPlanEntryPayload: AddPlanEntryPayload = { suite_id: 1 };
    const addRunPayload: AddRunPayload = { name: 'New Run' };
    const addResultPayload: AddResultPayload = { status_id: 1 };
    const addResultsForCasesPayload: AddResultsForCasesPayload = { results: [] };
    const addResultForCasePayload: AddResultForCasePayload = { case_id: 1, status_id: 1 };

    expect(config).toBeDefined();
    expect(response).toBeDefined();
    expect(testCase).toBeDefined();
    expect(suite).toBeDefined();
    expect(section).toBeDefined();
    expect(project).toBeDefined();
    expect(plan).toBeDefined();
    expect(entry).toBeDefined();
    expect(run).toBeDefined();
    expect(test).toBeDefined();
    expect(result).toBeDefined();
    expect(milestone).toBeDefined();
    expect(user).toBeDefined();
    expect(status).toBeDefined();
    expect(priority).toBeDefined();
    expect(addCasePayload).toBeDefined();
    expect(updateCasePayload).toBeDefined();
    expect(addPlanPayload).toBeDefined();
    expect(addPlanEntryPayload).toBeDefined();
    expect(addRunPayload).toBeDefined();
    expect(addResultPayload).toBeDefined();
    expect(addResultsForCasesPayload).toBeDefined();
    expect(addResultForCasePayload).toBeDefined();
  });

  it('should create a functional TestRailClient instance', () => {
    const client = new TestRailClient({
      baseUrl: 'https://example.testrail.net',
      email: 'test@example.com',
      apiKey: 'test-key'
    });
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(TestRailClient);
  });

  it('should export and create TestRailApiError instances', () => {
    expect(TestRailApiError).toBeDefined();
    expect(typeof TestRailApiError).toBe('function');
    
    const error = new TestRailApiError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TestRailApiError);
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('TestRailApiError');
  });

  it('should export and create TestRailValidationError instances', () => {
    expect(TestRailValidationError).toBeDefined();
    expect(typeof TestRailValidationError).toBe('function');
    
    const error = new TestRailValidationError('Config error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TestRailValidationError);
    expect(error.message).toBe('Config error');
    expect(error.name).toBe('TestRailValidationError');
  });

  it('should export error classes with proper inheritance', () => {
    const apiError = new TestRailApiError('API Error');
    const configError = new TestRailValidationError('Config Error');
    
    expect(apiError instanceof Error).toBe(true);
    expect(configError instanceof Error).toBe(true);
    expect(apiError.name).toBe('TestRailApiError');
    expect(configError.name).toBe('TestRailValidationError');
  });
});
