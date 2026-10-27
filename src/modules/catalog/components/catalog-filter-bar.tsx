"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** The four selects; each applies on change. Keyed on the filters so defaults follow navigation. */
function FilterFields({
  filters,
  idPrefix,
  onApply,
}: {
  filters: CatalogFilters;
  idPrefix: string;
  onApply: (overrides: CatalogFilterOverrides) => void;
}) {
  return (
    <div
      key={`${filters.category ?? ""}|${filters.commission ?? ""}|${filters.platform ?? ""}|${filters.language ?? ""}`}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`} className="text-xs text-muted-foreground">
          Category
        </Label>
        <select
          id={`${idPrefix}-category`}
          name="category"
          defaultValue={filters.category ?? ""}
          onChange={(event) =>
            onApply({
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
        <Label htmlFor={`${idPrefix}-commission`} className="text-xs text-muted-foreground">
          Commission
        </Label>
        <select
          id={`${idPrefix}-commission`}
          name="commission"
          defaultValue={filters.commission ?? ""}
          onChange={(event) =>
            onApply({
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
        <Label htmlFor={`${idPrefix}-platform`} className="text-xs text-muted-foreground">
          Platform
        </Label>
        <select
          id={`${idPrefix}-platform`}
          name="platform"
          defaultValue={filters.platform ?? ""}
          onChange={(event) =>
            onApply({
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
        <Label htmlFor={`${idPrefix}-language`} className="text-xs text-muted-foreground">
          App language
        </Label>
        <select
          id={`${idPrefix}-language`}
          name="language"
          defaultValue={filters.language ?? ""}
          onChange={(event) =>
            onApply({
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
  );
}

/**
 * Discover top bar: title with the app count, a "Filters" button (popover
 * from md, bottom sheet on phones) and the search box. Enter searches; each
 * select applies on change. Active filters show as removable badges below.
 */
export function CatalogFilterBar({ filters, totalCount }: { filters: CatalogFilters; totalCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const active = hasActiveCatalogFilters(filters);
  const selectCount = [filters.category, filters.commission, filters.platform, filters.language].filter(Boolean).length;
  const filtersLabel = selectCount > 0 ? `Filters (${selectCount})` : "Filters";

  function applyOverride(overrides: CatalogFilterOverrides) {
    const nextHref = buildCatalogHref(filters, overrides);
    startTransition(() => {
      router.push(nextHref, { scroll: false });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q");
    applyOverride({ q: typeof q === "string" ? q : "" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">Discover apps</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {totalCount} {totalCount === 1 ? "app" : "apps"}
          </span>
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="hidden h-10 md:inline-flex">
                <SlidersHorizontal data-icon="inline-start" />
                {filtersLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-[20px] p-4">
              <FilterFields filters={filters} idPrefix="popover-filter" onApply={applyOverride} />
            </PopoverContent>
          </Popover>

          <search className="relative flex-1 md:w-72 md:flex-none">
            <form method="get" action="/" onSubmit={handleSubmit} key={filters.q}>
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
                enterKeyHint="search"
                defaultValue={filters.q}
                placeholder="Search apps…"
                className="pr-9 pl-9"
              />
              {isPending ? (
                <Spinner
                  aria-label="Updating results"
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
              ) : null}
            </form>
          </search>

          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="h-10 md:hidden">
                <SlidersHorizontal data-icon="inline-start" />
                {filtersLabel}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[20px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Results update as you choose.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <FilterFields filters={filters} idPrefix="sheet-filter" onApply={applyOverride} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
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

          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Clear filters</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
