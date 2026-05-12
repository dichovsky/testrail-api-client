import { z } from 'zod';
import { TestRailValidationError } from '../errors.js';
import { UserSchema, GroupSchema } from '../schemas.js';
import { TestRailClientCore } from '../client-core.js';
import type { AddGroupPayload, AddUserPayload, Group, UpdateGroupPayload, UpdateUserPayload, User } from '../types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UsersModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getUser(userId: number): Promise<User> {
        this.client.validateId(userId, 'userId');
        return this.client.parse<User>(UserSchema, await this.client.request<unknown>('GET', `get_user/${userId}`));
    }

    async getUserByEmail(email: string): Promise<User> {
        if (!EMAIL_REGEX.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        const endpoint = this.client.buildEndpoint('get_user_by_email', { email });
        return this.client.parse<User>(UserSchema, await this.client.request<unknown>('GET', endpoint));
    }

    async getUsers(limit?: number, offset?: number, projectId?: number): Promise<User[]> {
        this.client.validatePaginationParams(limit, offset);
        if (projectId !== undefined) {
            this.client.validateId(projectId, 'projectId');
        }

        const endpoint = this.client.buildEndpoint(projectId !== undefined ? `get_users/${projectId}` : 'get_users', {
            limit,
            offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);

        return (
            this.client.parse<{ users?: User[] }>(z.object({ users: z.array(UserSchema).optional() }), raw).users ?? []
        );
    }

    async getCurrentUser(): Promise<User> {
        return this.client.parse<User>(UserSchema, await this.client.request<unknown>('GET', 'get_current_user'));
    }

    async addUser(payload: AddUserPayload): Promise<User> {
        return this.client.parse<User>(UserSchema, await this.client.request<unknown>('POST', 'add_user', payload));
    }

    async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
        this.client.validateId(userId, 'userId');
        return this.client.parse<User>(
            UserSchema,
            await this.client.request<unknown>('POST', `update_user/${userId}`, payload),
        );
    }

    async getGroup(groupId: number): Promise<Group> {
        this.client.validateId(groupId, 'groupId');
        return this.client.parse<Group>(GroupSchema, await this.client.request<unknown>('GET', `get_group/${groupId}`));
    }

    async getGroups(): Promise<Group[]> {
        return this.client.parse<Group[]>(
            z.array(GroupSchema),
            await this.client.request<unknown>('GET', 'get_groups'),
        );
    }

    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.client.parse<Group>(GroupSchema, await this.client.request<unknown>('POST', 'add_group', payload));
    }

    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        this.client.validateId(groupId, 'groupId');
        return this.client.parse<Group>(
            GroupSchema,
            await this.client.request<unknown>('POST', `update_group/${groupId}`, payload),
        );
    }

    async deleteGroup(groupId: number): Promise<void> {
        this.client.validateId(groupId, 'groupId');
        await this.client.request<void>('POST', `delete_group/${groupId}`);
    }
}
