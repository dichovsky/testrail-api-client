import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient } from '../src/client.js';
import type { Project } from '../src/types.js';
import type { AddProjectPayload, UpdateProjectPayload } from '../src/schemas.js';
import { createClient, mockOk, mockErr } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Project CRUD', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.clearAllMocks();
        // Use zero retries in tests to keep them fast and deterministic
        client = createClient({ maxRetries: 0 });
    });

    describe('addProject', () => {
        it('success', async () => {
            const payload: AddProjectPayload = { name: 'New Project', suite_mode: 1 };
            const mockProject: Project = { id: 10, name: 'New Project', suite_mode: 1, url: 'url' };
            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.projects.addProject(payload);
            expect(result).toEqual(mockProject);
        });

        it('api error', async () => {
            const payload: AddProjectPayload = { name: 'New Project', suite_mode: 1 };
            mockFetch.mockResolvedValueOnce(mockErr(500, 'Server Error', 'Boom'));

            await expect(client.projects.addProject(payload)).rejects.toThrow('TestRail API error: 500 Server Error');
        });
    });

    describe('updateProject', () => {
        it('success', async () => {
            const payload: UpdateProjectPayload = { name: 'Updated' };
            const mockProject: Project = { id: 1, name: 'Updated', suite_mode: 1, url: 'url' };
            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.projects.updateProject(1, payload);
            expect(result).toEqual(mockProject);
        });

        it('invalid id', async () => {
            await expect(client.projects.updateProject(0, {})).rejects.toThrow('projectId must be a positive integer');
        });

        it('api error', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(400, 'Bad Request', 'Invalid'));
            await expect(client.projects.updateProject(1, {})).rejects.toThrow('TestRail API error: 400 Bad Request');
        });
    });

    describe('deleteProject', () => {
        it('success', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const result = await client.projects.deleteProject(1);
            expect(result).toBeUndefined();
        });

        it('invalid id', async () => {
            await expect(client.projects.deleteProject(-1)).rejects.toThrow('projectId must be a positive integer');
        });

        it('api error', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(500, 'Server Error', 'Boom'));
            await expect(client.projects.deleteProject(1)).rejects.toThrow('TestRail API error: 500 Server Error');
        });
    });
});
