import { UserAddPayloadSchema, UserUpdatePayloadSchema } from '../../schemas.js';
import { createWriteHandler } from '../write-handler-factory.js';

/**
 * `user add` — create a new TestRail user (TestRail 7.3+). Requires only
 * `name` and `email`; access-control fields are optional.
 */
export const handleUserAdd = createWriteHandler({
    action: 'user add',
    bodySchema: UserAddPayloadSchema,
    call: (client, _nums, body) => client.users.addUser(body),
});

/**
 * `user update <user_id>` — partial update (PATCH semantics; all body fields
 * optional).
 */
export const handleUserUpdate = createWriteHandler({
    action: 'user update',
    pathParams: ['user_id'],
    bodySchema: UserUpdatePayloadSchema,
    call: (client, [userId], body) => client.users.updateUser(userId, body),
});
