CREATE TABLE "venue_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "venue_images_venue_id_image_id_key" UNIQUE("venue_id","image_id")
);
--> statement-breakpoint
ALTER TABLE "venue_images" ADD CONSTRAINT "venue_images_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_images" ADD CONSTRAINT "venue_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venue_images_venue_id_sort_order_idx" ON "venue_images" USING btree ("venue_id","sort_order");