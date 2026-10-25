import { z } from "zod";

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, { error: "Use at least 2 characters." })
  .max(120, { error: "Use at most 120 characters." });

export const appNameSchema = z
  .string()
  .trim()
  .min(2, { error: "Use at least 2 characters." })
  .max(80, { error: "Use at most 80 characters." });

export const uuidSchema = z.uuid();
