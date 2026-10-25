import { Users } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Referrals" };

export default function CreatorReferralsPage() {
  return (
    <>
      <PageHeader
        title="Referrals"
        description="Customers who signed up through your links or code. We never show their personal details."
      />
      <EmptyModule
        icon={Users}
        title="No referred customers yet"
        description="Each customer appears with an anonymous ID, their payments and your commission."
      />
    </>
  );
}
