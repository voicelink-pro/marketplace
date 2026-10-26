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

describe.skipIf(!configured)("catalog through the Supabase Data API", () => {
  let admin: Client;
  let anon: Client;
  const createdOrgIds: string[] = [];

  beforeAll(async () => {
    admin = createClient<Database>(url!, secretKey!, clientOptions);
    anon = createClient<Database>(url!, publishableKey!, clientOptions);
  });

  afterAll(async () => {
    for (const id of createdOrgIds) {
      const removed = await admin.from("organizations").delete().eq("id", id);
      if (removed.error) throw removed.error;
    }
  });

  it("hides unpublished drafts and internal plan tables from anonymous API clients", async () => {
    const suffix = randomUUID().slice(0, 8);
    const publishedSlug = `it-pub-${suffix}`;
    const draftSlug = `it-draft-${suffix}`;

    const orgPub = await admin
      .from("organizations")
      .insert({ name: `IT Pub Org ${suffix}` } as never)
      .select("id")
      .single();
    if (orgPub.error) throw orgPub.error;
    createdOrgIds.push(orgPub.data.id);

    const appPub = await admin
      .from("apps")
      .insert({
        organization_id: orgPub.data.id,
        slug: publishedSlug,
        name: `IT Published ${suffix}`,
        tagline: "Integration test published listing with recurring commission.",
        description:
          "Full description for the integration test published app verifying Data API access.",
        categories: ["productivity"],
        platforms: ["web", "saas"],
        languages: ["en", "pl"],
        terms_text: "20% recurring commission on all paid renewals.",
      } as never)
      .select("id")
      .single();
    if (appPub.error) throw appPub.error;

    const planPub = await admin.from("app_plans").insert({
      app_id: appPub.data.id,
      name: "Monthly",
      external_plan_key: `secret_key_${suffix}`,
      billing_interval: "month",
      price_minor: 1900,
      currency: "EUR",
      commission_bps: 2000,
    } as never);
    if (planPub.error) throw planPub.error;

    const orgDraft = await admin
      .from("organizations")
      .insert({ name: `IT Draft Org ${suffix}` } as never)
      .select("id")
      .single();
    if (orgDraft.error) throw orgDraft.error;
    createdOrgIds.push(orgDraft.data.id);

    await admin.from("apps").insert({
      organization_id: orgDraft.data.id,
      slug: draftSlug,
      name: `IT Draft ${suffix}`,
      status: "draft",
    } as never);

    // Anon cannot see draft in catalog_listings
    const draftCheck = await anon.from("catalog_listings").select("slug").eq("slug", draftSlug);
    expect(draftCheck.data ?? []).toEqual([]);

    // Anon cannot read apps or app_plans tables directly
    const directApps = await anon.from("apps").select("id");
    expect(directApps.data ?? []).toEqual([]);
    const directPlans = await anon.from("app_plans").select("id");
    expect(directPlans.data ?? []).toEqual([]);
  });
});
