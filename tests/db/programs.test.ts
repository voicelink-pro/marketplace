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
  let monetraAppId: string;
  let monetraTermsVersionId: string;
  let draftlyAppId: string;
  let draftlyTermsVersionId: string;
  let draftAppId: string;
  let creatorAMonetraMembershipId: string;

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
      const monetra = await tx.query<{ app_id: string; terms_version_id: string }>(
        `select app_id, terms_version_id from public.catalog_listings where slug = 'monetra'`,
      );
      monetraAppId = monetra.rows[0]!.app_id;
      monetraTermsVersionId = monetra.rows[0]!.terms_version_id;

      const draftly = await tx.query<{ app_id: string; terms_version_id: string }>(
        `select app_id, terms_version_id from public.catalog_listings where slug = 'draftly'`,
      );
      draftlyAppId = draftly.rows[0]!.app_id;
      draftlyTermsVersionId = draftly.rows[0]!.terms_version_id;
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
        tx.query(`select public.join_program($1, $2, true)`, [monetraAppId, monetraTermsVersionId]),
      ),
    ).rejects.toThrow();
  });

  it("requires a social profile and explicit terms acceptance before joining", async () => {
    // User without a social profile cannot join
    await expect(
      asUser(db, unreadyCreator, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [monetraAppId, monetraTermsVersionId]),
      ),
    ).rejects.toThrow(/social_profile_required/);

    // Ready creator who did not check "accept terms" cannot join
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(`select public.join_program($1, $2, false)`, [monetraAppId, monetraTermsVersionId]),
      ),
    ).rejects.toThrow(/terms_acceptance_required/);

    // Ready creator passing mismatched terms version ID cannot join
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [monetraAppId, draftlyTermsVersionId]),
      ),
    ).rejects.toThrow(/stale_or_invalid_terms_version/);
  });

  it("refuses joining a draft or unpublished app", async () => {
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(`select public.join_program($1, $2, true)`, [draftAppId, monetraTermsVersionId]),
      ),
    ).rejects.toThrow(/app_not_published/);
  });

  it("instantly joins a published program, generates a referral code and default link, and is idempotent on repeat clicks", async () => {
    creatorAMonetraMembershipId = await asUser(
      db,
      creatorA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.join_program($1, $2, true) as id`,
          [monetraAppId, monetraTermsVersionId],
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
          [monetraAppId, monetraTermsVersionId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );
    expect(secondId).toBe(creatorAMonetraMembershipId);

    await asUser(db, creatorA, async (tx) => {
      const memberships = await tx.query<{
        id: string;
        app_id: string;
        accepted_terms_version_id: string;
        referral_code: string;
      }>(`select id, app_id, accepted_terms_version_id, referral_code from public.creator_program_memberships`);

      expect(memberships.rows).toHaveLength(1);
      expect(memberships.rows[0]!.id).toBe(creatorAMonetraMembershipId);
      expect(memberships.rows[0]!.accepted_terms_version_id).toBe(monetraTermsVersionId);
      expect(memberships.rows[0]!.referral_code).toMatch(/^MONETRA-[A-Z0-9]{6}$/);

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
        [creatorAMonetraMembershipId],
      );
      expect(links.rows).toEqual([
        {
          label: "Primary link",
          channel: "instagram",
          destination_kind: "website",
          target_url: "https://monetra.example.com",
          token: expect.stringMatching(/^monetra-[a-z0-9]{8}$/),
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
          [creatorAMonetraMembershipId],
        );
        await tx.query(
          `select public.create_referral_link($1, 'TikTok video 1', 'tiktok', 'android_store')`,
          [creatorAMonetraMembershipId],
        );
      },
      { commit: true },
    );

    // Duplicate label in the same membership is rejected
    await expect(
      asUser(db, creatorA, (tx) =>
        tx.query(
          `select public.create_referral_link($1, 'instagram bio', 'instagram', 'website')`,
          [creatorAMonetraMembershipId],
        ),
      ),
    ).rejects.toThrow(/duplicate_link_label/);

    // Join Draftly (web/saas only — no iOS/Android store URLs)
    const draftlyMembershipId = await asUser(
      db,
      creatorA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.join_program($1, $2, true) as id`,
          [draftlyAppId, draftlyTermsVersionId],
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
          [draftlyMembershipId],
        ),
      ),
    ).rejects.toThrow(/destination_not_available_for_app/);

    // Even a privileged insert with an arbitrary target_url is blocked by the DB trigger
    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(
          `insert into public.creator_referral_links
             (membership_id, app_id, creator_id, label, channel, destination_kind, target_url, token)
           values ($1, $2, $3, 'Phishing link', 'other', 'website', 'https://evil.example.com/steal', 'monetra-evil1234')`,
          [creatorAMonetraMembershipId, monetraAppId, creatorA],
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
          [creatorAMonetraMembershipId],
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

    // Creator A has joined Monetra (finance, lifestyle) and Draftly (ai, productivity).
    // Similar published apps in seed.sql, by shared categories, then max commission:
    //   - mellow (productivity, lifestyle) -> 2 shared categories
    //   - crewpass 30%, orbitly 28%, lumio 26%, pipely 22%, payvio 15% -> 1 each
    //   - boxora 12% (productivity) also shares one but falls past the limit of 6
    // stacklane (developer) shares none. Already-joined (monetra, draftly) and
    // unpublished (stealth-draft-app, pending-review-app) must be excluded.
    await asUser(db, creatorA, async (tx) => {
      const suggestions = await tx.query<{ slug: string; shared_categories: string[] }>(
        `select slug, shared_categories from public.suggest_similar_apps_for_creator(6)`,
      );
      const slugs = suggestions.rows.map((r) => r.slug);

      expect(slugs).toEqual(["mellow", "crewpass", "orbitly", "lumio", "pipely", "payvio"]);
      expect(slugs).not.toContain("monetra");
      expect(slugs).not.toContain("draftly");
      expect(slugs).not.toContain("stacklane");
      expect(slugs).not.toContain("stealth-draft-app");
      expect(slugs).not.toContain("pending-review-app");
    });
  });
});
