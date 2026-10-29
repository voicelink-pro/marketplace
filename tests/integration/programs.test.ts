import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const configured = Boolean(url && publishableKey && secretKey);

type Client = SupabaseClient<Database>;
const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } };

describe.skipIf(!configured)("creator program memberships and links through the Supabase Data API", () => {
  let admin: Client;
  const createdUserIds: string[] = [];

  async function signedInCreator(name: string): Promise<{ id: string; client: Client }> {
    const email = `it-prog-${name}-${randomUUID()}@example.test`;
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

    await client.from("creator_profiles").insert({ user_id: data.user.id });
    await client.from("creator_social_links").insert({
      creator_id: data.user.id,
      platform: "instagram",
      url: `https://www.instagram.com/${name.toLowerCase()}`,
    });

    return { id: data.user.id, client };
  }

  beforeAll(async () => {
    admin = createClient<Database>(url!, secretKey!, clientOptions);
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      const removed = await admin.auth.admin.deleteUser(id);
      if (removed.error) throw removed.error;
    }
  });

  it("joins a published program idempotently under concurrent requests and isolates links per creator", async () => {
    const [creatorA, creatorB] = await Promise.all([
      signedInCreator("CreatorA"),
      signedInCreator("CreatorB"),
    ]);

    const listing = await creatorA.client
      .from("catalog_listings")
      .select("app_id, terms_version_id")
      .eq("slug", "monetra")
      .single();
    if (listing.error) throw listing.error;

    // 6 parallel join requests from creatorA produce exactly 1 membership
    const joinAttempts = await Promise.all(
      Array.from({ length: 6 }, () =>
        creatorA.client.rpc("join_program", {
          p_app_id: listing.data.app_id,
          p_accepted_terms_version_id: listing.data.terms_version_id,
          p_accepted_terms: true,
        }),
      ),
    );
    for (const attempt of joinAttempts) expect(attempt.error).toBeNull();
    const membershipIds = new Set(joinAttempts.map((a) => a.data));
    expect(membershipIds.size).toBe(1);
    const membershipId = joinAttempts[0]!.data!;

    // Creator B cannot create a link in Creator A's membership
    const hijack = await creatorB.client.rpc("create_referral_link", {
      p_membership_id: membershipId,
      p_label: "Hijack",
      p_channel: "tiktok",
      p_destination_kind: "website",
    });
    expect(hijack.error?.message).toContain("not_allowed");
  });
});
