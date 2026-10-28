import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CatalogSection } from "@/modules/catalog/components/catalog-section";

export const metadata: Metadata = { title: "Discover apps" };

export default function CreatorDiscoverPage({ searchParams }: PageProps<"/creator/discover">) {
  return (
    <>
      <PageHeader
        title="Discover apps"
        description="Find an app that fits your audience and join its program to get your link and code."
      />
      <CatalogSection searchParams={searchParams} basePath="/creator/discover" showTitle={false} />
    </>
  );
}
