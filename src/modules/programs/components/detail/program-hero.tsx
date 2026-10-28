import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCommissionRange } from "@/lib/money";
import { APP_CATEGORY_LABELS, APP_PLATFORM_LABELS } from "@/modules/catalog/constants";
import type { CreatorProgramSummary } from "../../queries";
import { CopyValueButton } from "../copy-value-button";
import { HOME_CARD } from "../home/card";
import { ProgramCover } from "../program-cover";

/** The program's cover, name and terms at a glance; the page's only h1. */
export function ProgramHero({ program }: { program: CreatorProgramSummary }) {
  const details = [
    program.organizationName,
    ...program.categories.map((category) => APP_CATEGORY_LABELS[category]),
    ...program.platforms.map((platform) => APP_PLATFORM_LABELS[platform]),
  ];
  const link = program.defaultLink?.shareUrl;
  return (
    <section aria-labelledby="program-heading" className={`${HOME_CARD} overflow-hidden`}>
      <ProgramCover program={program} size="hero" />
      <div className="flex flex-col gap-4 px-5 pt-11 pb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-7 sm:pb-6">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 id="program-heading" className="text-3xl font-extrabold tracking-[-0.035em]">
              {program.appName}
            </h1>
            <span className="tabular inline-flex h-7 items-center rounded-full bg-primary px-3 text-[13px] font-bold whitespace-nowrap text-primary-foreground">
              {formatCommissionRange(program.minCommissionBps, program.maxCommissionBps)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-11 px-[18px]">
            <Link href={`/apps/${program.slug}`}>
              Public listing
              <ExternalLink data-icon="inline-end" />
            </Link>
          </Button>
          {link ? (
            <CopyValueButton
              value={link}
              label="Copy link"
              variant="default"
              size="default"
              ariaLabel={`Copy your ${program.appName} link`}
              toastMessage="Referral link copied."
              className="h-11 px-5"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
