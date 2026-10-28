"use client";

import { Command as CommandPrimitive } from "cmdk";
import {
  AppWindow,
  Bell,
  FileText,
  Image,
  Link2,
  type LucideIcon,
  Plug,
  Receipt,
  Search,
  Shapes,
  Share2,
  UserRound,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { navItems, type PanelArea } from "./nav-config";

/** One result row. Items sent from the server carry `initial` instead of an icon, which can't be serialized. */
export type SearchItem = { href: string; title: string; subtitle: string; icon?: LucideIcon; initial?: string };

type SearchContextValue = { openSearch: () => void; setExtraItems: (items: SearchItem[]) => void };

const SearchContext = createContext<SearchContextValue | null>(null);

function useSearch(): SearchContextValue {
  const context = use(SearchContext);
  if (!context) throw new Error("Search triggers must be rendered inside PanelSearchProvider.");
  return context;
}

const LABEL = "Search apps, pages and settings";

const account: SearchItem = {
  href: "/account",
  title: "Profile and account",
  subtitle: "Account · name, email, password",
  icon: UserRound,
};
const notifications: SearchItem = {
  href: "/notifications",
  title: "Notifications",
  subtitle: "Reviews, funding, payouts and support updates",
  icon: Bell,
};

/** Company entries are the app profile editor's sections: its section menu's labels and anchors. */
const SETTINGS: Record<PanelArea, SearchItem[]> = {
  creator: [
    {
      href: "/creator/settings",
      title: "Social profiles",
      subtitle: "Settings · where companies see you post",
      icon: Share2,
    },
    account,
    notifications,
    { href: "/creator/payouts", title: "Payout account", subtitle: "Payouts · where your earnings go", icon: Wallet },
  ],
  company: [
    {
      href: "/company/app#editor-basics",
      title: "Basics",
      subtitle: "App profile · name, tagline and description",
      icon: AppWindow,
    },
    {
      href: "/company/app#editor-listing",
      title: "Categories & platforms",
      subtitle: "App profile · categories, platforms and languages",
      icon: Shapes,
    },
    {
      href: "/company/app#editor-links",
      title: "Links",
      subtitle: "App profile · website and app store links",
      icon: Link2,
    },
    {
      href: "/company/app#editor-media",
      title: "Media",
      subtitle: "App profile · logo, cover, screenshots and video",
      icon: Image,
    },
    {
      href: "/company/app#editor-terms",
      title: "Terms",
      subtitle: "App profile · program terms and attribution window",
      icon: FileText,
    },
    { href: "/company/plans", title: "Plans", subtitle: "Plans & commissions · rates per plan", icon: Receipt },
    {
      href: "/company/integrations",
      title: "Integrations",
      subtitle: "Payments · provider events and identities",
      icon: Plug,
    },
    { href: "/company/funding", title: "Funding", subtitle: "Payments · balance and top-ups", icon: Wallet },
    { ...account, title: "Account" },
  ],
  admin: [{ ...account, title: "Account" }, notifications],
};

/** Contains the query, best when the title starts with it or one of its words does; subtitles rank last. */
function filter(_value: string, search: string, keywords: string[] = []): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  const [title = "", subtitle = ""] = keywords.map((keyword) => keyword.toLowerCase());
  if (title.startsWith(query)) return 1;
  if (title.split(/\s+/).some((word) => word.startsWith(query))) return 0.9;
  if (title.includes(query)) return 0.8;
  if (subtitle.includes(query)) return 0.5;
  return 0;
}

/** Marker style from the design guide: dark text on a yellow highlight. */
function Highlight({ text, query }: { text: string; query: string }) {
  const start = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (start < 0) return text;
  const end = start + query.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-primary px-px text-primary-foreground">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function ResultItem({
  item,
  group,
  query,
  onSelect,
}: {
  item: SearchItem;
  group: string;
  query: string;
  onSelect: (href: string) => void;
}) {
  const { href, title, subtitle, icon: Icon, initial } = item;
  const q = query.trim();
  const titleMatches = q !== "" && title.toLowerCase().includes(q.toLowerCase());
  return (
    <CommandItem
      value={`${group} ${href}`}
      keywords={[title, subtitle]}
      onSelect={() => onSelect(href)}
      className="h-12 gap-3 rounded-lg px-2.5"
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-data-selected/command-item:bg-background group-data-selected/command-item:text-primary-ink"
      >
        {Icon ? <Icon className="size-4" /> : <span className="text-sm font-extrabold">{initial}</span>}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">
          <Highlight text={title} query={q} />
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {titleMatches ? subtitle : <Highlight text={subtitle} query={q} />}
        </span>
      </span>
    </CommandItem>
  );
}

const noSubscribe = () => () => {};

/** The server renders ⌘K; other platforms switch to Ctrl K once hydrated. */
function useIsApple(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent),
    () => true,
  );
}

const kbdClassName =
  "inline-flex h-6 shrink-0 items-center rounded-md border bg-background px-1.5 font-sans text-xs font-semibold text-muted-foreground";

/** Centered header button, md and up. */
export function PanelSearchTrigger() {
  const { openSearch } = useSearch();
  const isApple = useIsApple();
  return (
    <button
      type="button"
      onClick={openSearch}
      aria-keyshortcuts="Meta+K Control+K"
      className="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl border bg-card pr-2 pl-3.5 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{LABEL}</span>
      <kbd className={kbdClassName}>{isApple ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}

/** Icon button for phones. */
export function PanelSearchIconTrigger({ className }: { className?: string }) {
  const { openSearch } = useSearch();
  return (
    <Button type="button" variant="ghost" size="icon-lg" onClick={openSearch} aria-label={LABEL} className={className}>
      <Search aria-hidden />
    </Button>
  );
}

/**
 * Hands items loaded on the server (programs, the company's app) to the palette.
 * Render it inside <Suspense>: the palette works without them until they arrive.
 */
export function PanelSearchItems({ items }: { items: SearchItem[] }) {
  const { setExtraItems } = useSearch();
  useEffect(() => setExtraItems(items), [items, setExtraItems]);
  return null;
}

const groupClassName = "p-0 pt-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1";

/**
 * Command palette for a panel: the triggers in the header and ⌘K / Ctrl+K
 * anywhere in the panel open it. cmdk filters and ranks the rows; full screen on phones.
 */
export function PanelSearchProvider({ area, children }: { area: PanelArea; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [extraItems, setExtraItems] = useState<SearchItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Stable for the triggers; setters never change.
  const [context] = useState<SearchContextValue>(() => ({ openSearch: () => setOpen(true), setExtraItems }));

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  // Each nav item, followed by the pages under it that have no entry of their own (Payouts under Earnings).
  const pages: SearchItem[] = navItems(area)
    .flatMap((item) => [item, ...(item.match ?? [])])
    .map(({ href, label, description, icon }) => ({ href, title: label, subtitle: description, icon }));
  const q = query.trim();

  return (
    <SearchContext value={context}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Search"
        description={LABEL}
        className={cn(
          "gap-0 rounded-2xl! border bg-popover ring-0 md:top-[12vh] md:max-w-160",
          "max-md:inset-0 max-md:h-dvh max-md:max-w-none max-md:translate-x-0 max-md:rounded-none!",
        )}
      >
        <Command filter={filter} loop className="rounded-none! bg-transparent p-0">
          <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <Search aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder={LABEL}
              aria-label={LABEL}
              className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <kbd className={cn(kbdClassName, "hidden md:inline-flex")}>Esc</kbd>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="md:hidden">
                Cancel
              </Button>
            </DialogClose>
          </div>
          <CommandList className="max-h-none flex-1 p-2 md:max-h-[min(60vh,30rem)]">
            <CommandEmpty className="py-10 text-muted-foreground">No pages or settings match “{q}”.</CommandEmpty>
            <CommandGroup heading="Pages" className={groupClassName}>
              {pages.map((item) => (
                <ResultItem key={item.href} item={item} group="page" query={query} onSelect={go} />
              ))}
            </CommandGroup>
            <CommandGroup heading="Settings" className={groupClassName}>
              {SETTINGS[area].map((item) => (
                <ResultItem key={item.href} item={item} group="setting" query={query} onSelect={go} />
              ))}
            </CommandGroup>
            {extraItems.length > 0 ? (
              <CommandGroup heading={area === "company" ? "Your app" : "Your programs"} className={groupClassName}>
                {extraItems.map((item) => (
                  <ResultItem key={item.href} item={item} group="program" query={query} onSelect={go} />
                ))}
              </CommandGroup>
            ) : null}
            {area === "creator" && q ? (
              <CommandGroup forceMount className={groupClassName}>
                <CommandItem
                  forceMount
                  value="discover"
                  onSelect={() => go(`/creator/discover?q=${encodeURIComponent(q)}`)}
                  className="h-12 gap-3 rounded-lg px-2.5"
                >
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-data-selected/command-item:bg-background group-data-selected/command-item:text-primary-ink"
                  >
                    <Search className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">Search apps for “{q}”</span>
                    <span className="truncate text-xs text-muted-foreground">Discover · the whole catalog</span>
                  </span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
          <div className="hidden h-11 shrink-0 items-center border-t px-4 text-xs text-muted-foreground md:flex">
            ↑↓ to move · ↵ to open
          </div>
        </Command>
      </CommandDialog>
    </SearchContext>
  );
}
