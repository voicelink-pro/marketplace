import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import type { HomeSection } from "@/modules/catalog/components/home-section-link";
import { PLATFORM_PATHS } from "@/modules/catalog/components/platform-logos";
import { AudienceSectionLink } from "./audience-section-link";

// "#" marks links whose pages don't exist yet; `section` links scroll within the home page.
const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Discover apps", section: "offers" },
      { label: "For creators", href: "/?for=creators" },
      { label: "For apps", href: "/?for=apps" },
      { label: "List your app", href: "/onboarding/company" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", section: "how-it-works" },
      { label: "FAQ", href: "#" },
      { label: "Help center", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Cookies", href: "#" },
      { label: "Imprint", href: "#" },
    ],
  },
] as const;

const SOCIALS = [
  { label: "Instagram", path: PLATFORM_PATHS.instagram },
  { label: "TikTok", path: PLATFORM_PATHS.tiktok },
  { label: "YouTube", path: PLATFORM_PATHS.youtube },
  { label: "X", path: PLATFORM_PATHS.x },
] as const;

const linkClassName =
  "rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

function FooterLink(link: { label: string; href: string } | { label: string; section: HomeSection }) {
  if ("section" in link) {
    return (
      <AudienceSectionLink section={link.section} className={linkClassName}>
        {link.label}
      </AudienceSectionLink>
    );
  }
  const { label, href } = link;
  return href === "#" ? (
    <a href={href} className={linkClassName}>
      {label}
    </a>
  ) : (
    <Link href={href} className={linkClassName}>
      {label}
    </Link>
  );
}

/**
 * Public footer: logo and tagline, three link columns (2×2 on phones), then
 * the copyright and social links. Social profiles don't exist yet ("#").
 */
export function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 py-12 md:flex-row md:justify-between md:gap-16 md:py-16">
          <div className="flex flex-col gap-3">
            <Logo className="self-start" />
            <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-16 lg:gap-x-24">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <ul className="flex flex-col gap-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {siteConfig.name}</p>
          {/* Negative margin lines the glyphs, not their hit areas, up with the text edge. */}
          <ul aria-label="Social media" className="-ml-2.5 flex items-center gap-1 sm:-mr-2.5 sm:ml-0">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href="#"
                  aria-label={social.label}
                  className="grid size-9 place-items-center rounded-full transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
                    <path d={social.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
