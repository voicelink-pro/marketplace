"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState } from "@/lib/forms";
import { CopyableField } from "@/modules/programs/components/copy-value-button";
import { uploadAppMedia } from "../media-actions";

export function MediaUploadForm({ appId }: { appId: string }) {
  const [state, action] = useActionState(uploadAppMedia, idleFormState);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.status === "error") feedbackRef.current?.focus(); }, [state]);
  return <Card>
    <CardHeader><CardTitle>Upload app media</CardTitle><CardDescription>Uploaded files stay private until the profile containing them is approved. External URLs must already be public.</CardDescription></CardHeader>
    <CardContent className="flex flex-col gap-4">
      <form action={action}><input type="hidden" name="appId" value={appId} />
        <FieldGroup><div ref={feedbackRef} tabIndex={-1}><FormMessage state={state} /></div><Field data-invalid={state.status === "error"}><FieldLabel htmlFor="app-media-file">Image or video</FieldLabel>
          <Input id="app-media-file" name="file" type="file" aria-invalid={state.status === "error"} aria-describedby="media-upload-guidance" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" required />
          <FieldDescription id="media-upload-guidance">PNG, JPEG or WebP up to 10 MB; MP4 or WebM up to 25 MB.</FieldDescription>
        </Field><SubmitButton pendingLabel="Uploading…">Upload file</SubmitButton></FieldGroup>
      </form>
      {state.status === "success" && state.values?.mediaUrl ? <CopyableField label="Uploaded media URL" value={state.values.mediaUrl} copyLabel="Copy URL" /> : null}
    </CardContent>
  </Card>;
}
