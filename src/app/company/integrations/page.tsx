import { Plug } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Integrations" };

export default function CompanyIntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="How your app tells us about sign-ups and subscription payments."
      />
      <EmptyModule
        icon={Plug}
        title="No integrations connected"
        description="Your program can go live only when an integration is working and your account is funded."
      />
    </>
  );
}
