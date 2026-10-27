import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthSwitchLink } from "@/modules/auth/components/auth-switch-link";
import { SignupForm } from "@/modules/auth/components/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    // The side comes from ?for=, so the whole card waits for the search params.
    <Suspense fallback={<Skeleton className="h-[38rem] w-full rounded-[20px]" />}>
      <SignupForm
        footer={
          <span>
            Already have an account? <AuthSwitchLink href="/login">Log in</AuthSwitchLink>
          </span>
        }
      />
    </Suspense>
  );
}
