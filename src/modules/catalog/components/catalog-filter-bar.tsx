"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  APP_CATEGORIES,
  APP_CATEGORY_LABELS,
  APP_LANGUAGE_LABELS,
  APP_LANGUAGES,
  APP_PLATFORM_LABELS,
  APP_PLATFORMS,
  type AppCategory,
  type AppLanguage,
  type AppPlatform,
  COMMISSION_FILTER_OPTIONS,
  type CommissionFilterValue,
} from "../constants";
import {
  buildCatalogHref,
  type CatalogFilterOverrides,
  type CatalogFilters,
  hasActiveCatalogFilters,
} from "../filters";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CatalogFilterBar({
  filters,
  totalCount,
}: {
  filters: CatalogFilters;
  totalCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const active = hasActiveCatalogFilters(filters);

  function applyOverride(overrides: CatalogFilterOverrides) {
    const nextHref = buildCatalogHref(filters, overrides);
    startTransition(() => {
      router.push(nextHref, { scroll: false });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = typeof formData.get("q") === "string" ? String(formData.get("q")) : "";
    const categoryRaw = String(formData.get("category") ?? "");
    const commissionRaw = String(formData.get("commission") ?? "");
    const platformRaw = String(formData.get("platform") ?? "");
    const languageRaw = String(formData.get("language") ?? "");

    applyOverride({
      q,
      category: (categoryRaw || null) as AppCategory | null,
      commission: (commissionRaw || null) as CommissionFilterValue | null,
      platform: (platformRaw || null) as AppPlatform | null,
      language: (languageRaw || null) as AppLanguage | null,
    });
  }

  return (
    <section
      aria-label="Search and filter apps"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5"
    >
      <form
        method="get"
        action="/"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        key={`${filters.q}|${filters.category ?? ""}|${filters.commission ?? ""}|${filters.platform ?? ""}|${filters.language ?? ""}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Label htmlFor="catalog-search" className="sr-only">
              Search apps
            </Label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="catalog-search"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Search apps by name, topic, or company…"
              className="h-9 pl-9"
            />
          </div>
          <Button type="submit" size="lg" className="sm:w-auto">
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Search
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-category" className="text-xs text-muted-foreground">
              Category
            </Label>
            <select
              id="filter-category"
              name="category"
              defaultValue={filters.category ?? ""}
              onChange={(event) =>
                applyOverride({
                  category: (event.currentTarget.value || null) as AppCategory | null,
                })
              }
              className={selectClassName}
            >
              <option value="">All categories</option>
              {APP_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {APP_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-commission" className="text-xs text-muted-foreground">
              Commission
            </Label>
            <select
              id="filter-commission"
              name="commission"
              defaultValue={filters.commission ?? ""}
              onChange={(event) =>
                applyOverride({
                  commission: (event.currentTarget.value || null) as CommissionFilterValue | null,
                })
              }
              className={selectClassName}
            >
              <option value="">Any commission</option>
              {COMMISSION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-platform" className="text-xs text-muted-foreground">
              Platform
            </Label>
            <select
              id="filter-platform"
              name="platform"
              defaultValue={filters.platform ?? ""}
              onChange={(event) =>
                applyOverride({
                  platform: (event.currentTarget.value || null) as AppPlatform | null,
                })
              }
              className={selectClassName}
            >
              <option value="">All platforms</option>
              {APP_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {APP_PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-language" className="text-xs text-muted-foreground">
              App language
            </Label>
            <select
              id="filter-language"
              name="language"
              defaultValue={filters.language ?? ""}
              onChange={(event) =>
                applyOverride({
                  language: (event.currentTarget.value || null) as AppLanguage | null,
                })
              }
              className={selectClassName}
            >
              <option value="">All languages</option>
              {APP_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {APP_LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="tabular text-muted-foreground">
            {totalCount} {totalCount === 1 ? "published app" : "published apps"}
          </span>
          {filters.q ? (
            <Badge variant="secondary" asChild>
              <Link
                href={buildCatalogHref(filters, { q: "" })}
                aria-label={`Remove search query ${filters.q}`}
              >
                “{filters.q}”
                <X aria-hidden className="size-3" />
              </Link>
            </Badge>
          ) : null}
          {filters.category ? (
            <Badge variant="secondary" asChild>
              <Link
                href={buildCatalogHref(filters, { category: null })}
                aria-label={`Remove category filter ${APP_CATEGORY_LABELS[filters.category]}`}
              >
                {APP_CATEGORY_LABELS[filters.category]}
                <X aria-hidden className="size-3" />
              </Link>
            </Badge>
          ) : null}
          {filters.commission ? (
            <Badge variant="secondary" asChild>
              <Link
                href={buildCatalogHref(filters, { commission: null })}
                aria-label={`Remove commission filter ${filters.commission}%+`}
              >
                {filters.commission}%+ recurring
                <X aria-hidden className="size-3" />
              </Link>
            </Badge>
          ) : null}
          {filters.platform ? (
            <Badge variant="secondary" asChild>
              <Link
                href={buildCatalogHref(filters, { platform: null })}
                aria-label={`Remove platform filter ${APP_PLATFORM_LABELS[filters.platform]}`}
              >
                {APP_PLATFORM_LABELS[filters.platform]}
                <X aria-hidden className="size-3" />
              </Link>
            </Badge>
          ) : null}
          {filters.language ? (
            <Badge variant="secondary" asChild>
              <Link
                href={buildCatalogHref(filters, { language: null })}
                aria-label={`Remove language filter ${APP_LANGUAGE_LABELS[filters.language]}`}
              >
                {APP_LANGUAGE_LABELS[filters.language]}
                <X aria-hidden className="size-3" />
              </Link>
            </Badge>
          ) : null}
        </div>

        {active ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Clear filters</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
