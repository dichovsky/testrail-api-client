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
        return this.client.requestParsed<User>('GET', `get_user/${userId}`, UserSchema);
    }

    async getUserByEmail(email: string): Promise<User> {
        if (!EMAIL_REGEX.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        const endpoint = this.client.buildEndpoint('get_user_by_email', { email });
        return this.client.requestParsed<User>('GET', endpoint, UserSchema);
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

        return (
            (
                await this.client.requestParsed<{ users?: User[] }>(
                    'GET',
                    endpoint,
                    z.object({ users: z.array(UserSchema).optional() }),
                )
            ).users ?? []
        );
    }

    async getCurrentUser(): Promise<User> {
        return this.client.requestParsed<User>('GET', 'get_current_user', UserSchema);
    }

    async addUser(payload: AddUserPayload): Promise<User> {
        return this.client.requestParsed<User>('POST', 'add_user', UserSchema, payload);
    }

    async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
        this.client.validateId(userId, 'userId');
        return this.client.requestParsed<User>('POST', `update_user/${userId}`, UserSchema, payload);
    }

    async getGroup(groupId: number): Promise<Group> {
        this.client.validateId(groupId, 'groupId');
        return this.client.requestParsed<Group>('GET', `get_group/${groupId}`, GroupSchema);
    }

    async getGroups(): Promise<Group[]> {
        return this.client.requestParsed<Group[]>('GET', 'get_groups', z.array(GroupSchema));
    }

    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.client.requestParsed<Group>('POST', 'add_group', GroupSchema, payload);
    }

    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        this.client.validateId(groupId, 'groupId');
        return this.client.requestParsed<Group>('POST', `update_group/${groupId}`, GroupSchema, payload);
    }

    async deleteGroup(groupId: number): Promise<void> {
        this.client.validateId(groupId, 'groupId');
        await this.client.request<void>('POST', `delete_group/${groupId}`);
    }
}
