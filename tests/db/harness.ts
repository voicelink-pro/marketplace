import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const migrationsDir = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));

/**
 * Minimal stand-in for the pieces of a Supabase database that our migrations
 * depend on: API roles, the auth schema, auth.users and auth.uid()/auth.jwt().
 * It lets us exercise real Postgres grants and RLS without Docker. It does not
 * replace the integration suite against a real Supabase stack.
 */
const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  create role supabase_auth_admin nologin noinherit;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    raw_app_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;

  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;

  grant execute on function auth.jwt() to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`;

export type TestDb = PGlite;

export async function createTestDb(): Promise<TestDb> {
  const db = await PGlite.create();
  await db.exec(SUPABASE_STUB);
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }
  return db;
}

/** Simulates Supabase Auth creating a user (fires our signup trigger). */
export async function createAuthUser(
  db: TestDb,
  input: { email: string; displayName?: string; appMetadata?: Record<string, unknown> },
): Promise<string> {
  const result = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data, raw_app_meta_data)
     values ($1, $2::jsonb, $3::jsonb) returning id`,
    [
      input.email,
      JSON.stringify(input.displayName ? { display_name: input.displayName } : {}),
      JSON.stringify(input.appMetadata ?? {}),
    ],
  );
  return result.rows[0]!.id;
}

type Role = "anon" | "authenticated" | "service_role";

/**
 * Runs `fn` inside a transaction as the given API role with the given JWT
 * subject, the same way PostgREST does for a Data API request. The
 * transaction is always rolled back unless `commit` is set.
 */
export async function as<T>(
  db: TestDb,
  role: Role,
  userId: string | null,
  fn: (tx: Pick<TestDb, "query" | "exec">) => Promise<T>,
  options: { commit?: boolean } = {},
): Promise<T> {
  const claims = userId ? { sub: userId, role } : { role };
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
    await tx.exec(`set local role ${role}`);
    try {
      const result = await fn(tx);
      if (!options.commit) await tx.rollback();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  });
}

export function asUser<T>(
  db: TestDb,
  userId: string,
  fn: (tx: Pick<TestDb, "query" | "exec">) => Promise<T>,
  options: { commit?: boolean } = {},
): Promise<T> {
  return as(db, "authenticated", userId, fn, options);
}
