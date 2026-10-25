"use client";

import {
  Check,
  CircleAlert,
  Clock,
  Eye,
  ExternalLink,
  Plus,
  Send,
  Sparkles,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  FieldErrors,
  FormMessage,
  useSuccessToast,
} from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState, type FormState } from "@/lib/forms";
import {
  APP_CATEGORIES,
  APP_CATEGORY_LABELS,
  APP_LANGUAGE_LABELS,
  APP_LANGUAGES,
  APP_PLATFORM_LABELS,
  APP_PLATFORMS,
} from "@/modules/catalog/constants";
import { saveAppDraft, submitAppForReview } from "../actions";
import type { CompanyWorkspaceApp } from "../queries";
import { checkAppSubmissionReadiness } from "../schemas";

const textareaClassName =
  "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

const STATUS_BADGE: Record<
  CompanyWorkspaceApp["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted for review", variant: "outline" },
  published: { label: "Published (Demo)", variant: "default" },
  rejected: { label: "Changes requested", variant: "destructive" },
};

export function AppSubmissionStatusCard({
  app,
  isOwner,
}: {
  app: CompanyWorkspaceApp;
  isOwner: boolean;
}) {
  const [submitState, submitAction] = useActionState(submitAppForReview, idleFormState);
  useSuccessToast(submitState);

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

  const statusMeta = STATUS_BADGE[app.status];

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Publication & review status</CardTitle>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            <Badge variant="outline">Demo environment</Badge>
          </div>
          <CardAction className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/company/app/preview">
                <Eye data-icon="inline-start" />
                Preview draft
              </Link>
            </Button>
            {app.hasLivePublishedRelease ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/apps/${app.slug}`}>
                  Live catalog page
                  <ExternalLink data-icon="inline-end" />
                </Link>
              </Button>
            ) : null}
          </CardAction>
        </div>

        <CardDescription>
          {app.hasLivePublishedRelease
            ? `Release v${app.publishedReleaseNumber} is currently live in the catalog. Any draft edits you make stay private until you submit them and an administrator approves the new version.`
            : "Your listing stays private until you submit it and our team approves it."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {app.status === "rejected" && app.rejectionReason ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Administrator requested changes before publishing</AlertTitle>
            <AlertDescription>{app.rejectionReason}</AlertDescription>
          </Alert>
        ) : null}

        {app.status === "submitted" ? (
          <Alert>
            <Clock />
            <AlertTitle>Waiting for administrator review</AlertTitle>
            <AlertDescription>
              Your listing is in the administrator review queue. You can still update your draft if needed.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs"
            >
              {item.complete ? (
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {isOwner ? (
          <form action={submitAction} className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <input type="hidden" name="appId" value={app.id} />
            <div className="flex flex-col gap-1">
              {submitState.status === "error" ? <FormMessage state={submitState} /> : null}
              <p className="text-xs text-muted-foreground">
                Live production publishing requires verified payment integration and funding (Stages 6 & 8). Approvals currently publish to the Demo catalog.
              </p>
            </div>
            <SubmitButton
              disabled={!checklist.readyToSubmit}
              pendingLabel="Submitting…"
              className="shrink-0"
            >
              <Send data-icon="inline-start" />
              {app.status === "submitted"
                ? "Resubmit updated draft"
                : app.hasLivePublishedRelease
                  ? "Submit new version for review"
                  : "Submit for admin review"}
            </SubmitButton>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AppDraftEditorForm({
  app,
  isOwner,
}: {
  app: CompanyWorkspaceApp;
  isOwner: boolean;
}) {
  const [state, action] = useActionState(saveAppDraft, idleFormState);
  useSuccessToast(state);

  const [logoUrl, setLogoUrl] = useState(app.logoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(app.coverImageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(app.videoUrl ?? "");
  const [screenshots, setScreenshots] = useState<{ url: string; alt: string }[]>(
    app.screenshots.length > 0
      ? app.screenshots
      : [{ url: "", alt: "" }],
  );

  function fillDemoVisuals() {
    setLogoUrl("/demo/logo-pulse.svg");
    setCoverImageUrl("/demo/cover-pulse.svg");
    setVideoUrl("https://pulsecoach.example.com/demo/overview.mp4");
    setScreenshots([
      { url: "/demo/screen-pulse-1.svg", alt: `${app.name} main workflow view` },
      { url: "/demo/screen-pulse-2.svg", alt: `${app.name} subscriber progress screen` },
    ]);
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="appId" value={app.id} />

      <div className="flex flex-col gap-6">
        {state.status === "error" ? <FormMessage state={state} /> : null}

        {/* 1. Identity & descriptions */}
        <Card>
          <CardHeader>
            <CardTitle>App identity & descriptions</CardTitle>
            <CardDescription>
              Shown on your marketplace tile and on the public `/apps/{app.slug}` profile page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid(state, "name")}>
                  <FieldLabel htmlFor="app-name">App name</FieldLabel>
                  <Input
                    id="app-name"
                    name="name"
                    required
                    maxLength={80}
                    disabled={!isOwner}
                    defaultValue={app.name}
                    aria-invalid={invalid(state, "name")}
                  />
                  <FieldErrors state={state} field="name" />
                </Field>

                <Field data-invalid={invalid(state, "slug")}>
                  <FieldLabel htmlFor="app-slug">Public URL slug</FieldLabel>
                  <Input
                    id="app-slug"
                    name="slug"
                    required
                    maxLength={60}
                    disabled={!isOwner}
                    defaultValue={app.slug}
                    aria-describedby="app-slug-hint"
                    aria-invalid={invalid(state, "slug")}
                  />
                  <FieldDescription id="app-slug-hint">
                    Public address: `/apps/{app.slug}`
                  </FieldDescription>
                  <FieldErrors state={state} field="slug" />
                </Field>
              </div>

              <Field data-invalid={invalid(state, "tagline")}>
                <FieldLabel htmlFor="app-tagline">Short description (tile tagline)</FieldLabel>
                <Input
                  id="app-tagline"
                  name="tagline"
                  maxLength={160}
                  disabled={!isOwner}
                  placeholder="One clear sentence explaining what your app does (10–160 chars)."
                  defaultValue={app.tagline}
                  aria-invalid={invalid(state, "tagline")}
                />
                <FieldErrors state={state} field="tagline" />
              </Field>

              <Field data-invalid={invalid(state, "description")}>
                <FieldLabel htmlFor="app-description">Full product description</FieldLabel>
                <textarea
                  id="app-description"
                  name="description"
                  rows={5}
                  maxLength={10000}
                  disabled={!isOwner}
                  placeholder="Describe who the app is for, key workflows, and why audiences subscribe."
                  defaultValue={app.description}
                  className={textareaClassName}
                  aria-invalid={invalid(state, "description")}
                />
                <FieldDescription>
                  Rendered safely as plain-text paragraphs (no raw HTML).
                </FieldDescription>
                <FieldErrors state={state} field="description" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* 2. Categories, platforms, languages */}
        <Card>
          <CardHeader>
            <CardTitle>Categories, platforms & languages</CardTitle>
            <CardDescription>
              Used for catalog filtering and for matching creators who promote similar apps.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2" disabled={!isOwner}>
              <legend className="text-sm font-medium">Categories (select 1 to 3)</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {APP_CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={category}
                      defaultChecked={app.categories.includes(category)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span>{APP_CATEGORY_LABELS[category]}</span>
                  </label>
                ))}
              </div>
              <FieldErrors state={state} field="categories" />
            </fieldset>

            <fieldset className="flex flex-col gap-2" disabled={!isOwner}>
              <legend className="text-sm font-medium">Platforms (select at least 1)</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {APP_PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      defaultChecked={app.platforms.includes(platform)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span>{APP_PLATFORM_LABELS[platform]}</span>
                  </label>
                ))}
              </div>
              <FieldErrors state={state} field="platforms" />
            </fieldset>

            <fieldset className="flex flex-col gap-2" disabled={!isOwner}>
              <legend className="text-sm font-medium">App languages (select at least 1)</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {APP_LANGUAGES.map((code) => (
                  <label
                    key={code}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      name="languages"
                      value={code}
                      defaultChecked={app.languages.includes(code)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span>{APP_LANGUAGE_LABELS[code]}</span>
                  </label>
                ))}
              </div>
              <FieldErrors state={state} field="languages" />
            </fieldset>
          </CardContent>
        </Card>

        {/* 3. Product & Store Links */}
        <Card>
          <CardHeader>
            <CardTitle>Product website & app store links</CardTitle>
            <CardDescription>
              Creator referral links can only redirect to the verified URLs you configure here. Provide at least one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={invalid(state, "websiteUrl")}>
                <FieldLabel htmlFor="website-url">Product website URL</FieldLabel>
                <Input
                  id="website-url"
                  name="websiteUrl"
                  type="url"
                  disabled={!isOwner}
                  placeholder="https://yourapp.example.com"
                  defaultValue={app.websiteUrl ?? ""}
                  aria-invalid={invalid(state, "websiteUrl")}
                />
                <FieldErrors state={state} field="websiteUrl" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid(state, "iosStoreUrl")}>
                  <FieldLabel htmlFor="ios-store-url">iOS App Store URL</FieldLabel>
                  <Input
                    id="ios-store-url"
                    name="iosStoreUrl"
                    type="url"
                    disabled={!isOwner}
                    placeholder="https://apps.apple.com/app/..."
                    defaultValue={app.iosStoreUrl ?? ""}
                    aria-invalid={invalid(state, "iosStoreUrl")}
                  />
                  <FieldErrors state={state} field="iosStoreUrl" />
                </Field>

                <Field data-invalid={invalid(state, "androidStoreUrl")}>
                  <FieldLabel htmlFor="android-store-url">Google Play Store URL</FieldLabel>
                  <Input
                    id="android-store-url"
                    name="androidStoreUrl"
                    type="url"
                    disabled={!isOwner}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    defaultValue={app.androidStoreUrl ?? ""}
                    aria-invalid={invalid(state, "androidStoreUrl")}
                  />
                  <FieldErrors state={state} field="androidStoreUrl" />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* 4. Visuals: Cover, Logo, Screenshots, Video */}
        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Visual assets, screenshots & video</CardTitle>
              {isOwner ? (
                <Button type="button" variant="outline" size="sm" onClick={fillDemoVisuals}>
                  <Sparkles data-icon="inline-start" />
                  Fill sample demo visuals
                </Button>
              ) : null}
            </div>
            <CardDescription>
              Media assets are protected by organization access control: draft assets stay private to your company until a release is approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid(state, "coverImageUrl")}>
                  <FieldLabel htmlFor="cover-image-url">Tile cover graphic URL (16:10)</FieldLabel>
                  <Input
                    id="cover-image-url"
                    name="coverImageUrl"
                    disabled={!isOwner}
                    placeholder="https://... or /demo/cover-pulse.svg"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.currentTarget.value)}
                    aria-invalid={invalid(state, "coverImageUrl")}
                  />
                  <FieldErrors state={state} field="coverImageUrl" />
                </Field>

                <Field data-invalid={invalid(state, "logoUrl")}>
                  <FieldLabel htmlFor="logo-url">App logo URL (square)</FieldLabel>
                  <Input
                    id="logo-url"
                    name="logoUrl"
                    disabled={!isOwner}
                    placeholder="https://... or /demo/logo-pulse.svg"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.currentTarget.value)}
                    aria-invalid={invalid(state, "logoUrl")}
                  />
                  <FieldErrors state={state} field="logoUrl" />
                </Field>
              </div>

              <Field data-invalid={invalid(state, "videoUrl")}>
                <FieldLabel htmlFor="video-url">Product walkthrough video URL (optional)</FieldLabel>
                <Input
                  id="video-url"
                  name="videoUrl"
                  disabled={!isOwner}
                  placeholder="https://yourapp.example.com/demo/walkthrough.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.currentTarget.value)}
                  aria-invalid={invalid(state, "videoUrl")}
                />
                <FieldErrors state={state} field="videoUrl" />
              </Field>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Screenshots (up to 6)</span>
                  {isOwner && screenshots.length < 6 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScreenshots([...screenshots, { url: "", alt: "" }])}
                    >
                      <Plus data-icon="inline-start" />
                      Add screenshot row
                    </Button>
                  ) : null}
                </div>

                {screenshots.map((shot, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      name="screenshotUrl"
                      disabled={!isOwner}
                      placeholder="Screenshot URL (https://... or /demo/screen-pulse-1.svg)"
                      value={shot.url}
                      onChange={(e) => {
                        const next = [...screenshots];
                        next[idx] = { ...shot, url: e.currentTarget.value };
                        setScreenshots(next);
                      }}
                      aria-label={`Screenshot ${idx + 1} URL`}
                    />
                    <Input
                      name="screenshotAlt"
                      disabled={!isOwner}
                      placeholder="Caption / alt description"
                      value={shot.alt}
                      onChange={(e) => {
                        const next = [...screenshots];
                        next[idx] = { ...shot, alt: e.currentTarget.value };
                        setScreenshots(next);
                      }}
                      aria-label={`Screenshot ${idx + 1} caption`}
                    />
                    {isOwner && screenshots.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove screenshot ${idx + 1}`}
                        onClick={() => setScreenshots(screenshots.filter((_, i) => i !== idx))}
                      >
                        <Trash />
                      </Button>
                    ) : null}
                  </div>
                ))}
                <FieldErrors state={state} field="screenshots" />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* 5. Program terms & attribution window */}
        <Card>
          <CardHeader>
            <CardTitle>Program terms & attribution window</CardTitle>
            <CardDescription>
              Creators accept these exact terms when joining. When a new version is approved, existing referred customers keep their historical rate snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={invalid(state, "termsText")}>
                <FieldLabel htmlFor="terms-text">Commission program terms</FieldLabel>
                <textarea
                  id="terms-text"
                  name="termsText"
                  rows={4}
                  maxLength={10000}
                  disabled={!isOwner}
                  placeholder="Describe when commission is earned, how web links and mobile codes work, and any promotion rules."
                  defaultValue={app.termsText}
                  className={textareaClassName}
                  aria-invalid={invalid(state, "termsText")}
                />
                <FieldErrors state={state} field="termsText" />
              </Field>

              <Field data-invalid={invalid(state, "attributionWindowDays")} className="max-w-xs">
                <FieldLabel htmlFor="attribution-window">
                  Attribution window (days from click to sign-up)
                </FieldLabel>
                <Input
                  id="attribution-window"
                  name="attributionWindowDays"
                  type="number"
                  min={1}
                  max={365}
                  disabled={!isOwner}
                  defaultValue={String(app.attributionWindowDays)}
                  aria-invalid={invalid(state, "attributionWindowDays")}
                />
                <FieldErrors state={state} field="attributionWindowDays" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {isOwner ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Saving updates your working draft. Manage subscription plans in{" "}
              <Link href="/company/plans" className="font-medium text-foreground underline underline-offset-4">
                Plans & commissions
              </Link>
              .
            </p>
            <SubmitButton size="lg" pendingLabel="Saving draft…">
              Save draft
            </SubmitButton>
          </div>
        ) : null}
      </div>
    </form>
  );
}
