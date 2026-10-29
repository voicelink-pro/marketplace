"use client";

import { Activity } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../../audience";
import { GenericAppIcon } from "../generic-app-icon";
import { type Platform, PlatformLogoTile } from "../platform-logos";

type Row = {
  icon: Platform | "boostlink" | "app";
  title: string;
  description: string;
  source: string;
  /** An amount is shown in the highlight color; anything else is a muted time. */
  trailing: { amount: string } | { time: string };
};

// Example rows, consistent with the rest of the page (20% of a $39 plan = $7.80).
const FEED: Record<HomeAudience, { title: string; label: string; rows: Row[] }> = {
  creators: {
    title: "Your activity",
    label: "A live activity feed: new subscribers, clicks, renewals and payouts from creators' links.",
    rows: [
      {
        icon: "tiktok",
        title: "New subscriber via your TikTok link",
        description: "Pro Monthly, renews every month while they stay subscribed.",
        source: "Lexi Notes · tiktok-bio",
        trailing: { amount: "+$7.80" },
      },
      {
        icon: "boostlink",
        title: "Payout sent to your bank",
        description: "$124.40 is on its way and arrives in 1–2 days.",
        source: "boostlink · payouts",
        trailing: { time: "Today" },
      },
      {
        icon: "instagram",
        title: "New click from your Instagram bio",
        description: "Someone opened your link and landed on the app.",
        source: "Lexi Notes · instagram-bio",
        trailing: { time: "2m ago" },
      },
      {
        icon: "youtube",
        title: "Renewal from YouTube · Video 1",
        description: "A customer you brought in paid again this month.",
        source: "Lexi Notes · video-1",
        trailing: { amount: "+$7.80" },
      },
    ],
  },
  apps: {
    title: "Your app's activity",
    label: "A live activity feed: new paying customers, creators joining and renewals.",
    rows: [
      {
        icon: "tiktok",
        title: "New paying customer from a TikTok creator",
        description: "Pro Monthly. You pay commission only because they paid.",
        source: "@maya.creates · TikTok",
        trailing: { amount: "+$39.00" },
      },
      {
        icon: "instagram",
        title: "A creator joined your offer",
        description: "They will promote your app on Instagram.",
        source: "@leo.builds · Instagram",
        trailing: { time: "now" },
      },
      {
        icon: "youtube",
        title: "Renewal from a YouTube creator's customer",
        description: "The customer stayed another month.",
        source: "@zara.studies · YouTube",
        trailing: { amount: "+$39.00" },
      },
      {
        icon: "app",
        title: "34 paying customers this month",
        description: "Brought in by 12 creators across 3 platforms.",
        source: "Your app · October",
        trailing: { time: "Today" },
      },
    ],
  },
};

/** The hero's key phrase color: black on a yellow marker in light, yellow letters in dark. */
const KEY_PHRASE = "rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary";

function RowIcon({ icon }: { icon: Row["icon"] }) {
  if (icon === "boostlink") {
    return (
      <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-primary">
        <LogoMark className="size-4 fill-primary-foreground" />
      </span>
    );
  }
  if (icon === "app") return <GenericAppIcon className="size-[30px]" />;
  return (
    <PlatformLogoTile
      platform={icon}
      size={30}
      className={cn("rounded-[9px]", icon === "tiktok" && "border border-white/20")}
    />
  );
}

function FeedRow({ row, latest }: { row: Row; latest: boolean }) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-[14px] border px-3 py-2.5",
        latest ? "border-primary bg-foreground/[0.04]" : "border-transparent",
      )}
    >
      <RowIcon icon={row.icon} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-bold">{row.title}</span>
        <span className="truncate text-xs text-muted-foreground">{row.description}</span>
        <span className="mt-1 truncate text-[11px] text-muted-foreground/80">{row.source}</span>
      </span>
      {"amount" in row.trailing ? (
        <span className={cn(KEY_PHRASE, "shrink-0 text-[13px] font-bold")}>{row.trailing.amount}</span>
      ) : (
        <span className="shrink-0 text-[11px] text-muted-foreground">{row.trailing.time}</span>
      )}
    </li>
  );
}

const FLAT = { rotateX: 0, rotateY: 0, rotateZ: 0, y: 0 };

/**
 * The New era graphic: an activity feed built from the app's own UI pieces,
 * tilted towards the text and flattening as the section scrolls into view
 * (flat with reduced motion). The box fades out at the bottom and the outer
 * side with a mask; scaled down below lg, where it runs edge to edge.
 */
export function NewEraFeed({ audience }: { audience: HomeAudience }) {
  const feed = FEED[audience];
  const box = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  // 0 when the box's top meets the bottom of the viewport, 1 when its middle reaches the middle.
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [26, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], [-7, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [24, 0]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={feed.label}
      className="relative -mx-4 h-[330px] justify-self-stretch sm:-mx-6 lg:col-start-1 lg:row-start-1 lg:mx-0 lg:h-[440px]"
    >
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center overflow-hidden [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,black_60%,transparent),linear-gradient(to_right,black_72%,transparent)] lg:[mask-image:linear-gradient(to_bottom,black_60%,transparent),linear-gradient(to_left,black_72%,transparent)]"
      >
        <div className="scale-[0.72] sm:scale-[0.8] lg:scale-100">
          <motion.div
            style={{ ...(reducedMotion ? FLAT : { rotateX, rotateY, rotateZ, y }), transformPerspective: 1400 }}
            className="flex w-[460px] flex-col gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 rounded-[16px] border bg-card px-4 py-3">
              <span className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground">
                <Activity className="size-4" />
              </span>
              <span className="flex-1 text-sm font-bold">{feed.title}</span>
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold">
                <span className="size-1.5 rounded-full bg-primary" />
                Live
              </span>
            </div>
            <ul className="flex flex-col gap-1 rounded-[20px] border bg-card p-2">
              {feed.rows.map((row, index) => (
                <FeedRow key={row.title} row={row} latest={index === 0} />
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
