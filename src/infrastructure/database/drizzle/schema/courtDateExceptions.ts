import { pgTable, uuid, date, boolean, time, text, unique, index } from 'drizzle-orm/pg-core';
import { courts } from './courts';

export const courtDateExceptions = pgTable(
  'court_date_exceptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courtId: uuid('court_id').notNull().references(() => courts.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    isFullDay: boolean('is_full_day').notNull().default(true),
    startTime: time('start_time'),
    endTime: time('end_time'),
    reason: text('reason'),
  },
  (t) => [
    unique('court_date_exceptions_court_id_date_key').on(t.courtId, t.date),
    index('court_date_exceptions_court_date_idx').on(t.courtId, t.date),
  ],
);
