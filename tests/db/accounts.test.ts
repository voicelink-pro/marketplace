import { beforeEach, describe, expect, it } from "vitest";
import { as, asUser, createAuthUser, createTestDb, type TestDb } from "./harness";

let db: TestDb;
let alice: string;
let bob: string;

async function createOrganization(userId: string, name: string): Promise<string> {
  return asUser(
    db,
    userId,
    async (tx) => {
      const result = await tx.query<{ id: string }>(
        "select public.create_organization($1) as id",
        [name],
      );
      return result.rows[0]!.id;
    },
    { commit: true },
  );
}

async function createApp(userId: string, organizationId: string, name: string) {
  return asUser(
    db,
    userId,
    async (tx) => {
      const result = await tx.query<{ id: string }>("select public.create_app($1, $2) as id", [
        organizationId,
        name,
      ]);
      return result.rows[0]!.id;
    },
    { commit: true },
  );
}

beforeEach(async () => {
  db = await createTestDb();
  alice = await createAuthUser(db, { email: "alice@example.test", displayName: "Alice" });
  bob = await createAuthUser(db, { email: "bob@example.test", displayName: "Bob" });
});

describe("profiles", () => {
  it("creates a profile for every new auth user", async () => {
    const rows = await asUser(db, alice, (tx) =>
      tx.query<{ id: string; display_name: string }>("select id, display_name from public.profiles"),
    );
    expect(rows.rows).toEqual([{ id: alice, display_name: "Alice" }]);
  });

  it("falls back to a neutral display name instead of the email address", async () => {
    const carol = await createAuthUser(db, { email: "carol@example.test" });
    const rows = await asUser(db, carol, (tx) =>
      tx.query<{ display_name: string }>("select display_name from public.profiles"),
    );
    expect(rows.rows[0]!.display_name).toBe("New user");
  });

  it("lets a user rename only their own profile", async () => {
    await asUser(
      db,
      bob,
      (tx) => tx.query("update public.profiles set display_name = 'Mallory' where id = $1", [alice]),
      { commit: true },
    );
    const own = await asUser(db, alice, async (tx) => {
      await tx.query("update public.profiles set display_name = 'Alice B.' where id = $1", [alice]);
      return tx.query<{ display_name: string }>("select display_name from public.profiles");
    });
    expect(own.rows[0]!.display_name).toBe("Alice B.");
    const after = await asUser(db, alice, (tx) =>
      tx.query<{ display_name: string }>("select display_name from public.profiles"),
    );
    expect(after.rows[0]!.display_name).toBe("Alice");
  });

  it("does not let a user change columns other than display_name", async () => {
    await expect(
      asUser(db, alice, (tx) =>
        tx.query("update public.profiles set id = gen_random_uuid() where id = $1", [alice]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("hides profiles from anonymous visitors", async () => {
    await expect(
      as(db, "anon", null, (tx) => tx.query("select * from public.profiles")),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("platform admin role", () => {
  it("cannot be granted through the Data API", async () => {
    await expect(
      asUser(db, alice, (tx) =>
        tx.query("insert into public.platform_admins (user_id, granted_by) values ($1, 'self')", [
          alice,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("ignores user-editable metadata that claims admin", async () => {
    const eve = await createAuthUser(db, {
      email: "eve@example.test",
      displayName: "Eve",
    });
    await db.query(
      `update auth.users set raw_user_meta_data = '{"role":"admin","is_admin":true}' where id = $1`,
      [eve],
    );
    const rows = await asUser(db, eve, (tx) =>
      tx.query<{ user_id: string }>("select user_id from public.platform_admins"),
    );
    expect(rows.rows).toEqual([]);
  });

  it("lets an admin see their own admin row and every profile", async () => {
    await db.query(
      "insert into public.platform_admins (user_id, granted_by) values ($1, 'ops-script')",
      [alice],
    );
    const result = await asUser(db, alice, async (tx) => ({
      admin: (await tx.query("select user_id from public.platform_admins")).rows.length,
      profiles: (await tx.query("select id from public.profiles")).rows.length,
    }));
    expect(result).toEqual({ admin: 1, profiles: 2 });
  });

  it("does not let a non-admin see other admins", async () => {
    await db.query(
      "insert into public.platform_admins (user_id, granted_by) values ($1, 'ops-script')",
      [alice],
    );
    const rows = await asUser(db, bob, (tx) => tx.query("select * from public.platform_admins"));
    expect(rows.rows).toEqual([]);
  });
});

describe("organizations", () => {
  it("creates an organization with the caller as owner", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    const members = await asUser(db, alice, (tx) =>
      tx.query<{ organization_id: string; user_id: string; role: string }>(
        "select organization_id, user_id, role from public.organization_members",
      ),
    );
    expect(members.rows).toEqual([{ organization_id: orgId, user_id: alice, role: "owner" }]);
  });

  it("returns the existing organization when the owner submits twice", async () => {
    const first = await createOrganization(alice, "Acme Apps");
    const second = await createOrganization(alice, "Acme Apps");
    expect(second).toBe(first);
    const count = await db.query<{ n: number }>(
      "select count(*)::int as n from public.organizations",
    );
    expect(count.rows[0]!.n).toBe(1);
  });

  it("rejects invalid organization names", async () => {
    await expect(createOrganization(alice, " ")).rejects.toThrow(/invalid_organization_name/);
  });

  it("requires a signed-in user", async () => {
    await expect(
      as(db, "anon", null, (tx) => tx.query("select public.create_organization('Acme')")),
    ).rejects.toThrow(/permission denied/);
  });

  it("isolates organizations between users", async () => {
    const aliceOrg = await createOrganization(alice, "Acme Apps");
    const seenByBob = await asUser(db, bob, async (tx) => ({
      orgs: (await tx.query("select id from public.organizations")).rows,
      members: (await tx.query("select user_id from public.organization_members")).rows,
      byId: (await tx.query("select id from public.organizations where id = $1", [aliceOrg])).rows,
    }));
    expect(seenByBob).toEqual({ orgs: [], members: [], byId: [] });
  });

  it("does not let another user rename an organization", async () => {
    const aliceOrg = await createOrganization(alice, "Acme Apps");
    const updated = await asUser(db, bob, (tx) =>
      tx.query("update public.organizations set name = 'Hijacked' where id = $1", [aliceOrg]),
    );
    expect(updated.affectedRows).toBe(0);
  });

  it("lets the owner rename the organization", async () => {
    const aliceOrg = await createOrganization(alice, "Acme Apps");
    const name = await asUser(db, alice, async (tx) => {
      await tx.query("update public.organizations set name = 'Acme Studio' where id = $1", [
        aliceOrg,
      ]);
      return (await tx.query<{ name: string }>("select name from public.organizations")).rows[0]!
        .name;
    });
    expect(name).toBe("Acme Studio");
  });

  it("does not let an owner raise their own app limit", async () => {
    const aliceOrg = await createOrganization(alice, "Acme Apps");
    await expect(
      asUser(db, alice, (tx) =>
        tx.query("update public.organizations set max_apps = 5 where id = $1", [aliceOrg]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("does not allow inserting memberships directly", async () => {
    const aliceOrg = await createOrganization(alice, "Acme Apps");
    await expect(
      asUser(db, bob, (tx) =>
        tx.query(
          "insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'owner')",
          [aliceOrg, bob],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("hides organizations from anonymous visitors", async () => {
    await createOrganization(alice, "Acme Apps");
    await expect(
      as(db, "anon", null, (tx) => tx.query("select * from public.organizations")),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("apps", () => {
  it("lets an owner create the first app as a draft", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    const appId = await createApp(alice, orgId, "Acme Notes");
    const rows = await asUser(db, alice, (tx) =>
      tx.query<{ id: string; status: string }>("select id, status from public.apps"),
    );
    expect(rows.rows).toEqual([{ id: appId, status: "draft" }]);
  });

  it("enforces one app per organization in the MVP", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    await createApp(alice, orgId, "Acme Notes");
    await expect(createApp(alice, orgId, "Acme Tasks")).rejects.toThrow(/app_limit_reached/);
  });

  it("enforces the limit even for privileged inserts", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    await createApp(alice, orgId, "Acme Notes");
    await expect(
      db.query("insert into public.apps (organization_id, name) values ($1, 'Backdoor')", [orgId]),
    ).rejects.toThrow(/app_limit_reached/);
  });

  it("honours a higher limit configured by the platform", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    await db.query("update public.organizations set max_apps = 2 where id = $1", [orgId]);
    await createApp(alice, orgId, "Acme Notes");
    await expect(createApp(alice, orgId, "Acme Tasks")).resolves.toBeTypeOf("string");
  });

  it("does not let a non-member create an app in someone else's organization", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    await expect(createApp(bob, orgId, "Bob's App")).rejects.toThrow(/not_allowed/);
  });

  it("does not allow inserting apps directly", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    await expect(
      asUser(db, alice, (tx) =>
        tx.query("insert into public.apps (organization_id, name) values ($1, 'Direct')", [orgId]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("hides apps of other organizations", async () => {
    const orgId = await createOrganization(alice, "Acme Apps");
    await createApp(alice, orgId, "Acme Notes");
    const rows = await asUser(db, bob, (tx) => tx.query("select id from public.apps"));
    expect(rows.rows).toEqual([]);
  });

  it("does not let an app move to another organization", async () => {
    const aliceOrg = await createOrganization(alice, "Acme Apps");
    const bobOrg = await createOrganization(bob, "Bob Labs");
    const appId = await createApp(alice, aliceOrg, "Acme Notes");
    await expect(
      db.query("update public.apps set organization_id = $1 where id = $2", [bobOrg, appId]),
    ).rejects.toThrow(/app_organization_immutable/);
  });
});

describe("creator profiles and social links", () => {
  async function becomeCreator(userId: string) {
    await asUser(
      db,
      userId,
      (tx) => tx.query("insert into public.creator_profiles (user_id) values ($1)", [userId]),
      { commit: true },
    );
  }

  it("lets a user enable the creator context for themselves only", async () => {
    await becomeCreator(alice);
    await expect(
      asUser(db, bob, (tx) =>
        tx.query("insert into public.creator_profiles (user_id) values ($1)", [alice]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("stores social links for the owner and hides them from others", async () => {
    await becomeCreator(alice);
    await asUser(
      db,
      alice,
      (tx) =>
        tx.query(
          "insert into public.creator_social_links (creator_id, platform, url) values ($1, 'instagram', 'https://instagram.com/alice')",
          [alice],
        ),
      { commit: true },
    );
    const own = await asUser(db, alice, (tx) => tx.query("select url from public.creator_social_links"));
    const others = await asUser(db, bob, (tx) =>
      tx.query("select url from public.creator_social_links"),
    );
    expect(own.rows).toEqual([{ url: "https://instagram.com/alice" }]);
    expect(others.rows).toEqual([]);
  });

  it("does not let a user add links to someone else's creator profile", async () => {
    await becomeCreator(alice);
    await becomeCreator(bob);
    await expect(
      asUser(db, bob, (tx) =>
        tx.query(
          "insert into public.creator_social_links (creator_id, platform, url) values ($1, 'tiktok', 'https://tiktok.com/@bob')",
          [alice],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("rejects non-https URLs at the database level", async () => {
    await becomeCreator(alice);
    await expect(
      asUser(db, alice, (tx) =>
        tx.query(
          "insert into public.creator_social_links (creator_id, platform, url) values ($1, 'other', 'javascript:alert(1)')",
          [alice],
        ),
      ),
    ).rejects.toThrow(/creator_social_links_url_check/);
  });

  it("has no verified flag that a creator could set", async () => {
    const columns = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'creator_social_links'",
    );
    expect(columns.rows.map((row) => row.column_name)).not.toContain("verified");
    expect(columns.rows.map((row) => row.column_name)).not.toContain("verified_at");
  });

  it("caps the number of social links per creator", async () => {
    await becomeCreator(alice);
    await asUser(
      db,
      alice,
      async (tx) => {
        for (let i = 0; i < 10; i++) {
          await tx.query(
            "insert into public.creator_social_links (creator_id, platform, url) values ($1, 'other', $2)",
            [alice, `https://example.com/alice/${i}`],
          );
        }
      },
      { commit: true },
    );
    await expect(
      asUser(db, alice, (tx) =>
        tx.query(
          "insert into public.creator_social_links (creator_id, platform, url) values ($1, 'other', 'https://example.com/alice/11')",
          [alice],
        ),
      ),
    ).rejects.toThrow(/social_link_limit_reached/);
  });

  it("reports whether a creator is ready to promote", async () => {
    await becomeCreator(alice);
    const before = await asUser(db, alice, (tx) =>
      tx.query<{ ready: boolean }>("select public.creator_is_ready_to_promote() as ready"),
    );
    await asUser(
      db,
      alice,
      (tx) =>
        tx.query(
          "insert into public.creator_social_links (creator_id, platform, url) values ($1, 'youtube', 'https://youtube.com/@alice')",
          [alice],
        ),
      { commit: true },
    );
    const after = await asUser(db, alice, (tx) =>
      tx.query<{ ready: boolean }>("select public.creator_is_ready_to_promote() as ready"),
    );
    expect([before.rows[0]!.ready, after.rows[0]!.ready]).toEqual([false, true]);
  });
});
