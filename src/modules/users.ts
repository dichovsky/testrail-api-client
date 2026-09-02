import { TestRailValidationError } from '../errors.js';
import { UserSchema, GroupSchema } from '../schemas.js';
import type { AddGroupPayload, Group, UpdateGroupPayload, UserAddPayload, UserUpdatePayload } from '../schemas.js';
import { TestRailClientCore } from '../client-core.js';
import type { User } from '../types.js';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Page, PaginationSafetyOptions } from '../pagination.js';
import { listOf, unwrapList } from './list.js';
import { createPaginatedListExecutor } from './paginated-list.js';

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

// Lightweight sanity guard for the get_user_by_email lookup input: exactly one
// '@' with non-empty, whitespace-free local and domain parts. Deliberately does
// NOT require a dotted (FQDN) domain — RFC 5321 permits single-label domains
// (admin@localhost, user@corp) and domain-literals (user@[192.168.1.1]), which
// self-hosted / LDAP / AD / SSO instances legitimately store, so they must reach
// the API rather than being rejected client-side (#236). Authoritative format
// validation is TestRail's responsibility.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

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
    async getUsers(projectId?: number): Promise<User[]> {
        if (projectId !== undefined) {
            validateId(projectId, 'projectId');
        }

        const endpoint = projectId !== undefined ? `get_users/${projectId}` : 'get_users';

        // `get_users` is the one bulk endpoint whose documentation shows a bare
        // top-level array and supports no `limit`/`offset` parameters, while
        // projects/groups/roles/labels all document the envelope. #248 proved
        // this exact wrapper-only assumption wrong for six other methods, so
        // accept both shapes rather than betting on the doc.
        // SPEC #1.5 — `{ users: null }` is a valid empty wrapper, hence `.nullable()`.
        const raw = await this.client.request<User[] | { users?: User[] }>({
            method: 'GET',
            endpoint,
            schema: listOf('users', UserSchema),
        });
        return unwrapList('users', raw);
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

    /** Get one response page without sending undocumented request controls. */
    async getGroupsPage(): Promise<Page<Group>> {
        return GROUPS_PAGINATION.page(this.client, undefined);
    }

    /** Get every group under the configured pagination safety bounds. */
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
