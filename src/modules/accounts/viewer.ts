import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  getSandboxSessionUserId,
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
  runInServiceRolePgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";

type OrganizationRole = Database["public"]["Enums"]["organization_role"];

export type ViewerOrganization = { id: string; name: string; role: OrganizationRole };

export type Viewer = {
  userId: string;
  email: string | null;
  displayName: string;
  isAdmin: boolean;
  creator: { socialLinkCount: number } | null;
  organizations: ViewerOrganization[];
};

/**
 * The signed-in user and the contexts they can use, read once per request.
 * Every read goes through RLS with the user's own session.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) return null;

    const email = await runInServiceRolePgliteSandbox(async (tx) => {
      const res = await tx.query<{ email: string | null }>(
        `select email from auth.users where id = $1 limit 1`,
        [userId],
      );
      return res.rows[0]?.email ?? null;
    });

    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const profileRes = await tx.query<{ display_name: string }>(
        `select display_name from public.profiles where id = $1 limit 1`,
        [userId],
      );
      const profileRow = profileRes.rows[0];
      if (!profileRow) return null;

      const adminRes = await tx.query<{ user_id: string }>(
        `select user_id from public.platform_admins where user_id = $1 limit 1`,
        [userId],
      );
      const creatorRes = await tx.query<{ user_id: string }>(
        `select user_id from public.creator_profiles where user_id = $1 limit 1`,
        [userId],
      );
      const linksCountRes = await tx.query<{ count: string | number }>(
        `select count(*) as count from public.creator_social_links where creator_id = $1`,
        [userId],
      );
      const membershipsRes = await tx.query<{
        id: string;
        name: string;
        role: OrganizationRole;
      }>(
        `select o.id, o.name, om.role
         from public.organization_members om
         join public.organizations o on o.id = om.organization_id
         where om.user_id = $1
         order by om.created_at`,
        [userId],
      );

      return {
        userId,
        email,
        displayName: profileRow.display_name,
        isAdmin: adminRes.rows.length > 0,
        creator:
          creatorRes.rows.length > 0
            ? { socialLinkCount: Number(linksCountRes.rows[0]?.count ?? 0) }
            : null,
        organizations: membershipsRes.rows.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
        })),
      };
    });
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const userId = claims?.sub;
  if (authError || !claims || typeof userId !== "string") return null;

  const [profile, admin, creator, socialLinks, memberships] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("creator_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("creator_social_links")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", userId),
    supabase
      .from("organization_members")
      .select("role, organizations ( id, name )")
      .eq("user_id", userId)
      .order("created_at"),
  ]);

  const failed = [profile, admin, creator, socialLinks, memberships].find((result) => result.error);
  if (failed?.error) {
    throw new Error(`Could not load account (${failed.error.code ?? "unknown"})`);
  }

  const email = typeof claims.email === "string" ? claims.email : null;

  return {
    userId,
    email,
    displayName: profile.data?.display_name ?? "New user",
    isAdmin: admin.data !== null,
    creator: creator.data ? { socialLinkCount: socialLinks.count ?? 0 } : null,
    organizations: (memberships.data ?? []).flatMap((membership) =>
      membership.organizations
        ? [{ id: membership.organizations.id, name: membership.organizations.name, role: membership.role }]
        : [],
    ),
  };
});

export async function requireViewer(returnTo = "/dashboard"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

/** The organization the company panel works with. MVP: the first membership. */
export function primaryOrganization(viewer: Viewer): ViewerOrganization | null {
  return viewer.organizations[0] ?? null;
}
