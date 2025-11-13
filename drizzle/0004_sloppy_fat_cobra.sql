CREATE TABLE "listing_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"url" varchar(500) NOT NULL,
	"public_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" RENAME COLUMN "user_id" TO "seller_id";--> statement-breakpoint
ALTER TABLE "listings" DROP CONSTRAINT "listings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;