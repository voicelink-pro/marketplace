import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { as, asUser, createAuthUser, createTestDb, type TestDb } from "./harness";

const seedSqlPath = fileURLToPath(new URL("../../supabase/seed.sql", import.meta.url));

describe("creator program memberships, referral codes, named links, and similar apps (Stage 4)", () => {
  let db: TestDb;
  let creatorA: string;
  let creatorB: string;
  let unreadyCreator: string;
  let pulseAppId: string;
  let pulseTermsVersionId: string;
  let lexiAppId: string;
  let lexiTermsVersionId: string;
  let draftAppId: string;
  let creatorAPulseMembershipId: string;

  beforeAll(async () => {
    db = await createTestDb();
    await db.exec(readFileSync(seedSqlPath, "utf8"));

    creatorA = await createAuthUser(db, { email: "creator-a@example.test", displayName: "Creator A" });
    creatorB = await createAuthUser(db, { email: "creator-b@example.test", displayName: "Creator B" });
    unreadyCreator = await createAuthUser(db, {
      email: "unready@example.test",
      displayName: "Unready User",
    });

    // Creator A and B complete creator onboarding with social links; unreadyCreator has none.
    await asUser(
      db,
      creatorA,
      async (tx) => {
        await tx.query(`insert into public.creator_profiles (user_id) values ($1)`, [creatorA]);
        await tx.query(
          `insert into public.creator_social_links (creator_id, platform, url)
           values ($1, 'instagram', 'https://www.instagram.com/creator_a')`,
          [creatorA],
        );
      },
      { commit: true },
    );

    await asUser(
      db,
      creatorB,
      async (tx) => {
        await tx.query(`insert into public.creator_profiles (user_id) values ($1)`, [creatorB]);
        await tx.query(
          `insert into public.creator_social_links (creator_id, platform, url)
           values ($1, 'tiktok', 'https://www.tiktok.com/@creator_b')`,
          [creatorB],
        );
      },
      { commit: true },
    );

    await as(db, "anon", null, async (tx) => {
      const pulse = await tx.query<{ app_id: string; terms_version_id: string }>(
        `select app_id, terms_version_id from public.catalog_listings where slug = 'pulse-coach'`,
      );
      pulseAppId = pulse.rows[0]!.app_id;
      pulseTermsVersionId = pulse.rows[0]!.terms_version_id;

      const lexi = await tx.query<{ app_id: string; terms_version_id: string }>(
        `select app_id, terms_version_id from public.catalog_listings where slug = 'lexi-notes'`,
      );
      lexiAppId = lexi.rows[0]!.app_id;
      lexiTermsVersionId = lexi.rows[0]!.terms_version_id;
    });

    await as(db, "service_role", null, async (tx) => {
      const draft = await tx.query<{ id: string }>(
        `select id from public.apps where slug = 'stealth-draft-app'`,
      );
      draftAppId = draft.rows[0]!.id;
    });
  });

  it("denies anonymous access to memberships, links, and RPCs", async () => {
    await expect(
      as(db, "anon", null, (tx) => tx.query(`select * from public.creator_program_memberships`)),
    ).rejects.toThrow();

    await expect(
      as(db, "anon", null, (tx) => tx.query(`select * from public.creator_referral_links`)),
    ).rejects.toThrow();

    await expect(
      as(db, "anon", null, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [pulseAppId, pulseTermsVersionId]),
      ),
    ).rejects.toThrow();
  });

  it("requires a social profile and explicit terms acceptance before joining", async () => {
    // User without a social profile cannot join
    await expect(
      asUser(db, unreadyCreator, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [pulseAppId, pulseTermsVersionId]),
      ),
    ).rejects.toThrow(/social_profile_required/);

    // Ready creator who did not check "accept terms" cannot join
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(`select public.join_program($1, $2, false)`, [pulseAppId, pulseTermsVersionId]),
      ),
    ).rejects.toThrow(/terms_acceptance_required/);

    // Ready creator passing mismatched terms version ID cannot join
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [pulseAppId, lexiTermsVersionId]),
      ),
    ).rejects.toThrow(/stale_or_invalid_terms_version/);
  });

  it("refuses joining a draft or unpublished app", async () => {
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [draftAppId, pulseTermsVersionId]),
      ),
    ).rejects.toThrow(/app_not_published/);
  });

  it("instantly joins a published program, generates a referral code and default link, and is idempotent on repeat clicks", async () => {
    creatorAPulseMembershipId = await asUser(
      db,
      creatorA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.join_program($1, $2, true) as id`,
          [pulseAppId, pulseTermsVersionId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );

    // Second click returns the exact same membership and does not duplicate rows or links.
    const secondId = await asUser(
      db,
      creatorA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.join_program($1, $2, true) as id`,
          [pulseAppId, pulseTermsVersionId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );
    expect(secondId).toBe(creatorAPulseMembershipId);

    await asUser(db, creatorA, async (tx) => {
      const memberships = await tx.query<{
        id: string;
        app_id: string;
        accepted_terms_version_id: string;
        referral_code: string;
      }>(`select id, app_id, accepted_terms_version_id, referral_code from public.creator_program_memberships`);

      expect(memberships.rows).toHaveLength(1);
      expect(memberships.rows[0]!.id).toBe(creatorAPulseMembershipId);
      expect(memberships.rows[0]!.accepted_terms_version_id).toBe(pulseTermsVersionId);
      expect(memberships.rows[0]!.referral_code).toMatch(/^PULSE-[A-Z0-9]{6}$/);

      const links = await tx.query<{
        label: string;
        channel: string;
        destination_kind: string;
        target_url: string;
        token: string;
        is_default: boolean;
      }>(
        `select label, channel, destination_kind, target_url, token, is_default
         from public.creator_referral_links
         where membership_id = $1`,
        [creatorAPulseMembershipId],
      );
      expect(links.rows).toEqual([
        {
          label: "Primary link",
          channel: "instagram",
          destination_kind: "website",
          target_url: "https://pulsecoach.example.com",
          token: expect.stringMatching(/^pulse-coach-[a-z0-9]{8}$/),
          is_default: true,
        },
      ]);
    });
  });

  it("allows the owner to create named links with allowed app destinations and rejects arbitrary or unavailable destinations", async () => {
    await asUser(
      db,
      creatorA,
      async (tx) => {
        await tx.query(
          `select public.create_referral_link($1, 'Instagram bio', 'instagram', 'ios_store')`,
          [creatorAPulseMembershipId],
        );
        await tx.query(
          `select public.create_referral_link($1, 'TikTok video 1', 'tiktok', 'android_store')`,
          [creatorAPulseMembershipId],
        );
      },
      { commit: true },
    );

    // Duplicate label in the same membership is rejected
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(
          `select public.create_referral_link($1, 'instagram bio', 'instagram', 'website')`,
          [creatorAPulseMembershipId],
        ),
      ),
    ).rejects.toThrow(/duplicate_link_label/);

    // Join Lexi Notes (web/saas only — no iOS/Android store URLs)
    const lexiMembershipId = await asUser(
      db,
      creatorA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.join_program($1, $2, true) as id`,
          [lexiAppId, lexiTermsVersionId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );

    // Requesting ios_store on a web-only app is rejected
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(
          `select public.create_referral_link($1, 'iOS attempt', 'youtube', 'ios_store')`,
          [lexiMembershipId],
        ),
      ),
    ).rejects.toThrow(/destination_not_available_for_app/);

    // Even a privileged insert with an arbitrary target_url is blocked by the DB trigger
    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(
          `insert into public.creator_referral_links
             (membership_id, app_id, creator_id, label, channel, destination_kind, target_url, token)
           values ($1, $2, $3, 'Phishing link', 'other', 'website', 'https://evil.example.com/steal', 'pulse-coach-evil1234')`,
          [creatorAPulseMembershipId, pulseAppId, creatorA],
        ),
      ),
    ).rejects.toThrow(/arbitrary_redirect_url_forbidden/);
  });

  it("isolates memberships and links between creators and blocks creating links in another creator's membership", async () => {
    await asUser(db, creatorB, async (tx) => {
      const visibleMemberships = await tx.query(
        `select id from public.creator_program_memberships`,
      );
      expect(visibleMemberships.rows).toHaveLength(0);

      const visibleLinks = await tx.query(`select id from public.creator_referral_links`);
      expect(visibleLinks.rows).toHaveLength(0);
    });

    await expect(
      asUser(db, creatorB, (tx) =>
        tx.query(
          `select public.create_referral_link($1, 'Hijack link', 'tiktok', 'website')`,
          [creatorAPulseMembershipId],
        ),
      ),
    ).rejects.toThrow(/not_allowed/);
  });

  it("recommends similar published apps from active program categories, excluding already joined apps and drafts", async () => {
    // Creator B has joined 0 programs -> 0 suggestions
    await asUser(db, creatorB, async (tx) => {
      const emptySuggestions = await tx.query(
        `select slug from public.suggest_similar_apps_for_creator(4)`,
      );
      expect(emptySuggestions.rows).toHaveLength(0);
    });

    // Creator A has joined Pulse Coach (fitness, lifestyle) and Lexi Notes (ai, productivity).
    // Similar published apps sharing those categories in seed.sql:
    //   - framecut-studio (creative, ai) -> shares 'ai'
    //   - tempo-focus (productivity, lifestyle) -> shares 'productivity' and 'lifestyle' (2 matches!)
    //   - tracebeacon (developer, productivity) -> shares 'productivity'
    // Already-joined (pulse-coach, lexi-notes) and unpublished (stealth-draft-app, pending-review-app) must be excluded.
    await asUser(db, creatorA, async (tx) => {
      const suggestions = await tx.query<{ slug: string; shared_categories: string[] }>(
        `select slug, shared_categories from public.suggest_similar_apps_for_creator(6)`,
      );
      const slugs = suggestions.rows.map((r) => r.slug);

      expect(slugs).toEqual(["tempo-focus", "framecut-studio", "tracebeacon"]);
      expect(slugs).not.toContain("pulse-coach");
      expect(slugs).not.toContain("lexi-notes");
      expect(slugs).not.toContain("stealth-draft-app");
      expect(slugs).not.toContain("pending-review-app");
    });
  });
});
