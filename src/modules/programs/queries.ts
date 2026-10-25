import "server-only";
import { getPublicEnv } from "@/lib/env";
import { toMinorBigInt } from "@/lib/money";
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
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";
import type { PublishedPlanRate } from "@/modules/catalog/queries";
import {
  buildReferralLinkUrl,
  REFERRAL_DESTINATION_LABELS,
  type ReferralDestinationKind,
} from "./constants";

export type AllowedAppDestination = {
  kind: ReferralDestinationKind;
  label: string;
  url: string;
};

export type CreatorReferralLinkView = {
  id: string;
  membershipId: string;
  appId: string;
  label: string;
  channel: SocialPlatform;
  destinationKind: ReferralDestinationKind;
  destinationLabel: string;
  targetUrl: string;
  token: string;
  shareUrl: string;
  isDefault: boolean;
  createdAt: string;
};

export type CreatorProgramSummary = {
  membershipId: string;
  appId: string;
  slug: string;
  appName: string;
  organizationName: string;
  tagline: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  categories: AppCategory[];
  platforms: AppPlatform[];
  referralCode: string;
  joinedAt: string;
  acceptedTermsVersionId: string;
  acceptedTermsVersionNumber: number;
  minCommissionBps: number;
  maxCommissionBps: number;
  attributionWindowDays: number;
  availableDestinations: AllowedAppDestination[];
  defaultLink: CreatorReferralLinkView | null;
  links: CreatorReferralLinkView[];
};

export type CreatorProgramDetail = CreatorProgramSummary & {
  termsText: string;
  plans: PublishedPlanRate[];
};

export type SimilarAppSuggestion = {
  appId: string;
  slug: string;
  name: string;
  organizationName: string;
  tagline: string;
  categories: AppCategory[];
  platforms: AppPlatform[];
  languages: string[];
  logoUrl: string | null;
  coverImageUrl: string | null;
  minCommissionBps: number;
  maxCommissionBps: number;
  sharedCategories: AppCategory[];
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

export function buildAllowedDestinations(release: {
  website_url: string | null;
  ios_store_url: string | null;
  android_store_url: string | null;
}): AllowedAppDestination[] {
  const list: AllowedAppDestination[] = [];
  if (release.website_url) {
    list.push({
      kind: "website",
      label: REFERRAL_DESTINATION_LABELS.website,
      url: release.website_url,
    });
  }
  if (release.ios_store_url) {
    list.push({
      kind: "ios_store",
      label: REFERRAL_DESTINATION_LABELS.ios_store,
      url: release.ios_store_url,
    });
  }
  if (release.android_store_url) {
    list.push({
      kind: "android_store",
      label: REFERRAL_DESTINATION_LABELS.android_store,
      url: release.android_store_url,
    });
  }
  return list;
}

type RawLinkRow = {
  id: string;
  membership_id: string;
  app_id: string;
  label: string;
  channel: SocialPlatform;
  destination_kind: ReferralDestinationKind;
  target_url: string;
  token: string;
  is_default: boolean;
  created_at: string | Date;
};

function mapLinkRow(row: RawLinkRow, siteUrl: string): CreatorReferralLinkView {
  return {
    id: row.id,
    membershipId: row.membership_id,
    appId: row.app_id,
    label: row.label,
    channel: row.channel,
    destinationKind: row.destination_kind,
    destinationLabel: REFERRAL_DESTINATION_LABELS[row.destination_kind],
    targetUrl: row.target_url,
    token: row.token,
    shareUrl: buildReferralLinkUrl(row.token, siteUrl),
    isDefault: Boolean(row.is_default),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

/**
 * Checks whether the signed-in creator has already joined the given app's program.
 * Used on `/apps/[slug]` to either show the instant Join form or the creator's
 * active referral code and link.
 */
export async function getCreatorMembershipForApp(
  userId: string,
  appId: string,
): Promise<{
  membershipId: string;
  referralCode: string;
  defaultLink: CreatorReferralLinkView | null;
} | null> {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;

  if (isLocalPgliteSandboxEnabled()) {
    return runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const mRes = await tx.query<{ id: string; referral_code: string }>(
        `select id, referral_code
         from public.creator_program_memberships
         where creator_id = $1 and app_id = $2
         limit 1`,
        [userId, appId],
      );
      const membership = mRes.rows[0];
      if (!membership) return null;

      const linkRes = await tx.query<RawLinkRow>(
        `select id, membership_id, app_id, label, channel, destination_kind, target_url, token, is_default, created_at
         from public.creator_referral_links
         where membership_id = $1
         order by is_default desc, created_at asc
         limit 1`,
        [membership.id],
      );
      const defaultLink = linkRes.rows[0] ? mapLinkRow(linkRes.rows[0], siteUrl) : null;
      return {
        membershipId: membership.id,
        referralCode: membership.referral_code,
        defaultLink,
      };
    });
  }

  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from("creator_program_memberships")
    .select("id, referral_code")
    .eq("creator_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  if (error) throw new Error(`Could not load program membership (${error.code})`);
  if (!membership) return null;

  const { data: linkRows, error: linkError } = await supabase
    .from("creator_referral_links")
    .select(
      "id, membership_id, app_id, label, channel, destination_kind, target_url, token, is_default, created_at",
    )
    .eq("membership_id", membership.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (linkError) throw new Error(`Could not load referral link (${linkError.code})`);

  return {
    membershipId: membership.id,
    referralCode: membership.referral_code,
    defaultLink: linkRows?.[0] ? mapLinkRow(linkRows[0], siteUrl) : null,
  };
}

type RawMembershipRow = {
  id: string;
  app_id: string;
  accepted_terms_version_id: string;
  referral_code: string;
  joined_at: string | Date;
};

type RawListingRow = {
  app_id: string;
  slug: string;
  name: string;
  organization_name: string;
  tagline: string;
  logo_url: string | null;
  cover_image_url: string | null;
  categories: unknown;
  platforms: unknown;
  website_url: string | null;
  ios_store_url: string | null;
  android_store_url: string | null;
};

type RawTermsVersionRow = {
  id: string;
  version_number: number;
  terms_text: string;
  attribution_window_days: number;
  min_commission_bps: number;
  max_commission_bps: number;
};

/** Lists all programs the signed-in creator has joined, with their links and terms snapshot. */
export async function listCreatorProgramMemberships(
  userId: string,
): Promise<CreatorProgramSummary[]> {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;

  let memberships: RawMembershipRow[] = [];
  let listings: RawListingRow[] = [];
  let termsVersions: RawTermsVersionRow[] = [];
  let linkRows: RawLinkRow[] = [];

  if (isLocalPgliteSandboxEnabled()) {
    const res = await runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const mRes = await tx.query<RawMembershipRow>(
        `select id, app_id, accepted_terms_version_id, referral_code, joined_at
         from public.creator_program_memberships
         where creator_id = $1
         order by joined_at desc`,
        [userId],
      );
      if (mRes.rows.length === 0) {
        return {
          memberships: [] as RawMembershipRow[],
          listings: [] as RawListingRow[],
          termsVersions: [] as RawTermsVersionRow[],
          linkRows: [] as RawLinkRow[],
        };
      }
      const appIds = mRes.rows.map((row) => row.app_id);
      const termsIds = mRes.rows.map((row) => row.accepted_terms_version_id);

      const lRes = await tx.query<RawListingRow>(
        `select app_id, slug, name, organization_name, tagline, logo_url, cover_image_url,
                categories, platforms, website_url, ios_store_url, android_store_url
         from public.catalog_listings
         where app_id = any($1::uuid[])`,
        [appIds],
      );

      const tvRes = await tx.query<RawTermsVersionRow>(
        `select id, version_number, terms_text, attribution_window_days, min_commission_bps, max_commission_bps
         from public.app_terms_versions
         where id = any($1::uuid[])`,
        [termsIds],
      );

      const linksRes = await tx.query<RawLinkRow>(
        `select id, membership_id, app_id, label, channel, destination_kind, target_url, token, is_default, created_at
         from public.creator_referral_links
         where creator_id = $1
         order by is_default desc, created_at asc`,
        [userId],
      );

      return {
        memberships: mRes.rows,
        listings: lRes.rows,
        termsVersions: tvRes.rows,
        linkRows: linksRes.rows,
      };
    });

    memberships = res.memberships;
    listings = res.listings;
    termsVersions = res.termsVersions;
    linkRows = res.linkRows;
  } else {
    const supabase = await createClient();
    const { data: mData, error: mErr } = await supabase
      .from("creator_program_memberships")
      .select("id, app_id, accepted_terms_version_id, referral_code, joined_at")
      .eq("creator_id", userId)
      .order("joined_at", { ascending: false });

    if (mErr) throw new Error(`Could not load programs (${mErr.code})`);
    memberships = mData ?? [];
    if (memberships.length === 0) return [];

    const appIds = memberships.map((row) => row.app_id);
    const termsIds = memberships.map((row) => row.accepted_terms_version_id);

    const [lRes, tvRes, linksRes] = await Promise.all([
      supabase
        .from("catalog_listings")
        .select(
          "app_id, slug, name, organization_name, tagline, logo_url, cover_image_url, categories, platforms, website_url, ios_store_url, android_store_url",
        )
        .in("app_id", appIds),
      supabase
        .from("app_terms_versions")
        .select(
          "id, version_number, terms_text, attribution_window_days, min_commission_bps, max_commission_bps",
        )
        .in("id", termsIds),
      supabase
        .from("creator_referral_links")
        .select(
          "id, membership_id, app_id, label, channel, destination_kind, target_url, token, is_default, created_at",
        )
        .eq("creator_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true }),
    ]);

    if (lRes.error) throw new Error(`Could not load program apps (${lRes.error.code})`);
    if (tvRes.error) throw new Error(`Could not load program terms (${tvRes.error.code})`);
    if (linksRes.error) throw new Error(`Could not load referral links (${linksRes.error.code})`);

    listings = lRes.data ?? [];
    termsVersions = tvRes.data ?? [];
    linkRows = linksRes.data ?? [];
  }

  const listingByAppId = new Map(listings.map((item) => [item.app_id, item]));
  const termsById = new Map(termsVersions.map((item) => [item.id, item]));
  const linksByMembershipId = new Map<string, CreatorReferralLinkView[]>();

  for (const row of linkRows) {
    const mapped = mapLinkRow(row, siteUrl);
    const group = linksByMembershipId.get(row.membership_id) ?? [];
    group.push(mapped);
    linksByMembershipId.set(row.membership_id, group);
  }

  return memberships.flatMap((membership) => {
    const listing = listingByAppId.get(membership.app_id);
    const terms = termsById.get(membership.accepted_terms_version_id);
    if (!listing || !terms) return [];

    const links = linksByMembershipId.get(membership.id) ?? [];
    const defaultLink = links.find((link) => link.isDefault) ?? links[0] ?? null;

    return [
      {
        membershipId: membership.id,
        appId: membership.app_id,
        slug: listing.slug,
        appName: listing.name,
        organizationName: listing.organization_name,
        tagline: listing.tagline,
        logoUrl: listing.logo_url,
        coverImageUrl: listing.cover_image_url,
        categories: parseCategories(listing.categories),
        platforms: parsePlatforms(listing.platforms),
        referralCode: membership.referral_code,
        joinedAt:
          membership.joined_at instanceof Date
            ? membership.joined_at.toISOString()
            : String(membership.joined_at),
        acceptedTermsVersionId: membership.accepted_terms_version_id,
        acceptedTermsVersionNumber: Number(terms.version_number),
        minCommissionBps: Number(terms.min_commission_bps),
        maxCommissionBps: Number(terms.max_commission_bps),
        attributionWindowDays: Number(terms.attribution_window_days),
        availableDestinations: buildAllowedDestinations(listing),
        defaultLink,
        links,
      },
    ];
  });
}

type RawPlanRateRow = {
  id: string;
  plan_name: string;
  billing_interval: BillingInterval;
  price_minor: bigint | number | string;
  currency: string;
  commission_bps: number;
  sort_order: number;
};

/** Loads a single joined program by app slug for `/creator/programs/[slug]`. */
export async function getCreatorProgramDetailBySlug(
  userId: string,
  slug: string,
): Promise<CreatorProgramDetail | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const programs = await listCreatorProgramMemberships(userId);
  const summary = programs.find((item) => item.slug === normalizedSlug);
  if (!summary) return null;

  let termsText = "";
  let planRows: RawPlanRateRow[] = [];

  if (isLocalPgliteSandboxEnabled()) {
    const res = await runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const tvRes = await tx.query<{ terms_text: string }>(
        `select terms_text from public.app_terms_versions where id = $1 limit 1`,
        [summary.acceptedTermsVersionId],
      );
      const prRes = await tx.query<RawPlanRateRow>(
        `select id, plan_name, billing_interval, price_minor, currency, commission_bps, sort_order
         from public.app_terms_plan_rates
         where terms_version_id = $1
         order by sort_order, plan_name`,
        [summary.acceptedTermsVersionId],
      );
      return {
        termsText: tvRes.rows[0]?.terms_text ?? "",
        planRows: prRes.rows,
      };
    });
    termsText = res.termsText;
    planRows = res.planRows;
  } else {
    const supabase = await createClient();
    const [tvRes, prRes] = await Promise.all([
      supabase
        .from("app_terms_versions")
        .select("terms_text")
        .eq("id", summary.acceptedTermsVersionId)
        .single(),
      supabase
        .from("app_terms_plan_rates")
        .select("id, plan_name, billing_interval, price_minor, currency, commission_bps, sort_order")
        .eq("terms_version_id", summary.acceptedTermsVersionId)
        .order("sort_order")
        .order("plan_name"),
    ]);

    if (tvRes.error) throw new Error(`Could not load program terms (${tvRes.error.code})`);
    if (prRes.error) throw new Error(`Could not load plan rates (${prRes.error.code})`);

    termsText = tvRes.data.terms_text;
    planRows = prRes.data ?? [];
  }

  return {
    ...summary,
    termsText,
    plans: planRows.map((plan) => ({
      id: plan.id,
      planName: plan.plan_name,
      billingInterval: plan.billing_interval,
      priceMinor: toMinorBigInt(plan.price_minor),
      currency: plan.currency,
      commissionBps: Number(plan.commission_bps),
      sortOrder: Number(plan.sort_order),
    })),
  };
}

type RawSimilarAppRow = {
  app_id: string;
  slug: string;
  name: string;
  organization_name: string;
  tagline: string;
  categories: unknown;
  platforms: unknown;
  languages: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  min_commission_bps: number;
  max_commission_bps: number;
  shared_categories: unknown;
};

/** Category-based recommendations of published apps the creator hasn't joined yet (no AI). */
export async function listSimilarAppsForCreator(
  userId: string,
  limit = 3,
): Promise<SimilarAppSuggestion[]> {
  let rows: RawSimilarAppRow[] = [];

  if (isLocalPgliteSandboxEnabled()) {
    rows = await runInAuthenticatedPgliteSandbox(userId, async (tx) => {
      const res = await tx.query<RawSimilarAppRow>(
        `select * from public.suggest_similar_apps_for_creator($1)`,
        [limit],
      );
      return res.rows;
    });
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("suggest_similar_apps_for_creator", {
      p_limit: limit,
    });
    if (error) throw new Error(`Could not load similar apps (${error.code})`);
    rows = data ?? [];
  }

  return rows.map((row) => ({
    appId: row.app_id,
    slug: row.slug,
    name: row.name,
    organizationName: row.organization_name,
    tagline: row.tagline,
    categories: parseCategories(row.categories),
    platforms: parsePlatforms(row.platforms),
    languages: parseStringArray(row.languages),
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    minCommissionBps: Number(row.min_commission_bps),
    maxCommissionBps: Number(row.max_commission_bps),
    sharedCategories: parseCategories(row.shared_categories),
  }));
}
