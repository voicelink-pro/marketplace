import { formatCommissionRange } from "@/lib/money";
import { getViewer, primaryOrganization } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getCompanyWorkspaceApp } from "@/modules/company-app/queries";
import { listCreatorProgramMemberships } from "@/modules/programs/queries";
import type { PanelArea } from "./nav-config";
import { PanelSearchItems, type SearchItem } from "./panel-search";

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

async function loadItems(area: PanelArea): Promise<SearchItem[]> {
  const viewer = await getViewer();
  if (!viewer) return [];
  if (area === "creator") {
    const programs = await listCreatorProgramMemberships(viewer.userId);
    return programs.map((program) => ({
      href: `/creator/programs/${program.slug}`,
      title: program.appName,
      subtitle: `${program.organizationName} · ${formatCommissionRange(program.minCommissionBps, program.maxCommissionBps)}`,
      initial: initialOf(program.appName),
    }));
  }
  if (area === "company") {
    const organization = primaryOrganization(viewer);
    const app = organization ? await getCompanyWorkspaceApp(organization.id, organization.name) : null;
    if (!app) return [];
    return [{ href: "/company/app", title: app.name, subtitle: "Your app · App profile", initial: initialOf(app.name) }];
  }
  return [];
}

/**
 * The creator's programs or the company's app for the search palette, from
 * the queries the pages already use. Render inside <Suspense>; a failure only
 * leaves the group out.
 */
export async function PanelSearchSource({ area }: { area: PanelArea }) {
  const items = await settled(() => loadItems(area));
  return <PanelSearchItems items={items ?? []} />;
}
