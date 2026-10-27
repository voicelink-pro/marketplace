import { Logo } from "@/components/brand/logo";
import { PublicHeader } from "@/components/layout/public-header";
import { siteConfig } from "@/config/site";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>
      </footer>
    </div>
  );
}
