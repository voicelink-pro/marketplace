import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCommissionRange } from "@/lib/money";
import {
  APP_CATEGORY_LABELS,
  APP_PLATFORM_LABELS,
  formatLanguageLabel,
} from "../constants";
import { buildAppDetailHref, type CatalogFilters } from "../filters";
import type { CatalogAppCard } from "../queries";

export function AppCard({
  app,
  filters,
}: {
  app: CatalogAppCard;
  filters: CatalogFilters;
}) {
  const detailHref = buildAppDetailHref(app.slug, filters);
  const commissionLabel = formatCommissionRange(app.minCommissionBps, app.maxCommissionBps);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/45 focus-within:ring-3 focus-within:ring-ring/50">
      <Link href={detailHref} className="flex flex-1 flex-col outline-none">
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b bg-muted">
          {app.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.coverImageUrl}
              alt={`${app.name} preview`}
              loading="lazy"
              className="aspect-[16/10] size-full object-cover transition-transform duration-200 group-hover:scale-[1.015]"
            />
          ) : (
            <div className="grid size-full place-items-center text-sm text-muted-foreground">
              {app.name}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {app.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.logoUrl}
                  alt=""
                  loading="lazy"
                  className="size-10 shrink-0 rounded-lg border bg-background object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {app.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {app.name}
                </h2>
                <p className="truncate text-xs text-muted-foreground">{app.organizationName}</p>
              </div>
            </div>

            <span className="tabular shrink-0 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {commissionLabel}
            </span>
          </div>

          <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{app.tagline}</p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-1">
              {app.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="text-[11px]">
                  {APP_PLATFORM_LABELS[platform]}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 truncate">
              {app.categories[0] ? <span>{APP_CATEGORY_LABELS[app.categories[0]]}</span> : null}
              {app.languages.length > 0 ? (
                <span aria-label={`Supported languages: ${app.languages.map(formatLanguageLabel).join(", ")}`}>
                  · {app.languages.slice(0, 3).map((code) => code.toUpperCase()).join(", ")}
                  {app.languages.length > 3 ? ` +${app.languages.length - 3}` : ""}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
