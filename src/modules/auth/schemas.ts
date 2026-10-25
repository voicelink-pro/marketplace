import { z } from "zod";

// Keep in sync with [auth] minimum_password_length / password_requirements in supabase/config.toml.
export const PASSWORD_MIN_LENGTH = 10;
// bcrypt ignores input beyond 72 bytes.
const PASSWORD_MAX_LENGTH = 72;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: `Use at least ${PASSWORD_MIN_LENGTH} characters.` })
  .max(PASSWORD_MAX_LENGTH, { error: `Use at most ${PASSWORD_MAX_LENGTH} characters.` })
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), {
    error: "Use both letters and numbers.",
  });

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter your name." })
  .max(80, { error: "Use at most 80 characters." });

export const signUpSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." }).max(PASSWORD_MAX_LENGTH),
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const newPasswordFormSchema = z
  .object({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    error: "Passwords don't match.",
    path: ["confirmPassword"],
  });
