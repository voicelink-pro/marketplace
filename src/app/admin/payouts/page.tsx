import { Banknote } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";

export const metadata: Metadata = { title: "Payouts" };

export default function AdminPayoutsPage() {
  return (
    <>
      <PageHeader title="Payouts" description="Creator payout requests and their status." />
      <EmptyModule
        icon={Banknote}
        title="No payouts yet"
        description="Payout requests from creators will be listed here with their status at the payment provider."
      />
    </>
  );
}
