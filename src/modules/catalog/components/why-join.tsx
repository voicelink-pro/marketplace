import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_CONTENT } from "./home-hero-content";
import { PrimaryCta } from "./primary-cta";

/** The hero's key phrase color: yellow letters. */
const KEY_PHRASE = "text-primary";

type Side = { title: string; items: [string, string, string, string] };

const CONTENT: {
  eyebrow: string;
  /** `phrase` gets the key-phrase marker. */
  heading: { before: string; phrase: string; after: string };
  subtitle: string;
  old: Side;
  new: Side;
} = {
  eyebrow: "Why apps join",
  heading: { before: "Grow organically. ", phrase: "Pay only for results", after: "." },
  subtitle:
    "Creators post native content to audiences that already trust them. No upfront fees, no ad budget, no paying for clicks that go nowhere.",
  old: {
    title: "Ads & agencies",
    items: ["Budget paid upfront", "Pay for clicks and views", "Ads people scroll past", "No customers, still billed"],
  },
  new: {
    title: "With boostlink",
    items: ["$0 upfront", "Pay per paying customer", "Organic posts people trust", "No customer, no cost"],
  },
};

const CARD = "flex flex-1 flex-col gap-[18px] rounded-3xl border p-7";
const ITEM = "flex items-center gap-3 text-base font-semibold lg:whitespace-nowrap";
const MARKER = "grid size-6 shrink-0 place-items-center rounded-full";

/**
 * "Why apps join" on the apps home page, as one argument: the old way next to boostlink. Heading, subtitle
 * and the hero's primary CTA on the left; the two cards with "vs" between them
 * on the right (side by side from xl, cards under the heading at lg). Below lg
 * the boostlink card comes first and the "vs" is dropped; on phones the CTA
 * moves below the cards, full width. Each card is a
 * heading with a list, so screen readers get both sides in order.
 */
export function WhyJoin({ signedIn = false }: { signedIn?: boolean }) {
  const content = CONTENT;
  const cta = HERO_CONTENT.apps.primary;
  const ctaHref = (!signedIn && cta.signedOutHref) || cta.href;
  const ctaButton = (className: string) => (
    <PrimaryCta href={ctaHref} className={className}>
      {cta.label}
    </PrimaryCta>
  );

  return (
    <section
      aria-labelledby="why-join-heading"
      className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_700px] xl:items-center xl:gap-16"
    >
      <div className="flex flex-col items-start gap-4 sm:gap-5">
        <span className={cn(KEY_PHRASE, "text-[13px] font-bold")}>{content.eyebrow}</span>
        <h2
          id="why-join-heading"
          className="text-[36px] leading-[1.02] font-extrabold tracking-[-0.045em] text-balance sm:text-5xl lg:text-[52px]"
        >
          {content.heading.before}
          <span className={KEY_PHRASE}>{content.heading.phrase}</span>
          {content.heading.after}
        </h2>
        <p className="max-w-[460px] text-base text-pretty text-muted-foreground sm:text-lg">{content.subtitle}</p>
        {/* Under the heading from sm; on phones it moves below the cards. */}
        {ctaButton("mt-2 max-sm:hidden")}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {/* The old way: struck through and muted. */}
        <div className={cn(CARD, "bg-[#121212]")}>
          <h3 className="text-[15px] font-bold text-muted-foreground/70">{content.old.title}</h3>
          <ul className="flex flex-col gap-3.5">
            {content.old.items.map((item) => (
              <li key={item} className={cn(ITEM, "text-muted-foreground")}>
                <span aria-hidden className={cn(MARKER, "bg-muted")}>
                  <X className="size-3" strokeWidth={3} />
                </span>
                <span className="line-through decoration-gray-600 decoration-[1.5px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <span
          aria-hidden
          className="hidden size-11 shrink-0 place-items-center self-center rounded-full border bg-background text-xs font-extrabold text-muted-foreground lg:grid"
        >
          vs
        </span>

        {/* boostlink: first on phones and tablets. */}
        <div className={cn(CARD, "bg-card max-lg:order-first")}>
          <h3 className="text-[15px] font-bold text-primary-ink">{content.new.title}</h3>
          <ul className="flex flex-col gap-3.5">
            {content.new.items.map((item) => (
              <li key={item} className={cn(ITEM, "text-foreground")}>
                <span aria-hidden className={cn(MARKER, "bg-primary text-[#111111]")}>
                  <Check className="size-[13px]" strokeWidth={3.2} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {ctaButton("sm:hidden")}
    </section>
  );
}
