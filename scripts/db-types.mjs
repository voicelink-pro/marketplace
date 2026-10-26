import { spawnSync } from "node:child_process";
import { writeFileSync, renameSync } from "node:fs";

const result = spawnSync("pnpm", ["exec", "supabase", "gen", "types", "typescript", "--local", "--schema", "public"], { encoding: "utf8" });
if (result.status !== 0 || !result.stdout.includes("export type Database")) {
  console.error("Could not generate local database types. The existing file was preserved.");
  process.exit(1);
}
const file = "src/lib/supabase/database.types.ts";
writeFileSync(`${file}.tmp`, result.stdout.split("\n").map(line => line.trimEnd()).join("\n"));
renameSync(`${file}.tmp`, file);
console.log("Generated database types from local Supabase.");
