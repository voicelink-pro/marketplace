import { Megaphone, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/layout/panel-shell";
import { Badge } from "@/components/ui/badge";
import { LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ONBOARDING_CARD, OnboardingIntro } from "@/modules/accounts/components/onboarding";
import { requireViewer } from "@/modules/accounts/viewer";
import { safeRedirectPath } from "@/modules/auth/redirect";
import { CardGlow } from "@/modules/catalog/components/card-glow";

export const metadata: Metadata = { title: "Choose how you'll use your account" };

async function ContextChoices({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, params] = await Promise.all([requireViewer("/onboarding"), searchParams]);
  const rawNext = typeof params.next === "string" ? params.next : "";
  const safeNext = rawNext ? safeRedirectPath(rawNext, "") : "";
  const creatorReady = (viewer.creator?.socialLinkCount ?? 0) > 0;
  const creatorHref = creatorReady
    ? safeNext || "/creator"
    : safeNext
      ? `/onboarding/creator?next=${encodeURIComponent(safeNext)}`
      : "/onboarding/creator";

  const choices = [
    {
      href: creatorHref,
      icon: Megaphone,
      title: "Promote apps",
      description:
        "Share apps with your audience using your own links and codes, and earn recurring commission.",
      active: creatorReady,
      nextStep: creatorReady ? "Open creator workspace" : "Next: add your social profile",
    },
    {
      href: viewer.organizations.length > 0 ? "/company" : "/onboarding/company",
      icon: Store,
      title: "List your app",
      description:
        "Offer creators a commission on the subscriptions they bring you. Creators join your program without manual approval.",
      active: viewer.organizations.length > 0,
      nextStep: viewer.organizations.length > 0 ? "Open company workspace" : "Next: name your company",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {choices.map(({ href, icon: Icon, title, description, active, nextStep }) => (
        // The wrapper lifts so the pointer glow moves with the card.
        <div
          key={href}
          className="group/role relative flex rounded-[20px] transition-transform duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:has-focus-visible:-translate-y-0.5"
        >
          <CardGlow />
          <Link
            href={href}
            className={cn(
              ONBOARDING_CARD,
              "flex w-full flex-col gap-4 outline-none transition-colors duration-300 ease-out group-hover/role:border-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-primary">
                <Icon aria-hidden className="size-6 text-primary-foreground" />
              </span>
              {active ? <Badge variant="secondary">Ready</Badge> : null}
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="text-xl font-bold tracking-[-0.02em]">{title}</span>
              <span className="text-sm text-pretty text-muted-foreground">{description}</span>
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold">
              {nextStep}
              <LinkPendingIcon
                aria-hidden
                className="size-4 transition-transform duration-300 ease-out motion-safe:group-hover/role:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <div className="flex flex-col gap-8">
      <OnboardingIntro
        step={1}
        title={`How will you use ${siteConfig.name}?`}
        description="You can do both with one account and switch between them at any time."
      />
      <Suspense fallback={<PanelSkeleton />}>
        <ContextChoices searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
