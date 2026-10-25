import { ChartNoAxesColumn } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Referrals" };

export default function CompanyReferralsPage() {
  return (
    <>
      <PageHeader title="Referrals" description="Customers creators brought to your app." />
      <EmptyModule
        icon={ChartNoAxesColumn}
        title="No referred customers yet"
        description="Customers appear here once your app reports sign-ups made through creator links or codes."
      />
    </>
  );
}
