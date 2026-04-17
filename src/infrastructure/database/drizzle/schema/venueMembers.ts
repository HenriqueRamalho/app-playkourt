import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { venues } from './venues';

export const venueMembers = pgTable(
  'venue_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [unique('venue_members_venue_id_user_id_key').on(t.venueId, t.userId)],
);
