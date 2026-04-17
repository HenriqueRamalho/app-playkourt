import { pgTable, uuid, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { cities } from './cities';
import { states } from './states';

export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull(),
  cnpj: text('cnpj'),
  phone: text('phone'),
  street: text('street'),
  number: text('number'),
  complement: text('complement'),
  neighborhood: text('neighborhood'),
  cityId: integer('city_id').notNull().references(() => cities.id),
  stateId: integer('state_id').notNull().references(() => states.id),
  zipCode: text('zip_code'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
