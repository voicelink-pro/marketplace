import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange } from "@/lib/money";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { APP_CATEGORY_LABELS } from "@/modules/catalog/constants";
import type { SimilarAppSuggestion } from "../../queries";
import { CardHeading, CardLink, HomeCard, Unavailable } from "./card";

const TITLE_ID = "similar-heading";

function Frame({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return (
    <HomeCard titleId={TITLE_ID} busy={busy} className="gap-3">
      <CardHeading id={TITLE_ID} title="Apps you might like" note="Similar to the apps you promote" />
      {children}
      <div className="flex-1" />
      <CardLink href="/creator/discover" className="self-start">
        Discover apps
      </CardLink>
    </HomeCard>
  );
}

const ROW = "flex items-center gap-3 rounded-xl px-2 py-2";

/** Up to three apps from the categories the creator already promotes. */
export function SimilarApps({ apps, hasPrograms }: { apps: SimilarAppSuggestion[]; hasPrograms: boolean }) {
  if (!hasPrograms || apps.length === 0) {
    return (
      <Frame>
        <p className="text-sm text-pretty text-muted-foreground">
          {hasPrograms
            ? "You’ve joined every app in your categories. Discover apps in others."
            : "Join your first program to see apps like it."}
        </p>
      </Frame>
    );
  }
  return (
    <Frame>
      <ul className="-mx-2 flex flex-col">
        {apps.map((app) => (
          <li key={app.appId}>
            <Link
              href={`/apps/${app.slug}`}
              className={`${ROW} outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50`}
            >
              <AppLogo app={app} className="size-10 rounded-xl" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold">{app.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {app.categories[0] ? APP_CATEGORY_LABELS[app.categories[0]] : app.organizationName}
                </span>
              </span>
              <span className="tabular shrink-0 text-[13px] font-bold">
                {formatCommissionRange(app.minCommissionBps, app.maxCommissionBps, "")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function SimilarAppsUnavailable() {
  return (
    <Frame>
      <Unavailable />
    </Frame>
  );
}

/** The rows' box: 40px logo between 8px paddings. */
export function SimilarAppsSkeleton() {
  return (
    <Frame busy>
      <div className="-mx-2 flex flex-col">
        {[0, 1, 2].map((index) => (
          <div key={index} className={ROW}>
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <span className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-28 max-w-full" />
              <Skeleton className="h-3 w-20 max-w-full" />
            </span>
            <Skeleton className="h-3.5 w-10" />
          </div>
        ))}
      </div>
    </Frame>
  );
}
