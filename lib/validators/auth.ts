import { z } from "zod";

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: emailSchema,
    phone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
    next: z.string().trim().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  next: z.string().trim().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20).max(256),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20).max(256),
});
