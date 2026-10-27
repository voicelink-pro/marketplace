"use client";

import { ArrowRight, ArrowUpRight, MailCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { FieldErrors, FormMessage } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState, type FormState } from "@/lib/forms";
import { HOME_AUDIENCE_PARAM, type HomeAudience, parseHomeAudience } from "@/modules/catalog/audience";
import { SegmentedToggle } from "@/modules/catalog/components/home-audience";
import { signUp } from "../actions";
import { SIGNUP_INTENTS } from "../intent";
import { safeRedirectPath } from "../redirect";
import { PASSWORD_MIN_LENGTH } from "../schemas";
import { AUTH_SUBMIT_CLASS, AuthCard } from "./auth-card";
import { PasswordChecklist, PasswordInput } from "./password-input";
import { SideCrossfade } from "./side-crossfade";

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

const INTENT_OPTIONS = (["creators", "apps"] as const).map((value) => ({
  value,
  label: SIGNUP_INTENTS[value].option,
}));

const MAIL_LINKS = [
  { label: "Open Gmail", href: "https://mail.google.com/mail/u/0/#inbox" },
  { label: "Open Outlook", href: "https://outlook.live.com/mail/0/inbox" },
];

type Values = { displayName: string; email: string; password: string };

/**
 * Sign-up card. The side ("Promote apps | List my app") lives in `?for=` and
 * sets the copy, the brand panel and where onboarding starts; an explicit
 * `?next=` (e.g. back to an app page) still wins.
 */
export function SignupForm({ footer }: { footer: React.ReactNode }) {
  const searchParams = useSearchParams();
  const intent = parseHomeAudience(searchParams.get(HOME_AUDIENCE_PARAM) ?? undefined) ?? "creators";
  const next = safeRedirectPath(searchParams.get("next"), "") || SIGNUP_INTENTS[intent].next;
  const [state, action] = useActionState(signUp, idleFormState);
  // Controlled, so the fields survive React's form reset and "Change it" brings them back filled in.
  const [values, setValues] = useState<Values>({ displayName: "", email: "", password: "" });
  // The success the visitor stepped back from; the next submit shows the inbox screen again.
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dismissed) emailRef.current?.focus();
  }, [dismissed]);

  function selectIntent(nextIntent: HomeAudience) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(HOME_AUDIENCE_PARAM, nextIntent);
    // Native history: useSearchParams (and the brand panel) update without a server round trip.
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  function update(field: keyof Values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  if (state.status === "success" && state !== dismissed) {
    return (
      <AuthCard title="Check your inbox">
        <div className="flex flex-col gap-5">
          <div role="status" className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary">
              <MailCheck aria-hidden className="size-5 text-primary-foreground" />
            </span>
            <p className="text-base text-pretty">
              We sent a confirmation link to <span className="font-semibold wrap-anywhere">{values.email.trim()}</span>.
              Open it to finish creating your account.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MAIL_LINKS.map((link) => (
              <Button key={link.href} asChild variant="outline" size="lg" className="h-11">
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ArrowUpRight data-icon="inline-end" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            ))}
          </div>
          <ol className="flex flex-col gap-2 rounded-xl bg-muted p-4 text-sm">
            <li className="flex gap-3">
              <span className="tabular font-bold">1</span>
              Open the link in the email to confirm your address.
            </li>
            <li className="flex gap-3">
              <span className="tabular font-bold">2</span>
              Choose how you’ll use your account: promote apps, list your own, or both.
            </li>
          </ol>
          <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
            <p>No email after a few minutes? Check your spam folder.</p>
            <p>
              Wrong email?{" "}
              <button
                type="button"
                onClick={() => setDismissed(state)}
                className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-primary-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Change it
              </button>
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      top={
        <SegmentedToggle
          value={intent}
          options={INTENT_OPTIONS}
          onSelect={selectIntent}
          label="I want to"
          layoutId="signup-intent"
          fullWidth
        />
      }
      // Two lines reserved for each, so the fields stay put when the side changes.
      title={<SideCrossfade side={intent} render={(side) => SIGNUP_INTENTS[side].title} className="min-h-[2lh]" />}
      description={
        <SideCrossfade side={intent} render={(side) => SIGNUP_INTENTS[side].subtitle} className="min-h-[2lh]" />
      }
      footer={footer}
    >
      <form action={action} noValidate>
        <input type="hidden" name="next" value={next} />
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
              value={values.displayName}
              onChange={update("displayName")}
              aria-invalid={invalid(state, "displayName")}
            />
            <FieldErrors state={state} field="displayName" />
          </Field>
          <Field data-invalid={invalid(state, "email")}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={update("email")}
              aria-invalid={invalid(state, "email")}
            />
            <FieldErrors state={state} field="email" />
          </Field>
          <Field data-invalid={invalid(state, "password")}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={values.password}
              onChange={update("password")}
              aria-describedby="password-hint"
              aria-invalid={invalid(state, "password")}
            />
            <PasswordChecklist id="password-hint" password={values.password} />
            <FieldErrors state={state} field="password" />
          </Field>
          <SubmitButton className={AUTH_SUBMIT_CLASS} pendingLabel="Creating account…">
            Create account
            <ArrowRight data-icon="inline-end" aria-hidden />
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
