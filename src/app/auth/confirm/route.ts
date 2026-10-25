import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { logUnexpected } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/modules/auth/redirect";

const ALLOWED_TYPES: readonly EmailOtpType[] = ["email", "signup", "recovery", "email_change"];

function isAllowedType(value: string | null): value is EmailOtpType {
  return value !== null && (ALLOWED_TYPES as readonly string[]).includes(value);
}

/** Landing point for links in auth emails (token hash) and PKCE redirects (code). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const next = safeRedirectPath(params.get("next"));

  const supabase = await createClient();
  let error: { code?: string; message: string } | null = null;

  if (tokenHash && isAllowedType(type)) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = { message: "missing token" };
  }

  if (error) {
    if (error.code !== "otp_expired") logUnexpected("auth.confirm", error);
    redirect("/login?error=link_invalid");
  }
  redirect(next);
}
