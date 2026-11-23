import { TestRailValidationError } from '../errors.js';
import { UserSchema, GroupSchema } from '../schemas.js';
import type { AddGroupPayload, Group, UpdateGroupPayload, UserAddPayload, UserUpdatePayload } from '../schemas.js';
import { TestRailClientCore } from '../client-core.js';
import type { User } from '../types.js';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { TESTRAIL_USER_EMAIL_PATTERN } from '../constants.js';
import type { Page, PaginatedRequestOptions, PaginationSafetyOptions } from '../pagination.js';
import { listOf, unwrapList } from './list.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetUsersOptions {
    limit?: number;
    offset?: number;
}

export type GetAllUsersOptions = PaginatedRequestOptions;

export const USERS_PAGINATION = createPaginatedListExecutor<undefined, GetUsersOptions, GetAllUsersOptions, User>({
    operations: ['get_users'],
    collectionKey: 'users',
    itemSchema: UserSchema,
    response: 'envelope',
    requestControls: true,
    prepare: () => ({ operation: 'get_users' }),
});

function validateGlobalUserOptions(options: unknown): void {
    if (options !== undefined && (typeof options !== 'object' || options === null || Array.isArray(options))) {
        throw new TestRailValidationError('Global user pagination options must be an object');
    }
}

export type GetAllGroupsOptions = PaginationSafetyOptions;

interface GroupPaginationControls {
    limit?: number;
    offset?: number;
}

export const GROUPS_PAGINATION = createPaginatedListExecutor<
    undefined,
    GroupPaginationControls,
    GetAllGroupsOptions,
    Group
>({
    operations: ['get_groups'],
    collectionKey: 'groups',
    itemSchema: GroupSchema,
    response: 'envelope',
    requestControls: false,
    prepare: () => ({ operation: 'get_groups' }),
});

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
        // Lightweight sanity guard, the same shape rule the add_user /
        // update_user payloads apply; see TESTRAIL_USER_EMAIL_PATTERN.
        if (!TESTRAIL_USER_EMAIL_PATTERN.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        const endpoint = buildEndpoint('get_user_by_email', { email });
        return this.client.request<User>({ method: 'GET', endpoint, schema: UserSchema });
    }

    /**
     * Get users from one response. Project reads do not accept pagination controls.
     * @testrail GET get_users
     */
    async getUsers(projectId?: number): Promise<User[]>;
    /** Get global users from one response with optional limit and offset controls. */
    async getUsers(projectId: undefined, options: GetUsersOptions): Promise<User[]>;
    async getUsers(projectId?: number, options?: GetUsersOptions): Promise<User[]> {
        if (projectId !== undefined) {
            validateId(projectId, 'projectId');
            if (options !== undefined) {
                throw new TestRailValidationError('Project user lists do not support pagination options');
            }
        } else {
            validateGlobalUserOptions(options);
            return USERS_PAGINATION.items(this.client, undefined, options);
        }

        // Project responses can ignore page controls and report size > limit.
        // Keep their tolerant, single-response decoding separate from global pagination.
        const raw = await this.client.request<User[] | { users?: User[] }>({
            method: 'GET',
            endpoint: `get_users/${projectId}`,
            schema: listOf('users', UserSchema),
        });
        return unwrapList('users', raw);
    }

    /** Get one global user page. This method does not accept a project ID. */
    async getUsersPage(options?: GetUsersOptions): Promise<Page<User>> {
        validateGlobalUserOptions(options);
        return USERS_PAGINATION.page(this.client, undefined, options);
    }

    /** Get all global users within the configured pagination safety limits. */
    async getAllUsers(options?: GetAllUsersOptions): Promise<User[]> {
        validateGlobalUserOptions(options);
        return USERS_PAGINATION.all(this.client, undefined, options);
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
        return GROUPS_PAGINATION.items(this.client, undefined);
    }

    /** Get one response page. The method does not send undocumented request controls. */
    async getGroupsPage(): Promise<Page<Group>> {
        return GROUPS_PAGINATION.page(this.client, undefined);
    }

    /** Get all groups. The configured pagination safety limits apply. */
    async getAllGroups(options?: GetAllGroupsOptions): Promise<Group[]> {
        return GROUPS_PAGINATION.all(this.client, undefined, options);
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
        // Live-instance audit: TestRail requires `group_id` in the BODY (not just
        // the path) — a body without it is rejected with HTTP 400 "Field :group_id
        // is a required field". Inject the path id (caller's payload cannot override it).
        return this.client.request<Group>({
            method: 'POST',
            endpoint: `update_group/${groupId}`,
            schema: GroupSchema,
            body: { kind: 'json', data: { ...payload, group_id: groupId } },
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
