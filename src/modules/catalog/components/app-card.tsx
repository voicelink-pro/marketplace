import Link from "next/link";
import { formatCommissionRange } from "@/lib/money";
import { APP_CATEGORY_LABELS, APP_PLATFORM_LABELS } from "../constants";
import { buildAppDetailHref, type CatalogFilters } from "../filters";
import { CardGlow } from "./card-glow";
import type { CatalogAppCard } from "../queries";

/**
 * Offer card for creators. Shows only what the program really offers: the
 * commission rate leads, then platforms. No prices or ratings — this is not a
 * store. Budget and creator counts are not part of the model yet.
 */
export function AppCard({
  app,
  filters,
}: {
  app: CatalogAppCard;
  filters: CatalogFilters;
}) {
  const detailHref = buildAppDetailHref(app.slug, filters);
  const rate = formatCommissionRange(app.minCommissionBps, app.maxCommissionBps, "");
  const category = app.categories[0] ? APP_CATEGORY_LABELS[app.categories[0]] : null;

  return (
    // Wrapper carries the glow: the article clips its own overflow, which would cut it off.
    <div className="relative rounded-xl">
      <CardGlow />
      <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/25 focus-within:ring-3 focus-within:ring-ring/50">
        <Link href={detailHref} className="flex flex-1 flex-col outline-none">
          <div className="relative hidden aspect-[16/9] w-full overflow-hidden bg-muted sm:block">
            {app.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={app.coverImageUrl}
                alt={`${app.name} preview`}
                loading="lazy"
                className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="grid size-full place-items-center text-sm text-muted-foreground">
                {app.name}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              {app.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.logoUrl}
                  alt=""
                  loading="lazy"
                  className="size-11 shrink-0 rounded-lg border bg-background object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-foreground text-base font-bold text-background"
                >
                  {app.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg leading-tight">{app.name}</h2>
                <p className="truncate text-sm text-muted-foreground">
                  {category ?? app.organizationName}
                </p>
              </div>
            </div>

            <div className="flex flex-col rounded-lg bg-primary px-4 py-3 text-primary-foreground">
              <span className="tabular text-3xl leading-none font-extrabold tracking-tight">{rate}</span>
              <span className="mt-1 text-xs font-medium">
                of every subscription payment
                {app.minCommissionBps !== app.maxCommissionBps ? <span className="block">depending on plan</span> : null}
              </span>
            </div>

            <p className="hidden text-sm text-muted-foreground sm:line-clamp-2">{app.tagline}</p>

            <div className="mt-auto flex items-center justify-end gap-3 pt-1 sm:justify-between">
              <ul aria-label="Platforms" className="hidden min-w-0 flex-wrap gap-1 sm:flex">
                {app.platforms.map((platform) => (
                  <li
                    key={platform}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {APP_PLATFORM_LABELS[platform]}
                  </li>
                ))}
              </ul>
              {/* The whole card is the link; this is its visible label, not a second control. */}
              <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-colors group-hover:bg-foreground/85">
                Join offer
              </span>
            </div>
          </div>
        </Link>
      </article>
    </div>
  );
}
