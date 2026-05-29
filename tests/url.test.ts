import { describe, it, expect } from 'vitest';
import { buildEndpoint } from '../src/url.js';

describe('buildEndpoint', () => {
    it('returns base unchanged when no params provided', () => {
        expect(buildEndpoint('get_case/1')).toBe('get_case/1');
    });

    it('returns base unchanged when params object is empty', () => {
        expect(buildEndpoint('get_case/1', {})).toBe('get_case/1');
    });

    it('appends a single param with & (TestRail URL quirk)', () => {
        expect(buildEndpoint('get_sections/1', { suite_id: 2 })).toBe('get_sections/1&suite_id=2');
    });

    it('appends multiple params joined by &', () => {
        expect(buildEndpoint('get_cases/1', { suite_id: 2, section_id: 3 })).toBe(
            'get_cases/1&suite_id=2&section_id=3',
        );
    });

    it('omits params whose value is undefined', () => {
        expect(buildEndpoint('get_cases/1', { suite_id: 2, section_id: undefined })).toBe('get_cases/1&suite_id=2');
    });

    it('returns base unchanged when every param is undefined', () => {
        expect(buildEndpoint('get_cases/1', { suite_id: undefined, section_id: undefined })).toBe('get_cases/1');
    });

    it('encodes special characters in values (prevents param injection)', () => {
        expect(buildEndpoint('search', { q: 'a&b=c' })).toBe('search&q=a%26b%3Dc');
        expect(buildEndpoint('search', { q: 'hash#anchor' })).toBe('search&q=hash%23anchor');
    });

    it('encodes special characters in keys (prevents param injection)', () => {
        expect(buildEndpoint('base', { 'k&y': 1 })).toBe('base&k%26y=1');
    });

    it('stringifies numeric values', () => {
        expect(buildEndpoint('base', { count: 42 })).toBe('base&count=42');
    });

    it('coerces 0 to "0" rather than omitting it (0 is a valid pagination value)', () => {
        expect(buildEndpoint('base', { offset: 0 })).toBe('base&offset=0');
    });

    it('keeps empty-string values (caller decides intent)', () => {
        expect(buildEndpoint('base', { q: '' })).toBe('base&q=');
    });

    it('handles a value containing %', () => {
        expect(buildEndpoint('base', { q: '100%' })).toBe('base&q=100%25');
    });
});
