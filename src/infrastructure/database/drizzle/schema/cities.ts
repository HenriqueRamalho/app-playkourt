import { pgTable, integer, varchar, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { states } from './states';

export const cities = pgTable('cities', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  capital: boolean('capital').notNull(),
  stateId: integer('state_id').notNull().references(() => states.id),
  siafiId: varchar('siafi_id', { length: 4 }).notNull().unique(),
  ddd: integer('ddd').notNull(),
  timezone: varchar('timezone', { length: 32 }).notNull(),
});
