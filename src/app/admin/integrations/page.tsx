import { Plug } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Integrations" };

export default function AdminIntegrationsPage() {
  return (
    <>
      <PageHeader title="Integrations" description="Health of every company's event integration." />
      <EmptyModule
        icon={Plug}
        title="No integrations yet"
        description="Connected integrations, their last events and any errors will be listed here."
      />
    </>
  );
}
