import { HandCoins } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Earnings" };

export default function CreatorEarningsPage() {
  return (
    <>
      <PageHeader
        title="Earnings"
        description="Commission from every subscription payment your referred customers make."
      />
      <EmptyModule
        icon={HandCoins}
        title="No earnings yet"
        description="Commission builds up during the month and becomes available after the month closes and the company has funded it."
      />
    </>
  );
}
