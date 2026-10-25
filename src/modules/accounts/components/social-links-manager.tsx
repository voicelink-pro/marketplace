"use client";

import { ExternalLink, Plus, Trash } from "lucide-react";
import { useActionState } from "react";
import {
  FieldErrors,
  FormMessage,
  useSuccessToast,
  valueFor,
} from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState } from "@/lib/forms";
import { addSocialLink, removeSocialLink } from "../actions";
import { MAX_SOCIAL_LINKS, SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "../social";

export type SocialLinkView = { id: string; platform: SocialPlatform; url: string };

function RemoveLinkButton({ link }: { link: SocialLinkView }) {
  const [state, action] = useActionState(removeSocialLink, idleFormState);
  useSuccessToast(state);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={link.id} />
      <SubmitButton
        variant="ghost"
        size="icon-lg"
        aria-label={`Remove ${SOCIAL_PLATFORM_LABELS[link.platform]} link`}
      >
        <Trash />
      </SubmitButton>
      {state.status === "error" ? (
        <span role="alert" className="text-xs text-destructive">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function SocialLinksManager({ links }: { links: SocialLinkView[] }) {
  const [state, action] = useActionState(addSocialLink, idleFormState);
  useSuccessToast(state);
  const atLimit = links.length >= MAX_SOCIAL_LINKS;

  return (
    <div className="flex flex-col gap-6">
      {links.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-lg border">
          {links.map((link) => (
            <li key={link.id} className="flex items-center gap-3 px-3 py-2">
              <Badge variant="secondary" className="shrink-0">
                {SOCIAL_PLATFORM_LABELS[link.platform]}
              </Badge>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
              >
                <span className="truncate">{link.url}</span>
                <ExternalLink aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
              <RemoveLinkButton link={link} />
            </li>
          ))}
        </ul>
      ) : null}

      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          You’ve added {MAX_SOCIAL_LINKS} links, the maximum. Remove one to add another.
        </p>
      ) : (
        <form action={action} noValidate>
          <FieldGroup>
            {state.status === "error" ? <FormMessage state={state} /> : null}
            <Field data-invalid={Boolean(state.status === "error" && state.fieldErrors?.url)}>
              <FieldLabel htmlFor="social-url">Add a social profile</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="social-url"
                  name="url"
                  inputMode="url"
                  placeholder="https://www.tiktok.com/@yourname"
                  required
                  defaultValue={valueFor(state, "url")}
                  aria-describedby="social-url-hint"
                  aria-invalid={Boolean(state.status === "error" && state.fieldErrors?.url)}
                />
                <SubmitButton variant="outline" size="lg" pendingLabel="Adding…">
                  <Plus data-icon="inline-start" />
                  Add link
                </SubmitButton>
              </div>
              <FieldDescription id="social-url-hint">
                We show these links as provided. We don’t verify that you own them yet.
              </FieldDescription>
              <FieldErrors state={state} field="url" />
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
