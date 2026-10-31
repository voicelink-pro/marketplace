import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { cn } from "@/lib/utils";
import { PRIMARY_CTA, PRIMARY_CTA_ARROW } from "./cta-styles";

/**
 * The hero's primary button, used by every yellow CTA on the home pages: 52px
 * brand-yellow pill, arrow (a spinner while the next page loads), hover lift
 * and sheen. `className` only places it.
 */
export function PrimaryCta({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Button asChild size="lg" className={cn(PRIMARY_CTA, className)}>
      <Link href={href}>
        {children}
        <LinkPendingIcon aria-hidden className={PRIMARY_CTA_ARROW} />
      </Link>
    </Button>
  );
}
