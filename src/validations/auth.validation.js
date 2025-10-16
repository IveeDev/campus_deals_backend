import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(255)
    .trim(),
  email: z.email("Invalid email address").max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(6, "Password must be at least 8 characters long")
    .max(128),
  phone: z
    .string()
    .regex(/^(?:\+234|0)[7-9][0-1]\d{8}$/, "Invalid Nigerian phone number")
    .trim(),
});

export const signInSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(6).max(128),
});
