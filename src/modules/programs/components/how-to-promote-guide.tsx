import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CardHeading, HomeCard } from "./home/card";

/** Three steps as tiles; right after joining the card is ringed in yellow and says so. */
export function HowToPromoteGuide({
  appName,
  attributionWindowDays,
  highlighted = false,
}: {
  appName: string;
  attributionWindowDays: number;
  highlighted?: boolean;
}) {
  const steps = [
    {
      title: "Share your link",
      text: (
        <>
          Place your referral link in your bio, video description, or newsletter. Customers who sign up within{" "}
          <span className="tabular font-medium text-foreground">{attributionWindowDays} days</span> of clicking are
          attributed to you.
        </>
      ),
    },
    {
      title: "Mention your code",
      text: "For iOS and Android apps, viewers often install from the App Store or Google Play directly. Ask them to enter your referral code during sign-up so the referral is linked to you.",
    },
    {
      title: "Name each placement",
      text: "Create separate named links (like “Instagram bio”, “TikTok”, or “Video 1”) to compare which channel brings paying subscribers. You never need to upload or pre-approve your posts.",
    },
  ];
  return (
    <HomeCard titleId="promote-heading" className={cn(highlighted && "ring-2 ring-primary")}>
      <CardHeading
        id="promote-heading"
        title={`How to promote ${appName}`}
        note={`Everything you need to share ${appName} with your audience and get credited for every subscriber you bring.`}
        action={highlighted ? <Badge className="shrink-0">You’re in the program</Badge> : null}
      />
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2.5 rounded-2xl border bg-background p-4">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-[10px] bg-primary/15 text-sm font-extrabold text-primary-ink"
            >
              {index + 1}
            </span>
            <span className="text-sm font-bold">{step.title}</span>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </HomeCard>
  );
}
