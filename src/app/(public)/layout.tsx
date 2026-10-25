import { PublicHeader } from "@/components/layout/public-header";
import { siteConfig } from "@/config/site";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          {siteConfig.name}
        </div>
      </footer>
    </div>
  );
}
