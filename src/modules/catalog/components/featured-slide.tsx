import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCommissionPercent } from "@/lib/money";
import type { CardPlanInfo } from "../discover";
import type { CatalogAppCard } from "../queries";
import { AppLogo, BillingChips, categoryLabel } from "./app-card";
import { PlatformIcons } from "./platform-icons";

/**
 * One featured app: cover beside the offer on desktop, above it on phones.
 * "Up to" only when the app's plans pay different rates.
 */
export function FeaturedSlide({ app, href, planInfo }: { app: CatalogAppCard; href: string; planInfo?: CardPlanInfo }) {
  const ranged = app.minCommissionBps !== app.maxCommissionBps;

  return (
    <article className="grid w-full overflow-hidden rounded-[20px] border bg-card md:grid-cols-[1.1fr_1fr]">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted md:aspect-auto md:min-h-80">
        {app.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.coverImageUrl} alt="" className="absolute inset-0 size-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <AppLogo app={app} className="size-20 rounded-[20px] text-3xl" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:p-8">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo app={app} className="size-12 text-lg" />
          <div className="min-w-0">
            <h4 className="truncate text-xl leading-tight font-bold tracking-tight">{app.name}</h4>
            <p className="truncate text-sm text-muted-foreground">{categoryLabel(app)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-x-2 leading-none">
            {ranged ? <span className="text-lg font-semibold">Up to</span> : null}
            <span className="text-5xl font-extrabold tracking-[-0.04em] tabular-nums">
              {formatCommissionPercent(app.maxCommissionBps)}
            </span>
            <span className="text-lg font-semibold">recurring</span>
          </p>
          {planInfo?.perCustomer ? (
            <p className="text-sm text-muted-foreground tabular-nums">{planInfo.perCustomer}</p>
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">{app.tagline}</p>

        <div className="flex flex-wrap items-center gap-3">
          {planInfo ? <BillingChips billing={planInfo.billing} /> : null}
          <PlatformIcons platforms={app.platforms} />
        </div>

        <Button asChild size="lg" className="mt-auto self-start">
          <Link href={href}>
            View offer<span className="sr-only"> for {app.name}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
