import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelIcon } from "../channel-icon";
import { CardHeading, CardLink, HomeCard, Unavailable } from "./card";

const TITLE_ID = "top-links-heading";

export type TopLink = { id: string; label: string; clicks: number; channel: string | null };

function Frame({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return (
    <HomeCard titleId={TITLE_ID} busy={busy} className="gap-3.5">
      <CardHeading id={TITLE_ID} title="Top links" note="Clicks per link · all time" />
      {children}
    </HomeCard>
  );
}

const count = new Intl.NumberFormat("en");

/**
 * The four links with the most clicks, with neutral bars relative to the
 * first. Until there is a named link, a hint to create one per channel.
 */
export function TopLinks({ links, hasNamedLink }: { links: TopLink[]; hasNamedLink: boolean }) {
  const top = links.toSorted((a, b) => b.clicks - a.clicks).slice(0, 4);
  const max = Math.max(1, ...top.map((link) => link.clicks));
  return (
    <Frame>
      {top.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {top.map((link) => (
            <li key={link.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <ChannelIcon channel={link.channel} />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{link.label}</span>
                <span className="tabular font-bold">{count.format(link.clicks)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-muted-foreground/70"
                  style={{ width: `${(link.clicks / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No links yet. Joining a program creates your first one.</p>
      )}
      {hasNamedLink ? null : (
        <p className="text-[13px] leading-snug text-muted-foreground">
          One link per place you post shows which one brings customers.
        </p>
      )}
      <div className="flex-1" />
      {hasNamedLink ? (
        <CardLink href="/creator/links" className="self-start">
          All links
        </CardLink>
      ) : (
        <Button asChild variant="outline" size="sm" className="self-start rounded-full px-4">
          <Link href="/creator/links">Create a link</Link>
        </Button>
      )}
    </Frame>
  );
}

export function TopLinksUnavailable() {
  return (
    <Frame>
      <Unavailable />
    </Frame>
  );
}

export function TopLinksSkeleton() {
  return (
    <Frame busy>
      <div className="flex flex-col gap-3.5">
        {[0, 1].map((index) => (
          <div key={index} className="flex flex-col gap-2">
            <span className="flex h-5.5 items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-8" />
            </span>
            <Skeleton className="h-2 rounded-full" />
          </div>
        ))}
      </div>
    </Frame>
  );
}
