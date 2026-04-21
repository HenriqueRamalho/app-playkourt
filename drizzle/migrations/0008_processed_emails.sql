CREATE TABLE "processed_emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" text NOT NULL,
  "provider_message_id" text,
  "from_address" text NOT NULL,
  "to_address" text NOT NULL,
  "recipient_user_id" uuid,
  "cc_addresses" text[],
  "bcc_addresses" text[],
  "reply_to_address" text,
  "subject" text NOT NULL,
  "html_body" text NOT NULL,
  "text_body" text,
  "tags" text[],
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "template_name" text,
  "idempotency_key" text,
  "status" text NOT NULL DEFAULT 'queued',
  "last_provider_status" text,
  "last_provider_status_at" timestamp with time zone,
  "last_provider_error" text,
  "resent_from_id" uuid,
  "resent_by_user_id" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "delivered_at" timestamp with time zone
);
--> statement-breakpoint

ALTER TABLE "processed_emails"
  ADD CONSTRAINT "processed_emails_resent_from_id_fkey"
  FOREIGN KEY ("resent_from_id") REFERENCES "processed_emails"("id") ON DELETE SET NULL;
--> statement-breakpoint

CREATE INDEX "processed_emails_created_at_idx"
  ON "processed_emails" ("created_at" DESC);
--> statement-breakpoint

CREATE INDEX "processed_emails_recipient_user_id_idx"
  ON "processed_emails" ("recipient_user_id")
  WHERE "recipient_user_id" IS NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX "processed_emails_provider_message_id_key"
  ON "processed_emails" ("provider_message_id")
  WHERE "provider_message_id" IS NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX "processed_emails_idempotency_key_key"
  ON "processed_emails" ("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint

CREATE INDEX "processed_emails_metadata_gin_idx"
  ON "processed_emails" USING gin ("metadata");
--> statement-breakpoint

CREATE INDEX "processed_emails_template_name_idx"
  ON "processed_emails" ("template_name")
  WHERE "template_name" IS NOT NULL;
--> statement-breakpoint

CREATE TABLE "processed_email_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "processed_email_id" uuid NOT NULL REFERENCES "processed_emails"("id") ON DELETE CASCADE,
  "provider_event_id" text,
  "provider" text NOT NULL,
  "raw_status" text NOT NULL,
  "normalized_status" text NOT NULL,
  "payload" jsonb NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL,
  "received_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX "processed_email_events_idempotency_key"
  ON "processed_email_events" ("processed_email_id", "provider_event_id")
  WHERE "provider_event_id" IS NOT NULL;
--> statement-breakpoint

CREATE INDEX "processed_email_events_processed_email_id_idx"
  ON "processed_email_events" ("processed_email_id", "occurred_at" DESC);
