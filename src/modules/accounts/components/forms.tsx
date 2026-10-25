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
import {
  createApp,
  createOrganization,
  renameOrganization,
  startCreator,
  updateDisplayName,
} from "../actions";

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

export function StartCreatorForm({ next = "" }: { next?: string }) {
  const [state, action] = useActionState(startCreator, idleFormState);
  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      <FieldGroup>
        <FormMessage state={state} />
        <Field data-invalid={invalid(state, "url")}>
          <FieldLabel htmlFor="url">Link to one of your social profiles</FieldLabel>
          <Input
            id="url"
            name="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://www.instagram.com/yourname"
            required
            defaultValue={valueFor(state, "url")}
            aria-describedby="url-hint"
            aria-invalid={invalid(state, "url")}
          />
          <FieldDescription id="url-hint">
            Instagram, TikTok, YouTube, X or any public page where you post. You can add more later.
          </FieldDescription>
          <FieldErrors state={state} field="url" />
        </Field>
        <SubmitButton size="lg" className="w-full sm:w-auto sm:self-start" pendingLabel="Saving…">
          Continue
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}

export function CreateOrganizationForm() {
  const [state, action] = useActionState(createOrganization, idleFormState);
  return (
    <form action={action} noValidate>
      <FieldGroup>
        <FormMessage state={state} />
        <Field data-invalid={invalid(state, "name")}>
          <FieldLabel htmlFor="name">Company name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="organization"
            required
            maxLength={120}
            defaultValue={valueFor(state, "name")}
            aria-invalid={invalid(state, "name")}
          />
          <FieldErrors state={state} field="name" />
        </Field>
        <SubmitButton size="lg" className="w-full sm:w-auto sm:self-start" pendingLabel="Creating…">
          Create company account
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}

export function RenameOrganizationForm({ currentName }: { currentName: string }) {
  const [state, action] = useActionState(renameOrganization, idleFormState);
  useSuccessToast(state);
  return (
    <form action={action} noValidate>
      <FieldGroup>
        {state.status === "error" ? <FormMessage state={state} /> : null}
        <Field data-invalid={invalid(state, "name")}>
          <FieldLabel htmlFor="name">Company name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="organization"
            required
            maxLength={120}
            defaultValue={valueFor(state, "name") ?? currentName}
            aria-invalid={invalid(state, "name")}
          />
          <FieldErrors state={state} field="name" />
        </Field>
        <SubmitButton className="self-start" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}

export function CreateAppForm() {
  const [state, action] = useActionState(createApp, idleFormState);
  useSuccessToast(state);
  return (
    <form action={action} noValidate>
      <FieldGroup>
        {state.status === "error" ? <FormMessage state={state} /> : null}
        <Field data-invalid={invalid(state, "name")}>
          <FieldLabel htmlFor="name">App name</FieldLabel>
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            defaultValue={valueFor(state, "name")}
            aria-describedby="app-name-hint"
            aria-invalid={invalid(state, "name")}
          />
          <FieldDescription id="app-name-hint">
            The app starts as a private draft. Nothing is published until our team reviews it.
          </FieldDescription>
          <FieldErrors state={state} field="name" />
        </Field>
        <SubmitButton className="self-start" pendingLabel="Creating…">
          Create app draft
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [state, action] = useActionState(updateDisplayName, idleFormState);
  useSuccessToast(state);
  return (
    <form action={action} noValidate>
      <FieldGroup>
        {state.status === "error" ? <FormMessage state={state} /> : null}
        <Field data-invalid={invalid(state, "displayName")}>
          <FieldLabel htmlFor="displayName">Name</FieldLabel>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            maxLength={80}
            defaultValue={valueFor(state, "displayName") ?? currentName}
            aria-invalid={invalid(state, "displayName")}
          />
          <FieldErrors state={state} field="displayName" />
        </Field>
        <SubmitButton className="self-start" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
