import { spawnSync } from "node:child_process";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"];
const env = { ...process.env };
if (required.some(key => !env[key])) {
  const status = spawnSync("pnpm", ["exec", "supabase", "status", "-o", "json"], { encoding: "utf8" });
  if (status.status === 0) {
    try {
      const local = JSON.parse(status.stdout);
      env.NEXT_PUBLIC_SUPABASE_URL = local.API_URL;
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = local.PUBLISHABLE_KEY ?? local.ANON_KEY;
      env.SUPABASE_SECRET_KEY = local.SECRET_KEY ?? local.SERVICE_ROLE_KEY;
    } catch { /* Fail explicitly below without printing credentials. */ }
  }
}
if (required.some(key => !env[key])) {
  console.error("Integration tests blocked: start this project's local Supabase (pnpm db:start), or provide all three test credentials. No tests were verified.");
  process.exit(1);
}
const result = spawnSync("pnpm", ["exec", "vitest", "run", "--config", "vitest.integration.config.mts", ...process.argv.slice(2)], { env, stdio: "inherit" });
process.exit(result.status ?? 1);
