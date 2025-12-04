// src/models/review.model.js
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./user.model.js"; // assuming you have a users model

// Enum for rating
export const ratingEnum = pgEnum("rating_type", [
  "positive",
  "neutral",
  "negative",
]);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  review: text("review").notNull(),
  reviewerId: integer("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  revieweeId: integer("reviewee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: ratingEnum("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
