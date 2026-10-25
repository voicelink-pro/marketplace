import { PublicHeader } from "@/components/layout/public-header";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
