import { MousePointer2 } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { ChatAppIcon, GenericAppIcon, NotesAppIcon, TimerAppIcon } from "./app-icons";
import { CreatorAvatar } from "./new-era/creator-avatars";
import { PlatformLogoTile } from "./platform-logos";

// Static step illustrations for How it works, each drawn to sit centered in a
// 280×190 box. Theme tokens throughout; the app icons keep their own colors. Decorative: the step title carries the meaning.

const CARD = "rounded-[18px] border bg-card";
const BAR = "block h-1.5 rounded-full bg-muted";
/** The hero's key phrase color: yellow letters. */
const KEY_PHRASE = "text-primary";

const APP_CARD = cn(CARD, "absolute flex h-[148px] w-28 flex-col gap-2.5 p-3.5 text-left");

/** A catalog app behind the chosen one: icon and placeholder lines, no commission. */
function SideAppCard({ Icon, className }: { Icon: typeof NotesAppIcon; className: string }) {
  return (
    <div className={cn(APP_CARD, className)}>
      <Icon className="size-[38px]" />
      <span className={cn(BAR, "w-[62px] bg-border")} />
      <span className={cn(BAR, "w-[70px]")} />
      <span className={cn(BAR, "w-12")} />
      <span className="mt-auto block h-3.5 w-9 rounded-full bg-muted" />
    </div>
  );
}

/** Creators 1: three fanned app cards, the front one with its recurring commission. */
export function PickAppScene() {
  // 224×169: the three cards, plus the rotated side cards' lower corners.
  return (
    <div className="relative h-[169px] w-56">
      <SideAppCard Icon={TimerAppIcon} className="top-3 left-0 -rotate-10" />
      <SideAppCard Icon={ChatAppIcon} className="top-3 left-28 rotate-10" />
      <div className={cn(APP_CARD, "top-0 left-14 border-foreground/15")}>
        <NotesAppIcon className="size-[38px]" />
        {/* A real app from the catalog, at its own rate. */}
        <span className="text-[13px] leading-tight font-bold">Draftly</span>
        <span className={cn(BAR, "w-[70px]")} />
        <span className={cn(BAR, "w-12")} />
        <span className="mt-auto inline-flex h-[22px] w-fit items-center rounded-full bg-primary px-[9px] text-[11px] font-extrabold whitespace-nowrap text-primary-foreground">
          20% recurring
        </span>
      </div>
    </div>
  );
}

/** Creators 2: platform tiles above the creator's personal link. */
export function ShareLinkScene() {
  return (
    <div className="relative h-[158px] w-58">
      <PlatformLogoTile
        platform="tiktok"
        size={66}
        className="absolute top-1.5 left-7 -rotate-8 rounded-[18px] border border-white/20"
      />
      <PlatformLogoTile platform="instagram" size={66} className="absolute top-0 left-[83px] rotate-2 rounded-[18px]" />
      <PlatformLogoTile platform="youtube" size={66} className="absolute top-2.5 left-[138px] rotate-9 rounded-[18px]" />
      <div className="absolute top-26 left-0 flex h-11 w-58 items-center justify-center rounded-full border bg-card text-[13px] font-bold whitespace-nowrap">
        <span className="text-muted-foreground">boostlink.co/r/</span>
        <span className="rounded-[6px] bg-[#FFD600] px-1.5 text-[#111111]">your-name</span>
      </div>
      <MousePointer2
        strokeWidth={1.5}
        className="absolute top-33 left-[190px] size-[26px] fill-foreground text-background"
      />
    </div>
  );
}

/** An older notification behind the new one: logo, a placeholder line and its time. */
function PastNotification({ time, className }: { time: string; className: string }) {
  return (
    <div className={cn(CARD, "absolute h-16 px-3.5 py-[11px]", className)}>
      <div className="flex items-center gap-2 opacity-60">
        <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-primary">
          <LogoMark className="size-3 fill-primary-foreground" />
        </span>
        <span className={cn(BAR, "w-[70px]")} />
        <span className="flex-1" />
        <span className="text-[11px] text-muted-foreground">{time}</span>
      </div>
    </div>
  );
}

/** Creators 3: the newest commission notification on top of earlier ones. */
export function RenewalScene() {
  return (
    <div className="relative w-63 pt-18">
      <PastNotification time="1 mo ago" className="top-0 left-7 w-49" />
      <PastNotification time="2 d ago" className="top-7.5 left-3.5 w-56" />
      <div className={cn(CARD, "relative flex flex-col gap-1.5 px-3.5 py-3 text-left")}>
        <div className="flex items-center gap-2">
          <span className="grid size-[22px] shrink-0 place-items-center rounded-[6px] bg-primary">
            <LogoMark className="size-3.5 fill-primary-foreground" />
          </span>
          <span className="flex-1 text-xs font-bold">boostlink</span>
          <span className="text-[11px] text-muted-foreground">now</span>
        </div>
        <span className="text-[13px] leading-[1.35] font-semibold">
          New subscriber via your TikTok link. <span className={cn(KEY_PHRASE, "font-bold")}>+$7.80</span>
        </span>
      </div>
    </div>
  );
}

const PLANS = [
  { name: "Pro Monthly", price: "$39" },
  { name: "Pro Annual", price: "$390" },
];

/** Apps 1: the app's plans with the commission set on each. */
export function CommissionScene() {
  return (
    <div className={cn(CARD, "flex w-60 flex-col gap-2 px-4 py-3.5 text-left")}>
      <div className="flex items-center gap-2.5">
        <GenericAppIcon className="size-[34px]" />
        <span className="flex flex-col">
          <span className="text-sm font-bold">Your app</span>
          <span className="text-[11px] text-muted-foreground">Commission per plan</span>
        </span>
      </div>
      {PLANS.map((plan) => (
        <div key={plan.name} className="flex items-center justify-between border-t py-[9px] text-[13px]">
          <span className="font-semibold">{plan.name}</span>
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">{plan.price}</span>
            <span className="inline-flex h-[22px] items-center rounded-full bg-muted px-[9px] text-[11px] font-extrabold">
              20%
            </span>
          </span>
        </div>
      ))}
      <div className="pt-1.5">
        <div className="relative h-1.5 rounded-full bg-muted">
          <span className="absolute inset-y-0 left-0 w-[40%] rounded-full bg-primary" />
          <span className="absolute top-1/2 left-[40%] -mt-2 -ml-2 size-4 rounded-full border-[3px] border-background bg-white ring-1 ring-border" />
        </div>
      </div>
    </div>
  );
}

/** Apps 2: creators who joined the offer, each with the platform they post on. */
export function CreatorsJoinScene() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex">
        {/* Overlapping by 22px, the first one on top. */}
        {[0, 1, 2].map((index) => (
          <span key={index} className={cn("relative", index > 0 && "-ml-[22px]")} style={{ zIndex: 3 - index }}>
            <CreatorAvatar index={index} />
          </span>
        ))}
      </div>
      <span className="inline-flex h-[34px] items-center gap-2 rounded-full border bg-card px-3.5 text-[13px] font-bold">
        <span className="size-[7px] rounded-full bg-primary" />3 creators joined your program
      </span>
    </div>
  );
}

/** Example funnel: 186 of 2,480 clicks sign up, 34 of them pay. Bar widths are illustrative. */
const FUNNEL = [
  { label: "Clicks", value: "2,480", width: "w-full", fill: "bg-foreground/20" },
  { label: "Sign-ups", value: "186", width: "w-[62%]", fill: "bg-muted-foreground" },
  { label: "Paying customers", value: "34", width: "w-[34%]", fill: "bg-primary" },
];

/** Apps 3: the funnel from clicks to paying customers; commission only on the last step. */
export function PayingScene() {
  return (
    <div className={cn(CARD, "flex w-60 flex-col gap-3 p-4 text-left")}>
      {FUNNEL.map((row) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-muted-foreground">{row.label}</span>
            <span className="font-bold">{row.value}</span>
          </div>
          <span className="block h-2.5 rounded-full bg-muted">
            <span className={cn("block h-full rounded-full", row.width, row.fill)} />
          </span>
        </div>
      ))}
      {/* One line, so the card fits the 190px box. */}
      <span className="text-[11px] whitespace-nowrap text-muted-foreground">
        You pay commission on the <span className="font-bold text-foreground">34</span> who pay.
      </span>
    </div>
  );
}
