import "server-only";
import { z } from "zod";
import { toMinorBigInt } from "@/lib/money";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { SocialPlatform } from "@/modules/accounts/social";
import {
  APP_CATEGORIES,
  APP_PLATFORMS,
  type AppCategory,
  type AppPlatform,
  type BillingInterval,
} from "@/modules/catalog/constants";
import {
  getSandboxSessionUserId,
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";
import type { AppScreenshot } from "@/modules/catalog/queries";

export type AppStatus = Database["public"]["Enums"]["app_status"];

export type WorkingAppPlan = {
  id: string;
  appId: string;
  name: string;
  externalPlanKey: string;
  billingInterval: BillingInterval;
  priceMinor: bigint;
  currency: string;
  commissionBps: number;
  sortOrder: number;
  isActive: boolean;
};

export type TermsVersionSummary = {
  id: string;
  versionNumber: number;
  termsText: string;
  attributionWindowDays: number;
  minCommissionBps: number;
  maxCommissionBps: number;
  publishedAt: string;
};

export type ReviewEventView = {
  id: string;
  eventType: "submitted" | "approved" | "rejected";
  environment: "demo" | "live";
  note: string | null;
  createdAt: string;
};

export type CompanyWorkspaceApp = {
  id: string;
  organizationId: string;
  organizationName: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categories: AppCategory[];
  platforms: AppPlatform[];
  languages: string[];
  websiteUrl: string | null;
  iosStoreUrl: string | null;
  androidStoreUrl: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  screenshots: AppScreenshot[];
  videoUrl: string | null;
  termsText: string;
  attributionWindowDays: number;
  status: AppStatus;
  reviewRevision: number;
  publishEnvironment: "demo" | "live";
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  hasLivePublishedRelease: boolean;
  publishedReleaseNumber: number | null;
  plans: WorkingAppPlan[];
  termsVersions: TermsVersionSummary[];
  reviewEvents: ReviewEventView[];
};

export type CompanyCreatorRow = {
  membershipId: string;
  creatorId: string;
  displayName: string;
  referralCode: string;
  acceptedTermsVersionNumber: number;
  joinedAt: string;
  socialLinks: { id: string; platform: SocialPlatform; url: string }[];
};

function parseStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(",").map((part) => part.replace(/^"|"$/g, "").trim());
    }
  }
  return [];
}

function parseCategories(raw: unknown): AppCategory[] {
  return parseStringArray(raw).filter((item): item is AppCategory =>
    (APP_CATEGORIES as readonly string[]).includes(item),
  );
}

function parsePlatforms(raw: unknown): AppPlatform[] {
  return parseStringArray(raw).filter((item): item is AppPlatform =>
    (APP_PLATFORMS as readonly string[]).includes(item),
  );
}

function parseScreenshots(raw: unknown): AppScreenshot[] {
  const parsed =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return [];
          }
        })()
      : raw;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      "url" in entry &&
      "alt" in entry &&
      typeof entry.url === "string" &&
      typeof entry.alt === "string"
    ) {
      return [{ url: entry.url, alt: entry.alt }];
    }
    return [];
  });
}

function toIsoOrNull(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return String(val);
}

type RawAppRow = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categories: unknown;
  platforms: unknown;
  languages: unknown;
  website_url: string | null;
  ios_store_url: string | null;
  android_store_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  screenshots: unknown;
  video_url: string | null;
  terms_text: string;
  attribution_window_days: number;
  status: AppStatus;
  review_revision: number;
  publish_environment: "demo" | "live";
  submitted_at: unknown;
  reviewed_at: unknown;
  rejection_reason: string | null;
  published_at: unknown;
  created_at: unknown;
};

type RawPlanRow = {
  id: string;
  app_id: string;
  name: string;
  external_plan_key: string;
  billing_interval: BillingInterval;
  price_minor: bigint | number | string;
  currency: string;
  commission_bps: number;
  sort_order: number;
  is_active: boolean;
};

type RawTermsRow = {
  id: string;
  version_number: number;
  terms_text: string;
  attribution_window_days: number;
  min_commission_bps: number;
  max_commission_bps: number;
  published_at: unknown;
};

type RawReviewEventRow = {
  id: string;
  event_type: "submitted" | "approved" | "rejected";
  environment: "demo" | "live";
  note: string | null;
  created_at: unknown;
};

export async function getCompanyWorkspaceApp(
  organizationId: string,
  organizationName: string,
): Promise<CompanyWorkspaceApp | null> {
  let appRow: RawAppRow | null = null;
  let planRows: RawPlanRow[] = [];
  let termsRows: RawTermsRow[] = [];
  let eventRows: RawReviewEventRow[] = [];
  let publishedReleaseNumber: number | null = null;

  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) return null;

    const res = await runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const appRes = await tx.query<RawAppRow>(
        `select id, organization_id, slug, name, tagline, description,
                categories, platforms, languages,
                website_url, ios_store_url, android_store_url,
                logo_url, cover_image_url, screenshots, video_url,
                terms_text, attribution_window_days, status, review_revision, publish_environment,
                submitted_at, reviewed_at, rejection_reason, published_at, created_at
         from public.apps
         where organization_id = $1
         order by created_at
         limit 1`,
        [organizationId],
      );
      const found = appRes.rows[0] ?? null;
      if (!found) {
        return {
          appRow: null,
          planRows: [] as RawPlanRow[],
          termsRows: [] as RawTermsRow[],
          eventRows: [] as RawReviewEventRow[],
          publishedReleaseNumber: null as number | null,
        };
      }

      const pRes = await tx.query<RawPlanRow>(
        `select id, app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order, is_active
         from public.app_plans
         where app_id = $1
         order by sort_order, created_at`,
        [found.id],
      );

      const tvRes = await tx.query<RawTermsRow>(
        `select id, version_number, terms_text, attribution_window_days, min_commission_bps, max_commission_bps, published_at
         from public.app_terms_versions
         where app_id = $1
         order by version_number desc`,
        [found.id],
      );

      const evRes = await tx.query<RawReviewEventRow>(
        `select id, event_type, environment, note, created_at
         from public.app_review_events
         where app_id = $1
         order by created_at desc
         limit 10`,
        [found.id],
      );

      const relRes = await tx.query<{ release_number: number }>(
        `select release_number
         from public.app_releases
         where app_id = $1 and is_current_published = true
         limit 1`,
        [found.id],
      );

      return {
        appRow: found,
        planRows: pRes.rows,
        termsRows: tvRes.rows,
        eventRows: evRes.rows,
        publishedReleaseNumber: relRes.rows[0]?.release_number ?? null,
      };
    });

    appRow = res.appRow;
    planRows = res.planRows;
    termsRows = res.termsRows;
    eventRows = res.eventRows;
    publishedReleaseNumber = res.publishedReleaseNumber;
  } else {
    const supabase = await createClient();
    const { data: found, error: appErr } = await supabase
      .from("apps")
      .select(
        "id, organization_id, slug, name, tagline, description, categories, platforms, languages, website_url, ios_store_url, android_store_url, logo_url, cover_image_url, screenshots, video_url, terms_text, attribution_window_days, status, review_revision, publish_environment, submitted_at, reviewed_at, rejection_reason, published_at, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (appErr) throw new Error(`Could not load app (${appErr.code})`);
    if (!found) return null;
    appRow = { ...found, publish_environment: z.enum(["demo", "live"]).parse(found.publish_environment) };

    const [pRes, tvRes, evRes, relRes] = await Promise.all([
      supabase
        .from("app_plans")
        .select(
          "id, app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order, is_active",
        )
        .eq("app_id", found.id)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("app_terms_versions")
        .select(
          "id, version_number, terms_text, attribution_window_days, min_commission_bps, max_commission_bps, published_at",
        )
        .eq("app_id", found.id)
        .order("version_number", { ascending: false }),
      supabase
        .from("app_review_events")
        .select("id, event_type, environment, note, created_at")
        .eq("app_id", found.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("app_releases")
        .select("release_number")
        .eq("app_id", found.id)
        .eq("is_current_published", true)
        .maybeSingle(),
    ]);

    if (pRes.error) throw new Error(`Could not load plans (${pRes.error.code})`);
    if (tvRes.error) throw new Error(`Could not load terms versions (${tvRes.error.code})`);
    if (evRes.error) throw new Error(`Could not load review events (${evRes.error.code})`);
    if (relRes.error) throw new Error(`Could not load release (${relRes.error.code})`);

    planRows = pRes.data ?? [];
    termsRows = tvRes.data ?? [];
    eventRows = (evRes.data ?? []).map(row => ({ ...row,
      event_type: z.enum(["submitted", "approved", "rejected"]).parse(row.event_type),
      environment: z.enum(["demo", "live"]).parse(row.environment),
    }));
    publishedReleaseNumber = relRes.data?.release_number ?? null;
  }

  if (!appRow) return null;

  return {
    id: appRow.id,
    organizationId: appRow.organization_id,
    organizationName,
    slug: appRow.slug,
    name: appRow.name,
    tagline: appRow.tagline,
    description: appRow.description,
    categories: parseCategories(appRow.categories),
    platforms: parsePlatforms(appRow.platforms),
    languages: parseStringArray(appRow.languages),
    websiteUrl: appRow.website_url,
    iosStoreUrl: appRow.ios_store_url,
    androidStoreUrl: appRow.android_store_url,
    logoUrl: appRow.logo_url,
    coverImageUrl: appRow.cover_image_url,
    screenshots: parseScreenshots(appRow.screenshots),
    videoUrl: appRow.video_url,
    termsText: appRow.terms_text,
    attributionWindowDays: Number(appRow.attribution_window_days),
    status: appRow.status,
    reviewRevision: Number(appRow.review_revision),
    publishEnvironment: appRow.publish_environment,
    submittedAt: toIsoOrNull(appRow.submitted_at),
    reviewedAt: toIsoOrNull(appRow.reviewed_at),
    rejectionReason: appRow.rejection_reason,
    publishedAt: toIsoOrNull(appRow.published_at),
    createdAt: toIsoOrNull(appRow.created_at) ?? "",
    hasLivePublishedRelease: publishedReleaseNumber !== null,
    publishedReleaseNumber,
    plans: planRows.map((plan) => ({
      id: plan.id,
      appId: plan.app_id,
      name: plan.name,
      externalPlanKey: plan.external_plan_key,
      billingInterval: plan.billing_interval,
      priceMinor: toMinorBigInt(plan.price_minor),
      currency: plan.currency,
      commissionBps: Number(plan.commission_bps),
      sortOrder: Number(plan.sort_order),
      isActive: Boolean(plan.is_active),
    })),
    termsVersions: termsRows.map((tv) => ({
      id: tv.id,
      versionNumber: Number(tv.version_number),
      termsText: tv.terms_text,
      attributionWindowDays: Number(tv.attribution_window_days),
      minCommissionBps: Number(tv.min_commission_bps),
      maxCommissionBps: Number(tv.max_commission_bps),
      publishedAt: toIsoOrNull(tv.published_at) ?? "",
    })),
    reviewEvents: eventRows.map((ev) => ({
      id: ev.id,
      eventType: ev.event_type,
      environment: ev.environment,
      note: ev.note,
      createdAt: toIsoOrNull(ev.created_at) ?? "",
    })),
  };
}

/** Lists creators who have joined the company's app program. */
export async function listCompanyCreators(appId: string): Promise<CompanyCreatorRow[]> {
  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) return [];

    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const mRes = await tx.query<{
        id: string;
        creator_id: string;
        referral_code: string;
        joined_at: string | Date;
        version_number: number;
        display_name: string;
      }>(
        `select m.id, m.creator_id, m.referral_code, m.joined_at,
                tv.version_number,
                p.display_name
         from public.creator_program_memberships m
         join public.app_terms_versions tv on tv.id = m.accepted_terms_version_id
         join public.profiles p on p.id = m.creator_id
         where m.app_id = $1
         order by m.joined_at desc`,
        [appId],
      );
      if (mRes.rows.length === 0) return [];

      const creatorIds = mRes.rows.map((r) => r.creator_id);
      const linksRes = await tx.query<{
        id: string;
        creator_id: string;
        platform: SocialPlatform;
        url: string;
      }>(
        `select id, creator_id, platform, url
         from public.creator_social_links
         where creator_id = any($1::uuid[])
         order by created_at`,
        [creatorIds],
      );

      const linksByCreator = new Map<
        string,
        { id: string; platform: SocialPlatform; url: string }[]
      >();
      for (const link of linksRes.rows) {
        const list = linksByCreator.get(link.creator_id) ?? [];
        list.push({ id: link.id, platform: link.platform, url: link.url });
        linksByCreator.set(link.creator_id, list);
      }

      return mRes.rows.map((row) => ({
        membershipId: row.id,
        creatorId: row.creator_id,
        displayName: row.display_name,
        referralCode: row.referral_code,
        acceptedTermsVersionNumber: Number(row.version_number),
        joinedAt:
          row.joined_at instanceof Date ? row.joined_at.toISOString() : String(row.joined_at),
        socialLinks: linksByCreator.get(row.creator_id) ?? [],
      }));
    });
  }

  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("creator_program_memberships")
    .select("id, creator_id, accepted_terms_version_id, referral_code, joined_at")
    .eq("app_id", appId)
    .order("joined_at", { ascending: false });

  if (error) throw new Error(`Could not load creators (${error.code})`);
  if (!memberships || memberships.length === 0) return [];

  const creatorIds = memberships.map((m) => m.creator_id);
  const termsIds = memberships.map((m) => m.accepted_terms_version_id);

  const [profilesRes, termsRes, linksRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", creatorIds),
    supabase.from("app_terms_versions").select("id, version_number").in("id", termsIds),
    supabase
      .from("creator_social_links")
      .select("id, creator_id, platform, url")
      .in("creator_id", creatorIds)
      .order("created_at"),
  ]);

  const failed = [profilesRes, termsRes, linksRes].find((result) => result.error);
  if (failed?.error) throw new Error(`Could not load creator details (${failed.error.code})`);

  const nameById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.display_name]));
  const versionById = new Map((termsRes.data ?? []).map((t) => [t.id, t.version_number]));
  const linksByCreator = new Map<
    string,
    { id: string; platform: SocialPlatform; url: string }[]
  >();
  for (const link of linksRes.data ?? []) {
    const list = linksByCreator.get(link.creator_id) ?? [];
    list.push({ id: link.id, platform: link.platform, url: link.url });
    linksByCreator.set(link.creator_id, list);
  }

  return memberships.map((m) => ({
    membershipId: m.id,
    creatorId: m.creator_id,
    displayName: nameById.get(m.creator_id) ?? "Creator",
    referralCode: m.referral_code,
    acceptedTermsVersionNumber: Number(versionById.get(m.accepted_terms_version_id) ?? 1),
    joinedAt: m.joined_at,
    socialLinks: linksByCreator.get(m.creator_id) ?? [],
  }));
}

/** Admin-only: lists all company apps for the Applications review queue. */
export async function listAppsForAdminReview(): Promise<CompanyWorkspaceApp[]> {
  let orgMap = new Map<string, string>();

  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) return [];

    const orgRows = await runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const res = await tx.query<{ id: string; name: string }>(
        `select id, name from public.organizations order by created_at desc`,
      );
      return res.rows;
    });
    orgMap = new Map(orgRows.map((o) => [o.id, o.name]));
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Could not load organizations (${error.code})`);
    orgMap = new Map((data ?? []).map((o) => [o.id, o.name]));
  }

  const apps: CompanyWorkspaceApp[] = [];
  for (const [orgId, orgName] of orgMap.entries()) {
    const app = await getCompanyWorkspaceApp(orgId, orgName);
    if (app) apps.push(app);
  }

  // Sort: 'submitted' first, then 'rejected', then 'draft', then 'published'.
  const priority: Record<AppStatus, number> = {
    submitted: 0,
    rejected: 1,
    draft: 2,
    published: 3,
  };
  return apps.sort((a, b) => priority[a.status] - priority[b.status]);
}
