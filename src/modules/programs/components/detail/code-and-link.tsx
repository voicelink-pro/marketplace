import type { CreatorProgramSummary } from "../../queries";
import { CopyValueButton } from "../copy-value-button";
import { CardTitle, HomeCard } from "../home/card";
import { displayUrl, hostOf } from "../links/link-data";

const INSET = "flex min-w-0 flex-col gap-2 rounded-2xl border bg-background p-4";

/** The referral code for app-store installs and the primary link for everything else. */
export function CodeAndLink({ program }: { program: CreatorProgramSummary }) {
  const link = program.defaultLink;
  return (
    <HomeCard titleId="code-link-heading">
      <CardTitle id="code-link-heading">Your code and link</CardTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_3fr]">
        <div className={INSET}>
          <span className="text-xs font-semibold text-muted-foreground">Referral code</span>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate font-mono text-lg font-bold">{program.referralCode}</span>
            <CopyValueButton
              value={program.referralCode}
              size="icon"
              variant="secondary"
              ariaLabel={`Copy ${program.appName} code`}
              toastMessage="Referral code copied."
              className="shrink-0"
            />
          </div>
          <span className="text-xs leading-snug text-muted-foreground">
            For mobile installs: viewers type it when they sign up.
          </span>
        </div>
        {link ? (
          <div className={INSET}>
            <span className="text-xs font-semibold text-muted-foreground">Primary link</span>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <span className="line-clamp-2 min-w-0 pt-2 font-mono text-sm font-semibold break-all">
                {displayUrl(link.shareUrl)}
              </span>
              <CopyValueButton
                value={link.shareUrl}
                size="icon"
                variant="secondary"
                ariaLabel={`Copy ${program.appName} link`}
                toastMessage="Referral link copied."
                className="shrink-0"
              />
            </div>
            <span className="truncate text-xs leading-snug text-muted-foreground">
              Opens {hostOf(link.targetUrl) ?? link.destinationLabel}
            </span>
          </div>
        ) : null}
      </div>
    </HomeCard>
  );
}
