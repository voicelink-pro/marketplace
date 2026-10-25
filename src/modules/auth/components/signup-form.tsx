"use client";

import { MailCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { FieldErrors, FormMessage, valueFor } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState, type FormState } from "@/lib/forms";
import { signUp } from "../actions";
import { PASSWORD_MIN_LENGTH } from "../schemas";

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

export function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, action] = useActionState(signUp, idleFormState);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted">
          <MailCheck aria-hidden className="size-5 text-primary" />
        </span>
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      <FieldGroup>
        <FormMessage state={state} />
        <Field data-invalid={invalid(state, "displayName")}>
          <FieldLabel htmlFor="displayName">Name</FieldLabel>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            maxLength={80}
            defaultValue={valueFor(state, "displayName")}
            aria-invalid={invalid(state, "displayName")}
          />
          <FieldErrors state={state} field="displayName" />
        </Field>
        <Field data-invalid={invalid(state, "email")}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={valueFor(state, "email")}
            aria-invalid={invalid(state, "email")}
          />
          <FieldErrors state={state} field="email" />
        </Field>
        <Field data-invalid={invalid(state, "password")}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            aria-describedby="password-hint"
            aria-invalid={invalid(state, "password")}
          />
          <FieldDescription id="password-hint">
            At least {PASSWORD_MIN_LENGTH} characters, with letters and numbers.
          </FieldDescription>
          <FieldErrors state={state} field="password" />
        </Field>
        <SubmitButton size="lg" className="w-full" pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
