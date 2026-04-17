import { pgTable, integer, varchar, doublePrecision } from 'drizzle-orm/pg-core';

export const states = pgTable('states', {
  id: integer('id').primaryKey(),
  uf: varchar('uf', { length: 2 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  region: varchar('region', { length: 12 }).notNull(),
});
