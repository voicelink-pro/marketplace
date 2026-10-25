import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { LoginForm } from "@/modules/auth/components/login-form";
import { isLocalPgliteSandboxEnabled } from "@/modules/catalog/local-pglite-sandbox";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  const sandboxEnabled = isLocalPgliteSandboxEnabled();

  return (
    <AuthCard
      title="Log in"
      description="Welcome back. Log in to your creator or company workspace."
      footer={
        <span>
          New here?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </span>
      }
    >
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <LoginForm sandboxEnabled={sandboxEnabled} />
      </Suspense>
    </AuthCard>
  );
}
