import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { ChannelIcon } from "../channel-icon";
import { CopyValueButton } from "../copy-value-button";
import { percentOf } from "../home/home-data";
import { displayUrl, type LinkRow, sharePath } from "./link-data";

const count = new Intl.NumberFormat("en");
const show = (value: number | null) => (value === null ? "—" : count.format(value));
/** Clicks that became sign-ups; a dash before the first click. */
const rateOf = (row: LinkRow) => (row.clicks && row.signups !== null ? percentOf(row.signups, row.clicks) : null) ?? "—";
const quiet = (row: LinkRow) => !row.clicks;

/** Neutral bar relative to the link with the most clicks; never yellow. */
function ClicksBar({ clicks, max }: { clicks: number | null; max: number }) {
  return (
    <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-muted">
      {clicks ? (
        <span className="block h-full rounded-full bg-muted-foreground" style={{ width: `${(clicks / max) * 100}%` }} />
      ) : null}
    </span>
  );
}

function PrimaryBadge({ row }: { row: LinkRow }) {
  return row.isDefault ? (
    <Badge variant="secondary" className="shrink-0 text-muted-foreground">
      Primary
    </Badge>
  ) : null;
}

function CopyLink({ row, withApp, pill = false }: { row: LinkRow; withApp: boolean; pill?: boolean }) {
  const ariaLabel = `Copy ${row.label} link${withApp ? ` (${row.appName})` : ""}`;
  return pill ? (
    <CopyValueButton
      value={row.shareUrl}
      label="Copy"
      variant="secondary"
      ariaLabel={ariaLabel}
      toastMessage={`Copied “${row.label}” link.`}
      className="h-9 shrink-0 rounded-full px-3.5"
    />
  ) : (
    <CopyValueButton
      value={row.shareUrl}
      size="icon"
      variant="secondary"
      ariaLabel={ariaLabel}
      toastMessage={`Copied “${row.label}” link.`}
      className="rounded-[10px]"
    />
  );
}

/** Phone layout of a link: name, app, Copy, the URL, then its results in one line. */
function LinkCard({ row, max, withApp, inset }: { row: LinkRow; max: number; withApp: boolean; inset: boolean }) {
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-3 border p-4",
        inset ? "rounded-2xl bg-background p-3.5" : "rounded-[20px] bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <ChannelIcon channel={row.channel} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-bold">{row.label}</span>
          {withApp || row.isDefault ? (
            <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {withApp ? <span className="truncate">{row.appName}</span> : null}
              <PrimaryBadge row={row} />
            </span>
          ) : null}
        </div>
        <CopyLink row={row} withApp={withApp} pill />
      </div>
      <span className="truncate font-mono text-xs text-muted-foreground">{displayUrl(row.shareUrl)}</span>
      {row.clicks === null ? (
        <span className="text-[13px] text-muted-foreground">Results unavailable</span>
      ) : row.clicks === 0 ? (
        <span className="text-[13px] text-muted-foreground">No clicks yet</span>
      ) : (
        <>
          <ClicksBar clicks={row.clicks} max={max} />
          <span className="tabular text-[13px] text-muted-foreground">
            <b className="text-foreground">{count.format(row.clicks)}</b> clicks ·{" "}
            <b className="text-foreground">{show(row.signups)}</b> sign-ups · {rateOf(row)}
          </span>
        </>
      )}
    </li>
  );
}

function LinkCards({ rows, withApp, inset = false }: { rows: LinkRow[]; withApp: boolean; inset?: boolean }) {
  const max = Math.max(1, ...rows.map((row) => row.clicks ?? 0));
  return (
    <ul className="flex flex-col gap-3 sm:hidden">
      {rows.map((row) => (
        <LinkCard key={row.id} row={row} max={max} withApp={withApp} inset={inset} />
      ))}
    </ul>
  );
}

// The bar column stays narrow: inside the panel the card is ~590px wide at 1280px, and the link needs the room.
const TABLE_COLUMNS = "grid grid-cols-[minmax(0,1fr)_120px_64px_52px_36px] gap-4";

/**
 * Links of several programs with their results: rows with column headers
 * from `sm`, cards below it. `rows` come sorted.
 */
export function LinkTable({ rows }: { rows: LinkRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.clicks ?? 0));
  return (
    <>
      <div role="table" aria-label="Your links" className="hidden flex-col sm:flex">
        <div role="row" className={cn(TABLE_COLUMNS, "pt-3 pb-1.5 text-xs font-semibold text-muted-foreground")}>
          <span role="columnheader">Link</span>
          <span role="columnheader">Clicks</span>
          <span role="columnheader" className="text-right">
            Sign-ups
          </span>
          <span role="columnheader" className="text-right">
            Rate
          </span>
          <span role="columnheader">
            <span className="sr-only">Copy</span>
          </span>
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            role="row"
            className={cn(TABLE_COLUMNS, "tabular items-center border-t py-3.5 text-sm", quiet(row) && "text-muted-foreground")}
          >
            <div role="cell" className="flex min-w-0 items-center gap-3">
              <ChannelIcon channel={row.channel} size="lg" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-bold text-foreground">{row.label}</span>
                <span className="flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
                  <AppLogo
                    app={{ name: row.appName, logoUrl: row.logoUrl }}
                    className="size-3.5 rounded-[4px] border-0 text-[9px]"
                  />
                  <span className="shrink-0">{row.appName} ·</span>
                  <span className="truncate font-mono">{sharePath(row.shareUrl)}</span>
                </span>
              </div>
            </div>
            <div role="cell" className="flex flex-col gap-1.5">
              <span className="font-bold">{show(row.clicks)}</span>
              <ClicksBar clicks={row.clicks} max={max} />
            </div>
            <span role="cell" className="text-right font-bold">
              {show(row.signups)}
            </span>
            <span role="cell" className="text-right">
              {rateOf(row)}
            </span>
            <span role="cell">
              <CopyLink row={row} withApp />
            </span>
          </div>
        ))}
      </div>
      <LinkCards rows={rows} withApp />
    </>
  );
}

/** One program's links: icon, name and path, clicks and sign-ups, copy. Phones get the card layout. */
export function ProgramLinkRows({ rows }: { rows: LinkRow[] }) {
  return (
    <>
      <ul className="hidden flex-col sm:flex">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn("tabular flex items-center gap-3.5 border-b py-3 last:border-b-0", quiet(row) && "text-muted-foreground")}
          >
            <ChannelIcon channel={row.channel} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-bold text-foreground">{row.label}</span>
                <PrimaryBadge row={row} />
              </span>
              <span className="truncate font-mono text-xs text-muted-foreground">{sharePath(row.shareUrl)}</span>
            </div>
            <span className="w-20 text-right text-sm">
              <b>{show(row.clicks)}</b>
              <span className="block text-[11px] text-muted-foreground">clicks</span>
            </span>
            <span className="w-20 text-right text-sm">
              <b>{show(row.signups)}</b>
              <span className="block text-[11px] text-muted-foreground">sign-ups</span>
            </span>
            <CopyLink row={row} withApp={false} />
          </li>
        ))}
      </ul>
      <LinkCards rows={rows} withApp={false} inset />
    </>
  );
}

/** Rows' line boxes while results stream in. */
export function LinkRowsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3.5 border-b py-3 last:border-b-0">
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
        </div>
      ))}
    </div>
  );
}
