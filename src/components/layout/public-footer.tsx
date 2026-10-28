import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import type { HomeSection } from "@/modules/catalog/components/home-section-link";
import { AudienceSectionLink } from "./audience-section-link";

// `section` links scroll within the home page. A Legal column (Terms, Privacy,
// Cookies, Imprint) returns when those pages exist.
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
      { label: "Support", href: "/support" },
    ],
  },
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
  return (
    <Link href={link.href} className={linkClassName}>
      {link.label}
    </Link>
  );
}

/**
 * Public footer: logo and tagline, two link columns (side by side on phones
 * too), then the copyright. Social links return when the profiles exist.
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
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-16 lg:gap-x-24">
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

        <div className="border-t py-6 text-sm text-muted-foreground">
          <p>© 2026 {siteConfig.name}</p>
        </div>
      </div>
    </footer>
  );
}
