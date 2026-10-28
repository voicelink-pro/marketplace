import {
  Code,
  Dumbbell,
  GraduationCap,
  type LucideIcon,
  ListChecks,
  Palette,
  Sparkles,
  Sun,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { APP_CATEGORY_LABELS, type AppCategory } from "../constants";
import { buildCatalogHref, DEFAULT_CATALOG_FILTERS } from "../filters";

const CATEGORY_ICONS: Record<AppCategory, LucideIcon> = {
  productivity: ListChecks,
  ai: Sparkles,
  fitness: Dumbbell,
  education: GraduationCap,
  creative: Palette,
  finance: Wallet,
  developer: Code,
  lifestyle: Sun,
};

/** Applies the category filter and lands back on the catalog. */
export function CategoryTile({
  category,
  count,
  basePath = "/",
}: {
  category: AppCategory;
  count: number;
  basePath?: string;
}) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <Link
      href={`${buildCatalogHref(DEFAULT_CATALOG_FILTERS, { category }, basePath)}#offers`}
      scroll={false}
      className="flex w-full flex-col gap-6 rounded-[20px] border bg-card p-4 transition-colors outline-none hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="grid size-10 place-items-center rounded-[12px] bg-primary text-primary-foreground">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="flex flex-col">
        <span className="font-semibold">{APP_CATEGORY_LABELS[category]}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {count} {count === 1 ? "app" : "apps"}
        </span>
      </span>
    </Link>
  );
}
