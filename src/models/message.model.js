import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { users } from "#models/user.model.js";
import { listings } from "#models/listing.model.js";

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),

    user1Id: integer("user1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    user2Id: integer("user2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    listingId: integer("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),

    lastMessageContent: text("last_message_content"),
    lastMessageAt: timestamp("last_message_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    // Prevent duplicate conversations
    uniqueConversation: unique("unique_conversation").on(
      table.user1Id,
      table.user2Id,
      table.listingId
    ),

    // Add indexes
    user1Idx: index("idx_conv_user1").on(table.user1Id),
    user2Idx: index("idx_conv_user2").on(table.user2Id),
  })
);

// Messages table - individual messages within conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),

  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),

  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  content: text("content").notNull(),

  // Track if message has been read
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
