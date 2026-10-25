import { Suspense } from "react";
import { CreatorGate } from "@/components/layout/gates";
import { PanelShell, PanelSkeleton } from "@/components/layout/panel-shell";

export default function CreatorLayout({ children }: LayoutProps<"/creator">) {
  return (
    <PanelShell area="creator">
      <Suspense fallback={<PanelSkeleton />}>
        <CreatorGate>{children}</CreatorGate>
      </Suspense>
    </PanelShell>
  );
}
