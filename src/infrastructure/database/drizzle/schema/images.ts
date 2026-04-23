import { index, pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const images = pgTable(
  'images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull().unique(),
    publicUrl: text('public_url').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    originalName: text('original_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('images_owner_id_idx').on(t.ownerId, t.createdAt)],
);
