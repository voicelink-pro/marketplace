import {
  APP_CATEGORIES,
  APP_LANGUAGES,
  APP_PLATFORMS,
  type AppCategory,
  type AppLanguage,
  type AppPlatform,
  COMMISSION_FILTER_OPTIONS,
  type CommissionFilterValue,
} from "./constants";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type CatalogFilters = {
  q: string;
  category: AppCategory | null;
  commission: CommissionFilterValue | null;
  minCommissionBps: number | null;
  platform: AppPlatform | null;
  language: AppLanguage | null;
  page: number;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  q: "",
  category: null,
  commission: null,
  minCommissionBps: null,
  platform: null,
  language: null,
  page: 1,
};

function firstParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

function isCategory(value: string): value is AppCategory {
  return (APP_CATEGORIES as readonly string[]).includes(value);
}

function isPlatform(value: string): value is AppPlatform {
  return (APP_PLATFORMS as readonly string[]).includes(value);
}

function isLanguage(value: string): value is AppLanguage {
  return (APP_LANGUAGES as readonly string[]).includes(value);
}

export function parseCatalogFilters(raw: RawSearchParams | URLSearchParams): CatalogFilters {
  const read = (key: string): string => {
    if (raw instanceof URLSearchParams) return raw.get(key) ?? "";
    return firstParam(raw[key]);
  };

  const q = read("q").trim().slice(0, 100);

  const rawCategory = read("category").trim().toLowerCase();
  const category = isCategory(rawCategory) ? rawCategory : null;

  const rawCommission = read("commission").trim();
  const commissionOption = COMMISSION_FILTER_OPTIONS.find((item) => item.value === rawCommission);
  const commission = commissionOption ? commissionOption.value : null;
  const minCommissionBps = commissionOption ? commissionOption.minBps : null;

  const rawPlatform = read("platform").trim().toLowerCase();
  const platform = isPlatform(rawPlatform) ? rawPlatform : null;

  const rawLanguage = read("language").trim().toLowerCase();
  const language = isLanguage(rawLanguage) ? rawLanguage : null;

  const rawPage = Number.parseInt(read("page").trim(), 10);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 10_000 ? rawPage : 1;

  return {
    q,
    category,
    commission,
    minCommissionBps,
    platform,
    language,
    page,
  };
}

export function hasActiveCatalogFilters(
  filters: Pick<CatalogFilters, "q" | "category" | "commission" | "platform" | "language">,
): boolean {
  return Boolean(
    filters.q ||
      filters.category ||
      filters.commission ||
      filters.platform ||
      filters.language,
  );
}

export type CatalogFilterOverrides = Partial<
  Pick<CatalogFilters, "q" | "category" | "commission" | "platform" | "language" | "page">
>;

export function buildCatalogQueryString(
  current: CatalogFilters,
  overrides: CatalogFilterOverrides = {},
): string {
  const next = {
    q: overrides.q !== undefined ? overrides.q.trim().slice(0, 100) : current.q,
    category: overrides.category !== undefined ? overrides.category : current.category,
    commission: overrides.commission !== undefined ? overrides.commission : current.commission,
    platform: overrides.platform !== undefined ? overrides.platform : current.platform,
    language: overrides.language !== undefined ? overrides.language : current.language,
    // Reset to page 1 when any filter changes unless `page` was explicitly provided.
    page: overrides.page !== undefined ? overrides.page : 1,
  };

  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.commission) params.set("commission", next.commission);
  if (next.platform) params.set("platform", next.platform);
  if (next.language) params.set("language", next.language);
  if (next.page > 1) params.set("page", String(next.page));

  return params.toString();
}

/** `basePath` is the page the catalog lives on: the home page, or Discover in the creator panel. */
export function buildCatalogHref(
  current: CatalogFilters,
  overrides: CatalogFilterOverrides = {},
  basePath = "/",
): string {
  const qs = buildCatalogQueryString(current, overrides);
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Links to `/apps/[slug]` while preserving the active catalog filters and page
 * in `?from=` so the user can return to the exact filtered results list.
 */
export function buildAppDetailHref(slug: string, current: CatalogFilters): string {
  const qs = buildCatalogQueryString(current, { page: current.page });
  const encodedSlug = encodeURIComponent(slug);
  return qs ? `/apps/${encodedSlug}?from=${encodeURIComponent(qs)}` : `/apps/${encodedSlug}`;
}

/**
 * Safely reconstructs the catalog return URL from the `?from=` parameter on
 * `/apps/[slug]`. Rejects arbitrary URLs and only ever emits `"/"` or `"/?..."`
 * with validated filter parameters.
 */
export function resolveBackToCatalogHref(fromValue: string | string[] | undefined): string {
  const raw = firstParam(fromValue).trim();
  if (!raw || raw.length > 512) return "/";
  const cleaned = raw.startsWith("/?") ? raw.slice(2) : raw.startsWith("?") ? raw.slice(1) : raw;
  const parsed = parseCatalogFilters(new URLSearchParams(cleaned));
  return buildCatalogHref(parsed, { page: parsed.page });
}
