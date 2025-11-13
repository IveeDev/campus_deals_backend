import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { listings } from "#models/listing.model.js";

export const listingImages = pgTable("listing_images", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  publicId: varchar("public_id", { length: 255 }).notNull(), // Cloudinary ID for easy deletion
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
