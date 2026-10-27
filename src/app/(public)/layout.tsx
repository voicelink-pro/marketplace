import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { HomeAudienceProvider } from "@/modules/catalog/components/home-audience";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header toggle and home page content share the pending audience while it loads. */}
      <HomeAudienceProvider>
        <PublicHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </HomeAudienceProvider>
      <PublicFooter />
    </div>
  );
}
