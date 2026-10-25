"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { formError, formString, type FormState, zodFormError } from "@/lib/forms";
import { logUnexpected } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/modules/accounts/viewer";
import {
  isLocalPgliteSandboxEnabled,
  runInAuthenticatedPgliteSandbox,
} from "@/modules/catalog/local-pglite-sandbox";
import { createReferralLinkSchema, joinProgramSchema } from "./schemas";

function extractPgErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

/**
 * Joins an active program immediately (brief W-12).
 * Requires a signed-in user, at least one social profile URL, and explicit
 * acceptance of the visible program terms. Repeated clicks are idempotent.
 */
export async function joinProgram(_prev: FormState, formData: FormData): Promise<FormState> {
  const rawSlug = formString(formData, "appSlug");
  const returnTo = rawSlug ? `/apps/${encodeURIComponent(rawSlug)}` : "/";
  const viewer = await requireViewer(returnTo);

  if (!viewer.creator || viewer.creator.socialLinkCount === 0) {
    redirect(`/onboarding/creator?next=${encodeURIComponent(returnTo)}`);
  }

  const acceptedCheckbox = formData.get("acceptedTerms");
  const acceptedTerms = acceptedCheckbox === "on" || acceptedCheckbox === "true";

  const parsed = joinProgramSchema.safeParse({
    appId: formString(formData, "appId"),
    appSlug: rawSlug,
    acceptedTermsVersionId: formString(formData, "acceptedTermsVersionId"),
    acceptedTerms,
  });

  if (!parsed.success) {
    return zodFormError(parsed.error);
  }

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.join_program($1, $2, true)`, [
          parsed.data.appId,
          parsed.data.acceptedTermsVersionId,
        ]);
      });
    } catch (err) {
      const msg = extractPgErrorMessage(err);
      if (msg.includes("social_profile_required")) {
        redirect(`/onboarding/creator?next=${encodeURIComponent(returnTo)}`);
      }
      if (msg.includes("terms_acceptance_required")) {
        return formError("Accept the visible program terms before joining.", {
          fieldErrors: { acceptedTerms: ["Accept the visible program terms before joining."] },
        });
      }
      if (msg.includes("stale_or_invalid_terms_version")) {
        return formError(
          "The program terms were just updated. Reload the page to review the current terms.",
        );
      }
      if (msg.includes("app_not_published")) {
        return formError("This program is not currently open to new creators.");
      }
      logUnexpected("programs.joinProgram", err);
      return formError("We couldn't join this program right now. Try again.");
    }

    redirect(`/creator/programs/${encodeURIComponent(parsed.data.appSlug)}?joined=1`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_program", {
    p_app_id: parsed.data.appId,
    p_accepted_terms_version_id: parsed.data.acceptedTermsVersionId,
    p_accepted_terms: true,
  });

  if (error) {
    if (error.message.includes("social_profile_required")) {
      redirect(`/onboarding/creator?next=${encodeURIComponent(returnTo)}`);
    }
    if (error.message.includes("terms_acceptance_required")) {
      return formError("Accept the visible program terms before joining.", {
        fieldErrors: { acceptedTerms: ["Accept the visible program terms before joining."] },
      });
    }
    if (error.message.includes("stale_or_invalid_terms_version")) {
      return formError(
        "The program terms were just updated. Reload the page to review the current terms.",
      );
    }
    if (error.message.includes("app_not_published")) {
      return formError("This program is not currently open to new creators.");
    }
    logUnexpected("programs.joinProgram", error);
    return formError("We couldn't join this program right now. Try again.");
  }

  redirect(`/creator/programs/${encodeURIComponent(parsed.data.appSlug)}?joined=1`);
}

/**
 * Creates a named referral link for one of the creator's joined programs.
 * Allowed redirect destinations come strictly from the app's published release.
 */
export async function createReferralLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/creator/links");
  const values = {
    membershipId: formString(formData, "membershipId"),
    label: formString(formData, "label"),
    channel: formString(formData, "channel"),
    destinationKind: formString(formData, "destinationKind"),
  };

  const parsed = createReferralLinkSchema.safeParse(values);
  if (!parsed.success) {
    return zodFormError(parsed.error, values);
  }

  if (isLocalPgliteSandboxEnabled()) {
    try {
      await runInAuthenticatedPgliteSandbox(viewer.userId, async (tx) => {
        await tx.query(`select public.create_referral_link($1, $2, $3, $4)`, [
          parsed.data.membershipId,
          parsed.data.label,
          parsed.data.channel,
          parsed.data.destinationKind,
        ]);
      });
      refresh();
      return { status: "success", message: `Link “${parsed.data.label}” created.` };
    } catch (err) {
      const msg = extractPgErrorMessage(err);
      if (msg.includes("duplicate_link_label")) {
        return formError("You already have a link with this name for this app.", {
          fieldErrors: { label: ["Choose a different name for this link."] },
          values,
        });
      }
      if (msg.includes("destination_not_available_for_app")) {
        return formError("That destination isn't available for this app.", {
          fieldErrors: { destinationKind: ["Choose one of the app's available destinations."] },
          values,
        });
      }
      if (msg.includes("referral_link_limit_reached")) {
        return formError("You've reached the maximum of 25 named links for this program.", {
          values,
        });
      }
      if (msg.includes("not_allowed")) {
        return formError("You can only create links in your own programs.");
      }
      logUnexpected("programs.createReferralLink", err);
      return formError("We couldn't create this link. Try again.", { values });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_referral_link", {
    p_membership_id: parsed.data.membershipId,
    p_label: parsed.data.label,
    p_channel: parsed.data.channel,
    p_destination_kind: parsed.data.destinationKind,
  });

  if (error) {
    if (error.message.includes("duplicate_link_label")) {
      return formError("You already have a link with this name for this app.", {
        fieldErrors: { label: ["Choose a different name for this link."] },
        values,
      });
    }
    if (error.message.includes("destination_not_available_for_app")) {
      return formError("That destination isn't available for this app.", {
        fieldErrors: { destinationKind: ["Choose one of the app's available destinations."] },
        values,
      });
    }
    if (error.message.includes("referral_link_limit_reached")) {
      return formError("You've reached the maximum of 25 named links for this program.", {
        values,
      });
    }
    if (error.message.includes("not_allowed")) {
      return formError("You can only create links in your own programs.");
    }
    logUnexpected("programs.createReferralLink", error);
    return formError("We couldn't create this link. Try again.", { values });
  }

  refresh();
  return { status: "success", message: `Link “${parsed.data.label}” created.` };
}
