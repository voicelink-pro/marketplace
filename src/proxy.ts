import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { LAST_CONTEXT_COOKIE } from "@/modules/accounts/home";

const SIGNED_IN_PREFIXES = ["/creator", "/company", "/admin", "/onboarding", "/account", "/reset-password"];
const CACHE_HEADERS = ["cache-control", "expires", "pragma"];
const SANDBOX_USER_COOKIE = "mp_sandbox_uid";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Copies refreshed auth cookies and no-cache headers onto a different response. */
function withSession(target: NextResponse, source: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  for (const header of CACHE_HEADERS) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}

/**
 * Refreshes the Supabase session and performs optimistic redirects for
 * protected workspaces. `/login` and `/signup` are never redirected here so a
 * stale cookie can never cause a redirect loop with `/dashboard`.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let signedIn = false;

  if (process.env.LOCAL_PGLITE_SANDBOX === "1") {
    const sandboxUid = request.cookies.get(SANDBOX_USER_COOKIE)?.value ?? "";
    signedIn = UUID_RE.test(sandboxUid);
  } else {
    const env = getPublicEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
            for (const [key, value] of Object.entries(headers ?? {})) {
              response.headers.set(key, value);
            }
          },
        },
      },
    );

    // Must run right after creating the client: it verifies and refreshes the token.
    const { data } = await supabase.auth.getClaims();
    signedIn = typeof data?.claims?.sub === "string";
  }
  const { pathname, search } = request.nextUrl;

  if (!signedIn && matchesPrefix(pathname, SIGNED_IN_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return withSession(NextResponse.redirect(url), response);
  }

  const context = matchesPrefix(pathname, ["/creator"])
    ? "creator"
    : matchesPrefix(pathname, ["/company"])
      ? "company"
      : undefined;
  if (signedIn && context && request.cookies.get(LAST_CONTEXT_COOKIE)?.value !== context) {
    response.cookies.set(LAST_CONTEXT_COOKIE, context, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
