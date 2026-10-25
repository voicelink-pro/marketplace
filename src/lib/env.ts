import { z } from "zod";

function isNotSecretKey(value: string): boolean {
  if (value.startsWith("sb_secret_")) return false;
  // Legacy JWT keys: refuse the service_role key in a browser-visible variable.
  const payload = value.split(".")[1];
  if (!payload) return true;
  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: unknown;
    };
    return decoded.role !== "service_role";
  } catch {
    return true;
  }
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .refine(isNotSecretKey, {
      error: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be the publishable key, never a secret key.",
    }),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | undefined;

/** Browser-safe configuration. Every value here ships to the client bundle. */
export function getPublicEnv(): PublicEnv {
  if (cached) return cached;
  const result = publicEnvSchema.safeParse({
    // Referenced literally so Next.js can inline them at build time.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid public environment configuration: ${fields}. See .env.example.`);
  }
  cached = result.data;
  return cached;
}
