import { z } from "zod";
import {
  APP_CATEGORIES,
  APP_LANGUAGES,
  APP_PLATFORMS,
  type AppCategory,
  type AppPlatform,
} from "@/modules/catalog/constants";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_URL_RE = /^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{1,5})?([/?#][^\s]*)?$/;
const MEDIA_URL_RE =
  /^(https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{1,5})?([/?#][^\s]*)?|\/demo\/[A-Za-z0-9/_-]+(\.[A-Za-z0-9]+)?|\/media\/apps\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|mp4|webm))$/;
const EXTERNAL_KEY_RE = /^[A-Za-z0-9._:-]+$/;

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW"]);

/**
 * Parses a human-entered decimal price (e.g. `"14.99"` in `EUR`) into integer
 * minor units (`1499n`) without floating-point arithmetic.
 */
export function parseMajorMoneyToMinor(
  rawAmount: string,
  currency: string,
): { ok: true; minor: bigint } | { ok: false; message: string } {
  const cleaned = rawAmount.trim().replace(",", ".");
  const upperCurrency = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(upperCurrency)) {
    return { ok: false, message: "Select a valid 3-letter currency code." };
  }

  const decimals = ZERO_DECIMAL_CURRENCIES.has(upperCurrency) ? 0 : 2;
  if (decimals === 0) {
    if (!/^\d+$/.test(cleaned)) {
      return { ok: false, message: `Enter a whole number for ${upperCurrency}.` };
    }
    const minor = BigInt(cleaned);
    if (minor <= 0n || minor > 100_000_000_000n) {
      return { ok: false, message: "Enter a price greater than zero." };
    }
    return { ok: true, minor };
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    return { ok: false, message: "Enter a valid price (for example 14.99 or 19)." };
  }

  const majorPart = BigInt(match[1]!);
  const fractionStr = (match[2] ?? "").padEnd(2, "0");
  const fractionPart = BigInt(fractionStr);
  const minor = majorPart * 100n + fractionPart;

  if (minor <= 0n || minor > 100_000_000_000n) {
    return { ok: false, message: "Enter a price greater than zero." };
  }

  return { ok: true, minor };
}

/**
 * Formats integer minor units into an editable major-unit input value
 * (e.g. `1499n` -> `"14.99"`, `1900n` -> `"19.00"`).
 */
export function formatMinorToInput(minor: bigint | number, currency: string): string {
  const value = typeof minor === "bigint" ? minor : BigInt(minor);
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return value.toString();
  }
  const major = value / 100n;
  const cents = (value % 100n).toString().padStart(2, "0");
  return `${major.toString()}.${cents}`;
}

/**
 * Parses a human-entered commission percentage (e.g. `"15"`, `"12.5"`, `"25.25"`)
 * into integer basis points (`1500`, `1250`, `2525`) without floats.
 */
export function parsePercentToBps(
  rawPercent: string,
): { ok: true; bps: number } | { ok: false; message: string } {
  const cleaned = rawPercent.trim().replace("%", "").trim().replace(",", ".");
  const match = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    return { ok: false, message: "Enter a commission rate between 1% and 90% (up to 2 decimals)." };
  }

  const whole = Number.parseInt(match[1]!, 10);
  const frac = Number.parseInt((match[2] ?? "").padEnd(2, "0"), 10);
  const bps = whole * 100 + frac;

  if (bps < 100 || bps > 9000) {
    return { ok: false, message: "Commission rate must be between 1% and 90%." };
  }

  return { ok: true, bps };
}

export function optionalHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export const appDraftFormSchema = z.object({
  appId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(2, { error: "App name must be at least 2 characters." })
    .max(80, { error: "App name must be 80 characters or fewer." }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, { error: "URL slug must be at least 2 characters." })
    .max(60, { error: "URL slug must be 60 characters or fewer." })
    .regex(SLUG_RE, { error: "Use lowercase letters, numbers, and hyphens only." }),
  tagline: z
    .string()
    .trim()
    .max(160, { error: "Short description must be 160 characters or fewer." }),
  description: z
    .string()
    .trim()
    .max(10_000, { error: "Full description must be 10,000 characters or fewer." }),
  categories: z
    .array(z.enum(APP_CATEGORIES))
    .max(3, { error: "Select up to 3 categories." }),
  platforms: z
    .array(z.enum(APP_PLATFORMS))
    .max(4, { error: "Select up to 4 platforms." }),
  languages: z
    .array(z.enum(APP_LANGUAGES))
    .max(20, { error: "Select up to 20 languages." }),
  websiteUrl: z
    .string()
    .nullable()
    .refine((val) => val === null || HTTPS_URL_RE.test(val), {
      error: "Enter a valid https:// website URL.",
    }),
  iosStoreUrl: z
    .string()
    .nullable()
    .refine((val) => val === null || HTTPS_URL_RE.test(val), {
      error: "Enter a valid https:// App Store URL.",
    }),
  androidStoreUrl: z
    .string()
    .nullable()
    .refine((val) => val === null || HTTPS_URL_RE.test(val), {
      error: "Enter a valid https:// Google Play URL.",
    }),
  logoUrl: z
    .string()
    .nullable()
    .refine((val) => val === null || MEDIA_URL_RE.test(val), {
      error: "Use an uploaded media URL, an https:// image URL or a /demo/... asset.",
    }),
  coverImageUrl: z
    .string()
    .nullable()
    .refine((val) => val === null || MEDIA_URL_RE.test(val), {
      error: "Use an uploaded media URL, an https:// image URL or a /demo/... asset.",
    }),
  videoUrl: z
    .string()
    .nullable()
    .refine((val) => val === null || MEDIA_URL_RE.test(val), {
      error: "Use an uploaded media URL, an https:// video URL or a /demo/... asset.",
    }),
  screenshots: z
    .array(
      z.object({
        url: z.string().regex(MEDIA_URL_RE, {
          error: "Use an uploaded media URL, an https:// URL or a /demo/... asset.",
        }),
        alt: z.string().trim().min(1).max(200),
      }),
    )
    .max(10),
  termsText: z
    .string()
    .trim()
    .max(10_000, { error: "Program terms must be 10,000 characters or fewer." }),
  attributionWindowDays: z
    .number()
    .int()
    .min(1, { error: "Attribution window must be between 1 and 365 days." })
    .max(365, { error: "Attribution window must be between 1 and 365 days." }),
});

export const planInputSchema = z.object({
  appId: z.uuid(),
  planId: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a plan name (e.g. Pro Monthly)." })
    .max(80, { error: "Plan name must be 80 characters or fewer." }),
  externalPlanKey: z
    .string()
    .trim()
    .min(1, { error: "Enter the plan's identifier in your billing system." })
    .max(120, { error: "External plan ID must be 120 characters or fewer." })
    .regex(EXTERNAL_KEY_RE, {
      error: "External plan ID can contain letters, numbers, dots, underscores, colons, and hyphens.",
    }),
  billingInterval: z.enum(["week", "month", "year"]),
  currency: z.enum(["EUR", "USD", "GBP", "PLN"]),
});

export type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
};

export type AppReadinessChecklist = {
  readyToSubmit: boolean;
  items: ChecklistItem[];
};

export function checkAppSubmissionReadiness(input: {
  name: string;
  tagline: string;
  description: string;
  categories: AppCategory[];
  platforms: AppPlatform[];
  languages: string[];
  websiteUrl: string | null;
  iosStoreUrl: string | null;
  androidStoreUrl: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  termsText: string;
  activePlanCount: number;
}): AppReadinessChecklist {
  const copyOk =
    input.name.trim().length >= 2 &&
    input.tagline.trim().length >= 10 &&
    input.description.trim().length >= 20;

  const taxonomyOk =
    input.categories.length >= 1 &&
    input.platforms.length >= 1 &&
    input.languages.length >= 1;

  const linksOk = Boolean(input.websiteUrl || input.iosStoreUrl || input.androidStoreUrl);
  const visualsOk = Boolean(input.coverImageUrl && input.logoUrl);
  const plansOk = input.activePlanCount >= 1;
  const termsOk = input.termsText.trim().length >= 10;

  const items: ChecklistItem[] = [
    {
      id: "copy",
      label: "Name, short tagline (10+ chars), and full description (20+ chars)",
      detail: copyOk ? "Complete" : "Fill in tagline and product description",
      complete: copyOk,
    },
    {
      id: "taxonomy",
      label: "Categories (1–3), platforms, and supported languages",
      detail: taxonomyOk
        ? `${input.categories.length} categor${input.categories.length === 1 ? "y" : "ies"}, ${input.platforms.length} platform(s), ${input.languages.length} language(s)`
        : "Select at least one category, platform, and language",
      complete: taxonomyOk,
    },
    {
      id: "destinations",
      label: "Product website or store link (App Store / Google Play)",
      detail: linksOk ? "At least one destination URL set" : "Add website or store URL",
      complete: linksOk,
    },
    {
      id: "visuals",
      label: "Tile cover graphic and app logo",
      detail: visualsOk ? "Cover graphic and logo set" : "Recommended for catalog tile",
      complete: visualsOk,
    },
    {
      id: "plans",
      label: "Subscription plans & commission rates (at least 1 active plan)",
      detail: plansOk
        ? `${input.activePlanCount} active plan${input.activePlanCount === 1 ? "" : "s"}`
        : "Add at least one subscription plan in Plans & commissions",
      complete: plansOk,
    },
    {
      id: "terms",
      label: "Program terms & attribution window",
      detail: termsOk ? "Terms text provided" : "Write the commission terms creators will accept",
      complete: termsOk,
    },
  ];

  // Note: `visualsOk` is strongly recommended; DB submission requires copy, taxonomy, destinations, plans, and terms.
  const readyToSubmit = copyOk && taxonomyOk && linksOk && plansOk && termsOk;

  return { readyToSubmit, items };
}
