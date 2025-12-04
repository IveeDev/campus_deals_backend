import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z
    .number()
    .int()
    .positive("Receiver ID must be a positive integer"),
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(5000, "Message content is too long (max 5000 characters)")
    .trim(),
  listingId: z.number().int().positive().optional(), // Optional: if message is about a listing
});

export const conversationIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid conversation ID"),
});

export const messageIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid message ID"),
});

export const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

export const markAsReadSchema = z.object({
  conversationId: z.number().int().positive("Invalid conversation ID"),
});
