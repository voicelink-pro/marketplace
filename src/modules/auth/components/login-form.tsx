"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { FieldErrors, FormMessage, valueFor } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState } from "@/lib/forms";
import { signIn, signInSandboxAccount } from "../actions";

const LINK_ERRORS: Record<string, string> = {
  link_invalid: "That link is invalid or has expired. Request a new one.",
};

const SANDBOX_QUICK_ACCOUNTS = [
  {
    email: "demo@example.com",
    label: "Creator + Company + Admin",
    defaultNext: "/creator",
  },
  {
    email: "creator@example.com",
    label: "Creator only",
    defaultNext: "/creator",
  },
  {
    email: "company@example.com",
    label: "Company only",
    defaultNext: "/company",
  },
] as const;

export function LoginForm({ sandboxEnabled = false }: { sandboxEnabled?: boolean }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const linkError = LINK_ERRORS[searchParams.get("error") ?? ""];
  const [state, action] = useActionState(signIn, idleFormState);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} noValidate>
        <input type="hidden" name="next" value={next} />
        <FieldGroup>
          {linkError && state.status === "idle" ? (
            <Alert variant="destructive">
              <AlertDescription>{linkError}</AlertDescription>
            </Alert>
          ) : null}
          <FormMessage state={state} />
          <Field data-invalid={Boolean(state.status === "error" && state.fieldErrors?.email)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={valueFor(state, "email")}
              aria-invalid={Boolean(state.status === "error" && state.fieldErrors?.email)}
            />
            <FieldErrors state={state} field="email" />
          </Field>
          <Field data-invalid={Boolean(state.status === "error" && state.fieldErrors?.password)}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(state.status === "error" && state.fieldErrors?.password)}
            />
            <FieldErrors state={state} field="password" />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingLabel="Logging in…">
            Log in
          </SubmitButton>
        </FieldGroup>
      </form>

      {sandboxEnabled ? (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/50 p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">Local PGlite Sandbox</span>
            <Badge variant="secondary">Docker offline</Badge>
          </div>
          <p className="text-muted-foreground">
            One-click sign-in to inspect the Creator, Company, and Admin panels without Docker:
          </p>
          <div className="flex flex-col gap-1.5">
            {SANDBOX_QUICK_ACCOUNTS.map((acct) => (
              <form key={acct.email} action={signInSandboxAccount}>
                <input type="hidden" name="email" value={acct.email} />
                <input type="hidden" name="next" value={next || acct.defaultNext} />
                <SubmitButton
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  pendingLabel="Opening…"
                >
                  <span>{acct.label}</span>
                  <span className="text-muted-foreground">{acct.email}</span>
                </SubmitButton>
              </form>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
