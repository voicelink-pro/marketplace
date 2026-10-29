import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { cookies } from "next/headers";

export const SANDBOX_USER_COOKIE = "mp_sandbox_uid";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUPABASE_STUB_SQL = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  create role supabase_auth_admin nologin noinherit;
  create schema storage;
  grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (
    id text primary key, name text not null, public boolean not null default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
    name text not null, metadata jsonb, unique(bucket_id,name)
  );
  alter table storage.objects enable row level security;
  grant select on storage.objects to anon;
  grant select,insert,update,delete on storage.objects to authenticated,service_role;


  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    sandbox_password text not null default 'DemoPass123',
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
  grant select, insert, update, delete on auth.users to service_role;
`;

const SANDBOX_ACCOUNTS_SEED_SQL = `
  do $$
  declare
    v_demo_id uuid := '00000000-0000-4000-8000-000000000001';
    v_creator_id uuid := '00000000-0000-4000-8000-000000000002';
    v_company_id uuid := '00000000-0000-4000-8000-000000000003';
    v_monetra_org_id uuid;
    v_stealth_org_id uuid;
  begin
    if exists (select 1 from auth.users where id = v_demo_id) then
      return;
    end if;

    insert into auth.users (id, email, sandbox_password, raw_user_meta_data)
    values
      (v_demo_id, 'demo@example.com', 'DemoPass123', '{"display_name":"Alex Rivera (Demo)"}'::jsonb),
      (v_creator_id, 'creator@example.com', 'CreatorPass123', '{"display_name":"Maja Kowalska"}'::jsonb),
      (v_company_id, 'company@example.com', 'CompanyPass123', '{"display_name":"Tomasz Nowak"}'::jsonb);

    insert into public.platform_admins (user_id, granted_by, note)
    values (v_demo_id, 'local-pglite-sandbox', 'Demo account for local inspection without Docker');

    insert into public.creator_profiles (user_id) values (v_demo_id), (v_creator_id);

    insert into public.creator_social_links (creator_id, platform, url)
    values
      (v_demo_id, 'instagram', 'https://www.instagram.com/alexrivera'),
      (v_demo_id, 'youtube', 'https://www.youtube.com/@alexrivera'),
      (v_creator_id, 'tiktok', 'https://www.tiktok.com/@majakowalska');

    select id into v_monetra_org_id from public.organizations where name = 'Monetra (Demo)' limit 1;
    if v_monetra_org_id is not null then
      insert into public.organization_members (organization_id, user_id, role)
      values (v_monetra_org_id, v_demo_id, 'owner')
      on conflict do nothing;
    end if;

    select id into v_stealth_org_id from public.organizations where name = 'Stealth Draft Lab (Demo)' limit 1;
    if v_stealth_org_id is not null then
      insert into public.organization_members (organization_id, user_id, role)
      values (v_stealth_org_id, v_company_id, 'owner')
      on conflict do nothing;
    end if;
  end;
  $$;
`;

declare global {
  var __mpPgliteSandboxPromise: Promise<PGlite> | undefined;
  var __mpPgliteSandboxVersion: number | undefined;
}

const SANDBOX_SCHEMA_VERSION = 8;

export function isLocalPgliteSandboxEnabled(): boolean {
  if (process.env.LOCAL_PGLITE_SANDBOX !== "1") return false;
  if (
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "LOCAL_PGLITE_SANDBOX is a local development sandbox and cannot be used in production.",
    );
  }
  return true;
}

async function initSandboxDb(): Promise<PGlite> {
  const { PGlite: PGliteRuntime } = await import("@electric-sql/pglite");
  const db = await PGliteRuntime.create();
  await db.exec(SUPABASE_STUB_SQL);

  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }

  if (process.env.LOCAL_PGLITE_SEED !== "0") {
    const seedPath = join(process.cwd(), "supabase", "seed.sql");
    await db.exec(readFileSync(seedPath, "utf8"));
    await db.exec(SANDBOX_ACCOUNTS_SEED_SQL);
  }

  return db;
}

export function getSandboxDb(): Promise<PGlite> {
  if (
    !globalThis.__mpPgliteSandboxPromise ||
    globalThis.__mpPgliteSandboxVersion !== SANDBOX_SCHEMA_VERSION
  ) {
    globalThis.__mpPgliteSandboxVersion = SANDBOX_SCHEMA_VERSION;
    globalThis.__mpPgliteSandboxPromise = initSandboxDb();
  }
  return globalThis.__mpPgliteSandboxPromise;
}

export async function runInAnonPgliteSandbox<T>(
  fn: (tx: Pick<PGlite, "query" | "exec">) => Promise<T>,
): Promise<T> {
  await cookies();
  const db = await getSandboxDb();
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
    await tx.exec(`set local role anon`);
    return fn(tx);
  });
}

export async function runInAuthenticatedPgliteSandbox<T>(
  userId: string,
  fn: (tx: Pick<PGlite, "query" | "exec">) => Promise<T>,
): Promise<T> {
  await cookies();
  const db = await getSandboxDb();
  const claims = JSON.stringify({ sub: userId, role: "authenticated" });
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [claims]);
    await tx.exec(`set local role authenticated`);
    return fn(tx);
  });
}

export async function runInServiceRolePgliteSandbox<T>(
  fn: (tx: Pick<PGlite, "query" | "exec">) => Promise<T>,
): Promise<T> {
  await cookies();
  const db = await getSandboxDb();
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', '{"role":"service_role"}', true)`);
    await tx.exec(`set local role service_role`);
    return fn(tx);
  });
}

export async function getSandboxSessionUserId(): Promise<string | null> {
  if (!isLocalPgliteSandboxEnabled()) return null;
  const cookieStore = await cookies();
  const raw = cookieStore.get(SANDBOX_USER_COOKIE)?.value ?? "";
  return UUID_RE.test(raw) ? raw : null;
}

export async function setSandboxSessionUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SANDBOX_USER_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSandboxSessionUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SANDBOX_USER_COOKIE);
}
