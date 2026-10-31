import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand/logo";
import { LinkPendingSpinner } from "@/components/ui/link-pending-icon";
import { type SocialNetwork, siteConfig } from "@/config/site";
import { getViewer } from "@/modules/accounts/viewer";
import { HomeSectionLink } from "@/modules/catalog/components/home-section-link";
import { PLATFORM_PATHS } from "@/modules/catalog/components/platform-logos";
import { CopyrightYear, EndPanelCta, EndPanelCtaView } from "./end-panel-cta";

/** Simple Icons (CC0) marks, monochrome. LinkedIn isn't among the catalog's platform logos. */
const SOCIAL: Record<SocialNetwork, { label: string; path: string }> = {
  tiktok: { label: "TikTok", path: PLATFORM_PATHS.tiktok },
  x: { label: "X", path: PLATFORM_PATHS.x },
  instagram: { label: "Instagram", path: PLATFORM_PATHS.instagram },
  youtube: { label: "YouTube", path: PLATFORM_PATHS.youtube },
  linkedin: {
    label: "LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
};

const LINK = "rounded-sm text-sm text-black/65 transition-colors outline-none hover:text-black focus-visible:ring-3 focus-visible:ring-ring/50";

// TODO: Terms, Privacy and Imprint pages don't exist yet; they link to `#` until they do.
const LEGAL = ["Terms", "Privacy", "Imprint"];

/** Reads the session, so it streams in; the static shell shows the signed-out creators variant. */
async function SignedInCta() {
  const viewer = await getViewer();
  return <EndPanelCta signedIn={viewer !== null} />;
}

/**
 * The public pages' footer: a light gray "Ready to …" end panel, the only light
 * surface on the site. Two pieces of the yellow "b" in the top corners, the
 * heading and two buttons (apps variant on `/for-apps`), then social icons
 * (only networks with a URL in `siteConfig.social`), links and the copyright.
 * Everything stacks centered on phones.
 */
export function PublicFooter() {
  const socials = (Object.keys(SOCIAL) as SocialNetwork[]).filter((network) => siteConfig.social[network]);

  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="relative overflow-hidden rounded-t-[40px] bg-[#D4D4D0] px-6 pt-24 pb-8 text-[#111111] sm:px-10 lg:pt-[120px] lg:pb-10">
        {/* Cropped so they still read as a "b": the stem enters from the top edge, the bowl with its counter
            below it. Left: most of the letter; right: the stem and the top of the bowl, cut by the edge. */}
        <LogoMark className="pointer-events-none absolute -top-8 -left-2 size-32 rotate-[-12deg] sm:-top-12 sm:-left-3 sm:size-60 lg:-top-10 lg:-left-4 lg:size-64" />
        <LogoMark className="pointer-events-none absolute -top-10 -right-12 size-32 rotate-[12deg] sm:-top-16 sm:-right-24 sm:size-60 lg:-top-16 lg:-right-24 lg:size-64" />

        <Suspense fallback={<EndPanelCtaView apps={false} signedIn={false} />}>
          <SignedInCta />
        </Suspense>

        <div className="relative mt-20 flex flex-col items-center gap-6 border-t border-black/10 pt-8 md:flex-row md:items-start md:justify-between">
          {socials.length > 0 ? (
            <ul className="flex items-center gap-4">
              {socials.map((network) => (
                <li key={network}>
                  <a
                    href={siteConfig.social[network]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${siteConfig.name} on ${SOCIAL[network].label}`}
                    className="block rounded-sm text-black/65 transition-colors outline-none hover:text-black focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
                      <path d={SOCIAL[network].path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span aria-hidden className="max-md:hidden" />
          )}

          <div className="flex flex-col items-center gap-3 md:items-end">
            <nav aria-label="Footer">
              <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-end">
                <li>
                  <Link href="/" className={LINK}>
                    For creators
                    <LinkPendingSpinner className="ml-1 align-[-2px]" />
                  </Link>
                </li>
                <li>
                  <Link href="/for-apps" className={LINK}>
                    For apps
                    <LinkPendingSpinner className="ml-1 align-[-2px]" />
                  </Link>
                </li>
                <li>
                  <HomeSectionLink section="pricing" className={LINK}>
                    Pricing
                  </HomeSectionLink>
                </li>
                {LEGAL.map((label) => (
                  <li key={label}>
                    <a href="#" className={LINK}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="text-xs text-black/60">
              © <CopyrightYear /> {siteConfig.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
