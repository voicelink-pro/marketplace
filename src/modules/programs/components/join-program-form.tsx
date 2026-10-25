"use client";

import { Megaphone } from "lucide-react";
import { useActionState, useId } from "react";
import { FieldErrors, FormMessage } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldGroup } from "@/components/ui/field";
import { idleFormState } from "@/lib/forms";
import { joinProgram } from "../actions";

export function JoinProgramForm({
  appId,
  appSlug,
  appName,
  termsVersionId,
  termsVersionNumber,
}: {
  appId: string;
  appSlug: string;
  appName: string;
  termsVersionId: string;
  termsVersionNumber: number;
}) {
  const checkboxId = useId();
  const [state, action] = useActionState(joinProgram, idleFormState);
  const hasTermsError = Boolean(
    state.status === "error" && state.fieldErrors?.acceptedTerms,
  );

  return (
    <form action={action} noValidate>
      <input type="hidden" name="appId" value={appId} />
      <input type="hidden" name="appSlug" value={appSlug} />
      <input type="hidden" name="acceptedTermsVersionId" value={termsVersionId} />

      <FieldGroup>
        <FormMessage state={state} />

        <Field data-invalid={hasTermsError}>
          <label
            htmlFor={checkboxId}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-foreground transition-colors hover:bg-muted/70"
          >
            <input
              id={checkboxId}
              name="acceptedTerms"
              type="checkbox"
              required
              aria-invalid={hasTermsError}
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
            />
            <span>
              I accept the{" "}
              <a
                href="#program-terms"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                {appName} program terms (Terms v{termsVersionNumber})
              </a>{" "}
              and subscription commission rates shown on this page.
            </span>
          </label>
          <FieldErrors state={state} field="acceptedTerms" />
        </Field>

        <SubmitButton size="lg" className="w-full" pendingLabel="Joining program…">
          <Megaphone data-icon="inline-start" />
          Join program & get link
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
