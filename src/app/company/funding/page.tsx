import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Funding & statements" };

export default function CompanyFundingPage() {
  return (
    <>
      <PageHeader
        title="Funding & statements"
        description="Funds you add up front to pay creator commission, and your monthly statements."
      />
      <EmptyModule
        icon={Wallet}
        title="No funding activity yet"
        description="Deposits, automatic top-ups and monthly statements will be listed here."
      />
    </>
  );
}
