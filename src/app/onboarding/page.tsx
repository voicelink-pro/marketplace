import { Megaphone, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/layout/panel-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireViewer } from "@/modules/accounts/viewer";
import { safeRedirectPath } from "@/modules/auth/redirect";

export const metadata: Metadata = { title: "Choose how you'll use the marketplace" };

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
    },
    {
      href: viewer.organizations.length > 0 ? "/company" : "/onboarding/company",
      icon: Store,
      title: "List your app",
      description:
        "Offer creators a commission on the subscriptions they bring you. Creators can join your program without manual approval.",
      active: viewer.organizations.length > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {choices.map(({ href, icon: Icon, title, description, active }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-muted">
                  <Icon aria-hidden className="size-5 text-primary" />
                </span>
                {active ? <Badge variant="secondary">Set up</Badge> : null}
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">How will you use the marketplace?</h1>
        <p className="text-muted-foreground">
          You can do both with one account and switch between them at any time.
        </p>
      </div>
      <Suspense fallback={<PanelSkeleton />}>
        <ContextChoices searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
