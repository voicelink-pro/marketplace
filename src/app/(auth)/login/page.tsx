import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { AuthSwitchLink } from "@/modules/auth/components/auth-switch-link";
import { LoginForm } from "@/modules/auth/components/login-form";
import { isLocalPgliteSandboxEnabled } from "@/modules/catalog/local-pglite-sandbox";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  const sandboxEnabled = isLocalPgliteSandboxEnabled();

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your creator or app workspace."
      footer={
        <span>
          New here?{" "}
          <AuthSwitchLink href="/signup">Create an account</AuthSwitchLink>
        </span>
      }
    >
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <LoginForm sandboxEnabled={sandboxEnabled} />
      </Suspense>
    </AuthCard>
  );
}
