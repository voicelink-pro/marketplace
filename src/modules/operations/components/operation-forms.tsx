'use client';
import { useActionState, useId } from 'react';
import { FieldErrors, FormMessage, valueFor } from '@/components/forms/form-feedback';
import { SubmitButton } from '@/components/forms/submit-button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { idleFormState } from '@/lib/forms';
import { createSupportTicket, markNotificationRead, replySupportTicket, retryOperationalEvent, reviewOperationalCommission } from '../actions';
const control = 'min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
export function NewSupportForm({ requestKey }: { requestKey: string }) {
  const [state, action] = useActionState(createSupportTicket, idleFormState); const id = useId();
  return <form action={action} noValidate>
    <input type="hidden" name="request_key" value={requestKey} />
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id + '-category'}>Topic</FieldLabel>
        <select id={id + '-category'} name="category" className={control} defaultValue={valueFor(state, 'category') ?? 'other'}>{['account', 'integration', 'funding', 'payout', 'other'].map(v => <option key={v} value={v}>{v}</option>)}</select>
      </Field>
      <Field data-invalid={state.status === 'error' && !!state.fieldErrors?.subject}>
        <FieldLabel htmlFor={id + '-subject'}>Subject</FieldLabel>
        <Input id={id + '-subject'} name="subject" required minLength={5} maxLength={160} defaultValue={valueFor(state, 'subject')} aria-invalid={state.status === 'error' && !!state.fieldErrors?.subject} />
        <FieldErrors state={state} field="subject" />
      </Field>
      <Field data-invalid={state.status === 'error' && !!state.fieldErrors?.body}>
        <FieldLabel htmlFor={id + '-body'}>Describe the problem</FieldLabel>
        <textarea id={id + '-body'} name="body" required minLength={5} maxLength={3000} rows={4} className={control} defaultValue={valueFor(state, 'body')} aria-describedby={id + '-hint'} aria-invalid={state.status === 'error' && !!state.fieldErrors?.body} />
        <FieldDescription id={id + '-hint'}>Include a screen, time and error code if available. Do not include passwords, API keys, payment details or identity documents.</FieldDescription>
        <FieldErrors state={state} field="body" />
      </Field>
      <SubmitButton disabled={state.status === 'success'}>Send support request</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
export function SupportReplyForm({ ticketId, revision, requestKey, admin = false, status }: { ticketId: string; revision: number; requestKey: string; admin?: boolean; status: string }) {
  const [state, action] = useActionState(replySupportTicket, idleFormState); const id = useId();
  return <form action={action}>
    <input type="hidden" name="ticket_id" value={ticketId} />
    <input type="hidden" name="revision" value={revision} />
    <input type="hidden" name="request_key" value={requestKey} />
    <FieldGroup>
      {admin ? <Field>
        <FieldLabel htmlFor={id + '-status'}>Ticket status</FieldLabel>
        <select id={id + '-status'} name="status" defaultValue={status} className={control}>{['open', 'in_progress', 'closed'].map(v => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}</select>
      </Field> : <input type="hidden" name="status" value="" />}
      <Field>
        <FieldLabel htmlFor={id}>Reply</FieldLabel>
        <textarea id={id} name="body" required minLength={5} maxLength={3000} rows={3} className={control} defaultValue={valueFor(state, 'body')} />
        <FieldErrors state={state} field="body" />
      </Field>
      <SubmitButton variant="outline" disabled={state.status === 'success'}>Save reply</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
export function MarkReadForm({ id }: { id: string }) {
  const [state, action] = useActionState(markNotificationRead, idleFormState);
  return <form action={action} className="space-y-2">
    <input type="hidden" name="id" value={id} />
    <SubmitButton variant="outline" size="sm">Mark as read</SubmitButton>
    <FormMessage state={state} />
  </form>;
}
export function RetryEventForm({ id }: { id: string }) {
  const [state, action] = useActionState(retryOperationalEvent, idleFormState); const inputId = useId();
  return <form action={action}>
    <input type="hidden" name="id" value={id} />
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={inputId}>Reason for retry</FieldLabel>
        <Input id={inputId} name="reason" required minLength={10} maxLength={500} />
        <FieldErrors state={state} field="reason" />
      </Field>
      <SubmitButton variant="outline" size="sm">Retry sandbox event</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
export function CommissionReviewForm({ id }: { id: string }) {
  const [state, action] = useActionState(reviewOperationalCommission, idleFormState); const inputId = useId();
  return <form action={action}>
    <input type="hidden" name="id" value={id} />
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={inputId + '-state'}>Review state</FieldLabel>
        <select id={inputId + '-state'} name="state" className={control}>
          <option value="in_review">In review</option>
          <option value="awaiting_policy">Awaiting policy decision</option>
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor={inputId}>Review note</FieldLabel>
        <Input id={inputId} name="note" required minLength={10} maxLength={1000} />
        <FieldErrors state={state} field="note" />
      </Field>
      <FieldDescription>This records the investigation. It cannot change a balance or decide who bears a refund after payout.</FieldDescription>
      <SubmitButton variant="outline" size="sm">Record review</SubmitButton>
      <FormMessage state={state} />
    </FieldGroup>
  </form>;
}
