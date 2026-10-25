import { LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Issues" };

export default function AdminIssuesPage() {
  return (
    <>
      <PageHeader title="Issues" description="Disputes, refunds and suspicious activity to look into." />
      <EmptyModule
        icon={LifeBuoy}
        title="No open issues"
        description="Problems that need a decision from the team will be listed here."
      />
    </>
  );
}
