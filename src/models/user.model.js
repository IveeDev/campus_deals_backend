import {
  pgTable,
  serial,
  timestamp,
  varchar,
  boolean,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  is_verified: boolean("is_verified").notNull().default(false),
  phone: varchar("phone", { length: 20 }),

  // Jiji-style rating stats
  positiveCount: integer("positive_count").default(0).notNull(),
  neutralCount: integer("neutral_count").default(0).notNull(),
  negativeCount: integer("negative_count").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
