import { describe, it, expect } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/index.js';

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
