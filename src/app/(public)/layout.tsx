import { Suspense } from "react";
import { PageBrandMark } from "@/components/brand/brand-mark-backdrop";
import { AudienceNavProvider } from "@/components/layout/audience-nav-provider";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicBrandMark } from "@/components/layout/public-brand-mark";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* The header pill and the label above the hero share the page being opened between `/` and `/for-apps`. */}
      <AudienceNavProvider>
        <PublicHeader />
        <div className="relative isolate flex flex-1 flex-col overflow-clip">
          {/* The pathname suspends on routes with unresolved params; the default position is right there. */}
          <Suspense fallback={<PageBrandMark />}>
            <PublicBrandMark />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        </div>
      </AudienceNavProvider>
      <PublicFooter />
    </div>
  );
}
