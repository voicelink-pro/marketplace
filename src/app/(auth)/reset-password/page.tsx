import type { Metadata } from "next";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { NewPasswordForm } from "@/modules/auth/components/password-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" description="You'll stay logged in after saving it.">
      <NewPasswordForm />
    </AuthCard>
  );
}
