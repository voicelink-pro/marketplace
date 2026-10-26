import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");

describe("company review, historical access and real private Storage", () => {
  const service = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, options);
  const anon = createClient<Database>(url, key, options);
  const users: string[] = [];
  const organizations: string[] = [];
  const objects: string[] = [];
  let owner: Client;
  let other: Client;
  let admin: Client;
  let creator: Client;
  let creatorUserId: string;
  let appId: string;
  let appB: string;
  let planId: string;
  let termsV1: string;
  let approvedPath: string;
  const slug = `review-${randomUUID()}`;

  async function user(name: string) {
    const email = `it-review-${randomUUID()}@example.test`;
    const password = `Test-${randomUUID()}-1`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
    if (created.error) throw created.error;
    users.push(created.data.user.id);
    const client = createClient<Database>(url, key, options);
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    return { id: created.data.user.id, client };
  }

  async function revision() {
    const result = await owner.from("apps").select("review_revision").eq("id", appId).single();
    if (result.error) throw result.error;
    return result.data.review_revision;
  }

  function saveDraft(logo: string) {
    return owner.rpc("save_app_draft", {
      p_app_id: appId, p_name: "Review App", p_slug: slug,
      p_tagline: "An integration-tested app profile for creators.",
      p_description: "A complete profile whose publication and private media are verified through the actual Data API.",
      p_categories: ["productivity"], p_platforms: ["web"], p_languages: ["en"],
      p_website_url: "https://product.example.com", p_logo_url: logo,
      p_cover_image_url: logo,
      p_terms_text: "Recurring commission on each paid renewal, with historical rates preserved.",
    });
  }

  beforeAll(async () => {
    const [a, b, c, d] = await Promise.all([user("Owner"), user("Other"), user("Admin"), user("Creator")]);
    owner = a.client; other = b.client; admin = c.client; creator = d.client; creatorUserId = d.id;
    const grant = await service.from("platform_admins").insert({ user_id: c.id, granted_by: "integration-test" });
    if (grant.error) throw grant.error;
    for (const [client, label] of [[owner, "Review owner"], [other, "Other owner"]] as const) {
      const org = await client.rpc("create_organization", { p_name: label });
      if (org.error) throw org.error;
      organizations.push(org.data);
      const app = await client.rpc("create_app", { p_organization_id: org.data, p_name: label });
      if (app.error) throw app.error;
      if (client === owner) appId = app.data; else appB = app.data;
    }
    const profile = await creator.from("creator_profiles").insert({ user_id: d.id });
    if (profile.error) throw profile.error;
    const social = await creator.from("creator_social_links").insert({ creator_id: d.id, platform: "instagram", url: "https://instagram.com/integrationcreator" });
    if (social.error) throw social.error;
  });

  afterAll(async () => {
    // Clean only this suite's unique fixtures, never seed data or other projects.
    for (const id of users) await service.from("platform_admins").delete().eq("user_id", id);
    const creatorId = creatorUserId;
    if (creatorId) {
      const removed = await service.auth.admin.deleteUser(creatorId);
      if (removed.error) throw removed.error;
    }
    for (const id of organizations) {
      const removed = await service.from("organizations").delete().eq("id", id);
      if (removed.error) throw removed.error;
    }
    for (const id of users.filter(id => id !== creatorUserId)) {
      const removed = await service.auth.admin.deleteUser(id);
      if (removed.error) throw removed.error;
    }
    if (objects.length) await service.storage.from("app-media").remove(objects);
  });

  it("keeps drafts private, forbids foreign upload and overwrite, and checks asset ownership", async () => {
    approvedPath = `${appId}/${randomUUID()}.png`;
    objects.push(approvedPath);
    expect((await owner.storage.from("app-media").upload(approvedPath, png, { contentType: "image/png" })).error).toBeNull();
    expect((await anon.storage.from("app-media").download(approvedPath)).error).not.toBeNull();
    expect((await other.storage.from("app-media").download(approvedPath)).error).not.toBeNull();
    expect((await other.storage.from("app-media").upload(`${appId}/${randomUUID()}.png`, png, { contentType: "image/png" })).error).not.toBeNull();
    expect((await owner.storage.from("app-media").upload(approvedPath, png, { contentType: "image/png", upsert: true })).error).not.toBeNull();
    const foreignPath = `${appB}/${randomUUID()}.png`; objects.push(foreignPath);
    expect((await other.storage.from("app-media").upload(foreignPath, png, { contentType: "image/png" })).error).toBeNull();
    expect((await saveDraft(`/media/apps/${foreignPath}`)).error?.message).toContain("invalid_or_foreign_media_object");
  });

  it("reviews a specific submission, publishes once under concurrent approvals, and exposes only approved media", async () => {
    expect((await saveDraft(`/media/apps/${approvedPath}`)).error).toBeNull();
    for (const [name, rate] of [["monthly", 1500], ["annual", 2500]] as const) {
      const plan = await owner.rpc("upsert_app_plan", { p_app_id: appId, p_name: name, p_external_plan_key: name, p_billing_interval: "month", p_price_minor: 1000, p_currency: "EUR", p_commission_bps: rate });
      expect(plan.error).toBeNull();
      if (name === "monthly") planId = plan.data!;
    }
    expect((await owner.rpc("submit_app_for_review", { p_app_id: appId })).error).toBeNull();
    const v = await revision();
    expect((await owner.rpc("admin_review_app", { p_app_id: appId, p_decision: "approve", p_expected_revision: v })).error?.message).toContain("not_allowed");
    expect((await admin.rpc("admin_review_app", { p_app_id: appId, p_decision: "approve", p_environment: "live", p_expected_revision: v })).error?.message).toContain("live_publication_requires");
    expect((await admin.rpc("admin_publish_app", { p_app_id: appId })).error).not.toBeNull();
    const attempts = await Promise.all(Array.from({ length: 3 }, () => admin.rpc("admin_review_app", { p_app_id: appId, p_decision: "approve", p_expected_revision: v })));
    expect(attempts.filter(a => !a.error)).toHaveLength(1);
    expect((await anon.storage.from("app-media").download(approvedPath)).error).toBeNull();
    const listing = await anon.from("catalog_listings").select("terms_version_id,logo_url").eq("app_id", appId).single();
    expect(listing.error).toBeNull(); termsV1 = listing.data!.terms_version_id!;
    expect(listing.data!.logo_url).toBe(`/media/apps/${approvedPath}`);
    const joined = await creator.rpc("join_program", { p_app_id: appId, p_accepted_terms_version_id: termsV1, p_accepted_terms: true });
    expect(joined.error).toBeNull();
  });

  it("does not leak a new draft file and retains accepted history after republishing", async () => {
    const pendingPath = `${appId}/${randomUUID()}.png`; objects.push(pendingPath);
    expect((await owner.storage.from("app-media").upload(pendingPath, png, { contentType: "image/png" })).error).toBeNull();
    expect((await saveDraft(`/media/apps/${pendingPath}`)).error).toBeNull();
    expect((await anon.storage.from("app-media").download(pendingPath)).error).not.toBeNull();
    expect((await anon.from("app_media_assets").select("storage_path")).error).not.toBeNull();
    const foreignMedia = await other.from("app_media_assets").select("id").eq("app_id", appId);
    expect(foreignMedia.error).toBeNull(); expect(foreignMedia.data).toEqual([]);
    expect((await owner.rpc("submit_app_for_review", { p_app_id: appId })).error).toBeNull();
    const stale = await revision();
    expect((await owner.rpc("delete_app_plan", { p_plan_id: planId })).error).toBeNull();
    expect((await admin.rpc("admin_review_app", { p_app_id: appId, p_decision: "approve", p_expected_revision: stale })).error?.message).toContain("stale_review_revision");
    expect((await owner.rpc("submit_app_for_review", { p_app_id: appId })).error).toBeNull();
    expect((await admin.rpc("admin_review_app", { p_app_id: appId, p_decision: "approve", p_expected_revision: await revision() })).error).toBeNull();
    const history = await creator.from("app_terms_versions").select("id").eq("id", termsV1);
    expect(history.error).toBeNull(); expect(history.data).toHaveLength(1);
    const rates = await creator.from("app_terms_plan_rates").select("commission_bps").eq("terms_version_id", termsV1);
    expect(rates.error).toBeNull(); expect(rates.data).toHaveLength(2);
    expect((await other.from("app_terms_plan_rates").select("external_plan_key")).error).not.toBeNull();
    expect((await anon.storage.from("app-media").download(pendingPath)).error).toBeNull();
    expect((await anon.storage.from("app-media").download(approvedPath)).error).not.toBeNull();
  });
});
