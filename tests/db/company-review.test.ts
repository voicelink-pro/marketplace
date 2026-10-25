import { beforeAll, describe, expect, it } from "vitest";
import { as, asUser, createAuthUser, createTestDb, type TestDb } from "./harness";

describe("company app draft, plans, media ACL, submission, and admin review workflow (Stage 3)", () => {
  let db: TestDb;
  let adminId: string;
  let ownerA: string;
  let ownerB: string;
  let orgAId: string;
  let orgBId: string;
  let appAId: string;

  beforeAll(async () => {
    db = await createTestDb();
    adminId = await createAuthUser(db, { email: "admin-s3@example.test", displayName: "Admin S3" });
    ownerA = await createAuthUser(db, { email: "owner-a-s3@example.test", displayName: "Owner A" });
    ownerB = await createAuthUser(db, { email: "owner-b-s3@example.test", displayName: "Owner B" });

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
          `select public.create_organization('Orbit Works') as id`,
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
          `select public.create_organization('Rival Inc') as id`,
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );

    appAId = await asUser(
      db,
      ownerA,
      async (tx) => {
        const res = await tx.query<{ id: string }>(
          `select public.create_app($1, 'Orbit Habit') as id`,
          [orgAId],
        );
        return res.rows[0]!.id;
      },
      { commit: true },
    );
  });

  it("enforces the 1-app-per-company limit and isolates drafts, plans, and media from other companies and anon", async () => {
    await expect(
      asUser(db, ownerA, (tx) =>
        tx.query(`select public.create_app($1, 'Second App')`, [orgAId]),
      ),
    ).rejects.toThrow(/app_limit_reached/);

    await expect(
      asUser(db, ownerA, (tx) =>
        tx.query(`select public.create_app($1, 'Cross Org App')`, [orgBId]),
      ),
    ).rejects.toThrow(/not_allowed/);

    // Owner A saves draft with media and a plan
    await asUser(
      db,
      ownerA,
      async (tx) => {
        await tx.query(
          `select public.save_app_draft(
             $1,
             'Orbit Habit',
             'orbit-habit',
             'Daily habit streaks and accountability groups across iOS and web.',
             'Orbit Habit helps individuals and small groups build consistent daily routines with gentle streak reminders and weekly check-ins.',
             array['productivity', 'lifestyle']::public.app_category[],
             array['ios', 'web']::public.app_platform[],
             array['en', 'pl'],
             'https://orbithabit.example.com',
             'https://apps.apple.com/app/orbit-habit/id999000111',
             null,
             '/demo/logo-pulse.svg',
             '/demo/cover-pulse.svg',
             '[{"url":"/demo/screen-pulse-1.svg","alt":"Orbit streak view"}]'::jsonb,
             'https://orbithabit.example.com/demo/walkthrough.mp4',
             'Earn recurring commission on every paid renewal for as long as the referred customer stays subscribed.',
             30::smallint
           )`,
          [appAId],
        );

        await tx.query(
          `select public.upsert_app_plan($1, 'Monthly', 'orbit_monthly_eur', 'month', 999, 'EUR', 1500, 1::smallint)`,
          [appAId],
        );
        await tx.query(
          `select public.upsert_app_plan($1, 'Annual', 'orbit_annual_eur', 'year', 7900, 'EUR', 2500, 2::smallint)`,
          [appAId],
        );
      },
      { commit: true },
    );

    // Owner B cannot read or modify Company A's app, plans, or media assets
    await asUser(db, ownerB, async (tx) => {
      const apps = await tx.query(`select id from public.apps where id = $1`, [appAId]);
      expect(apps.rows).toHaveLength(0);

      const plans = await tx.query(`select id from public.app_plans where app_id = $1`, [appAId]);
      expect(plans.rows).toHaveLength(0);

      const media = await tx.query(`select id from public.app_media_assets where app_id = $1`, [
        appAId,
      ]);
      expect(media.rows).toHaveLength(0);
    });

    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query(`select public.save_app_draft($1, 'Hijacked')`, [appAId]),
      ),
    ).rejects.toThrow(/not_allowed/);

    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query(
          `select public.upsert_app_plan($1, 'Hijack', 'hijack_key', 'month', 1000, 'EUR', 5000)`,
          [appAId],
        ),
      ),
    ).rejects.toThrow(/not_allowed/);

    // Anon cannot see unpublished media assets or the draft in the public catalog
    await as(db, "anon", null, async (tx) => {
      const media = await tx.query(`select id from public.app_media_assets where app_id = $1`, [
        appAId,
      ]);
      expect(media.rows).toHaveLength(0);

      const catalog = await tx.query(
        `select slug from public.catalog_listings where slug = 'orbit-habit'`,
      );
      expect(catalog.rows).toHaveLength(0);
    });
  });

  it("handles draft -> submitted -> rejected (with reason) -> resubmitted -> approved (demo) end to end", async () => {
    // Company A submits the app for review
    await asUser(
      db,
      ownerA,
      async (tx) => {
        await tx.query(`select public.submit_app_for_review($1)`, [appAId]);
        const app = await tx.query<{ status: string }>(`select status from public.apps where id = $1`, [
          appAId,
        ]);
        expect(app.rows[0]!.status).toBe("submitted");
      },
      { commit: true },
    );

    // Non-admin cannot review
    await expect(
      asUser(db, ownerA, (tx) =>
        tx.query(`select public.admin_review_app($1, 'approve', null, 'demo')`, [appAId]),
      ),
    ).rejects.toThrow(/not_allowed/);

    // Admin rejecting without a reason fails validation
    await expect(
      asUser(db, adminId, (tx) =>
        tx.query(`select public.admin_review_app($1, 'reject', '   ', 'demo')`, [appAId]),
      ),
    ).rejects.toThrow(/rejection_reason_required/);

    // Admin sends the submission back with a specific reason
    await asUser(
      db,
      adminId,
      async (tx) => {
        await tx.query(
          `select public.admin_review_app($1, 'reject', 'Please clarify whether free trials are offered in the program terms.', 'demo')`,
          [appAId],
        );
      },
      { commit: true },
    );

    // Company A sees status = 'rejected' and the admin's reason
    await asUser(db, ownerA, async (tx) => {
      const app = await tx.query<{ status: string; rejection_reason: string }>(
        `select status, rejection_reason from public.apps where id = $1`,
        [appAId],
      );
      expect(app.rows[0]).toEqual({
        status: "rejected",
        rejection_reason: "Please clarify whether free trials are offered in the program terms.",
      });
    });

    // Still not in public catalog
    await as(db, "anon", null, async (tx) => {
      const catalog = await tx.query(
        `select slug from public.catalog_listings where slug = 'orbit-habit'`,
      );
      expect(catalog.rows).toHaveLength(0);
    });

    // Company A updates the draft and resubmits
    await asUser(
      db,
      ownerA,
      async (tx) => {
        await tx.query(
          `select public.save_app_draft(
             $1,
             'Orbit Habit',
             'orbit-habit',
             'Daily habit streaks and accountability groups across iOS and web.',
             'Orbit Habit helps individuals and small groups build consistent daily routines with gentle streak reminders and weekly check-ins.',
             array['productivity', 'lifestyle']::public.app_category[],
             array['ios', 'web']::public.app_platform[],
             array['en', 'pl'],
             'https://orbithabit.example.com',
             'https://apps.apple.com/app/orbit-habit/id999000111',
             null,
             '/demo/logo-pulse.svg',
             '/demo/cover-pulse.svg',
             '[{"url":"/demo/screen-pulse-1.svg","alt":"Orbit streak view"}]'::jsonb,
             'https://orbithabit.example.com/demo/walkthrough.mp4',
             'Recurring commission on every paid renewal after the 7-day trial converts to a paid subscription.',
             30::smallint
           )`,
          [appAId],
        );
        await tx.query(`select public.submit_app_for_review($1)`, [appAId]);
      },
      { commit: true },
    );

    // Admin attempting live publication before integration & funding are verified is blocked
    await expect(
      asUser(db, adminId, (tx) =>
        tx.query(`select public.admin_review_app($1, 'approve', null, 'live')`, [appAId]),
      ),
    ).rejects.toThrow(/live_publication_requires_verified_integration_and_funding/);

    // Admin approves in the demo environment
    await asUser(
      db,
      adminId,
      async (tx) => {
        await tx.query(
          `select public.admin_review_app($1, 'approve', 'Checklist verified for demo catalog.', 'demo')`,
          [appAId],
        );
      },
      { commit: true },
    );

    // Published version is now live in the public catalog and its media assets are readable by anon
    await as(db, "anon", null, async (tx) => {
      const listing = await tx.query<{
        slug: string;
        min_commission_bps: number;
        max_commission_bps: number;
        terms_version_number: number;
      }>(
        `select slug, min_commission_bps, max_commission_bps, terms_version_number
         from public.catalog_listings where slug = 'orbit-habit'`,
      );
      expect(listing.rows[0]).toEqual({
        slug: "orbit-habit",
        min_commission_bps: 1500,
        max_commission_bps: 2500,
        terms_version_number: 1,
      });

      const media = await tx.query<{ asset_kind: string }>(
        `select asset_kind from public.app_media_assets where app_id = $1`,
        [appAId],
      );
      expect(media.rows.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("versions subsequent profile and rate changes without exposing unapproved drafts or overwriting rate history", async () => {
    // Company A edits working draft tagline AND increases Annual plan commission to 35% (3500 bps), then submits
    await asUser(
      db,
      ownerA,
      async (tx) => {
        await tx.query(
          `select public.save_app_draft(
             $1,
             'Orbit Habit UNAPPROVED DRAFT TITLE',
             'orbit-habit',
             'Unapproved draft tagline that public visitors must not see.',
             'Orbit Habit helps individuals and small groups build consistent daily routines with gentle streak reminders and weekly check-ins.',
             array['productivity', 'lifestyle']::public.app_category[],
             array['ios', 'web']::public.app_platform[],
             array['en', 'pl'],
             'https://orbithabit.example.com',
             'https://apps.apple.com/app/orbit-habit/id999000111',
             null,
             '/demo/logo-pulse.svg',
             '/demo/cover-pulse.svg',
             '[{"url":"/demo/screen-pulse-1.svg","alt":"Orbit streak view"}]'::jsonb,
             'https://orbithabit.example.com/demo/walkthrough.mp4',
             'Updated terms v2 pending review.',
             30::smallint
           )`,
          [appAId],
        );

        await tx.query(
          `select public.upsert_app_plan($1, 'Annual', 'orbit_annual_eur', 'year', 7900, 'EUR', 3500, 2::smallint)`,
          [appAId],
        );

        await tx.query(`select public.submit_app_for_review($1)`, [appAId]);
      },
      { commit: true },
    );

    // Public visitor STILL sees approved Release #1 ("Orbit Habit", 1500..2500 bps, Terms v1)
    await as(db, "anon", null, async (tx) => {
      const listing = await tx.query<{
        name: string;
        min_commission_bps: number;
        max_commission_bps: number;
        terms_version_number: number;
      }>(
        `select name, min_commission_bps, max_commission_bps, terms_version_number
         from public.catalog_listings where slug = 'orbit-habit'`,
      );
      expect(listing.rows[0]).toEqual({
        name: "Orbit Habit",
        min_commission_bps: 1500,
        max_commission_bps: 2500,
        terms_version_number: 1,
      });
    });

    // Now admin approves the new submission -> creates Release #2 and Terms v2 (1500..3500 bps), preserving Terms v1
    await asUser(
      db,
      adminId,
      async (tx) => {
        await tx.query(
          `select public.admin_review_app($1, 'approve', 'Approved v2 rate increase.', 'demo')`,
          [appAId],
        );
      },
      { commit: true },
    );

    await as(db, "anon", null, async (tx) => {
      const listing = await tx.query<{
        name: string;
        min_commission_bps: number;
        max_commission_bps: number;
        terms_version_number: number;
      }>(
        `select name, min_commission_bps, max_commission_bps, terms_version_number
         from public.catalog_listings where slug = 'orbit-habit'`,
      );
      expect(listing.rows[0]).toEqual({
        name: "Orbit Habit UNAPPROVED DRAFT TITLE",
        min_commission_bps: 1500,
        max_commission_bps: 3500,
        terms_version_number: 2,
      });
    });

    // Company A still has both immutable terms versions (v1 @ 2500 max bps, v2 @ 3500 max bps)
    await asUser(db, ownerA, async (tx) => {
      const versions = await tx.query<{ version_number: number; max_commission_bps: number }>(
        `select version_number, max_commission_bps
         from public.app_terms_versions
         where app_id = $1
         order by version_number`,
        [appAId],
      );
      expect(versions.rows).toEqual([
        { version_number: 1, max_commission_bps: 2500 },
        { version_number: 2, max_commission_bps: 3500 },
      ]);
    });
  });
});
