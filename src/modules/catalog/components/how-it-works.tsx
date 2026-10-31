import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type { HomeAudience } from "../audience";
import { PrimaryCta } from "./primary-cta";
import {
  CommissionScene,
  CreatorsJoinScene,
  PayingScene,
  PickAppScene,
  RenewalScene,
  ShareLinkScene,
} from "./how-it-works-scenes";

type Step = {
  title: string;
  body: string;
  Scene: () => React.ReactNode;
};

const CONTENT: Record<
  HomeAudience,
  {
    heading: string;
    /** None on the creators page. */
    subtitle?: string;
    steps: [Step, Step, Step];
    /**
     * Same targets as the hero's primary CTA; `signedOutHref` replaces `href` for visitors without a session.
     * None on the creators page, where the calculator right below closes with the same button.
     */
    cta?: { href: string; signedOutHref?: string; label: string };
  }
> = {
  creators: {
    heading: "Three steps to your first commission",
    steps: [
      {
        title: "Pick an app to promote",
        body: "Browse the catalog and choose an app with a commission that suits you.",
        Scene: PickAppScene,
      },
      {
        title: "Share your link anywhere",
        body: "Get your link and code instantly. Post them wherever your audience is.",
        Scene: ShareLinkScene,
      },
      {
        title: "Earn on every renewal",
        body: "Get paid each month your referrals stay subscribed.",
        Scene: RenewalScene,
      },
    ],
  },
  apps: {
    heading: "Three steps to paying customers",
    subtitle: "List your app, let creators bring their audience, and pay only when customers pay.",
    steps: [
      {
        title: "Set your commission",
        body: "List your app, add your plans and choose what creators earn on each one.",
        Scene: CommissionScene,
      },
      {
        title: "Creators discover and share it",
        body: "Creators who like your app join your program and post about it.",
        Scene: CreatorsJoinScene,
      },
      {
        title: "Pay only for paying subscribers",
        body: "No upfront fees. Commission only when a referred customer pays.",
        Scene: PayingScene,
      },
    ],
    cta: {
      href: "/onboarding/company",
      signedOutHref: "/signup?for=apps&next=/onboarding/company",
      label: "List your app",
    },
  },
};

/** Between steps: down on phones and tablets; right on desktop, level with the illustrations' middle. */
function Connector() {
  return (
    <li aria-hidden className="flex justify-center py-6 text-muted-foreground lg:py-0 lg:pt-[136px]">
      <ChevronDown className="size-5 lg:hidden" />
      <ChevronRight className="hidden size-[22px] lg:block" />
    </li>
  );
}

/**
 * "How it works": a centered header, then the selected side's three steps,
 * each with a static illustration, and a CTA on the apps page. Steps sit in a
 * row from lg, in one centered column below that.
 */
export function HowItWorks({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const content = CONTENT[audience];
  const cta = content.cta;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="flex scroll-mt-36 flex-col items-center text-center lg:scroll-mt-20"
    >
      <div className="flex max-w-3xl flex-col items-center gap-3">
        {/* The hero's key phrase color. */}
        <span className="text-sm font-bold text-primary">
          How it works
        </span>
        {/* At least 24px on phones, where it may wrap (balanced); one line from sm, scaling
            with the viewport up to 36px, a step below the hero headline. */}
        <h2
          id="how-it-works-heading"
          className="text-[clamp(1.5rem,6.4vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.045em] text-balance sm:text-[clamp(1rem,5vw,2.25rem)] sm:whitespace-nowrap"
        >
          {content.heading}
        </h2>
        {content.subtitle ? (
          <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{content.subtitle}</p>
        ) : null}
      </div>

      <ol className="mt-8 flex flex-col items-center sm:mt-10 lg:grid lg:w-full lg:grid-cols-[1fr_3rem_1fr_3rem_1fr] lg:items-start lg:gap-x-3 xl:gap-x-0">
        {content.steps.map((step, index) => (
          <Fragment key={step.title}>
            {index > 0 ? <Connector /> : null}
            <li className="flex flex-col items-center">
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-full border bg-card text-[15px] font-bold"
              >
                {index + 1}
              </span>
              <div aria-hidden className="my-4 flex h-[190px] w-[280px] items-center justify-center">
                <step.Scene />
              </div>
              {/* One line from lg; the centered flex item overflows evenly if a title is wider than its column. */}
              <h3 className="text-xl font-bold tracking-[-0.02em] text-balance lg:whitespace-nowrap">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[300px] text-[15px] text-pretty text-muted-foreground">{step.body}</p>
            </li>
          </Fragment>
        ))}
      </ol>

      {/* The hero's primary button; a centered pill on phones too, under the centered steps. */}
      {cta ? (
        <PrimaryCta href={(!signedIn && cta.signedOutHref) || cta.href} className="mt-8 max-sm:w-auto">
          {cta.label}
        </PrimaryCta>
      ) : null}
    </section>
  );
}
