"use client";

import { useActionState } from "react";
import {
  FieldErrors,
  FormMessage,
  useSuccessToast,
  valueFor,
} from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState, type FormState } from "@/lib/forms";
import { requestPasswordReset, updatePassword } from "../actions";
import { PASSWORD_MIN_LENGTH } from "../schemas";

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, idleFormState);
  return (
    <form action={action} noValidate>
      <FieldGroup>
        <FormMessage state={state} />
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
        <SubmitButton size="lg" className="w-full" pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}

export function NewPasswordForm({
  submitLabel = "Save new password",
  stayOnPage = false,
}: {
  submitLabel?: string;
  /** Show a confirmation instead of redirecting to the dashboard after saving. */
  stayOnPage?: boolean;
}) {
  const [state, action] = useActionState(updatePassword, idleFormState);
  useSuccessToast(state);
  return (
    <form action={action} noValidate>
      {stayOnPage ? <input type="hidden" name="stay" value="1" /> : null}
      <FieldGroup>
        {state.status === "error" ? <FormMessage state={state} /> : null}
        <Field data-invalid={invalid(state, "password")}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            aria-describedby="new-password-hint"
            aria-invalid={invalid(state, "password")}
          />
          <FieldDescription id="new-password-hint">
            At least {PASSWORD_MIN_LENGTH} characters, with letters and numbers.
          </FieldDescription>
          <FieldErrors state={state} field="password" />
        </Field>
        <Field data-invalid={invalid(state, "confirmPassword")}>
          <FieldLabel htmlFor="confirmPassword">Repeat new password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={invalid(state, "confirmPassword")}
          />
          <FieldErrors state={state} field="confirmPassword" />
        </Field>
        <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
