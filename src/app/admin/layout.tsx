import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "@/components/layout/gates";
import { PanelShell, PanelSkeleton } from "@/components/layout/panel-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <PanelShell area="admin">
      <Suspense fallback={<PanelSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </PanelShell>
  );
}
