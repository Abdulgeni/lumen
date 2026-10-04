import { z } from "zod";

const email = z.email("Enter a valid email address").max(254);
const newPassword = z.string().min(10, "Use at least 10 characters").max(128);

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email,
  password: newPassword,
});
export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
});
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ password: newPassword });
