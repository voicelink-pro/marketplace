import { Bookmark, Heart, type LucideIcon, Mail, MessageCircle, Mic, Play, Share } from "lucide-react";
import type { ReactNode } from "react";
import { PageBrandMark } from "@/components/brand/brand-mark-backdrop";
import { cn } from "@/lib/utils";
import { YELLOW_GLOW } from "./glow-styles";
import { HERO_CONTENT } from "./home-hero-content";
import { type Platform, PLATFORM_NAMES, PlatformLogoTile } from "./platform-logos";
import { PrimaryCta } from "./primary-cta";
import { TrustLine } from "./trust-line";

const CHECKS = ["No follower minimum", "No approval needed", "Use a link or a code"];

/** The referral line on both phone screens: small, white, underlined in yellow. */
const SCREEN_LINK = "text-[10px] font-semibold text-foreground underline decoration-primary underline-offset-2";

/** Skeleton bars on the phone screens. */
function Bar({ className }: { className: string }) {
  return <div className={cn("h-1.5 rounded-full bg-muted-foreground/30", className)} />;
}

/**
 * TikTok-like screen: tabs, the video with its action icons and caption, the bottom nav.
 * The caption sits high enough in the video to stay above the card's bottom edge.
 */
function ShortVideoScreen() {
  return (
    <div className="flex size-full flex-col">
      <div className="flex justify-center gap-2 pt-7">
        <Bar className="w-8 bg-muted-foreground/25" />
        <Bar className="w-8 bg-foreground/60" />
      </div>
      <div className="relative mx-[10px] mt-3 flex-1 rounded-2xl bg-muted">
        <div className="absolute top-[92px] right-2 flex flex-col items-center gap-3.5 text-muted-foreground">
          <Heart className="size-[18px]" />
          <MessageCircle className="size-[18px]" />
          <Bookmark className="size-[18px]" />
          <Share className="size-[18px]" />
        </div>
        <div className="absolute top-[150px] left-2.5 flex flex-col gap-1.5">
          <Bar className="h-2 w-16 bg-foreground/40" />
          <Bar className="w-32" />
          <Bar className="w-24" />
          <p className={cn(SCREEN_LINK, "mt-0.5")}>NOTES-MAYA</p>
        </div>
      </div>
      <div className="flex h-12 items-center justify-around px-5">
        <div className="size-4 rounded bg-muted-foreground/30" />
        <div className="size-4 rounded bg-muted-foreground/30" />
        <div className="h-4 w-7 rounded-md bg-muted-foreground/30" />
        <div className="size-4 rounded bg-muted-foreground/30" />
        <div className="size-4 rounded bg-muted-foreground/30" />
      </div>
    </div>
  );
}

/** YouTube-like screen: the player, title, channel row and the description with the link. */
function LongVideoScreen() {
  return (
    <div className="flex size-full flex-col pt-6">
      <div className="relative grid h-[100px] shrink-0 place-items-center bg-muted">
        <div className="grid h-7 w-10 place-items-center rounded-lg bg-muted-foreground/25">
          <Play className="size-3.5 fill-current text-muted-foreground" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-muted-foreground/20">
          <div className="h-full w-[38%] bg-primary" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-3 pt-2.5">
        <div className="flex flex-col gap-1.5">
          <Bar className="h-2.5 w-[85%] bg-foreground/40" />
          <Bar className="h-2.5 w-[60%] bg-foreground/40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="size-6 shrink-0 rounded-full bg-muted-foreground/30" />
          <Bar className="h-2 w-16" />
          <div className="ml-auto h-5 w-14 rounded-full bg-foreground/70" />
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-muted p-2.5">
          <Bar className="w-[90%]" />
          <p className={SCREEN_LINK}>boostlink.co/r/maya</p>
          <Bar className="w-[70%]" />
        </div>
      </div>
    </div>
  );
}

/**
 * A tilted phone at the top right, cut off by the card's bottom edge; 200px wide
 * below lg. A fade from the card's background keeps the text over it readable:
 * from the bottom on phones, where the two overlap, and from the left from sm.
 */
function PhoneVisual({ tilt, children }: { tilt: "left" | "right"; children: ReactNode }) {
  return (
    <>
      <div
        className={cn(
          "absolute top-7 right-5 h-[410px] w-[210px] origin-top-right rounded-[38px] border bg-muted p-[7px] max-lg:scale-95 lg:origin-center",
          tilt === "right" ? "rotate-[8deg]" : "rotate-[-8deg]",
        )}
      >
        <div className="size-full overflow-hidden rounded-[31px] bg-background">{children}</div>
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-card from-45% to-transparent to-80% sm:hidden" />
      <div className="absolute inset-y-0 left-0 hidden w-[300px] bg-linear-to-r from-card to-transparent sm:block" />
    </>
  );
}

/** A large outline icon at the right, vertically centered and fully inside the card. */
function IconVisual({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      strokeWidth={1.1}
      className="absolute top-1/2 right-6 size-[130px] -translate-y-1/2 text-muted-foreground/20 lg:size-[190px]"
    />
  );
}

/**
 * The catalog glow's gold gradient and 2px width as a ring around the whole
 * card, plus a soft outer glow; fades in while the parent `group` is hovered or
 * holds focus, instantly with reduced motion. No pointer tracking.
 */
function HoverGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-300 ease-out group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
    >
      <div className="absolute inset-0 rounded-[inherit] shadow-[0_0_32px_-4px_color-mix(in_oklch,var(--primary)_45%,transparent)]" />
      {/* Padding-box ring: the gradient shows only between the border box and the content box. */}
      <div
        className={cn(
          "absolute -inset-[2px] rounded-[30px] p-[2px] [background:var(--gradient)]",
          "[mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [mask-clip:content-box,border-box] [mask-composite:exclude]",
          YELLOW_GLOW,
        )}
      />
    </div>
  );
}

type Audience = {
  title: string;
  body: ReactNode;
  platforms: Platform[];
  size: "large" | "small";
  visual: ReactNode;
};

const AUDIENCES: Audience[] = [
  {
    title: "TikTok, Reels and Shorts",
    body: "Your link in bio, your code on screen. Followers tap it or type it at sign-up.",
    platforms: ["tiktok", "instagram", "youtube"],
    size: "large",
    visual: (
      <PhoneVisual tilt="right">
        <ShortVideoScreen />
      </PhoneVisual>
    ),
  },
  {
    title: "YouTube creators",
    body: "Reviews and tutorials. Your link sits in the description, your code in the video.",
    platforms: ["youtube"],
    size: "large",
    visual: (
      <PhoneVisual tilt="left">
        <LongVideoScreen />
      </PhoneVisual>
    ),
  },
  {
    title: "Podcasters",
    body: (
      <>
        Your code works by voice.
        <br />
        No link needed.
      </>
    ),
    platforms: ["spotify", "applePodcasts"],
    size: "small",
    visual: <IconVisual icon={Mic} />,
  },
  {
    title: "Newsletter writers",
    body: (
      <>
        One link in the issue,
        <br />a code for readers who type.
      </>
    ),
    // beehiiv has no Simple Icons mark; Ghost stands in for it.
    platforms: ["substack", "ghost"],
    size: "small",
    visual: <IconVisual icon={Mail} />,
  },
];

/**
 * "Who it's for" on the creators home page, between Open programs and How it
 * works: two large cards with a phone mockup (short video, YouTube), then two
 * shorter ones with an outline icon (podcasts, newsletters). `WhoItsForCta`
 * follows on the page. On hover or focus a card's whole outline
 * lights up in the catalog glow's gold (`HoverGlow`). The page's outlined "b"
 * rises beside the heading and sits behind the cards.
 */
export function WhoItsFor() {
  return (
    <section
      aria-labelledby="who-its-for-heading"
      className="relative mx-auto flex w-full max-w-6xl flex-col items-center"
    >
      {/* The page's "b" (instead of the layout's): its top beside the heading, the rest behind the cards.
          `right` adds the gap between the section and the viewport edge, so it keeps the layout's spot
          (-24.5rem past the right edge) at every width. From lg; below it the cards stack full width and would hide it. */}
      <PageBrandMark className="-top-12 right-[calc(-24.5rem-(100vw-100%)/2)] md:hidden lg:block" />

      <div className="flex max-w-3xl flex-col items-center gap-3 text-center">
        <span className="text-sm font-bold text-primary">Who it&apos;s for</span>
        {/* Same size as the How it works heading. */}
        <h2
          id="who-its-for-heading"
          className="text-[clamp(1.5rem,6.4vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.045em] text-balance sm:text-[clamp(1rem,5vw,2.25rem)] sm:whitespace-nowrap"
        >
          Creators who earn with <span className="text-primary">boostlink</span>
        </h2>
        {/* The hero's trust line, centered; wraps on phones. */}
        <TrustLine items={CHECKS} className="justify-center gap-x-3.5 text-[13px] sm:gap-x-[18px] sm:text-sm" />
      </div>

      <ul className="mt-8 grid w-full gap-4 sm:mt-10 lg:grid-cols-2">
        {AUDIENCES.map((audience) => (
          // The item carries the glow: the card clips its own overflow, which would cut it off.
          <li key={audience.title} className="group relative flex rounded-[28px]">
            <HoverGlow />
            <div
              className={cn(
                "relative flex w-full flex-col justify-end overflow-hidden rounded-[28px] border bg-card",
                audience.size === "large" ? "h-[320px] p-8 lg:h-[300px]" : "min-h-[180px] p-7",
              )}
            >
              <div aria-hidden>{audience.visual}</div>
              {/* relative z-10: above the visual and its fade. */}
              <div className="relative z-10 flex max-w-[320px] flex-col">
                <div
                  role="img"
                  aria-label={audience.platforms.map((platform) => PLATFORM_NAMES[platform]).join(", ")}
                  className="mb-3 flex gap-2"
                >
                  {audience.platforms.map((platform) => (
                    // Black tiles need an edge to read on the dark card.
                    <PlatformLogoTile
                      key={platform}
                      platform={platform}
                      size={32}
                      className={cn("rounded-lg", (platform === "tiktok" || platform === "spotify") && "border border-white/20")}
                    />
                  ))}
                </div>
                {/* `!`: the global h3 weight and tracking are unlayered and would win otherwise. */}
                <h3 className="text-[30px] leading-tight font-extrabold! tracking-[-0.035em]!">{audience.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{audience.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The hero's primary button and target, closing Who it's for under its cards.
 * A page-level item: centered, and pulled up into the page's section gap
 * (40px / 56px from sm) to sit 40px under the cards.
 */
export function WhoItsForCta() {
  // Same target as the hero on `/`, which has no session-dependent href for creators.
  const cta = HERO_CONTENT.creators.primary;
  return (
    <PrimaryCta href={cta.signedOutHref ?? cta.href} className="self-center max-sm:w-auto sm:-mt-4">
      {cta.label}
    </PrimaryCta>
  );
}
