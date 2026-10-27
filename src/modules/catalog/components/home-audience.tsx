"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { createContext, type KeyboardEvent, startTransition, use, useOptimistic, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HOME_AUDIENCE_PARAM, type HomeAudience, parseHomeAudience } from "../audience";

/**
 * The audience picked on the toggle while its navigation is still loading.
 * Every audience-dependent part of the page switches on the same frame,
 * then falls back to what the server rendered once the transition ends.
 * Wraps the public layout, since the toggle lives in the header.
 */
const PendingAudienceContext = createContext<{
  pending: HomeAudience | null;
  setPending: (audience: HomeAudience | null) => void;
}>({ pending: null, setPending: () => {} });

export function HomeAudienceProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useOptimistic<HomeAudience | null>(null);
  return <PendingAudienceContext value={{ pending, setPending }}>{children}</PendingAudienceContext>;
}

function useHomeAudience(serverAudience: HomeAudience): HomeAudience {
  return use(PendingAudienceContext).pending ?? serverAudience;
}

/** Shows one of two server-rendered variants for the current audience. */
export function AudienceSwitch({
  audience,
  creators,
  apps,
}: {
  audience: HomeAudience;
  creators: React.ReactNode;
  apps: React.ReactNode;
}) {
  return useHomeAudience(audience) === "apps" ? apps : creators;
}

const OPTIONS: { value: HomeAudience; label: string }[] = [
  { value: "creators", label: "For creators" },
  { value: "apps", label: "For apps" },
];

/** "Bubble" slide: a quick spring with a small overshoot before it settles. */
const PILL_SPRING = { type: "spring", bounce: 0.3, duration: 0.35 } as const;
/** Stretch toward the target, then back to round, over the same ~350ms. */
const PILL_STRETCH = { scaleX: [1, 1.14, 1], scaleY: [1, 0.94, 1] };

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * Segmented control in the header toggle's style (ARIA radio group: one tab
 * stop, arrow keys move and select). The yellow pill slides to the chosen
 * option after a click or key press and snaps into place otherwise.
 */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onSelect,
  label,
  layoutId,
  fullWidth = false,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onSelect: (value: T) => void;
  label: string;
  /** Unique per mounted control, so two controls never share the pill. */
  layoutId: string;
  fullWidth?: boolean;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  // The last move made here: replays the stretch, anchored on the side it leaves from.
  const [move, setMove] = useState<{ id: number; towardEnd: boolean } | null>(null);
  // True from a click or key press until the pill settles: only then does it slide.
  // Mount, reload and route changes (which can shift the header) snap it into place.
  const [animating, setAnimating] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function select(next: T) {
    if (next === value) return;
    const from = options.findIndex((option) => option.value === value);
    const to = options.findIndex((option) => option.value === next);
    setMove((previous) => ({ id: (previous?.id ?? 0) + 1, towardEnd: to > from }));
    setAnimating(!reducedMotion);
    // Fallback in case no layout animation runs (and so never completes).
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setAnimating(false), 600);
    onSelect(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target: number;
    if (NEXT_KEYS.has(event.key)) target = (index + 1) % options.length;
    else if (PREVIOUS_KEYS.has(event.key)) target = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = options.length - 1;
    else return;
    event.preventDefault();
    buttons.current[target]?.focus();
    select(options[target].value);
  }

  return (
    <LayoutGroup id={layoutId}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          // overflow-hidden clips the pill's stretch to the toggle.
          "flex h-11 items-center overflow-hidden rounded-full border bg-background p-1 text-[15px] ring-4 ring-primary/15",
          fullWidth && "w-full",
        )}
      >
        {options.map((option, index) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => select(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative h-full rounded-full px-4 font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                fullWidth && "flex-1",
                // --primary-ink is the brand yellow in dark mode and a readable dark gold on light backgrounds.
                checked ? "text-primary-foreground" : "text-muted-foreground hover:text-primary-ink",
              )}
            >
              {checked ? (
                // Shared pill: slides to the checked option after a user choice, appears in place otherwise.
                <motion.span
                  layoutId="pill"
                  initial={false}
                  transition={animating ? PILL_SPRING : { duration: 0 }}
                  onLayoutAnimationComplete={() => setAnimating(false)}
                  aria-hidden
                  className="absolute inset-0"
                >
                  <motion.span
                    key={move?.id ?? 0}
                    initial={animating ? undefined : false}
                    // Same `animate` on server and client (hydration); reduced motion just finishes it at once.
                    animate={PILL_STRETCH}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.35, times: [0, 0.35, 1], ease: "easeOut" }}
                    style={{ originX: move?.towardEnd ? 0 : 1 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                </motion.span>
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/**
 * "For creators | For apps" on the home page. `defaultAudience` is what the
 * page shows with no param, so choosing it clears `?for=` instead of writing it.
 */
function AudienceToggle({ defaultAudience, fullWidth }: { defaultAudience: HomeAudience; fullWidth: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pending, setPending } = use(PendingAudienceContext);
  const audience = pending ?? parseHomeAudience(searchParams.get(HOME_AUDIENCE_PARAM) ?? undefined) ?? defaultAudience;

  function select(next: HomeAudience) {
    // Keeps the catalog filters already in the URL.
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultAudience) params.delete(HOME_AUDIENCE_PARAM);
    else params.set(HOME_AUDIENCE_PARAM, next);
    const query = params.toString();
    startTransition(() => {
      setPending(next);
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    });
  }

  return (
    // One group per placement: bar and row are both mounted and must not share the pill.
    <SegmentedToggle
      value={audience}
      options={OPTIONS}
      onSelect={select}
      label="Show the home page for"
      layoutId={`home-audience-${fullWidth ? "row" : "bar"}`}
      fullWidth={fullWidth}
    />
  );
}

/**
 * The toggle's place in the public header, on the home page only.
 * "bar": centered in the header row (lg+, placed by the header). "row": full-width strip under it below lg.
 * `defaultAudience` is null while the session streams in: a same-size placeholder.
 */
export function HeaderAudienceToggle({
  defaultAudience,
  variant,
}: {
  defaultAudience: HomeAudience | null;
  variant: "bar" | "row";
}) {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  const fullWidth = variant === "row";
  const toggle = defaultAudience ? (
    <AudienceToggle defaultAudience={defaultAudience} fullWidth={fullWidth} />
  ) : (
    <Skeleton className={cn("h-11 rounded-full", fullWidth ? "w-full" : "w-[14.5rem]")} />
  );
  return fullWidth ? <div className="border-t px-4 py-2 sm:px-6 lg:hidden">{toggle}</div> : toggle;
}
