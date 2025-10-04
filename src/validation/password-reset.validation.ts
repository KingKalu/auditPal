import { z } from "zod";

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password is too long")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
});