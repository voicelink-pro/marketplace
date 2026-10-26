import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, asUser, createAuthUser, createTestDb, type TestDb } from "./harness";

describe("Stage 1–4 regression boundaries", () => {
  let db: TestDb;
  let admin: string;
  let owner: string;
  let creator: string;
  let stranger: string;
  let appId: string;
  let termsId: string;
  let planId: string;

  beforeAll(async () => {
    db = await createTestDb();
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    admin = await createAuthUser(db, { email: "admin-hardening@example.test" });
    owner = await createAuthUser(db, { email: "owner-hardening@example.test" });
    creator = await createAuthUser(db, { email: "creator-hardening@example.test" });
    stranger = await createAuthUser(db, { email: "stranger-hardening@example.test" });
    await db.query(`insert into public.platform_admins(user_id, granted_by) values ($1, 'test')`, [admin]);
    const listing = await db.query<{ app_id: string; terms_version_id: string }>(
      `select app_id, terms_version_id from public.catalog_listings where slug = 'pulse-coach'`,
    );
    appId = listing.rows[0]!.app_id;
    termsId = listing.rows[0]!.terms_version_id;
    await db.query(`insert into public.organization_members(organization_id, user_id, role)
      select organization_id, $2, 'owner' from public.apps where id = $1`, [appId, owner]);
    await db.query(`insert into public.creator_profiles(user_id) values ($1)`, [creator]);
    await db.query(`insert into public.creator_social_links(creator_id, platform, url)
      values ($1, 'instagram', 'https://instagram.com/regression')`, [creator]);
    await asUser(db, creator, tx => tx.query(`select public.join_program($1, $2, true)`, [appId, termsId]), { commit: true });
    const plans = await db.query<{ id: string }>(`select id from public.app_plans where app_id = $1 limit 1`, [appId]);
    planId = plans.rows[0]!.id;
  });
  afterAll(async () => db?.close());

  it("never exposes the working media inventory to anon or unrelated accounts after publication", async () => {
    await asUser(db, owner, tx => tx.query(`select public.save_app_draft($1, 'Pulse Coach',
      p_logo_url => 'https://assets.example.com/unapproved-draft.svg')`, [appId]));
    await expect(as(db, "anon", null, tx => tx.query(`select storage_path from public.app_media_assets`)))
      .rejects.toThrow(/permission denied/);
    await asUser(db, stranger, async tx => {
      expect((await tx.query(`select storage_path from public.app_media_assets where app_id=$1`, [appId])).rows).toHaveLength(0);
    });
  });

  it("hides internal plan identifiers even from logged-in outsiders and joined creators", async () => {
    for (const user of [stranger, creator]) {
      await expect(asUser(db, user, tx => tx.query(`select external_plan_key, plan_id from public.app_terms_plan_rates`)))
        .rejects.toThrow(/permission denied/);
      await asUser(db, user, async tx => {
        expect((await tx.query(`select commission_bps from public.catalog_plan_rates`)).rows.length).toBeGreaterThan(0);
      });
    }
  });

  it("archives a published plan without mutating or disconnecting historical rates", async () => {
    await asUser(db, owner, async tx => {
      await tx.query(`select public.delete_app_plan($1)`, [planId]);
      expect((await tx.query<{ is_active: boolean }>(`select is_active from public.app_plans where id=$1`, [planId])).rows[0]!.is_active).toBe(false);
      expect((await tx.query(`select id from public.catalog_plan_rates where terms_version_id=$1`, [termsId])).rows.length).toBeGreaterThan(0);
    });
    expect((await db.query(`select plan_id from public.app_terms_plan_rates where plan_id=$1`, [planId])).rows.length).toBeGreaterThan(0);
    await expect(asUser(db, stranger, tx => tx.query(`select public.delete_app_plan($1)`, [planId])))
      .rejects.toThrow(/not_allowed/);
  });

  it("disables the legacy public publisher for every API caller including admin", async () => {
    for (const user of [owner, admin]) {
      await expect(asUser(db, user, tx => tx.query(`select public.admin_publish_app($1)`, [appId])))
        .rejects.toThrow(/permission denied/);
    }
  });

  it("rejects a decision from a stale admin screen after a plan edit", async () => {
    await asUser(db, owner, tx => tx.query(`select public.submit_app_for_review($1)`, [appId]), { commit: true });
    const revision = Number((await db.query<{ review_revision: number }>(`select review_revision from public.apps where id=$1`, [appId])).rows[0]!.review_revision);
    await asUser(db, owner, tx => tx.query(`select public.delete_app_plan($1)`, [planId]), { commit: true });
    await expect(asUser(db, admin, tx => tx.query(`select public.admin_review_app($1,'approve',null,'demo',$2::bigint)`, [appId, revision])))
      .rejects.toThrow(/stale_review_revision/);
    expect((await db.query<{ status: string }>(`select status from public.apps where id=$1`, [appId])).rows[0]!.status).toBe("draft");
  });

  it("keeps accepted historical terms and rates readable to their creator after republication", async () => {
    await asUser(db, owner, tx => tx.query(`select public.submit_app_for_review($1)`, [appId]), { commit: true });
    await asUser(db, admin, tx => tx.query(`select public.admin_review_app($1,'approve',null,'demo',
      (select review_revision from public.apps where id=$1))`, [appId]), { commit: true });
    await asUser(db, creator, async tx => {
      expect((await tx.query(`select id from public.app_terms_versions where id=$1`, [termsId])).rows).toHaveLength(1);
      expect((await tx.query(`select commission_bps from public.app_terms_plan_rates where terms_version_id=$1`, [termsId])).rows.length).toBeGreaterThan(0);
      const programs = await tx.query(`select m.id from public.creator_program_memberships m
        join public.catalog_listings l on l.app_id=m.app_id
        join public.app_terms_versions t on t.id=m.accepted_terms_version_id
        where m.creator_id=$1`, [creator]);
      expect(programs.rows).toHaveLength(1);
    });
    await asUser(db, stranger, async tx => {
      expect((await tx.query(`select id from public.app_terms_versions where id=$1`, [termsId])).rows).toHaveLength(0);
    });
  });

  it("does not create another release or audit event when an approval is retried", async () => {
    const revision = Number((await db.query<{ review_revision: number }>(`select review_revision from public.apps where id=$1`, [appId])).rows[0]!.review_revision);
    const before = (await db.query(`select count(*) from public.app_review_events where app_id=$1`, [appId])).rows;
    await expect(asUser(db, admin, tx => tx.query(`select public.admin_review_app($1,'approve',null,'demo',$2::bigint)`, [appId, revision])))
      .rejects.toThrow(/app_not_submitted/);
    expect((await db.query(`select count(*) from public.app_review_events where app_id=$1`, [appId])).rows).toEqual(before);
  });
  it("lets the owner update an existing plan at the active limit, but blocks reactivating an extra plan", async () => {
    await asUser(db, owner, async tx => {
      for (let index = 0; index < 19; index++) {
        await tx.query(`select public.upsert_app_plan($1,$2,$2,'month',1000,'EUR',1500)`, [appId, `limit-plan-${index}`]);
      }
      await tx.query(`select public.upsert_app_plan($1,'Updated','limit-plan-0','month',1200,'EUR',1700)`, [appId]);
      await expect(tx.query(`select public.upsert_app_plan($1,'Restored','restored-key','month',1000,'EUR',1500,0::smallint,$2)`, [appId, planId]))
        .rejects.toThrow(/plan_limit_reached/);
    });
  });

  it("allows whole-app cleanup without weakening business snapshot immutability", async () => {
    await expect(db.query(`update public.app_terms_versions set terms_text='Unauthorized replacement terms' where id=$1`, [termsId]))
      .rejects.toThrow(/version_records_are_immutable/);
    await db.query(`delete from auth.users where id=$1`, [creator]);
    const org = await db.query<{ organization_id: string }>(`select organization_id from public.apps where id=$1`, [appId]);
    await db.query(`delete from public.organizations where id=$1`, [org.rows[0]!.organization_id]);
    expect((await db.query(`select id from public.apps where id=$1`, [appId])).rows).toHaveLength(0);
    expect((await db.query(`select id from public.app_terms_versions where id=$1`, [termsId])).rows).toHaveLength(0);
  });

});
