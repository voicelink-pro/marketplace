"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
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
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/modules/accounts/social";
import { createReferralLink } from "../actions";
import type { AllowedAppDestination } from "../queries";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ProgramLinkOption = {
  membershipId: string;
  appName: string;
  availableDestinations: AllowedAppDestination[];
};

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

export function CreateReferralLinkForm({
  programs,
  fixedMembershipId,
  defaultChannel = "instagram",
}: {
  programs: ProgramLinkOption[];
  fixedMembershipId?: string;
  defaultChannel?: SocialPlatform;
}) {
  const [state, action] = useActionState(createReferralLink, idleFormState);
  useSuccessToast(state);

  const initialMembershipId = fixedMembershipId ?? programs[0]?.membershipId ?? "";
  const [selectedMembershipId, setSelectedMembershipId] = useState(initialMembershipId);

  const activeProgram =
    programs.find((program) => program.membershipId === selectedMembershipId) ?? programs[0];
  const destinations = activeProgram?.availableDestinations ?? [];

  if (!activeProgram || destinations.length === 0) {
    return null;
  }

  return (
    <form action={action} noValidate>
      {fixedMembershipId ? (
        <input type="hidden" name="membershipId" value={fixedMembershipId} />
      ) : null}

      <FieldGroup>
        {state.status === "error" ? <FormMessage state={state} /> : null}

        <div
          className={
            fixedMembershipId
              ? "grid gap-4 sm:grid-cols-3"
              : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          }
        >
          {!fixedMembershipId ? (
            <Field data-invalid={invalid(state, "membershipId")}>
              <FieldLabel htmlFor="link-membership">Program</FieldLabel>
              <select
                id="link-membership"
                name="membershipId"
                value={selectedMembershipId}
                onChange={(event) => setSelectedMembershipId(event.currentTarget.value)}
                className={selectClassName}
              >
                {programs.map((program) => (
                  <option key={program.membershipId} value={program.membershipId}>
                    {program.appName}
                  </option>
                ))}
              </select>
              <FieldErrors state={state} field="membershipId" />
            </Field>
          ) : null}

          <Field data-invalid={invalid(state, "label")}>
            <FieldLabel htmlFor="link-label">Link name</FieldLabel>
            <Input
              id="link-label"
              name="label"
              required
              maxLength={80}
              placeholder="e.g. Instagram bio, TikTok, Video 1"
              defaultValue={valueFor(state, "label")}
              aria-invalid={invalid(state, "label")}
            />
            <FieldErrors state={state} field="label" />
          </Field>

          <Field data-invalid={invalid(state, "channel")}>
            <FieldLabel htmlFor="link-channel">Channel</FieldLabel>
            <select
              id="link-channel"
              name="channel"
              defaultValue={valueFor(state, "channel") ?? defaultChannel}
              className={selectClassName}
            >
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {SOCIAL_PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
            <FieldErrors state={state} field="channel" />
          </Field>

          <Field data-invalid={invalid(state, "destinationKind")}>
            <FieldLabel htmlFor="link-destination">App destination</FieldLabel>
            <select
              id="link-destination"
              name="destinationKind"
              defaultValue={destinations[0]?.kind}
              className={selectClassName}
            >
              {destinations.map((dest) => (
                <option key={dest.kind} value={dest.kind}>
                  {dest.label}
                </option>
              ))}
            </select>
            <FieldErrors state={state} field="destinationKind" />
          </Field>
        </div>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <FieldDescription>
            Redirects only to verified URLs configured by {activeProgram.appName} (
            {destinations.map((d) => d.label).join(", ")}).
          </FieldDescription>

          <SubmitButton className="sm:self-end" pendingLabel="Creating link…">
            <Plus data-icon="inline-start" />
            Create named link
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
