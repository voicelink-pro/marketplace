import { UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { CardHeading, CardLink, HomeCard, Unavailable } from "./card";
import { BrandTile, PlatformTile } from "./illustrations";

const TITLE_ID = "activity-heading";

export type ActivityItem = {
  id: string;
  kind: "signup" | "commission";
  title: string;
  subtitle: string;
  /** Commission rows: the signed amount, and the currency symbol for the tile. */
  amount?: string;
  symbol?: string;
};

function Frame({ busy, action, children }: { busy?: boolean; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <HomeCard titleId={TITLE_ID} busy={busy} className="gap-2 lg:col-span-2">
      <div className="pb-2">
        <CardHeading id={TITLE_ID} title="Recent activity" action={action} />
      </div>
      {children}
    </HomeCard>
  );
}

const ROW = "flex items-center gap-3.5 border-b py-2.5 last:border-b-0";

/** A click on a TikTok link, through boostlink, to the creator's first app. */
function EmptyActivity({ app }: { app: { name: string; logoUrl: string | null } | null }) {
  const connector = <span className="w-8 border-t-2 border-dashed border-primary sm:w-18" />;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 rounded-2xl border bg-background px-4 py-6">
      <div role="img" aria-label="A click on your link leads to a sign-up in the app" className="flex items-center">
        <PlatformTile platform="tiktok" className="size-12 rounded-[14px]" />
        {connector}
        <BrandTile className="size-14 rounded-2xl" />
        {connector}
        {app ? (
          <AppLogo app={app} className="size-12 rounded-[14px] text-xl" />
        ) : (
          <span aria-hidden className="size-12 rounded-[14px] border-2 border-dashed border-foreground/20" />
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-bold">No activity yet</span>
        <span className="text-[13px] text-muted-foreground">Sign-ups and payments from your links show up here.</span>
      </div>
    </div>
  );
}

/** The latest sign-ups and commissions, newest first. `app` draws the empty state. */
export function RecentActivity({
  items,
  app,
}: {
  items: ActivityItem[];
  app: { name: string; logoUrl: string | null } | null;
}) {
  if (items.length === 0) {
    return (
      <Frame>
        <EmptyActivity app={app} />
      </Frame>
    );
  }
  return (
    <Frame action={<CardLink href="/creator/referrals">All customers</CardLink>}>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`} className={ROW}>
            <span
              aria-hidden
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-[10px] font-extrabold",
                item.kind === "commission" ? "bg-primary/15 text-primary-ink" : "bg-muted",
              )}
            >
              {item.kind === "commission" ? item.symbol : <UserPlus className="size-4" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{item.title}</span>
              <span className="truncate text-[13px] text-muted-foreground">{item.subtitle}</span>
            </div>
            {item.amount ? <span className="tabular shrink-0 font-extrabold">{item.amount}</span> : null}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function RecentActivityUnavailable() {
  return (
    <Frame>
      <Unavailable />
    </Frame>
  );
}

export function RecentActivitySkeleton() {
  return (
    <Frame busy>
      <div className="flex flex-col">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={ROW}>
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <span className="flex flex-1 flex-col gap-1.5 py-0.5">
              <Skeleton className="h-3.5 w-48 max-w-full" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
