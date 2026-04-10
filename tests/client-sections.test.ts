import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailValidationError, TestRailApiError } from '../src/client.js';
import type { Section, AddSectionPayload, UpdateSectionPayload } from '../src/types.js';
import { createClient, mockOk, mockErr, mockEmpty } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TestRailClient - Sections CRUD', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.clearAllMocks();
        client = createClient();
    });

    it('should add a section (success)', async () => {
        const mockSection: Section = {
            id: 1,
            suite_id: 1,
            name: 'New Section',
            display_order: 1,
            depth: 0,
        };

        const payload: AddSectionPayload = { name: 'New Section' };

        mockFetch.mockResolvedValueOnce(mockOk(mockSection));

        const result = await client.addSection(1, payload);
        expect(result).toEqual(mockSection);
    });

    it('should validate projectId for addSection', async () => {
        const payload: AddSectionPayload = { name: 'New Section' };
        await expect(client.addSection(0, payload)).rejects.toBeInstanceOf(TestRailValidationError);
    });

    it('should throw API error for addSection when API fails', async () => {
        const clientNoRetries = createClient({ maxRetries: 0 });
        mockFetch.mockResolvedValueOnce(mockErr(500, 'Internal Server Error', 'Boom'));
        const payload: AddSectionPayload = { name: 'New Section' };
        await expect(clientNoRetries.addSection(1, payload)).rejects.toBeInstanceOf(TestRailApiError);
    });

    it('should update a section (success)', async () => {
        const mockSection: Section = {
            id: 1,
            suite_id: 1,
            name: 'Updated Section',
            display_order: 1,
            depth: 0,
        };

        const payload: UpdateSectionPayload = { name: 'Updated Section' };

        mockFetch.mockResolvedValueOnce(mockOk(mockSection));

        const result = await client.updateSection(1, payload);
        expect(result).toEqual(mockSection);
    });

    it('should validate sectionId for updateSection', async () => {
        const payload: UpdateSectionPayload = { name: 'Updated' };
        await expect(client.updateSection(-1, payload)).rejects.toBeInstanceOf(TestRailValidationError);
    });

    it('should throw API error for updateSection when API fails', async () => {
        const clientNoRetries = createClient({ maxRetries: 0 });
        mockFetch.mockResolvedValueOnce(mockErr(400, 'Bad Request', 'Invalid'));
        const payload: UpdateSectionPayload = { name: 'Updated' };
        await expect(clientNoRetries.updateSection(1, payload)).rejects.toBeInstanceOf(TestRailApiError);
    });

    it('should delete a section (success)', async () => {
        mockFetch.mockResolvedValueOnce(mockEmpty());
        await client.deleteSection(1);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/index.php?/api/v2/delete_section/1'),
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('should validate sectionId for deleteSection', async () => {
        await expect(client.deleteSection(0)).rejects.toBeInstanceOf(TestRailValidationError);
    });

    it('should throw API error for deleteSection when API fails', async () => {
        const clientNoRetries = createClient({ maxRetries: 0 });
        mockFetch.mockResolvedValueOnce(mockErr(500, 'Internal Server Error', 'Boom'));
        await expect(clientNoRetries.deleteSection(1)).rejects.toBeInstanceOf(TestRailApiError);
    });
});
