import { type NextRequest, NextResponse } from "next/server";
import { LAST_CONTEXT_COOKIE, parseWorkspaceContext, resolveHomePath } from "@/modules/accounts/home";
import { getViewer } from "@/modules/accounts/viewer";
import { SANDBOX_USER_COOKIE } from "@/modules/catalog/local-pglite-sandbox";

/** Sends a signed-in user to the right workspace. */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SANDBOX_USER_COOKIE);
    return response;
  }

  const destination = resolveHomePath(
    {
      isAdmin: viewer.isAdmin,
      isCreator: viewer.creator !== null,
      hasOrganization: viewer.organizations.length > 0,
    },
    parseWorkspaceContext(request.cookies.get(LAST_CONTEXT_COOKIE)?.value),
  );

  return NextResponse.redirect(new URL(destination, request.url));
}
