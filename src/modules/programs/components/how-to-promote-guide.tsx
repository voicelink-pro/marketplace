import { Compass, Link2, Smartphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HowToPromoteGuide({
  appName,
  attributionWindowDays,
  highlighted = false,
}: {
  appName: string;
  attributionWindowDays: number;
  highlighted?: boolean;
}) {
  return (
    <Card className={highlighted ? "border-primary/40 bg-primary/[0.03]" : undefined}>
      <CardHeader className="gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass aria-hidden className="size-4 text-primary-ink" />
            <CardTitle className="text-base">How to promote on the marketplace</CardTitle>
          </div>
          {highlighted ? <Badge>You’re in the program</Badge> : <Badge variant="secondary">Platform guide</Badge>}
        </div>
        <CardDescription>
          Everything you need to share {appName} with your audience and get credited for every subscriber you bring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-4 sm:grid-cols-3">
          <li className="flex flex-col gap-1.5 rounded-lg border bg-card p-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Link2 aria-hidden className="size-4 shrink-0 text-primary-ink" />
              <span>1. Share your link</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Place your referral link in your bio, video description, or newsletter. Customers who sign up within{" "}
              <span className="tabular font-medium text-foreground">{attributionWindowDays} days</span> of clicking are attributed to you.
            </p>
          </li>

          <li className="flex flex-col gap-1.5 rounded-lg border bg-card p-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Smartphone aria-hidden className="size-4 shrink-0 text-primary-ink" />
              <span>2. Mention your code</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              For iOS and Android apps, viewers often install from the App Store or Google Play directly. Ask them to enter your referral code during sign-up so the referral is linked to you.
            </p>
          </li>

          <li className="flex flex-col gap-1.5 rounded-lg border bg-card p-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles aria-hidden className="size-4 shrink-0 text-primary-ink" />
              <span>3. Name each placement</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Create separate named links (like “Instagram bio”, “TikTok”, or “Video 1”) to compare which channel brings paying subscribers. You never need to upload or pre-approve your posts.
            </p>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
