import { Banknote } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Payouts" };

export default function CreatorPayoutsPage() {
  return (
    <>
      <PageHeader title="Payouts" description="Withdraw available earnings to your payout account." />
      <EmptyModule
        icon={Banknote}
        title="Nothing to withdraw yet"
        description="When you have available earnings, you can request a payout here. Your payout history appears here too."
      />
    </>
  );
}
