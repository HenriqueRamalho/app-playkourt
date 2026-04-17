import { pgTable, uuid, smallint, time, boolean, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { courts } from './courts';

export const courtBusinessHours = pgTable(
  'court_business_hours',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courtId: uuid('court_id').notNull().references(() => courts.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(),
    openTime: time('open_time').notNull(),
    closeTime: time('close_time').notNull(),
    isClosed: boolean('is_closed').notNull().default(false),
  },
  (t) => [
    unique('court_business_hours_court_id_day_of_week_key').on(t.courtId, t.dayOfWeek),
    check('court_business_hours_day_of_week_check', sql`${t.dayOfWeek} between 0 and 6`),
  ],
);
