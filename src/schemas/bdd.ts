import { z } from 'zod';

/**
 * One entry returned by TestRail 10.5+'s bulk `get_bdds` endpoint.
 *
 * The public 10.5/10.7 release notes document the endpoint and its paginated
 * `bdd` collection, but do not publish the fields of an individual entry. A
 * live 10.7.0 probe confirmed the envelope while returning no rows. Keep the
 * item contract honest and forward-compatible until a non-empty wire capture
 * establishes stable keys instead of guessing required fields.
 */
export const BddSchema = z.record(z.string(), z.unknown());

export type Bdd = z.infer<typeof BddSchema>;
