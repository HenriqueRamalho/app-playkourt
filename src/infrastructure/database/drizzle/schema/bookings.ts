import { pgTable, uuid, date, time, numeric, text, timestamp, index } from 'drizzle-orm/pg-core';
import { courts } from './courts';

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courtId: uuid('court_id').notNull().references(() => courts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    date: date('date').notNull(),
    startTime: time('start_time').notNull(),
    durationHours: numeric('duration_hours', { precision: 3, scale: 1 }).notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('bookings_court_id_date_idx').on(t.courtId, t.date),
    index('bookings_user_id_idx').on(t.userId),
  ],
);
