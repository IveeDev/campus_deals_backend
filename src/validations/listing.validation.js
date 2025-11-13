import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is too short"),
  price: z
    .string()
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, "Price must be a positive number"),
  categoryId: z
    .string()
    .transform(val => Number(val))
    .refine(
      val => !isNaN(val) && val > 0,
      "Category ID must be a valid number"
    ),
  campusId: z
    .string()
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, "Campus ID must be a valid number")
    .optional(),
  condition: z.enum(["brand_new", "used"], {
    required_error: "Condition is required and must be 'brand_new' or 'used'",
  }),
});

export const listingIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a valid number")
    .transform(Number)
    .refine(val => val > 0, "ID must be a positive number"),
});

export const updateListingSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z
      .string()
      .transform(val => Number(val))
      .refine(val => !isNaN(val) && val > 0, "Price must be a positive number")
      .optional(),
    categoryId: z
      .string()
      .transform(val => Number(val))
      .refine(
        val => !isNaN(val) && val > 0,
        "Category ID must be a valid number"
      )
      .optional(),
    campusId: z
      .string()
      .transform(val => Number(val))
      .refine(val => !isNaN(val) && val > 0, "Campus ID must be a valid number")
      .optional(),
    condition: z.enum(["brand_new", "used"]).optional(),
    removeImageIds: z.array(z.string()).optional(),
  })
  .strict();
