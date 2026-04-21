import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const processedEmails = pgTable(
  'processed_emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    providerMessageId: text('provider_message_id'),
    fromAddress: text('from_address').notNull(),
    toAddress: text('to_address').notNull(),
    recipientUserId: uuid('recipient_user_id'),
    ccAddresses: text('cc_addresses').array(),
    bccAddresses: text('bcc_addresses').array(),
    replyToAddress: text('reply_to_address'),
    subject: text('subject').notNull(),
    htmlBody: text('html_body').notNull(),
    textBody: text('text_body'),
    tags: text('tags').array(),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    templateName: text('template_name'),
    idempotencyKey: text('idempotency_key'),
    status: text('status').notNull().default('queued'),
    lastProviderStatus: text('last_provider_status'),
    lastProviderStatusAt: timestamp('last_provider_status_at', { withTimezone: true }),
    lastProviderError: text('last_provider_error'),
    resentFromId: uuid('resent_from_id').references(
      (): AnyPgColumn => processedEmails.id,
      { onDelete: 'set null' },
    ),
    resentByUserId: uuid('resent_by_user_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  },
  (t) => [
    index('processed_emails_created_at_idx').on(t.createdAt.desc()),
    index('processed_emails_recipient_user_id_idx').on(t.recipientUserId),
    uniqueIndex('processed_emails_provider_message_id_key').on(t.providerMessageId),
    uniqueIndex('processed_emails_idempotency_key_key').on(t.idempotencyKey),
    index('processed_emails_metadata_gin_idx').using('gin', t.metadata),
    index('processed_emails_template_name_idx').on(t.templateName),
  ],
);

export const processedEmailEvents = pgTable(
  'processed_email_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    processedEmailId: uuid('processed_email_id')
      .notNull()
      .references(() => processedEmails.id, { onDelete: 'cascade' }),
    providerEventId: text('provider_event_id'),
    provider: text('provider').notNull(),
    rawStatus: text('raw_status').notNull(),
    normalizedStatus: text('normalized_status').notNull(),
    payload: jsonb('payload').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('processed_email_events_idempotency_key').on(
      t.processedEmailId,
      t.providerEventId,
    ),
    index('processed_email_events_processed_email_id_idx').on(
      t.processedEmailId,
      t.occurredAt.desc(),
    ),
  ],
);
