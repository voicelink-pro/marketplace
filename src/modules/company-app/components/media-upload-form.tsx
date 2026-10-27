"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState } from "@/lib/forms";
import { CopyableField } from "@/modules/programs/components/copy-value-button";
import { uploadAppMedia } from "../media-actions";
import { MEDIA_TARGET_LABELS, type MediaTarget, useApplyMedia } from "./media-target";

const MB = 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

/** Early hint only; the server re-checks type, contents and size. */
function precheck(file: File): string | null {
  if (IMAGE_TYPES.includes(file.type)) return file.size > 10 * MB ? "Images can be up to 10 MB." : null;
  if (VIDEO_TYPES.includes(file.type)) return file.size > 25 * MB ? "Videos can be up to 25 MB." : null;
  return "Choose a PNG, JPEG or WebP image, or an MP4 or WebM video.";
}

function targetsFor(url: string): MediaTarget[] {
  return /\.(mp4|webm)$/.test(url) ? ["videoUrl"] : ["coverImageUrl", "logoUrl", "screenshot"];
}

export function MediaUploadForm({ appId }: { appId: string }) {
  const [state, action] = useActionState(uploadAppMedia, idleFormState);
  const [fileError, setFileError] = useState<string | null>(null);
  const applyMedia = useApplyMedia();
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") feedbackRef.current?.focus();
  }, [state]);

  const uploadedUrl = state.status === "success" ? state.values?.mediaUrl : undefined;

  function placeIn(target: MediaTarget, url: string) {
    applyMedia?.(target, url);
    toast.success(`Added to ${MEDIA_TARGET_LABELS[target]}. Save the draft to keep it.`);
  }

  return (
    <Card id="media-upload">
      <CardHeader>
        <CardTitle>Upload app media</CardTitle>
        <CardDescription>
          Uploaded files stay private until the profile containing them is approved. External URLs must already be public.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={action}>
          <input type="hidden" name="appId" value={appId} />
          <FieldGroup>
            <div ref={feedbackRef} tabIndex={-1}>
              <FormMessage state={state} />
            </div>
            <Field data-invalid={state.status === "error" || fileError !== null}>
              <FieldLabel htmlFor="app-media-file">Image or video</FieldLabel>
              <Input
                id="app-media-file"
                name="file"
                type="file"
                aria-invalid={state.status === "error" || fileError !== null}
                aria-describedby="media-upload-guidance"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                required
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setFileError(file ? precheck(file) : null);
                }}
              />
              <FieldDescription id="media-upload-guidance">
                PNG, JPEG or WebP up to 10 MB; MP4 or WebM up to 25 MB.
              </FieldDescription>
              {fileError ? <FieldError>{fileError}</FieldError> : null}
            </Field>
            <SubmitButton pendingLabel="Uploading…" disabled={fileError !== null} className="self-start">
              Upload file
            </SubmitButton>
          </FieldGroup>
        </form>

        {uploadedUrl ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
            <CopyableField label="Uploaded media URL" value={uploadedUrl} copyLabel="Copy URL" />
            {applyMedia ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm">Put it in a profile field (you still need to save the draft):</p>
                <div className="flex flex-wrap gap-2">
                  {targetsFor(uploadedUrl).map((target) => (
                    <Button key={target} type="button" variant="outline" size="sm" onClick={() => placeIn(target, uploadedUrl)}>
                      Use as {MEDIA_TARGET_LABELS[target].toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
