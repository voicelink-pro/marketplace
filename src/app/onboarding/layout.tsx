import { BrandMarkBackdrop } from "@/components/brand/brand-mark-backdrop";
import { PublicHeader } from "@/components/layout/public-header";
import { HeroDotGrid } from "@/modules/catalog/components/hero-dot-grid";

/**
 * Centred steps over the auth pages' dot grid, with the outlined "b" cropped
 * by the right edge. Phones skip the "b": only stray arcs would show between the cards.
 */
export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader showDashboard={false} />
      <div className="relative isolate flex flex-1 flex-col overflow-hidden">
        <HeroDotGrid />
        <BrandMarkBackdrop
          variant="outline"
          className="absolute top-1/2 -right-56 hidden size-[40rem] -translate-y-1/2 rotate-[-8deg] opacity-50 md:block"
        />
        <main className="relative mx-auto w-full max-w-[880px] flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      </div>
    </div>
  );
}
