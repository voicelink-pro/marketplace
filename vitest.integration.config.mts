import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Runs against a real Supabase stack (`pnpm db:start`), through the public Data API.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
