import { Landmark } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Finance" };

export default function AdminFinancePage() {
  return (
    <>
      <PageHeader
        title="Finance"
        description="Company funding, commission owed and platform fees."
      />
      <EmptyModule
        icon={Landmark}
        title="No financial activity yet"
        description="Balances and ledger entries appear here once companies fund their programs."
      />
    </>
  );
}
