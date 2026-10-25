import type { Database } from "@/lib/supabase/database.types";

export type AppCategory = Database["public"]["Enums"]["app_category"];
export type AppPlatform = Database["public"]["Enums"]["app_platform"];
export type BillingInterval = Database["public"]["Enums"]["billing_interval"];

export const CATALOG_PAGE_SIZE = 6;

export const APP_CATEGORIES: readonly AppCategory[] = [
  "productivity",
  "ai",
  "fitness",
  "education",
  "creative",
  "finance",
  "developer",
  "lifestyle",
];

export const APP_CATEGORY_LABELS: Record<AppCategory, string> = {
  productivity: "Productivity",
  ai: "AI & Writing",
  fitness: "Health & Fitness",
  education: "Education",
  creative: "Photo, Video & Design",
  finance: "Personal Finance",
  developer: "Developer Tools",
  lifestyle: "Lifestyle",
};

export const APP_PLATFORMS: readonly AppPlatform[] = ["web", "saas", "ios", "android"];

export const APP_PLATFORM_LABELS: Record<AppPlatform, string> = {
  web: "Web",
  saas: "SaaS",
  ios: "iOS",
  android: "Android",
};

export const APP_LANGUAGES = ["en", "pl", "de", "es", "fr", "pt", "it", "nl", "ja", "ko"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const APP_LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  pl: "Polish",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
  nl: "Dutch",
  ja: "Japanese",
  ko: "Korean",
};

export function formatLanguageLabel(code: string): string {
  const normalized = code.trim().toLowerCase();
  return APP_LANGUAGE_LABELS[normalized] ?? normalized.toUpperCase();
}

export const COMMISSION_FILTER_OPTIONS = [
  { value: "10", minBps: 1000, label: "10%+ recurring" },
  { value: "15", minBps: 1500, label: "15%+ recurring" },
  { value: "20", minBps: 2000, label: "20%+ recurring" },
  { value: "25", minBps: 2500, label: "25%+ recurring" },
  { value: "30", minBps: 3000, label: "30%+ recurring" },
] as const;

export type CommissionFilterValue = (typeof COMMISSION_FILTER_OPTIONS)[number]["value"];

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  week: "Weekly",
  month: "Monthly",
  year: "Annual",
};

export const BILLING_INTERVAL_SUFFIX: Record<BillingInterval, string> = {
  week: "/ week",
  month: "/ month",
  year: "/ year",
};
