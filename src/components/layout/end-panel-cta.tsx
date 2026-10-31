"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { cn } from "@/lib/utils";
import { CTA_SIZE, PRIMARY_CTA_ARROW } from "@/modules/catalog/components/cta-styles";
import { HERO_CONTENT } from "@/modules/catalog/components/home-hero-content";
import { HomeSectionLink } from "@/modules/catalog/components/home-section-link";

const PRIMARY = cn(CTA_SIZE, "group/cta bg-[#111111] text-white hover:bg-[#111111]/85");
const SECONDARY = cn(CTA_SIZE, "bg-black/10 text-[#111111] hover:bg-black/[0.16]");

/**
 * The end panel's heading and two buttons. Apps (`/for-apps`): "List your app",
 * the hero's target (sign-up first without a session), and "How it works".
 * Everywhere else: "Start here for free" to sign-up and "Discover programs".
 */
export function EndPanelCtaView({ apps, signedIn }: { apps: boolean; signedIn: boolean }) {
  const listApp = HERO_CONTENT.apps.primary;
  const primary = apps
    ? { label: listApp.label, href: (!signedIn && listApp.signedOutHref) || listApp.href }
    : { label: "Start here for free", href: HERO_CONTENT.creators.primary.href };

  return (
    <div className="relative flex flex-col items-center gap-8 text-center sm:gap-10">
      <h2 className="max-w-3xl text-[40px] leading-[1.02] font-extrabold tracking-[-0.045em] text-balance text-[#111111] lg:text-[64px]">
        {apps ? "Ready to grow your app?" : "Ready to start earning?"}
      </h2>
      <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="lg" className={PRIMARY}>
          <Link href={primary.href}>
            {primary.label}
            <LinkPendingIcon aria-hidden className={PRIMARY_CTA_ARROW} />
          </Link>
        </Button>
        <Button asChild size="lg" className={SECONDARY}>
          <HomeSectionLink section={apps ? "how-it-works" : "offers"}>
            {apps ? "How it works" : "Discover programs"}
          </HomeSectionLink>
        </Button>
      </div>
    </div>
  );
}

/** Picks the variant from the pathname, which suspends on routes with unresolved params (never `/for-apps`). */
export function EndPanelCta({ signedIn }: { signedIn: boolean }) {
  return <EndPanelCtaView apps={usePathname() === "/for-apps"} signedIn={signedIn} />;
}

/** The current year; on the client, since the prerendered shell can't read the clock. */
export function CopyrightYear() {
  return <>{new Date().getFullYear()}</>;
}
