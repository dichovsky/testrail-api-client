import { z } from 'zod';
import { TestRailValidationError } from '../errors.js';
import { UserSchema, GroupSchema } from '../schemas.js';
import type { AddGroupPayload, Group, UpdateGroupPayload, UserAddPayload, UserUpdatePayload } from '../schemas.js';
import { TestRailClientCore } from '../client-core.js';
import type { User } from '../types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UsersModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_user/{user_id} */
    async getUser(userId: number): Promise<User> {
        this.client.validateId(userId, 'userId');
        return this.client.requestParsed<User>('GET', `get_user/${userId}`, UserSchema);
    }

    /** @testrail GET get_user_by_email */
    async getUserByEmail(email: string): Promise<User> {
        if (!EMAIL_REGEX.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        const endpoint = this.client.buildEndpoint('get_user_by_email', { email });
        return this.client.requestParsed<User>('GET', endpoint, UserSchema);
    }

    /** @testrail GET get_users */
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

    /** @testrail GET get_current_user */
    async getCurrentUser(): Promise<User> {
        return this.client.requestParsed<User>('GET', 'get_current_user', UserSchema);
    }

    /** @testrail POST add_user */
    async addUser(payload: UserAddPayload): Promise<User> {
        return this.client.requestParsed<User>('POST', 'add_user', UserSchema, payload);
    }

    /** @testrail POST update_user/{user_id} */
    async updateUser(userId: number, payload: UserUpdatePayload): Promise<User> {
        this.client.validateId(userId, 'userId');
        return this.client.requestParsed<User>('POST', `update_user/${userId}`, UserSchema, payload);
    }

    /** @testrail GET get_group/{group_id} */
    async getGroup(groupId: number): Promise<Group> {
        this.client.validateId(groupId, 'groupId');
        return this.client.requestParsed<Group>('GET', `get_group/${groupId}`, GroupSchema);
    }

    /** @testrail GET get_groups */
    async getGroups(): Promise<Group[]> {
        return this.client.requestParsed<Group[]>('GET', 'get_groups', z.array(GroupSchema));
    }

    /** @testrail POST add_group */
    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.client.requestParsed<Group>('POST', 'add_group', GroupSchema, payload);
    }

    /** @testrail POST update_group/{group_id} */
    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        this.client.validateId(groupId, 'groupId');
        return this.client.requestParsed<Group>('POST', `update_group/${groupId}`, GroupSchema, payload);
    }

    /** @testrail POST delete_group/{group_id} */
    async deleteGroup(groupId: number): Promise<void> {
        this.client.validateId(groupId, 'groupId');
        await this.client.request<void>('POST', `delete_group/${groupId}`);
    }
}
