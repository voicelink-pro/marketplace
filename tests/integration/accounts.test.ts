import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const configured = Boolean(url && publishableKey && secretKey);

if (!configured) {
  console.warn(
    "Integration tests skipped: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY (pnpm db:start).",
  );
}

type Client = SupabaseClient<Database>;

const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } };

describe.skipIf(!configured)("accounts through the Supabase Data API", () => {
  let admin: Client;
  let anon: Client;
  const createdUserIds: string[] = [];

  async function signedInUser(name: string): Promise<{ id: string; client: Client }> {
    const email = `it-${name}-${randomUUID()}@example.test`;
    const password = `Pass-${randomUUID()}-1`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    });
    if (error) throw error;
    createdUserIds.push(data.user.id);

    const client = createClient<Database>(url!, publishableKey!, clientOptions);
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    return { id: data.user.id, client };
  }

  let alice: { id: string; client: Client };
  let bob: { id: string; client: Client };
  let aliceOrgId: string;

  beforeAll(async () => {
    admin = createClient<Database>(url!, secretKey!, clientOptions);
    anon = createClient<Database>(url!, publishableKey!, clientOptions);
    [alice, bob] = await Promise.all([signedInUser("Alice"), signedInUser("Bob")]);
    const { data, error } = await alice.client.rpc("create_organization", { p_name: "Alice Co" });
    if (error) throw error;
    aliceOrgId = data;
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map((id) => admin.auth.admin.deleteUser(id)));
  });

  it("creates a profile for a new account", async () => {
    const { data, error } = await alice.client.from("profiles").select("id, display_name").single();
    expect(error).toBeNull();
    expect(data).toEqual({ id: alice.id, display_name: "Alice" });
  });

  it("sign-up with confirmations on does not return a session", async () => {
    const client = createClient<Database>(url!, publishableKey!, clientOptions);
    const { data, error } = await client.auth.signUp({
      email: `it-signup-${randomUUID()}@example.test`,
      password: `Pass-${randomUUID()}-1`,
    });
    expect(error).toBeNull();
    if (data.user) createdUserIds.push(data.user.id);
    expect(data.session).toBeNull();
  });

  describe("organization isolation", () => {
    it("user B cannot read organization A", async () => {
      const { data, error } = await bob.client.from("organizations").select("id").eq("id", aliceOrgId);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("user B cannot read A's memberships or apps", async () => {
      const members = await bob.client
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", aliceOrgId);
      const apps = await bob.client.from("apps").select("id").eq("organization_id", aliceOrgId);
      expect(members.data).toEqual([]);
      expect(apps.data).toEqual([]);
    });

    it("user B cannot rename organization A", async () => {
      const { data } = await bob.client
        .from("organizations")
        .update({ name: "Hijacked" })
        .eq("id", aliceOrgId)
        .select("id");
      expect(data ?? []).toEqual([]);
      const check = await alice.client.from("organizations").select("name").eq("id", aliceOrgId).single();
      expect(check.data?.name).toBe("Alice Co");
    });

    it("user B cannot add themselves to organization A", async () => {
      const { error } = await bob.client
        .from("organization_members")
        .insert({ organization_id: aliceOrgId, user_id: bob.id, role: "owner" } as never);
      expect(error).not.toBeNull();
    });

    it("user B cannot create an app in organization A", async () => {
      const { error } = await bob.client.rpc("create_app", {
        p_organization_id: aliceOrgId,
        p_name: "Intruder",
      });
      expect(error?.message).toContain("not_allowed");
    });

    it("anonymous requests see no organizations", async () => {
      const { data, error } = await anon.from("organizations").select("id");
      expect(data ?? []).toEqual([]);
      if (error) expect(error.code).toBe("42501");
    });
  });

  describe("admin role", () => {
    it("cannot be self-granted through the API", async () => {
      const { error } = await bob.client
        .from("platform_admins")
        .insert({ user_id: bob.id, granted_by: "me" } as never);
      expect(error).not.toBeNull();
      const { data } = await admin.from("platform_admins").select("user_id").eq("user_id", bob.id);
      expect(data).toEqual([]);
    });

    it("is not granted by editing user metadata", async () => {
      await bob.client.auth.updateUser({ data: { role: "admin", is_admin: true } });
      const { data } = await admin.from("platform_admins").select("user_id").eq("user_id", bob.id);
      expect(data).toEqual([]);
      const profiles = await bob.client.from("profiles").select("id");
      expect(profiles.data).toEqual([{ id: bob.id }]);
    });
  });

  describe("concurrency", () => {
    it("parallel create_app calls create exactly one app", async () => {
      const owner = await signedInUser("Racer");
      const org = await owner.client.rpc("create_organization", { p_name: "Race Co" });
      if (org.error) throw org.error;

      const attempts = await Promise.all(
        Array.from({ length: 8 }, (_, index) =>
          owner.client.rpc("create_app", { p_organization_id: org.data, p_name: `App ${index}` }),
        ),
      );
      const succeeded = attempts.filter((attempt) => !attempt.error);
      const rejected = attempts.filter((attempt) => attempt.error);
      expect(succeeded).toHaveLength(1);
      for (const attempt of rejected) expect(attempt.error?.message).toContain("app_limit_reached");

      const { count } = await admin
        .from("apps")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.data);
      expect(count).toBe(1);
    });

    it("parallel create_organization calls create one organization", async () => {
      const user = await signedInUser("Twice");
      const attempts = await Promise.all(
        Array.from({ length: 6 }, () => user.client.rpc("create_organization", { p_name: "Twice Co" })),
      );
      for (const attempt of attempts) expect(attempt.error).toBeNull();
      expect(new Set(attempts.map((attempt) => attempt.data)).size).toBe(1);

      const { count } = await admin
        .from("organization_members")
        .select("organization_id", { count: "exact", head: true })
        .eq("user_id", user.id);
      expect(count).toBe(1);
    });

    it("parallel social link inserts never exceed the limit", async () => {
      const creator = await signedInUser("Linker");
      const start = await creator.client.from("creator_profiles").insert({ user_id: creator.id });
      if (start.error) throw start.error;

      const attempts = await Promise.all(
        Array.from({ length: 14 }, (_, index) =>
          creator.client.from("creator_social_links").insert({
            creator_id: creator.id,
            platform: "other",
            url: `https://example.com/profile-${index}`,
          }),
        ),
      );
      expect(attempts.filter((attempt) => !attempt.error)).toHaveLength(10);

      const { count } = await admin
        .from("creator_social_links")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id);
      expect(count).toBe(10);
    });
  });
});
