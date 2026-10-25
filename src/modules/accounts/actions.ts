"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { formError, formString, type FormState, zodFormError } from "@/lib/forms";
import { logUnexpected } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/modules/auth/redirect";
import { displayNameSchema } from "@/modules/auth/schemas";
import {
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";
import { appNameSchema, organizationNameSchema, uuidSchema } from "./schemas";
import { MAX_SOCIAL_LINKS, parseSocialProfileUrl } from "./social";
import { primaryOrganization, requireViewer } from "./viewer";

const UNIQUE_VIOLATION = "23505";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function insertSocialLink(
  supabase: SupabaseServerClient | null,
  userId: string,
  rawUrl: string,
): Promise<FormState | null> {
  const values = { url: rawUrl };
  const parsed = parseSocialProfileUrl(rawUrl);
  if (!parsed.ok) {
    const message =
      parsed.reason === "profile_path_required"
        ? "Link to your profile page, not the platform's home page."
        : "Enter a valid https:// link to your profile.";
    return formError(message, { fieldErrors: { url: [message] }, values });
  }

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(userId, async (tx) => {
        await tx.query(
          `insert into public.creator_social_links (creator_id, platform, url)
           values ($1, $2, $3)`,
          [userId, parsed.platform, parsed.url],
        );
      });
      return null;
    } catch (err) {
      const pgError = err as { code?: string; message?: string };
      if (pgError.code === UNIQUE_VIOLATION) {
        return formError("You've already added this link.", {
          fieldErrors: { url: ["You've already added this link."] },
          values,
        });
      }
      if (pgError.message?.includes("social_link_limit_reached")) {
        return formError(`You can add up to ${MAX_SOCIAL_LINKS} links. Remove one to add another.`, {
          values,
        });
      }
      logUnexpected("accounts.insertSocialLink", err);
      return formError("We couldn't save this link. Try again.", { values });
    }
  }

  const client = supabase ?? (await createClient());
  const { error } = await client
    .from("creator_social_links")
    .insert({ creator_id: userId, platform: parsed.platform, url: parsed.url });

  if (!error) return null;
  if (error.code === UNIQUE_VIOLATION) {
    return formError("You've already added this link.", {
      fieldErrors: { url: ["You've already added this link."] },
      values,
    });
  }
  if (error.message === "social_link_limit_reached") {
    return formError(`You can add up to ${MAX_SOCIAL_LINKS} links. Remove one to add another.`, {
      values,
    });
  }
  logUnexpected("accounts.insertSocialLink", error);
  return formError("We couldn't save this link. Try again.", { values });
}

/** Enables the creator context and saves the first social profile in one step. */
export async function startCreator(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/onboarding/creator");
  const target = safeRedirectPath(formString(formData, "next"), "/creator");

  if (isLocalPgliteSandboxEnabled()) {
    if (!viewer.creator) {
      try {
        await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
          await tx.query(
            `insert into public.creator_profiles (user_id) values ($1) on conflict do nothing`,
            [viewer.userId],
          );
        });
      } catch (err) {
        logUnexpected("accounts.startCreator", err);
        return formError("We couldn't set up your creator account. Try again.");
      }
    }
    if (!viewer.creator || viewer.creator.socialLinkCount === 0) {
      const failure = await insertSocialLink(null, viewer.userId, formString(formData, "url"));
      if (failure) return failure;
    }
    redirect(target);
  }

  const supabase = await createClient();

  if (!viewer.creator) {
    const { error } = await supabase.from("creator_profiles").insert({ user_id: viewer.userId });
    if (error && error.code !== UNIQUE_VIOLATION) {
      logUnexpected("accounts.startCreator", error);
      return formError("We couldn't set up your creator account. Try again.");
    }
  }

  if (!viewer.creator || viewer.creator.socialLinkCount === 0) {
    const failure = await insertSocialLink(supabase, viewer.userId, formString(formData, "url"));
    if (failure) return failure;
  }

  redirect(target);
}

export async function addSocialLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/creator/settings");
  if (!viewer.creator) return formError("Set up your creator account first.");

  const failure = await insertSocialLink(
    isLocalPgliteSandboxEnabled() ? null : await createClient(),
    viewer.userId,
    formString(formData, "url"),
  );
  if (failure) return failure;

  refresh();
  return { status: "success", message: "Link added." };
}

export async function removeSocialLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/creator/settings");
  const id = uuidSchema.safeParse(formString(formData, "id"));
  if (!id.success) return formError("This link no longer exists.");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      const deleted = await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        const res = await tx.query<{ id: string }>(
          `delete from public.creator_social_links
           where id = $1 and creator_id = $2
           returning id`,
          [id.data, viewer.userId],
        );
        return res.rows.length;
      });
      if (!deleted) return formError("This link no longer exists.");
      refresh();
      return { status: "success", message: "Link removed." };
    } catch (err) {
      logUnexpected("accounts.removeSocialLink", err);
      return formError("We couldn't remove this link. Try again.");
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_social_links")
    .delete()
    .eq("id", id.data)
    .eq("creator_id", viewer.userId)
    .select("id");

  if (error) {
    logUnexpected("accounts.removeSocialLink", error);
    return formError("We couldn't remove this link. Try again.");
  }
  if (!data?.length) return formError("This link no longer exists.");

  refresh();
  return { status: "success", message: "Link removed." };
}

export async function createOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/onboarding/company");
  const values = { name: formString(formData, "name") };
  const parsed = organizationNameSchema.safeParse(values.name);
  if (!parsed.success) return zodFormError(parsed.error, values, "name");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.create_organization($1)`, [parsed.data]);
      });
    } catch (err) {
      logUnexpected("accounts.createOrganization", err);
      return formError("We couldn't create your company account. Try again.", { values });
    }
    redirect("/company");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", { p_name: parsed.data });
  if (error) {
    logUnexpected("accounts.createOrganization", error);
    return formError("We couldn't create your company account. Try again.", { values });
  }

  redirect("/company");
}

export async function renameOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/settings");
  const organization = primaryOrganization(viewer);
  if (!organization || organization.role !== "owner") {
    return formError("Only the company owner can rename the company.");
  }

  const values = { name: formString(formData, "name") };
  const parsed = organizationNameSchema.safeParse(values.name);
  if (!parsed.success) return zodFormError(parsed.error, values, "name");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      const updated = await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        const res = await tx.query<{ id: string }>(
          `update public.organizations set name = $1 where id = $2 returning id`,
          [parsed.data, organization.id],
        );
        return res.rows.length;
      });
      if (!updated) return formError("We couldn't rename the company. Try again.", { values });
      refresh();
      return { status: "success", message: "Company name saved." };
    } catch (err) {
      logUnexpected("accounts.renameOrganization", err);
      return formError("We couldn't rename the company. Try again.", { values });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ name: parsed.data })
    .eq("id", organization.id)
    .select("id");

  if (error || !data?.length) {
    if (error) logUnexpected("accounts.renameOrganization", error);
    return formError("We couldn't rename the company. Try again.", { values });
  }

  refresh();
  return { status: "success", message: "Company name saved." };
}

export async function createApp(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/app");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");
  if (organization.role !== "owner") return formError("Only the company owner can add the app.");

  const values = { name: formString(formData, "name") };
  const parsed = appNameSchema.safeParse(values.name);
  if (!parsed.success) return zodFormError(parsed.error, values, "name");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.create_app($1, $2)`, [organization.id, parsed.data]);
      });
      refresh();
      return { status: "success", message: "App created as a draft." };
    } catch (err) {
      const pgError = err as { message?: string };
      if (pgError.message?.includes("app_limit_reached")) {
        return formError("A company account can list one app for now.", { values });
      }
      logUnexpected("accounts.createApp", err);
      return formError("We couldn't create the app. Try again.", { values });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_app", {
    p_organization_id: organization.id,
    p_name: parsed.data,
  });

  if (error) {
    if (error.message === "app_limit_reached") {
      return formError("A company account can list one app for now.", { values });
    }
    logUnexpected("accounts.createApp", error);
    return formError("We couldn't create the app. Try again.", { values });
  }

  refresh();
  return { status: "success", message: "App created as a draft." };
}

export async function updateDisplayName(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/account");
  const values = { displayName: formString(formData, "displayName") };
  const parsed = displayNameSchema.safeParse(values.displayName);
  if (!parsed.success) return zodFormError(parsed.error, values, "displayName");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      const updated = await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        const res = await tx.query<{ id: string }>(
          `update public.profiles set display_name = $1 where id = $2 returning id`,
          [parsed.data, viewer.userId],
        );
        return res.rows.length;
      });
      if (!updated) return formError("We couldn't save your name. Try again.", { values });
      refresh();
      return { status: "success", message: "Name saved." };
    } catch (err) {
      logUnexpected("accounts.updateDisplayName", err);
      return formError("We couldn't save your name. Try again.", { values });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data })
    .eq("id", viewer.userId)
    .select("id");

  if (error || !data?.length) {
    if (error) logUnexpected("accounts.updateDisplayName", error);
    return formError("We couldn't save your name. Try again.", { values });
  }

  refresh();
  return { status: "success", message: "Name saved." };
}
