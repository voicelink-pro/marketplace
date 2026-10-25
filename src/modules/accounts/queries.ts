import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  getSandboxSessionUserId,
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";
import type { SocialLinkView } from "./components/social-links-manager";

/** Data reads for account screens. All run as the signed-in user under RLS. */

export async function getOwnSocialLinks(userId: string): Promise<SocialLinkView[]> {
  if (isLocalPgliteSandboxEnabled()) {
    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const res = await tx.query<SocialLinkView>(
        `select id, platform, url
         from public.creator_social_links
         where creator_id = $1
         order by created_at`,
        [userId],
      );
      return res.rows;
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_social_links")
    .select("id, platform, url")
    .eq("creator_id", userId)
    .order("created_at");
  if (error) throw new Error(`Could not load social links (${error.code})`);
  return data;
}

export type OrganizationApp = {
  id: string;
  name: string;
  status: Database["public"]["Enums"]["app_status"];
  createdAt: string;
};

export async function getOrganizationApps(organizationId: string): Promise<OrganizationApp[]> {
  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) return [];
    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const res = await tx.query<{
        id: string;
        name: string;
        status: Database["public"]["Enums"]["app_status"];
        created_at: string | Date;
      }>(
        `select id, name, status, created_at
         from public.apps
         where organization_id = $1
         order by created_at`,
        [organizationId],
      );
      return res.rows.map((app) => ({
        id: app.id,
        name: app.name,
        status: app.status,
        createdAt:
          app.created_at instanceof Date ? app.created_at.toISOString() : String(app.created_at),
      }));
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apps")
    .select("id, name, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at");
  if (error) throw new Error(`Could not load apps (${error.code})`);
  return data.map((app) => ({
    id: app.id,
    name: app.name,
    status: app.status,
    createdAt: app.created_at,
  }));
}

export type OrganizationDetails = { id: string; name: string; maxApps: number; memberCount: number };

export async function getOrganizationDetails(organizationId: string): Promise<OrganizationDetails> {
  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) throw new Error("Not signed in");
    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const orgRes = await tx.query<{ id: string; name: string; max_apps: number }>(
        `select id, name, max_apps from public.organizations where id = $1 limit 1`,
        [organizationId],
      );
      const org = orgRes.rows[0];
      if (!org) throw new Error("Could not load company");

      const membersRes = await tx.query<{ count: string | number }>(
        `select count(*) as count from public.organization_members where organization_id = $1`,
        [organizationId],
      );
      return {
        id: org.id,
        name: org.name,
        maxApps: Number(org.max_apps),
        memberCount: Number(membersRes.rows[0]?.count ?? 0),
      };
    });
  }

  const supabase = await createClient();
  const [organization, members] = await Promise.all([
    supabase.from("organizations").select("id, name, max_apps").eq("id", organizationId).single(),
    supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);
  if (organization.error) throw new Error(`Could not load company (${organization.error.code})`);
  if (members.error) throw new Error(`Could not load members (${members.error.code})`);
  return {
    id: organization.data.id,
    name: organization.data.name,
    maxApps: organization.data.max_apps,
    memberCount: members.count ?? 0,
  };
}

export type AdminUserRow = {
  id: string;
  displayName: string;
  joinedAt: string;
  isCreator: boolean;
  companyCount: number;
};

/** Admin-only: RLS returns rows beyond the caller's own only for platform admins. */
export async function listUsersForAdmin(limit = 100): Promise<AdminUserRow[]> {
  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) return [];
    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const profilesRes = await tx.query<{
        id: string;
        display_name: string;
        created_at: string | Date;
      }>(
        `select id, display_name, created_at
         from public.profiles
         order by created_at desc
         limit $1`,
        [limit],
      );
      if (profilesRes.rows.length === 0) return [];

      const creatorsRes = await tx.query<{ user_id: string }>(
        `select user_id from public.creator_profiles`,
      );
      const membershipsRes = await tx.query<{ user_id: string }>(
        `select user_id from public.organization_members`,
      );

      const creatorIds = new Set(creatorsRes.rows.map((row) => row.user_id));
      const companyCounts = new Map<string, number>();
      for (const row of membershipsRes.rows) {
        companyCounts.set(row.user_id, (companyCounts.get(row.user_id) ?? 0) + 1);
      }

      return profilesRes.rows.map((profile) => ({
        id: profile.id,
        displayName: profile.display_name,
        joinedAt:
          profile.created_at instanceof Date
            ? profile.created_at.toISOString()
            : String(profile.created_at),
        isCreator: creatorIds.has(profile.id),
        companyCount: companyCounts.get(profile.id) ?? 0,
      }));
    });
  }

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load users (${error.code})`);

  const ids = profiles.map((profile) => profile.id);
  if (ids.length === 0) return [];

  const [creators, memberships] = await Promise.all([
    supabase.from("creator_profiles").select("user_id").in("user_id", ids),
    supabase.from("organization_members").select("user_id").in("user_id", ids),
  ]);
  if (creators.error) throw new Error(`Could not load creators (${creators.error.code})`);
  if (memberships.error) throw new Error(`Could not load memberships (${memberships.error.code})`);

  const creatorIds = new Set(creators.data.map((row) => row.user_id));
  const companyCounts = new Map<string, number>();
  for (const row of memberships.data) {
    companyCounts.set(row.user_id, (companyCounts.get(row.user_id) ?? 0) + 1);
  }

  return profiles.map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    joinedAt: profile.created_at,
    isCreator: creatorIds.has(profile.id),
    companyCount: companyCounts.get(profile.id) ?? 0,
  }));
}
