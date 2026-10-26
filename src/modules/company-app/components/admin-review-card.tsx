"use client";

import { Check, CircleAlert, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  FieldErrors,
  FormMessage,
  useSuccessToast,
  valueFor,
} from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { idleFormState } from "@/lib/forms";
import {
  formatCommissionPercent,
  formatMinorCurrency,
} from "@/lib/money";
import {
  APP_CATEGORY_LABELS,
  APP_PLATFORM_LABELS,
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_SUFFIX,
  formatLanguageLabel,
} from "@/modules/catalog/constants";
import { reviewSubmittedApp } from "../actions";
import type { CompanyWorkspaceApp } from "../queries";
import { checkAppSubmissionReadiness } from "../schemas";

export function AdminReviewCard({ app }: { app: CompanyWorkspaceApp }) {
  const [approveState, approveAction] = useActionState(reviewSubmittedApp, idleFormState);
  const [rejectState, rejectAction] = useActionState(reviewSubmittedApp, idleFormState);
  useSuccessToast(approveState);
  useSuccessToast(rejectState);

  const activePlans = app.plans.filter((p) => p.isActive);
  const checklist = checkAppSubmissionReadiness({
    name: app.name,
    tagline: app.tagline,
    description: app.description,
    categories: app.categories,
    platforms: app.platforms,
    languages: app.languages,
    websiteUrl: app.websiteUrl,
    iosStoreUrl: app.iosStoreUrl,
    androidStoreUrl: app.androidStoreUrl,
    coverImageUrl: app.coverImageUrl,
    logoUrl: app.logoUrl,
    termsText: app.termsText,
    activePlanCount: activePlans.length,
  });

  return (
    <Card className={app.status === "submitted" ? "border-primary/40" : undefined}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {app.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={app.logoUrl}
                alt=""
                className="size-11 shrink-0 rounded-xl border bg-background object-contain"
              />
            ) : (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                {app.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{app.name}</CardTitle>
                <Badge
                  variant={
                    app.status === "submitted"
                      ? "default"
                      : app.status === "published"
                        ? "secondary"
                        : app.status === "rejected"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {app.status === "submitted"
                    ? "Waiting for review"
                    : app.status === "published"
                      ? `Published (v${app.publishedReleaseNumber ?? 1})`
                      : app.status === "rejected"
                        ? "Rejected"
                        : "Draft"}
                </Badge>
                <Badge variant="outline">Demo sandbox</Badge>
              </div>
              <CardDescription>
                {app.organizationName} · Slug: <code>/apps/{app.slug}</code>
              </CardDescription>
            </div>
          </div>

          {app.hasLivePublishedRelease ? (
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/apps/${app.slug}`}>
                  Public page
                  <ExternalLink data-icon="inline-end" />
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 border-t pt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Tagline & description</span>
            <p className="font-medium">{app.tagline || "—"}</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {app.description || "No description provided."}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {app.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-[11px]">
                  {APP_CATEGORY_LABELS[cat]}
                </Badge>
              ))}
              {app.platforms.map((plat) => (
                <Badge key={plat} variant="outline" className="text-[11px]">
                  {APP_PLATFORM_LABELS[plat]}
                </Badge>
              ))}
              {app.languages.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  · {app.languages.map(formatLanguageLabel).join(", ")}
                </span>
              ) : null}
            </div>
          </div>

          {/* Admin review checklist */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Review checklist</span>
            <div className="grid gap-1.5">
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate">{item.label}</span>
                  {item.complete ? (
                    <span className="inline-flex shrink-0 items-center gap-1 font-medium text-primary">
                      <Check aria-hidden className="size-3.5" />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-destructive">
                      <CircleAlert aria-hidden className="size-3.5" />
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <details className="rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer font-medium">Review all images, screenshots and video</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[app.coverImageUrl, ...app.screenshots.map(image => image.url)].filter((url): url is string => Boolean(url)).map((url, index) => (
              <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={index === 0 ? "App cover" : `Screenshot ${index}`} referrerPolicy="no-referrer" className="aspect-video w-full rounded-md border object-contain" />
                <span className="text-xs underline">Open image {index + 1}</span>
              </a>
            ))}
          </div>
          {app.videoUrl ? <a href={app.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block underline">Open product video</a> : null}
          <div className="mt-3 flex flex-wrap gap-3 text-xs underline">
            {[app.websiteUrl, app.iosStoreUrl, app.androidStoreUrl].filter((url): url is string => Boolean(url)).map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{url}</a>)}
          </div>
        </details>

        {/* Plans & Commission Rates */}
        {activePlans.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing ID</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {plan.externalPlanKey}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {BILLING_INTERVAL_LABELS[plan.billingInterval]}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatMinorCurrency(plan.priceMinor, plan.currency)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
                      </span>
                    </TableCell>
                    <TableCell className="tabular text-right font-semibold text-primary">
                      {formatCommissionPercent(plan.commissionBps)} recurring
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <div className="rounded-lg border bg-muted/20 p-3 text-xs">
          <span className="font-medium text-foreground">
            Program terms ({app.attributionWindowDays}-day attribution window):{" "}
          </span>
          <span className="text-muted-foreground">{app.termsText || "—"}</span>
        </div>

        {/* Decision Controls */}
        <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
          <form action={approveAction} className="flex flex-col justify-between gap-3 rounded-lg border p-3.5">
            <input type="hidden" name="appId" value={app.id} />
            <input type="hidden" name="reviewRevision" value={app.reviewRevision} />
            <input type="hidden" name="decision" value="approve" />
            <input type="hidden" name="environment" value="demo" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Approve & publish (Demo catalog)</span>
              <p className="text-xs text-muted-foreground">
                Creates an immutable terms & rate snapshot and publishes the listing to the demo marketplace catalog. Live production remains locked until payment integration and funding are verified.
              </p>
              {approveState.status === "error" ? <FormMessage state={approveState} /> : null}
            </div>
            <SubmitButton
              disabled={app.status !== "submitted" || !checklist.readyToSubmit}
              pendingLabel="Publishing…"
              className="self-start"
            >
              <Check data-icon="inline-start" />
              Approve & publish (Demo)
            </SubmitButton>
          </form>

          <form action={rejectAction} noValidate className="flex flex-col justify-between gap-3 rounded-lg border p-3.5">
            <input type="hidden" name="appId" value={app.id} />
            <input type="hidden" name="reviewRevision" value={app.reviewRevision} />
            <input type="hidden" name="decision" value="reject" />
            <FieldGroup>
              {rejectState.status === "error" ? <FormMessage state={rejectState} /> : null}
              <Field
                data-invalid={Boolean(
                  rejectState.status === "error" && rejectState.fieldErrors?.reason,
                )}
              >
                <FieldLabel htmlFor={`reject-reason-${app.id}`}>
                  Send back for changes (reason required)
                </FieldLabel>
                <Input
                  id={`reject-reason-${app.id}`}
                  name="reason"
                  required
                  placeholder="Explain what the company needs to clarify or fix…"
                  defaultValue={valueFor(rejectState, "reason") ?? app.rejectionReason ?? ""}
                />
                <FieldErrors state={rejectState} field="reason" />
              </Field>
              <SubmitButton
                variant="outline"
                disabled={app.status !== "submitted"}
                pendingLabel="Sending back…"
                className="self-start"
              >
                <XCircle data-icon="inline-start" />
                Send back with reason
              </SubmitButton>
            </FieldGroup>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
