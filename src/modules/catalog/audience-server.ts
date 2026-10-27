import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { LAST_CONTEXT_COOKIE, parseWorkspaceContext, resolveHomePath } from "@/modules/accounts/home";
import { getViewer } from "@/modules/accounts/viewer";
import type { HomeAudience } from "./audience";

/**
 * What the home page shows without `?for=`: creators, or apps for a signed-in
 * user whom /dashboard would send to the company panel. getViewer is cached
 * per request, so the header and the page share one read.
 */
export const getDefaultHomeAudience = cache(async (): Promise<HomeAudience> => {
  const viewer = await getViewer();
  if (!viewer) return "creators";
  const lastUsed = parseWorkspaceContext((await cookies()).get(LAST_CONTEXT_COOKIE)?.value);
  const homePath = resolveHomePath(
    {
      isAdmin: viewer.isAdmin,
      isCreator: viewer.creator !== null,
      hasOrganization: viewer.organizations.length > 0,
    },
    lastUsed,
  );
  return homePath === "/company" ? "apps" : "creators";
});
