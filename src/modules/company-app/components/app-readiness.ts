import type { CompanyWorkspaceApp } from "../queries";
import { checkAppSubmissionReadiness } from "../schemas";

export type Checklist = ReturnType<typeof checkAppSubmissionReadiness>;

/** Publication checklist for a saved draft; plain function so server pages can call it too. */
export function appReadiness(app: CompanyWorkspaceApp): Checklist {
  return checkAppSubmissionReadiness({
    name: app.name,
    tagline: app.tagline,
    description: app.description,
    categories: app.categories,
    platforms: app.platforms,
    languages: app.languages,
    websiteUrl: app.websiteUrl,
    iosStoreUrl: app.iosStoreUrl,
    androidStoreUrl: app.androidStoreUrl,
    coverImageUrl: app.coverImageUrl,
    logoUrl: app.logoUrl,
    termsText: app.termsText,
    activePlanCount: app.plans.filter((p) => p.isActive).length,
  });
}
