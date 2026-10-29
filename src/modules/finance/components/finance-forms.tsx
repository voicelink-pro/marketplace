'use client';

import { useActionState, useId } from 'react';
import Link from 'next/link';
import { FieldErrors, FormMessage, valueFor } from '@/components/forms/form-feedback';
import { SubmitButton } from '@/components/forms/submit-button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { idleFormState } from '@/lib/forms';
import { formatMinorCurrency } from '@/lib/money';
import { completeFinanceOnboarding, requestFunding, requestPayout, retryBankPayout, reviewFinanceCase, saveAutoFunding, startFinanceOnboarding } from '../actions';

export function OnboardingButton({ kind, appId }: { kind: 'funding' | 'payout'; appId?: string }) {
  const [state, action] = useActionState(startFinanceOnboarding, idleFormState);
  return <form action={action} className="space-y-3">
    <input type="hidden" name="kind" value={kind} />
    <input type="hidden" name="app_id" value={appId ?? ''} />
    <SubmitButton variant="outline">{kind === 'funding' ? 'Set up sandbox payment method' : 'Set up sandbox payout account'}</SubmitButton>
    <FormMessage state={state} />
  </form>;
}
export function CompleteOnboardingForm({ session, kind }: { session: string; kind: 'funding' | 'payout' }) {
  const [state, action] = useActionState(completeFinanceOnboarding, idleFormState);
  const id = useId();
  return <form action={action}>
    <input type="hidden" name="session" value={session} />
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id} className="items-start">
          <input id={id} name="consent" type="checkbox" required className="mt-1 size-4 shrink-0 accent-primary" />{kind === 'funding' ? 'I authorize simulated deposits and automatic top-ups according to the settings I choose. This is sandbox consent only.' : 'Activate my simulated recipient account. I understand this does not verify a real bank account or identity.'}</FieldLabel>
        <FieldDescription>The test provider supports EUR, a minimum bank payout of €0.01 and a €0.00 fee. These are test-provider capabilities only.</FieldDescription>
      </Field>
      <SubmitButton disabled={state.status === 'success'}>Confirm sandbox setup</SubmitButton>
      <FormMessage state={state} />
      <Link href={kind === 'funding' ? '/company/funding' : '/creator/payouts'} className="text-sm underline">Return to {kind === 'funding' ? 'Funding' : 'Payouts'}</Link>
    </FieldGroup>
  </form>;
}
export function FundingForm({ appId, requestKey }: { appId: string; requestKey: string }) {
  const [state, action] = useActionState(requestFunding, idleFormState);
  const id = useId();
  return <form action={action} noValidate>
    <input type="hidden" name="app_id" value={appId} />
    <input type="hidden" name="request_key" value={requestKey} />
    <FieldGroup>
      <Field data-invalid={state.status === 'error' && !!state.fieldErrors?.amount}>
        <FieldLabel htmlFor={id}>Deposit amount (EUR)</FieldLabel>
        <Input id={id} name="amount" inputMode="decimal" required defaultValue={valueFor(state, 'amount')} placeholder="0.00" aria-describedby={id + '-help'} aria-invalid={state.status === 'error' && !!state.fieldErrors?.amount} />
        <FieldDescription id={id + '-help'}>Confirmation is asynchronous. Returning to this page does not add funds.</FieldDescription>
        <FieldErrors state={state} field="amount" />
      </Field>
      <SubmitButton disabled={state.status === 'success'}>Request sandbox deposit</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
function euroInput(minor: string) { const n = BigInt(minor); return `${n / 100n}.${(n % 100n).toString().padStart(2, '0')}`; }
export function AutoFundingForm({ appId, enabled, threshold, amount }: { appId: string; enabled: boolean; threshold: string; amount: string }) {
  const [state, action] = useActionState(saveAutoFunding, idleFormState);
  const id = useId();
  return <form action={action} noValidate>
    <input type="hidden" name="app_id" value={appId} />
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id + '-enabled'}>
          <input id={id + '-enabled'} type="checkbox" name="enabled" defaultChecked={enabled} className="size-4 accent-primary" />Enable automatic sandbox top-ups</FieldLabel>
      </Field>{(['threshold', 'amount'] as const).map(name => <Field key={name} data-invalid={state.status === 'error' && !!state.fieldErrors?.[name]}>
        <FieldLabel htmlFor={id + name}>{name === 'threshold' ? 'When available funding falls below (EUR)' : 'Top up by (EUR)'}</FieldLabel>
        <Input id={id + name} name={name} inputMode="decimal" defaultValue={valueFor(state, name) ?? euroInput(name === 'threshold' ? threshold : amount)} aria-invalid={state.status === 'error' && !!state.fieldErrors?.[name]} />
        <FieldErrors state={state} field={name} />
      </Field>)}<FieldDescription>A failed top-up pauses new referrals. A successful deposit pays outstanding commissions before the funding pause can be cleared.</FieldDescription>
      <SubmitButton>Save automatic top-up</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
/** `helper` replaces the default rule line, e.g. with the reason the form is disabled. */
export function WithdrawForm({ amount, fee, requestKey, enabled, helper }: { amount: string; fee: string; requestKey: string; enabled: boolean; helper?: React.ReactNode }) {
  const [state, action] = useActionState(requestPayout, idleFormState);
  const id = useId();
  const bank = formatMinorCurrency(BigInt(amount) > BigInt(fee) ? BigInt(amount) - BigInt(fee) : 0n, 'EUR');
  return <form action={action}>
    <input name="request_key" type="hidden" value={requestKey} />
    <input name="expected_minor" type="hidden" value={amount} />
    <input name="expected_fee" type="hidden" value={fee} />
    <FieldGroup className="gap-4">
      <Field data-disabled={!enabled || undefined}>
        <FieldLabel htmlFor={id} className="items-start text-sm font-normal leading-normal text-muted-foreground has-[:enabled]:text-foreground/90">
          <input id={id} name="confirm" type="checkbox" required disabled={!enabled} className="mt-0.5 size-[18px] shrink-0 rounded-[5px] accent-primary" />I want to withdraw {formatMinorCurrency(amount, 'EUR')}. {bank} goes to my bank after the {formatMinorCurrency(fee, 'EUR')} provider fee.</FieldLabel>
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FieldDescription className="text-[13px]">{helper ?? 'Only funded, reconciled earnings from closed months qualify. An unknown provider outcome keeps them reserved.'}</FieldDescription>
        <SubmitButton disabled={!enabled || state.status === 'success'} pendingLabel="Withdrawing…" className="h-11 shrink-0 px-5 font-bold">Withdraw {bank}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
export function RetryBankForm({ payoutId }: { payoutId: string }) {
  const [state, action] = useActionState(retryBankPayout, idleFormState);
  return <form action={action} className="space-y-2">
    <input type="hidden" name="payout_id" value={payoutId} />
    <SubmitButton variant="outline" size="sm">Retry bank payout</SubmitButton>
    <FormMessage state={state} />
  </form>;
}
export function ReviewCaseForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState(reviewFinanceCase, idleFormState);
  const id = useId();
  return <form action={action}>
    <input type="hidden" name="job_id" value={jobId} />
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>Review note</FieldLabel>
        <Input id={id} name="note" required minLength={10} maxLength={500} placeholder="Describe the provider evidence checked" />
        <FieldErrors state={state} field="note" />
      </Field>
      <SubmitButton size="sm" variant="outline">Reconcile provider evidence</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
