"use client";

import { Upload } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-feedback";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { idleFormState } from "@/lib/forms";
import { CopyableField } from "@/modules/programs/components/copy-value-button";
import { uploadAppMedia } from "../media-actions";
import { MEDIA_TARGET_LABELS, type MediaTarget } from "./media-target";

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

/**
 * Upload control that lives inside the draft editor's Media section. It sits
 * in the editor's <form> (forms can't nest), so it posts its own FormData and
 * keeps the file input unnamed to stay out of the draft submission.
 */
export function MediaUploadField({
  appId,
  onPlace,
}: {
  appId: string;
  /** Fills a draft field; saving the draft is still what attaches the file. */
  onPlace: (target: MediaTarget, url: string) => void;
}) {
  const [state, action, pending] = useActionState(uploadAppMedia, idleFormState);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") feedbackRef.current?.focus();
  }, [state]);

  const uploadedUrl = state.status === "success" ? state.values?.mediaUrl : undefined;

  function upload() {
    if (!file) {
      setFileError("Choose a file to upload.");
      return;
    }
    const data = new FormData();
    data.set("appId", appId);
    data.set("file", file);
    startTransition(() => action(data));
  }

  function placeIn(target: MediaTarget, url: string) {
    onPlace(target, url);
    toast.success(`Added to ${MEDIA_TARGET_LABELS[target]}. Save the draft to keep it.`);
  }

  return (
    <div id="media-upload" className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
      <div ref={feedbackRef} tabIndex={-1} className="outline-none empty:hidden">
        <FormMessage state={state} />
      </div>
      <Field data-invalid={state.status === "error" || fileError !== null}>
        <FieldLabel htmlFor="app-media-file">Upload from your device</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="app-media-file"
            type="file"
            className="min-w-0 flex-1"
            aria-invalid={state.status === "error" || fileError !== null}
            aria-describedby="media-upload-guidance"
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
            onChange={(event) => {
              // Picking a file is not a draft edit.
              event.stopPropagation();
              const next = event.currentTarget.files?.[0] ?? null;
              setFile(next);
              setFileError(next ? precheck(next) : null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={upload}
            disabled={pending || fileError !== null}
            className="shrink-0"
          >
            {pending ? <Spinner data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
            {pending ? "Uploading…" : "Upload file"}
          </Button>
        </div>
        <FieldDescription id="media-upload-guidance">
          PNG, JPEG or WebP up to 10 MB; MP4 or WebM up to 25 MB. Uploads stay private until the profile containing them is approved.
        </FieldDescription>
        {fileError ? <FieldError>{fileError}</FieldError> : null}
      </Field>

      {uploadedUrl ? (
        <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
          <CopyableField label="Uploaded media URL" value={uploadedUrl} copyLabel="Copy URL" />
          <div className="flex flex-col gap-2">
            <p className="text-sm">Put it in a field below (then save the draft):</p>
            <div className="flex flex-wrap gap-2">
              {targetsFor(uploadedUrl).map((target) => (
                <Button key={target} type="button" variant="outline" size="sm" onClick={() => placeIn(target, uploadedUrl)}>
                  Use as {MEDIA_TARGET_LABELS[target].toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
