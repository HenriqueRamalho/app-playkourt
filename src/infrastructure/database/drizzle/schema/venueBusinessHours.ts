import { pgTable, uuid, smallint, time, boolean, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { venues } from './venues';

export const venueBusinessHours = pgTable(
  'venue_business_hours',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(),
    openTime: time('open_time').notNull(),
    closeTime: time('close_time').notNull(),
    isClosed: boolean('is_closed').notNull().default(false),
  },
  (t) => [
    unique('venue_business_hours_venue_id_day_of_week_key').on(t.venueId, t.dayOfWeek),
    check('venue_business_hours_day_of_week_check', sql`${t.dayOfWeek} between 0 and 6`),
  ],
);
