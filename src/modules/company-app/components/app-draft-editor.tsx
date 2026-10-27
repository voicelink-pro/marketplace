"use client";

import {
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
import { useActionState, useCallback, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
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
import type { MediaTarget } from "./media-target";
import { MediaUploadField } from "./media-upload-form";
import { appReadiness } from "./app-readiness";
import { PublicationChecklist } from "./publication-checklist";

const textareaClassName =
  "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const EDITOR_SECTIONS = [
  { id: "editor-basics", label: "Basics" },
  { id: "editor-listing", label: "Categories & platforms" },
  { id: "editor-links", label: "Links" },
  { id: "editor-media", label: "Media" },
  { id: "editor-terms", label: "Terms" },
] as const;

const MEDIA_FIELD_IDS: Record<Exclude<MediaTarget, "screenshot">, string> = {
  coverImageUrl: "cover-image-url",
  logoUrl: "logo-url",
  videoUrl: "video-url",
};

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

export function AppSubmissionStatusCard({ app }: { app: CompanyWorkspaceApp }) {
  const statusMeta = STATUS_BADGE[app.status];

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">Publication & review status</CardTitle>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            <Badge variant="outline">Demo environment</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
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

        <PublicationChecklist checklist={appReadiness(app)} />
      </CardContent>
    </Card>
  );
}

export function AppDraftEditorForm({
  app,
  isOwner,
  demoMode,
}: {
  app: CompanyWorkspaceApp;
  isOwner: boolean;
  /** Local sandbox only: offers the sample-visuals shortcut. */
  demoMode: boolean;
}) {
  const [state, action] = useActionState(saveAppDraft, idleFormState);
  useSuccessToast(state);
  const [submitState, submitAction, submitPending] = useActionState(submitAppForReview, idleFormState);
  useSuccessToast(submitState);
  const checklist = appReadiness(app);

  const [logoUrl, setLogoUrl] = useState(app.logoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(app.coverImageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(app.videoUrl ?? "");
  const [screenshots, setScreenshots] = useState<{ url: string; alt: string }[]>(
    app.screenshots.length > 0
      ? app.screenshots
      : [{ url: "", alt: "" }],
  );

  // Unsaved = edited since the last result, or the last save failed.
  const [editedAt, setEditedAt] = useState<FormState | null>(null);
  const dirty = editedAt !== null && (editedAt === state || state.status !== "success");
  const markEdited = () => setEditedAt(state);

  const receiveMedia = useCallback(
    (target: MediaTarget, url: string) => {
      if (target === "screenshot") {
        setScreenshots((rows) => {
          const empty = rows.findIndex((row) => !row.url);
          if (empty >= 0) return rows.map((row, i) => (i === empty ? { ...row, url } : row));
          return rows.length < 6 ? [...rows, { url, alt: "" }] : rows;
        });
        document.getElementById("editor-media")?.scrollIntoView({ block: "start" });
      } else {
        ({ coverImageUrl: setCoverImageUrl, logoUrl: setLogoUrl, videoUrl: setVideoUrl })[target](url);
        const field = document.getElementById(MEDIA_FIELD_IDS[target]);
        field?.scrollIntoView({ block: "center" });
        field?.focus({ preventScroll: true });
      }
      setEditedAt(state);
    },
    [state],
  );

  function fillDemoVisuals() {
    markEdited();
    setLogoUrl("/demo/logo-pulse.svg");
    setCoverImageUrl("/demo/cover-pulse.svg");
    setVideoUrl("https://pulsecoach.example.com/demo/overview.mp4");
    setScreenshots([
      { url: "/demo/screen-pulse-1.svg", alt: `${app.name} main workflow view` },
      { url: "/demo/screen-pulse-2.svg", alt: `${app.name} subscriber progress screen` },
    ]);
  }

  const submitLabel =
    app.status === "submitted"
      ? "Resubmit updated draft"
      : app.hasLivePublishedRelease
        ? "Submit new version for review"
        : "Submit for admin review";
  const submitHint = !checklist.readyToSubmit
    ? "Finish the checklist above to submit for review."
    : dirty
      ? "Save your changes before submitting."
      : "Approved listings appear in the demo catalog. Live publishing opens once payments and funding are verified.";

  return (
    <>
    <form action={action} noValidate onChange={markEdited}>
      <input type="hidden" name="appId" value={app.id} />

      <div className="flex flex-col gap-6">
        <nav
          aria-label="Profile sections"
          className="sticky top-16 z-20 flex gap-1 overflow-x-auto rounded-full border bg-card/95 p-1 backdrop-blur"
        >
          {EDITOR_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {section.label}
            </a>
          ))}
        </nav>
        {state.status === "error" ? <FormMessage state={state} /> : null}

        {/* 1. Identity & descriptions */}
        <Card id="editor-basics" className="scroll-mt-32">
          <CardHeader>
            <CardTitle>App identity & descriptions</CardTitle>
            <CardDescription>
              Shown on your marketplace tile and on your public profile page.
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
                    Public address: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/apps/{app.slug}</code>
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
                  Plain text. Leave a blank line between paragraphs.
                </FieldDescription>
                <FieldErrors state={state} field="description" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* 2. Categories, platforms, languages */}
        <Card id="editor-listing" className="scroll-mt-32">
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
        <Card id="editor-links" className="scroll-mt-32">
          <CardHeader>
            <CardTitle>Product website & app store links</CardTitle>
            <CardDescription>
              Creator referral links can only redirect to the URLs you configure here. Provide at least one.
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
        <Card id="editor-media" className="scroll-mt-32">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Visual assets, screenshots & video</CardTitle>
              {isOwner && demoMode ? (
                <Button type="button" variant="outline" size="sm" onClick={fillDemoVisuals}>
                  <Sparkles data-icon="inline-start" />
                  Fill sample demo visuals
                </Button>
              ) : null}
            </div>
            <CardDescription>
              Upload files or paste links to images that are already public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {isOwner ? <MediaUploadField appId={app.id} onPlace={receiveMedia} /> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid(state, "coverImageUrl")}>
                  <FieldLabel htmlFor="cover-image-url">Tile cover graphic URL (16:10)</FieldLabel>
                  <Input
                    id="cover-image-url"
                    name="coverImageUrl"
                    disabled={!isOwner}
                    placeholder="https://…/cover.png"
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
                    placeholder="https://…/logo.png"
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
                  placeholder="https://…/walkthrough.mp4"
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
                      placeholder="Screenshot URL (https://…)"
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
                        onClick={() => {
                          markEdited();
                          setScreenshots(screenshots.filter((_, i) => i !== idx));
                        }}
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
        <Card id="editor-terms" className="scroll-mt-32">
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

        <p className="text-xs text-muted-foreground">
          Subscription plans and their commission rates are managed in{" "}
          <Link href="/company/plans" className="font-medium text-foreground underline underline-offset-4">
            Plans & commissions
          </Link>
          .
        </p>

        {isOwner ? (
          <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <p role="status" className="text-sm">
                {dirty ? (
                  <span className="font-semibold">Unsaved changes</span>
                ) : (
                  <span className="text-muted-foreground">All changes saved to your private draft</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{submitHint}</p>
              {submitState.status === "error" ? <FormMessage state={submitState} /> : null}
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/company/app/preview">
                  <Eye data-icon="inline-start" />
                  Preview
                </Link>
              </Button>
              <SubmitButton
                variant={checklist.readyToSubmit && !dirty ? "outline" : "default"}
                pendingLabel="Saving…"
              >
                Save draft
              </SubmitButton>
              <Button
                type="submit"
                form="app-submit-review"
                variant={checklist.readyToSubmit && !dirty ? "default" : "outline"}
                disabled={!checklist.readyToSubmit || dirty || submitPending}
                aria-disabled={!checklist.readyToSubmit || dirty || submitPending}
              >
                {submitPending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}
                {submitPending ? (
                  "Submitting…"
                ) : (
                  <>
                    <span className="sm:hidden">{app.status === "submitted" ? "Resubmit" : "Submit for review"}</span>
                    <span className="hidden sm:inline">{submitLabel}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
    {isOwner ? (
      // Separate form: the editor's <form> can't contain it, so the button above targets it by id.
      <form id="app-submit-review" action={submitAction} hidden>
        <input type="hidden" name="appId" value={app.id} />
      </form>
    ) : null}
    </>
  );
}
