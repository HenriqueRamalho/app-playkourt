import { pgTable, uuid, smallint, time, text, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { courts } from './courts';

export const courtRecurringBlocks = pgTable(
  'court_recurring_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courtId: uuid('court_id').notNull().references(() => courts.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    reason: text('reason'),
  },
  (t) => [
    index('court_recurring_blocks_court_dow_idx').on(t.courtId, t.dayOfWeek),
    check('court_recurring_blocks_day_of_week_check', sql`${t.dayOfWeek} between 0 and 6`),
  ],
);
