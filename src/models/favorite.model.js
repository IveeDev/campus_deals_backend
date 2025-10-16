import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "#models/user.model.js";
import { listings } from "#models/listing.model.js";

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
