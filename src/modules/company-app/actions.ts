"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { formError, formString, type FormState, zodFormError } from "@/lib/forms";
import { logUnexpected } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/modules/accounts/schemas";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";
import {
  APP_CATEGORIES,
  APP_LANGUAGES,
  APP_PLATFORMS,
  type AppCategory,
  type AppLanguage,
  type AppPlatform,
} from "@/modules/catalog/constants";
import {
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";
import {
  appDraftFormSchema,
  optionalHttpsUrl,
  parseMajorMoneyToMinor,
  parsePercentToBps,
  planInputSchema,
} from "./schemas";

function extractPgErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

function parseScreenshotsFromForm(formData: FormData): { url: string; alt: string }[] {
  const urls = formData.getAll("screenshotUrl").map((v) => (typeof v === "string" ? v.trim() : ""));
  const alts = formData.getAll("screenshotAlt").map((v) => (typeof v === "string" ? v.trim() : ""));
  const list: { url: string; alt: string }[] = [];
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i] ?? "";
    const alt = alts[i] ?? "";
    if (!url) continue;
    list.push({
      url,
      alt: alt || `Product screenshot ${list.length + 1}`,
    });
  }
  return list.slice(0, 10);
}

export async function saveAppDraft(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/app");
  const organization = primaryOrganization(viewer);
  if (!organization || organization.role !== "owner") {
    return formError("Only the company owner can edit the app profile.");
  }

  const categories = formData
    .getAll("categories")
    .filter((v): v is AppCategory =>
      typeof v === "string" && (APP_CATEGORIES as readonly string[]).includes(v),
    );
  const platforms = formData
    .getAll("platforms")
    .filter((v): v is AppPlatform =>
      typeof v === "string" && (APP_PLATFORMS as readonly string[]).includes(v),
    );
  const languages = formData
    .getAll("languages")
    .filter((v): v is AppLanguage =>
      typeof v === "string" && (APP_LANGUAGES as readonly string[]).includes(v),
    );

  const windowRaw = Number.parseInt(formString(formData, "attributionWindowDays") || "30", 10);
  const screenshots = parseScreenshotsFromForm(formData);

  const parsed = appDraftFormSchema.safeParse({
    appId: formString(formData, "appId"),
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    tagline: formString(formData, "tagline"),
    description: formString(formData, "description"),
    categories,
    platforms,
    languages,
    websiteUrl: optionalHttpsUrl(formString(formData, "websiteUrl")),
    iosStoreUrl: optionalHttpsUrl(formString(formData, "iosStoreUrl")),
    androidStoreUrl: optionalHttpsUrl(formString(formData, "androidStoreUrl")),
    logoUrl: optionalHttpsUrl(formString(formData, "logoUrl")),
    coverImageUrl: optionalHttpsUrl(formString(formData, "coverImageUrl")),
    videoUrl: optionalHttpsUrl(formString(formData, "videoUrl")),
    screenshots,
    termsText: formString(formData, "termsText"),
    attributionWindowDays: Number.isSafeInteger(windowRaw) ? windowRaw : 30,
  });

  if (!parsed.success) {
    return zodFormError(parsed.error);
  }

  const data = parsed.data;

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(
          `select public.save_app_draft(
             $1, $2, $3, $4, $5,
             $6::public.app_category[],
             $7::public.app_platform[],
             $8::text[],
             $9, $10, $11, $12, $13,
             $14::jsonb,
             $15, $16, $17::smallint
           )`,
          [
            data.appId,
            data.name,
            data.slug,
            data.tagline,
            data.description,
            data.categories,
            data.platforms,
            data.languages,
            data.websiteUrl,
            data.iosStoreUrl,
            data.androidStoreUrl,
            data.logoUrl,
            data.coverImageUrl,
            JSON.stringify(data.screenshots),
            data.videoUrl,
            data.termsText,
            data.attributionWindowDays,
          ],
        );
      });
      refresh();
      return { status: "success", message: "Draft saved." };
    } catch (err) {
      const msg = extractPgErrorMessage(err);
      if (msg.includes("slug_already_taken")) {
        return formError("That URL slug is already taken by another app.", {
          fieldErrors: { slug: ["Choose a different URL slug."] },
        });
      }
      logUnexpected("companyApp.saveAppDraft", err);
      return formError("We couldn't save your draft. Check the fields and try again.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_app_draft", {
    p_app_id: data.appId,
    p_name: data.name,
    p_slug: data.slug,
    p_tagline: data.tagline,
    p_description: data.description,
    p_categories: data.categories,
    p_platforms: data.platforms,
    p_languages: data.languages,
    p_website_url: data.websiteUrl ?? undefined,
    p_ios_store_url: data.iosStoreUrl ?? undefined,
    p_android_store_url: data.androidStoreUrl ?? undefined,
    p_logo_url: data.logoUrl ?? undefined,
    p_cover_image_url: data.coverImageUrl ?? undefined,
    p_screenshots: data.screenshots,
    p_video_url: data.videoUrl ?? undefined,
    p_terms_text: data.termsText,
    p_attribution_window_days: data.attributionWindowDays,
  });

  if (error) {
    if (error.message.includes("slug_already_taken")) {
      return formError("That URL slug is already taken by another app.", {
        fieldErrors: { slug: ["Choose a different URL slug."] },
      });
    }
    logUnexpected("companyApp.saveAppDraft", error);
    return formError("We couldn't save your draft. Check the fields and try again.");
  }

  refresh();
  return { status: "success", message: "Draft saved." };
}

export async function upsertAppPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/plans");
  const organization = primaryOrganization(viewer);
  if (!organization || organization.role !== "owner") {
    return formError("Only the company owner can manage subscription plans.");
  }

  const values = {
    name: formString(formData, "name"),
    externalPlanKey: formString(formData, "externalPlanKey"),
    billingInterval: formString(formData, "billingInterval") || "month",
    priceAmount: formString(formData, "priceAmount"),
    currency: formString(formData, "currency") || "EUR",
    commissionPercent: formString(formData, "commissionPercent"),
  };

  const baseParsed = planInputSchema.safeParse({
    appId: formString(formData, "appId"),
    planId: formString(formData, "planId") || undefined,
    name: values.name,
    externalPlanKey: values.externalPlanKey,
    billingInterval: values.billingInterval,
    currency: values.currency,
  });

  if (!baseParsed.success) {
    return zodFormError(baseParsed.error, values);
  }

  const priceParsed = parseMajorMoneyToMinor(values.priceAmount, baseParsed.data.currency);
  if (!priceParsed.ok) {
    return formError(priceParsed.message, {
      fieldErrors: { priceAmount: [priceParsed.message] },
      values,
    });
  }

  const rateParsed = parsePercentToBps(values.commissionPercent);
  if (!rateParsed.ok) {
    return formError(rateParsed.message, {
      fieldErrors: { commissionPercent: [rateParsed.message] },
      values,
    });
  }

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(
          `select public.upsert_app_plan($1, $2, $3, $4::public.billing_interval, $5::bigint, $6, $7::integer, 0::smallint, $8)`,
          [
            baseParsed.data.appId,
            baseParsed.data.name,
            baseParsed.data.externalPlanKey,
            baseParsed.data.billingInterval,
            priceParsed.minor.toString(),
            baseParsed.data.currency,
            rateParsed.bps,
            baseParsed.data.planId ?? null,
          ],
        );
      });
      refresh();
      return { status: "success", message: `Plan “${baseParsed.data.name}” saved.` };
    } catch (err) {
      logUnexpected("companyApp.upsertAppPlan", err);
      return formError("We couldn't save this plan. Try again.", { values });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_app_plan", {
    p_app_id: baseParsed.data.appId,
    p_name: baseParsed.data.name,
    p_external_plan_key: baseParsed.data.externalPlanKey,
    p_billing_interval: baseParsed.data.billingInterval,
    p_price_minor: Number(priceParsed.minor),
    p_currency: baseParsed.data.currency,
    p_commission_bps: rateParsed.bps,
    p_plan_id: baseParsed.data.planId,
  });

  if (error) {
    logUnexpected("companyApp.upsertAppPlan", error);
    return formError("We couldn't save this plan. Try again.", { values });
  }

  refresh();
  return { status: "success", message: `Plan “${baseParsed.data.name}” saved.` };
}

export async function removeAppPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/plans");
  const organization = primaryOrganization(viewer);
  if (!organization || organization.role !== "owner") {
    return formError("Only the company owner can remove subscription plans.");
  }

  const planId = uuidSchema.safeParse(formString(formData, "planId"));
  if (!planId.success) return formError("Plan not found.");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.delete_app_plan($1)`, [planId.data]);
      });
      refresh();
      return { status: "success", message: "Plan removed from working draft." };
    } catch (err) {
      logUnexpected("companyApp.removeAppPlan", err);
      return formError("We couldn't remove this plan.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_app_plan", { p_plan_id: planId.data });
  if (error) {
    logUnexpected("companyApp.removeAppPlan", error);
    return formError("We couldn't remove this plan.");
  }

  refresh();
  return { status: "success", message: "Plan removed from working draft." };
}

export async function submitAppForReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/company/app");
  const organization = primaryOrganization(viewer);
  if (!organization || organization.role !== "owner") {
    return formError("Only the company owner can submit the app for review.");
  }

  const appId = uuidSchema.safeParse(formString(formData, "appId"));
  if (!appId.success) return formError("Invalid app.");

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.submit_app_for_review($1)`, [appId.data]);
      });
      refresh();
      return {
        status: "success",
        message: "Submitted for administrator review.",
      };
    } catch (err) {
      const msg = extractPgErrorMessage(err);
      if (msg.includes("app_profile_incomplete")) {
        return formError(
          "Complete the tagline, description, categories, platforms, languages, and program terms before submitting.",
        );
      }
      if (msg.includes("app_destination_url_required")) {
        return formError(
          "Add at least one product website or app store link before submitting.",
        );
      }
      if (msg.includes("app_requires_active_plan")) {
        return formError(
          "Add at least one subscription plan in Plans & commissions before submitting.",
        );
      }
      logUnexpected("companyApp.submitAppForReview", err);
      return formError("We couldn't submit your app right now. Try again.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_app_for_review", { p_app_id: appId.data });

  if (error) {
    if (error.message.includes("app_profile_incomplete")) {
      return formError(
        "Complete the tagline, description, categories, platforms, languages, and program terms before submitting.",
      );
    }
    if (error.message.includes("app_destination_url_required")) {
      return formError("Add at least one product website or app store link before submitting.");
    }
    if (error.message.includes("app_requires_active_plan")) {
      return formError(
        "Add at least one subscription plan in Plans & commissions before submitting.",
      );
    }
    logUnexpected("companyApp.submitAppForReview", error);
    return formError("We couldn't submit your app right now. Try again.");
  }

  refresh();
  return { status: "success", message: "Submitted for administrator review." };
}

export async function reviewSubmittedApp(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/admin");
  if (!viewer.isAdmin) {
    return formError("Only platform administrators can review app submissions.");
  }

  const appId = uuidSchema.safeParse(formString(formData, "appId"));
  if (!appId.success) return formError("Invalid app.");

  const revision = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
    .safeParse(formString(formData, "reviewRevision"));
  if (!revision.success || !formString(formData, "reviewRevision")) {
    return formError("Reload the application to review its current revision.");
  }

  const decision = formString(formData, "decision");
  const reason = formString(formData, "reason");
  const environment = formString(formData, "environment") || "demo";

  if (decision !== "approve" && decision !== "reject") {
    return formError("Select a review decision.");
  }

  if (decision === "reject" && reason.trim().length < 5) {
    return formError("Provide a reason (at least 5 characters) so the company knows what to fix.", {
      fieldErrors: { reason: ["Explain what needs to be changed before approval."] },
      values: { reason },
    });
  }

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.admin_review_app($1, $2, $3, $4, $5::bigint)`, [
          appId.data,
          decision,
          reason || null,
          environment,
          revision.data,
        ]);
      });
      refresh();
      return {
        status: "success",
        message:
          decision === "approve"
            ? "Application approved and published to the demo catalog."
            : "Application sent back to the company with your reason.",
      };
    } catch (err) {
      const msg = extractPgErrorMessage(err);
      if (msg.includes("stale_review_revision") || msg.includes("app_not_submitted")) {
        return formError("This submission changed or was already reviewed. Reload it before deciding.");
      }
      if (msg.includes("live_publication_requires_verified_integration_and_funding")) {
        return formError(
          "Live publication requires a verified payment integration and company funding. Use the Demo environment until Stages 6 & 8 are connected.",
        );
      }
      if (msg.includes("rejection_reason_required")) {
        return formError("Provide a reason so the company knows what to fix.");
      }
      logUnexpected("companyApp.reviewSubmittedApp", err);
      return formError("We couldn't complete this review action. Try again.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_app", {
    p_app_id: appId.data,
    p_decision: decision,
    p_reason: reason || undefined,
    p_environment: environment,
    p_expected_revision: revision.data,
  });

  if (error) {
    if (error.message.includes("stale_review_revision") || error.message.includes("app_not_submitted")) {
      return formError("This submission changed or was already reviewed. Reload it before deciding.");
    }
    if (error.message.includes("live_publication_requires_verified_integration_and_funding")) {
      return formError(
        "Live publication requires a verified payment integration and company funding. Use the Demo environment until Stages 6 & 8 are connected.",
      );
    }
    if (error.message.includes("rejection_reason_required")) {
      return formError("Provide a reason so the company knows what to fix.");
    }
    logUnexpected("companyApp.reviewSubmittedApp", error);
    return formError("We couldn't complete this review action. Try again.");
  }

  refresh();
  return {
    status: "success",
    message:
      decision === "approve"
        ? "Application approved and published to the demo catalog."
        : "Application sent back to the company with your reason.",
  };
}
