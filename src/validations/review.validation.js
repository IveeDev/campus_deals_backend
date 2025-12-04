import { z } from "zod";

export const createReviewSchema = z.object({
  // reviewerId: z
  //   .string()
  //   .regex(/^\d+$/, "ID must be a valid number")
  //   .transform(Number)
  //   .refine(val => val > 0, "ID must be a positive number"),

  // revieweeId: z
  //   .string()
  //   .regex(/^\d+$/, "ID must be a valid number")
  //   .transform(Number)
  //   .refine(val => val > 0, "ID must be a positive number"),

  rating: z.enum(["positive", "neutral", "negative"]),
  review: z.string().min(30),
});

export const reviewIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a valid number")
    .transform(Number)
    .refine(val => val > 0, "ID must be a positive number"),
});

export const updateReviewSchema = z.object({
  review: z.string().min(1).optional(),
  rating: z.enum(["positive", "neutral", "negative"]).optional(),
});
