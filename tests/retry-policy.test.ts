import { describe, it, expect } from 'vitest';
import { fullRetryPolicy, binaryGetRetryPolicy, noRetryPolicy } from '../src/retry-policy.js';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
const STATUSES = [200, 400, 401, 403, 404, 408, 429, 500, 502, 503, 504] as const;

describe('fullRetryPolicy', () => {
    const policy = fullRetryPolicy();

    describe('isStatusRetryable', () => {
        it('retries 429 for all methods', () => {
            for (const method of METHODS) {
                expect(policy.isStatusRetryable(429, method)).toBe(true);
            }
        });

        it('retries 5xx only for GET', () => {
            for (const status of [500, 502, 503, 504]) {
                expect(policy.isStatusRetryable(status, 'GET')).toBe(true);
                for (const method of ['POST', 'PUT', 'DELETE']) {
                    expect(policy.isStatusRetryable(status, method)).toBe(false);
                }
            }
        });

        it('does not retry 4xx (except 429) for any method', () => {
            for (const status of [400, 401, 403, 404, 408]) {
                for (const method of METHODS) {
                    expect(policy.isStatusRetryable(status, method)).toBe(false);
                }
            }
        });

        it('does not retry 2xx', () => {
            expect(policy.isStatusRetryable(200, 'GET')).toBe(false);
        });
    });

    describe('isNetworkErrorRetryable', () => {
        it('retries network errors only for GET', () => {
            expect(policy.isNetworkErrorRetryable('GET')).toBe(true);
            expect(policy.isNetworkErrorRetryable('POST')).toBe(false);
            expect(policy.isNetworkErrorRetryable('PUT')).toBe(false);
            expect(policy.isNetworkErrorRetryable('DELETE')).toBe(false);
        });
    });
});

describe('binaryGetRetryPolicy', () => {
    const policy = binaryGetRetryPolicy();

    describe('isStatusRetryable', () => {
        it('retries 429 regardless of method', () => {
            for (const method of METHODS) {
                expect(policy.isStatusRetryable(429, method)).toBe(true);
            }
        });

        it('retries all 5xx regardless of method', () => {
            for (const status of [500, 502, 503, 504]) {
                for (const method of METHODS) {
                    expect(policy.isStatusRetryable(status, method)).toBe(true);
                }
            }
        });

        it('does not retry 4xx (except 429)', () => {
            for (const status of [400, 401, 403, 404, 408]) {
                expect(policy.isStatusRetryable(status, 'GET')).toBe(false);
            }
        });

        it('does not retry 2xx', () => {
            expect(policy.isStatusRetryable(200, 'GET')).toBe(false);
        });
    });

    describe('isNetworkErrorRetryable', () => {
        it('retries network errors for any method (always GET in practice)', () => {
            for (const method of METHODS) {
                expect(policy.isNetworkErrorRetryable(method)).toBe(true);
            }
        });
    });
});

describe('noRetryPolicy', () => {
    const policy = noRetryPolicy();

    describe('isStatusRetryable', () => {
        it('never retries any status for any method', () => {
            for (const status of STATUSES) {
                for (const method of METHODS) {
                    expect(policy.isStatusRetryable(status, method)).toBe(false);
                }
            }
        });
    });

    describe('isNetworkErrorRetryable', () => {
        it('never retries network errors for any method', () => {
            for (const method of METHODS) {
                expect(policy.isNetworkErrorRetryable(method)).toBe(false);
            }
        });
    });
});
