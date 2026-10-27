import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/modules/accounts/social";
import { CopyValueButton } from "./copy-value-button";

export type ReferralLinkCard = {
  id: string;
  label: string;
  isDefault: boolean;
  channel: SocialPlatform;
  shareUrl: string;
  targetUrl: string;
  destinationLabel: string;
  /** Set when the list mixes programs. */
  program?: { appName: string; appSlug: string };
};

/** Phone layout for referral link tables: full URL and a full-width copy button. */
export function ReferralLinkCards({ links, className }: { links: ReferralLinkCard[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {links.map((link) => (
        <li key={link.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3">
          {link.program ? (
            <Link
              href={`/creator/programs/${link.program.appSlug}`}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.program.appName}
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{link.label}</span>
            {link.isDefault ? <Badge variant="secondary">Primary</Badge> : null}
            <Badge variant="outline">{SOCIAL_PLATFORM_LABELS[link.channel]}</Badge>
          </div>
          <span className="font-mono text-xs break-all select-all">{link.shareUrl}</span>
          <a
            href={link.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Opens {link.destinationLabel}
            <ExternalLink aria-hidden className="size-3 shrink-0" />
          </a>
          <CopyValueButton
            value={link.shareUrl}
            label="Copy link"
            toastMessage={`Copied “${link.label}” link.`}
            ariaLabel={`Copy link for ${link.label}${link.program ? ` (${link.program.appName})` : ""}`}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
