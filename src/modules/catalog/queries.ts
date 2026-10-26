import "server-only";
import { cache } from "react";
import { toMinorBigInt } from "@/lib/money";
import { createPublicClient } from "@/lib/supabase/public";
import {
  APP_CATEGORIES,
  APP_PLATFORMS,
  type AppCategory,
  type AppPlatform,
  type BillingInterval,
  CATALOG_PAGE_SIZE,
} from "./constants";
import type { CatalogFilters } from "./filters";
import {
  isLocalPgliteSandboxEnabled,
  runInAnonPgliteSandbox,
} from "./local-pglite-sandbox";

export type CatalogAppCard = {
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
  publishedAt: string;
};

export type CatalogPageResult = {
  items: CatalogAppCard[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AppScreenshot = {
  url: string;
  alt: string;
};

export type PublishedPlanRate = {
  id: string;
  planName: string;
  billingInterval: BillingInterval;
  priceMinor: bigint;
  currency: string;
  commissionBps: number;
  sortOrder: number;
};

export type PublishedAppDetail = {
  appId: string;
  slug: string;
  name: string;
  organizationName: string;
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
  minCommissionBps: number;
  maxCommissionBps: number;
  termsVersionId: string;
  termsVersionNumber: number;
  termsText: string;
  attributionWindowDays: number;
  publishedAt: string;
  plans: PublishedPlanRate[];
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

type RawCatalogRow = {
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
  published_at: string | Date;
  total_count: number | string;
};

function mapCatalogRow(row: RawCatalogRow): CatalogAppCard {
  return {
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
    publishedAt:
      row.published_at instanceof Date ? row.published_at.toISOString() : String(row.published_at),
  };
}

export async function listCatalogApps(
  filters: CatalogFilters,
  pageSize = CATALOG_PAGE_SIZE,
): Promise<CatalogPageResult> {
  let rows: RawCatalogRow[];

  if (isLocalPgliteSandboxEnabled()) {
    rows = await runInAnonPgliteSandbox(async (tx) => {
      const res = await tx.query<RawCatalogRow>(
        `select * from public.list_catalog_apps($1, $2, $3, $4, $5, $6, $7)`,
        [
          filters.q || null,
          filters.category,
          filters.platform,
          filters.language,
          filters.minCommissionBps,
          filters.page,
          pageSize,
        ],
      );
      return res.rows;
    });
  } else {
    const supabase = await createPublicClient();
    const { data, error } = await supabase.rpc("list_catalog_apps", {
      p_search: filters.q || undefined,
      p_category: filters.category ?? undefined,
      p_platform: filters.platform ?? undefined,
      p_language: filters.language ?? undefined,
      p_min_commission_bps: filters.minCommissionBps ?? undefined,
      p_page: filters.page,
      p_page_size: pageSize,
    });
    if (error) {
      throw new Error(`Could not load catalog (${error.code ?? "unknown"})`);
    }
    rows = data ?? [];
  }

  const totalCount = rows.length > 0 ? Number(rows[0]!.total_count) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: rows.map(mapCatalogRow),
    totalCount,
    page: filters.page,
    pageSize,
    totalPages,
  };
}

type RawListingDetailRow = {
  app_id: string;
  slug: string;
  name: string;
  organization_name: string;
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
  min_commission_bps: number;
  max_commission_bps: number;
  terms_version_id: string;
  terms_version_number: number;
  terms_text: string;
  attribution_window_days: number;
  published_at: string | Date;
};

type RawPlanRateRow = {
  id: string;
  plan_name: string;
  billing_interval: BillingInterval;
  price_minor: bigint | number | string;
  currency: string;
  commission_bps: number;
  sort_order: number;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const getPublishedAppBySlug = cache(
  async (slug: string): Promise<PublishedAppDetail | null> => {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug || normalizedSlug.length > 60 || !SLUG_RE.test(normalizedSlug)) {
    return null;
  }

  let listing: RawListingDetailRow | null = null;
  let planRows: RawPlanRateRow[] = [];

  if (isLocalPgliteSandboxEnabled()) {
    const result = await runInAnonPgliteSandbox(async (tx) => {
      const listingRes = await tx.query<RawListingDetailRow>(
        `select * from public.catalog_listings where slug = $1 limit 1`,
        [normalizedSlug],
      );
      const found = listingRes.rows[0] ?? null;
      if (!found) return { listing: null, planRows: [] as RawPlanRateRow[] };

      const plansRes = await tx.query<RawPlanRateRow>(
        `select id, plan_name, billing_interval, price_minor, currency, commission_bps, sort_order
         from public.catalog_plan_rates
         where app_slug = $1
         order by sort_order, plan_name`,
        [normalizedSlug],
      );
      return { listing: found, planRows: plansRes.rows };
    });
    listing = result.listing;
    planRows = result.planRows;
  } else {
    const supabase = await createPublicClient();
    const [listingRes, plansRes] = await Promise.all([
      supabase.from("catalog_listings").select("*").eq("slug", normalizedSlug).maybeSingle(),
      supabase
        .from("catalog_plan_rates")
        .select("id, plan_name, billing_interval, price_minor, currency, commission_bps, sort_order")
        .eq("app_slug", normalizedSlug)
        .order("sort_order")
        .order("plan_name"),
    ]);

    if (listingRes.error) {
      throw new Error(`Could not load app (${listingRes.error.code ?? "unknown"})`);
    }
    if (plansRes.error) {
      throw new Error(`Could not load app plans (${plansRes.error.code ?? "unknown"})`);
    }
    listing = listingRes.data;
    planRows = plansRes.data ?? [];
  }

  if (!listing) return null;

  return {
    appId: listing.app_id,
    slug: listing.slug,
    name: listing.name,
    organizationName: listing.organization_name,
    tagline: listing.tagline,
    description: listing.description,
    categories: parseCategories(listing.categories),
    platforms: parsePlatforms(listing.platforms),
    languages: parseStringArray(listing.languages),
    websiteUrl: listing.website_url,
    iosStoreUrl: listing.ios_store_url,
    androidStoreUrl: listing.android_store_url,
    logoUrl: listing.logo_url,
    coverImageUrl: listing.cover_image_url,
    screenshots: parseScreenshots(listing.screenshots),
    videoUrl: listing.video_url,
    minCommissionBps: Number(listing.min_commission_bps),
    maxCommissionBps: Number(listing.max_commission_bps),
    termsVersionId: listing.terms_version_id,
    termsVersionNumber: Number(listing.terms_version_number),
    termsText: listing.terms_text,
    attributionWindowDays: Number(listing.attribution_window_days),
    publishedAt:
      listing.published_at instanceof Date
        ? listing.published_at.toISOString()
        : String(listing.published_at),
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
  },
);
