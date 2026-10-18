import { sql } from 'drizzle-orm';

// Guest credentials authorize AI only; they are never profile/user IDs.
export type AiActor = string | { guestId: string };
export const aiActorUser = (actor: AiActor) => typeof actor === 'string' ? actor : null;
export const aiActorGuest = (actor: AiActor) => typeof actor === 'string' ? null : actor.guestId;
export const aiActorFilter = (actor: AiActor, joined = false) => typeof actor === 'string'
 ? sql`${sql.raw(joined ? 'r.user_id' : 'user_id')}=${actor}`
 : sql`${sql.raw(joined ? 'r.guest_id' : 'guest_id')}=${actor.guestId}`;
