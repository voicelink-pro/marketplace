"use server";

import { redirect } from "next/navigation";
import { getPublicEnv } from "@/lib/env";
import { formError, formString, type FormState, zodFormError } from "@/lib/forms";
import { logUnexpected } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import {
  clearSandboxSessionUserId,
  getSandboxSessionUserId,
  isLocalPgliteSandboxEnabled,
  runInServiceRolePgliteSandbox,
  setSandboxSessionUserId,
} from "@/modules/catalog/local-pglite-sandbox";
import { safeRedirectPath } from "./redirect";
import {
  newPasswordFormSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

const RATE_LIMITED = "Too many attempts. Wait a minute and try again.";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: formString(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: formString(formData, "password") });
  if (!parsed.success) return zodFormError(parsed.error, values);

  if (isLocalPgliteSandboxEnabled()) {
    const userId = await runInServiceRolePgliteSandbox(async (tx) => {
      const res = await tx.query<{ id: string }>(
        `select id from auth.users where lower(email) = $1 and sandbox_password = $2 limit 1`,
        [parsed.data.email, parsed.data.password],
      );
      return res.rows[0]?.id ?? null;
    });

    if (!userId) {
      return formError("Email or password is incorrect.", { values });
    }

    await setSandboxSessionUserId(userId);
    redirect(safeRedirectPath(formString(formData, "next")));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return formError("Confirm your email first. Open the link we sent to your inbox.", { values });
    }
    if (error.status === 429) return formError(RATE_LIMITED, { values });
    if (error.code !== "invalid_credentials") logUnexpected("auth.signIn", error);
    return formError("Email or password is incorrect.", { values });
  }

  redirect(safeRedirectPath(formString(formData, "next")));
}

export async function signInSandboxAccount(formData: FormData): Promise<void> {
  if (!isLocalPgliteSandboxEnabled()) {
    redirect("/login");
  }
  const email = formString(formData, "email").toLowerCase();
  const next = safeRedirectPath(formString(formData, "next"), "/dashboard");

  const userId = await runInServiceRolePgliteSandbox(async (tx) => {
    const res = await tx.query<{ id: string }>(
      `select id from auth.users where lower(email) = $1 limit 1`,
      [email],
    );
    return res.rows[0]?.id ?? null;
  });

  if (userId) {
    await setSandboxSessionUserId(userId);
  }
  redirect(next);
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    displayName: formString(formData, "displayName"),
    email: formString(formData, "email"),
  };
  const parsed = signUpSchema.safeParse({ ...values, password: formString(formData, "password") });
  if (!parsed.success) return zodFormError(parsed.error, values);

  const rawNext = formString(formData, "next");
  const nextOnboarding =
    rawNext && rawNext.startsWith("/apps/")
      ? `/onboarding?next=${encodeURIComponent(safeRedirectPath(rawNext))}`
      : "/onboarding";

  if (isLocalPgliteSandboxEnabled()) {
    const userId = await runInServiceRolePgliteSandbox(async (tx) => {
      const existing = await tx.query<{ id: string }>(
        `select id from auth.users where lower(email) = $1 limit 1`,
        [parsed.data.email],
      );
      if (existing.rows[0]) {
        return existing.rows[0].id;
      }
      const inserted = await tx.query<{ id: string }>(
        `insert into auth.users (email, sandbox_password, raw_user_meta_data)
         values ($1, $2, $3::jsonb)
         returning id`,
        [
          parsed.data.email,
          parsed.data.password,
          JSON.stringify({ display_name: parsed.data.displayName }),
        ],
      );
      return inserted.rows[0]!.id;
    });

    await setSandboxSessionUserId(userId);
    redirect(nextOnboarding);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?next=${encodeURIComponent(nextOnboarding)}`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return formError("Choose a stronger password.", {
        fieldErrors: { password: ["This password is too easy to guess."] },
        values,
      });
    }
    if (error.status === 429) return formError(RATE_LIMITED, { values });
    logUnexpected("auth.signUp", error);
    return formError("We couldn't create your account. Try again in a moment.", { values });
  }

  if (data.session) redirect(nextOnboarding);
  // Same response whether or not the email already has an account.
  return {
    status: "success",
    message: `We sent a confirmation link to ${parsed.data.email}. Open it to finish creating your account.`,
  };
}

export async function signOut(): Promise<void> {
  if (isLocalPgliteSandboxEnabled()) {
    await clearSandboxSessionUserId();
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) logUnexpected("auth.signOut", error);
  redirect("/");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: formString(formData, "email") };
  const parsed = passwordResetRequestSchema.safeParse(values);
  if (!parsed.success) return zodFormError(parsed.error, values);

  if (!isLocalPgliteSandboxEnabled()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getPublicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
    });
    if (error?.status === 429) return formError(RATE_LIMITED, { values });
    if (error) logUnexpected("auth.requestPasswordReset", error);
  }

  // Never reveal whether the address has an account.
  return {
    status: "success",
    message: `If an account exists for ${parsed.data.email}, we sent a link to reset the password.`,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordFormSchema.safeParse({
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });
  if (!parsed.success) return zodFormError(parsed.error);

  if (isLocalPgliteSandboxEnabled()) {
    const userId = await getSandboxSessionUserId();
    if (!userId) {
      return formError("Your reset link has expired. Request a new one.");
    }
    const same = await runInServiceRolePgliteSandbox(async (tx) => {
      const current = await tx.query<{ sandbox_password: string }>(
        `select sandbox_password from auth.users where id = $1 limit 1`,
        [userId],
      );
      if (current.rows[0]?.sandbox_password === parsed.data.password) {
        return true;
      }
      await tx.query(`update auth.users set sandbox_password = $1 where id = $2`, [
        parsed.data.password,
        userId,
      ]);
      return false;
    });

    if (same) {
      return formError("Choose a password you haven't used for this account.", {
        fieldErrors: { password: ["This is your current password."] },
      });
    }

    if (formString(formData, "stay") === "1") {
      return { status: "success", message: "Password updated." };
    }
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return formError("Your reset link has expired. Request a new one.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return formError("Choose a password you haven't used for this account.", {
        fieldErrors: { password: ["This is your current password."] },
      });
    }
    if (error.code === "weak_password") {
      return formError("Choose a stronger password.", {
        fieldErrors: { password: ["This password is too easy to guess."] },
      });
    }
    if (error.code === "reauthentication_needed") {
      return formError("For your security, log out, log in again and then change your password.");
    }
    logUnexpected("auth.updatePassword", error);
    return formError("We couldn't update your password. Try again.");
  }

  if (formString(formData, "stay") === "1") {
    return { status: "success", message: "Password updated." };
  }
  redirect("/dashboard");
}
