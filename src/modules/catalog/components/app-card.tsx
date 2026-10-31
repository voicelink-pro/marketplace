import Link from "next/link";
import { LinkPendingCardOverlay } from "@/components/ui/link-pending-icon";
import { formatCommissionRange } from "@/lib/money";
import { cn } from "@/lib/utils";
import { APP_CATEGORY_LABELS, BILLING_INTERVAL_LABELS } from "../constants";
import type { CardPlanInfo } from "../discover";
import type { CatalogAppCard } from "../queries";
import { CardGlow } from "./card-glow";
import { PlatformIcons } from "./platform-icons";

/** Rank in the commission row, or a listing published in the last 14 days. */
export type AppCardBadge = { kind: "rank"; rank: number } | { kind: "new" };

export function AppLogo({ app, className }: { app: Pick<CatalogAppCard, "name" | "logoUrl">; className?: string }) {
  return app.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={app.logoUrl}
      alt=""
      loading="lazy"
      className={cn("shrink-0 rounded-[10px] border bg-background object-contain", className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-[10px] bg-foreground font-bold text-background", className)}
    >
      {app.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function categoryLabel(app: CatalogAppCard): string {
  return app.categories[0] ? APP_CATEGORY_LABELS[app.categories[0]] : app.organizationName;
}

export function BillingChips({ billing, className }: { billing: CardPlanInfo["billing"]; className?: string }) {
  if (billing.length === 0) return null;
  return (
    <ul aria-label="Billing" className={cn("flex flex-wrap gap-1", className)}>
      {billing.map((interval) => (
        <li key={interval} className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {BILLING_INTERVAL_LABELS[interval]}
        </li>
      ))}
    </ul>
  );
}

function Badge({ badge }: { badge: AppCardBadge }) {
  return badge.kind === "rank" ? (
    <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-0.5 text-sm font-extrabold text-primary-foreground tabular-nums">
      <span className="sr-only">Rank </span>#{badge.rank}
    </span>
  ) : (
    <span className="absolute top-3 left-3 rounded-full bg-neutral-950 px-2.5 py-0.5 text-xs font-bold text-primary">
      New
    </span>
  );
}

/**
 * Offer card for the catalog rows and grid. Shows only what the program really
 * offers: commission range, billing intervals and per-customer commission from
 * its plans, platforms. No ratings, views or join counts. `planInfo` is absent
 * when the plans could not be loaded.
 */
export function AppCard({
  app,
  href,
  planInfo,
  badge,
  glow = false,
}: {
  app: CatalogAppCard;
  href: string;
  planInfo?: CardPlanInfo;
  badge?: AppCardBadge;
  /** Pointer-following border glow; for the grid, not the long rows. */
  glow?: boolean;
}) {
  // Real rates are 1–90%; 0 only reaches here from a draft's preview before it has an active plan.
  const rate = app.maxCommissionBps > 0 ? formatCommissionRange(app.minCommissionBps, app.maxCommissionBps, "") : null;

  return (
    // Wrapper carries the glow: the article clips its own overflow, which would cut it off.
    <div className="relative flex w-full rounded-[20px]">
      {glow ? <CardGlow /> : null}
      <article className="group relative flex w-full flex-col overflow-hidden rounded-[20px] border bg-card transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:border-foreground/25">
        <Link href={href} className="flex flex-1 flex-col outline-none">
          {/* Dims the card with a corner spinner while the app's page loads. */}
          <LinkPendingCardOverlay />
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            {app.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={app.coverImageUrl}
                alt=""
                loading="lazy"
                className="size-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="grid size-full place-items-center">
                <AppLogo app={app} className="size-14 text-xl" />
              </div>
            )}
            {badge ? <Badge badge={badge} /> : null}
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <AppLogo app={app} className="size-10 text-base" />
              <div className="min-w-0">
                <h4 className="truncate text-base leading-tight font-semibold">{app.name}</h4>
                <p className="truncate text-sm text-muted-foreground">{categoryLabel(app)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <p className="flex items-baseline gap-1.5">
                <span className="text-2xl leading-none font-extrabold tracking-tight tabular-nums">{rate ?? "—"}</span>
                <span className="text-sm font-medium text-muted-foreground">{rate ? "recurring" : "commission not set"}</span>
              </p>
              {planInfo?.perCustomer ? (
                <p className="text-xs text-muted-foreground tabular-nums">{planInfo.perCustomer}</p>
              ) : null}
            </div>

            {planInfo ? <BillingChips billing={planInfo.billing} /> : null}

            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
              <PlatformIcons platforms={app.platforms} />
              {/* The whole card is the link; this is its visible label, not a second control. */}
              <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/85">
                Join program
              </span>
            </div>
          </div>
        </Link>
      </article>
    </div>
  );
}
