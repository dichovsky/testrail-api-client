import { z } from 'zod';
import { TestRailValidationError } from '../errors.js';
import { UserSchema, GroupSchema } from '../schemas.js';
import type { AddGroupPayload, Group, UpdateGroupPayload, UserAddPayload, UserUpdatePayload } from '../schemas.js';
import { TestRailClientCore } from '../client-core.js';
import type { User } from '../types.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UsersModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_user/{user_id} */
    async getUser(userId: number): Promise<User> {
        validateId(userId, 'userId');
        return this.client.request<User>({
            method: 'GET',
            endpoint: `get_user/${userId}`,
            schema: UserSchema,
        });
    }

    /** @testrail GET get_user_by_email */
    async getUserByEmail(email: string): Promise<User> {
        if (!EMAIL_REGEX.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        const endpoint = buildEndpoint('get_user_by_email', { email });
        return this.client.request<User>({ method: 'GET', endpoint, schema: UserSchema });
    }

    /** @testrail GET get_users */
    async getUsers(limit?: number, offset?: number, projectId?: number): Promise<User[]> {
        validatePaginationParams(limit, offset);
        if (projectId !== undefined) {
            validateId(projectId, 'projectId');
        }

        const endpoint = buildEndpoint(projectId !== undefined ? `get_users/${projectId}` : 'get_users', {
            limit,
            offset,
        });

        return (
            (
                await this.client.request<{ users?: User[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ users: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ users: z.array(UserSchema).nullish() }),
                })
            ).users ?? []
        );
    }

    /** @testrail GET get_current_user */
    async getCurrentUser(): Promise<User> {
        return this.client.request<User>({
            method: 'GET',
            endpoint: 'get_current_user',
            schema: UserSchema,
        });
    }

    /** @testrail POST add_user */
    async addUser(payload: UserAddPayload): Promise<User> {
        return this.client.request<User>({
            method: 'POST',
            endpoint: 'add_user',
            schema: UserSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_user/{user_id} */
    async updateUser(userId: number, payload: UserUpdatePayload): Promise<User> {
        validateId(userId, 'userId');
        return this.client.request<User>({
            method: 'POST',
            endpoint: `update_user/${userId}`,
            schema: UserSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail GET get_group/{group_id} */
    async getGroup(groupId: number): Promise<Group> {
        validateId(groupId, 'groupId');
        return this.client.request<Group>({
            method: 'GET',
            endpoint: `get_group/${groupId}`,
            schema: GroupSchema,
        });
    }

    /** @testrail GET get_groups */
    async getGroups(): Promise<Group[]> {
        return this.client.request<Group[]>({
            method: 'GET',
            endpoint: 'get_groups',
            schema: z.array(GroupSchema),
        });
    }

    /** @testrail POST add_group */
    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.client.request<Group>({
            method: 'POST',
            endpoint: 'add_group',
            schema: GroupSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_group/{group_id} */
    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        validateId(groupId, 'groupId');
        return this.client.request<Group>({
            method: 'POST',
            endpoint: `update_group/${groupId}`,
            schema: GroupSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_group/{group_id} */
    async deleteGroup(groupId: number): Promise<void> {
        validateId(groupId, 'groupId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_group/${groupId}`,
        });
    }
}
