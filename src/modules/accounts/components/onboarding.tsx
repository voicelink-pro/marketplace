import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEP_COUNT = 2;

/** Card around an onboarding form; the role cards on /onboarding share its shape. */
export const ONBOARDING_CARD = "rounded-[20px] border bg-card p-6 sm:p-8";

/** "Step n of 2" with one bar per step; done and current bars are yellow. */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <span
            key={index}
            className={cn("h-1.5 w-6 rounded-full", index < step ? "bg-primary" : "bg-foreground/15")}
          />
        ))}
      </span>
      <span className="text-sm font-semibold text-muted-foreground">
        Step {step} of {STEP_COUNT}
      </span>
    </div>
  );
}

/** Page heading of an onboarding step, with an optional "Back" link above it. */
export function OnboardingIntro({
  step,
  title,
  description,
  backHref,
}: {
  step: number;
  title: string;
  description: string;
  backHref?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 rounded-full text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back
        </Link>
      ) : null}
      <StepIndicator step={step} />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-extrabold tracking-[-0.04em] text-balance sm:text-4xl">{title}</h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">{description}</p>
      </div>
    </div>
  );
}
