import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { AuthSwitchLink } from "@/modules/auth/components/auth-switch-link";
import { SignupForm } from "@/modules/auth/components/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="One account works for promoting apps and for listing your own."
      footer={
        <span>
          Already have an account?{" "}
          <AuthSwitchLink href="/login">Log in</AuthSwitchLink>
        </span>
      }
    >
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SignupForm />
      </Suspense>
    </AuthCard>
  );
}
