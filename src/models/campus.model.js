import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

export const campuses = pgTable("campuses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: text("slug").notNull().unique(),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lon: numeric("lon", { precision: 9, scale: 6 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
