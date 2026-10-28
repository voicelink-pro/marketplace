import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { scrollerClassName } from "@/modules/catalog/components/scroller";
import type { CreatorProgramSummary } from "../../queries";
import { CopyValueButton } from "../copy-value-button";
import { HideGetStarted } from "./get-started-hide";
import { hideScript, type SetupDone, skipScript } from "./home-data";
import { ClickIllustration, JoinIllustration, LinkIllustration, SocialIllustration } from "./illustrations";

type StepId = keyof SetupDone;

type Step = {
  id: StepId;
  title: string;
  description: string;
  illustration: React.ReactNode;
  /** Flat tint of the illustration while the step is open. */
  tint: string;
  /** What to do while open: a link, or copying the first program's link. */
  action: { label: string; href: string } | { label: string; copy: string };
  /** Text link once done. */
  doneLink: { label: string; href: string };
};

function stepsFor(done: SetupDone, programs: CreatorProgramSummary[], host: string): Step[] {
  const first = programs[0];
  const firstLink = first?.defaultLink?.shareUrl;
  return [
    {
      id: "social",
      title: "Add a social profile",
      description: done.social ? "Companies see where you post." : "Show companies where you post.",
      illustration: <SocialIllustration />,
      tint: "bg-primary/15",
      action: { label: "Add a profile", href: "/creator/settings" },
      doneLink: { label: "View profiles", href: "/creator/settings" },
    },
    {
      id: "join",
      title: "Join your first program",
      description: first
        ? `You promote ${first.appName}${programs.length > 1 ? ` and ${programs.length - 1} more` : ""}.`
        : "Pick an app and get your link and code.",
      illustration: <JoinIllustration programs={programs} />,
      tint: "bg-primary/15",
      action: { label: "Find an app", href: "/creator/discover" },
      doneLink: { label: "Find another app", href: "/creator/discover" },
    },
    {
      id: "link",
      title: "Create a link for each channel",
      description: "See which place brings you paying customers.",
      illustration: <LinkIllustration host={host} />,
      tint: "bg-side-apps/20",
      action: { label: "Create link", href: "/creator/links" },
      doneLink: { label: "View links", href: "/creator/links" },
    },
    {
      id: "click",
      title: "Get your first click",
      description: done.click
        ? "Your links are getting clicks."
        : "Put your link in your bio or a video description.",
      illustration: <ClickIllustration />,
      tint: "bg-side-creators/20",
      // Nothing to copy before joining a program.
      action: firstLink
        ? { label: "Copy your link", copy: firstLink }
        : { label: "Join a program first", href: "/creator/discover" },
      doneLink: { label: "See customers", href: "/creator/referrals" },
    },
  ];
}

function StepAction({ step, primary }: { step: Step; primary: boolean }) {
  const className = "h-10 self-start rounded-full px-[18px] text-sm font-bold";
  if ("copy" in step.action) {
    return (
      <CopyValueButton
        value={step.action.copy}
        label={step.action.label}
        copiedLabel="Link copied"
        toastMessage="Referral link copied. Put it in your bio or a video description."
        variant={primary ? "default" : "outline"}
        size="default"
        className={className}
      />
    );
  }
  return (
    <Button asChild variant={primary ? "default" : "outline"} className={className}>
      <Link href={step.action.href}>{step.action.label}</Link>
    </Button>
  );
}

const CARD = "flex w-full flex-col rounded-[20px] border bg-card p-2";
const ILLUSTRATION = "relative h-43 overflow-hidden rounded-[14px]";
const BODY = "flex flex-1 flex-col gap-1.5 px-3 pt-4 pb-3";
const LIST = cn(
  scrollerClassName,
  "-mx-4 scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6",
  "md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4",
);
const ITEM = "flex w-68 shrink-0 snap-start md:w-auto";

function StepCard({ step, done, primary }: { step: Step; done: boolean; primary: boolean }) {
  return (
    <article className={CARD}>
      <div className={cn(ILLUSTRATION, done ? "bg-muted" : step.tint)}>
        {step.illustration}
        {done ? (
          <span className="absolute top-3 left-3 inline-flex h-6.5 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground">
            <Check aria-hidden className="size-3.5" strokeWidth={3} />
            Done
          </span>
        ) : null}
      </div>
      <div className={BODY}>
        <h3 className={cn("text-[17px] leading-6 tracking-[-0.01em]", done && "text-muted-foreground")}>{step.title}</h3>
        <p className="text-sm leading-5 text-muted-foreground">{step.description}</p>
        <div className="min-h-3.5 flex-1" />
        {done ? (
          <Link
            href={step.doneLink.href}
            className="inline-flex h-10 items-center gap-1 self-start rounded-md text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {step.doneLink.label}
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        ) : (
          <StepAction step={step} primary={primary} />
        )}
      </div>
    </article>
  );
}

/** Track and progress arc on a 44px ring. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const circumference = 2 * Math.PI * 18;
  return (
    <svg viewBox="0 0 44 44" aria-hidden className="size-10 shrink-0 sm:size-11">
      <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" className="stroke-muted" />
      {done > 0 ? (
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(done / total) * circumference} ${circumference}`}
          transform="rotate(-90 22 22)"
          className="stroke-primary"
        />
      ) : null}
    </svg>
  );
}

/**
 * Get started: one card per step, open steps first, done ones last. Only the
 * first open step gets the yellow button. Render it only while a step is open.
 * Phones scroll the cards sideways; md shows two columns, xl four.
 */
export function GetStarted({
  done,
  programs,
  host,
  storageKey,
}: {
  done: SetupDone;
  programs: CreatorProgramSummary[];
  host: string;
  storageKey: string;
}) {
  const steps = stepsFor(done, programs, host);
  const ordered = [...steps.filter((step) => !done[step.id]), ...steps.filter((step) => done[step.id])];
  const doneCount = steps.length - steps.filter((step) => !done[step.id]).length;
  const firstOpen = ordered.find((step) => !done[step.id])?.id;

  return (
    <>
      {/* Parsed with the streamed HTML, so it runs before the section shows; React never renders it as a script. */}
      <div hidden dangerouslySetInnerHTML={{ __html: `<script>${hideScript(storageKey)}</script>` }} />
      {/* The class spells out HIDDEN_ATTRIBUTE: Tailwind needs the literal selector. */}
      <section aria-labelledby="get-started-heading" className="flex flex-col gap-4 [[data-hide-get-started]_&]:hidden">
        <div className="flex items-center gap-3.5">
          <ProgressRing done={doneCount} total={steps.length} />
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 id="get-started-heading" className="text-lg sm:text-xl">
              Get started
            </h2>
            <span className="text-[13px] text-muted-foreground sm:text-sm">
              {doneCount} of {steps.length} done
            </span>
          </div>
          <HideGetStarted storageKey={storageKey} />
        </div>
        <ul className={LIST}>
          {ordered.map((step) => (
            <li key={step.id} className={ITEM}>
              <StepCard step={step} done={done[step.id]} primary={step.id === firstOpen} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * Placeholder with the section's boxes: the ring row and four cards. Hidden before
 * paint when this browser's last viewer had nothing to show (SKIP_ATTRIBUTE,
 * spelled out in the class for Tailwind).
 */
export function GetStartedSkeleton() {
  return (
    <>
      <div hidden dangerouslySetInnerHTML={{ __html: `<script>${skipScript()}</script>` }} />
      <div aria-busy="true" className="flex flex-col gap-4 [[data-skip-get-started]_&]:hidden">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-10 shrink-0 rounded-full sm:size-11" />
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="flex h-7 items-center">
              <Skeleton className="h-5 w-28" />
            </span>
            <span className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-16" />
            </span>
          </div>
          <Skeleton className="size-10 rounded-full sm:h-9 sm:w-20" />
        </div>
        <ul className={LIST}>
          {[0, 1, 2, 3].map((index) => (
            <li key={index} className={ITEM}>
              <div className={CARD}>
                <Skeleton className={ILLUSTRATION} />
                <div className={BODY}>
                  {/* Two title lines in four columns, where the longest titles wrap. */}
                  <span className="flex h-6 flex-col justify-around xl:h-12">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="hidden h-4 w-1/2 xl:block" />
                  </span>
                  <span className="flex h-10 flex-col justify-around">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/5" />
                  </span>
                  <div className="min-h-3.5 flex-1" />
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
