import { Suspense } from "react";
import { getDefaultHomeAudience } from "@/modules/catalog/audience-server";
import { type HomeSection, HomeSectionLink } from "@/modules/catalog/components/home-section-link";

type Props = { section: HomeSection; className?: string; children: React.ReactNode };

async function ResolvedSectionLink(props: Props) {
  return <HomeSectionLink {...props} defaultAudience={await getDefaultHomeAudience()} />;
}

/**
 * HomeSectionLink with the viewer's default audience, for the header and
 * footer. The session streams in; until then the link assumes creators.
 */
export function AudienceSectionLink(props: Props) {
  return (
    <Suspense fallback={<HomeSectionLink {...props} defaultAudience={null} />}>
      <ResolvedSectionLink {...props} />
    </Suspense>
  );
}
