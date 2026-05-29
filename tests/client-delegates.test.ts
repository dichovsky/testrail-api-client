import { describe, it, expect } from 'vitest';
import { createClient } from './helpers.js';
import { TestRailValidationError } from '../src/errors.js';

// These tests pin the @deprecated delegate methods on TestRailClientCore. The
// methods themselves are slated for removal in 6.0.0 (ARCH #6 phase 2); until
// then they must forward to the leaf-module implementation without behaviour
// drift. One test per delegate is enough — the substantive coverage for the
// underlying functions lives in tests/validation.test.ts and tests/url.test.ts.
describe('TestRailClient deprecated validation/URL delegates (ARCH #6 phase 1)', () => {
    it('validateId delegates to validation.ts', () => {
        const client = createClient();
        expect(() => client.validateId(1, 'caseId')).not.toThrow();
        expect(() => client.validateId(0, 'caseId')).toThrow(TestRailValidationError);
        expect(() => client.validateId(-1, 'caseId')).toThrow('caseId must be a positive integer');
    });

    it('validateEntryId delegates to validation.ts', () => {
        const client = createClient();
        expect(() => client.validateEntryId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).not.toThrow();
        expect(() => client.validateEntryId('../../etc/passwd')).toThrow(TestRailValidationError);
    });

    it('validatePaginationParams delegates to validation.ts', () => {
        const client = createClient();
        expect(() => client.validatePaginationParams()).not.toThrow();
        expect(() => client.validatePaginationParams(250, 0)).not.toThrow();
        expect(() => client.validatePaginationParams(0)).toThrow('limit must be a positive integer');
        expect(() => client.validatePaginationParams(undefined, -1)).toThrow('offset must be a non-negative integer');
    });

    it('buildEndpoint delegates to url.ts', () => {
        const client = createClient();
        expect(client.buildEndpoint('get_case/1')).toBe('get_case/1');
        expect(client.buildEndpoint('get_sections/1', { suite_id: 2 })).toBe('get_sections/1&suite_id=2');
        expect(client.buildEndpoint('search', { q: 'a&b' })).toBe('search&q=a%26b');
    });
});
