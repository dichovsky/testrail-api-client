import { TestRailClient } from '../src/client.js';
import type { TestRailConfig } from '../src/types.js';

// Standard test client config
export const BASE_CONFIG: TestRailConfig = {
    baseUrl: 'https://example.testrail.io',
    email: 'test@example.com',
    apiKey: 'test-api-key',
};

export function createClient(overrides: Partial<TestRailConfig> = {}): TestRailClient {
    return new TestRailClient({ ...BASE_CONFIG, ...overrides });
}

// Mock fetch response factories
export function mockOk<T>(data: T): Response {
    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function mockErr(status: number, statusText: string, body = 'Error'): Response {
    return new Response(body, {
        status,
        statusText,
    });
}

export function mockEmpty(): Response {
    return new Response('', {
        status: 200,
        statusText: 'OK',
    });
}

// Shared minimal mock data
export const MOCK_PROJECT = {
    id: 1,
    name: 'Test Project',
    suite_mode: 1,
    url: 'https://example.testrail.io/projects/view/1',
};

export const MOCK_CASE = {
    id: 1,
    title: 'Test Case',
    section_id: 1,
    created_by: 1,
    created_on: 1234567890,
    updated_by: 1,
    updated_on: 1234567890,
    suite_id: 1,
};

export const MOCK_SUITE = {
    id: 1,
    name: 'Test Suite',
    project_id: 1,
    url: 'https://example.testrail.io/suites/view/1',
};

export const MOCK_RUN = {
    id: 1,
    suite_id: 1,
    name: 'Test Run',
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
    url: 'https://example.testrail.io/runs/view/1',
};

export const MOCK_PLAN = {
    id: 1,
    name: 'Test Plan',
    is_completed: false,
    passed_count: 0,
    blocked_count: 0,
    untested_count: 0,
    retest_count: 0,
    failed_count: 0,
    project_id: 1,
    created_on: 1234567890,
    created_by: 1,
    url: 'https://example.testrail.io/plans/view/1',
};

export const MOCK_USER = {
    id: 1,
    name: 'Test User',
    email: 'user@example.com',
    is_active: true,
};

export const MOCK_RESULT = {
    id: 1,
    test_id: 1,
    status_id: 1,
    created_by: 1,
    created_on: 1234567890,
};

export const MOCK_MILESTONE = {
    id: 1,
    name: 'Test Milestone',
    is_completed: false,
    project_id: 1,
    url: 'https://example.testrail.io/milestones/view/1',
};
