import { index, integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { venues } from './venues';
import { images } from './images';

export const venueImages = pgTable(
  'venue_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'cascade' }),
    imageId: uuid('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('venue_images_venue_id_image_id_key').on(t.venueId, t.imageId),
    index('venue_images_venue_id_sort_order_idx').on(t.venueId, t.sortOrder),
  ],
);
