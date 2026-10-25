export type WorkspaceContext = "creator" | "company";

export const LAST_CONTEXT_COOKIE = "mp_last_context";

export type ContextAvailability = {
  isAdmin: boolean;
  isCreator: boolean;
  hasOrganization: boolean;
};

export function parseWorkspaceContext(value: unknown): WorkspaceContext | undefined {
  return value === "creator" || value === "company" ? value : undefined;
}

/** Where a signed-in user lands when they open the app without a target. */
export function resolveHomePath(
  contexts: ContextAvailability,
  lastUsed?: WorkspaceContext,
): string {
  if (lastUsed === "company" && contexts.hasOrganization) return "/company";
  if (lastUsed === "creator" && contexts.isCreator) return "/creator";
  if (contexts.isCreator) return "/creator";
  if (contexts.hasOrganization) return "/company";
  if (contexts.isAdmin) return "/admin";
  return "/onboarding";
}
