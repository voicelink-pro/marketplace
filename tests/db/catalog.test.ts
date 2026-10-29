import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { as, asUser, createAuthUser, createTestDb, type TestDb } from "./harness";

const seedSqlPath = fileURLToPath(new URL("../../supabase/seed.sql", import.meta.url));

describe("catalog, plans, and terms versions (RLS, immutability, filters, pagination)", () => {
  let db: TestDb;
  let adminId: string;
  let ownerA: string;
  let ownerB: string;
  let outsider: string;
  let orgAId: string;
  let orgBId: string;
  let publishedAppAId: string;
  let draftAppBId: string;

  beforeAll(async () => {
    db = await createTestDb();
    adminId = await createAuthUser(db, { email: "admin@example.test", displayName: "Admin" });
    ownerA = await createAuthUser(db, { email: "owner-a@example.test", displayName: "Owner A" });
    ownerB = await createAuthUser(db, { email: "owner-b@example.test", displayName: "Owner B" });
    outsider = await createAuthUser(db, { email: "outsider@example.test", displayName: "Outsider" });

    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        await tx.query(
          `insert into public.platform_admins (user_id, granted_by, note) values ($1, 'seed', 'test')`,
          [adminId],
        );
      },
      { commit: true },
    );

    orgAId = await asUser(
      db,
      ownerA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.create_organization('Pulse Labs') as id`,
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );

    orgBId = await asUser(
      db,
      ownerB,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.create_organization('Stealth Corp') as id`,
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );

    publishedAppAId = await asUser(
      db,
      ownerA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.create_app($1, 'Pulse Coach') as id`,
          [orgAId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );

    draftAppBId = await asUser(
      db,
      ownerB,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.create_app($1, 'Secret Draft App') as id`,
          [orgBId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );
  });

  it("returns an empty catalog when no apps are published", async () => {
    await as(db, "anon", null, async (tx) => {
      const listings = await tx.query(`select * from public.catalog_listings`);
      expect(listings.rows).toHaveLength(0);

      const search = await tx.query(`select * from public.list_catalog_apps()`);
      expect(search.rows).toHaveLength(0);
    });
  });

  it("blocks non-admins (including the company owner) from publishing an app", async () => {
    await expect(
      asUser(db, ownerA, (tx) =>
        tx.query(`select private.publish_app_release($1)`, [publishedAppAId]),
      ),
    ).rejects.toThrow(/permission denied/);

    await expect(
      as(db, "anon", null, (tx) =>
        tx.query(`select private.publish_app_release($1)`, [publishedAppAId]),
      ),
    ).rejects.toThrow();
  });

  it("refuses to publish an incomplete app or an app without active plans", async () => {
    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(`select private.publish_app_release($1)`, [publishedAppAId]),
      ),
    ).rejects.toThrow(/app_profile_incomplete/);

    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        await tx.query(
          `update public.apps
           set slug = 'pulse-coach',
               tagline = 'Guided strength & mobility plans for busy lifters.',
               description = 'Pulse Coach builds adaptive workouts for iOS, Android, and web subscribers with full progress tracking.',
               categories = array['fitness', 'lifestyle']::public.app_category[],
               platforms = array['ios', 'android', 'web']::public.app_platform[],
               languages = array['en', 'pl', 'de'],
               website_url = 'https://pulsecoach.example.com',
               ios_store_url = 'https://apps.apple.com/app/pulse-coach/id123456789',
               android_store_url = 'https://play.google.com/store/apps/details?id=com.example.pulse',
               logo_url = '/demo/pulse-logo.svg',
               cover_image_url = '/demo/pulse-cover.svg',
               screenshots = '[{"url":"/demo/pulse-screen-1.svg","alt":"Workout planner"},{"url":"/demo/pulse-screen-2.svg","alt":"Progress streaks"}]'::jsonb,
               video_url = 'https://cdn.example.com/pulse-demo.mp4',
               terms_text = 'Recurring commission on every subscription renewal for as long as the referred customer keeps paying.',
               attribution_window_days = 30
           where id = $1`,
          [publishedAppAId],
        );
      },
      { commit: true },
    );

    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(`select private.publish_app_release($1)`, [publishedAppAId]),
      ),
    ).rejects.toThrow(/app_requires_active_plan/);
  });

  it("publishes an approved release with an immutable terms version and multi-plan rate range", async () => {
    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        await tx.query(
          `insert into public.app_plans
             (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order)
           values
             ($1, 'Monthly', 'price_pulse_monthly', 'month', 1499, 'EUR', 1500, 1),
             ($1, 'Annual', 'price_pulse_annual', 'year', 11900, 'EUR', 2500, 2),
             ($1, 'Legacy Inactive', 'price_pulse_legacy', 'month', 999, 'EUR', 4000, 3)`,
          [publishedAppAId],
        );
        await tx.query(
          `update public.app_plans set is_active = false where app_id = $1 and external_plan_key = 'price_pulse_legacy'`,
          [publishedAppAId],
        );
      },
      { commit: true },
    );

    await as(db, "service_role", null,
      async (tx) => {
        await tx.query(`select private.publish_app_release($1)`, [publishedAppAId]);
      },
      { commit: true },
    );

    await as(db, "anon", null, async (tx) => {
      const listing = await tx.query<{
        slug: string;
        name: string;
        organization_name: string;
        min_commission_bps: number;
        max_commission_bps: number;
        terms_version_number: number;
      }>(`select slug, name, organization_name, min_commission_bps, max_commission_bps, terms_version_number from public.catalog_listings where slug = 'pulse-coach'`);
      expect(listing.rows).toEqual([
        {
          slug: "pulse-coach",
          name: "Pulse Coach",
          organization_name: "Pulse Labs",
          min_commission_bps: 1500,
          max_commission_bps: 2500,
          terms_version_number: 1,
        },
      ]);

      const plans = await tx.query<{
        plan_name: string;
        billing_interval: string;
        price_minor: string | number;
        currency: string;
        commission_bps: number;
      }>(
        `select plan_name, billing_interval, price_minor, currency, commission_bps
         from public.catalog_plan_rates
         where app_slug = 'pulse-coach'
         order by sort_order`,
      );
      expect(plans.rows.map((r) => ({ ...r, price_minor: Number(r.price_minor) }))).toEqual([
        {
          plan_name: "Monthly",
          billing_interval: "month",
          price_minor: 1499,
          currency: "EUR",
          commission_bps: 1500,
        },
        {
          plan_name: "Annual",
          billing_interval: "year",
          price_minor: 11900,
          currency: "EUR",
          commission_bps: 2500,
        },
      ]);
    });
  });

  it("hides draft/submitted apps and internal plan keys from anon and other users", async () => {
    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        await tx.query(
          `update public.apps
           set slug = 'secret-draft-app',
               tagline = 'Should never leak before review.',
               description = 'Internal draft description that must remain hidden from the public catalog.',
               categories = array['developer']::public.app_category[],
               platforms = array['saas']::public.app_platform[],
               languages = array['en'],
               status = 'submitted'
           where id = $1`,
          [draftAppBId],
        );
        await tx.query(
          `insert into public.app_plans
             (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps)
           values ($1, 'Pro', 'stripe_secret_price_id', 'month', 4900, 'EUR', 3000)`,
          [draftAppBId],
        );
      },
      { commit: true },
    );

    // Anon cannot read apps, app_plans, or external_plan_key on app_terms_plan_rates.
    await expect(
      as(db, "anon", null, (tx) => tx.query(`select * from public.apps`)),
    ).rejects.toThrow();
    await expect(
      as(db, "anon", null, (tx) => tx.query(`select * from public.app_plans`)),
    ).rejects.toThrow();
    await expect(
      as(db, "anon", null, (tx) =>
        tx.query(`select external_plan_key from public.app_terms_plan_rates`),
      ),
    ).rejects.toThrow();

    await as(db, "anon", null, async (tx) => {
      const draftLookup = await tx.query(
        `select * from public.catalog_listings where slug = 'secret-draft-app'`,
      );
      expect(draftLookup.rows).toHaveLength(0);
    });

    // Another signed-in user (outsider) also cannot read organization B's draft app or plans.
    await asUser(db, outsider, async (tx) => {
      const apps = await tx.query(`select id from public.apps where id = $1`, [draftAppBId]);
      expect(apps.rows).toHaveLength(0);

      const plans = await tx.query(`select id from public.app_plans where app_id = $1`, [
        draftAppBId,
      ]);
      expect(plans.rows).toHaveLength(0);
    });
  });

  it("does not expose unapproved draft edits on an already published app until re-approved", async () => {
    // Company edits working draft and working plan rates.
    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        await tx.query(
          `update public.apps
           set name = 'Pulse Coach UNAPPROVED V2',
               tagline = 'Unapproved draft tagline that public visitors must not see.',
               status = 'submitted'
           where id = $1`,
          [publishedAppAId],
        );
        await tx.query(
          `update public.app_plans set commission_bps = 3500 where app_id = $1 and external_plan_key = 'price_pulse_annual'`,
          [publishedAppAId],
        );
      },
      { commit: true },
    );

    // Public catalog still serves release #1 and terms version #1 (1500..2500 bps).
    await as(db, "anon", null, async (tx) => {
      const listing = await tx.query<{
        name: string;
        min_commission_bps: number;
        max_commission_bps: number;
        terms_version_number: number;
      }>(
        `select name, min_commission_bps, max_commission_bps, terms_version_number
         from public.catalog_listings where slug = 'pulse-coach'`,
      );
      expect(listing.rows[0]).toEqual({
        name: "Pulse Coach",
        min_commission_bps: 1500,
        max_commission_bps: 2500,
        terms_version_number: 1,
      });
    });

    // Now admin approves the new version -> creates terms_version #2 and release #2, preserving #1 in history.
    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        await tx.query(
          `update public.apps set name = 'Pulse Coach', tagline = 'Guided strength & mobility plans for busy lifters.' where id = $1`,
          [publishedAppAId],
        );
      },
      { commit: true },
    );

    await as(db, "service_role", null,
      async (tx) => {
        await tx.query(`select private.publish_app_release($1)`, [publishedAppAId]);
      },
      { commit: true },
    );

    await as(db, "anon", null, async (tx) => {
      const listing = await tx.query<{
        min_commission_bps: number;
        max_commission_bps: number;
        terms_version_number: number;
      }>(
        `select min_commission_bps, max_commission_bps, terms_version_number
         from public.catalog_listings where slug = 'pulse-coach'`,
      );
      expect(listing.rows[0]).toEqual({
        min_commission_bps: 1500,
        max_commission_bps: 3500,
        terms_version_number: 2,
      });

      // Historical version #1 is no longer visible to anon, only current version #2.
      const visibleVersions = await tx.query<{ version_number: number }>(
        `select version_number from public.app_terms_versions where app_id = $1`,
        [publishedAppAId],
      );
      expect(visibleVersions.rows).toEqual([{ version_number: 2 }]);
    });

    // Organization owner and admin still see both historical version #1 and current version #2.
    await asUser(db, ownerA, async (tx) => {
      const versions = await tx.query<{ version_number: number; max_commission_bps: number }>(
        `select version_number, max_commission_bps
         from public.app_terms_versions
         where app_id = $1
         order by version_number`,
        [publishedAppAId],
      );
      expect(versions.rows).toEqual([
        { version_number: 1, max_commission_bps: 2500 },
        { version_number: 2, max_commission_bps: 3500 },
      ]);
    });
  });

  it("forbids updating or deleting published terms versions, plan rates, and release snapshots", async () => {
    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(`update public.app_terms_versions set min_commission_bps = 500`),
      ),
    ).rejects.toThrow(/version_records_are_immutable/);

    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(`delete from public.app_terms_versions where version_number = 1`),
      ),
    ).rejects.toThrow(/version_records_are_immutable/);

    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(`update public.app_terms_plan_rates set commission_bps = 500`),
      ),
    ).rejects.toThrow(/version_records_are_immutable/);

    await expect(
      as(db, "service_role", null, (tx) =>
        tx.query(`update public.app_releases set name = 'Tampered'`),
      ),
    ).rejects.toThrow(/release_records_are_immutable/);
  });

  it("filters by search, category, platform, language, commission, and paginates accurately", async () => {
    // Seed two more published apps under dedicated organizations to test filtering & pagination.
    await as(
      db,
      "service_role",
      null,
      async (tx) => {
        const org2 = await tx.query<{ id: string }>(
          `insert into public.organizations (name) values ('Lexi Studio') returning id`,
        );
        const app2 = await tx.query<{ id: string }>(
          `insert into public.apps (
             organization_id, slug, name, tagline, description,
             categories, platforms, languages, terms_text, published_at
           ) values (
             $1, 'lexi-notes', 'Lexi Notes',
             'AI meeting notes and summaries in 12 languages.',
             'Lexi Notes records, transcribes, and organizes action items for remote teams across web and SaaS workflows.',
             array['ai', 'productivity']::public.app_category[],
             array['web', 'saas']::public.app_platform[],
             array['en', 'es', 'fr'],
             '20% recurring commission on all plans.',
             now() - interval '2 days'
           ) returning id`,
          [org2.rows[0]!.id],
        );
        await tx.query(
          `insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps)
           values ($1, 'Pro Monthly', 'lexi_pro_m', 'month', 1900, 'USD', 2000)`,
          [app2.rows[0]!.id],
        );
        await tx.query(`select private.publish_app_release($1, null)`, [app2.rows[0]!.id]);

        const org3 = await tx.query<{ id: string }>(
          `insert into public.organizations (name) values ('Konto GmbH') returning id`,
        );
        const app3 = await tx.query<{ id: string }>(
          `insert into public.apps (
             organization_id, slug, name, tagline, description,
             categories, platforms, languages, terms_text, published_at
           ) values (
             $1, 'konto-budget', 'Konto Budget',
             'Calm household budgeting and envelope planning.',
             'Konto helps couples and freelancers plan monthly budgets across iOS and web without spreadsheets.',
             array['finance']::public.app_category[],
             array['ios', 'web']::public.app_platform[],
             array['de', 'en'],
             '30% recurring commission on annual subscriptions.',
             now() - interval '1 day'
           ) returning id`,
          [org3.rows[0]!.id],
        );
        await tx.query(
          `insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps)
           values ($1, 'Annual', 'konto_annual', 'year', 5900, 'EUR', 3000)`,
          [app3.rows[0]!.id],
        );
        await tx.query(`select private.publish_app_release($1, null)`, [app3.rows[0]!.id]);
      },
      { commit: true },
    );

    await as(db, "anon", null, async (tx) => {
      // Unfiltered: 3 published apps (secret-draft-app is excluded).
      const all = await tx.query<{ slug: string; total_count: string }>(
        `select slug, total_count from public.list_catalog_apps()`,
      );
      expect(all.rows).toHaveLength(3);
      expect(Number(all.rows[0]!.total_count)).toBe(3);

      // Search query
      const bySearch = await tx.query<{ slug: string }>(
        `select slug from public.list_catalog_apps(p_search => 'envelope')`,
      );
      expect(bySearch.rows.map((r) => r.slug)).toEqual(["konto-budget"]);

      // Wildcard characters in search are escaped, not treated as SQL wildcards
      const wildcardSearch = await tx.query<{ slug: string }>(
        `select slug from public.list_catalog_apps(p_search => '100%_guaranteed_nonexistent')`,
      );
      expect(wildcardSearch.rows).toHaveLength(0);

      // Category filter
      const byCategory = await tx.query<{ slug: string }>(
        `select slug from public.list_catalog_apps(p_category => 'ai')`,
      );
      expect(byCategory.rows.map((r) => r.slug)).toEqual(["lexi-notes"]);

      // Platform filter
      const byPlatform = await tx.query<{ slug: string }>(
        `select slug from public.list_catalog_apps(p_platform => 'android')`,
      );
      expect(byPlatform.rows.map((r) => r.slug)).toEqual(["pulse-coach"]);

      // Language filter
      const byLanguage = await tx.query<{ slug: string }>(
        `select slug from public.list_catalog_apps(p_language => 'es')`,
      );
      expect(byLanguage.rows.map((r) => r.slug)).toEqual(["lexi-notes"]);

      // Minimum commission filter (3000 bps = 30%+)
      const byCommission = await tx.query<{ slug: string }>(
        `select slug from public.list_catalog_apps(p_min_commission_bps => 3000)`,
      );
      expect(byCommission.rows.map((r) => r.slug).sort()).toEqual(["konto-budget", "pulse-coach"]);

      // Pagination: page_size = 2, page 1 and page 2
      const page1 = await tx.query<{ slug: string; total_count: string }>(
        `select slug, total_count from public.list_catalog_apps(p_page => 1, p_page_size => 2)`,
      );
      const page2 = await tx.query<{ slug: string; total_count: string }>(
        `select slug, total_count from public.list_catalog_apps(p_page => 2, p_page_size => 2)`,
      );
      expect(page1.rows).toHaveLength(2);
      expect(page2.rows).toHaveLength(1);
      expect(Number(page1.rows[0]!.total_count)).toBe(3);
      expect(Number(page2.rows[0]!.total_count)).toBe(3);
      expect(page1.rows.map((r) => r.slug)).not.toContain(page2.rows[0]!.slug);
    });
  });

  it("loads supabase/seed.sql cleanly and hides its draft and submitted apps from the public catalog", async () => {
    const seededDb = await createTestDb();
    await seededDb.exec(readFileSync(seedSqlPath, "utf8"));
    // Idempotent second run
    await seededDb.exec(readFileSync(seedSqlPath, "utf8"));

    await as(seededDb, "anon", null, async (tx) => {
      const page1 = await tx.query<{ slug: string; total_count: string }>(
        `select slug, total_count from public.list_catalog_apps(p_page => 1, p_page_size => 6)`,
      );
      const page2 = await tx.query<{ slug: string; total_count: string }>(
        `select slug, total_count from public.list_catalog_apps(p_page => 2, p_page_size => 6)`,
      );
      expect(page1.rows).toHaveLength(6);
      expect(page2.rows).toHaveLength(4);
      expect(Number(page1.rows[0]!.total_count)).toBe(10);

      const allSlugs = [...page1.rows, ...page2.rows].map((r) => r.slug);
      expect(allSlugs).not.toContain("stealth-draft-app");
      expect(allSlugs).not.toContain("pending-review-app");

      const draftDetail = await tx.query(
        `select * from public.catalog_listings where slug in ('stealth-draft-app', 'pending-review-app')`,
      );
      expect(draftDetail.rows).toHaveLength(0);
    });
  });
});
