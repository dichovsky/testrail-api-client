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

    it('emits repeated query keys for array values in their original order', () => {
        const refs = ['ENG-101', 'ENG-102'] as const;
        expect(buildEndpoint('get_cases/1', { 'refs[]': refs })).toBe(
            'get_cases/1&refs%5B%5D=ENG-101&refs%5B%5D=ENG-102',
        );
    });

    it('encodes every repeated value independently', () => {
        expect(buildEndpoint('get_cases/1', { 'refs[]': ['A&B', 'C=D#E'] })).toBe(
            'get_cases/1&refs%5B%5D=A%26B&refs%5B%5D=C%3DD%23E',
        );
    });

    it('omits empty array values', () => {
        expect(buildEndpoint('get_cases/1', { suite_id: 2, 'refs[]': [] })).toBe('get_cases/1&suite_id=2');
    });
});
