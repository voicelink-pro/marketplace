"use server";

import { randomUUID } from "node:crypto";
import { formError, formString, type FormState } from "@/lib/forms";
import { logUnexpected } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/modules/accounts/viewer";
import { uuidSchema } from "@/modules/accounts/schemas";
import { isLocalPgliteSandboxEnabled } from "@/modules/catalog/local-pglite-sandbox";
import { validateMedia } from "./media";

export async function uploadAppMedia(_previous: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/app");
  const appId = uuidSchema.safeParse(formString(form, "appId"));
  if (!appId.success) return formError("Choose an app first.");
  if (isLocalPgliteSandboxEnabled()) return formError("File uploads require local Supabase. URL-based demo media is still available.");
  const supabase = await createClient();
  const { data: app, error: appError } = await supabase.from("apps").select("organization_id").eq("id", appId.data).maybeSingle();
  if (appError) {
    logUnexpected("media.loadApp", appError);
    return formError("We couldn't load this app. Try again.");
  }
  if (!app || !viewer.organizations.some(org => org.id === app.organization_id && org.role === "owner")) {
    return formError("Only the app's company owner can upload media.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return formError("Choose a file to upload.");
  if (file.size > 25 * 1024 * 1024) return formError("Files can be up to 25 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let media;
  try { media = validateMedia(bytes, file.type); }
  catch (error) { return formError(error instanceof Error ? error.message : "Unsupported file."); }
  const path = `${appId.data}/${randomUUID()}.${media.extension}`;
  const { error } = await supabase.storage.from("app-media").upload(path, bytes, { contentType: media.contentType, upsert: false });
  if (error) {
    logUnexpected("media.upload", error);
    return formError("We couldn't upload this file. Try again.");
  }
  return { status: "success", message: "Uploaded. Use this URL in the profile field below, then save the draft.", values: { mediaUrl: `/media/apps/${path}` } };
}
