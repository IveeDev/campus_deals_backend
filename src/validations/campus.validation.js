import { z } from "zod";

export const createCampusSchema = z.object({
  name: z.string().min(2, "Campus name is required"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, or dashes"
    ),
  lat: z.number().optional().nullable(),
  lon: z.number().optional().nullable(),
});

export const campusIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a valid number")
    .transform(Number)
    .refine(val => val > 0, "ID must be a positive number"),
});

export const updateCampusSchema = z.object({
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
  lat: z
    .number({
      invalid_type_error: "Latitude must be a number",
    })
    .min(-90)
    .max(90)
    .optional(),
  lon: z
    .number({
      invalid_type_error: "Longitude must be a number",
    })
    .min(-180)
    .max(180)
    .optional(),
});
