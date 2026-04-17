import { pgTable, uuid, text, numeric, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { venues } from './venues';

export const courts = pgTable(
  'courts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sportType: text('sport_type').notNull(),
    description: text('description'),
    pricePerHour: numeric('price_per_hour', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true),
    useVenueHours: boolean('use_venue_hours').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('courts_venue_id_idx').on(t.venueId)],
);
