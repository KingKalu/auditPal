import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .min(1)
  .max(255);

export const passwordSchema = z.string().trim().min(4);

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  otp: z.string().trim().length(6),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
