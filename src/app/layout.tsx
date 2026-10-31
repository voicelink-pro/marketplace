import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import "./globals.css";

const plusJakartaSans = localFont({
  variable: "--font-sans",
  src: "./fonts/plus-jakarta-sans.ttf",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark only: the class keeps the existing `dark:` utilities working; globals.css sets `color-scheme: dark`.
    <html lang="en" className={`dark ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NavigationProgress>
          <TooltipProvider><Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>{children}</Suspense></TooltipProvider>
        </NavigationProgress>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
