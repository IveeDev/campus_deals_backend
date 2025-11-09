import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().max(500),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, or dashes"
    )
    .optional(),
});

export const categoryIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a valid number")
    .transform(Number)
    .refine(val => val > 0, "ID must be a positive number"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Campus name must be at least 2 characters long")
    .max(255)
    .optional(),
  slug: z
    .string()
    .min(2, "Campus slug must be at least 2 characters long")
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase and contain only letters, numbers, and hyphens"
    )
    .optional(),
  description: z.string().max(500).optional(),
});
