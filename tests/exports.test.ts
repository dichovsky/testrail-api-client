import { describe, it, expect } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailLicenseError, TestRailValidationError } from '../src/index.js';

describe('Index exports', () => {
    it('should export TestRailClient', () => {
        expect(TestRailClient).toBeDefined();
    });

    it('should create a functional TestRailClient instance', () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.net',
            email: 'test@example.com',
            apiKey: 'test-key',
        });
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(TestRailClient);
        expect(client.metadata).toBeDefined();
    });

    it('should expose all 19 domain modules as the single access path', () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.net',
            email: 'test@example.com',
            apiKey: 'test-key',
        });
        const modules = [
            'projects',
            'suites',
            'sections',
            'cases',
            'plans',
            'runs',
            'tests',
            'results',
            'milestones',
            'users',
            'metadata',
            'configurations',
            'attachments',
            'bdd',
            'sharedSteps',
            'variables',
            'datasets',
            'reports',
            'labels',
        ] as const;
        for (const name of modules) {
            expect(client[name], `client.${name} should be defined`).toBeDefined();
        }
        // v5.0.0: the flat facade is gone — endpoint methods live only on the
        // module fields, never directly on the client.
        const flat = client as unknown as Record<string, unknown>;
        expect(flat['getProject']).toBeUndefined();
        expect(flat['addRun']).toBeUndefined();
        expect(flat['addResultForCase']).toBeUndefined();
        expect(typeof client.projects.getProject).toBe('function');
        expect(typeof client.runs.addRun).toBe('function');
        expect(typeof client.results.addResultForCase).toBe('function');
    });

    it('should export and create TestRailApiError instances', () => {
        expect(TestRailApiError).toBeDefined();
        expect(typeof TestRailApiError).toBe('function');

        const error = new TestRailApiError(404, 'Not Found', 'Response body');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TestRailApiError);
        // The message now includes status and statusText due to the refactor
        expect(error.message).toContain('404');
        expect(error.message).toContain('Not Found');
        expect(error.name).toBe('TestRailApiError');
    });

    it('should export and create TestRailValidationError instances', () => {
        expect(TestRailValidationError).toBeDefined();
        expect(typeof TestRailValidationError).toBe('function');

        const error = new TestRailValidationError('Config error');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TestRailValidationError);
        // The message now includes a prefix due to the refactor
        expect(error.message).toContain('Config error');
        expect(error.name).toBe('TestRailValidationError');
    });

    it('should export and create TestRailLicenseError instances (subclass of TestRailApiError)', () => {
        expect(TestRailLicenseError).toBeDefined();
        expect(typeof TestRailLicenseError).toBe('function');

        const error = new TestRailLicenseError(403, 'Forbidden', '{"error":"Not an Enterprise license/subscription."}');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TestRailApiError);
        expect(error).toBeInstanceOf(TestRailLicenseError);
        expect(error.status).toBe(403);
        expect(error.name).toBe('TestRailLicenseError');
    });

    it('should export error classes with proper inheritance', () => {
        const apiError = new TestRailApiError(500, 'Internal Server Error');
        const configError = new TestRailValidationError('Config Error');

        expect(apiError instanceof Error).toBe(true);
        expect(configError instanceof Error).toBe(true);
        expect(apiError.name).toBe('TestRailApiError');
        expect(configError.name).toBe('TestRailValidationError');
    });
});
