CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"duration_hours" numeric(3, 1) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"capital" boolean NOT NULL,
	"state_id" integer NOT NULL,
	"siafi_id" varchar(4) NOT NULL,
	"ddd" integer NOT NULL,
	"timezone" varchar(32) NOT NULL,
	CONSTRAINT "cities_siafi_id_unique" UNIQUE("siafi_id")
);
--> statement-breakpoint
CREATE TABLE "court_business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "court_business_hours_court_id_day_of_week_key" UNIQUE("court_id","day_of_week"),
	CONSTRAINT "court_business_hours_day_of_week_check" CHECK ("court_business_hours"."day_of_week" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "court_date_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_full_day" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" text,
	CONSTRAINT "court_date_exceptions_court_id_date_key" UNIQUE("court_id","date")
);
--> statement-breakpoint
CREATE TABLE "court_recurring_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"reason" text,
	CONSTRAINT "court_recurring_blocks_day_of_week_check" CHECK ("court_recurring_blocks"."day_of_week" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sport_type" text NOT NULL,
	"description" text,
	"price_per_hour" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true,
	"use_venue_hours" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" integer PRIMARY KEY NOT NULL,
	"uf" varchar(2) NOT NULL,
	"name" varchar(100) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"region" varchar(12) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cnpj" text,
	"phone" text,
	"street" text,
	"number" text,
	"complement" text,
	"neighborhood" text,
	"city_id" integer NOT NULL,
	"state_id" integer NOT NULL,
	"zip_code" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "venue_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "venue_members_venue_id_user_id_key" UNIQUE("venue_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "venue_business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "venue_business_hours_venue_id_day_of_week_key" UNIQUE("venue_id","day_of_week"),
	CONSTRAINT "venue_business_hours_day_of_week_check" CHECK ("venue_business_hours"."day_of_week" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_business_hours" ADD CONSTRAINT "court_business_hours_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_date_exceptions" ADD CONSTRAINT "court_date_exceptions_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_recurring_blocks" ADD CONSTRAINT "court_recurring_blocks_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_members" ADD CONSTRAINT "venue_members_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_business_hours" ADD CONSTRAINT "venue_business_hours_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_court_id_date_idx" ON "bookings" USING btree ("court_id","date");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "court_date_exceptions_court_date_idx" ON "court_date_exceptions" USING btree ("court_id","date");--> statement-breakpoint
CREATE INDEX "court_recurring_blocks_court_dow_idx" ON "court_recurring_blocks" USING btree ("court_id","day_of_week");--> statement-breakpoint
CREATE INDEX "courts_venue_id_idx" ON "courts" USING btree ("venue_id");