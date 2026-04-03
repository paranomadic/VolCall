import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number");

export const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  tcpaConsent: z.literal(true, {
    errorMap: () => ({ message: "TCPA consent is required for automated calls" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
