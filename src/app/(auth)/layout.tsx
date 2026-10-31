import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { AuthBrandPanel, AuthBrandPanelFromUrl } from "@/modules/auth/components/auth-brand-panel";

/** Desktop: brand panel on the left (stays put while the form scrolls), form on the right. Phones: form only. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-dvh">
        <Suspense fallback={<AuthBrandPanel audience="creators" />}>
          <AuthBrandPanelFromUrl />
        </Suspense>
      </div>
      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-10">
          <Logo />
        </header>
        <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
