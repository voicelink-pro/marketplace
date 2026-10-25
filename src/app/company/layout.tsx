import { Suspense } from "react";
import { CompanyGate } from "@/components/layout/gates";
import { PanelShell, PanelSkeleton } from "@/components/layout/panel-shell";

export default function CompanyLayout({ children }: LayoutProps<"/company">) {
  return (
    <PanelShell area="company">
      <Suspense fallback={<PanelSkeleton />}>
        <CompanyGate>{children}</CompanyGate>
      </Suspense>
    </PanelShell>
  );
}
